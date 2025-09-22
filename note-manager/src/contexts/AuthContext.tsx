import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, LoginCredentials, AuthState, AuthContextType, DEMO_USERS } from '../types/user';
import { DEMO_USERS as demoUsers } from '../types/user';

// localStorage 键名
const AUTH_STORAGE_KEY = 'notes-app-auth';

// 认证状态的 reducer 动作类型
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
};

// 认证状态 reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// 从 localStorage 加载认证状态
const loadAuthFromStorage = (): User | null => {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    
    const user = JSON.parse(data);
    return {
      ...user,
      createdAt: new Date(user.createdAt),
      lastLoginAt: new Date(user.lastLoginAt),
    };
  } catch (error) {
    console.error('Error loading auth from storage:', error);
    return null;
  }
};

// 保存认证状态到 localStorage
const saveAuthToStorage = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving auth to storage:', error);
  }
};

// 模拟登录 API 调用
const authenticateUser = async (credentials: LoginCredentials): Promise<User> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const demoUser = demoUsers.find(
    user => user.username === credentials.username && user.password === credentials.password
  );
  
  if (!demoUser) {
    throw new Error('用户名或密码错误');
  }
  
  // 返回用户信息（不包含密码）
  return {
    id: demoUser.id,
    username: demoUser.username,
    email: demoUser.email,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
  };
};

// 创建认证上下文
const AuthContext = createContext<AuthContextType | null>(null);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 组件挂载时检查本地存储的认证状态
  useEffect(() => {
    const savedUser = loadAuthFromStorage();
    if (savedUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: savedUser });
    }
  }, []);

  // 用户状态变化时保存到本地存储
  useEffect(() => {
    saveAuthToStorage(state.user);
  }, [state.user]);

  // 登录函数
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const user = await authenticateUser(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return false;
    }
  };

  // 登出函数
  const logout = (): void => {
    dispatch({ type: 'LOGOUT' });
  };

  // 清除错误
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的 hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};