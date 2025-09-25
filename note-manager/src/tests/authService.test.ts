import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthService from '../services/authService';
import { httpClient } from '../utils/httpClient';
import { JWTUtils } from '../utils/authUtils';

// Mock httpClient
vi.mock('../utils/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock JWTUtils
vi.mock('../utils/authUtils', () => ({
  JWTUtils: {
    isValidTokenFormat: vi.fn(),
    decode: vi.fn(),
    isTokenExpired: vi.fn(),
    isTokenExpiringSoon: vi.fn(),
  },
}));

describe('AuthService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  const mockTokens = {
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  };

  const mockAuthResponse = {
    ...mockTokens,
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('应该成功登录并返回用户信息和令牌', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const mockResponse = { data: mockAuthResponse };
      (httpClient.post as any).mockResolvedValue(mockResponse);
      (JWTUtils.isValidTokenFormat as any).mockReturnValue(true);

      const result = await AuthService.login(credentials);

      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      });

      expect(JWTUtils.isValidTokenFormat).toHaveBeenCalledWith(mockTokens.token);
      expect(result).toEqual(mockAuthResponse);
    });

    it('应该在登录失败时抛出错误', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = new Error('Invalid credentials');
      (httpClient.post as any).mockRejectedValue(mockError);

      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials');
      
      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        rememberMe: undefined,
      });
    });

    it('应该验证令牌格式', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = { 
        data: { 
          ...mockAuthResponse, 
          token: 'invalid-token-format' 
        } 
      };
      
      (httpClient.post as any).mockResolvedValue(mockResponse);
      (JWTUtils.isValidTokenFormat as any).mockReturnValue(false);

      await expect(AuthService.login(credentials)).rejects.toThrow('无效的令牌格式');
      expect(JWTUtils.isValidTokenFormat).toHaveBeenCalledWith('invalid-token-format');
    });
  });

  describe('register', () => {
    it('应该成功注册并返回用户信息和令牌', async () => {
      const credentials = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        confirmPassword: 'password123',
        acceptTerms: true,
      };

      const mockResponse = { data: mockAuthResponse };
      (httpClient.post as any).mockResolvedValue(mockResponse);

      const result = await AuthService.register(credentials);

      expect(httpClient.post).toHaveBeenCalledWith('/auth/register', credentials);
      expect(result).toEqual(mockAuthResponse);
    });

    it('应该在注册失败时抛出错误', async () => {
      const credentials = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existinguser',
        confirmPassword: 'password123',
        acceptTerms: true,
      };

      const mockError = new Error('Email already exists');
      (httpClient.post as any).mockRejectedValue(mockError);

      await expect(AuthService.register(credentials)).rejects.toThrow('Email already exists');
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新令牌', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockResponse = {
        data: {
          token: 'new-access-token',
          expiresIn: 3600,
        },
      };

      (httpClient.post as any).mockResolvedValue(mockResponse);
      (JWTUtils.isValidTokenFormat as any).mockReturnValue(true);

      const result = await AuthService.refreshToken(refreshToken);

      expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken,
      });
      expect(JWTUtils.isValidTokenFormat).toHaveBeenCalledWith('new-access-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('应该在刷新令牌失败时抛出错误', async () => {
      const refreshToken = 'invalid-refresh-token';
      const mockError = new Error('Invalid refresh token');
      
      (httpClient.post as any).mockRejectedValue(mockError);

      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('应该在缺少刷新令牌时抛出错误', async () => {
      await expect(AuthService.refreshToken('')).rejects.toThrow('无效的刷新令牌');
    });
  });

  describe('logout', () => {
    it('应该成功登出', async () => {
      (httpClient.post as any).mockResolvedValue({});

      await expect(AuthService.logout()).resolves.toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('应该在登出失败时记录错误但不抛出异常', async () => {
      const mockError = new Error('Logout failed');
      (httpClient.post as any).mockRejectedValue(mockError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(AuthService.logout()).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[AuthService] 服务器登出失败:', mockError);

      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentUser', () => {
    it('应该成功获取当前用户信息', async () => {
      const mockResponse = { data: mockUser };
      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await AuthService.getCurrentUser();

      expect(httpClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('应该在获取用户信息失败时抛出错误', async () => {
      const mockError = new Error('Unauthorized');
      (httpClient.get as any).mockRejectedValue(mockError);

      await expect(AuthService.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateUser', () => {
    it('应该成功更新用户信息', async () => {
      const updates = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const updatedUser = { ...mockUser, ...updates };
      const mockResponse = { data: updatedUser };
      
      (httpClient.put as any).mockResolvedValue(mockResponse);

      const result = await AuthService.updateUser(updates);

      expect(httpClient.put).toHaveBeenCalledWith('/auth/me', updates);
      expect(result).toEqual(updatedUser);
    });

    it('应该在更新用户信息失败时抛出错误', async () => {
      const updates = { username: 'newusername' };
      const mockError = new Error('Username already taken');
      
      (httpClient.put as any).mockRejectedValue(mockError);

      await expect(AuthService.updateUser(updates)).rejects.toThrow('Username already taken');
    });
  });

  describe('forgotPassword', () => {
    it('应该成功发送忘记密码请求', async () => {
      const request = { email: 'test@example.com' };
      (httpClient.post as any).mockResolvedValue({});

      await expect(AuthService.forgotPassword(request)).resolves.toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith('/auth/forgot-password', request);
    });

    it('应该在忘记密码请求失败时抛出错误', async () => {
      const request = { email: 'notfound@example.com' };
      const mockError = new Error('User not found');
      
      (httpClient.post as any).mockRejectedValue(mockError);

      await expect(AuthService.forgotPassword(request)).rejects.toThrow('User not found');
    });
  });

  describe('resetPassword', () => {
    it('应该成功重置密码', async () => {
      const request = {
        resetToken: 'valid-reset-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      (httpClient.post as any).mockResolvedValue({});

      await expect(AuthService.resetPassword(request)).resolves.toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith('/auth/reset-password', request);
    });

    it('应该在重置密码失败时抛出错误', async () => {
      const request = {
        resetToken: 'invalid-reset-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };
      
      const mockError = new Error('Invalid or expired reset token');
      (httpClient.post as any).mockRejectedValue(mockError);

      await expect(AuthService.resetPassword(request)).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('changePassword', () => {
    it('应该成功更改密码', async () => {
      const currentPassword = 'currentpass';
      const newPassword = 'newpass123';
      
      (httpClient.post as any).mockResolvedValue({});

      await expect(AuthService.changePassword(currentPassword, newPassword)).resolves.toBeUndefined();
      
      expect(httpClient.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    });

    it('应该在更改密码失败时抛出错误', async () => {
      const currentPassword = 'wrongpass';
      const newPassword = 'newpass123';
      
      const mockError = new Error('Current password is incorrect');
      (httpClient.post as any).mockRejectedValue(mockError);

      await expect(AuthService.changePassword(currentPassword, newPassword)).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('checkHealth', () => {
    it('应该成功检查服务健康状态', async () => {
      const mockHealthResponse = {
        data: {
          status: 'healthy',
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      };

      (httpClient.get as any).mockResolvedValue(mockHealthResponse);

      const result = await AuthService.checkHealth();

      expect(httpClient.get).toHaveBeenCalledWith('/auth/health');
      expect(result).toEqual({
        status: 'healthy',
        timestamp: new Date('2023-01-01T00:00:00.000Z'),
      });
    });

    it('应该在健康检查失败时抛出错误', async () => {
      const mockError = new Error('Service unavailable');
      (httpClient.get as any).mockRejectedValue(mockError);

      await expect(AuthService.checkHealth()).rejects.toThrow('Service unavailable');
    });
  });

  describe('getConfig', () => {
    it('应该返回认证配置', () => {
      const config = AuthService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.baseURL).toBeDefined();
      expect(config.tokenStorageType).toBeDefined();
      expect(config.refreshTokenStorageType).toBeDefined();
      expect(config.autoRefresh).toBeDefined();
      expect(config.refreshThreshold).toBeDefined();
      expect(config.maxRetries).toBeDefined();
      expect(config.rememberMeDuration).toBeDefined();
    });
  });
});