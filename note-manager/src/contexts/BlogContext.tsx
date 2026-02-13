import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  BlogState,
  BlogArticle,
  BlogDraft,
  UserBlogSettings,
  BlogFilter,
  PaginationState,
  EditorState,
  BlogStats,
  ConvertSettings,
  DEFAULT_BLOG_FILTER,
  DEFAULT_PAGINATION,
  DEFAULT_EDITOR_STATE,
  ArticleStatus,
  Visibility,
} from '../types/blog';
import { Note } from '../types/note';
import blogApiService from '../services/blogService';
import { useAuth } from './AuthContext';

// 博客上下文类型
interface BlogContextType extends BlogState {
  // 文章操作
  loadArticles: (filter?: Partial<BlogFilter>, pagination?: Partial<PaginationState>) => Promise<void>;
  loadPublicArticles: (filter?: Partial<BlogFilter>, pagination?: Partial<PaginationState>) => Promise<void>;
  loadArticle: (id: string) => Promise<void>;
  createArticle: (data: any) => Promise<BlogArticle>;
  updateArticle: (id: string, data: any) => Promise<BlogArticle>;
  deleteArticle: (id: string) => Promise<void>;
  publishArticle: (id: string) => Promise<BlogArticle>;
  unpublishArticle: (id: string) => Promise<BlogArticle>;
  
  // 草稿操作
  loadDrafts: () => Promise<void>;
  saveDraft: (data: Partial<BlogDraft>) => Promise<BlogDraft>;
  updateDraft: (id: string, data: Partial<BlogDraft>) => Promise<BlogDraft>;
  deleteDraft: (id: string) => Promise<void>;
  
  // 筛选和分页
  setFilter: (filter: Partial<BlogFilter>) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  resetFilter: () => void;
  
  // 编辑器操作
  setEditorState: (state: Partial<EditorState>) => void;
  startEditing: (article?: BlogArticle) => void;
  stopEditing: () => void;
  
  // 便签转博客
  convertNoteToArticle: (note: Note, settings: ConvertSettings) => Promise<BlogArticle>;
  batchConvertNotes: (notes: Note[], settings: ConvertSettings) => Promise<BlogArticle[]>;
  
  // 用户博客设置
  loadUserBlogSettings: () => Promise<void>;
  updateUserBlogSettings: (settings: Partial<UserBlogSettings>) => Promise<void>;
  
  // 统计数据
  loadBlogStats: () => Promise<void>;
  
  // 标签和分类
  loadAllTags: () => Promise<void>;
  loadAllCategories: () => Promise<void>;
  
  // 搜索
  searchArticles: (query: string, options?: any) => Promise<void>;
  
  // 工具方法
  clearError: () => void;
  refreshData: () => Promise<void>;
}

// 博客状态初始值
const initialBlogState: BlogState = {
  // 文章相关
  articles: [],
  currentArticle: null,
  drafts: [],
  
  // 用户博客设置
  userBlogSettings: null,
  
  // UI 状态
  isLoading: false,
  error: null,
  
  // 筛选和分页
  filter: DEFAULT_BLOG_FILTER,
  pagination: DEFAULT_PAGINATION,
  
  // 编辑器状态
  editorState: DEFAULT_EDITOR_STATE,
  
  // 缓存状态
  allTags: [],
  allCategories: [],
  recentArticles: [],
};

// 博客操作类型
type BlogAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ARTICLES'; payload: BlogArticle[] }
  | { type: 'SET_CURRENT_ARTICLE'; payload: BlogArticle | null }
  | { type: 'ADD_ARTICLE'; payload: BlogArticle }
  | { type: 'UPDATE_ARTICLE'; payload: BlogArticle }
  | { type: 'REMOVE_ARTICLE'; payload: string }
  | { type: 'SET_DRAFTS'; payload: BlogDraft[] }
  | { type: 'ADD_DRAFT'; payload: BlogDraft }
  | { type: 'UPDATE_DRAFT'; payload: BlogDraft }
  | { type: 'REMOVE_DRAFT'; payload: string }
  | { type: 'SET_USER_BLOG_SETTINGS'; payload: UserBlogSettings }
  | { type: 'SET_FILTER'; payload: Partial<BlogFilter> }
  | { type: 'SET_PAGINATION'; payload: Partial<PaginationState> }
  | { type: 'RESET_FILTER' }
  | { type: 'SET_EDITOR_STATE'; payload: Partial<EditorState> }
  | { type: 'SET_ALL_TAGS'; payload: string[] }
  | { type: 'SET_ALL_CATEGORIES'; payload: string[] }
  | { type: 'SET_RECENT_ARTICLES'; payload: BlogArticle[] }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// 博客状态减速器
function blogReducer(state: BlogState, action: BlogAction): BlogState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_ARTICLES':
      return { ...state, articles: action.payload, isLoading: false };

    case 'SET_CURRENT_ARTICLE':
      return { ...state, currentArticle: action.payload };

    case 'ADD_ARTICLE':
      return {
        ...state,
        articles: [action.payload, ...state.articles],
      };

    case 'UPDATE_ARTICLE':
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.id ? action.payload : article
        ),
        currentArticle: state.currentArticle?.id === action.payload.id 
          ? action.payload 
          : state.currentArticle,
      };

    case 'REMOVE_ARTICLE':
      return {
        ...state,
        articles: state.articles.filter(article => article.id !== action.payload),
        currentArticle: state.currentArticle?.id === action.payload 
          ? null 
          : state.currentArticle,
      };

    case 'SET_DRAFTS':
      return { ...state, drafts: action.payload };

    case 'ADD_DRAFT':
      return {
        ...state,
        drafts: [action.payload, ...state.drafts],
      };

    case 'UPDATE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map(draft =>
          draft.id === action.payload.id ? action.payload : draft
        ),
      };

    case 'REMOVE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.filter(draft => draft.id !== action.payload),
      };

    case 'SET_USER_BLOG_SETTINGS':
      return { ...state, userBlogSettings: action.payload };

    case 'SET_FILTER':
      return {
        ...state,
        filter: { ...state.filter, ...action.payload },
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case 'RESET_FILTER':
      return {
        ...state,
        filter: DEFAULT_BLOG_FILTER,
        pagination: DEFAULT_PAGINATION,
      };

    case 'SET_EDITOR_STATE':
      return {
        ...state,
        editorState: { ...state.editorState, ...action.payload },
      };

    case 'SET_ALL_TAGS':
      return { ...state, allTags: action.payload };

    case 'SET_ALL_CATEGORIES':
      return { ...state, allCategories: action.payload };

    case 'SET_RECENT_ARTICLES':
      return { ...state, recentArticles: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET_STATE':
      return initialBlogState;

    default:
      return state;
  }
}

// 创建博客上下文
const BlogContext = createContext<BlogContextType | null>(null);

// BlogProvider 组件 Props
interface BlogProviderProps {
  children: ReactNode;
}

// BlogProvider 组件
export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(blogReducer, initialBlogState);
  const { user, isAuthenticated } = useAuth();

  // 错误处理函数
  const handleError = (error: any) => {
    console.error('[BlogContext] 操作失败:', error);
    const errorMessage = error.message || '操作失败，请重试';
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
  };

  // 加载文章列表
  const loadArticles = async (
    filter?: Partial<BlogFilter>, 
    pagination?: Partial<PaginationState>
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const currentFilter = { ...state.filter, ...filter };
      const currentPagination = { ...state.pagination, ...pagination };
      
      const response = await blogApiService.getArticles(currentFilter, currentPagination);
      
      dispatch({ type: 'SET_ARTICLES', payload: response.data });
      dispatch({ type: 'SET_PAGINATION', payload: response.pagination });
    } catch (error) {
      handleError(error);
    }
  };

  // 加载公开文章列表
  const loadPublicArticles = async (
    filter?: Partial<BlogFilter>,
    pagination?: Partial<PaginationState>
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const currentFilter = { ...state.filter, ...filter };
      const currentPagination = { ...state.pagination, ...pagination };
      
      const response = await blogApiService.getPublicArticles(currentFilter, currentPagination);
      
      dispatch({ type: 'SET_ARTICLES', payload: response.data });
      dispatch({ type: 'SET_PAGINATION', payload: response.pagination });
    } catch (error) {
      handleError(error);
    }
  };

  // 加载单篇文章
  const loadArticle = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const article = await blogApiService.getArticle(id);
      dispatch({ type: 'SET_CURRENT_ARTICLE', payload: article });
    } catch (error) {
      handleError(error);
    }
  };

  // 创建文章
  const createArticle = async (data: any): Promise<BlogArticle> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const article = await blogApiService.createArticle(data);
      dispatch({ type: 'ADD_ARTICLE', payload: article });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return article;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 更新文章
  const updateArticle = async (id: string, data: any): Promise<BlogArticle> => {
    try {
      const article = await blogApiService.updateArticle(id, data);
      dispatch({ type: 'UPDATE_ARTICLE', payload: article });
      
      return article;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 删除文章
  const deleteArticle = async (id: string): Promise<void> => {
    try {
      await blogApiService.deleteArticle(id);
      dispatch({ type: 'REMOVE_ARTICLE', payload: id });
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 发布文章
  const publishArticle = async (id: string): Promise<BlogArticle> => {
    try {
      const article = await blogApiService.publishArticle(id);
      dispatch({ type: 'UPDATE_ARTICLE', payload: article });
      
      return article;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 取消发布文章
  const unpublishArticle = async (id: string): Promise<BlogArticle> => {
    try {
      const article = await blogApiService.unpublishArticle(id);
      dispatch({ type: 'UPDATE_ARTICLE', payload: article });
      
      return article;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 加载草稿列表
  const loadDrafts = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;
      
      const drafts = await blogApiService.getDrafts();
      dispatch({ type: 'SET_DRAFTS', payload: drafts });
    } catch (error) {
      handleError(error);
    }
  };

  // 保存草稿
  const saveDraft = async (data: Partial<BlogDraft>): Promise<BlogDraft> => {
    try {
      const draft = await blogApiService.saveDraft(data);
      dispatch({ type: 'ADD_DRAFT', payload: draft });
      
      return draft;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 更新草稿
  const updateDraft = async (id: string, data: Partial<BlogDraft>): Promise<BlogDraft> => {
    try {
      const draft = await blogApiService.updateDraft(id, data);
      dispatch({ type: 'UPDATE_DRAFT', payload: draft });
      
      return draft;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 删除草稿
  const deleteDraft = async (id: string): Promise<void> => {
    try {
      await blogApiService.deleteDraft(id);
      dispatch({ type: 'REMOVE_DRAFT', payload: id });
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 设置筛选条件
  const setFilter = (filter: Partial<BlogFilter>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  // 设置分页信息
  const setPagination = (pagination: Partial<PaginationState>) => {
    dispatch({ type: 'SET_PAGINATION', payload: pagination });
  };

  // 重置筛选条件
  const resetFilter = () => {
    dispatch({ type: 'RESET_FILTER' });
  };

  // 设置编辑器状态
  const setEditorState = (editorState: Partial<EditorState>) => {
    dispatch({ type: 'SET_EDITOR_STATE', payload: editorState });
  };

  // 开始编辑
  const startEditing = (article?: BlogArticle) => {
    dispatch({
      type: 'SET_EDITOR_STATE',
      payload: {
        isEditing: true,
        isDirty: false,
      },
    });
    
    if (article) {
      dispatch({ type: 'SET_CURRENT_ARTICLE', payload: article });
    }
  };

  // 停止编辑
  const stopEditing = () => {
    dispatch({
      type: 'SET_EDITOR_STATE',
      payload: {
        isEditing: false,
        isDirty: false,
        currentDraft: undefined,
      },
    });
  };

  // 便签转博客文章
  const convertNoteToArticle = async (note: Note, settings: ConvertSettings): Promise<BlogArticle> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const article = await blogApiService.convertNoteToArticle(note.id, settings);
      dispatch({ type: 'ADD_ARTICLE', payload: article });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return article;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 批量转换便签
  const batchConvertNotes = async (notes: Note[], settings: ConvertSettings): Promise<BlogArticle[]> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const noteIds = notes.map(note => note.id);
      const articles = await blogApiService.batchConvertNotesToArticles(noteIds, settings);
      
      articles.forEach(article => {
        dispatch({ type: 'ADD_ARTICLE', payload: article });
      });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return articles;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 加载用户博客设置
  const loadUserBlogSettings = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;
      
      const settings = await blogApiService.getUserBlogSettings();
      dispatch({ type: 'SET_USER_BLOG_SETTINGS', payload: settings });
    } catch (error) {
      handleError(error);
    }
  };

  // 更新用户博客设置
  const updateUserBlogSettings = async (settings: Partial<UserBlogSettings>): Promise<void> => {
    try {
      const updatedSettings = await blogApiService.updateUserBlogSettings(settings);
      dispatch({ type: 'SET_USER_BLOG_SETTINGS', payload: updatedSettings });
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  // 加载博客统计数据
  const loadBlogStats = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;
      
      // 这里可以调用统计 API，暂时留空
      // const stats = await blogApiService.getBlogStats();
    } catch (error) {
      handleError(error);
    }
  };

  // 加载所有标签
  const loadAllTags = async (): Promise<void> => {
    try {
      const tags = await blogApiService.getAllTags();
      dispatch({ type: 'SET_ALL_TAGS', payload: tags });
    } catch (error) {
      console.warn('[BlogContext] 加载标签失败:', error);
    }
  };

  // 加载所有分类
  const loadAllCategories = async (): Promise<void> => {
    try {
      const categories = await blogApiService.getAllCategories();
      dispatch({ type: 'SET_ALL_CATEGORIES', payload: categories });
    } catch (error) {
      console.warn('[BlogContext] 加载分类失败:', error);
    }
  };

  // 搜索文章
  const searchArticles = async (query: string, options?: any): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await blogApiService.searchArticles(query, options, state.pagination);
      
      dispatch({ type: 'SET_ARTICLES', payload: response.data });
      dispatch({ type: 'SET_PAGINATION', payload: response.pagination });
    } catch (error) {
      handleError(error);
    }
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // 刷新数据
  const refreshData = async (): Promise<void> => {
    try {
      await Promise.all([
        loadAllTags(),
        loadAllCategories(),
        isAuthenticated ? loadDrafts() : Promise.resolve(),
        isAuthenticated ? loadUserBlogSettings() : Promise.resolve(),
      ]);
    } catch (error) {
      console.warn('[BlogContext] 刷新数据失败:', error);
    }
  };

  // 初始化时加载基础数据
  useEffect(() => {
    refreshData();
  }, [isAuthenticated]);

  // 上下文值
  const contextValue: BlogContextType = {
    ...state,
    loadArticles,
    loadPublicArticles,
    loadArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    publishArticle,
    unpublishArticle,
    loadDrafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    setFilter,
    setPagination,
    resetFilter,
    setEditorState,
    startEditing,
    stopEditing,
    convertNoteToArticle,
    batchConvertNotes,
    loadUserBlogSettings,
    updateUserBlogSettings,
    loadBlogStats,
    loadAllTags,
    loadAllCategories,
    searchArticles,
    clearError,
    refreshData,
  };

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};

// 使用博客上下文的 Hook
export const useBlog = (): BlogContextType => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};

export default BlogContext;