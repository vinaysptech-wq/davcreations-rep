'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authApi } from '../../features/UserRole/apis';
import { useAuth } from '../../features/auth/hooks/useAuth';

export default function Login() {
  console.log('Login component rendering');
  console.log('authApi imported:', authApi);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    console.log('Login component mounted');
    console.log('Window object:', typeof window);
    console.log('Document readyState:', document.readyState);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authApi.login({ email, password });
      const data = response.data as { token: string, refreshToken?: string, user: { user_id: number; email: string; first_name: string; last_name: string; user_type_name: string } };
      console.log('Login: Setting token and user in localStorage', { hasToken: !!data.token, hasRefreshToken: !!data.refreshToken, hasUser: !!data.user });

      // Use the useAuth hook's login method
      login(data.token, data.user, data.refreshToken);

      // Redirect based on user role
      if (data.user.user_type_name === 'Superadmin' || data.user.user_type_name === 'Admin') {
        router.push('/admin');
      } else if (data.user.user_type_name === 'User') {
        router.push('/profile');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8 border border-gray-200">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image src="/assets/logos/Banner%20logo.jpg" alt="Dav Creations Logo" width={160} height={80} onError={() => console.log('Logo image failed to load')} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-lg text-gray-600">
              Sign in to Dav Creations
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 sm:text-base"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 sm:text-base"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200 shadow-md"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}