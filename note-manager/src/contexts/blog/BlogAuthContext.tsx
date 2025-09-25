import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  BlogUser, 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS,
  PermissionContext,
  PermissionResult,
  UserPreferences 
} from '../../types/blog/user';
import { 
  AuthState, 
  LoginCredentials, 
  RegisterCredentials,
  ResetPasswordRequest,
  AuthError,
  AuthErrorType
} from '../../types/auth';
import AuthService from '../../services/authService';
import { StorageManager } from '../../utils/httpClient';
import { JWTUtils, ErrorUtils } from '../../utils/authUtils';

// Enhanced auth state for blog functionality
interface BlogAuthState extends Omit<AuthState, 'user'> {
  user: BlogUser | null;
  permissions: Permission[];
  role: UserRole;
}

// Enhanced auth context type
interface BlogAuthContextType extends BlogAuthState {
  // Basic auth methods
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (request: ResetPasswordRequest) => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<BlogUser>) => Promise<void>;
  
  // Enhanced auth methods
  checkTokenExpiration: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  isTokenExpiringSoon: (thresholdSeconds?: number) => boolean;
  
  // Permission methods
  hasPermission: (permission: Permission, context?: PermissionContext) => boolean;
  hasAnyPermission: (permissions: Permission[], context?: PermissionContext) => boolean;
  hasAllPermissions: (permissions: Permission[], context?: PermissionContext) => boolean;
  checkPermission: (permission: Permission, context?: PermissionContext) => PermissionResult;
  canAccessResource: (resourceType: string, resourceId?: string, action?: string) => boolean;
  
  // Role methods
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isRole: (role: UserRole) => boolean;
  canManageUser: (targetUserId: string) => boolean;
  canModerateContent: () => boolean;
  
  // User preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

// Initial state with blog-specific defaults
const initialBlogAuthState: BlogAuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  token: null,
  refreshToken: null,
  tokenExpiryTime: null,
  loading: true,
  error: null,
  rememberMe: false,
  permissions: ROLE_PERMISSIONS[UserRole.GUEST],
  role: UserRole.GUEST,
};

// Enhanced auth actions
type BlogAuthAction =
  | { type: 'AUTH_INIT_START' }
  | { type: 'AUTH_INIT_SUCCESS'; payload: { user: BlogUser; token: string; refreshToken: string; expiryTime: number } }
  | { type: 'AUTH_INIT_COMPLETE' }
  | { type: 'AUTH_LOGIN_START' }
  | { type: 'AUTH_LOGIN_SUCCESS'; payload: { user: BlogUser; token: string; refreshToken: string; expiryTime: number; rememberMe: boolean } }
  | { type: 'AUTH_LOGIN_FAILURE'; payload: { error: AuthError } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: { user: Partial<BlogUser> } }
  | { type: 'AUTH_SET_LOADING'; payload: { loading: boolean } }
  | { type: 'AUTH_TOKEN_REFRESH'; payload: { token: string; expiryTime: number } }
  | { type: 'AUTH_UPDATE_PERMISSIONS'; payload: { permissions: Permission[]; role: UserRole } }
  | { type: 'AUTH_UPDATE_PREFERENCES'; payload: { preferences: UserPreferences } };

// Enhanced reducer with permission handling
function blogAuthReducer(state: BlogAuthState, action: BlogAuthAction): BlogAuthState {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return {
        ...state,
        loading: true,
        error: null,
        isInitialized: false,
      };

    case 'AUTH_INIT_SUCCESS':
      const initPermissions = ROLE_PERMISSIONS[action.payload.user.role] || ROLE_PERMISSIONS[UserRole.GUEST];
      return {
        ...state,
        isAuthenticated: true,
        isInitialized: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        tokenExpiryTime: action.payload.expiryTime,
        role: action.payload.user.role,
        permissions: initPermissions,
        loading: false,
        error: null,
      };

    case 'AUTH_INIT_COMPLETE':
      return {
        ...state,
        isInitialized: true,
        loading: false,
      };

    case 'AUTH_LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'AUTH_LOGIN_SUCCESS':
      const loginPermissions = ROLE_PERMISSIONS[action.payload.user.role] || ROLE_PERMISSIONS[UserRole.GUEST];
      return {
        ...state,
        isAuthenticated: true,
        isInitialized: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        tokenExpiryTime: action.payload.expiryTime,
        rememberMe: action.payload.rememberMe,
        role: action.payload.user.role,
        permissions: loginPermissions,
        loading: false,
        error: null,
      };

    case 'AUTH_LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        tokenExpiryTime: null,
        role: UserRole.GUEST,
        permissions: ROLE_PERMISSIONS[UserRole.GUEST],
        loading: false,
        error: action.payload.error,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialBlogAuthState,
        isInitialized: true,
        loading: false,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_UPDATE_USER':
      const updatedUser = state.user ? { ...state.user, ...action.payload.user } : null;
      const newRole = updatedUser?.role || state.role;
      const updatedPermissions = newRole !== state.role ? ROLE_PERMISSIONS[newRole] : state.permissions;
      
      return {
        ...state,
        user: updatedUser,
        role: newRole,
        permissions: updatedPermissions,
      };

    case 'AUTH_SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading,
      };

    case 'AUTH_TOKEN_REFRESH':
      return {
        ...state,
        token: action.payload.token,
        tokenExpiryTime: action.payload.expiryTime,
      };

    case 'AUTH_UPDATE_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload.permissions,
        role: action.payload.role,
      };

    case 'AUTH_UPDATE_PREFERENCES':
      return {
        ...state,
        user: state.user ? { ...state.user, preferences: action.payload.preferences } : null,
      };

    default:
      return state;
  }
}

// Create the enhanced blog auth context
const BlogAuthContext = createContext<BlogAuthContextType | null>(null);

// BlogAuthProvider component props
interface BlogAuthProviderProps {
  children: ReactNode;
}

// Enhanced BlogAuthProvider component
export const BlogAuthProvider: React.FC<BlogAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(blogAuthReducer, initialBlogAuthState);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Auto refresh token
  useEffect(() => {
    if (state.token && state.isAuthenticated) {
      const interval = setInterval(() => {
        checkTokenExpiration();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [state.token, state.isAuthenticated]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_INIT_START' });

      const token = StorageManager.getToken();
      const refreshToken = StorageManager.getRefreshToken();
      const rememberMe = StorageManager.getRememberMe();

      if (!token || !refreshToken) {
        dispatch({ type: 'AUTH_INIT_COMPLETE' });
        return;
      }

      if (JWTUtils.isTokenExpired(token)) {
        try {
          await refreshTokenInternal();
        } catch (error) {
          handleLogout();
          return;
        }
      } else {
        try {
          const user = await AuthService.getCurrentUser() as BlogUser;
          const decoded = JWTUtils.decode(token);
          const expiryTime = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600000;
          
          dispatch({
            type: 'AUTH_INIT_SUCCESS',
            payload: { user, token, refreshToken, expiryTime }
          });
          
          if (rememberMe) {
            dispatch({ type: 'AUTH_SET_LOADING', payload: { loading: false } });
          }
        } catch (error) {
          console.error('[BlogAuthContext] Failed to get user info during init:', error);
          handleLogout();
        }
      }
    } catch (error) {
      console.error('[BlogAuthContext] Failed to initialize auth:', error);
      handleLogout();
    } finally {
      dispatch({ type: 'AUTH_INIT_COMPLETE' });
    }
  };

  /**
   * Check if token is expiring soon
   */
  const isTokenExpiringSoon = (thresholdSeconds: number = 300): boolean => {
    if (!state.token) return true;
    return JWTUtils.isTokenExpiringSoon(state.token, thresholdSeconds);
  };

  /**
   * Check token expiration and refresh if needed
   */
  const checkTokenExpiration = async (): Promise<void> => {
    if (!state.token || !state.isAuthenticated) return;

    if (JWTUtils.isTokenExpiringSoon(state.token, 300)) {
      try {
        await refreshTokenInternal();
        console.log('[BlogAuthContext] Token auto-refreshed successfully');
      } catch (error) {
        console.error('[BlogAuthContext] Auto token refresh failed:', error);
        handleLogout();
      }
    }
  };

  /**
   * Internal token refresh method
   */
  const refreshTokenInternal = async (): Promise<void> => {
    const refreshToken = StorageManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await AuthService.refreshToken(refreshToken);
    const rememberMe = StorageManager.getRememberMe();
    
    const decoded = JWTUtils.decode(response.token);
    const expiryTime = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600000;
    
    StorageManager.setToken(response.token, rememberMe);
    dispatch({ 
      type: 'AUTH_TOKEN_REFRESH', 
      payload: { 
        token: response.token,
        expiryTime 
      } 
    });
  };

  /**
   * User login with enhanced blog user support
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOGIN_START' });

      const response = await AuthService.login(credentials);
      const { user, token, refreshToken, expiresIn } = response;
      
      // Cast to BlogUser (assuming API returns blog user data)
      const blogUser = user as BlogUser;

      const expiryTime = Date.now() + (expiresIn * 1000);
      
      StorageManager.setToken(token, credentials.rememberMe || false);
      StorageManager.setRefreshToken(refreshToken);
      StorageManager.setRememberMe(credentials.rememberMe || false);

      dispatch({
        type: 'AUTH_LOGIN_SUCCESS',
        payload: { 
          user: blogUser, 
          token, 
          refreshToken, 
          expiryTime,
          rememberMe: credentials.rememberMe || false
        }
      });
      
      console.log('[BlogAuthContext] Login successful:', { 
        userId: blogUser.id, 
        email: blogUser.email,
        role: blogUser.role 
      });
    } catch (error) {
      console.error('[BlogAuthContext] Login failed:', error);
      const authError: AuthError = {
        type: error.type || AuthErrorType.SERVER_ERROR,
        message: ErrorUtils.getErrorMessage(error),
        details: error.details
      };
      
      dispatch({
        type: 'AUTH_LOGIN_FAILURE',
        payload: { error: authError }
      });
      throw error;
    }
  };

  /**
   * User registration
   */
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOGIN_START' });

      const response = await AuthService.register(credentials);
      const { user, token, refreshToken, expiresIn } = response;
      
      const blogUser = user as BlogUser;
      const expiryTime = Date.now() + (expiresIn * 1000);

      StorageManager.setToken(token, false);
      StorageManager.setRefreshToken(refreshToken);
      StorageManager.setRememberMe(false);

      dispatch({
        type: 'AUTH_LOGIN_SUCCESS',
        payload: { 
          user: blogUser, 
          token, 
          refreshToken, 
          expiryTime,
          rememberMe: false 
        }
      });
    } catch (error) {
      const authError: AuthError = {
        type: error.type || AuthErrorType.SERVER_ERROR,
        message: ErrorUtils.getErrorMessage(error),
        details: error.details
      };
      
      dispatch({
        type: 'AUTH_LOGIN_FAILURE',
        payload: { error: authError }
      });
      throw error;
    }
  };

  /**
   * User logout
   */
  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      handleLogout();
    }
  };

  /**
   * Handle logout logic
   */
  const handleLogout = (): void => {
    StorageManager.clearTokens();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  /**
   * Refresh token
   */
  const refreshToken = async (): Promise<void> => {
    await refreshTokenInternal();
  };

  /**
   * Forgot password
   */
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await AuthService.forgotPassword({ email });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (request: ResetPasswordRequest): Promise<void> => {
    try {
      await AuthService.resetPassword(request);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Clear error
   */
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  /**
   * Update user information
   */
  const updateUser = async (updates: Partial<BlogUser>): Promise<void> => {
    try {
      const updatedUser = await AuthService.updateUser(updates) as BlogUser;
      dispatch({
        type: 'AUTH_UPDATE_USER',
        payload: { user: updatedUser }
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update user preferences
   */
  const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<void> => {
    if (!state.user) return;

    try {
      const updatedPreferences = { ...state.user.preferences, ...preferences };
      await updateUser({ preferences: updatedPreferences });
      
      dispatch({
        type: 'AUTH_UPDATE_PREFERENCES',
        payload: { preferences: updatedPreferences }
      });
    } catch (error) {
      throw error;
    }
  };

  // Permission checking methods
  const hasPermission = (permission: Permission, context?: PermissionContext): boolean => {
    // Guest users only have guest permissions
    if (!state.isAuthenticated) {
      return ROLE_PERMISSIONS[UserRole.GUEST].includes(permission);
    }

    // Check base role permissions
    if (!state.permissions.includes(permission)) {
      return false;
    }

    // Additional context-based checks
    if (context?.resource) {
      const { type, ownerId } = context.resource;
      
      // Owner-specific permissions
      if (ownerId && state.user?.id === ownerId) {
        const ownerPermissions = [
          Permission.EDIT_OWN_POSTS,
          Permission.DELETE_OWN_POSTS,
          Permission.EDIT_OWN_COMMENTS,
          Permission.DELETE_OWN_COMMENTS
        ];
        
        if (ownerPermissions.includes(permission)) {
          return true;
        }
      }

      // Resource type specific checks can be added here
    }

    return true;
  };

  const hasAnyPermission = (permissions: Permission[], context?: PermissionContext): boolean => {
    return permissions.some(permission => hasPermission(permission, context));
  };

  const hasAllPermissions = (permissions: Permission[], context?: PermissionContext): boolean => {
    return permissions.every(permission => hasPermission(permission, context));
  };

  const checkPermission = (permission: Permission, context?: PermissionContext): PermissionResult => {
    const allowed = hasPermission(permission, context);
    
    if (!allowed) {
      // Determine required role for this permission
      const requiredRole = Object.entries(ROLE_PERMISSIONS).find(([_, perms]) => 
        perms.includes(permission)
      )?.[0] as UserRole;

      return {
        allowed: false,
        reason: `Permission ${permission} requires role ${requiredRole || 'unknown'}`,
        requiredRole,
        requiredPermissions: [permission]
      };
    }

    return { allowed: true };
  };

  const canAccessResource = (resourceType: string, resourceId?: string, action?: string): boolean => {
    // This would implement resource-specific access control
    // For now, return basic permission check
    return state.isAuthenticated;
  };

  // Role checking methods
  const hasRole = (role: UserRole): boolean => {
    return state.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(state.role);
  };

  const isRole = (role: UserRole): boolean => {
    return hasRole(role);
  };

  const canManageUser = (targetUserId: string): boolean => {
    if (!state.user) return false;
    
    // Users can manage themselves
    if (state.user.id === targetUserId) return true;
    
    // Admins can manage most users
    if (hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])) return true;
    
    return false;
  };

  const canModerateContent = (): boolean => {
    return hasAnyRole([UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  };

  // Context value
  const contextValue: BlogAuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    clearError,
    updateUser,
    checkTokenExpiration,
    initializeAuth,
    isTokenExpiringSoon,
    updatePreferences,
    
    // Permission methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    canAccessResource,
    
    // Role methods
    hasRole,
    hasAnyRole,
    isRole,
    canManageUser,
    canModerateContent,
  };

  return (
    <BlogAuthContext.Provider value={contextValue}>
      {children}
    </BlogAuthContext.Provider>
  );
};

// Hook to use the enhanced blog auth context
export const useBlogAuth = (): BlogAuthContextType => {
  const context = useContext(BlogAuthContext);
  if (!context) {
    throw new Error('useBlogAuth must be used within a BlogAuthProvider');
  }
  return context;
};

export default BlogAuthContext;