import { AuthErrorType } from '../types/auth';

/**
 * 错误类型枚举
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * 应用错误接口
 */
export interface AppError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
  timestamp: Date;
  context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    action?: string;
  };
  stack?: string;
  retryable: boolean;
  handled: boolean;
}

/**
 * 错误恢复策略
 */
export interface ErrorRecoveryStrategy {
  type: 'retry' | 'redirect' | 'fallback' | 'manual';
  maxRetries?: number;
  retryDelay?: number;
  redirectUrl?: string;
  fallbackAction?: () => void;
  userAction?: {
    label: string;
    action: () => void;
  };
}

/**
 * 增强的错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private listeners: Map<string, (error: AppError) => void> = new Map();
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();

  private constructor() {
    this.setupDefaultStrategies();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误
   */
  handleError(error: any, context?: Partial<AppError['context']>): AppError {
    const appError = this.normalizeError(error, context);
    
    // 记录错误
    this.logError(appError);
    
    // 添加到错误队列
    this.errorQueue.push(appError);
    
    // 通知监听器
    this.notifyListeners(appError);
    
    // 尝试自动恢复
    this.attemptRecovery(appError);
    
    return appError;
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: any, context?: Partial<AppError['context']>): AppError {
    const errorId = this.generateErrorId();
    const timestamp = new Date();
    
    // 基础错误信息
    let category = ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let message = '未知错误';
    let userMessage = '发生了错误，请稍后重试';
    let retryable = false;
    let details: Record<string, any> = {};

    // 根据错误类型进行分类
    if (error?.type) {
      switch (error.type) {
        case AuthErrorType.NETWORK_ERROR:
          category = ErrorCategory.NETWORK;
          severity = ErrorSeverity.HIGH;
          message = error.message || '网络连接失败';
          userMessage = '网络连接失败，请检查网络连接后重试';
          retryable = true;
          break;
          
        case AuthErrorType.TOKEN_EXPIRED:
        case AuthErrorType.TOKEN_INVALID:
          category = ErrorCategory.AUTHENTICATION;
          severity = ErrorSeverity.HIGH;
          message = error.message || '认证失败';
          userMessage = '登录已过期，请重新登录';
          retryable = false;
          break;
          
        case AuthErrorType.INVALID_CREDENTIALS:
          category = ErrorCategory.AUTHENTICATION;
          severity = ErrorSeverity.MEDIUM;
          message = error.message || '用户名或密码错误';
          userMessage = '用户名或密码错误，请检查后重试';
          retryable = false;
          break;
          
        case AuthErrorType.VALIDATION_ERROR:
          category = ErrorCategory.VALIDATION;
          severity = ErrorSeverity.LOW;
          message = error.message || '输入验证失败';
          userMessage = error.message || '输入信息有误，请检查后重试';
          retryable = false;
          details = error.details || {};
          break;
          
        case AuthErrorType.SERVER_ERROR:
          category = ErrorCategory.SYSTEM;
          severity = ErrorSeverity.CRITICAL;
          message = error.message || '服务器内部错误';
          userMessage = '服务器出现问题，请稍后重试';
          retryable = true;
          break;
      }
    } else if (error?.response) {
      // HTTP错误
      const status = error.response.status;
      category = this.categorizeHttpError(status);
      severity = this.getHttpErrorSeverity(status);
      message = error.response.data?.message || error.message || `HTTP ${status} 错误`;
      userMessage = this.getHttpErrorUserMessage(status);
      retryable = this.isHttpErrorRetryable(status);
      details = error.response.data?.details || {};
    } else if (error instanceof Error) {
      // JavaScript错误
      category = ErrorCategory.SYSTEM;
      severity = ErrorSeverity.HIGH;
      message = error.message;
      userMessage = '系统出现问题，请刷新页面重试';
      retryable = false;
    }

    return {
      id: errorId,
      category,
      severity,
      message,
      userMessage,
      details,
      timestamp,
      context: {
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      stack: error?.stack,
      retryable,
      handled: false
    };
  }

  /**
   * HTTP错误分类
   */
  private categorizeHttpError(status: number): ErrorCategory {
    if (status >= 400 && status < 500) {
      if (status === 401) return ErrorCategory.AUTHENTICATION;
      if (status === 403) return ErrorCategory.AUTHORIZATION;
      if (status === 422) return ErrorCategory.VALIDATION;
      return ErrorCategory.BUSINESS_LOGIC;
    }
    if (status >= 500) return ErrorCategory.SYSTEM;
    return ErrorCategory.UNKNOWN;
  }

  /**
   * 获取HTTP错误严重级别
   */
  private getHttpErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status === 401 || status === 403) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * 获取HTTP错误用户消息
   */
  private getHttpErrorUserMessage(status: number): string {
    const messages: Record<number, string> = {
      400: '请求参数有误，请检查输入信息',
      401: '登录已过期，请重新登录',
      403: '没有权限访问该资源',
      404: '请求的资源不存在',
      409: '操作冲突，请刷新页面后重试',
      422: '输入信息不符合要求',
      429: '请求过于频繁，请稍后重试',
      500: '服务器内部错误，请稍后重试',
      502: '服务暂时不可用，请稍后重试',
      503: '服务暂时不可用，请稍后重试',
      504: '服务响应超时，请稍后重试'
    };
    
    return messages[status] || '请求失败，请稍后重试';
  }

  /**
   * 判断HTTP错误是否可重试
   */
  private isHttpErrorRetryable(status: number): boolean {
    // 5xx错误通常可以重试
    if (status >= 500) return true;
    // 429 (Too Many Requests) 可以重试
    if (status === 429) return true;
    // 408 (Request Timeout) 可以重试
    if (status === 408) return true;
    // 其他4xx错误通常不可重试
    return false;
  }

  /**
   * 记录错误
   */
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.category}] ${error.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, error);
        break;
      case 'warn':
        console.warn(logMessage, error);
        break;
      case 'info':
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }

    // 在生产环境中，可以发送到错误监控服务
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  /**
   * 发送到监控服务
   */
  private sendToMonitoring(error: AppError): void {
    // 这里可以集成第三方错误监控服务
    // 如 Sentry、LogRocket、Rollbar 等
    console.log('Sending error to monitoring service:', error.id);
  }

  /**
   * 通知监听器
   */
  private notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * 尝试自动恢复
   */
  private attemptRecovery(error: AppError): void {
    const strategy = this.recoveryStrategies.get(error.category);
    if (!strategy) return;

    switch (strategy.type) {
      case 'retry':
        if (error.retryable) {
          this.scheduleRetry(error, strategy);
        }
        break;
        
      case 'redirect':
        if (strategy.redirectUrl) {
          window.location.href = strategy.redirectUrl;
        }
        break;
        
      case 'fallback':
        if (strategy.fallbackAction) {
          strategy.fallbackAction();
        }
        break;
    }
  }

  /**
   * 安排重试
   */
  private scheduleRetry(error: AppError, strategy: ErrorRecoveryStrategy): void {
    const delay = strategy.retryDelay || 1000;
    setTimeout(() => {
      console.log(`Retrying after error: ${error.id}`);
      // 这里需要根据具体情况实现重试逻辑
    }, delay);
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultStrategies(): void {
    this.recoveryStrategies.set(ErrorCategory.NETWORK, {
      type: 'retry',
      maxRetries: 3,
      retryDelay: 1000
    });

    this.recoveryStrategies.set(ErrorCategory.AUTHENTICATION, {
      type: 'redirect',
      redirectUrl: '/login'
    });

    this.recoveryStrategies.set(ErrorCategory.SYSTEM, {
      type: 'retry',
      maxRetries: 2,
      retryDelay: 2000
    });
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    // 处理未捕获的Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, { action: 'unhandledrejection' });
      event.preventDefault();
    });

    // 处理未捕获的JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error, { action: 'javascript_error' });
    });
  }

  /**
   * 工具方法
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // 从认证上下文获取用户ID
    return undefined; // 实际实现中需要获取当前用户ID
  }

  private getSessionId(): string {
    return sessionStorage.getItem('session_id') || 'unknown';
  }

  /**
   * 公共API
   */
  public addErrorListener(id: string, listener: (error: AppError) => void): void {
    this.listeners.set(id, listener);
  }

  public removeErrorListener(id: string): void {
    this.listeners.delete(id);
  }

  public setRecoveryStrategy(category: ErrorCategory, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(category, strategy);
  }

  public getRecentErrors(limit: number = 10): AppError[] {
    return this.errorQueue.slice(-limit);
  }

  public clearErrorQueue(): void {
    this.errorQueue = [];
  }

  public markErrorAsHandled(errorId: string): void {
    const error = this.errorQueue.find(e => e.id === errorId);
    if (error) {
      error.handled = true;
    }
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();