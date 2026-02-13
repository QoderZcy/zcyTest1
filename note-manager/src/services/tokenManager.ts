import { JWTUtils } from '../utils/authUtils';
import { StorageManager } from '../utils/httpClient';
import AuthService from './authService';

/**
 * 令牌管理器
 * 负责JWT令牌的生命周期管理、自动刷新和存储策略
 */
export class TokenManager {
  private static instance: TokenManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<string> | null = null;
  
  // 配置选项
  private readonly config = {
    refreshThreshold: 300, // 令牌过期前5分钟开始刷新
    autoRefresh: true,
    maxRetries: 3,
    retryDelay: 1000,
  };

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * 初始化令牌管理器
   */
  init(): void {
    console.log('[TokenManager] 初始化令牌管理器');
    this.startTokenMonitoring();
  }

  /**
   * 销毁令牌管理器
   */
  destroy(): void {
    console.log('[TokenManager] 销毁令牌管理器');
    this.stopTokenMonitoring();
    this.refreshPromise = null;
  }

  /**
   * 获取当前有效的访问令牌
   */
  async getValidToken(): Promise<string | null> {
    const token = StorageManager.getToken();
    
    if (!token) {
      return null;
    }

    // 检查令牌是否即将过期
    if (JWTUtils.isTokenExpiringSoon(token, this.config.refreshThreshold)) {
      console.log('[TokenManager] 令牌即将过期，尝试刷新');
      
      try {
        const newToken = await this.refreshToken();
        return newToken;
      } catch (error) {
        console.error('[TokenManager] 令牌刷新失败:', error);
        return null;
      }
    }

    return token;
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(): Promise<string> {
    // 如果已经有正在进行的刷新请求，等待其完成
    if (this.refreshPromise) {
      console.log('[TokenManager] 等待正在进行的令牌刷新');
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 执行令牌刷新
   */
  private async performTokenRefresh(): Promise<string> {
    const refreshToken = StorageManager.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('没有可用的刷新令牌');
    }

    let lastError: Error | null = null;

    // 重试机制
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`[TokenManager] 尝试刷新令牌 (${attempt}/${this.config.maxRetries})`);
        
        const response = await AuthService.refreshToken(refreshToken);
        const newToken = response.token;
        
        // 更新存储的令牌
        const rememberMe = StorageManager.getRememberMe();
        StorageManager.setToken(newToken, rememberMe);
        
        console.log('[TokenManager] 令牌刷新成功');
        
        // 重新启动监控
        this.startTokenMonitoring();
        
        return newToken;
      } catch (error) {
        lastError = error as Error;
        console.error(`[TokenManager] 令牌刷新失败 (${attempt}/${this.config.maxRetries}):`, error);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    // 所有重试都失败了
    console.error('[TokenManager] 令牌刷新彻底失败，清除认证信息');
    this.clearTokens();
    throw lastError || new Error('令牌刷新失败');
  }

  /**
   * 设置新的令牌
   */
  setTokens(accessToken: string, refreshToken: string, rememberMe: boolean = false): void {
    StorageManager.setToken(accessToken, rememberMe);
    StorageManager.setRefreshToken(refreshToken);
    StorageManager.setRememberMe(rememberMe);
    
    console.log('[TokenManager] 令牌已更新');
    this.startTokenMonitoring();
  }

  /**
   * 清除所有令牌
   */
  clearTokens(): void {
    StorageManager.clearTokens();
    this.stopTokenMonitoring();
    console.log('[TokenManager] 所有令牌已清除');
  }

  /**
   * 检查是否有有效的认证令牌
   */
  hasValidTokens(): boolean {
    const token = StorageManager.getToken();
    const refreshToken = StorageManager.getRefreshToken();
    
    return !!(token && refreshToken && !JWTUtils.isTokenExpired(token));
  }

  /**
   * 获取令牌剩余有效时间（秒）
   */
  getTokenRemainingTime(): number {
    const token = StorageManager.getToken();
    if (!token) return 0;
    
    return JWTUtils.getTokenRemainingTime(token);
  }

  /**
   * 开始令牌监控
   */
  private startTokenMonitoring(): void {
    this.stopTokenMonitoring();
    
    if (!this.config.autoRefresh) {
      return;
    }

    const token = StorageManager.getToken();
    if (!token) {
      return;
    }

    const remainingTime = this.getTokenRemainingTime();
    const refreshTime = Math.max(0, remainingTime - this.config.refreshThreshold);
    
    if (refreshTime > 0) {
      console.log(`[TokenManager] 将在 ${refreshTime} 秒后自动刷新令牌`);
      
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(error => {
          console.error('[TokenManager] 自动刷新令牌失败:', error);
          // 可以触发用户重新登录的事件
          this.notifyTokenExpired();
        });
      }, refreshTime * 1000);
    } else {
      // 令牌已经过期或即将过期，立即刷新
      console.log('[TokenManager] 令牌已过期，立即刷新');
      this.refreshToken().catch(error => {
        console.error('[TokenManager] 立即刷新令牌失败:', error);
        this.notifyTokenExpired();
      });
    }
  }

  /**
   * 停止令牌监控
   */
  private stopTokenMonitoring(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 通知令牌过期事件
   */
  private notifyTokenExpired(): void {
    // 可以通过事件系统通知应用令牌已过期
    window.dispatchEvent(new CustomEvent('token-expired'));
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取配置信息
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
    console.log('[TokenManager] 配置已更新:', this.config);
    
    // 如果启用了自动刷新，重新启动监控
    if (this.config.autoRefresh) {
      this.startTokenMonitoring();
    } else {
      this.stopTokenMonitoring();
    }
  }
}

// 导出单例实例
export const tokenManager = TokenManager.getInstance();