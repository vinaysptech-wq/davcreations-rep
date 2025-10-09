import { env } from '../../../config/env';
import logger from '../../../utils/logger';
import { handleApiError } from '../../../utils/errorHandler';

const API_BASE_URL = env.API_BASE_URL;

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export class ApiClient {
  private baseURL: string;
  private interceptors: {
    request: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
    response: Array<(response: Response, data?: unknown) => unknown | Promise<unknown>>;
    error: Array<(error: ApiError) => ApiError | Promise<ApiError>>;
  } = {
    request: [],
    response: [],
    error: [],
  };
  private isRefreshing = false;
  private refreshPromise: Promise<unknown> | null = null;
  private requestQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
    config: RequestConfig;
  }> = [];

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Interceptor methods
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>) {
    this.interceptors.request.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response, data?: unknown) => unknown | Promise<unknown>) {
    this.interceptors.response.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>) {
    this.interceptors.error.push(interceptor);
  }

  private async refreshToken(): Promise<void> {
    if (this.isRefreshing) {
      // If refresh is already in progress, wait for it
      if (this.refreshPromise) {
        await this.refreshPromise;
      }
      return;
    }

    this.isRefreshing = true;
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (!refreshToken) {
      this.isRefreshing = false;
      throw new Error('No refresh token available');
    }

    try {
      this.refreshPromise = authApi.refresh({ refreshToken });
      const response = await this.refreshPromise as ApiResponse<{ token: string; refreshToken?: string }>;

      // Update stored tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      }

      logger.info('Token refresh successful');
    } catch (error) {
      logger.error('Token refresh failed:', error as Error);
      // Clear tokens on refresh failure
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private processQueue(error: unknown | null, token: string | null = null): void {
    this.requestQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        // Retry the request with new token
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`,
          };
        }
        // For simplicity, we'll resolve with the config and let the caller retry
        resolve(config);
      }
    });
    this.requestQueue = [];
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  private async applyResponseInterceptors(response: Response, data?: unknown): Promise<unknown> {
    let processedData = data;
    for (const interceptor of this.interceptors.response) {
      processedData = await interceptor(response, processedData);
    }
    return processedData;
  }

  private async applyErrorInterceptors(error: ApiError): Promise<ApiError> {
    let processedError = error;
    for (const interceptor of this.interceptors.error) {
      processedError = await interceptor(processedError);
    }
    return processedError;
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') {
      return {};
    }
    const token = localStorage.getItem('token');
    if (token) {
      logger.debug(`ApiClient: Auth token present in localStorage (length: ${token.length})`);
      logger.debug(`ApiClient: Token starts with: ${token.substring(0, 20)}...`);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        logger.debug(`ApiClient: Token exp: ${payload.exp}, current time: ${Math.floor(Date.now() / 1000)}`);
      } catch {
        logger.debug('ApiClient: Failed to decode token in headers');
      }
      return { 'Authorization': `Bearer ${token}` };
    } else {
      logger.warn('ApiClient: No auth token found in localStorage');
      return {};
    }
  }

  private async makeRequest<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseURL}${endpoint}`;

    // Check if token needs refresh before making request
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && this.isTokenExpired(token)) {
      logger.debug('Token expired, attempting refresh before request');
      try {
        await this.refreshToken();
      } catch (refreshError) {
        logger.error('Token refresh failed before request, proceeding with expired token');
      }
    }

    // Apply request interceptors
    const processedConfig = await this.applyRequestInterceptors({
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config.headers,
      },
    });

    logger.info(`API Request: ${processedConfig.method || 'GET'} ${endpoint}`);

    try {
      const response = await fetch(fullUrl, processedConfig);

      logger.info(`API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // Handle 403 errors by attempting token refresh
        if (response.status === 403) {
          logger.warn('Received 403, attempting token refresh');
          try {
            await this.refreshToken();
            // Retry the request with new token
            const newToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const retryConfig = {
              ...processedConfig,
              headers: {
                ...processedConfig.headers,
                'Authorization': newToken ? `Bearer ${newToken}` : '',
              },
            };
            const retryResponse = await fetch(fullUrl, retryConfig);
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              const processedData = await this.applyResponseInterceptors(retryResponse, data);
              const apiResponse: ApiResponse<T> = {
                data: processedData as T,
                status: retryResponse.status,
              };
              logger.debug(`API Success after retry for ${endpoint}`);
              return apiResponse;
            }
          } catch (refreshError) {
            logger.error('Token refresh failed on 403, proceeding with error');
          }
        }

        const errorText = await response.text();
        let errorData: unknown;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = errorText;
        }

        const apiError: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: response.status.toString(),
          details: errorData,
        };

        logger.error(`API Error Response: ${response.status} ${response.statusText} for ${endpoint}`);

        // Apply error interceptors
        const processedError = await this.applyErrorInterceptors(apiError);
        throw processedError;
      }

      const data = await response.json();

      // Apply response interceptors
      const processedData = await this.applyResponseInterceptors(response, data);

      const apiResponse: ApiResponse<T> = {
        data: processedData as T,
        status: response.status,
      };

      logger.debug(`API Success for ${endpoint}`);

      return apiResponse;
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        // Already processed API error
        throw error;
      }

      // Network or other error
      const networkError: ApiError = {
        message: error instanceof Error ? error.message : 'Network request failed',
        status: 0,
        code: 'NETWORK_ERROR',
        details: error,
      };

      logger.error(`API Network Error for ${endpoint}: ${networkError.message}`);

      // Apply error interceptors
      const processedError = await this.applyErrorInterceptors(networkError);
      throw processedError;
    }
  }

  async get<T = unknown>(endpoint: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

interface RequestConfig extends RequestInit {
  headers?: Record<string, string>;
}

// Create default instance
export const apiClient = new ApiClient();

// Add default interceptors
apiClient.addRequestInterceptor((config) => {
  // Add timestamp to requests for debugging
  config.headers = {
    ...config.headers,
    'X-Request-Time': new Date().toISOString(),
  };
  return config;
});

apiClient.addResponseInterceptor((response, data) => {
  // Log successful responses in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${response.url} - ${response.status}`);
  }
  return data;
});

apiClient.addErrorInterceptor((error) => {
  // Handle authentication errors globally (only for non-403 cases that weren't handled by refresh)
  if (error.status === 401 || (error.status === 403 && !error.message.includes('Invalid or expired token'))) {
    handleApiError(error, false); // Don't show toast for auth errors, handle redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  } else {
    // Show user-friendly error messages for other errors
    handleApiError(error, true);
  }

  return error;
});

// API Modules
export const usersApi = {
  getUsers: () => apiClient.get('/api/users'),
  getUser: (id: string) => apiClient.get(`/api/users/${id}`),
  createUser: (userData: unknown) => apiClient.post('/api/users', userData),
  updateUser: (id: string, userData: unknown) => apiClient.put(`/api/users/${id}`, userData),
  deleteUser: (id: string) => apiClient.delete(`/api/users/${id}`),
  getUserTypes: () => apiClient.get('/api/users/user-types'),
  getModules: () => apiClient.get('/api/users/modules'),
  getUserModules: (id: string) => apiClient.get(`/api/users/${id}/modules`),
  updateUserModules: (id: string, modules: unknown) => apiClient.put(`/api/users/${id}/modules`, modules),
};

export const userTypesApi = {
  getUserTypes: () => apiClient.get('/api/userTypes'),
  getUserType: (id: string) => apiClient.get(`/api/userTypes/${id}`),
  createUserType: (userTypeData: unknown) => apiClient.post('/api/userTypes', userTypeData),
  updateUserType: (id: string, userTypeData: unknown) => apiClient.put(`/api/userTypes/${id}`, userTypeData),
  deleteUserType: (id: string) => apiClient.delete(`/api/userTypes/${id}`),
};

export const adminModulesApi = {
  getAdminModules: () => apiClient.get('/api/admin-modules'),
  getAdminModule: (id: string) => apiClient.get(`/api/admin-modules/${id}`),
  createAdminModule: (moduleData: unknown) => apiClient.post('/api/admin-modules', moduleData),
  updateAdminModule: (id: string, moduleData: unknown) => apiClient.put(`/api/admin-modules/${id}`, moduleData),
  deleteAdminModule: (id: string) => apiClient.delete(`/api/admin-modules/${id}`),
};

export const loggingApi = {
  getLogLevel: () => apiClient.get('/api/logging/level'),
  setLogLevel: (level: string) => apiClient.put('/api/logging/level', { level }),
  getLogs: (params?: { page?: number; limit?: number; level?: string; userId?: number; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.level) query.append('level', params.level);
    if (params?.userId) query.append('userId', params.userId.toString());
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const queryString = query.toString();
    return apiClient.get(`/api/logging/logs${queryString ? `?${queryString}` : ''}`);
  },
};

export const settingsApi = {
  getSettings: () => apiClient.get('/api/logging/settings'),
  getSetting: (key: string) => apiClient.get(`/api/logging/settings/${key}`),
  createSetting: (setting: { setting_key: string; setting_value: string }) => apiClient.post('/api/logging/settings', setting),
  updateSetting: (key: string, value: string) => apiClient.put(`/api/logging/settings/${key}`, { setting_value: value }),
  deleteSetting: (key: string) => apiClient.delete(`/api/logging/settings/${key}`),
};

export const authApi = {
  login: (credentials: unknown) => apiClient.post('/api/auth/login', credentials),
  register: (userData: unknown) => apiClient.post('/api/auth/register', userData),
  logout: () => apiClient.post('/api/auth/logout', undefined, { credentials: 'include' }),
  refresh: (data: { refreshToken: string }) => apiClient.post('/api/auth/refresh', data),
};

export const profileApi = {
  getProfile: () => apiClient.get('/api/users/profile'),
  updateProfile: (profileData: unknown) => apiClient.put('/api/users/profile', profileData),
  updatePassword: (passwordData: { old_password: string; new_password: string; confirm_password: string }) => apiClient.put('/api/users/profile/password', passwordData),
  uploadImage: (formData: FormData) => apiClient.post('/api/users/profile/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const preferencesApi = {
  getPreferences: () => apiClient.get('/api/users/preferences'),
  updatePreferences: (preferencesData: { theme?: string; language?: string; email_notifications?: boolean; push_notifications?: boolean }) => apiClient.put('/api/users/preferences', preferencesData),
};

export const supportApi = {
  getTickets: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return apiClient.get(`/api/support/tickets${queryString ? `?${queryString}` : ''}`);
  },
  getTicket: (id: string) => apiClient.get(`/api/support/tickets/${id}`),
  createTicket: (ticketData: { subject: string; description: string; priority?: string }) => apiClient.post('/api/support/tickets', ticketData),
  updateTicket: (id: string, ticketData: { subject?: string; description?: string; priority?: string; status?: string }) => apiClient.put(`/api/support/tickets/${id}`, ticketData),
};