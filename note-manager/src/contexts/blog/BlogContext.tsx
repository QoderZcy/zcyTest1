// Blog content management context

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  BlogPost, 
  CreateBlogPostData, 
  UpdateBlogPostData,
  BlogPostFilter,
  BlogPostListResponse,
  PostStatus,
  PostType 
} from '../../types/blog/post';
import { Category, Tag } from '../../types/blog';
import { useBlogAuth } from './BlogAuthContext';

// Blog state interface
interface BlogState {
  // Posts
  posts: BlogPost[];
  featuredPosts: BlogPost[];
  currentPost: BlogPost | null;
  
  // Categories and tags
  categories: Category[];
  tags: Tag[];
  
  // Filters and search
  filter: BlogPostFilter;
  searchResults: BlogPost[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Blog actions
type BlogAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_POSTS'; payload: BlogPostListResponse }
  | { type: 'SET_FEATURED_POSTS'; payload: BlogPost[] }
  | { type: 'SET_CURRENT_POST'; payload: BlogPost | null }
  | { type: 'ADD_POST'; payload: BlogPost }
  | { type: 'UPDATE_POST'; payload: BlogPost }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_TAGS'; payload: Tag[] }
  | { type: 'SET_FILTER'; payload: Partial<BlogPostFilter> }
  | { type: 'SET_SEARCH_RESULTS'; payload: BlogPost[] }
  | { type: 'CLEAR_SEARCH_RESULTS' };

// Initial state
const initialState: BlogState = {
  posts: [],
  featuredPosts: [],
  currentPost: null,
  categories: [],
  tags: [],
  filter: {
    searchTerm: '',
    status: [PostStatus.PUBLISHED],
    type: [],
    categoryId: '',
    tags: [],
    authorId: '',
    sortBy: 'publishedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  },
  searchResults: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalPosts: 0,
  hasNextPage: false,
  hasPrevPage: false
};

// Reducer
function blogReducer(state: BlogState, action: BlogAction): BlogState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload.posts,
        currentPage: action.payload.page,
        totalPages: action.payload.totalPages,
        totalPosts: action.payload.total,
        hasNextPage: action.payload.hasNextPage,
        hasPrevPage: action.payload.hasPrevPage,
        loading: false,
        error: null
      };
    
    case 'SET_FEATURED_POSTS':
      return { ...state, featuredPosts: action.payload };
    
    case 'SET_CURRENT_POST':
      return { ...state, currentPost: action.payload };
    
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        totalPosts: state.totalPosts + 1
      };
    
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.id ? action.payload : post
        ),
        currentPost: state.currentPost?.id === action.payload.id 
          ? action.payload 
          : state.currentPost
      };
    
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
        currentPost: state.currentPost?.id === action.payload 
          ? null 
          : state.currentPost,
        totalPosts: state.totalPosts - 1
      };
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    
    case 'SET_FILTER':
      return {
        ...state,
        filter: { ...state.filter, ...action.payload }
      };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    
    case 'CLEAR_SEARCH_RESULTS':
      return { ...state, searchResults: [] };
    
    default:
      return state;
  }
}

// Context interface
interface BlogContextType extends BlogState {
  // Post management
  fetchPosts: (filter?: Partial<BlogPostFilter>) => Promise<void>;
  fetchPost: (slugOrId: string) => Promise<BlogPost | null>;
  createPost: (data: CreateBlogPostData) => Promise<BlogPost>;
  updatePost: (data: UpdateBlogPostData) => Promise<BlogPost>;
  deletePost: (id: string) => Promise<void>;
  publishPost: (id: string, scheduledAt?: Date) => Promise<BlogPost>;
  
  // Featured content
  fetchFeaturedPosts: () => Promise<void>;
  
  // Categories and tags
  fetchCategories: () => Promise<void>;
  fetchTags: () => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<Category>;
  createTag: (data: Partial<Tag>) => Promise<Tag>;
  
  // Search and filtering
  searchPosts: (query: string, filters?: Partial<BlogPostFilter>) => Promise<void>;
  setFilter: (filter: Partial<BlogPostFilter>) => void;
  clearSearch: () => void;
  
  // Pagination
  loadMore: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  
  // Utility methods
  clearError: () => void;
  refetch: () => Promise<void>;
}

// Create context
const BlogContext = createContext<BlogContextType | null>(null);

// Provider props
interface BlogProviderProps {
  children: ReactNode;
}

// Blog provider component
export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(blogReducer, initialState);
  const { user } = useBlogAuth();

  // Mock API calls - replace with actual API service calls
  const mockApiCall = <T,>(data: T): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 100);
    });
  };

  // Fetch posts
  const fetchPosts = async (filter?: Partial<BlogPostFilter>): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const currentFilter = { ...state.filter, ...filter };
      dispatch({ type: 'SET_FILTER', payload: currentFilter });
      
      // Mock API call - replace with actual API service
      const mockResponse: BlogPostListResponse = {
        posts: [
          {
            id: '1',
            title: 'Getting Started with React 19',
            slug: 'getting-started-with-react-19',
            content: '# Getting Started with React 19\n\nReact 19 introduces many exciting new features...',
            excerpt: 'Learn about the latest features in React 19 and how to get started.',
            status: PostStatus.PUBLISHED,
            type: PostType.TUTORIAL,
            publishedAt: new Date('2024-01-15'),
            scheduledAt: null,
            authorId: '1',
            categoryId: '1',
            tags: ['react', 'javascript', 'frontend'],
            featuredImage: null,
            seoMetadata: {
              title: 'Getting Started with React 19',
              description: 'Learn about the latest features in React 19 and how to get started.'
            },
            readingTime: {
              text: '5 min read',
              minutes: 5,
              time: 300000,
              words: 1000
            },
            viewCount: 1250,
            likeCount: 45,
            commentCount: 12,
            shareCount: 8,
            bookmarkCount: 23,
            version: 1,
            isDeleted: false,
            isPinned: false,
            isFeatured: true,
            allowComments: true,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };
      
      await mockApiCall(mockResponse);
      dispatch({ type: 'SET_POSTS', payload: mockResponse });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch posts' });
    }
  };

  // Fetch single post
  const fetchPost = async (slugOrId: string): Promise<BlogPost | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Mock API call
      const mockPost: BlogPost = {
        id: slugOrId,
        title: 'Sample Blog Post',
        slug: 'sample-blog-post',
        content: '# Sample Content\n\nThis is a sample blog post content.',
        excerpt: 'This is a sample blog post.',
        status: PostStatus.PUBLISHED,
        type: PostType.ARTICLE,
        publishedAt: new Date(),
        scheduledAt: null,
        authorId: '1',
        categoryId: '1',
        tags: ['sample'],
        featuredImage: null,
        seoMetadata: {},
        readingTime: {
          text: '2 min read',
          minutes: 2,
          time: 120000,
          words: 400
        },
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        bookmarkCount: 0,
        version: 1,
        isDeleted: false,
        isPinned: false,
        isFeatured: false,
        allowComments: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mockApiCall(mockPost);
      dispatch({ type: 'SET_CURRENT_POST', payload: mockPost });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return mockPost;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch post' });
      return null;
    }
  };

  // Create post
  const createPost = async (data: CreateBlogPostData): Promise<BlogPost> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const newPost: BlogPost = {
        id: Date.now().toString(),
        ...data,
        slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        publishedAt: data.status === PostStatus.PUBLISHED ? new Date() : null,
        authorId: user?.id || '',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        bookmarkCount: 0,
        version: 1,
        isDeleted: false,
        isPinned: data.isPinned || false,
        isFeatured: data.isFeatured || false,
        allowComments: data.allowComments !== false,
        readingTime: {
          text: '5 min read',
          minutes: 5,
          time: 300000,
          words: data.content.split(' ').length
        },
        seoMetadata: data.seoMetadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mockApiCall(newPost);
      dispatch({ type: 'ADD_POST', payload: newPost });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return newPost;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create post' });
      throw error;
    }
  };

  // Update post
  const updatePost = async (data: UpdateBlogPostData): Promise<BlogPost> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const existingPost = state.posts.find(p => p.id === data.id) || state.currentPost;
      if (!existingPost) {
        throw new Error('Post not found');
      }
      
      const updatedPost: BlogPost = {
        ...existingPost,
        ...data,
        updatedAt: new Date(),
        version: existingPost.version + 1
      };
      
      await mockApiCall(updatedPost);
      dispatch({ type: 'UPDATE_POST', payload: updatedPost });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return updatedPost;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update post' });
      throw error;
    }
  };

  // Delete post
  const deletePost = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await mockApiCall(null);
      dispatch({ type: 'DELETE_POST', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete post' });
      throw error;
    }
  };

  // Publish post
  const publishPost = async (id: string, scheduledAt?: Date): Promise<BlogPost> => {
    const post = state.posts.find(p => p.id === id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    return updatePost({
      id,
      status: scheduledAt ? PostStatus.SCHEDULED : PostStatus.PUBLISHED,
      publishedAt: scheduledAt || new Date(),
      scheduledAt
    });
  };

  // Fetch featured posts
  const fetchFeaturedPosts = async (): Promise<void> => {
    try {
      const mockFeatured: BlogPost[] = [];
      await mockApiCall(mockFeatured);
      dispatch({ type: 'SET_FEATURED_POSTS', payload: mockFeatured });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch featured posts' });
    }
  };

  // Fetch categories
  const fetchCategories = async (): Promise<void> => {
    try {
      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Technology',
          slug: 'technology',
          description: 'Posts about technology and programming',
          postCount: 25,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await mockApiCall(mockCategories);
      dispatch({ type: 'SET_CATEGORIES', payload: mockCategories });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch categories' });
    }
  };

  // Fetch tags
  const fetchTags = async (): Promise<void> => {
    try {
      const mockTags: Tag[] = [
        {
          id: '1',
          name: 'React',
          slug: 'react',
          postCount: 15,
          trending: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await mockApiCall(mockTags);
      dispatch({ type: 'SET_TAGS', payload: mockTags });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch tags' });
    }
  };

  // Create category
  const createCategory = async (data: Partial<Category>): Promise<Category> => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: data.name || '',
      slug: data.name?.toLowerCase().replace(/\s+/g, '-') || '',
      description: data.description,
      postCount: 0,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    
    await mockApiCall(newCategory);
    dispatch({ type: 'SET_CATEGORIES', payload: [...state.categories, newCategory] });
    
    return newCategory;
  };

  // Create tag
  const createTag = async (data: Partial<Tag>): Promise<Tag> => {
    const newTag: Tag = {
      id: Date.now().toString(),
      name: data.name || '',
      slug: data.name?.toLowerCase().replace(/\s+/g, '-') || '',
      postCount: 0,
      trending: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    
    await mockApiCall(newTag);
    dispatch({ type: 'SET_TAGS', payload: [...state.tags, newTag] });
    
    return newTag;
  };

  // Search posts
  const searchPosts = async (query: string, filters?: Partial<BlogPostFilter>): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Mock search results
      const mockResults: BlogPost[] = [];
      await mockApiCall(mockResults);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: mockResults });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Search failed' });
    }
  };

  // Set filter
  const setFilter = (filter: Partial<BlogPostFilter>): void => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  // Clear search
  const clearSearch = (): void => {
    dispatch({ type: 'CLEAR_SEARCH_RESULTS' });
  };

  // Load more posts
  const loadMore = async (): Promise<void> => {
    if (!state.hasNextPage) return;
    
    const nextPage = state.currentPage + 1;
    await fetchPosts({ ...state.filter, page: nextPage });
  };

  // Go to specific page
  const goToPage = async (page: number): Promise<void> => {
    await fetchPosts({ ...state.filter, page });
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Refetch current data
  const refetch = async (): Promise<void> => {
    await fetchPosts(state.filter);
  };

  // Initialize data on mount
  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
    fetchFeaturedPosts();
  }, []);

  // Context value
  const contextValue: BlogContextType = {
    ...state,
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    fetchFeaturedPosts,
    fetchCategories,
    fetchTags,
    createCategory,
    createTag,
    searchPosts,
    setFilter,
    clearSearch,
    loadMore,
    goToPage,
    clearError,
    refetch
  };

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};

// Hook to use blog context
export const useBlog = (): BlogContextType => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};

export default BlogContext;
