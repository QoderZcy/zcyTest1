import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthPage } from './AuthPage';
import { AuthMode } from '../types/auth';
import { Loader2 } from 'lucide-react';

// AuthGuard组件Props
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  redirectTo?: AuthMode;
}

// 加载组件
const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="loading-content">
          <Loader2 size={48} className="animate-spin loading-spinner" />
          <h2>正在加载...</h2>
          <p>请稍候，正在验证您的身份</p>
        </div>
      </div>
    </div>
  );
};

/**
 * AuthGuard组件 - 认证路由保护
 * 
 * @param children 需要保护的子组件
 * @param fallback 自定义的未认证时显示的组件
 * @param requireAuth 是否需要认证才能访问（默认为true）
 * @param redirectTo 未认证时重定向到的认证模式
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
  redirectTo = AuthMode.LOGIN,
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  // 如果正在加载认证状态，显示加载页面
  if (loading) {
    return <LoadingScreen />;
  }

  // 如果不需要认证，直接显示子组件
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 如果需要认证但用户未认证，显示认证页面
  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <AuthPage initialMode={redirectTo} />;
  }

  // 用户已认证，显示子组件
  return <>{children}</>;
};

// 反向保护组件 - 用于保护认证页面，已登录用户不应看到
interface PublicOnlyGuardProps {
  children: ReactNode;
  redirectTo?: ReactNode;
}

/**
 * PublicOnlyGuard组件 - 公开页面保护
 * 用于保护认证页面等，已登录用户访问时会重定向
 * 
 * @param children 需要保护的子组件（如登录页面）
 * @param redirectTo 已认证时重定向到的组件
 */
export const PublicOnlyGuard: React.FC<PublicOnlyGuardProps> = ({
  children,
  redirectTo,
}) => {
  const { isAuthenticated, loading } = useAuth();

  // 如果正在加载认证状态，显示加载页面
  if (loading) {
    return <LoadingScreen />;
  }

  // 如果用户已认证，重定向到指定页面
  if (isAuthenticated) {
    if (redirectTo) {
      return <>{redirectTo}</>;
    }
    
    // 默认重定向到主应用
    return <div>Redirecting to main app...</div>;
  }

  // 用户未认证，显示子组件
  return <>{children}</>;
};

// 基于角色的保护组件
interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallback?: ReactNode;
  userRole?: string;
}

/**
 * RoleGuard组件 - 基于角色的保护（预留扩展）
 * 
 * @param children 需要保护的子组件
 * @param allowedRoles 允许访问的角色列表
 * @param fallback 无权限时显示的组件
 * @param userRole 用户角色（可从用户信息中获取）
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = [],
  fallback,
  userRole,
}) => {
  const { user, isAuthenticated, loading } = useAuth();

  // 如果正在加载认证状态，显示加载页面
  if (loading) {
    return <LoadingScreen />;
  }

  // 如果未认证，显示认证页面
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  // 如果没有指定角色要求，允许访问
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // 检查用户角色
  const currentUserRole = userRole || user.preferences?.role || 'user';
  
  if (!allowedRoles.includes(currentUserRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="access-denied">
        <h2>访问被拒绝</h2>
        <p>您没有权限访问此页面</p>
      </div>
    );
  }

  // 用户有权限，显示子组件
  return <>{children}</>;
};

// 条件保护组件
interface ConditionalGuardProps {
  children: ReactNode;
  condition: boolean | ((user: any) => boolean);
  fallback?: ReactNode;
  loading?: boolean;
}

/**
 * ConditionalGuard组件 - 基于条件的保护
 * 
 * @param children 需要保护的子组件
 * @param condition 访问条件（布尔值或函数）
 * @param fallback 条件不满足时显示的组件
 * @param loading 是否在加载中
 */
export const ConditionalGuard: React.FC<ConditionalGuardProps> = ({
  children,
  condition,
  fallback,
  loading = false,
}) => {
  const { user, isAuthenticated } = useAuth();

  // 如果正在加载，显示加载页面
  if (loading) {
    return <LoadingScreen />;
  }

  // 如果未认证，显示认证页面
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  // 检查条件
  const isConditionMet = typeof condition === 'function' 
    ? condition(user) 
    : condition;

  if (!isConditionMet) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="condition-not-met">
        <h2>条件不满足</h2>
        <p>您需要满足特定条件才能访问此页面</p>
      </div>
    );
  }

  // 条件满足，显示子组件
  return <>{children}</>;
};

export default AuthGuard;