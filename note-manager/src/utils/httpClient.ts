import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  RefreshTokenResponse, 
  LoginCredentials, 
  RegisterCredentials,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthError,
  AuthErrorType 
} from '../types/auth';
import { errorHandler } from '../services/errorHandler';

// API配置
const API_CONFIG = {
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// 存储工具类
class StorageManager {
  static getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  static setToken(token: string, remember: boolean = false): void {
    if (remember) {
      localStorage.setItem('auth_token', token);
      sessionStorage.removeItem('auth_token');
    } else {
      sessionStorage.setItem('auth_token', token);
      localStorage.removeItem('auth_token');
    }
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  static clearTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
  }

  static getRememberMe(): boolean {
    return localStorage.getItem('remember_me') === 'true';
  }

  static setRememberMe(remember: boolean): void {
    localStorage.setItem('remember_me', remember.toString());
  }
}

// API错误处理类
class ApiError extends Error {
  public type: AuthErrorType;
  public details?: Record<string, any>;
  public status?: number;

  constructor(type: AuthErrorType, message: string, status?: number, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.details = details;
  }
}

// HTTP客户端类
class HttpClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = StorageManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 添加请求ID用于日志追踪
        config.metadata = {
          requestId: Math.random().toString(36).substr(2, 9),
          startTime: Date.now(),
        };
        
        console.log(`[API Request] ${config.metadata.requestId} ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        const { metadata } = response.config;
        if (metadata) {
          const duration = Date.now() - metadata.startTime;
          console.log(`[API Response] ${metadata.requestId} ${response.status} ${duration}ms`);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // 处理401错误（令牌过期）
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // 如果正在刷新令牌，将请求加入队列
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.instance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = StorageManager.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { token } = response.data;
              
              const rememberMe = StorageManager.getRememberMe();
              StorageManager.setToken(token, rememberMe);
              
              // 处理队列中的请求
              this.processQueue(null);
              
              // 重试原始请求
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // 刷新令牌失败，清除所有令牌并重定向到登录
            this.processQueue(refreshError);
            StorageManager.clearTokens();
            
            // 通知应用令牌过期
            window.dispatchEvent(new CustomEvent('token-expired'));
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private processQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    
    this.failedQueue = [];
  }

  private handleApiError(error: any): ApiError {
    // 使用全局错误处理器
    const appError = errorHandler.handleError(error, { action: 'api_request' });
    
    if (error.code === 'ECONNABORTED') {
      return new ApiError(AuthErrorType.NETWORK_ERROR, '请求超时，请检查网络连接');
    }

    if (!error.response) {
      return new ApiError(AuthErrorType.NETWORK_ERROR, '网络连接失败，请检查网络连接');
    }

    const { status, data } = error.response;
    const message = data?.message || '请求失败';
    const details = data?.details;

    switch (status) {
      case 400:
        return new ApiError(AuthErrorType.VALIDATION_ERROR, message, status, details);
      case 401:
        return new ApiError(AuthErrorType.TOKEN_INVALID, '认证失败，请重新登录', status);
      case 403:
        return new ApiError(AuthErrorType.ACCOUNT_LOCKED, '账户被锁定，请联系管理员', status);
      case 404:
        return new ApiError(AuthErrorType.USER_NOT_FOUND, '用户不存在', status);
      case 409:
        return new ApiError(AuthErrorType.EMAIL_ALREADY_EXISTS, '邮箱已被注册', status);
      case 422:
        return new ApiError(AuthErrorType.WEAK_PASSWORD, '密码强度不足', status, details);
      case 500:
      default:
        return new ApiError(AuthErrorType.SERVER_ERROR, '服务器内部错误', status);
    }
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse<RefreshTokenResponse>> {
    return this.instance.post('/auth/refresh', { refreshToken });
  }

  // 公共请求方法
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

// 单例HTTP客户端
export const httpClient = new HttpClient();
export { StorageManager, ApiError };