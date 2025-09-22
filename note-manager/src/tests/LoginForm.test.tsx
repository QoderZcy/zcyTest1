/**
 * LoginForm 组件单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../src/contexts/AuthContext';
import { LoginForm } from '../src/components/LoginForm';

// Mock AuthContext
const mockUseAuth = {
  login: vi.fn(),
  loading: false,
  error: null,
  clearError: vi.fn(),
};

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: any) => children,
}));

// Mock validation utils
vi.mock('../src/utils/authUtils', () => ({
  ValidationUtils: {
    isValidEmail: (email: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email),
  },
}));

describe('LoginForm', () => {
  const mockProps = {
    onSwitchToRegister: vi.fn(),
    onForgotPassword: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.loading = false;
    mockUseAuth.error = null;
  });

  it('should render login form with all required fields', () => {
    render(<LoginForm {...mockProps} />);

    expect(screen.getByLabelText(/邮箱地址/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/记住我/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  it('should show validation errors for invalid inputs', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });

    // 输入无效邮箱
    await user.type(emailInput, 'invalid-email');
    await user.click(passwordInput); // 触发验证

    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/i)).toBeInTheDocument();
    });

    // 提交按钮应该被禁用
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call login function on form submission', async () => {
    const user = userEvent.setup();
    mockUseAuth.login.mockResolvedValue(undefined);

    render(<LoginForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const rememberMeCheckbox = screen.getByLabelText(/记住我/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(rememberMeCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUseAuth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });
  });

  it('should show/hide password when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const passwordInput = screen.getByLabelText(/密码/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/显示密码/i);

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should display error message when login fails', () => {
    mockUseAuth.error = '邮箱或密码错误';

    render(<LoginForm {...mockProps} />);

    expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
  });

  it('should show loading state during login', () => {
    mockUseAuth.loading = true;

    render(<LoginForm {...mockProps} />);

    expect(screen.getByText(/正在登录/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /正在登录/i })).toBeDisabled();
  });

  it('should call onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const registerLink = screen.getByText(/立即注册/i);
    await user.click(registerLink);

    expect(mockProps.onSwitchToRegister).toHaveBeenCalled();
  });

  it('should call onForgotPassword when forgot password link is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const forgotPasswordLink = screen.getByText(/忘记密码/i);
    await user.click(forgotPasswordLink);

    expect(mockProps.onForgotPassword).toHaveBeenCalled();
  });

  it('should clear errors when form inputs change', async () => {
    const user = userEvent.setup();
    mockUseAuth.error = '登录失败';

    render(<LoginForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);

    await user.type(emailInput, 'test@example.com');

    expect(mockUseAuth.clearError).toHaveBeenCalled();
  });

  it('should disable form inputs during loading', () => {
    mockUseAuth.loading = true;

    render(<LoginForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const rememberMeCheckbox = screen.getByLabelText(/记住我/i);
    const submitButton = screen.getByRole('button', { name: /正在登录/i });

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(rememberMeCheckbox).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});