import { User } from './auth';

/**
 * 博客文章发布状态枚举
 */
export enum PublishStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED'
}

/**
 * 博客分类类型定义
 */
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
}

/**
 * 博客文章类型定义
 */
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: User;
  publishedAt: Date;
  updatedAt: Date;
  status: PublishStatus;
  viewCount: number;
  sourceNoteId?: string;
}

/**
 * 新建博客文章类型（不包含自动生成的字段）
 */
export interface NewBlogPost {
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  status: PublishStatus;
  sourceNoteId?: string;
}

/**
 * 博客文章筛选条件
 */
export interface BlogFilter {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  status?: PublishStatus;
  search?: string;
}

/**
 * 博客文章列表响应类型
 */
export interface BlogPostListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 博客文章详情响应类型
 */
export interface BlogPostDetailResponse {
  post: BlogPost;
  relatedPosts: BlogPost[];
  comments?: Comment[];
}

/**
 * 评论类型定义
 */
export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  replies?: Comment[];
}

/**
 * 便签转博客请求类型
 */
export interface ConvertNoteRequest {
  noteId: string;
  title?: string;
  category?: string;
  tags?: string[];
}

/**
 * 博客统计数据类型
 */
export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalComments: number;
}

/**
 * 博客编辑器状态类型
 */
export interface BlogEditorState {
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: PublishStatus;
  publishedAt?: Date;
  isDirty: boolean;
}