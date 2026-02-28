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
  private retryCount = 0;

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
            window.location.href = '/login';
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
    // 超时错误
    if (error.code === 'ECONNABORTED') {
      return new ApiError(AuthErrorType.NETWORK_ERROR, '请求超时，请检查网络连接');
    }

    // 网络连接错误
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return new ApiError(AuthErrorType.NETWORK_ERROR, '网络连接失败，请检查网络连接');
    }

    // DNS解析错误
    if (error.code === 'ENOTFOUND') {
      return new ApiError(AuthErrorType.NETWORK_ERROR, '无法连接到服务器，请检查网络设置');
    }

    // 连接被拒绝
    if (error.code === 'ECONNREFUSED') {
      return new ApiError(AuthErrorType.SERVER_ERROR, '服务器连接被拒绝，请稍后重试');
    }

    const { status, data } = error.response;
    const message = data?.message || '请求失败';
    const details = data?.details;

    switch (status) {
      case 400:
        if (data?.code === 'INVALID_CREDENTIALS') {
          return new ApiError(AuthErrorType.INVALID_CREDENTIALS, '邮箱或密码错误', status, details);
        }
        return new ApiError(AuthErrorType.VALIDATION_ERROR, message, status, details);
      case 401:
        if (data?.code === 'TOKEN_EXPIRED') {
          return new ApiError(AuthErrorType.TOKEN_EXPIRED, '登录已过期，请重新登录', status);
        }
        return new ApiError(AuthErrorType.TOKEN_INVALID, '认证失败，请重新登录', status);
      case 403:
        return new ApiError(AuthErrorType.ACCOUNT_LOCKED, '账户被锁定，请联系管理员', status);
      case 404:
        return new ApiError(AuthErrorType.USER_NOT_FOUND, '用户不存在', status);
      case 409:
        return new ApiError(AuthErrorType.EMAIL_ALREADY_EXISTS, '邮箱已被注册', status);
      case 422:
        return new ApiError(AuthErrorType.WEAK_PASSWORD, '密码强度不足', status, details);
      case 429:
        return new ApiError(AuthErrorType.SERVER_ERROR, '请求过于频繁，请稍后重试', status);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(AuthErrorType.SERVER_ERROR, '服务器内部错误，请稍后重试', status);
      default:
        return new ApiError(AuthErrorType.SERVER_ERROR, `未知错误 (${status}): ${message}`, status);
    }
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse<RefreshTokenResponse>> {
    return this.instance.post('/auth/refresh', { refreshToken });
  }

  // 公共请求方法
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.retryRequest(() => this.instance.get<T>(url, config));
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.retryRequest(() => this.instance.post<T>(url, data, config));
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.retryRequest(() => this.instance.put<T>(url, data, config));
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.retryRequest(() => this.instance.delete<T>(url, config));
  }

  /**
   * 重试请求机制
   */
  private async retryRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    
    while (attempt < API_CONFIG.retryAttempts) {
      try {
        return await requestFn();
      } catch (error: any) {
        attempt++;
        
        // 不需要重试的情况
        if (
          attempt >= API_CONFIG.retryAttempts ||
          error.response?.status < 500 ||
          error.response?.status === 401
        ) {
          throw error;
        }
        
        // 等待一定时间后重试
        await this.sleep(API_CONFIG.retryDelay * attempt);
        console.log(`[API Retry] Attempt ${attempt}/${API_CONFIG.retryAttempts}`);
      }
    }
    
    throw new Error('最大重试次数已达到');
  }

  /**
   * 等待指定时间
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查网络连接状态
   */
  public async checkNetworkStatus(): Promise<boolean> {
    try {
      await this.instance.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('[Network Check] 网络连接检查失败:', error);
      return false;
    }
  }
}

// 单例HTTP客户端
export const httpClient = new HttpClient();
export { StorageManager, ApiError };