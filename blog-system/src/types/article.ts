import { User } from './user';

// 文章模型
export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  authorId: string;
  author?: User;
  categoryId?: string;
  category?: Category;
  tags: string[];
  status: ArticleStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 文章状态枚举（重新导出）
export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// 文章创建请求
export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  categoryId?: string;
  tags: string[];
  status: ArticleStatus;
}

// 文章更新请求
export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  summary?: string;
  categoryId?: string;
  tags?: string[];
  status?: ArticleStatus;
}

// 文章列表查询参数
export interface ArticleListQuery {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  status?: ArticleStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

// 文章搜索参数
export interface ArticleSearchQuery {
  keyword: string;
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
}

// 文章列表响应
export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 文章卡片数据（用于列表展示）
export interface ArticleCard {
  id: string;
  title: string;
  summary: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: Date;
  readTime: number; // 预估阅读时间（分钟）
}

// 分类模型
export interface Category {
  id: string;
  name: string;
  description?: string;
  articleCount: number;
  createdAt: Date;
}

// 分类创建请求
export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

// 分类更新请求
export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

// 标签模型
export interface Tag {
  id: string;
  name: string;
  articleCount: number;
  createdAt: Date;
}

// 热门标签
export interface PopularTag extends Tag {
  trending: boolean;
}