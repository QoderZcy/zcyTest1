import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { blogService } from '../services/blogService';
import { httpClient } from '../utils/httpClient';
import { BlogPost, PublishStatus, BlogFilter } from '../types/blog';

// Mock httpClient
vi.mock('../utils/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}));

const mockHttpClient = httpClient as any;

// Mock data
const mockBlogPost: BlogPost = {
  id: '1',
  title: '测试文章',
  content: '这是测试内容',
  excerpt: '测试摘要',
  category: 'tech',
  tags: ['test', 'blog'],
  author: {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    name: '测试用户'
  },
  publishedAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  status: PublishStatus.PUBLISHED,
  viewCount: 100,
  sourceNoteId: 'note1'
};

const mockPostListResponse = {
  posts: [mockBlogPost],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1
};

const mockCategories = [
  {
    id: '1',
    name: '技术',
    slug: 'tech',
    description: '技术相关文章',
    postCount: 5
  }
];

describe('BlogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPosts', () => {
    it('应该获取文章列表', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      const result = await blogService.getPosts();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts');
      expect(result).toEqual(mockPostListResponse);
    });

    it('应该使用筛选参数构建查询字符串', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      const filter: BlogFilter = {
        page: 2,
        limit: 5,
        category: 'tech',
        status: PublishStatus.PUBLISHED,
        search: 'test',
        tags: ['react', 'typescript']
      };

      await blogService.getPosts(filter);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/blog/posts?page=2&limit=5&category=tech&status=PUBLISHED&search=test&tags=react&tags=typescript'
      );
    });

    it('应该处理空筛选条件', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      await blogService.getPosts({});

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts');
    });

    it('应该在网络错误时抛出异常', async () => {
      const errorMessage = '网络错误';
      mockHttpClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(blogService.getPosts()).rejects.toThrow('获取文章列表失败');
    });
  });

  describe('getPost', () => {
    it('应该获取单篇文章详情', async () => {
      const mockDetailResponse = {
        post: mockBlogPost,
        relatedPosts: [],
        comments: []
      };
      mockHttpClient.get.mockResolvedValue({ data: mockDetailResponse });

      const result = await blogService.getPost('1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts/1');
      expect(result).toEqual(mockDetailResponse);
    });

    it('应该在文章不存在时抛出异常', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not found'));

      await expect(blogService.getPost('999')).rejects.toThrow('获取文章详情失败');
    });
  });

  describe('createPost', () => {
    it('应该创建新文章', async () => {
      const newPostData = {
        title: '新文章',
        content: '新内容',
        category: 'tech',
        tags: ['new'],
        status: PublishStatus.DRAFT,
        excerpt: '新摘要'
      };

      mockHttpClient.post.mockResolvedValue({ data: mockBlogPost });

      const result = await blogService.createPost(newPostData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/blog/posts', newPostData);
      expect(result).toEqual(mockBlogPost);
    });

    it('应该在创建失败时抛出异常', async () => {
      const newPostData = {
        title: '',
        content: '',
        category: '',
        tags: [],
        status: PublishStatus.DRAFT,
        excerpt: ''
      };

      mockHttpClient.post.mockRejectedValue(new Error('Validation error'));

      await expect(blogService.createPost(newPostData)).rejects.toThrow('创建文章失败');
    });
  });

  describe('updatePost', () => {
    it('应该更新文章', async () => {
      const updateData = {
        title: '更新的标题',
        content: '更新的内容'
      };

      const updatedPost = { ...mockBlogPost, ...updateData };
      mockHttpClient.put.mockResolvedValue({ data: updatedPost });

      const result = await blogService.updatePost('1', updateData);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/blog/posts/1', updateData);
      expect(result).toEqual(updatedPost);
    });
  });

  describe('deletePost', () => {
    it('应该删除文章', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      await blogService.deletePost('1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/blog/posts/1');
    });

    it('应该在删除失败时抛出异常', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(blogService.deletePost('1')).rejects.toThrow('删除文章失败');
    });
  });

  describe('publishPost', () => {
    it('应该发布文章', async () => {
      const publishedPost = { ...mockBlogPost, status: PublishStatus.PUBLISHED };
      mockHttpClient.patch.mockResolvedValue({ data: publishedPost });

      const result = await blogService.publishPost('1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/blog/posts/1/publish');
      expect(result).toEqual(publishedPost);
    });
  });

  describe('unpublishPost', () => {
    it('应该取消发布文章', async () => {
      const unpublishedPost = { ...mockBlogPost, status: PublishStatus.DRAFT };
      mockHttpClient.patch.mockResolvedValue({ data: unpublishedPost });

      const result = await blogService.unpublishPost('1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/blog/posts/1/unpublish');
      expect(result).toEqual(unpublishedPost);
    });
  });

  describe('archivePost', () => {
    it('应该归档文章', async () => {
      const archivedPost = { ...mockBlogPost, status: PublishStatus.ARCHIVED };
      mockHttpClient.patch.mockResolvedValue({ data: archivedPost });

      const result = await blogService.archivePost('1');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/blog/posts/1/archive');
      expect(result).toEqual(archivedPost);
    });
  });

  describe('getCategories', () => {
    it('应该获取分类列表', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockCategories });

      const result = await blogService.getCategories();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/categories');
      expect(result).toEqual(mockCategories);
    });
  });

  describe('createCategory', () => {
    it('应该创建新分类', async () => {
      const newCategoryData = {
        name: '新分类',
        slug: 'new-category',
        description: '新分类描述'
      };

      const newCategory = { ...newCategoryData, id: '2', postCount: 0 };
      mockHttpClient.post.mockResolvedValue({ data: newCategory });

      const result = await blogService.createCategory(newCategoryData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/blog/categories', newCategoryData);
      expect(result).toEqual(newCategory);
    });
  });

  describe('convertNoteToPost', () => {
    it('应该将便签转换为博客文章', async () => {
      const convertData = {
        noteId: 'note1',
        title: '转换的文章',
        category: 'tech',
        tags: ['converted']
      };

      mockHttpClient.post.mockResolvedValue({ data: mockBlogPost });

      const result = await blogService.convertNoteToPost(convertData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/blog/convert-note', convertData);
      expect(result).toEqual(mockBlogPost);
    });
  });

  describe('getStats', () => {
    it('应该获取博客统计数据', async () => {
      const mockStats = {
        totalPosts: 10,
        publishedPosts: 8,
        draftPosts: 2,
        totalViews: 1000,
        totalComments: 50
      };

      mockHttpClient.get.mockResolvedValue({ data: mockStats });

      const result = await blogService.getStats();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('便捷方法', () => {
    it('getDrafts应该获取草稿列表', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      await blogService.getDrafts({ page: 1 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts?page=1&status=DRAFT');
    });

    it('getPublishedPosts应该获取已发布文章列表', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      await blogService.getPublishedPosts({ limit: 5 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts?limit=5&status=PUBLISHED');
    });

    it('getPostsByCategory应该按分类获取文章', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      await blogService.getPostsByCategory('tech', { page: 1 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts?page=1&category=tech');
    });

    it('getPostsByTags应该按标签获取文章', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      await blogService.getPostsByTags(['react', 'typescript'], { limit: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts?limit=10&tags=react&tags=typescript');
    });

    it('searchPosts应该搜索文章', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockPostListResponse });

      await blogService.searchPosts('test query', { page: 1 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blog/posts?page=1&search=test%20query');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理API错误', async () => {
      const apiError = {
        response: {
          data: {
            message: '自定义错误消息'
          }
        }
      };

      mockHttpClient.get.mockRejectedValue(apiError);

      await expect(blogService.getPosts()).rejects.toThrow('自定义错误消息');
    });

    it('应该在没有错误消息时使用默认消息', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(blogService.getPosts()).rejects.toThrow('获取文章列表失败');
    });
  });
});