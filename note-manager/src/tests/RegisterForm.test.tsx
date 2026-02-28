/**
 * RegisterForm 组件单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../components/RegisterForm';

// Mock AuthContext
const mockUseAuth = {
  register: vi.fn(),
  loading: false,
  error: null,
  clearError: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock validation utils
vi.mock('../utils/authUtils', () => ({
  ValidationUtils: {
    isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    isValidUsername: (username: string) => /^[\u4e00-\u9fa5\w]{3,20}$/.test(username),
    validatePassword: (password: string) => {
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const isValidLength = password.length >= 8;
      
      return {
        isValid: hasLower && hasUpper && hasNumber && hasSpecial && isValidLength,
        errors: []
      };
    },
  },
}));

describe('RegisterForm', () => {
  const mockProps = {
    onSwitchToLogin: vi.fn(),
    onRegistrationSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.loading = false;
    mockUseAuth.error = null;
  });

  it('should render register form with all required fields', () => {
    render(<RegisterForm {...mockProps} />);

    expect(screen.getByLabelText(/邮箱地址/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/确认密码/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/我已阅读并同意/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /创建账户/i })).toBeInTheDocument();
  });

  it('should show validation errors for invalid inputs', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);

    // 输入无效邮箱
    await user.type(emailInput, 'invalid-email');
    await user.click(usernameInput); // 触发验证

    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/i)).toBeInTheDocument();
    });

    // 输入无效用户名
    await user.clear(usernameInput);
    await user.type(usernameInput, 'ab'); // 太短
    await user.click(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/用户名必须为3-20位字符/i)).toBeInTheDocument();
    });
  });

  it('should show password strength indicator', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const passwordInput = screen.getByLabelText(/^密码$/i);

    await user.type(passwordInput, 'weakpass');
    
    await waitFor(() => {
      expect(screen.getByText(/密码强度/i)).toBeInTheDocument();
    });
  });

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const passwordInput = screen.getByLabelText(/^密码$/i);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i);

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    
    // 触发验证
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/两次输入的密码不一致/i)).toBeInTheDocument();
    });
  });

  it('should require terms acceptance', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i);
    const submitButton = screen.getByRole('button', { name: /创建账户/i });

    // 填写所有字段但不勾选条款
    await user.type(emailInput, 'test@example.com');
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');

    // 尝试提交
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/请同意服务条款和隐私政策/i)).toBeInTheDocument();
    });
  });

  it('should call register function on valid form submission', async () => {
    const user = userEvent.setup();
    mockUseAuth.register.mockResolvedValue(undefined);

    render(<RegisterForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i);
    const termsCheckbox = screen.getByLabelText(/我已阅读并同意/i);
    const submitButton = screen.getByRole('button', { name: /创建账户/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(termsCheckbox);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUseAuth.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        acceptTerms: true,
      });
    });
  });

  it('should show/hide password when toggle buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const passwordInput = screen.getByLabelText(/^密码$/i) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i) as HTMLInputElement;
    
    // Find toggle buttons by their aria-labels
    const passwordToggle = screen.getAllByLabelText(/显示密码/i)[0];
    const confirmPasswordToggle = screen.getAllByLabelText(/显示密码/i)[1];

    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('password');

    await user.click(passwordToggle);
    expect(passwordInput.type).toBe('text');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput.type).toBe('text');
  });

  it('should display error message when registration fails', () => {
    mockUseAuth.error = '邮箱已被注册';

    render(<RegisterForm {...mockProps} />);

    expect(screen.getByText('邮箱已被注册')).toBeInTheDocument();
  });

  it('should show loading state during registration', () => {
    mockUseAuth.loading = true;

    render(<RegisterForm {...mockProps} />);

    expect(screen.getByText(/正在创建账户/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /正在创建账户/i })).toBeDisabled();
  });

  it('should call onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const loginLink = screen.getByText(/立即登录/i);
    await user.click(loginLink);

    expect(mockProps.onSwitchToLogin).toHaveBeenCalled();
  });

  it('should disable form inputs during loading', () => {
    mockUseAuth.loading = true;

    render(<RegisterForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i);
    const termsCheckbox = screen.getByLabelText(/我已阅读并同意/i);
    const submitButton = screen.getByRole('button', { name: /正在创建账户/i });

    expect(emailInput).toBeDisabled();
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(termsCheckbox).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should call onRegistrationSuccess after successful registration', async () => {
    const user = userEvent.setup();
    mockUseAuth.register.mockResolvedValue(undefined);

    render(<RegisterForm {...mockProps} />);

    const emailInput = screen.getByLabelText(/邮箱地址/i);
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i);
    const termsCheckbox = screen.getByLabelText(/我已阅读并同意/i);
    const submitButton = screen.getByRole('button', { name: /创建账户/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onRegistrationSuccess).toHaveBeenCalled();
    });
  });
});