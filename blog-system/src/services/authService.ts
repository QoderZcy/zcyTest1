import { apiClient } from './api';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  UpdateUserRequest,
  UserProfile,
  ApiResponse 
} from '../types';

// 认证服务类
class AuthService {
  // 用户登录
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // 保存token到本地存储
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  // 用户注册
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    
    // 保存token到本地存储
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  // 用户登出
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // 无论API调用是否成功，都清除本地存储
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
    }
  }

  // 刷新token
  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });

    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  }

  // 更新用户信息
  async updateProfile(data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    
    // 更新本地存储的用户数据
    if (response.success && response.data) {
      localStorage.setItem('userData', JSON.stringify(response.data));
    }
    
    return response.data;
  }

  // 获取用户详细资料
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(`/users/${userId}/profile`);
    return response.data;
  }

  // 修改密码
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiClient.put('/auth/change-password', data);
  }

  // 忘记密码
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  // 重置密码
  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  }

  // 验证邮箱
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  // 重新发送验证邮件
  async resendVerificationEmail(): Promise<void> {
    await apiClient.post('/auth/resend-verification');
  }

  // 检查用户名是否可用
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    const response = await apiClient.get<{ available: boolean }>(
      `/auth/check-username?username=${encodeURIComponent(username)}`
    );
    return response.data;
  }

  // 检查邮箱是否可用
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const response = await apiClient.get<{ available: boolean }>(
      `/auth/check-email?email=${encodeURIComponent(email)}`
    );
    return response.data;
  }

  // 上传头像
  async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const response = await apiClient.upload<{ url: string }>(
      '/auth/upload-avatar', 
      file, 
      onProgress
    );
    return response.data.url;
  }

  // 获取本地存储的用户信息
  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  // 获取本地存储的token
  getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  // 清除所有认证数据
  clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  }
}

// 创建并导出认证服务实例
export const authService = new AuthService();

// 导出默认实例
export default authService;