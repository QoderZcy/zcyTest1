import { AxiosResponse } from 'axios';
import { httpClient } from '../utils/httpClient';
import {
  BlogArticle,
  CreateArticleData,
  UpdateArticleData,
  BlogDraft,
  UserBlogSettings,
  BlogFilter,
  PaginationState,
  ConvertSettings,
  BlogStats,
  Visibility,
  ArticleStatus,
} from '../types/blog';
import { Note } from '../types/note';

// API 响应类型
interface BlogResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationState;
  total: number;
}

// 博客 API 服务类
class BlogApiService {
  private readonly API_PREFIX = '/blog';

  /**
   * 获取文章列表（分页）
   */
  async getArticles(filter?: Partial<BlogFilter>, pagination?: Partial<PaginationState>): Promise<PaginatedResponse<BlogArticle>> {
    const params = new URLSearchParams();
    
    // 构建查询参数
    if (filter) {
      if (filter.searchTerm) params.append('search', filter.searchTerm);
      if (filter.selectedTags?.length) params.append('tags', filter.selectedTags.join(','));
      if (filter.selectedCategories?.length) params.append('categories', filter.selectedCategories.join(','));
      if (filter.status) params.append('status', filter.status);
      if (filter.visibility) params.append('visibility', filter.visibility);
      if (filter.authorId) params.append('authorId', filter.authorId);
      if (filter.sortBy) params.append('sortBy', filter.sortBy);
      if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.startDate.toISOString());
        params.append('endDate', filter.dateRange.endDate.toISOString());
      }
    }
    
    if (pagination) {
      if (pagination.currentPage) params.append('page', pagination.currentPage.toString());
      if (pagination.pageSize) params.append('limit', pagination.pageSize.toString());
    }

    const response: AxiosResponse<PaginatedResponse<BlogArticle>> = await httpClient.get(
      `${this.API_PREFIX}/articles?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * 获取公开文章列表（无需认证）
   */
  async getPublicArticles(filter?: Partial<BlogFilter>, pagination?: Partial<PaginationState>): Promise<PaginatedResponse<BlogArticle>> {
    const params = new URLSearchParams();
    
    // 构建查询参数，只包含公开文章
    params.append('visibility', Visibility.PUBLIC);
    
    if (filter) {
      if (filter.searchTerm) params.append('search', filter.searchTerm);
      if (filter.selectedTags?.length) params.append('tags', filter.selectedTags.join(','));
      if (filter.selectedCategories?.length) params.append('categories', filter.selectedCategories.join(','));
      if (filter.sortBy) params.append('sortBy', filter.sortBy);
      if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
    }
    
    if (pagination) {
      if (pagination.currentPage) params.append('page', pagination.currentPage.toString());
      if (pagination.pageSize) params.append('limit', pagination.pageSize.toString());
    }

    const response: AxiosResponse<PaginatedResponse<BlogArticle>> = await httpClient.get(
      `${this.API_PREFIX}/public/articles?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * 获取单篇文章详情
   */
  async getArticle(id: string): Promise<BlogArticle> {
    const response: AxiosResponse<BlogResponse<BlogArticle>> = await httpClient.get(
      `${this.API_PREFIX}/articles/${id}`
    );
    
    return response.data.data;
  }

  /**
   * 获取单篇公开文章详情（无需认证）
   */
  async getPublicArticle(idOrSlug: string): Promise<BlogArticle> {
    const response: AxiosResponse<BlogResponse<BlogArticle>> = await httpClient.get(
      `${this.API_PREFIX}/public/articles/${idOrSlug}`
    );
    
    return response.data.data;
  }

  /**
   * 创建新文章
   */
  async createArticle(data: CreateArticleData): Promise<BlogArticle> {
    const response: AxiosResponse<BlogResponse<BlogArticle>> = await httpClient.post(
      `${this.API_PREFIX}/articles`,
      data
    );
    
    return response.data.data;
  }

  /**
   * 更新文章
   */
  async updateArticle(id: string, data: UpdateArticleData): Promise<BlogArticle> {
    const response: AxiosResponse<BlogResponse<BlogArticle>> = await httpClient.put(
      `${this.API_PREFIX}/articles/${id}`,
      data
    );
    
    return response.data.data;
  }

  /**
   * 删除文章
   */
  async deleteArticle(id: string): Promise<void> {
    await httpClient.delete(`${this.API_PREFIX}/articles/${id}`);
  }

  /**
   * 发布文章
   */
  async publishArticle(id: string, publishSettings?: { publishedAt?: Date }): Promise<BlogArticle> {
    const response: AxiosResponse<BlogResponse<BlogArticle>> = await httpClient.post(
      `${this.API_PREFIX}/articles/${id}/publish`,
      publishSettings
    );
    
    return response.data.data;
  }

  /**
   * 取消发布文章（回到草稿状态）
   */
  async unpublishArticle(id: string): Promise<BlogArticle> {
    const response: AxiosResponse<BlogResponse<BlogArticle>> = await httpClient.post(
      `${this.API_PREFIX}/articles/${id}/unpublish`
    );
    
    return response.data.data;
  }

  /**
   * 增加文章浏览次数
   */
  async incrementViewCount(id: string): Promise<void> {
    await httpClient.post(`${this.API_PREFIX}/articles/${id}/view`);
  }

  /**
   * 点赞文章
   */
  async likeArticle(id: string): Promise<{ likeCount: number; isLiked: boolean }> {
    const response = await httpClient.post(`${this.API_PREFIX}/articles/${id}/like`);
    return response.data.data;
  }

  /**
   * 取消点赞文章
   */
  async unlikeArticle(id: string): Promise<{ likeCount: number; isLiked: boolean }> {
    const response = await httpClient.delete(`${this.API_PREFIX}/articles/${id}/like`);
    return response.data.data;
  }

  // === 草稿管理 ===

  /**
   * 获取用户草稿列表
   */
  async getDrafts(): Promise<BlogDraft[]> {
    const response: AxiosResponse<BlogResponse<BlogDraft[]>> = await httpClient.get(
      `${this.API_PREFIX}/drafts`
    );
    
    return response.data.data;
  }

  /**
   * 保存草稿
   */
  async saveDraft(data: Partial<BlogDraft>): Promise<BlogDraft> {
    const response: AxiosResponse<BlogResponse<BlogDraft>> = await httpClient.post(
      `${this.API_PREFIX}/drafts`,
      data
    );
    
    return response.data.data;
  }

  /**
   * 更新草稿
   */
  async updateDraft(id: string, data: Partial<BlogDraft>): Promise<BlogDraft> {
    const response: AxiosResponse<BlogResponse<BlogDraft>> = await httpClient.put(
      `${this.API_PREFIX}/drafts/${id}`,
      data
    );
    
    return response.data.data;
  }

  /**
   * 删除草稿
   */
  async deleteDraft(id: string): Promise<void> {
    await httpClient.delete(`${this.API_PREFIX}/drafts/${id}`);
  }

  // === 用户博客设置 ===

  /**
   * 获取用户博客设置
   */
  async getUserBlogSettings(userId?: string): Promise<UserBlogSettings> {
    const endpoint = userId 
      ? `${this.API_PREFIX}/users/${userId}/settings`
      : `${this.API_PREFIX}/settings`;
      
    const response: AxiosResponse<BlogResponse<UserBlogSettings>> = await httpClient.get(endpoint);
    
    return response.data.data;
  }

  /**
   * 更新用户博客设置
   */
  async updateUserBlogSettings(settings: Partial<UserBlogSettings>): Promise<UserBlogSettings> {
    const response: AxiosResponse<BlogResponse<UserBlogSettings>> = await httpClient.put(
      `${this.API_PREFIX}/settings`,
      settings
    );
    
    return response.data.data;
  }

  // === 用户博客主页 ===

  /**
   * 获取用户的博客文章
   */
  async getUserArticles(
    username: string,
    filter?: Partial<BlogFilter>,
    pagination?: Partial<PaginationState>
  ): Promise<PaginatedResponse<BlogArticle>> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.searchTerm) params.append('search', filter.searchTerm);
      if (filter.selectedTags?.length) params.append('tags', filter.selectedTags.join(','));
      if (filter.selectedCategories?.length) params.append('categories', filter.selectedCategories.join(','));
      if (filter.sortBy) params.append('sortBy', filter.sortBy);
      if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
    }
    
    if (pagination) {
      if (pagination.currentPage) params.append('page', pagination.currentPage.toString());
      if (pagination.pageSize) params.append('limit', pagination.pageSize.toString());
    }

    const response: AxiosResponse<PaginatedResponse<BlogArticle>> = await httpClient.get(
      `${this.API_PREFIX}/users/${username}/articles?${params.toString()}`
    );
    
    return response.data;
  }

  // === 分类和标签 ===

  /**
   * 获取所有博客标签
   */
  async getAllTags(): Promise<string[]> {
    const response: AxiosResponse<BlogResponse<string[]>> = await httpClient.get(
      `${this.API_PREFIX}/tags`
    );
    
    return response.data.data;
  }

  /**
   * 获取所有博客分类
   */
  async getAllCategories(): Promise<string[]> {
    const response: AxiosResponse<BlogResponse<string[]>> = await httpClient.get(
      `${this.API_PREFIX}/categories`
    );
    
    return response.data.data;
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    const response = await httpClient.get(`${this.API_PREFIX}/tags/popular?limit=${limit}`);
    return response.data.data;
  }

  /**
   * 获取热门分类
   */
  async getPopularCategories(limit: number = 10): Promise<Array<{ category: string; count: number }>> {
    const response = await httpClient.get(`${this.API_PREFIX}/categories/popular?limit=${limit}`);
    return response.data.data;
  }

  // === 便签转博客 ===

  /**
   * 将便签转换为博客文章
   */
  async convertNoteToArticle(noteId: string, settings: ConvertSettings): Promise<BlogArticle> {
    const response: AxiosResponse<BlogResponse<BlogArticle>> = await httpClient.post(
      `${this.API_PREFIX}/convert-note/${noteId}`,
      settings
    );
    
    return response.data.data;
  }

  /**
   * 批量将便签转换为博客文章
   */
  async batchConvertNotesToArticles(
    noteIds: string[],
    settings: ConvertSettings
  ): Promise<BlogArticle[]> {
    const response: AxiosResponse<BlogResponse<BlogArticle[]>> = await httpClient.post(
      `${this.API_PREFIX}/batch-convert-notes`,
      { noteIds, settings }
    );
    
    return response.data.data;
  }

  // === 统计数据 ===

  /**
   * 获取博客统计数据
   */
  async getBlogStats(): Promise<BlogStats> {
    const response: AxiosResponse<BlogResponse<BlogStats>> = await httpClient.get(
      `${this.API_PREFIX}/stats`
    );
    
    return response.data.data;
  }

  /**
   * 获取文章阅读统计
   */
  async getArticleAnalytics(
    articleId: string,
    timeRange?: { startDate: Date; endDate: Date }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (timeRange) {
      params.append('startDate', timeRange.startDate.toISOString());
      params.append('endDate', timeRange.endDate.toISOString());
    }

    const response = await httpClient.get(
      `${this.API_PREFIX}/articles/${articleId}/analytics?${params.toString()}`
    );
    
    return response.data.data;
  }

  // === 搜索功能 ===

  /**
   * 全文搜索文章
   */
  async searchArticles(
    query: string,
    options?: {
      includeContent?: boolean;
      tags?: string[];
      categories?: string[];
      authorId?: string;
    },
    pagination?: Partial<PaginationState>
  ): Promise<PaginatedResponse<BlogArticle>> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (options) {
      if (options.includeContent) params.append('includeContent', 'true');
      if (options.tags?.length) params.append('tags', options.tags.join(','));
      if (options.categories?.length) params.append('categories', options.categories.join(','));
      if (options.authorId) params.append('authorId', options.authorId);
    }
    
    if (pagination) {
      if (pagination.currentPage) params.append('page', pagination.currentPage.toString());
      if (pagination.pageSize) params.append('limit', pagination.pageSize.toString());
    }

    const response: AxiosResponse<PaginatedResponse<BlogArticle>> = await httpClient.get(
      `${this.API_PREFIX}/search?${params.toString()}`
    );
    
    return response.data;
  }

  // === 相关文章推荐 ===

  /**
   * 获取相关文章推荐
   */
  async getRelatedArticles(articleId: string, limit: number = 5): Promise<BlogArticle[]> {
    const response: AxiosResponse<BlogResponse<BlogArticle[]>> = await httpClient.get(
      `${this.API_PREFIX}/articles/${articleId}/related?limit=${limit}`
    );
    
    return response.data.data;
  }

  // === 导入导出 ===

  /**
   * 导出文章为 Markdown
   */
  async exportArticleAsMarkdown(articleId: string): Promise<Blob> {
    const response = await httpClient.get(
      `${this.API_PREFIX}/articles/${articleId}/export/markdown`,
      { responseType: 'blob' }
    );
    
    return response.data;
  }

  /**
   * 批量导出文章
   */
  async batchExportArticles(articleIds: string[], format: 'markdown' | 'json' = 'markdown'): Promise<Blob> {
    const response = await httpClient.post(
      `${this.API_PREFIX}/export/batch`,
      { articleIds, format },
      { responseType: 'blob' }
    );
    
    return response.data;
  }
}

// 导出单例实例
export const blogApiService = new BlogApiService();
export default blogApiService;