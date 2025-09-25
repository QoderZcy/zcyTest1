// Blog Post related TypeScript type definitions

// Publication status for blog posts
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
  UNDER_REVIEW = 'under_review'
}

// Post type categories
export enum PostType {
  ARTICLE = 'article',
  TUTORIAL = 'tutorial',
  NEWS = 'news',
  OPINION = 'opinion',
  REVIEW = 'review'
}

// SEO metadata interface
export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
}

// Reading time calculation
export interface ReadingTime {
  text: string;
  minutes: number;
  time: number;
  words: number;
}

// Blog post interface
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: PostStatus;
  type: PostType;
  
  // Publication details
  publishedAt: Date | null;
  scheduledAt: Date | null;
  
  // Author and ownership
  authorId: string;
  author?: User; // Populated when needed
  
  // Content organization
  categoryId: string | null;
  category?: Category; // Populated when needed
  tags: string[];
  
  // Media and visuals
  featuredImage: string | null;
  featuredImageAlt?: string;
  images: string[];
  
  // SEO and metadata
  seoMetadata: SEOMetadata;
  readingTime: ReadingTime;
  
  // Engagement metrics
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  
  // Technical metadata
  version: number;
  lastEditedBy?: string;
  isDeleted: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  allowComments: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy compatibility (for migration from notes)
  noteId?: string; // Reference to original note if migrated
}

// Interface for creating new blog posts
export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt?: string;
  status?: PostStatus;
  type?: PostType;
  categoryId?: string | null;
  tags?: string[];
  featuredImage?: string | null;
  featuredImageAlt?: string;
  seoMetadata?: Partial<SEOMetadata>;
  scheduledAt?: Date | null;
  allowComments?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
}

// Interface for updating blog posts
export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
  lastEditedBy?: string;
}

// Blog post filter and search interface
export interface BlogPostFilter {
  searchTerm?: string;
  status?: PostStatus[];
  type?: PostType[];
  categoryId?: string;
  tags?: string[];
  authorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isFeatured?: boolean;
  isPinned?: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'viewCount' | 'likeCount';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

// Blog post list response
export interface BlogPostListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Blog post statistics
export interface BlogPostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  archivedPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageReadingTime: number;
  postsThisMonth: number;
  postsLastMonth: number;
  topTags: { tag: string; count: number }[];
  popularPosts: BlogPost[];
}

// Post interaction data
export interface PostInteraction {
  postId: string;
  userId: string;
  type: 'like' | 'bookmark' | 'share' | 'view';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Post revision for version control
export interface PostRevision {
  id: string;
  postId: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  version: number;
  changeDescription?: string;
  createdAt: Date;
}

// Related posts interface
export interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  publishedAt: Date;
  readingTime: ReadingTime;
  similarity: number; // 0-1 score for how related this post is
}

// User interface (extended from auth types)
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

// Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  postCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
