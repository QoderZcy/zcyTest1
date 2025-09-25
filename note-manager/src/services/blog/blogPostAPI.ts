import { BlogPost, PostStatus, PostType, CreatePostData, UpdatePostData } from '../types/blog/post';
import { PaginatedResponse, ApiResponse } from '../types/blog/api';

export interface PostFilters {
  status?: PostStatus;
  type?: PostType;
  authorId?: string;
  categoryId?: string;
  tags?: string[];
  search?: string;
  featured?: boolean;
  published?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface PostSortOptions {
  field: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'viewCount' | 'likeCount';
  order: 'asc' | 'desc';
}

export interface PostQueryParams extends PostFilters {
  page?: number;
  limit?: number;
  sort?: PostSortOptions;
  include?: ('author' | 'categories' | 'tags' | 'comments')[];
}

class BlogPostAPIService {
  private baseURL = '/api/posts';

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

  // Get all posts with filtering and pagination
  async getPosts(params: PostQueryParams = {}): Promise<ApiResponse<PaginatedResponse<BlogPost>>> {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString ? `?${queryString}` : '';
    return this.request<PaginatedResponse<BlogPost>>(endpoint);
  }

  // Get a single post by ID
  async getPost(id: string, include?: string[]): Promise<ApiResponse<BlogPost>> {
    const queryString = include ? this.buildQueryString({ include }) : '';
    const endpoint = `/${id}${queryString ? `?${queryString}` : ''}`;
    return this.request<BlogPost>(endpoint);
  }

  // Get a post by slug (for public access)
  async getPostBySlug(slug: string, include?: string[]): Promise<ApiResponse<BlogPost>> {
    const queryString = this.buildQueryString({ include: include || [] });
    const endpoint = `/slug/${slug}${queryString ? `?${queryString}` : ''}`;
    return this.request<BlogPost>(endpoint);
  }

  // Create a new post
  async createPost(postData: CreatePostData): Promise<ApiResponse<BlogPost>> {
    return this.request<BlogPost>('', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  // Update an existing post
  async updatePost(id: string, postData: UpdatePostData): Promise<ApiResponse<BlogPost>> {
    return this.request<BlogPost>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  // Delete a post
  async deletePost(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Publish a draft post
  async publishPost(id: string, publishedAt?: string): Promise<ApiResponse<BlogPost>> {
    return this.request<BlogPost>(`/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ publishedAt }),
    });
  }

  // Unpublish a published post
  async unpublishPost(id: string): Promise<ApiResponse<BlogPost>> {
    return this.request<BlogPost>(`/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // Archive a post
  async archivePost(id: string): Promise<ApiResponse<BlogPost>> {
    return this.request<BlogPost>(`/${id}/archive`, {
      method: 'POST',
    });
  }

  // Duplicate a post
  async duplicatePost(id: string, title?: string): Promise<ApiResponse<BlogPost>> {
    return this.request<BlogPost>(`/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  // Bulk operations
  async bulkUpdatePosts(
    postIds: string[], 
    action: 'publish' | 'unpublish' | 'archive' | 'delete',
    data?: Record<string, any>
  ): Promise<ApiResponse<BlogPost[]>> {
    return this.request<BlogPost[]>('/bulk', {
      method: 'POST',
      body: JSON.stringify({ postIds, action, data }),
    });
  }

  // Get post statistics
  async getPostStats(id: string): Promise<ApiResponse<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    readingTime: number;
    weeklyViews: number[];
    topReferrers: Array<{ source: string; count: number }>;
  }>> {
    return this.request(`/${id}/stats`);
  }

  // Get posts by author
  async getPostsByAuthor(
    authorId: string, 
    params: Omit<PostQueryParams, 'authorId'> = {}
  ): Promise<ApiResponse<PaginatedResponse<BlogPost>>> {
    return this.getPosts({ ...params, authorId });
  }

  // Get related posts
  async getRelatedPosts(
    id: string, 
    limit: number = 5
  ): Promise<ApiResponse<BlogPost[]>> {
    return this.request<BlogPost[]>(`/${id}/related?limit=${limit}`);
  }

  // Search posts
  async searchPosts(
    query: string,
    filters: Omit<PostFilters, 'search'> = {},
    options: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<BlogPost>>> {
    const params = {
      ...filters,
      ...options,
      search: query,
    };
    return this.getPosts(params);
  }

  // Get trending posts
  async getTrendingPosts(
    period: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<ApiResponse<BlogPost[]>> {
    return this.request<BlogPost[]>(`/trending?period=${period}&limit=${limit}`);
  }

  // Get featured posts
  async getFeaturedPosts(limit: number = 5): Promise<ApiResponse<BlogPost[]>> {
    return this.getPosts({ featured: true, limit, published: true });
  }

  // Get recent posts
  async getRecentPosts(limit: number = 10): Promise<ApiResponse<BlogPost[]>> {
    return this.getPosts({ 
      limit, 
      published: true,
      sort: { field: 'publishedAt', order: 'desc' }
    });
  }

  // Like/Unlike post
  async toggleLike(id: string): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    return this.request(`/${id}/like`, {
      method: 'POST',
    });
  }

  // Bookmark/Unbookmark post
  async toggleBookmark(id: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    return this.request(`/${id}/bookmark`, {
      method: 'POST',
    });
  }

  // View post (increment view count)
  async viewPost(id: string): Promise<ApiResponse<{ viewCount: number }>> {
    return this.request(`/${id}/view`, {
      method: 'POST',
    });
  }

  // Get post revisions/history
  async getPostRevisions(id: string): Promise<ApiResponse<Array<{
    id: string;
    version: number;
    title: string;
    content: string;
    createdAt: string;
    authorId: string;
    changeDescription?: string;
  }>>> {
    return this.request(`/${id}/revisions`);
  }

  // Restore post to a specific revision
  async restoreRevision(
    id: string, 
    revisionId: string
  ): Promise<ApiResponse<BlogPost>> {
    return this.request(`/${id}/revisions/${revisionId}/restore`, {
      method: 'POST',
    });
  }

  // Schedule post for future publication
  async schedulePost(
    id: string, 
    publishAt: string
  ): Promise<ApiResponse<BlogPost>> {
    return this.request(`/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ publishAt }),
    });
  }

  // Get scheduled posts
  async getScheduledPosts(): Promise<ApiResponse<BlogPost[]>> {
    return this.getPosts({ status: PostStatus.SCHEDULED });
  }

  // Cancel scheduled publication
  async cancelSchedule(id: string): Promise<ApiResponse<BlogPost>> {
    return this.request(`/${id}/cancel-schedule`, {
      method: 'POST',
    });
  }

  // Upload image for post content
  async uploadImage(file: File, postId?: string): Promise<ApiResponse<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }>> {
    const formData = new FormData();
    formData.append('image', file);
    if (postId) {
      formData.append('postId', postId);
    }

    return this.request('/upload/image', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  // Get post analytics
  async getPostAnalytics(
    id: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    views: Array<{ date: string; count: number }>;
    likes: Array<{ date: string; count: number }>;
    comments: Array<{ date: string; count: number }>;
    shares: Array<{ date: string; count: number }>;
    referrers: Array<{ source: string; count: number }>;
    countries: Array<{ country: string; count: number }>;
    devices: Array<{ device: string; count: number }>;
  }>> {
    return this.request(`/${id}/analytics?period=${period}`);
  }

  // Export post to different formats
  async exportPost(
    id: string, 
    format: 'markdown' | 'html' | 'pdf' | 'json'
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.request(`/${id}/export?format=${format}`);
  }

  // Import post from external source
  async importPost(data: {
    source: 'medium' | 'wordpress' | 'ghost' | 'markdown';
    url?: string;
    content?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<BlogPost>> {
    return this.request('/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get SEO recommendations for post
  async getSEORecommendations(id: string): Promise<ApiResponse<{
    score: number;
    recommendations: Array<{
      type: 'title' | 'description' | 'keywords' | 'headings' | 'images' | 'links';
      severity: 'low' | 'medium' | 'high';
      message: string;
      suggestion: string;
    }>;
  }>> {
    return this.request(`/${id}/seo-analysis`);
  }

  // Generate post slug
  async generateSlug(title: string): Promise<ApiResponse<{ slug: string }>> {
    return this.request('/generate-slug', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  // Auto-save draft
  async autoSave(id: string, content: Partial<BlogPost>): Promise<ApiResponse<void>> {
    return this.request(`/${id}/auto-save`, {
      method: 'POST',
      body: JSON.stringify(content),
    });
  }

  // Get auto-saved content
  async getAutoSaved(id: string): Promise<ApiResponse<Partial<BlogPost> | null>> {
    return this.request(`/${id}/auto-save`);
  }
}

// Create and export a singleton instance
export const blogPostAPI = new BlogPostAPIService();
export default blogPostAPI;