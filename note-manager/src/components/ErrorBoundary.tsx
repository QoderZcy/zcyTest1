import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { errorHandler, ErrorCategory, ErrorSeverity } from '../services/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
}

/**
 * React错误边界组件
 * 捕获组件树中的JavaScript错误并显示备用UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] 捕获到组件错误:', error, errorInfo);
    
    // 使用全局错误处理器处理错误
    const appError = errorHandler.handleError(error, {
      action: 'component_error',
      component: errorInfo.componentStack,
    });
    
    this.setState({
      errorId: appError.id,
      errorInfo,
    });
    
    // 调用外部错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 在生产环境中记录到外部服务
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // 这里可以集成外部错误监控服务
    console.log('Reporting error to external service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`[ErrorBoundary] 重试 ${this.retryCount}/${this.maxRetries}`);
      
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
        errorInfo: null,
      });
    } else {
      console.warn('[ErrorBoundary] 已达到最大重试次数');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = {
      message: error?.message || '未知错误',
      stack: error?.stack || '',
      componentStack: errorInfo?.componentStack || '',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    
    const mailto = `mailto:support@example.com?subject=错误报告&body=${encodeURIComponent(
      `错误详情：\n${JSON.stringify(errorDetails, null, 2)}`
    )}`;
    
    window.open(mailto);
  };

  private getErrorLevelClass(): string {
    switch (this.props.level) {
      case 'page':
        return 'error-boundary-page';
      case 'section':
        return 'error-boundary-section';
      case 'component':
        return 'error-boundary-component';
      default:
        return 'error-boundary-default';
    }
  }

  private renderErrorUI() {
    const { error, errorId } = this.state;
    const { level = 'component' } = this.props;
    const canRetry = this.retryCount < this.maxRetries;
    const isPageLevel = level === 'page';

    return (
      <div className={`error-boundary ${this.getErrorLevelClass()}`}>
        <div className="error-content">
          <div className="error-icon">
            <AlertTriangle size={isPageLevel ? 64 : 48} color="#ef4444" />
          </div>
          
          <div className="error-message">
            <h2 className="error-title">
              {isPageLevel ? '页面出现错误' : '组件出现错误'}
            </h2>
            
            <p className="error-description">
              {isPageLevel 
                ? '很抱歉，页面遇到了一些问题。我们已经记录了这个错误，并会尽快修复。'
                : '这个部分暂时无法显示，但不会影响其他功能的使用。'
              }
            </p>
            
            {error && (
              <details className="error-details">
                <summary>错误详情</summary>
                <div className="error-technical">
                  <p><strong>错误消息:</strong> {error.message}</p>
                  {errorId && <p><strong>错误ID:</strong> {errorId}</p>}
                  {process.env.NODE_ENV === 'development' && error.stack && (
                    <pre className="error-stack">{error.stack}</pre>
                  )}
                </div>
              </details>
            )}
          </div>
          
          <div className="error-actions">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="btn btn-primary error-action-btn"
              >
                <RefreshCw size={16} />
                重试 ({this.maxRetries - this.retryCount} 次剩余)
              </button>
            )}
            
            {isPageLevel && (
              <>
                <button
                  onClick={this.handleReload}
                  className="btn btn-secondary error-action-btn"
                >
                  <RefreshCw size={16} />
                  刷新页面
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="btn btn-secondary error-action-btn"
                >
                  <Home size={16} />
                  返回首页
                </button>
              </>
            )}
            
            <button
              onClick={this.handleReportBug}
              className="btn btn-outline error-action-btn"
            >
              <Mail size={16} />
              报告问题
            </button>
          </div>
          
          {isPageLevel && (
            <div className="error-help">
              <p className="help-text">
                如果问题持续存在，请尝试：
              </p>
              <ul className="help-list">
                <li>清除浏览器缓存和Cookie</li>
                <li>检查网络连接</li>
                <li>使用其他浏览器</li>
                <li>联系技术支持</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // 否则渲染默认错误UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: 'page' | 'section' | 'component' = 'component'
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary level={level}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook：在函数组件中处理错误
 */
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: any) => {
    console.error('[useErrorHandler] 处理错误:', error);
    
    const appError = errorHandler.handleError(error, {
      action: 'hook_error',
      ...context,
    });
    
    return appError;
  }, []);
  
  const reportError = React.useCallback((error: Error, userMessage?: string) => {
    const appError = handleError(error);
    
    // 显示用户友好的错误消息
    if (userMessage || appError.userMessage) {
      // 这里可以集成toast通知系统
      console.warn('[用户错误]', userMessage || appError.userMessage);
    }
    
    return appError;
  }, [handleError]);
  
  return {
    handleError,
    reportError,
  };
}

export default ErrorBoundary;