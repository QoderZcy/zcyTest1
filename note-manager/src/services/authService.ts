import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  RefreshTokenResponse,
  User
} from '../types/auth';
import { httpClient } from '../utils/httpClient';

// 认证API服务类
export class AuthService {
  /**
   * 用户登录
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
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
      await httpClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使服务端登出失败，客户端也要清除本地状态
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await httpClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      });
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
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