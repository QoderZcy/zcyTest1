// Blog types index - Re-export all blog-related types

// Post-related types
export * from './post';

// User and permission types
export * from './user';

// Comment and social interaction types
export * from './comment';

// Analytics and performance types
export * from './analytics';

// Category and content organization types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  children?: Category[];
  postCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
  trending: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Search and discovery types
export interface SearchResult {
  type: 'post' | 'user' | 'category' | 'tag';
  id: string;
  title: string;
  description: string;
  url: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  filters?: {
    type?: ('post' | 'user' | 'category' | 'tag')[];
    category?: string;
    tags?: string[];
    author?: string;
    dateRange?: {
      from: Date;
      to: Date;
    };
  };
  sortBy?: 'relevance' | 'date' | 'popularity';
  page: number;
  limit: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  suggestions?: string[];
  facets?: {
    categories: { name: string; count: number }[];
    tags: { name: string; count: number }[];
    authors: { name: string; count: number }[];
  };
}

// Media and file management types
export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  uploadedBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaUploadResponse {
  file: MediaFile;
  message: string;
}

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// Configuration types
export interface BlogConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logoUrl?: string;
  faviconUrl?: string;
  
  // Content settings
  postsPerPage: number;
  excerptLength: number;
  allowComments: boolean;
  moderateComments: boolean;
  
  // SEO settings
  defaultSEOTitle: string;
  defaultSEODescription: string;
  defaultSEOImage: string;
  
  // Social media
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  
  // Analytics
  googleAnalyticsId?: string;
  enableAnalytics: boolean;
  
  // Features
  features: {
    userRegistration: boolean;
    userProfiles: boolean;
    socialSharing: boolean;
    newsletter: boolean;
    rss: boolean;
  };
}