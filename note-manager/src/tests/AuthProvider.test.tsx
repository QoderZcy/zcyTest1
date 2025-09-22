/**
 * AuthProvider 组件单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { LoginCredentials, RegisterCredentials } from '../src/types/auth';

// Mock AuthService
const mockAuthService = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock('../src/services/authService', () => ({
  default: mockAuthService,
}));

// Mock StorageManager
const mockStorageManager = {
  getToken: vi.fn(),
  setToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
  getRememberMe: vi.fn(),
  setRememberMe: vi.fn(),
};

vi.mock('../src/utils/httpClient', () => ({
  StorageManager: mockStorageManager,
}));

// Mock JWTUtils
vi.mock('../src/utils/authUtils', () => ({
  JWTUtils: {
    isTokenExpired: vi.fn(),
    isTokenExpiringSoon: vi.fn(),
  },
  ErrorUtils: {
    getErrorMessage: vi.fn((error) => error.message || 'Unknown error'),
  },
}));

// 测试组件，用于访问 AuthContext
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid=\"loading\">{auth.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid=\"authenticated\">{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid=\"user\">{auth.user?.username || 'no-user'}</div>
      <div data-testid=\"error\">{auth.error || 'no-error'}</div>
      
      <button 
        data-testid=\"login-btn\" 
        onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      
      <button 
        data-testid=\"register-btn\" 
        onClick={() => auth.register({ 
          email: 'test@example.com', 
          password: 'password', 
          username: 'testuser',
          confirmPassword: 'password',
          acceptTerms: true,
        })}
      >
        Register
      </button>
      
      <button 
        data-testid=\"logout-btn\" 
        onClick={() => auth.logout()}
      >
        Logout
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认 mock 返回值
    mockStorageManager.getToken.mockReturnValue(null);
    mockStorageManager.getRefreshToken.mockReturnValue(null);
    mockStorageManager.getRememberMe.mockReturnValue(false);
  });

  it('should render children and provide auth context', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    const mockAuthResponse = {
      user: mockUser,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    mockAuthService.login.mockResolvedValue(mockAuthResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-btn');

    await act(async () => {
      await userEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(mockStorageManager.setToken).toHaveBeenCalledWith('mock-token', false);
    expect(mockStorageManager.setRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
  });

  it('should handle login failure', async () => {
    const mockError = new Error('Invalid credentials');
    mockAuthService.login.mockRejectedValue(mockError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-btn');

    await act(async () => {
      await userEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  it('should handle successful registration', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    const mockAuthResponse = {
      user: mockUser,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    mockAuthService.register.mockResolvedValue(mockAuthResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByTestId('register-btn');

    await act(async () => {
      await userEvent.click(registerButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      username: 'testuser',
      confirmPassword: 'password',
      acceptTerms: true,
    });
  });

  it('should handle logout', async () => {
    // 先设置已认证状态
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    const mockAuthResponse = {
      user: mockUser,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    mockAuthService.login.mockResolvedValue(mockAuthResponse);
    mockAuthService.logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 先登录
    const loginButton = screen.getByTestId('login-btn');
    await act(async () => {
      await userEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // 然后登出
    const logoutButton = screen.getByTestId('logout-btn');
    await act(async () => {
      await userEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockStorageManager.clearTokens).toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // 模拟控制台错误以避免测试输出中的错误信息
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});