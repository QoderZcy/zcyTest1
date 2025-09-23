import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  RefreshTokenResponse,
  User,
  AuthConfig,
  StorageType
} from '../types/auth';
import { httpClient, StorageManager } from '../utils/httpClient';
import { JWTUtils } from '../utils/authUtils';

// 认证服务配置
const AUTH_CONFIG: AuthConfig = {
  tokenStorageType: StorageType.SESSION,
  refreshTokenStorageType: StorageType.LOCAL,
  autoRefresh: true,
  refreshThreshold: 300, // 5分钟
  maxRetries: 3,
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  rememberMeDuration: 30, // 30天
};

// 认证API服务类
export class AuthService {
  /**
   * 获取认证配置
   */
  static getConfig(): AuthConfig {
    return AUTH_CONFIG;
  }

  /**
   * 检查服务状态
   */
  static async checkHealth(): Promise<{ status: string; timestamp: Date }> {
    try {
      const response = await httpClient.get<{ status: string; timestamp: string }>('/auth/health');
      return {
        status: response.data.status,
        timestamp: new Date(response.data.timestamp)
      };
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
  /**
   * 用户登录
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // 记录登录尝试
      console.log('[AuthService] 尝试登录:', { email: credentials.email, rememberMe: credentials.rememberMe });
      
      const response = await httpClient.post<AuthResponse>('/auth/login', {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        rememberMe: credentials.rememberMe
      });
      
      // 验证响应数据
      if (!response.data.token || !response.data.user) {
        throw new Error('登录响应数据不完整');
      }
      
      // 验证JWT令牌格式
      if (!JWTUtils.isValidTokenFormat(response.data.token)) {
        throw new Error('无效的令牌格式');
      }
      
      console.log('[AuthService] 登录成功:', { userId: response.data.user.id });
      return response.data;
    } catch (error) {
      console.error('[AuthService] 登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户注册
   */
  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<AuthResponse>('/auth/register', credentials);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      console.log('[AuthService] 尝试登出');
      
      // 发送登出请求到服务器
      await httpClient.post('/auth/logout');
      
      console.log('[AuthService] 服务器登出成功');
    } catch (error) {
      console.error('[AuthService] 服务器登出失败:', error);
      // 即使服务端登出失败，客户端也要清除本地状态
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      console.log('[AuthService] 尝试刷新令牌');
      
      if (!refreshToken) {
        throw new Error('无效的刷新令牌');
      }
      
      const response = await httpClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      });
      
      // 验证新令牌格式
      if (!response.data.token || !JWTUtils.isValidTokenFormat(response.data.token)) {
        throw new Error('刷新后的令牌格式无效');
      }
      
      console.log('[AuthService] 令牌刷新成功');
      return response.data;
    } catch (error) {
      console.error('[AuthService] 令牌刷新失败:', error);
      throw error;
    }
  }

  /**
   * 忘记密码
   */
  static async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    try {
      await httpClient.post('/auth/forgot-password', request);
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }

  /**
   * 重置密码
   */
  static async resetPassword(request: ResetPasswordRequest): Promise<void> {
    try {
      await httpClient.post('/auth/reset-password', request);
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await httpClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(updates: Partial<User>): Promise<User> {
    try {
      const response = await httpClient.put<User>('/auth/me', updates);
      return response.data;
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      await httpClient.post('/auth/verify-email', { token });
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * 重新发送验证邮件
   */
  static async resendVerificationEmail(): Promise<void> {
    try {
      await httpClient.post('/auth/resend-verification');
    } catch (error) {
      console.error('Resend verification email failed:', error);
      throw error;
    }
  }

  /**
   * 更改密码
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await httpClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  }

  /**
   * 删除账户
   */
  static async deleteAccount(password: string): Promise<void> {
    try {
      await httpClient.delete('/auth/account', {
        data: { password }
      });
    } catch (error) {
      console.error('Delete account failed:', error);
      throw error;
    }
  }
}

export default AuthService;