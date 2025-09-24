import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// HTTP客户端配置
interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  apiKey?: string;
  retries?: number;
}

// 错误响应接口
interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

// HTTP客户端类
export class HttpClient {
  private client: AxiosInstance;
  private retries: number;

  constructor(config: HttpClientConfig) {
    this.retries = config.retries || 3;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[HTTP] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[HTTP] Response ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  // 错误处理
  private handleError(error: AxiosError): Promise<never> {
    const errorResponse: ErrorResponse = {
      code: 'NETWORK_ERROR',
      message: '网络请求失败'
    };

    if (error.response) {
      // 服务器响应错误
      errorResponse.code = `HTTP_${error.response.status}`;
      errorResponse.message = this.getErrorMessage(error.response.status);
      errorResponse.details = error.response.data;
    } else if (error.request) {
      // 请求发送失败
      errorResponse.code = 'REQUEST_FAILED';
      errorResponse.message = '请求发送失败，请检查网络连接';
    } else {
      // 其他错误
      errorResponse.message = error.message || '未知错误';
    }

    console.error('[HTTP] Error:', errorResponse);
    return Promise.reject(errorResponse);
  }

  // 获取错误消息
  private getErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return '请求参数错误';
      case 401:
        return 'API密钥无效';
      case 403:
        return '访问被拒绝';
      case 404:
        return '请求的资源不存在';
      case 429:
        return 'API调用频率超限';
      case 500:
        return '服务器内部错误';
      case 502:
        return '服务器网关错误';
      case 503:
        return '服务暂时不可用';
      default:
        return `HTTP错误 ${status}`;
    }
  }

  // GET请求
  async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // POST请求
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PUT请求
  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.client.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // DELETE请求
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.client.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // 带重试的请求
  async requestWithRetry<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    params?: any
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i <= this.retries; i++) {
      try {
        switch (method) {
          case 'get':
            return await this.get<T>(url, params);
          case 'post':
            return await this.post<T>(url, data);
          case 'put':
            return await this.put<T>(url, data);
          case 'delete':
            return await this.delete<T>(url);
        }
      } catch (error) {
        lastError = error;
        
        if (i < this.retries) {
          const delay = Math.pow(2, i) * 1000; // 指数退避
          console.log(`[HTTP] Retry ${i + 1}/${this.retries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

// 创建HTTP客户端实例
export const createHttpClient = (config: HttpClientConfig): HttpClient => {
  return new HttpClient(config);
};