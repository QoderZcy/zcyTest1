import { User } from './user';

// 评论模型
export interface Comment {
  id: string;
  content: string;
  articleId: string;
  authorId: string;
  author?: User;
  parentId?: string;
  parent?: Comment;
  replies?: Comment[];
  likeCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 评论创建请求
export interface CreateCommentRequest {
  content: string;
  articleId: string;
  parentId?: string;
}

// 评论更新请求
export interface UpdateCommentRequest {
  content: string;
}

// 评论列表查询参数
export interface CommentListQuery {
  articleId: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

// 评论列表响应
export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 评论树节点（用于展示嵌套评论）
export interface CommentTreeNode extends Comment {
  replies: CommentTreeNode[];
  depth: number;
  hasMoreReplies: boolean;
}

// 评论统计
export interface CommentStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}