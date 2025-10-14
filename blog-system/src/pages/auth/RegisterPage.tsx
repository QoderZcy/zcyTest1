import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterRequest } from '../../types';
import { isValidEmail, validatePasswordStrength } from '../../utils';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const RegisterPage: React.FC = () => {
  const { register, state: authState } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  
  const passwordStrength = validatePasswordStrength(formData.password);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名不能超过20个字符';
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和中文';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (!passwordStrength.isValid) {
      newErrors.password = '密码强度不够，请按照提示修改';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Show password strength when user starts typing password
    if (name === 'password') {
      setShowPasswordStrength(value.length > 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await register(formData);
      navigate('/', { replace: true });
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : '注册失败，请重试'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return '弱';
    if (score <= 3) return '中';
    return '强';
  };

  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold text-secondary-900">博客系统</span>
            </Link>
            <h2 className="text-3xl font-bold text-secondary-900">
              创建您的账户
            </h2>
            <p className="mt-2 text-sm text-secondary-600">
              已有账户？{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                立即登录
              </Link>
            </p>
          </div>

          {/* Register Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Username Input */}
              <Input
                label="用户名"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                error={errors.username}
                placeholder="请输入您的用户名"
                autoComplete="username"
                fullWidth
              />

              {/* Email Input */}
              <Input
                label="邮箱地址"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                placeholder="请输入您的邮箱地址"
                autoComplete="email"
                fullWidth
              />

              {/* Password Input */}
              <div>
                <Input
                  label="密码"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  placeholder="请输入您的密码"
                  autoComplete="new-password"
                  fullWidth
                />
                
                {/* Password Strength Indicator */}
                {showPasswordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-secondary-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            getPasswordStrengthColor(passwordStrength.score)
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-secondary-600">
                        强度：{getPasswordStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="mt-2">
                        <ul className="text-xs text-secondary-600 space-y-1">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <li key={index} className="flex items-center space-x-1">
                              <span className="text-red-500">•</span>
                              <span>{feedback}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <Input
                label="确认密码"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                fullWidth
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded mt-0.5"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-secondary-900">
                我已阅读并同意{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  服务条款
                </Link>{' '}
                和{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  隐私政策
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? '注册中...' : '创建账户'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-secondary-50 text-secondary-500">或者</span>
              </div>
            </div>

            {/* Social Register (placeholder) */}
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-secondary-300 rounded-md shadow-sm bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 transition-colors duration-200"
                disabled
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.17 1.219-5.17s-.311-.623-.311-1.544c0-1.445.839-2.525 1.883-2.525.888 0 1.317.666 1.317 1.466 0 .893-.568 2.229-.861 3.467-.245 1.04.522 1.888 1.549 1.888 1.859 0 3.285-1.96 3.285-4.789 0-2.503-1.799-4.253-4.37-4.253-2.977 0-4.727 2.234-4.727 4.546 0 .9.347 1.863.781 2.386.085.104.098.195.072.301-.079.33-.254 1.037-.288 1.183-.043.183-.142.223-.328.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.967-.527-2.292-1.155l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.012.001z"/>
                </svg>
                <span className="ml-2">使用第三方账号注册（即将开放）</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;