import { useState, useEffect, useRef } from 'react';
import { useBlog } from '../contexts/BlogContext';
import { BlogDraft, BlogArticle, EditorState } from '../types/blog';
import { calculateReadTime } from '../utils/dateUtils';

// 博客编辑器相关的自定义 hook
export const useBlogEditor = (articleId?: string) => {
  const {
    currentArticle,
    editorState,
    setEditorState,
    loadArticle,
    createArticle,
    updateArticle,
    saveDraft,
    updateDraft,
    drafts,
  } = useBlog();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);

  // 初始化编辑器内容
  useEffect(() => {
    if (articleId && !isInitialized.current) {
      loadArticle(articleId);
      isInitialized.current = true;
    }
  }, [articleId, loadArticle]);

  // 当文章加载完成后，设置编辑器内容
  useEffect(() => {
    if (currentArticle && currentArticle.id === articleId) {
      setTitle(currentArticle.title);
      setContent(currentArticle.content);
      setTags(currentArticle.tags);
      setCategories(currentArticle.categories);
      setExcerpt(currentArticle.excerpt || '');
    }
  }, [currentArticle, articleId]);

  // 标记编辑器为脏状态
  const markAsDirty = () => {
    if (!editorState.isDirty) {
      setEditorState({ isDirty: true });
    }
  };

  // 内容更改处理
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    markAsDirty();
    scheduleAutoSave();
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    markAsDirty();
    scheduleAutoSave();
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    markAsDirty();
  };

  const handleCategoriesChange = (newCategories: string[]) => {
    setCategories(newCategories);
    markAsDirty();
  };

  const handleExcerptChange = (newExcerpt: string) => {
    setExcerpt(newExcerpt);
    markAsDirty();
  };

  // 自动保存调度
  const scheduleAutoSave = () => {
    if (!editorState.autoSaveEnabled) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 3000); // 3秒后自动保存
  };

  // 自动保存处理
  const handleAutoSave = async () => {
    if (!title.trim() && !content.trim()) return;

    try {
      setIsAutoSaving(true);

      const draftData: Partial<BlogDraft> = {
        title: title || '无标题',
        content,
        tags,
        categories,
        autoSavedAt: new Date(),
      };

      // 查找现有草稿或创建新草稿
      const existingDraft = drafts.find(draft => 
        articleId ? draft.id === articleId : draft.title === draftData.title
      );

      if (existingDraft) {
        await updateDraft(existingDraft.id, draftData);
      } else {
        await saveDraft(draftData);
      }

      setLastSaved(new Date());
      setEditorState({ isDirty: false });
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // 手动保存草稿
  const saveDraftManually = async (): Promise<void> => {
    await handleAutoSave();
  };

  // 发布文章
  const publishArticle = async (publishSettings?: any): Promise<BlogArticle> => {
    const readTime = calculateReadTime(content);
    
    const articleData = {
      title: title || '无标题',
      content,
      excerpt: excerpt || content.slice(0, 150) + '...',
      tags,
      categories,
      readTime,
      ...publishSettings,
    };

    if (articleId) {
      return await updateArticle(articleId, articleData);
    } else {
      return await createArticle(articleData);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 编辑器状态
    title,
    content,
    tags,
    categories,
    excerpt,
    isAutoSaving,
    lastSaved,
    isDirty: editorState.isDirty,
    
    // 处理函数
    handleTitleChange,
    handleContentChange,
    handleTagsChange,
    handleCategoriesChange,
    handleExcerptChange,
    
    // 保存和发布
    saveDraftManually,
    publishArticle,
    
    // 工具函数
    readTime: calculateReadTime(content),
    wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
    characterCount: content.length,
  };
};

// 博客列表相关的自定义 hook
export const useBlogList = () => {
  const {
    articles,
    filter,
    pagination,
    isLoading,
    allTags,
    allCategories,
    loadArticles,
    loadPublicArticles,
    setFilter,
    setPagination,
    resetFilter,
  } = useBlog();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 加载文章列表
  const loadArticlesList = async (showPrivate: boolean = false) => {
    if (showPrivate) {
      await loadArticles(filter, pagination);
    } else {
      await loadPublicArticles(filter, pagination);
    }
  };

  // 搜索文章
  const searchArticles = (searchTerm: string) => {
    setFilter({ searchTerm });
    setPagination({ currentPage: 1 });
  };

  // 按标签筛选
  const filterByTag = (tag: string) => {
    const newTags = filter.selectedTags.includes(tag)
      ? filter.selectedTags.filter(t => t !== tag)
      : [...filter.selectedTags, tag];
    
    setFilter({ selectedTags: newTags });
    setPagination({ currentPage: 1 });
  };

  // 按分类筛选
  const filterByCategory = (category: string) => {
    const newCategories = filter.selectedCategories.includes(category)
      ? filter.selectedCategories.filter(c => c !== category)
      : [...filter.selectedCategories, category];
    
    setFilter({ selectedCategories: newCategories });
    setPagination({ currentPage: 1 });
  };

  // 翻页
  const goToPage = (page: number) => {
    setPagination({ currentPage: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    // 状态
    articles,
    filter,
    pagination,
    isLoading,
    allTags,
    allCategories,
    viewMode,
    
    // 操作函数
    loadArticlesList,
    searchArticles,
    filterByTag,
    filterByCategory,
    goToPage,
    setViewMode,
    resetFilter,
    
    // 工具函数
    hasFilters: filter.searchTerm || filter.selectedTags.length > 0 || filter.selectedCategories.length > 0,
    totalArticles: pagination.totalItems,
  };
};

// 博客文章详情相关的自定义 hook
export const useBlogDetail = (articleId: string) => {
  const { currentArticle, loadArticle, isLoading } = useBlog();
  const [relatedArticles, setRelatedArticles] = useState<BlogArticle[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
    }
  }, [articleId, loadArticle]);

  // 点赞文章
  const toggleLike = async () => {
    if (!currentArticle) return;

    try {
      // 这里应该调用 API 来点赞/取消点赞
      setIsLiked(!isLiked);
      
      // 更新文章的点赞数
      // const updatedArticle = await blogApiService.likeArticle(currentArticle.id);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 分享文章
  const shareArticle = async (platform: string) => {
    if (!currentArticle) return;

    const shareData = {
      title: currentArticle.title,
      text: currentArticle.excerpt || currentArticle.title,
      url: window.location.href,
    };

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      // 复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('链接已复制到剪贴板');
      } catch (error) {
        console.error('复制链接失败:', error);
      }
    }
  };

  return {
    // 状态
    article: currentArticle,
    isLoading,
    relatedArticles,
    isLiked,
    
    // 操作函数
    toggleLike,
    shareArticle,
    
    // 工具函数
    readProgress: 0, // 可以后续实现阅读进度跟踪
  };
};

// 博客搜索相关的自定义 hook
export const useBlogSearch = () => {
  const { searchArticles } = useBlog();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 执行搜索
  const performSearch = async (query: string, options?: any) => {
    if (query.trim()) {
      // 添加到搜索历史
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('blog_search_history', JSON.stringify(newHistory));
      
      // 执行搜索
      await searchArticles(query, options);
    }
  };

  // 加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('blog_search_history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('blog_search_history');
  };

  return {
    searchHistory,
    suggestions,
    performSearch,
    clearSearchHistory,
  };
};

// 响应式设计相关的自定义 hook
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize.width < 768,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isSmallScreen: screenSize.width < 480,
  };
};