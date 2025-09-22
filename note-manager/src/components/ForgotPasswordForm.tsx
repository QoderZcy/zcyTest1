import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ValidationUtils } from '../utils/authUtils';

// 忘记密码表单验证架构
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .refine(ValidationUtils.isValidEmail, '请输入有效的邮箱地址'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// 组件Props
interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSwitchToLogin,
  onSwitchToRegister,
}) => {
  const { forgotPassword, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
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
  const onSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    try {
      setIsSubmitting(true);
      clearError();

      await forgotPassword(data.email.trim().toLowerCase());
      
      setSubmittedEmail(data.email.trim().toLowerCase());
      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error('Forgot password failed:', error);
      // 错误已在AuthContext中处理
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 重新发送邮件
   */
  const handleResendEmail = async (): Promise<void> => {
    if (!submittedEmail) return;

    try {
      setIsSubmitting(true);
      clearError();
      
      await forgotPassword(submittedEmail);
    } catch (error) {
      console.error('Resend email failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 重置状态并切换到登录
   */
  const handleSwitchToLogin = (): void => {
    setIsSuccess(false);
    setSubmittedEmail('');
    clearError();
    reset();
    onSwitchToLogin();
  };

  /**
   * 重置状态并切换到注册
   */
  const handleSwitchToRegister = (): void => {
    setIsSuccess(false);
    setSubmittedEmail('');
    clearError();
    reset();
    onSwitchToRegister();
  };

  // 如果成功发送邮件，显示成功页面
  if (isSuccess) {
    return (
      <div className="forgot-password-form">
        <div className="form-header">
          <div className="success-icon">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="form-title">邮件已发送</h2>
          <p className="form-subtitle">
            我们已向 <strong>{submittedEmail}</strong> 发送了密码重置邮件
          </p>
        </div>

        <div className="success-content">
          <div className="success-instructions">
            <h3>接下来要做什么？</h3>
            <ol>
              <li>检查您的邮箱（包括垃圾邮件文件夹）</li>
              <li>点击邮件中的重置密码链接</li>
              <li>设置新密码并完成重置</li>
            </ol>
          </div>

          <div className="success-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleResendEmail}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  重新发送中...
                </>
              ) : (
                <>
                  <Send size={20} />
                  重新发送邮件
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSwitchToLogin}
            >
              <ArrowLeft size={20} />
              返回登录
            </button>
          </div>

          <div className="form-footer">
            <span>没有收到邮件？</span>
            <button
              type="button"
              className="link-button"
              onClick={handleResendEmail}
              disabled={isSubmitting}
            >
              重新发送
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-form">
      <div className="form-header">
        <h2 className="form-title">
          <Mail size={24} />
          忘记密码
        </h2>
        <p className="form-subtitle">
          请输入您的邮箱地址，我们将向您发送密码重置链接
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
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
              placeholder="请输入您注册时使用的邮箱地址"
              autoComplete="email"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          {errors.email && (
            <span className="form-error">{errors.email.message}</span>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="form-error-banner">
            <span>{error}</span>
          </div>
        )}

        {/* 提示信息 */}
        <div className="form-info">
          <p>
            我们会向您的邮箱发送一个安全链接，您可以使用该链接重置密码。
            如果您没有收到邮件，请检查垃圾邮件文件夹。
          </p>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              发送中...
            </>
          ) : (
            <>
              <Send size={20} />
              发送重置邮件
            </>
          )}
        </button>

        {/* 返回登录 */}
        <div className="form-footer">
          <button
            type="button"
            className="link-button"
            onClick={handleSwitchToLogin}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            返回登录
          </button>

          <div className="form-footer-divider">
            <span>还没有账户？</span>
            <button
              type="button"
              className="link-button"
              onClick={handleSwitchToRegister}
              disabled={isSubmitting}
            >
              立即注册
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;