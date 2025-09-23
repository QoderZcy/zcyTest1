import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  AuthState, 
  AuthContextType, 
  User, 
  LoginCredentials, 
  RegisterCredentials,
  ResetPasswordRequest,
  AuthError,
  AuthErrorType
} from '../types/auth';
import AuthService from '../services/authService';
import { StorageManager } from '../utils/httpClient';
import { JWTUtils, ErrorUtils } from '../utils/authUtils';

// 认证状态初始值
const initialAuthState: AuthState = {
  // 认证状态
  isAuthenticated: false,
  isInitialized: false,
  
  // 用户信息
  user: null,
  
  // 令牌管理
  token: null,
  refreshToken: null,
  tokenExpiryTime: null,
  
  // UI状态
  loading: true,
  error: null,
  
  // 配置选项
  rememberMe: false,
};

// 认证操作类型
type AuthAction =
  | { type: 'AUTH_INIT_START' }
  | { type: 'AUTH_INIT_SUCCESS'; payload: { user: User; token: string; refreshToken: string; expiryTime: number } }
  | { type: 'AUTH_INIT_COMPLETE' }
  | { type: 'AUTH_LOGIN_START' }
  | { type: 'AUTH_LOGIN_SUCCESS'; payload: { user: User; token: string; refreshToken: string; expiryTime: number; rememberMe: boolean } }
  | { type: 'AUTH_LOGIN_FAILURE'; payload: { error: AuthError } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: { user: Partial<User> } }
  | { type: 'AUTH_SET_LOADING'; payload: { loading: boolean } }
  | { type: 'AUTH_TOKEN_REFRESH'; payload: { token: string; expiryTime: number } };

// 认证状态减速器
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return {
        ...state,
        loading: true,
        error: null,
        isInitialized: false,
      };

    case 'AUTH_INIT_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isInitialized: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        tokenExpiryTime: action.payload.expiryTime,
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
      return {
        ...state,
        isAuthenticated: true,
        isInitialized: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        tokenExpiryTime: action.payload.expiryTime,
        rememberMe: action.payload.rememberMe,
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
        loading: false,
        error: action.payload.error,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialAuthState,
        isInitialized: true,
        loading: false,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload.user } : null,
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

    default:
      return state;
  }
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider组件Props
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider组件
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // 初始化认证状态
  useEffect(() => {
    initializeAuth();
  }, []);

  // 自动刷新令牌
  useEffect(() => {
    if (state.token && state.isAuthenticated) {
      const interval = setInterval(() => {
        checkTokenExpiration();
      }, 60000); // 每分钟检查一次

      return () => clearInterval(interval);
    }
  }, [state.token, state.isAuthenticated]);

  /**
   * 初始化认证状态
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

      // 检查token是否有效
      if (JWTUtils.isTokenExpired(token)) {
        // 尝试刷新token
        try {
          await refreshTokenInternal();
        } catch (error) {
          // 刷新失败，清除所有认证信息
          handleLogout();
          return;
        }
      } else {
        // token有效，获取用户信息
        try {
          const user = await AuthService.getCurrentUser();
          const decoded = JWTUtils.decode(token);
          const expiryTime = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600000;
          
          dispatch({
            type: 'AUTH_INIT_SUCCESS',
            payload: { user, token, refreshToken, expiryTime }
          });
          
          // 设置记住我状态
          if (rememberMe) {
            dispatch({ type: 'AUTH_SET_LOADING', payload: { loading: false } });
            state.rememberMe = true;
          }
        } catch (error) {
          // 获取用户信息失败，可能token无效
          console.error('[AuthContext] 初始化时获取用户信息失败:', error);
          handleLogout();
        }
      }
    } catch (error) {
      console.error('[AuthContext] 初始化认证失败:', error);
      handleLogout();
    } finally {
      dispatch({ type: 'AUTH_INIT_COMPLETE' });
    }
  };

  /**
   * 检查令牌是否即将过期
   */
  const isTokenExpiringSoon = (thresholdSeconds: number = 300): boolean => {
    if (!state.token) return true;
    return JWTUtils.isTokenExpiringSoon(state.token, thresholdSeconds);
  };

  /**
   * 检查令牌过期状态
   */
  const checkTokenExpiration = async (): Promise<void> => {
    if (!state.token || !state.isAuthenticated) return;

    if (JWTUtils.isTokenExpiringSoon(state.token, 300)) { // 5分钟内过期
      try {
        await refreshTokenInternal();
        console.log('[AuthContext] 令牌自动刷新成功');
      } catch (error) {
        console.error('[AuthContext] 自动刷新令牌失败:', error);
        handleLogout();
      }
    }
  };

  /**
   * 内部刷新令牌方法
   */
  const refreshTokenInternal = async (): Promise<void> => {
    const refreshToken = StorageManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('没有可用的刷新令牌');
    }

    const response = await AuthService.refreshToken(refreshToken);
    const rememberMe = StorageManager.getRememberMe();
    
    // 计算令牌过期时间
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
   * 用户登录
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOGIN_START' });

      const response = await AuthService.login(credentials);
      const { user, token, refreshToken, expiresIn } = response;

      // 计算令牌过期时间
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      // 存储令牌
      StorageManager.setToken(token, credentials.rememberMe || false);
      StorageManager.setRefreshToken(refreshToken);
      StorageManager.setRememberMe(credentials.rememberMe || false);

      dispatch({
        type: 'AUTH_LOGIN_SUCCESS',
        payload: { 
          user, 
          token, 
          refreshToken, 
          expiryTime,
          rememberMe: credentials.rememberMe || false
        }
      });
      
      console.log('[AuthContext] 登录成功:', { userId: user.id, email: user.email });
    } catch (error) {
      console.error('[AuthContext] 登录失败:', error);
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
   * 用户注册
   */
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await AuthService.register(credentials);
      const { user, token, refreshToken } = response;

      // 存储令牌
      StorageManager.setToken(token, false); // 注册后默认不记住
      StorageManager.setRefreshToken(refreshToken);
      StorageManager.setRememberMe(false);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token, refreshToken }
      });
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: errorMessage }
      });
      throw error;
    }
  };

  /**
   * 用户登出
   */
  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // 即使API调用失败，也要执行本地登出
    } finally {
      handleLogout();
    }
  };

  /**
   * 处理登出逻辑
   */
  const handleLogout = (): void => {
    StorageManager.clearTokens();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  /**
   * 刷新令牌
   */
  const refreshToken = async (): Promise<void> => {
    await refreshTokenInternal();
  };

  /**
   * 忘记密码
   */
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await AuthService.forgotPassword({ email });
    } catch (error) {
      throw error;
    }
  };

  /**
   * 重置密码
   */
  const resetPassword = async (request: ResetPasswordRequest): Promise<void> => {
    try {
      await AuthService.resetPassword(request);
    } catch (error) {
      throw error;
    }
  };

  /**
   * 清除错误
   */
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  /**
   * 更新用户信息
   */
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await AuthService.updateUser(updates);
      dispatch({
        type: 'AUTH_UPDATE_USER',
        payload: { user: updatedUser }
      });
    } catch (error) {
      throw error;
    }
  };

  // 上下文值
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    clearError,
    updateUser,
    // 新增的方法
    checkTokenExpiration,
    initializeAuth,
    isTokenExpiringSoon,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;