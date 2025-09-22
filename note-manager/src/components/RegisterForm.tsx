import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Loader2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterCredentials } from '../types/auth';
import { ValidationUtils } from '../utils/authUtils';

// 注册表单验证架构
const registerSchema = z.object({
  username: z
    .string()
    .min(1, '请输入用户名')
    .refine(ValidationUtils.isValidUsername, '用户名格式不正确（3-20位，只能包含字母、数字、下划线、中文）'),
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .refine(ValidationUtils.isValidEmail, '请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码长度至少8位')
    .refine((password) => ValidationUtils.validatePassword(password).isValid, '密码强度不够'),
  confirmPassword: z
    .string()
    .min(1, '请确认密码'),
  acceptTerms: z
    .boolean()
    .refine((value) => value === true, '请接受服务条款和隐私政策'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// 组件Props
interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
}) => {
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

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
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  // 监听密码变化以计算强度
  const watchedPassword = watch('password');
  React.useEffect(() => {
    if (watchedPassword) {
      const validation = ValidationUtils.validatePassword(watchedPassword);
      setPasswordStrength({
        score: validation.isValid ? 4 : Math.max(1, 4 - validation.errors.length),
        feedback: validation.errors,
      });
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [watchedPassword]);

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
  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    try {
      setIsSubmitting(true);
      clearError();

      const credentials: RegisterCredentials = {
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.acceptTerms,
      };

      await registerUser(credentials);
      
      // 注册成功后重置表单
      reset();
    } catch (error) {
      console.error('Registration failed:', error);
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

  /**
   * 获取密码强度指示器的样式
   */
  const getPasswordStrengthClass = (): string => {
    if (passwordStrength.score === 0) return '';
    if (passwordStrength.score <= 2) return 'password-strength-weak';
    if (passwordStrength.score === 3) return 'password-strength-medium';
    return 'password-strength-strong';
  };

  /**
   * 获取密码强度文本
   */
  const getPasswordStrengthText = (): string => {
    if (passwordStrength.score === 0) return '';
    if (passwordStrength.score <= 2) return '弱';
    if (passwordStrength.score === 3) return '中等';
    return '强';
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
          注册新账户，开始使用便签管理系统
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        {/* 用户名输入 */}
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            用户名
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <User size={20} />
            </div>
            <input
              {...register('username')}
              type="text"
              id="username"
              className={`form-input ${errors.username ? 'form-input-error' : ''}`}
              placeholder="请输入用户名"
              autoComplete="username"
              disabled={isFormLoading}
            />
          </div>
          {errors.username && (
            <span className="form-error">{errors.username.message}</span>
          )}
        </div>

        {/* 邮箱输入 */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            邮箱地址
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <Mail size={20} />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
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

        {/* 密码输入 */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            密码
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <Lock size={20} />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder="请输入密码"
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
          {watchedPassword && (
            <div className="password-strength">
              <div className={`password-strength-bar ${getPasswordStrengthClass()}`}>
                <div 
                  className="password-strength-fill"
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
              <span className="password-strength-text">
                密码强度: {getPasswordStrengthText()}
              </span>
            </div>
          )}
          
          {/* 密码强度反馈 */}
          {passwordStrength.feedback.length > 0 && (
            <div className="password-feedback">
              {passwordStrength.feedback.map((feedback, index) => (
                <div key={index} className="password-feedback-item">
                  <AlertCircle size={14} />
                  <span>{feedback}</span>
                </div>
              ))}
            </div>
          )}
          
          {errors.password && (
            <span className="form-error">{errors.password.message}</span>
          )}
        </div>

        {/* 确认密码输入 */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            确认密码
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <Lock size={20} />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
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

        {/* 服务条款确认 */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className="checkbox-input"
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
          <div className="form-error-banner">
            <span>{error}</span>
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
              正在注册...
            </>
          ) : (
            <>
              <UserPlus size={20} />
              注册账户
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