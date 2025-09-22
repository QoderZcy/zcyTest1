import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { LoginCredentials } from '../types/user';

export const LoginForm: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // 清除错误信息当用户开始输入时
  useEffect(() => {
    if (error || validationError) {
      clearError();
      setValidationError('');
    }
  }, [credentials, error, clearError]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!credentials.username.trim()) {
      setValidationError('请输入用户名');
      return false;
    }
    if (!credentials.password.trim()) {
      setValidationError('请输入密码');
      return false;
    }
    if (credentials.username.length < 3) {
      setValidationError('用户名至少需要3个字符');
      return false;
    }
    if (credentials.password.length < 6) {
      setValidationError('密码至少需要6个字符');
      return false;
    }
    return true;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await login(credentials);
    if (!success) {
      // 错误信息已经通过 AuthContext 设置
    }
  };

  // 快速登录示例账户
  const handleQuickLogin = (username: string, password: string) => {
    setCredentials({ username, password });
  };

  const displayError = error || validationError;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Lock size={32} />
          </div>
          <h1>登录便签管理系统</h1>
          <p>请使用您的账户登录</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {displayError && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{displayError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="请输入密码"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !credentials.username || !credentials.password}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                登录中...
              </>
            ) : (
              <>
                <LogIn size={18} />
                登录
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-title">演示账户：</div>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              disabled={isLoading}
            >
              管理员 (admin/admin123)
            </button>
            <button
              type="button"
              className="demo-button"
              onClick={() => handleQuickLogin('user', 'user123')}
              disabled={isLoading}
            >
              用户 (user/user123)
            </button>
            <button
              type="button"
              className="demo-button"
              onClick={() => handleQuickLogin('test', 'test123')}
              disabled={isLoading}
            >
              测试 (test/test123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};