/**
 * 认证工作流测试
 * 测试完整的认证流程，包括自动登录、令牌刷新等
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthService from '../services/authService';
import { StorageManager } from '../utils/httpClient';
import { JWTUtils } from '../utils/authUtils';

// Mock dependencies
vi.mock('../services/authService');
vi.mock('../utils/httpClient');
vi.mock('../utils/authUtils');

const mockAuthService = AuthService as any;
const mockStorageManager = StorageManager as any;
const mockJWTUtils = JWTUtils as any;

// 测试组件
const TestAuthComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="initialized-status">
        {auth.isInitialized ? 'initialized' : 'not-initialized'}
      </div>
      <div data-testid="loading-status">
        {auth.loading ? 'loading' : 'loaded'}
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
        onClick={() => auth.login({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: false
        })}
      >
        登录
      </button>
      <button 
        data-testid="logout-button" 
        onClick={() => auth.logout()}
      >
        登出
      </button>
      <button 
        data-testid="refresh-button" 
        onClick={() => auth.refreshToken()}
      >
        刷新令牌
      </button>
    </div>
  );
};

// 模拟用户数据
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  avatar: null,
  createdAt: new Date(),
  lastLoginAt: new Date(),
  preferences: {
    theme: 'light' as const,
    language: 'zh-CN' as const,
    autoSave: true,
    defaultNoteColor: '#ffffff',
  },
};

describe('认证工作流测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重置存储模拟
    mockStorageManager.getToken.mockReturnValue(null);
    mockStorageManager.getRefreshToken.mockReturnValue(null);
    mockStorageManager.getRememberMe.mockReturnValue(false);
    mockStorageManager.setToken.mockImplementation(() => {});
    mockStorageManager.setRefreshToken.mockImplementation(() => {});
    mockStorageManager.clearTokens.mockImplementation(() => {});
    
    // 重置JWT工具模拟
    mockJWTUtils.isTokenExpired.mockReturnValue(false);
    mockJWTUtils.decode.mockReturnValue({
      sub: mockUser.id,
      email: mockUser.email,
      username: mockUser.username,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
  });

  it('应该初始化为未认证状态', async () => {
    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('initialized-status')).toHaveTextContent('initialized');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
    });
  });

  it('应该自动登录有效令牌用户', async () => {
    // Mock有效令牌
    mockStorageManager.getToken.mockReturnValue('valid-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockJWTUtils.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
    });

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('应该在令牌过期时尝试刷新', async () => {
    // Mock过期令牌和成功刷新
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
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockStorageManager.setToken).toHaveBeenCalledWith('new-token', false);
  });

  it('应该在刷新失败时清除认证状态', async () => {
    // Mock过期令牌和失败刷新
    mockStorageManager.getToken.mockReturnValue('expired-token');
    mockStorageManager.getRefreshToken.mockReturnValue('invalid-refresh-token');
    mockJWTUtils.isTokenExpired.mockReturnValue(true);
    mockAuthService.refreshToken.mockRejectedValue(new Error('刷新失败'));

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    expect(mockStorageManager.clearTokens).toHaveBeenCalled();
  });

  it('应该成功执行登录流程', async () => {
    const user = userEvent.setup();
    
    mockAuthService.login.mockResolvedValue({
      token: 'new-token',
      refreshToken: 'new-refresh-token',
      user: mockUser,
      expiresIn: 3600,
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      await user.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
    });

    expect(mockStorageManager.setToken).toHaveBeenCalledWith('new-token', false);
    expect(mockStorageManager.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
  });

  it('应该处理登录错误', async () => {
    const user = userEvent.setup();
    
    mockAuthService.login.mockRejectedValue({
      type: 'INVALID_CREDENTIALS',
      message: '邮箱或密码错误',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      await user.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('error-message')).toHaveTextContent('邮箱或密码错误');
    });
  });

  it('应该成功执行登出流程', async () => {
    const user = userEvent.setup();
    
    // 先设置为已登录状态
    mockStorageManager.getToken.mockReturnValue('valid-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestAuthComponent />
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
    
    // 先设置为已登录状态
    mockStorageManager.getToken.mockReturnValue('valid-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.logout.mockRejectedValue(new Error('服务器错误'));

    render(
      <AuthProvider>
        <TestAuthComponent />
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

  it('应该手动刷新令牌', async () => {
    const user = userEvent.setup();
    
    // 先设置为已登录状态
    mockStorageManager.getToken.mockReturnValue('valid-token');
    mockStorageManager.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.refreshToken.mockResolvedValue({
      token: 'refreshed-token',
      expiresIn: 3600,
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    await act(async () => {
      await user.click(screen.getByTestId('refresh-button'));
    });

    expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockStorageManager.setToken).toHaveBeenCalledWith('refreshed-token', false);
  });

  it('应该在无令牌时拒绝刷新', async () => {
    const user = userEvent.setup();
    
    // 无令牌状态
    mockStorageManager.getRefreshToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    // 尝试刷新令牌应该失败
    await expect(async () => {
      await act(async () => {
        await user.click(screen.getByTestId('refresh-button'));
      });
    }).rejects.toThrow();

    expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
  });
});