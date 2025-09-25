import { apiClient } from './api';
import {
  Comment,
  CommentTreeNode,
  CommentListQuery,
  CommentListResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentStats,
  PaginatedResponse
} from '../types';

// 评论服务类
class CommentService {
  // 获取文章的评论列表
  async getComments(query: CommentListQuery): Promise<PaginatedResponse<Comment>> {
    const params = new URLSearchParams();
    
    params.append('articleId', query.articleId);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `/comments?${params.toString()}`
    );
    return response.data;
  }

  // 获取评论详情
  async getComment(id: string): Promise<Comment> {
    const response = await apiClient.get<Comment>(`/comments/${id}`);
    return response.data;
  }

  // 创建评论
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post<Comment>('/comments', data);
    return response.data;
  }

  // 更新评论
  async updateComment(id: string, data: UpdateCommentRequest): Promise<Comment> {
    const response = await apiClient.put<Comment>(`/comments/${id}`, data);
    return response.data;
  }

  // 删除评论
  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/comments/${id}`);
  }

  // 点赞评论
  async likeComment(id: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.post<{ liked: boolean; likeCount: number }>(
      `/comments/${id}/like`
    );
    return response.data;
  }

  // 取消点赞评论
  async unlikeComment(id: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.delete<{ liked: boolean; likeCount: number }>(
      `/comments/${id}/like`
    );
    return response.data;
  }

  // 获取评论的回复列表
  async getReplies(
    parentId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponse<Comment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `/comments/${parentId}/replies?${params.toString()}`
    );
    return response.data;
  }

  // 回复评论
  async replyToComment(parentId: string, data: Omit<CreateCommentRequest, 'parentId'>): Promise<Comment> {
    const replyData: CreateCommentRequest = {
      ...data,
      parentId,
    };
    return this.createComment(replyData);
  }

  // 获取用户的评论列表
  async getUserComments(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponse<Comment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `/users/${userId}/comments?${params.toString()}`
    );
    return response.data;
  }

  // 获取当前用户的评论列表
  async getMyComments(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Comment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `/comments/my?${params.toString()}`
    );
    return response.data;
  }

  // 获取评论统计信息
  async getCommentStats(articleId?: string): Promise<CommentStats> {
    const params = articleId ? `?articleId=${articleId}` : '';
    const response = await apiClient.get<CommentStats>(`/comments/stats${params}`);
    return response.data;
  }

  // 举报评论
  async reportComment(id: string, reason: string): Promise<void> {
    await apiClient.post(`/comments/${id}/report`, { reason });
  }

  // 获取热门评论
  async getPopularComments(
    articleId: string, 
    limit: number = 5
  ): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(
      `/comments/popular?articleId=${articleId}&limit=${limit}`
    );
    return response.data;
  }

  // 获取最新评论
  async getLatestComments(
    articleId?: string, 
    limit: number = 10
  ): Promise<Comment[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (articleId) params.append('articleId', articleId);

    const response = await apiClient.get<Comment[]>(
      `/comments/latest?${params.toString()}`
    );
    return response.data;
  }

  // 构建评论树结构
  buildCommentTree(comments: Comment[]): CommentTreeNode[] {
    const commentMap = new Map<string, CommentTreeNode>();
    const rootComments: CommentTreeNode[] = [];

    // 首先创建所有评论节点
    comments.forEach(comment => {
      const node: CommentTreeNode = {
        ...comment,
        replies: [],
        depth: 0,
        hasMoreReplies: false,
      };
      commentMap.set(comment.id, node);
    });

    // 然后构建树结构
    comments.forEach(comment => {
      const node = commentMap.get(comment.id)!;
      
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          node.depth = parent.depth + 1;
          parent.replies.push(node);
        } else {
          // 如果找不到父评论，将其视为根评论
          rootComments.push(node);
        }
      } else {
        rootComments.push(node);
      }
    });

    // 对评论进行排序（按时间或点赞数）
    const sortComments = (comments: CommentTreeNode[]) => {
      comments.sort((a, b) => {
        // 可以根据需要调整排序逻辑
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      comments.forEach(comment => {
        if (comment.replies.length > 0) {
          sortComments(comment.replies);
        }
      });
    };

    sortComments(rootComments);
    return rootComments;
  }

  // 扁平化评论树
  flattenCommentTree(tree: CommentTreeNode[]): CommentTreeNode[] {
    const flattened: CommentTreeNode[] = [];

    const flatten = (nodes: CommentTreeNode[]) => {
      nodes.forEach(node => {
        flattened.push(node);
        if (node.replies.length > 0) {
          flatten(node.replies);
        }
      });
    };

    flatten(tree);
    return flattened;
  }

  // 搜索评论
  async searchComments(
    keyword: string, 
    articleId?: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponse<Comment>> {
    const params = new URLSearchParams({
      keyword,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (articleId) params.append('articleId', articleId);

    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `/comments/search?${params.toString()}`
    );
    return response.data;
  }

  // 检查用户是否已点赞评论
  async checkCommentLike(id: string): Promise<{ liked: boolean }> {
    const response = await apiClient.get<{ liked: boolean }>(`/comments/${id}/like/status`);
    return response.data;
  }

  // 批量检查评论点赞状态
  async checkMultipleCommentLikes(ids: string[]): Promise<Record<string, boolean>> {
    const response = await apiClient.post<Record<string, boolean>>(
      '/comments/likes/status', 
      { commentIds: ids }
    );
    return response.data;
  }
}

// 创建并导出评论服务实例
export const commentService = new CommentService();

// 导出默认实例
export default commentService;