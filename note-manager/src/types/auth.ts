// 认证相关的 TypeScript 类型定义

import { UserRole } from './library';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences?: UserPreferences;
  // Library-specific fields
  role: UserRole;
  libraryId?: string;
  memberId?: string; // Link to Member entity for library members
  permissions: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  defaultNoteColor: string;
  // Library-specific preferences
  libraryViewMode: 'grid' | 'list' | 'table';
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    reminderDays: number;
  };
}

export interface AuthState {
  // 认证状态
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // 用户信息
  user: User | null;
  
  // 令牌管理
  token: string | null;
  refreshToken: string | null;
  tokenExpiryTime: number | null;
  
  // UI状态
  loading: boolean;
  error: AuthError | null;
  
  // 配置选项
  rememberMe: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  acceptTerms: boolean;
  // Library-specific registration fields
  role?: UserRole;
  libraryId?: string;
  membershipType?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

// JWT 令牌解析后的内容
export interface JWTPayload {
  sub: string; // 用户 ID
  email: string;
  username: string;
  role: UserRole;
  libraryId?: string;
  permissions: string[];
  iat: number; // 签发时间
  exp: number; // 过期时间
}

// 认证错误类型
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, any>;
}

// 认证模式类型
export enum AuthMode {
  LOGIN = 'login',
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgot-password',
  RESET_PASSWORD = 'reset-password',
}

// 认证状态流转类型
export enum AuthStateType {
  IDLE = 'idle',
  LOADING = 'loading',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error',
}

// 存储策略
export enum StorageType {
  SESSION = 'session',
  LOCAL = 'local',
  MEMORY = 'memory',
}

// 认证配置
export interface AuthConfig {
  tokenStorageType: StorageType;
  refreshTokenStorageType: StorageType;
  autoRefresh: boolean;
  refreshThreshold: number; // 令牌过期前多少秒开始刷新
  maxRetries: number;
  baseURL: string;
  rememberMeDuration: number; // 记住我持续时间（天）
}

// 用户会话信息
export interface UserSession {
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
  };
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

// 认证上下文的操作类型
export interface AuthContextActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (request: ResetPasswordRequest) => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// 完整的认证上下文类型
export interface AuthContextType extends AuthState, AuthContextActions {
  // 额外的认证上下文方法
  checkTokenExpiration: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  isTokenExpiringSoon: (thresholdSeconds?: number) => boolean;
  // Library-specific methods
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  canAccessLibrary: (libraryId: string) => boolean;
}

// Library Permission Constants
export const PERMISSIONS = {
  // Book Management
  BOOKS_READ: 'books:read',
  BOOKS_CREATE: 'books:create',
  BOOKS_UPDATE: 'books:update',
  BOOKS_DELETE: 'books:delete',
  
  // Member Management
  MEMBERS_READ: 'members:read',
  MEMBERS_CREATE: 'members:create',
  MEMBERS_UPDATE: 'members:update',
  MEMBERS_DELETE: 'members:delete',
  
  // Lending Operations
  LENDING_CHECKOUT: 'lending:checkout',
  LENDING_RETURN: 'lending:return',
  LENDING_RENEW: 'lending:renew',
  LENDING_OVERRIDE: 'lending:override',
  
  // Fine Management
  FINES_READ: 'fines:read',
  FINES_WAIVE: 'fines:waive',
  FINES_PROCESS: 'fines:process',
  
  // Reports and Analytics
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  
  // System Administration
  SYSTEM_CONFIG: 'system:config',
  USER_MANAGEMENT: 'users:manage',
  LIBRARY_MANAGEMENT: 'libraries:manage'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];