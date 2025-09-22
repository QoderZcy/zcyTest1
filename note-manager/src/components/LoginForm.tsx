import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types/auth';
import { ValidationUtils } from '../utils/authUtils';

// 登录表单验证架构
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .refine(ValidationUtils.isValidEmail, '请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '请输入密码'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// 组件Props
interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onForgotPassword,
}) => {
  const { login, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // 监听表单变化以清除错误
  const watchedFields = watch();
  React.useEffect(() => {
    if (error) {
      clearError();
    }
  }, [watchedFields, error, clearError]);

  /**
   * 处理表单提交
   */
  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      setIsSubmitting(true);
      clearError();

      const credentials: LoginCredentials = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        rememberMe: data.rememberMe,
      };

      await login(credentials);
      
      // 登录成功后重置表单
      reset();
    } catch (error) {
      console.error('Login failed:', error);
      // 错误已在AuthContext中处理
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 切换密码显示状态
   */
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  /**
   * 处理忘记密码
   */
  const handleForgotPassword = (): void => {
    clearError();
    onForgotPassword();
  };

  /**
   * 处理切换到注册
   */
  const handleSwitchToRegister = (): void => {
    clearError();
    reset();
    onSwitchToRegister();
  };

  const isFormLoading = loading || isSubmitting;

  return (
    <div className=\"login-form\">
      <div className=\"form-header\">
        <h2 className=\"form-title\">
          <LogIn size={24} />
          登录账户
        </h2>
        <p className=\"form-subtitle\">
          欢迎回来！请登录您的账户以继续使用便签管理系统
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className=\"auth-form\" noValidate>
        {/* 邮箱输入 */}
        <div className=\"form-group\">
          <label htmlFor=\"email\" className=\"form-label\">
            邮箱地址
          </label>
          <div className=\"input-wrapper\">
            <div className=\"input-icon\">
              <Mail size={20} />
            </div>
            <input
              {...register('email')}
              type=\"email\"
              id=\"email\"
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder=\"请输入您的邮箱地址\"
              autoComplete=\"email\"
              disabled={isFormLoading}
            />
          </div>
          {errors.email && (
            <span className=\"form-error\">{errors.email.message}</span>
          )}
        </div>

        {/* 密码输入 */}
        <div className=\"form-group\">
          <label htmlFor=\"password\" className=\"form-label\">
            密码
          </label>
          <div className=\"input-wrapper\">
            <div className=\"input-icon\">
              <Lock size={20} />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id=\"password\"
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder=\"请输入您的密码\"
              autoComplete=\"current-password\"
              disabled={isFormLoading}
            />
            <button
              type=\"button\"
              className=\"password-toggle\"
              onClick={togglePasswordVisibility}
              disabled={isFormLoading}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <span className=\"form-error\">{errors.password.message}</span>
          )}
        </div>

        {/* 记住我选项 */}
        <div className=\"form-group form-group-horizontal\">
          <label className=\"checkbox-label\">
            <input
              {...register('rememberMe')}
              type=\"checkbox\"
              className=\"checkbox-input\"
              disabled={isFormLoading}
            />
            <span className=\"checkbox-text\">记住我</span>
          </label>

          <button
            type=\"button\"
            className=\"link-button\"
            onClick={handleForgotPassword}
            disabled={isFormLoading}
          >
            忘记密码？
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className=\"form-error-banner\">
            <span>{error}</span>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type=\"submit\"
          className=\"btn btn-primary btn-full\"
          disabled={!isValid || isFormLoading}
        >
          {isFormLoading ? (
            <>
              <Loader2 size={20} className=\"animate-spin\" />
              正在登录...
            </>
          ) : (
            <>
              <LogIn size={20} />
              登录
            </>
          )}
        </button>

        {/* 切换到注册 */}
        <div className=\"form-footer\">
          <span>还没有账户？</span>
          <button
            type=\"button\"
            className=\"link-button\"
            onClick={handleSwitchToRegister}
            disabled={isFormLoading}
          >
            立即注册
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;