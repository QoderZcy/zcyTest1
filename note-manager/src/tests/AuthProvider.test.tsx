import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthService from '../services/authService';
import { StorageManager } from '../utils/httpClient';
import { JWTUtils } from '../utils/authUtils';
import { AuthErrorType } from '../types/auth';

// 模拟依赖
vi.mock('../services/authService');
vi.mock('../utils/httpClient');
vi.mock('../utils/authUtils');

// 模拟的AuthService
const mockAuthService = AuthService as any;
const mockStorageManager = StorageManager as any;
const mockJWTUtils = JWTUtils as any;

// 测试组件
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="loading-status">
        {auth.loading ? 'loading' : 'loaded'}
      </div>
      <div data-testid="initialized-status">
        {auth.isInitialized ? 'initialized' : 'not-initialized'}
      </div>
      {auth.user && (
        <div data-testid="user-info">
          {auth.user.email}
        </div>
      )}
      {auth.error && (
        <div data-testid="error-message">
          {auth.error.message}
        </div>
      )}
      <button 
        data-testid="login-button"
        onClick={() => auth.login({ email: 'test@example.com', password: 'password123' })}
      >
        Login
      </button>
      <button 
        data-testid="logout-button"
        onClick={() => auth.logout()}
      >
        Logout
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    avatar: 'avatar-url',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  const mockAuthResponse = {
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
    expiresIn: 3600,
  };

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();
    
    // 默认模拟设置
    mockStorageManager.getToken.mockReturnValue(null);
    mockStorageManager.getRefreshToken.mockReturnValue(null);
    mockStorageManager.getRememberMe.mockReturnValue(false);
    mockJWTUtils.isTokenExpired.mockReturnValue(false);
    mockJWTUtils.decode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初始化时应该显示加载状态', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('initialized-status')).toHaveTextContent('not-initialized');
  });

  it('无令牌时应该完成初始化', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('initialized-status')).toHaveTextContent('initialized');
  });

  it('有效令牌时应该自动登录', async () => {
    // 模拟有效令牌
    mockStorageManager.getToken.mockReturnValue('valid-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockJWTUtils.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('initialized-status')).toHaveTextContent('initialized');
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('过期令牌时应该尝试刷新', async () => {
    // 模拟过期令牌
    mockStorageManager.getToken.mockReturnValue('expired-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockJWTUtils.isTokenExpired.mockReturnValue(true);
    mockAuthService.refreshToken.mockResolvedValue({
      token: 'new-token',
      expiresIn: 3600,
    });
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockStorageManager.setToken).toHaveBeenCalledWith('new-token', false);
  });

  it('应该成功处理登录', async () => {
    const user = userEvent.setup();
    mockAuthService.login.mockResolvedValue(mockAuthResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 等待初始化完成
    await waitFor(() => {
      expect(screen.getByTestId('initialized-status')).toHaveTextContent('initialized');
    });

    await act(async () => {
      await user.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockStorageManager.setToken).toHaveBeenCalled();
    expect(mockStorageManager.setRefreshToken).toHaveBeenCalled();
  });

  it('应该处理登录错误', async () => {
    const user = userEvent.setup();
    const loginError = {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: '邮箱或密码错误',
    };
    
    mockAuthService.login.mockRejectedValue(loginError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized-status')).toHaveTextContent('initialized');
    });

    await act(async () => {
      await user.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('邮箱或密码错误');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  it('应该成功处理登出', async () => {
    const user = userEvent.setup();
    
    // 先设置为已登录状态
    mockStorageManager.getToken.mockReturnValue('valid-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    await act(async () => {
      await user.click(screen.getByTestId('logout-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockStorageManager.clearTokens).toHaveBeenCalled();
  });

  it('即使服务器登出失败也应该清除本地状态', async () => {
    const user = userEvent.setup();
    
    mockStorageManager.getToken.mockReturnValue('valid-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.logout.mockRejectedValue(new Error('服务器错误'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    await act(async () => {
      await user.click(screen.getByTestId('logout-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    expect(mockStorageManager.clearTokens).toHaveBeenCalled();
  });

  it('应该正确处理令牌刷新失败', async () => {
    mockStorageManager.getToken.mockReturnValue('expired-token');
    mockStorageManager.getRefreshToken.mockReturnValue('invalid-refresh-token');
    mockJWTUtils.isTokenExpired.mockReturnValue(true);
    mockAuthService.refreshToken.mockRejectedValue(new Error('刷新令牌失败'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    expect(screen.getByTestId('initialized-status')).toHaveTextContent('initialized');
    expect(mockStorageManager.clearTokens).toHaveBeenCalled();
  });
});