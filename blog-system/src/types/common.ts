// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

// API错误响应
export interface ApiError {
  success: false;
  message: string;
  code: number;
  details?: any;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页响应数据
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 排序参数
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// HTTP方法枚举
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// 请求配置
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

// 文件上传配置
export interface FileUploadConfig {
  accept: string[];
  maxSize: number; // bytes
  multiple: boolean;
}

// 上传文件响应
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt: Date;
}

// 应用配置
export interface AppConfig {
  apiBaseUrl: string;
  uploadConfig: FileUploadConfig;
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
  features: {
    enableComments: boolean;
    enableLikes: boolean;
    enableTags: boolean;
    enableCategories: boolean;
    enableSearch: boolean;
  };
}

// 主题配置
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    comments: boolean;
    likes: boolean;
  };
  privacy: {
    showEmail: boolean;
    showProfile: boolean;
  };
}