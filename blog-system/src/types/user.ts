// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  AUTHOR = 'author', 
  READER = 'reader'
}

// 文章状态枚举
export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// 用户模型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// 用户创建请求
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

// 用户更新请求
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 认证响应
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// 用户个人资料
export interface UserProfile extends User {
  articleCount: number;
  followerCount: number;
  followingCount: number;
}