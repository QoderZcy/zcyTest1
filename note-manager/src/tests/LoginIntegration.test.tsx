/**
 * 登录页面集成测试
 * 测试完整的登录流程和认证状态管理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../contexts/AuthContext';
import AuthPage from '../components/AuthPage';
import AuthService from '../services/authService';
import { StorageManager } from '../utils/httpClient';
import { JWTUtils } from '../utils/authUtils';
import { AuthMode } from '../types/auth';

// Mock AuthService
vi.mock('../services/authService');
vi.mock('../utils/httpClient');
vi.mock('../utils/authUtils');

const mockAuthService = AuthService as any;
const mockStorageManager = StorageManager as any;
const mockJWTUtils = JWTUtils as any;

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

// 模拟认证响应
const mockAuthResponse = {
  token: 'valid-jwt-token',
  refreshToken: 'valid-refresh-token',
  user: mockUser,
  expiresIn: 3600,
};

describe('登录页面集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重置存储
    mockStorageManager.getToken.mockReturnValue(null);
    mockStorageManager.getRefreshToken.mockReturnValue(null);
    mockStorageManager.getRememberMe.mockReturnValue(false);
    mockStorageManager.setToken.mockImplementation(() => {});
    mockStorageManager.setRefreshToken.mockImplementation(() => {});
    mockStorageManager.setRememberMe.mockImplementation(() => {});
    mockStorageManager.clearTokens.mockImplementation(() => {});
    
    // 重置JWT工具
    mockJWTUtils.isTokenExpired.mockReturnValue(false);
    mockJWTUtils.decode.mockReturnValue({
      sub: mockUser.id,
      email: mockUser.email,
      username: mockUser.username,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
  });

  it('应该渲染登录表单', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/邮箱地址/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  it('应该显示表单验证错误', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    const loginButton = screen.getByRole('button', { name: /登录/i });
    
    // 尝试在空表单上提交
    await act(async () => {
      await user.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/请输入邮箱地址/i)).toBeInTheDocument();
      expect(screen.getByText(/请输入密码/i)).toBeInTheDocument();
    });
  });

  it('应该显示无效邮箱格式错误', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    
    await act(async () => {
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // 触发验证
    });

    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/i)).toBeInTheDocument();
    });
  });

  it('应该成功执行登录流程', async () => {
    const user = userEvent.setup();
    
    // Mock 成功的登录响应
    mockAuthService.login.mockResolvedValue(mockAuthResponse);
    
    const onAuthSuccess = vi.fn();
    
    render(
      <AuthProvider>
        <AuthPage onAuthSuccess={onAuthSuccess} />
      </AuthProvider>
    );

    // 填写表单
    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const loginButton = screen.getByRole('button', { name: /登录/i });

    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
    });

    // 验证API调用
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    // 验证存储操作
    expect(mockStorageManager.setToken).toHaveBeenCalledWith('valid-jwt-token', false);
    expect(mockStorageManager.setRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
  });

  it('应该处理登录失败', async () => {
    const user = userEvent.setup();
    
    // Mock 失败的登录响应
    mockAuthService.login.mockRejectedValue({
      type: 'INVALID_CREDENTIALS',
      message: '邮箱或密码错误',
    });
    
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // 填写表单
    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const loginButton = screen.getByRole('button', { name: /登录/i });

    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);
    });

    // 验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/邮箱或密码错误/i)).toBeInTheDocument();
    });
  });

  it('应该支持记住我功能', async () => {
    const user = userEvent.setup();
    
    // Mock 成功的登录响应
    mockAuthService.login.mockResolvedValue(mockAuthResponse);
    
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // 填写表单并选择记住我
    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const rememberMeCheckbox = screen.getByLabelText(/记住我/i);
    const loginButton = screen.getByRole('button', { name: /登录/i });

    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberMeCheckbox);
      await user.click(loginButton);
    });

    // 验证记住我被正确传递
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });

    // 验证token存储使用了记住我设置
    expect(mockStorageManager.setToken).toHaveBeenCalledWith('valid-jwt-token', true);
  });

  it('应该能够切换到注册模式', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // 点击注册链接
    const registerLink = screen.getByRole('button', { name: /立即注册/i });
    
    await act(async () => {
      await user.click(registerLink);
    });

    // 验证切换到注册表单
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /注册账户/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    });
  });

  it('应该能够切换到忘记密码模式', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // 点击忘记密码链接
    const forgotPasswordLink = screen.getByRole('button', { name: /忘记密码/i });
    
    await act(async () => {
      await user.click(forgotPasswordLink);
    });

    // 验证切换到忘记密码表单
    await waitFor(() => {
      expect(screen.getByText(/重置密码/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /发送重置链接/i })).toBeInTheDocument();
    });
  });

  it('应该显示加载状态', async () => {
    const user = userEvent.setup();
    
    // Mock 慢速登录响应
    let resolveLogin: (value: any) => void;
    mockAuthService.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // 填写表单并提交
    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const loginButton = screen.getByRole('button', { name: /登录/i });

    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
    });

    // 验证加载状态
    expect(screen.getByText(/正在登录/i)).toBeInTheDocument();
    expect(loginButton).toBeDisabled();

    // 完成登录
    act(() => {
      resolveLogin!(mockAuthResponse);
    });
  });
});