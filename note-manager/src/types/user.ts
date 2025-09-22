// 用户相关的 TypeScript 类型定义

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// 模拟用户数据（在真实应用中这些数据应该来自后端）
export const DEMO_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    email: 'user@example.com',
  },
  {
    id: '3',
    username: 'test',
    password: 'test123',
    email: 'test@example.com',
  },
] as const;

export type DemoUser = typeof DEMO_USERS[number];