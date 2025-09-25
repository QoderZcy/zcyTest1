import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  Article, 
  ArticleCard, 
  Category, 
  Tag, 
  ArticleListQuery, 
  ArticleSearchQuery,
  CreateArticleRequest,
  UpdateArticleRequest
} from '../types';

// 博客状态接口
interface BlogState {
  // 文章相关
  articles: ArticleCard[];
  currentArticle: Article | null;
  articlesLoading: boolean;
  articleLoading: boolean;
  
  // 分类和标签
  categories: Category[];
  tags: Tag[];
  
  // 搜索
  searchResults: ArticleCard[];
  searchLoading: boolean;
  searchQuery: string;
  
  // 分页
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalPages: number;
  };
  
  // 错误状态
  error: string | null;
}

// 博客操作类型
type BlogAction =
  | { type: 'SET_ARTICLES_LOADING'; payload: boolean }
  | { type: 'SET_ARTICLES'; payload: { articles: ArticleCard[]; pagination: any } }
  | { type: 'SET_ARTICLE_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_ARTICLE'; payload: Article | null }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_TAGS'; payload: Tag[] }
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_RESULTS'; payload: { results: ArticleCard[]; query: string } }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_ARTICLE_IN_LIST'; payload: ArticleCard }
  | { type: 'REMOVE_ARTICLE_FROM_LIST'; payload: string };

// 博客上下文接口
interface BlogContextType {
  state: BlogState;
  // 文章操作
  fetchArticles: (query?: ArticleListQuery) => Promise<void>;
  fetchArticle: (id: string) => Promise<void>;
  createArticle: (data: CreateArticleRequest) => Promise<Article>;
  updateArticle: (id: string, data: UpdateArticleRequest) => Promise<Article>;
  deleteArticle: (id: string) => Promise<void>;
  
  // 分类和标签操作
  fetchCategories: () => Promise<void>;
  fetchTags: () => Promise<void>;
  
  // 搜索操作
  searchArticles: (query: ArticleSearchQuery) => Promise<void>;
  clearSearch: () => void;
  
  // 通用操作
  clearError: () => void;
}

// 初始状态
const initialState: BlogState = {
  articles: [],
  currentArticle: null,
  articlesLoading: false,
  articleLoading: false,
  
  categories: [],
  tags: [],
  
  searchResults: [],
  searchLoading: false,
  searchQuery: '',
  
  pagination: {
    current: 1,
    total: 0,
    pageSize: 10,
    totalPages: 0,
  },
  
  error: null,
};

// 博客状态reducer
function blogReducer(state: BlogState, action: BlogAction): BlogState {
  switch (action.type) {
    case 'SET_ARTICLES_LOADING':
      return {
        ...state,
        articlesLoading: action.payload,
        error: null,
      };
    case 'SET_ARTICLES':
      return {
        ...state,
        articles: action.payload.articles,
        pagination: action.payload.pagination,
        articlesLoading: false,
        error: null,
      };
    case 'SET_ARTICLE_LOADING':
      return {
        ...state,
        articleLoading: action.payload,
        error: null,
      };
    case 'SET_CURRENT_ARTICLE':
      return {
        ...state,
        currentArticle: action.payload,
        articleLoading: false,
        error: null,
      };
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
        error: null,
      };
    case 'SET_TAGS':
      return {
        ...state,
        tags: action.payload,
        error: null,
      };
    case 'SET_SEARCH_LOADING':
      return {
        ...state,
        searchLoading: action.payload,
        error: null,
      };
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload.results,
        searchQuery: action.payload.query,
        searchLoading: false,
        error: null,
      };
    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchResults: [],
        searchQuery: '',
        searchLoading: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        articlesLoading: false,
        articleLoading: false,
        searchLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_ARTICLE_IN_LIST':
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.id ? action.payload : article
        ),
      };
    case 'REMOVE_ARTICLE_FROM_LIST':
      return {
        ...state,
        articles: state.articles.filter(article => article.id !== action.payload),
      };
    default:
      return state;
  }
}

// 创建博客上下文
const BlogContext = createContext<BlogContextType | undefined>(undefined);

// 博客Provider组件
interface BlogProviderProps {
  children: ReactNode;
}

export function BlogProvider({ children }: BlogProviderProps) {
  const [state, dispatch] = useReducer(blogReducer, initialState);

  // 获取文章列表
  const fetchArticles = async (query: ArticleListQuery = {}): Promise<void> => {
    dispatch({ type: 'SET_ARTICLES_LOADING', payload: true });
    
    try {
      // 这里应该调用实际的API
      // const response = await articleService.getArticles(query);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟文章数据
      const mockArticles: ArticleCard[] = [
        {
          id: '1',
          title: 'React 18 新特性详解',
          summary: '深入了解 React 18 带来的并发特性、自动批处理、新的 Hooks 等重要更新。',
          author: {
            id: '1',
            username: 'tech_writer',
            avatar: 'https://example.com/avatar1.jpg',
          },
          category: {
            id: '1',
            name: 'React',
          },
          tags: ['React', 'JavaScript', 'Frontend'],
          viewCount: 1234,
          likeCount: 89,
          commentCount: 23,
          publishedAt: new Date('2023-10-01'),
          readTime: 8,
        },
        {
          id: '2',
          title: 'TypeScript 实战指南',
          summary: '从基础到进阶，掌握 TypeScript 在大型项目中的最佳实践。',
          author: {
            id: '2',
            username: 'js_expert',
            avatar: 'https://example.com/avatar2.jpg',
          },
          category: {
            id: '2',
            name: 'TypeScript',
          },
          tags: ['TypeScript', 'JavaScript'],
          viewCount: 987,
          likeCount: 67,
          commentCount: 15,
          publishedAt: new Date('2023-09-28'),
          readTime: 12,
        },
      ];
      
      const mockPagination = {
        current: query.page || 1,
        total: 50,
        pageSize: query.limit || 10,
        totalPages: 5,
      };
      
      dispatch({ 
        type: 'SET_ARTICLES', 
        payload: { 
          articles: mockArticles, 
          pagination: mockPagination 
        } 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取文章列表失败';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  // 获取单篇文章
  const fetchArticle = async (id: string): Promise<void> => {
    dispatch({ type: 'SET_ARTICLE_LOADING', payload: true });
    
    try {
      // 这里应该调用实际的API
      // const response = await articleService.getArticle(id);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟文章详情数据
      const mockArticle: Article = {
        id,
        title: 'React 18 新特性详解',
        content: `
          <h2>React 18 带来的重大更新</h2>
          <p>React 18 是一个重要的版本更新，引入了许多新特性...</p>
          <h3>并发特性</h3>
          <p>React 18 的并发特性让应用更加流畅...</p>
        `,
        summary: '深入了解 React 18 带来的并发特性、自动批处理、新的 Hooks 等重要更新。',
        authorId: '1',
        categoryId: '1',
        tags: ['React', 'JavaScript', 'Frontend'],
        status: 'published' as any,
        viewCount: 1234,
        likeCount: 89,
        commentCount: 23,
        publishedAt: new Date('2023-10-01'),
        createdAt: new Date('2023-09-30'),
        updatedAt: new Date('2023-10-01'),
      };
      
      dispatch({ type: 'SET_CURRENT_ARTICLE', payload: mockArticle });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取文章详情失败';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  // 创建文章（占位实现）
  const createArticle = async (data: CreateArticleRequest): Promise<Article> => {
    // 实际实现时调用API
    throw new Error('Not implemented yet');
  };

  // 更新文章（占位实现）
  const updateArticle = async (id: string, data: UpdateArticleRequest): Promise<Article> => {
    // 实际实现时调用API
    throw new Error('Not implemented yet');
  };

  // 删除文章（占位实现）
  const deleteArticle = async (id: string): Promise<void> => {
    // 实际实现时调用API
    throw new Error('Not implemented yet');
  };

  // 获取分类列表
  const fetchCategories = async (): Promise<void> => {
    try {
      // 模拟分类数据
      const mockCategories: Category[] = [
        { id: '1', name: 'React', articleCount: 15, createdAt: new Date() },
        { id: '2', name: 'TypeScript', articleCount: 8, createdAt: new Date() },
        { id: '3', name: 'JavaScript', articleCount: 25, createdAt: new Date() },
        { id: '4', name: 'CSS', articleCount: 12, createdAt: new Date() },
      ];
      
      dispatch({ type: 'SET_CATEGORIES', payload: mockCategories });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取分类列表失败';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  // 获取标签列表
  const fetchTags = async (): Promise<void> => {
    try {
      // 模拟标签数据
      const mockTags: Tag[] = [
        { id: '1', name: 'React', articleCount: 20, createdAt: new Date() },
        { id: '2', name: 'JavaScript', articleCount: 35, createdAt: new Date() },
        { id: '3', name: 'TypeScript', articleCount: 15, createdAt: new Date() },
        { id: '4', name: 'Frontend', articleCount: 28, createdAt: new Date() },
        { id: '5', name: 'CSS', articleCount: 12, createdAt: new Date() },
      ];
      
      dispatch({ type: 'SET_TAGS', payload: mockTags });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取标签列表失败';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  // 搜索文章
  const searchArticles = async (query: ArticleSearchQuery): Promise<void> => {
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    
    try {
      // 这里应该调用实际的搜索API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟搜索结果
      const mockResults: ArticleCard[] = [
        {
          id: '3',
          title: `搜索结果：${query.keyword}`,
          summary: '这是一个包含搜索关键词的文章摘要...',
          author: {
            id: '1',
            username: 'search_author',
            avatar: 'https://example.com/avatar3.jpg',
          },
          tags: ['搜索', query.keyword],
          viewCount: 456,
          likeCount: 23,
          commentCount: 8,
          publishedAt: new Date(),
          readTime: 5,
        },
      ];
      
      dispatch({ 
        type: 'SET_SEARCH_RESULTS', 
        payload: { 
          results: mockResults, 
          query: query.keyword 
        } 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '搜索失败';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  // 清除搜索结果
  const clearSearch = (): void => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  // 清除错误
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: BlogContextType = {
    state,
    fetchArticles,
    fetchArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    fetchCategories,
    fetchTags,
    searchArticles,
    clearSearch,
    clearError,
  };

  return (
    <BlogContext.Provider value={value}>
      {children}
    </BlogContext.Provider>
  );
}

// 自定义hook使用博客上下文
export function useBlog(): BlogContextType {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}