import React, { useState, useEffect } from 'react';
import { StickyNote, ArrowLeft } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { AuthMode } from '../types/auth';

// 组件Props
interface AuthPageProps {
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onAuthSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = AuthMode.LOGIN,
  onModeChange,
  onAuthSuccess,
}) => {
  const [currentMode, setCurrentMode] = useState<AuthMode>(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * 切换认证模式
   */
  const switchMode = async (mode: AuthMode): Promise<void> => {
    if (mode === currentMode) return;
    
    setIsTransitioning(true);
    
    // 模拟切换动画延迟
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setCurrentMode(mode);
    onModeChange?.(mode);
    
    // 动画结束
    setTimeout(() => setIsTransitioning(false), 150);
  };

  /**
   * 切换到登录模式
   */
  const switchToLogin = (): void => {
    switchMode(AuthMode.LOGIN);
  };

  /**
   * 切换到注册模式
   */
  const switchToRegister = (): void => {
    switchMode(AuthMode.REGISTER);
  };

  /**
   * 切换到忘记密码模式
   */
  const switchToForgotPassword = (): void => {
    switchMode(AuthMode.FORGOT_PASSWORD);
  };

  /**
   * 处理认证成功
   */
  const handleAuthSuccess = (): void => {
    console.log('[AuthPage] 认证成功');
    onAuthSuccess?.();
  };

  /**
   * 获取页面标题
   */
  const getPageTitle = (): string => {
    switch (currentMode) {
      case AuthMode.LOGIN:
        return '登录';
      case AuthMode.REGISTER:
        return '注册';
      case AuthMode.FORGOT_PASSWORD:
        return '忘记密码';
      case AuthMode.RESET_PASSWORD:
        return '重置密码';
      default:
        return '认证';
    }
  };

  /**
   * 渲染当前模式的表单
   */
  const renderCurrentForm = (): React.ReactNode => {
    if (isTransitioning) {
      return (
        <div className="auth-form-loading">
          <div className="loading-spinner"></div>
        </div>
      );
    }

    switch (currentMode) {
      case AuthMode.LOGIN:
        return (
          <LoginForm
            onSwitchToRegister={switchToRegister}
            onForgotPassword={switchToForgotPassword}
          />
        );
      
      case AuthMode.REGISTER:
        return (
          <RegisterForm
            onSwitchToLogin={switchToLogin}
            onRegistrationSuccess={handleAuthSuccess}
          />
        );
      
      case AuthMode.FORGOT_PASSWORD:
        return (
          <ForgotPasswordForm
            onSwitchToLogin={switchToLogin}
            onSwitchToRegister={switchToRegister}
          />
        );
      
      default:
        return (
          <LoginForm
            onSwitchToRegister={switchToRegister}
            onForgotPassword={switchToForgotPassword}
          />
        );
    }
  };

  return (
    <div className="auth-page">
      {/* 背景装饰 */}
      <div className="auth-background">
        <div className="auth-background-pattern"></div>
      </div>

      {/* 主要内容 */}
      <div className="auth-container">
        {/* 侧边栏 - 品牌介绍 */}
        <div className="auth-sidebar">
          <div className="brand-section">
            <div className="brand-header">
              <StickyNote size={48} className="brand-icon" />
              <h1 className="brand-title">便签管理系统</h1>
            </div>
            
            <div className="brand-description">
              <h2>让想法井然有序</h2>
              <p>
                记录灵感、整理思路、管理任务。
                我们为您提供简洁高效的便签管理体验，
                让您的创意永不丢失。
              </p>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">📝</div>
                <div className="feature-content">
                  <h3>简洁编辑</h3>
                  <p>简单直观的编辑界面，专注内容创作</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🏷️</div>
                <div className="feature-content">
                  <h3>智能标签</h3>
                  <p>灵活的标签系统，快速分类和查找</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">☁️</div>
                <div className="feature-content">
                  <h3>云端同步</h3>
                  <p>多设备同步，随时随地访问您的便签</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-content">
                  <h3>安全可靠</h3>
                  <p>数据加密存储，隐私安全有保障</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 表单区域 */}
        <div className="auth-main">
          <div className="auth-form-container">
            {/* 返回按钮 */}
            {currentMode !== AuthMode.LOGIN && (
              <button
                className="auth-back-button"
                onClick={switchToLogin}
                aria-label="返回登录"
              >
                <ArrowLeft size={20} />
                返回登录
              </button>
            )}

            {/* 表单内容 */}
            <div className="auth-form-wrapper">
              {renderCurrentForm()}
            </div>

            {/* 页面底部信息 */}
            <div className="auth-footer">
              <p className="auth-footer-text">
                使用本服务即表示您同意我们的
                <button type="button" className="link-button inline">
                  服务条款
                </button>
                和
                <button type="button" className="link-button inline">
                  隐私政策
                </button>
              </p>
              
              <p className="auth-footer-copyright">
                © 2024 便签管理系统. 保留所有权利.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;