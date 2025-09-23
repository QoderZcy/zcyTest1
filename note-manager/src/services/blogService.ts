import { httpClient, ApiError } from '../utils/httpClient';
import { 
  BlogPost, 
  BlogCategory, 
  NewBlogPost, 
  BlogFilter, 
  BlogPostListResponse, 
  BlogPostDetailResponse,
  ConvertNoteRequest,
  BlogStats,
  PublishStatus 
} from '../types/blog';
import { AxiosResponse } from 'axios';

/**
 * 博客服务类 - 处理所有博客相关的API请求
 */
class BlogService {
  private readonly baseUrl = '/blog';

  /**
   * 获取博客文章列表
   * @param filter 筛选条件
   * @returns 分页的博客文章列表
   */
  async getPosts(filter: BlogFilter = {}): Promise<BlogPostListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filter.page) params.append('page', filter.page.toString());
      if (filter.limit) params.append('limit', filter.limit.toString());
      if (filter.category) params.append('category', filter.category);
      if (filter.status) params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);
      if (filter.tags && filter.tags.length > 0) {
        filter.tags.forEach(tag => params.append('tags', tag));
      }

      const queryString = params.toString();
      const url = `${this.baseUrl}/posts${queryString ? `?${queryString}` : ''}`;
      
      const response: AxiosResponse<BlogPostListResponse> = await httpClient.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '获取文章列表失败');
    }
  }

  /**
   * 获取单篇博客文章详情
   * @param postId 文章ID
   * @returns 文章详情及相关文章
   */
  async getPost(postId: string): Promise<BlogPostDetailResponse> {
    try {
      const response: AxiosResponse<BlogPostDetailResponse> = 
        await httpClient.get(`${this.baseUrl}/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '获取文章详情失败');
    }
  }

  /**
   * 创建新的博客文章
   * @param postData 文章数据
   * @returns 创建的文章
   */
  async createPost(postData: NewBlogPost): Promise<BlogPost> {
    try {
      const response: AxiosResponse<BlogPost> = 
        await httpClient.post(`${this.baseUrl}/posts`, postData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '创建文章失败');
    }
  }

  /**
   * 更新博客文章
   * @param postId 文章ID
   * @param postData 更新的文章数据
   * @returns 更新后的文章
   */
  async updatePost(postId: string, postData: Partial<BlogPost>): Promise<BlogPost> {
    try {
      const response: AxiosResponse<BlogPost> = 
        await httpClient.put(`${this.baseUrl}/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '更新文章失败');
    }
  }

  /**
   * 删除博客文章
   * @param postId 文章ID
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/posts/${postId}`);
    } catch (error) {
      throw this.handleError(error, '删除文章失败');
    }
  }

  /**
   * 发布博客文章
   * @param postId 文章ID
   * @returns 发布后的文章
   */
  async publishPost(postId: string): Promise<BlogPost> {
    try {
      const response: AxiosResponse<BlogPost> = 
        await httpClient.patch(`${this.baseUrl}/posts/${postId}/publish`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '发布文章失败');
    }
  }

  /**
   * 取消发布博客文章
   * @param postId 文章ID
   * @returns 取消发布后的文章
   */
  async unpublishPost(postId: string): Promise<BlogPost> {
    try {
      const response: AxiosResponse<BlogPost> = 
        await httpClient.patch(`${this.baseUrl}/posts/${postId}/unpublish`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '取消发布失败');
    }
  }

  /**
   * 归档博客文章
   * @param postId 文章ID
   * @returns 归档后的文章
   */
  async archivePost(postId: string): Promise<BlogPost> {
    try {
      const response: AxiosResponse<BlogPost> = 
        await httpClient.patch(`${this.baseUrl}/posts/${postId}/archive`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '归档文章失败');
    }
  }

  /**
   * 获取博客分类列表
   * @returns 分类列表
   */
  async getCategories(): Promise<BlogCategory[]> {
    try {
      const response: AxiosResponse<BlogCategory[]> = 
        await httpClient.get(`${this.baseUrl}/categories`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '获取分类列表失败');
    }
  }

  /**
   * 创建新分类
   * @param categoryData 分类数据
   * @returns 创建的分类
   */
  async createCategory(categoryData: Omit<BlogCategory, 'id' | 'postCount'>): Promise<BlogCategory> {
    try {
      const response: AxiosResponse<BlogCategory> = 
        await httpClient.post(`${this.baseUrl}/categories`, categoryData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '创建分类失败');
    }
  }

  /**
   * 将便签转换为博客文章
   * @param convertData 转换请求数据
   * @returns 转换后的博客文章
   */
  async convertNoteToPost(convertData: ConvertNoteRequest): Promise<BlogPost> {
    try {
      const response: AxiosResponse<BlogPost> = 
        await httpClient.post(`${this.baseUrl}/convert-note`, convertData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '便签转换失败');
    }
  }

  /**
   * 获取博客统计数据
   * @returns 博客统计信息
   */
  async getStats(): Promise<BlogStats> {
    try {
      const response: AxiosResponse<BlogStats> = 
        await httpClient.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, '获取统计数据失败');
    }
  }

  /**
   * 获取草稿列表
   * @param filter 筛选条件
   * @returns 草稿列表
   */
  async getDrafts(filter: Omit<BlogFilter, 'status'> = {}): Promise<BlogPostListResponse> {
    return this.getPosts({ ...filter, status: PublishStatus.DRAFT });
  }

  /**
   * 获取已发布文章列表
   * @param filter 筛选条件
   * @returns 已发布文章列表
   */
  async getPublishedPosts(filter: Omit<BlogFilter, 'status'> = {}): Promise<BlogPostListResponse> {
    return this.getPosts({ ...filter, status: PublishStatus.PUBLISHED });
  }

  /**
   * 按分类获取文章列表
   * @param category 分类名称
   * @param filter 其他筛选条件
   * @returns 分类文章列表
   */
  async getPostsByCategory(category: string, filter: Omit<BlogFilter, 'category'> = {}): Promise<BlogPostListResponse> {
    return this.getPosts({ ...filter, category });
  }

  /**
   * 按标签获取文章列表
   * @param tags 标签数组
   * @param filter 其他筛选条件
   * @returns 标签文章列表
   */
  async getPostsByTags(tags: string[], filter: Omit<BlogFilter, 'tags'> = {}): Promise<BlogPostListResponse> {
    return this.getPosts({ ...filter, tags });
  }

  /**
   * 搜索文章
   * @param query 搜索关键词
   * @param filter 其他筛选条件
   * @returns 搜索结果
   */
  async searchPosts(query: string, filter: Omit<BlogFilter, 'search'> = {}): Promise<BlogPostListResponse> {
    return this.getPosts({ ...filter, search: query });
  }

  /**
   * 错误处理辅助方法
   * @param error 原始错误
   * @param defaultMessage 默认错误消息
   * @returns 处理后的错误
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof ApiError) {
      return error;
    }

    console.error(`[BlogService] ${defaultMessage}:`, error);
    
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    return new Error(defaultMessage);
  }
}

// 导出单例
export const blogService = new BlogService();
export default blogService;