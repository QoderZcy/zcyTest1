// Permission-based route guards and components

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { UserRole, Permission } from '../../types/blog/user';
import { PermissionUtils } from '../../utils/blog/permissions';

// Route guard props
interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// Permission-based route guard props
interface PermissionGuardProps extends RouteGuardProps {
  permissions?: Permission[];
  roles?: UserRole[];
  requireAll?: boolean; // true = all permissions/roles required, false = any one required
  resourceContext?: {
    type: string;
    id?: string;
    ownerId?: string;
  };
}

/**
 * Basic authentication guard - requires user to be logged in
 */
export const AuthGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  fallback = null, 
  redirectTo = '/auth/login' 
}) => {
  const { isAuthenticated, isInitialized, loading } = useBlogAuth();
  const location = useLocation();

  // Show loading while initializing
  if (!isInitialized || loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

/**
 * Guest guard - only allows unauthenticated users
 */
export const GuestGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  fallback = null, 
  redirectTo = '/dashboard' 
}) => {
  const { isAuthenticated, isInitialized, loading } = useBlogAuth();

  // Show loading while initializing
  if (!isInitialized || loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate to={redirectTo} replace />
    );
  }

  return <>{children}</>;
};

/**
 * Role-based guard - requires specific roles
 */
export const RoleGuard: React.FC<{
  children: React.ReactNode;
  roles: UserRole[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}> = ({ 
  children, 
  roles, 
  requireAll = false, 
  fallback = null, 
  redirectTo = '/unauthorized' 
}) => {
  const { user, isAuthenticated, isInitialized, loading } = useBlogAuth();

  // Show loading while initializing
  if (!isInitialized || loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // Must be authenticated first
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check role requirements
  const hasRequiredRole = requireAll
    ? roles.every(role => user.role === role) // Must have all roles (unlikely but possible)
    : roles.includes(user.role); // Must have at least one role

  if (!hasRequiredRole) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate to={redirectTo} replace />
    );
  }

  return <>{children}</>;
};

/**
 * Permission-based guard - requires specific permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  permissions = [],
  roles = [],
  requireAll = false,
  resourceContext,
  fallback = null, 
  redirectTo = '/unauthorized' 
}) => {
  const { user, isAuthenticated, isInitialized, loading } = useBlogAuth();

  // Show loading while initializing
  if (!isInitialized || loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // Must be authenticated first (unless checking guest permissions)
  if (!isAuthenticated && !permissions.every(p => PermissionUtils.hasPermission(null, p))) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check role requirements
  if (roles.length > 0) {
    const hasRequiredRole = requireAll
      ? roles.every(role => user?.role === role)
      : PermissionUtils.hasAnyRole(user, roles);

    if (!hasRequiredRole) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <Navigate to={redirectTo} replace />
      );
    }
  }

  // Check permission requirements
  if (permissions.length > 0) {
    const context = resourceContext ? {
      user,
      resource: {
        type: resourceContext.type,
        id: resourceContext.id || '',
        ownerId: resourceContext.ownerId
      }
    } : undefined;

    const hasRequiredPermissions = requireAll
      ? PermissionUtils.hasAllPermissions(user, permissions, context)
      : PermissionUtils.hasAnyPermission(user, permissions, context);

    if (!hasRequiredPermissions) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <Navigate to={redirectTo} replace />
      );
    }
  }

  return <>{children}</>;
};

/**
 * Author guard - requires author role or higher
 */
export const AuthorGuard: React.FC<RouteGuardProps> = ({ children, fallback, redirectTo }) => (
  <RoleGuard 
    roles={[UserRole.AUTHOR, UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}
    fallback={fallback}
    redirectTo={redirectTo}
  >
    {children}
  </RoleGuard>
);

/**
 * Editor guard - requires editor role or higher
 */
export const EditorGuard: React.FC<RouteGuardProps> = ({ children, fallback, redirectTo }) => (
  <RoleGuard 
    roles={[UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}
    fallback={fallback}
    redirectTo={redirectTo}
  >
    {children}
  </RoleGuard>
);

/**
 * Admin guard - requires admin role or higher
 */
export const AdminGuard: React.FC<RouteGuardProps> = ({ children, fallback, redirectTo }) => (
  <RoleGuard 
    roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
    fallback={fallback}
    redirectTo={redirectTo}
  >
    {children}
  </RoleGuard>
);

/**
 * Super Admin guard - requires super admin role
 */
export const SuperAdminGuard: React.FC<RouteGuardProps> = ({ children, fallback, redirectTo }) => (
  <RoleGuard 
    roles={[UserRole.SUPER_ADMIN]}
    fallback={fallback}
    redirectTo={redirectTo}
  >
    {children}
  </RoleGuard>
);

/**
 * Content owner guard - allows access if user owns the content or has sufficient permissions
 */
export const ContentOwnerGuard: React.FC<{
  children: React.ReactNode;
  resourceType: 'post' | 'comment' | 'user';
  resourceId: string;
  ownerId: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowModerators?: boolean;
}> = ({ 
  children, 
  resourceType,
  resourceId,
  ownerId,
  fallback = null, 
  redirectTo = '/unauthorized',
  allowModerators = true
}) => {
  const { user, isAuthenticated, isInitialized, loading } = useBlogAuth();

  // Show loading while initializing
  if (!isInitialized || loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // Must be authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user owns the resource
  const isOwner = user.id === ownerId;

  // Check if user has moderation permissions (if allowed)
  const canModerate = allowModerators && PermissionUtils.canModerateContent(user);

  // Check if user has admin permissions
  const isAdmin = PermissionUtils.hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  if (!isOwner && !canModerate && !isAdmin) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate to={redirectTo} replace />
    );
  }

  return <>{children}</>;
};

/**
 * Conditional render component based on permissions
 */
export const PermissionRenderer: React.FC<{
  children: React.ReactNode;
  permissions?: Permission[];
  roles?: UserRole[];
  requireAll?: boolean;
  resourceContext?: {
    type: string;
    id?: string;
    ownerId?: string;
  };
  fallback?: React.ReactNode;
}> = ({ 
  children, 
  permissions = [],
  roles = [],
  requireAll = false,
  resourceContext,
  fallback = null
}) => {
  const { user } = useBlogAuth();

  // Check role requirements
  if (roles.length > 0) {
    const hasRequiredRole = requireAll
      ? roles.every(role => user?.role === role)
      : PermissionUtils.hasAnyRole(user, roles);

    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (permissions.length > 0) {
    const context = resourceContext ? {
      user,
      resource: {
        type: resourceContext.type,
        id: resourceContext.id || '',
        ownerId: resourceContext.ownerId
      }
    } : undefined;

    const hasRequiredPermissions = requireAll
      ? PermissionUtils.hasAllPermissions(user, permissions, context)
      : PermissionUtils.hasAnyPermission(user, permissions, context);

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Hook for conditional rendering based on permissions
 */
export const usePermissionCheck = (
  permissions: Permission[] = [],
  roles: UserRole[] = [],
  requireAll: boolean = false,
  resourceContext?: {
    type: string;
    id?: string;
    ownerId?: string;
  }
) => {
  const { user } = useBlogAuth();

  // Check role requirements
  const hasRequiredRole = roles.length === 0 || (
    requireAll
      ? roles.every(role => user?.role === role)
      : PermissionUtils.hasAnyRole(user, roles)
  );

  // Check permission requirements
  const context = resourceContext ? {
    user,
    resource: {
      type: resourceContext.type,
      id: resourceContext.id || '',
      ownerId: resourceContext.ownerId
    }
  } : undefined;

  const hasRequiredPermissions = permissions.length === 0 || (
    requireAll
      ? PermissionUtils.hasAllPermissions(user, permissions, context)
      : PermissionUtils.hasAnyPermission(user, permissions, context)
  );

  return hasRequiredRole && hasRequiredPermissions;
};

/**
 * Component that shows different content based on user role
 */
export const RoleBasedRenderer: React.FC<{
  user?: React.ReactNode;
  author?: React.ReactNode;
  editor?: React.ReactNode;
  admin?: React.ReactNode;
  superAdmin?: React.ReactNode;
  guest?: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ user, author, editor, admin, superAdmin, guest, fallback = null }) => {
  const { user: currentUser, isAuthenticated } = useBlogAuth();

  if (!isAuthenticated || !currentUser) {
    return <>{guest || fallback}</>;
  }

  switch (currentUser.role) {
    case UserRole.SUPER_ADMIN:
      return <>{superAdmin || admin || editor || author || user || fallback}</>;
    case UserRole.ADMIN:
      return <>{admin || editor || author || user || fallback}</>;
    case UserRole.EDITOR:
      return <>{editor || author || user || fallback}</>;
    case UserRole.AUTHOR:
      return <>{author || user || fallback}</>;
    case UserRole.READER:
      return <>{user || fallback}</>;
    default:
      return <>{guest || fallback}</>;
  }
};