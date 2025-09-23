import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBlogPosts, useBlogPost, useBlogEditor } from '../hooks/useBlog';
import { blogService } from '../services/blogService';
import { BlogPost, PublishStatus } from '../types/blog';

// Mock blogService
vi.mock('../services/blogService', () => ({
  blogService: {
    getPosts: vi.fn(),
    getPost: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    publishPost: vi.fn(),
    unpublishPost: vi.fn(),
    archivePost: vi.fn()
  }
}));

const mockBlogService = blogService as any;

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

const mockPostDetailResponse = {
  post: mockBlogPost,
  relatedPosts: [],
  comments: []
};

describe('useBlogPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该初始化时获取文章列表', async () => {
    mockBlogService.getPosts.mockResolvedValue(mockPostListResponse);

    const { result } = renderHook(() => useBlogPosts());

    expect(result.current.loading).toBe(true);
    expect(result.current.posts).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.posts).toEqual([mockBlogPost]);
    expect(result.current.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    });
    expect(mockBlogService.getPosts).toHaveBeenCalledWith({});
  });

  it('应该使用初始筛选条件', async () => {
    const initialFilter = { category: 'tech', page: 2 };
    mockBlogService.getPosts.mockResolvedValue(mockPostListResponse);

    renderHook(() => useBlogPosts(initialFilter));

    await waitFor(() => {
      expect(mockBlogService.getPosts).toHaveBeenCalledWith(initialFilter);
    });
  });

  it('应该处理获取文章时的错误', async () => {
    const errorMessage = '网络错误';
    mockBlogService.getPosts.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useBlogPosts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.posts).toEqual([]);
  });

  it('应该更新筛选条件并重新获取数据', async () => {
    mockBlogService.getPosts.mockResolvedValue(mockPostListResponse);

    const { result } = renderHook(() => useBlogPosts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateFilter({ category: 'tech' });
    });

    expect(result.current.filter).toEqual({ category: 'tech' });
    expect(mockBlogService.getPosts).toHaveBeenCalledWith({ category: 'tech' });
  });

  it('应该支持加载更多功能', async () => {
    const multiPageResponse = {
      ...mockPostListResponse,
      page: 1,
      totalPages: 2
    };
    mockBlogService.getPosts.mockResolvedValue(multiPageResponse);

    const { result } = renderHook(() => useBlogPosts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    expect(mockBlogService.getPosts).toHaveBeenCalledWith({ page: 2 });
  });

  it('应该在没有更多页面时不允许加载更多', async () => {
    mockBlogService.getPosts.mockResolvedValue(mockPostListResponse);

    const { result } = renderHook(() => useBlogPosts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);

    act(() => {
      result.current.loadMore();
    });

    // 不应该再次调用 getPosts
    expect(mockBlogService.getPosts).toHaveBeenCalledTimes(1);
  });
});

describe('useBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该在提供postId时获取文章详情', async () => {
    mockBlogService.getPost.mockResolvedValue(mockPostDetailResponse);

    const { result } = renderHook(() => useBlogPost('1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.post).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.post).toEqual(mockBlogPost);
    expect(result.current.relatedPosts).toEqual([]);
    expect(mockBlogService.getPost).toHaveBeenCalledWith('1');
  });

  it('应该在postId为null时不获取数据', () => {
    const { result } = renderHook(() => useBlogPost(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.post).toBe(null);
    expect(mockBlogService.getPost).not.toHaveBeenCalled();
  });

  it('应该处理获取文章详情时的错误', async () => {
    const errorMessage = '文章不存在';
    mockBlogService.getPost.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useBlogPost('999'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.post).toBe(null);
  });

  it('应该支持更新文章', async () => {
    const updatedPost = { ...mockBlogPost, title: '更新的标题' };
    mockBlogService.getPost.mockResolvedValue(mockPostDetailResponse);
    mockBlogService.updatePost.mockResolvedValue(updatedPost);

    const { result } = renderHook(() => useBlogPost('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updateResult;
    await act(async () => {
      updateResult = await result.current.updatePost('1', { title: '更新的标题' });
    });

    expect(updateResult).toEqual(updatedPost);
    expect(result.current.post).toEqual(updatedPost);
    expect(mockBlogService.updatePost).toHaveBeenCalledWith('1', { title: '更新的标题' });
  });

  it('应该支持删除文章', async () => {
    mockBlogService.getPost.mockResolvedValue(mockPostDetailResponse);
    mockBlogService.deletePost.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBlogPost('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deletePost('1');
    });

    expect(result.current.post).toBe(null);
    expect(mockBlogService.deletePost).toHaveBeenCalledWith('1');
  });

  it('应该支持发布文章', async () => {
    const publishedPost = { ...mockBlogPost, status: PublishStatus.PUBLISHED };
    mockBlogService.getPost.mockResolvedValue(mockPostDetailResponse);
    mockBlogService.publishPost.mockResolvedValue(publishedPost);

    const { result } = renderHook(() => useBlogPost('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let publishResult;
    await act(async () => {
      publishResult = await result.current.publishPost('1');
    });

    expect(publishResult).toEqual(publishedPost);
    expect(result.current.post).toEqual(publishedPost);
    expect(mockBlogService.publishPost).toHaveBeenCalledWith('1');
  });
});

describe('useBlogEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该初始化为空表单', () => {
    const { result } = renderHook(() => useBlogEditor());

    expect(result.current.title).toBe('');
    expect(result.current.content).toBe('');
    expect(result.current.category).toBe('');
    expect(result.current.tags).toEqual([]);
    expect(result.current.status).toBe(PublishStatus.DRAFT);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canSave).toBe(false);
  });

  it('应该使用初始文章数据初始化', () => {
    const { result } = renderHook(() => useBlogEditor(mockBlogPost));

    expect(result.current.title).toBe(mockBlogPost.title);
    expect(result.current.content).toBe(mockBlogPost.content);
    expect(result.current.category).toBe(mockBlogPost.category);
    expect(result.current.tags).toEqual(mockBlogPost.tags);
    expect(result.current.status).toBe(mockBlogPost.status);
  });

  it('应该更新标题并标记为dirty', () => {
    const { result } = renderHook(() => useBlogEditor());

    act(() => {
      result.current.updateTitle('新标题');
    });

    expect(result.current.title).toBe('新标题');
    expect(result.current.isDirty).toBe(true);
  });

  it('应该更新内容并标记为dirty', () => {
    const { result } = renderHook(() => useBlogEditor());

    act(() => {
      result.current.updateContent('新内容');
    });

    expect(result.current.content).toBe('新内容');
    expect(result.current.isDirty).toBe(true);
  });

  it('应该支持添加和删除标签', () => {
    const { result } = renderHook(() => useBlogEditor());

    act(() => {
      result.current.addTag('react');
    });

    expect(result.current.tags).toEqual(['react']);
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.addTag('typescript');
    });

    expect(result.current.tags).toEqual(['react', 'typescript']);

    act(() => {
      result.current.removeTag('react');
    });

    expect(result.current.tags).toEqual(['typescript']);
  });

  it('应该不添加重复标签', () => {
    const { result } = renderHook(() => useBlogEditor());

    act(() => {
      result.current.addTag('react');
      result.current.addTag('react');
    });

    expect(result.current.tags).toEqual(['react']);
  });

  it('应该不添加空标签', () => {
    const { result } = renderHook(() => useBlogEditor());

    act(() => {
      result.current.addTag('');
      result.current.addTag('   ');
    });

    expect(result.current.tags).toEqual([]);
  });

  it('应该在有必填字段时启用保存', () => {
    const { result } = renderHook(() => useBlogEditor());

    expect(result.current.canSave).toBe(false);

    act(() => {
      result.current.updateTitle('标题');
      result.current.updateContent('内容');
      result.current.updateCategory('分类');
    });

    expect(result.current.canSave).toBe(true);
  });

  it('应该保存新文章', async () => {
    mockBlogService.createPost.mockResolvedValue(mockBlogPost);

    const { result } = renderHook(() => useBlogEditor());

    act(() => {
      result.current.updateTitle('新文章');
      result.current.updateContent('新内容');
      result.current.updateCategory('tech');
    });

    let saveResult;
    await act(async () => {
      saveResult = await result.current.savePost();
    });

    expect(saveResult).toEqual(mockBlogPost);
    expect(result.current.isDirty).toBe(false);
    expect(mockBlogService.createPost).toHaveBeenCalledWith({
      title: '新文章',
      content: '新内容',
      category: 'tech',
      tags: [],
      status: PublishStatus.DRAFT,
      excerpt: '新内容'
    });
  });

  it('应该更新现有文章', async () => {
    const updatedPost = { ...mockBlogPost, title: '更新的标题' };
    mockBlogService.updatePost.mockResolvedValue(updatedPost);

    const { result } = renderHook(() => useBlogEditor(mockBlogPost));

    act(() => {
      result.current.updateTitle('更新的标题');
    });

    let saveResult;
    await act(async () => {
      saveResult = await result.current.savePost('1');
    });

    expect(saveResult).toEqual(updatedPost);
    expect(mockBlogService.updatePost).toHaveBeenCalledWith('1', {
      title: '更新的标题',
      content: mockBlogPost.content,
      category: mockBlogPost.category,
      tags: mockBlogPost.tags,
      status: mockBlogPost.status,
      excerpt: mockBlogPost.content.substring(0, 200)
    });
  });

  it('应该重置表单', () => {
    const { result } = renderHook(() => useBlogEditor(mockBlogPost));

    act(() => {
      result.current.updateTitle('修改的标题');
      result.current.updateContent('修改的内容');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.title).toBe(mockBlogPost.title);
    expect(result.current.content).toBe(mockBlogPost.content);
    expect(result.current.isDirty).toBe(false);
  });
});