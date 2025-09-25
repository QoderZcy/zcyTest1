import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterCredentials } from '../types/auth';
import { ValidationUtils } from '../utils/authUtils';

// 注册表单验证架构
const registerSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .refine(ValidationUtils.isValidEmail, '请输入有效的邮箱地址'),
  username: z
    .string()
    .min(1, '请输入用户名')
    .refine(ValidationUtils.isValidUsername, '用户名必须为3-20位字符，只能包含字母、数字、下划线和中文'),
  password: z
    .string()
    .min(8, '密码长度至少8位')
    .refine(
      (password) => ValidationUtils.validatePassword(password).isValid,
      '密码必须包含大小写字母、数字和特殊字符'
    ),
  confirmPassword: z
    .string()
    .min(1, '请确认密码'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, '请同意服务条款和隐私政策'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  }
);

type RegisterFormData = z.infer<typeof registerSchema>;

// 组件Props
interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onRegistrationSuccess,
}) => {
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
    color: string;
  }>({ score: 0, feedback: '', color: '' });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  // 监听表单变化以清除错误
  const watchedFields = watch();
  React.useEffect(() => {
    if (error) {
      clearError();
    }
  }, [watchedFields, error, clearError]);

  // 监听密码强度变化
  const passwordValue = watch('password');
  React.useEffect(() => {
    if (passwordValue) {
      const validation = ValidationUtils.validatePassword(passwordValue);
      const score = validation.isValid ? 4 : Math.min(passwordValue.length / 2, 3);
      
      let feedback = '';
      let color = '';
      
      if (score === 0) {
        feedback = '';
        color = '';
      } else if (score < 2) {
        feedback = '弱';
        color = 'text-red-500';
      } else if (score < 3) {
        feedback = '中等';
        color = 'text-yellow-500';
      } else if (score < 4) {
        feedback = '较强';
        color = 'text-blue-500';
      } else {
        feedback = '强';
        color = 'text-green-500';
      }
      
      setPasswordStrength({ score, feedback, color });
    } else {
      setPasswordStrength({ score: 0, feedback: '', color: '' });
    }
  }, [passwordValue]);

  /**
   * 处理表单提交
   */
  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    try {
      setIsSubmitting(true);
      clearError();

      const credentials: RegisterCredentials = {
        email: data.email.trim().toLowerCase(),
        username: data.username.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.acceptTerms,
      };

      console.log('[RegisterForm] 尝试注册:', { 
        email: credentials.email, 
        username: credentials.username 
      });
      
      await registerUser(credentials);
      
      console.log('[RegisterForm] 注册成功');
      reset();
      onRegistrationSuccess?.();
    } catch (error) {
      console.error('[RegisterForm] 注册失败:', error);
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
   * 切换确认密码显示状态
   */
  const toggleConfirmPasswordVisibility = (): void => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  /**
   * 处理切换到登录
   */
  const handleSwitchToLogin = (): void => {
    clearError();
    reset();
    onSwitchToLogin();
  };

  const isFormLoading = loading || isSubmitting;

  return (
    <div className="register-form">
      <div className="form-header">
        <h2 className="form-title">
          <UserPlus size={24} />
          创建账户
        </h2>
        <p className="form-subtitle">
          加入便签管理系统，开始您的高效笔记之旅
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        {/* 邮箱输入 */}
        <div className="form-group">
          <label htmlFor="register-email" className="form-label">
            邮箱地址
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <Mail size={20} />
            </div>
            <input
              {...register('email')}
              type="email"
              id="register-email"
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="请输入您的邮箱地址"
              autoComplete="email"
              disabled={isFormLoading}
            />
          </div>
          {errors.email && (
            <span className="form-error">{errors.email.message}</span>
          )}
        </div>

        {/* 用户名输入 */}
        <div className="form-group">
          <label htmlFor="register-username" className="form-label">
            用户名
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <User size={20} />
            </div>
            <input
              {...register('username')}
              type="text"
              id="register-username"
              className={`form-input ${errors.username ? 'form-input-error' : ''}`}
              placeholder="请输入用户名（3-20位字符）"
              autoComplete="username"
              disabled={isFormLoading}
            />
          </div>
          {errors.username && (
            <span className="form-error">{errors.username.message}</span>
          )}
        </div>

        {/* 密码输入 */}
        <div className="form-group">
          <label htmlFor="register-password" className="form-label">
            密码
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <Lock size={20} />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="register-password"
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder="请输入密码（至少8位）"
              autoComplete="new-password"
              disabled={isFormLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              disabled={isFormLoading}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {/* 密码强度指示器 */}
          {passwordValue && (
            <div className="password-strength">
              <div className="password-strength-bar">
                <div 
                  className={`password-strength-fill strength-${passwordStrength.score}`}
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
              {passwordStrength.feedback && (
                <span className={`password-strength-text ${passwordStrength.color}`}>
                  密码强度：{passwordStrength.feedback}
                </span>
              )}
            </div>
          )}
          
          {errors.password && (
            <span className="form-error">{errors.password.message}</span>
          )}
        </div>

        {/* 确认密码输入 */}
        <div className="form-group">
          <label htmlFor="register-confirm-password" className="form-label">
            确认密码
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <Lock size={20} />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="register-confirm-password"
              className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
              placeholder="请再次输入密码"
              autoComplete="new-password"
              disabled={isFormLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={toggleConfirmPasswordVisibility}
              disabled={isFormLoading}
              aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="form-error">{errors.confirmPassword.message}</span>
          )}
        </div>

        {/* 服务条款同意 */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className={`checkbox-input ${errors.acceptTerms ? 'checkbox-input-error' : ''}`}
              disabled={isFormLoading}
            />
            <span className="checkbox-text">
              我已阅读并同意
              <button type="button" className="link-button inline">
                服务条款
              </button>
              和
              <button type="button" className="link-button inline">
                隐私政策
              </button>
            </span>
          </label>
          {errors.acceptTerms && (
            <span className="form-error">{errors.acceptTerms.message}</span>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="form-error-banner" role="alert" aria-live="polite">
            <XCircle size={20} />
            <span>{typeof error === 'string' ? error : error.message}</span>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={!isValid || isFormLoading}
        >
          {isFormLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              正在创建账户...
            </>
          ) : (
            <>
              <UserPlus size={20} />
              创建账户
            </>
          )}
        </button>

        {/* 切换到登录 */}
        <div className="form-footer">
          <span>已有账户？</span>
          <button
            type="button"
            className="link-button"
            onClick={handleSwitchToLogin}
            disabled={isFormLoading}
          >
            立即登录
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;