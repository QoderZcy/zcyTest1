import { Comment, CommentStatus, CreateCommentData, UpdateCommentData, ModerationAction } from '../types/blog/comment';
import { PaginatedResponse, ApiResponse } from '../types/blog/api';

export interface CommentFilters {
  postId?: string;
  authorId?: string;
  status?: CommentStatus;
  parentId?: string | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  flagged?: boolean;
  moderated?: boolean;
}

export interface CommentSortOptions {
  field: 'createdAt' | 'updatedAt' | 'likeCount' | 'reportCount';
  order: 'asc' | 'desc';
}

export interface CommentQueryParams extends CommentFilters {
  page?: number;
  limit?: number;
  sort?: CommentSortOptions;
  include?: ('author' | 'replies' | 'post' | 'moderationHistory')[];
  nested?: boolean; // Whether to return comments in nested structure
}

export interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'sentiment' | 'spam' | 'length' | 'links' | 'caps';
  condition: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'regex';
  value: string | number;
  action: 'flag' | 'hold' | 'reject' | 'auto_approve';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationStats {
  totalComments: number;
  pendingComments: number;
  approvedComments: number;
  rejectedComments: number;
  flaggedComments: number;
  spamComments: number;
  autoModerated: number;
  averageResponseTime: number; // in minutes
  topReasons: Array<{ reason: string; count: number }>;
}

class CommentAPIService {
  private baseURL = '/api/comments';

  // Helper method to build query string
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else if (typeof value === 'object') {
          searchParams.set(key, JSON.stringify(value));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });
    
    return searchParams.toString();
  }

  // Helper method to handle API requests
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data,
        message: data.message
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get comments with filtering and pagination
  async getComments(params: CommentQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString ? `?${queryString}` : '';
    return this.request<PaginatedResponse<Comment>>(endpoint);
  }

  // Get comments for a specific post
  async getPostComments(
    postId: string, 
    params: Omit<CommentQueryParams, 'postId'> = {}
  ): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    return this.getComments({ ...params, postId });
  }

  // Get a single comment by ID
  async getComment(id: string, include?: string[]): Promise<ApiResponse<Comment>> {
    const queryString = include ? this.buildQueryString({ include }) : '';
    const endpoint = `/${id}${queryString ? `?${queryString}` : ''}`;
    return this.request<Comment>(endpoint);
  }

  // Create a new comment
  async createComment(commentData: CreateCommentData): Promise<ApiResponse<Comment>> {
    return this.request<Comment>('', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  // Update an existing comment
  async updateComment(id: string, commentData: UpdateCommentData): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
  }

  // Delete a comment
  async deleteComment(id: string, reason?: string): Promise<ApiResponse<void>> {
    const body = reason ? JSON.stringify({ reason }) : undefined;
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
      body,
    });
  }

  // Like/Unlike a comment
  async toggleLike(id: string): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    return this.request(`/${id}/like`, {
      method: 'POST',
    });
  }

  // Report a comment
  async reportComment(
    id: string, 
    reason: 'spam' | 'abuse' | 'inappropriate' | 'harassment' | 'misinformation' | 'other',
    description?: string
  ): Promise<ApiResponse<void>> {
    return this.request(`/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  }

  // Get replies to a comment
  async getReplies(
    commentId: string, 
    params: Omit<CommentQueryParams, 'parentId'> = {}
  ): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    return this.getComments({ ...params, parentId: commentId });
  }

  // MODERATION METHODS

  // Get moderation queue
  async getModerationQueue(
    params: CommentQueryParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    return this.getComments({ 
      ...params, 
      status: CommentStatus.PENDING,
      include: ['author', 'post', 'moderationHistory']
    });
  }

  // Moderate a comment
  async moderateComment(
    id: string, 
    action: ModerationAction,
    reason?: string,
    note?: string
  ): Promise<ApiResponse<Comment>> {
    return this.request(`/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action, reason, note }),
    });
  }

  // Bulk moderate comments
  async bulkModerate(
    commentIds: string[],
    action: ModerationAction,
    reason?: string
  ): Promise<ApiResponse<Comment[]>> {
    return this.request('/bulk-moderate', {
      method: 'POST',
      body: JSON.stringify({ commentIds, action, reason }),
    });
  }

  // Approve a comment
  async approveComment(id: string, note?: string): Promise<ApiResponse<Comment>> {
    return this.moderateComment(id, ModerationAction.APPROVE, undefined, note);
  }

  // Reject a comment
  async rejectComment(id: string, reason: string, note?: string): Promise<ApiResponse<Comment>> {
    return this.moderateComment(id, ModerationAction.REJECT, reason, note);
  }

  // Flag a comment for review
  async flagComment(id: string, reason: string, note?: string): Promise<ApiResponse<Comment>> {
    return this.moderateComment(id, ModerationAction.FLAG, reason, note);
  }

  // Mark comment as spam
  async markAsSpam(id: string, note?: string): Promise<ApiResponse<Comment>> {
    return this.moderateComment(id, ModerationAction.SPAM, 'spam', note);
  }

  // Get moderation history for a comment
  async getModerationHistory(id: string): Promise<ApiResponse<Array<{
    id: string;
    action: ModerationAction;
    reason?: string;
    note?: string;
    moderatorId: string;
    moderatorName: string;
    createdAt: string;
  }>>> {
    return this.request(`/${id}/moderation-history`);
  }

  // Get moderation statistics
  async getModerationStats(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<ModerationStats>> {
    return this.request(`/moderation/stats?period=${period}`);
  }

  // MODERATION RULES

  // Get moderation rules
  async getModerationRules(): Promise<ApiResponse<ModerationRule[]>> {
    return this.request('/moderation/rules');
  }

  // Create moderation rule
  async createModerationRule(rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ModerationRule>> {
    return this.request('/moderation/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  // Update moderation rule
  async updateModerationRule(
    id: string, 
    rule: Partial<Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<ModerationRule>> {
    return this.request(`/moderation/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  // Delete moderation rule
  async deleteModerationRule(id: string): Promise<ApiResponse<void>> {
    return this.request(`/moderation/rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Test moderation rule against content
  async testModerationRule(
    ruleId: string, 
    content: string
  ): Promise<ApiResponse<{ matches: boolean; action: string }>> {
    return this.request(`/moderation/rules/${ruleId}/test`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // ANALYTICS AND INSIGHTS

  // Get comment analytics
  async getCommentAnalytics(
    postId?: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    totalComments: number;
    commentsByDate: Array<{ date: string; count: number }>;
    averageResponseTime: number;
    topCommenters: Array<{ authorId: string; authorName: string; count: number }>;
    sentimentAnalysis: {
      positive: number;
      neutral: number;
      negative: number;
    };
    engagementRate: number;
  }>> {
    const params = { period, ...(postId && { postId }) };
    const queryString = this.buildQueryString(params);
    return this.request(`/analytics?${queryString}`);
  }

  // Get spam detection insights
  async getSpamInsights(): Promise<ApiResponse<{
    totalSpamBlocked: number;
    spamByDate: Array<{ date: string; count: number }>;
    topSpamIndicators: Array<{ indicator: string; count: number }>;
    falsePositiveRate: number;
    accuracy: number;
  }>> {
    return this.request('/moderation/spam-insights');
  }

  // SETTINGS AND CONFIGURATION

  // Get comment settings
  async getCommentSettings(): Promise<ApiResponse<{
    enableComments: boolean;
    requireApproval: boolean;
    allowAnonymous: boolean;
    allowReplies: boolean;
    maxDepth: number;
    autoCloseAfterDays?: number;
    wordFilter: string[];
    blockedIPs: string[];
    rateLimit: {
      maxCommentsPerHour: number;
      maxCommentsPerDay: number;
    };
  }>> {
    return this.request('/settings');
  }

  // Update comment settings
  async updateCommentSettings(settings: {
    enableComments?: boolean;
    requireApproval?: boolean;
    allowAnonymous?: boolean;
    allowReplies?: boolean;
    maxDepth?: number;
    autoCloseAfterDays?: number;
    wordFilter?: string[];
    blockedIPs?: string[];
    rateLimit?: {
      maxCommentsPerHour?: number;
      maxCommentsPerDay?: number;
    };
  }): Promise<ApiResponse<void>> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // EXPORT AND IMPORT

  // Export comments
  async exportComments(
    format: 'csv' | 'json' | 'xml',
    filters?: CommentFilters
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    const params = { format, ...filters };
    const queryString = this.buildQueryString(params);
    return this.request(`/export?${queryString}`);
  }

  // Get comment thread (nested comments for a post)
  async getCommentThread(
    postId: string,
    params: { limit?: number; maxDepth?: number } = {}
  ): Promise<ApiResponse<Comment[]>> {
    const queryString = this.buildQueryString({ ...params, nested: true });
    return this.request(`/thread/${postId}?${queryString}`);
  }

  // Search comments
  async searchComments(
    query: string,
    filters: Omit<CommentFilters, 'search'> = {},
    options: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    const params = {
      ...filters,
      ...options,
      search: query,
    };
    return this.getComments(params);
  }

  // Get user's comments
  async getUserComments(
    userId: string,
    params: Omit<CommentQueryParams, 'authorId'> = {}
  ): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    return this.getComments({ ...params, authorId: userId });
  }

  // Pin/Unpin comment
  async togglePin(id: string): Promise<ApiResponse<{ pinned: boolean }>> {
    return this.request(`/${id}/pin`, {
      method: 'POST',
    });
  }

  // Enable/Disable comments for a post
  async togglePostComments(postId: string, enabled: boolean): Promise<ApiResponse<void>> {
    return this.request(`/posts/${postId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // Get comment notifications for a user
  async getCommentNotifications(userId: string): Promise<ApiResponse<Array<{
    id: string;
    type: 'reply' | 'mention' | 'like';
    commentId: string;
    postId: string;
    actorId: string;
    actorName: string;
    read: boolean;
    createdAt: string;
  }>>> {
    return this.request(`/notifications/${userId}`);
  }

  // Mark comment notification as read
  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }
}

// Create and export a singleton instance
export const commentAPI = new CommentAPIService();
export default commentAPI;