import { env } from '../config/env';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogData {
  level: LogLevel;
  message: string;
  stack?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private logLevel: LogLevel = 'info';
  private apiUrl: string;
  private logCount: number = 0;

  constructor() {
    this.apiUrl = env.API_BASE_URL;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private async sendLog(data: LogData) {
    this.logCount++;
    console.log(`Logger: Sending log #${this.logCount} - ${data.level}: ${data.message}`);
    try {
      await fetch(`${this.apiUrl}/api/logging/client-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  error(message: string, error?: Error) {
    if (!this.shouldLog('error')) return;
    console.error(message, error);
    this.sendLog({
      level: 'error',
      message,
      stack: error?.stack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }

  warn(message: string) {
    if (!this.shouldLog('warn')) return;
    console.warn(message);
    this.sendLog({
      level: 'warn',
      message,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }

  info(message: string) {
    if (!this.shouldLog('info')) return;
    console.info(message);
    this.sendLog({
      level: 'info',
      message,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }

  debug(message: string) {
    if (!this.shouldLog('debug')) return;
    console.debug(message);
    this.sendLog({
      level: 'debug',
      message,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }
}

const logger = new Logger();

export default logger;