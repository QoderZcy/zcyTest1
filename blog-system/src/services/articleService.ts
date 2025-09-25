import { apiClient } from './api';
import {
  Article,
  ArticleCard,
  ArticleListQuery,
  ArticleSearchQuery,
  ArticleListResponse,
  CreateArticleRequest,
  UpdateArticleRequest,
  Category,
  Tag,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginatedResponse
} from '../types';

// 文章服务类
class ArticleService {
  // 获取文章列表
  async getArticles(query: ArticleListQuery = {}): Promise<PaginatedResponse<ArticleCard>> {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category) params.append('category', query.category);
    if (query.tag) params.append('tag', query.tag);
    if (query.author) params.append('author', query.author);
    if (query.status) params.append('status', query.status);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiClient.get<PaginatedResponse<ArticleCard>>(
      `/articles?${params.toString()}`
    );
    return response.data;
  }

  // 获取文章详情
  async getArticle(id: string): Promise<Article> {
    const response = await apiClient.get<Article>(`/articles/${id}`);
    return response.data;
  }

  // 创建文章
  async createArticle(data: CreateArticleRequest): Promise<Article> {
    const response = await apiClient.post<Article>('/articles', data);
    return response.data;
  }

  // 更新文章
  async updateArticle(id: string, data: UpdateArticleRequest): Promise<Article> {
    const response = await apiClient.put<Article>(`/articles/${id}`, data);
    return response.data;
  }

  // 删除文章
  async deleteArticle(id: string): Promise<void> {
    await apiClient.delete(`/articles/${id}`);
  }

  // 发布文章
  async publishArticle(id: string): Promise<Article> {
    const response = await apiClient.patch<Article>(`/articles/${id}/publish`);
    return response.data;
  }

  // 取消发布文章
  async unpublishArticle(id: string): Promise<Article> {
    const response = await apiClient.patch<Article>(`/articles/${id}/unpublish`);
    return response.data;
  }

  // 归档文章
  async archiveArticle(id: string): Promise<Article> {
    const response = await apiClient.patch<Article>(`/articles/${id}/archive`);
    return response.data;
  }

  // 搜索文章
  async searchArticles(query: ArticleSearchQuery): Promise<PaginatedResponse<ArticleCard>> {
    const params = new URLSearchParams();
    
    params.append('keyword', query.keyword);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category) params.append('category', query.category);
    if (query.tag) params.append('tag', query.tag);

    const response = await apiClient.get<PaginatedResponse<ArticleCard>>(
      `/articles/search?${params.toString()}`
    );
    return response.data;
  }

  // 点赞文章
  async likeArticle(id: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.post<{ liked: boolean; likeCount: number }>(
      `/articles/${id}/like`
    );
    return response.data;
  }

  // 取消点赞文章
  async unlikeArticle(id: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.delete<{ liked: boolean; likeCount: number }>(
      `/articles/${id}/like`
    );
    return response.data;
  }

  // 增加文章浏览量
  async incrementViewCount(id: string): Promise<void> {
    await apiClient.post(`/articles/${id}/view`);
  }

  // 获取用户的文章列表
  async getUserArticles(
    userId: string, 
    query: Omit<ArticleListQuery, 'author'> = {}
  ): Promise<PaginatedResponse<ArticleCard>> {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category) params.append('category', query.category);
    if (query.tag) params.append('tag', query.tag);
    if (query.status) params.append('status', query.status);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiClient.get<PaginatedResponse<ArticleCard>>(
      `/users/${userId}/articles?${params.toString()}`
    );
    return response.data;
  }

  // 获取当前用户的草稿列表
  async getDrafts(query: Omit<ArticleListQuery, 'status'> = {}): Promise<PaginatedResponse<ArticleCard>> {
    const params = new URLSearchParams();
    
    params.append('status', 'draft');
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category) params.append('category', query.category);
    if (query.tag) params.append('tag', query.tag);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiClient.get<PaginatedResponse<ArticleCard>>(
      `/articles/drafts?${params.toString()}`
    );
    return response.data;
  }

  // 获取相关文章
  async getRelatedArticles(id: string, limit: number = 5): Promise<ArticleCard[]> {
    const response = await apiClient.get<ArticleCard[]>(
      `/articles/${id}/related?limit=${limit}`
    );
    return response.data;
  }

  // 获取热门文章
  async getPopularArticles(limit: number = 10): Promise<ArticleCard[]> {
    const response = await apiClient.get<ArticleCard[]>(
      `/articles/popular?limit=${limit}`
    );
    return response.data;
  }

  // 获取最新文章
  async getLatestArticles(limit: number = 10): Promise<ArticleCard[]> {
    const response = await apiClient.get<ArticleCard[]>(
      `/articles/latest?limit=${limit}`
    );
    return response.data;
  }

  // 保存草稿
  async saveDraft(data: CreateArticleRequest | UpdateArticleRequest, id?: string): Promise<Article> {
    const draftData = { ...data, status: 'draft' as const };
    
    if (id) {
      return this.updateArticle(id, draftData);
    } else {
      return this.createArticle(draftData as CreateArticleRequest);
    }
  }

  // 获取文章统计信息
  async getArticleStats(id: string): Promise<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  }> {
    const response = await apiClient.get<{
      viewCount: number;
      likeCount: number;
      commentCount: number;
      shareCount: number;
    }>(`/articles/${id}/stats`);
    return response.data;
  }
}

// 分类服务类
class CategoryService {
  // 获取所有分类
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  }

  // 获取分类详情
  async getCategory(id: string): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  }

  // 创建分类
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  }

  // 更新分类
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  }

  // 删除分类
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  }

  // 获取分类的文章列表
  async getCategoryArticles(
    id: string, 
    query: Omit<ArticleListQuery, 'category'> = {}
  ): Promise<PaginatedResponse<ArticleCard>> {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.tag) params.append('tag', query.tag);
    if (query.author) params.append('author', query.author);
    if (query.status) params.append('status', query.status);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiClient.get<PaginatedResponse<ArticleCard>>(
      `/categories/${id}/articles?${params.toString()}`
    );
    return response.data;
  }
}

// 标签服务类
class TagService {
  // 获取所有标签
  async getTags(): Promise<Tag[]> {
    const response = await apiClient.get<Tag[]>('/tags');
    return response.data;
  }

  // 获取热门标签
  async getPopularTags(limit: number = 20): Promise<Tag[]> {
    const response = await apiClient.get<Tag[]>(`/tags/popular?limit=${limit}`);
    return response.data;
  }

  // 搜索标签
  async searchTags(keyword: string): Promise<Tag[]> {
    const response = await apiClient.get<Tag[]>(
      `/tags/search?keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
  }

  // 获取标签的文章列表
  async getTagArticles(
    tagName: string, 
    query: Omit<ArticleListQuery, 'tag'> = {}
  ): Promise<PaginatedResponse<ArticleCard>> {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category) params.append('category', query.category);
    if (query.author) params.append('author', query.author);
    if (query.status) params.append('status', query.status);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiClient.get<PaginatedResponse<ArticleCard>>(
      `/tags/${encodeURIComponent(tagName)}/articles?${params.toString()}`
    );
    return response.data;
  }
}

// 创建并导出服务实例
export const articleService = new ArticleService();
export const categoryService = new CategoryService();
export const tagService = new TagService();

// 导出默认实例
export default articleService;