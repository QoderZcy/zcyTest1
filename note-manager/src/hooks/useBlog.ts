import { useState, useCallback, useEffect } from 'react';
import { 
  BlogPost, 
  BlogCategory, 
  BlogFilter, 
  BlogPostListResponse, 
  BlogPostDetailResponse,
  NewBlogPost,
  ConvertNoteRequest,
  BlogStats,
  PublishStatus 
} from '../types/blog';
import { blogService } from '../services/blogService';

/**
 * 博客文章列表Hook
 */
export const useBlogPosts = (initialFilter: BlogFilter = {}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BlogFilter>(initialFilter);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchPosts = useCallback(async (newFilter?: BlogFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const filterToUse = newFilter || filter;
      const response: BlogPostListResponse = await blogService.getPosts(filterToUse);
      
      setPosts(response.posts);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取文章列表失败';
      setError(errorMessage);
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const updateFilter = useCallback((newFilter: Partial<BlogFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    fetchPosts(updatedFilter);
  }, [filter, fetchPosts]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      updateFilter({ page: pagination.page + 1 });
    }
  }, [pagination.page, pagination.totalPages, updateFilter]);

  const refresh = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    filter,
    pagination,
    updateFilter,
    loadMore,
    refresh,
    hasMore: pagination.page < pagination.totalPages
  };
};

/**
 * 单篇博客文章Hook
 */
export const useBlogPost = (postId: string | null) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: BlogPostDetailResponse = await blogService.getPost(id);
      setPost(response.post);
      setRelatedPosts(response.relatedPosts || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取文章详情失败';
      setError(errorMessage);
      setPost(null);
      setRelatedPosts([]);
      console.error('Failed to fetch post:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePost = useCallback(async (id: string, updates: Partial<BlogPost>) => {
    try {
      const updatedPost = await blogService.updatePost(id, updates);
      setPost(updatedPost);
      return updatedPost;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新文章失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    try {
      await blogService.deletePost(id);
      setPost(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除文章失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const publishPost = useCallback(async (id: string) => {
    try {
      const publishedPost = await blogService.publishPost(id);
      setPost(publishedPost);
      return publishedPost;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发布文章失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const unpublishPost = useCallback(async (id: string) => {
    try {
      const unpublishedPost = await blogService.unpublishPost(id);
      setPost(unpublishedPost);
      return unpublishedPost;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取消发布失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const archivePost = useCallback(async (id: string) => {
    try {
      const archivedPost = await blogService.archivePost(id);
      setPost(archivedPost);
      return archivedPost;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '归档文章失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
    }
  }, [postId, fetchPost]);

  return {
    post,
    relatedPosts,
    loading,
    error,
    updatePost,
    deletePost,
    publishPost,
    unpublishPost,
    archivePost,
    refresh: () => postId && fetchPost(postId)
  };
};

/**
 * 博客分类Hook
 */
export const useBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await blogService.getCategories();
      setCategories(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取分类列表失败';
      setError(errorMessage);
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData: Omit<BlogCategory, 'id' | 'postCount'>) => {
    try {
      const newCategory = await blogService.createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建分类失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    refresh: fetchCategories
  };
};

/**
 * 博客编辑器Hook
 */
export const useBlogEditor = (initialPost?: BlogPost) => {
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [category, setCategory] = useState(initialPost?.category || '');
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [status, setStatus] = useState<PublishStatus>(initialPost?.status || PublishStatus.DRAFT);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTitle = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setIsDirty(true);
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  const updateCategory = useCallback((newCategory: string) => {
    setCategory(newCategory);
    setIsDirty(true);
  }, []);

  const updateTags = useCallback((newTags: string[]) => {
    setTags(newTags);
    setIsDirty(true);
  }, []);

  const updateStatus = useCallback((newStatus: PublishStatus) => {
    setStatus(newStatus);
    setIsDirty(true);
  }, []);

  const addTag = useCallback((tag: string) => {
    if (tag && !tags.includes(tag)) {
      updateTags([...tags, tag]);
    }
  }, [tags, updateTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    updateTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags, updateTags]);

  const savePost = useCallback(async (postId?: string): Promise<BlogPost> => {
    setSaving(true);
    setError(null);
    
    try {
      const postData = {
        title,
        content,
        category,
        tags,
        status,
        excerpt: content.substring(0, 200)
      };

      let savedPost: BlogPost;
      if (postId) {
        savedPost = await blogService.updatePost(postId, postData);
      } else {
        savedPost = await blogService.createPost(postData as NewBlogPost);
      }

      setIsDirty(false);
      return savedPost;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存文章失败';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [title, content, category, tags, status]);

  const resetForm = useCallback(() => {
    setTitle(initialPost?.title || '');
    setContent(initialPost?.content || '');
    setCategory(initialPost?.category || '');
    setTags(initialPost?.tags || []);
    setStatus(initialPost?.status || PublishStatus.DRAFT);
    setIsDirty(false);
    setError(null);
  }, [initialPost]);

  const canSave = title.trim() && content.trim() && category.trim();

  return {
    title,
    content,
    category,
    tags,
    status,
    isDirty,
    saving,
    error,
    canSave,
    updateTitle,
    updateContent,
    updateCategory,
    updateTags,
    updateStatus,
    addTag,
    removeTag,
    savePost,
    resetForm
  };
};

/**
 * 便签转博客Hook
 */
export const useNoteConverter = () => {
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertNote = useCallback(async (convertData: ConvertNoteRequest): Promise<BlogPost> => {
    setConverting(true);
    setError(null);
    
    try {
      const blogPost = await blogService.convertNoteToPost(convertData);
      return blogPost;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '便签转换失败';
      setError(errorMessage);
      throw err;
    } finally {
      setConverting(false);
    }
  }, []);

  return {
    converting,
    error,
    convertNote
  };
};

/**
 * 博客统计Hook
 */
export const useBlogStats = () => {
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await blogService.getStats();
      setStats(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取统计数据失败';
      setError(errorMessage);
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
};