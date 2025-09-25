// Comment system and social interaction TypeScript definitions

// Comment status for moderation
export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SPAM = 'spam',
  HIDDEN = 'hidden'
}

// Comment interface
export interface Comment {
  id: string;
  content: string;
  
  // Relations
  postId: string;
  authorId: string;
  parentId: string | null; // For nested replies
  
  // Author information (populated when needed)
  author?: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    role: string;
  };
  
  // Moderation and status
  status: CommentStatus;
  moderatedBy?: string;
  moderatedAt?: Date | null;
  moderationReason?: string;
  
  // Engagement
  likeCount: number;
  replyCount: number;
  
  // Content management
  isEdited: boolean;
  editedAt: Date | null;
  originalContent?: string; // Store original if edited
  
  // Technical metadata
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Nested replies (populated when fetching with replies)
  replies?: Comment[];
}

// Interface for creating new comments
export interface CreateCommentData {
  content: string;
  postId: string;
  parentId?: string | null;
  authorId: string;
}

// Interface for updating comments
export interface UpdateCommentData {
  id: string;
  content: string;
  editedBy: string;
}

// Comment filter and pagination
export interface CommentFilter {
  postId?: string;
  authorId?: string;
  status?: CommentStatus[];
  parentId?: string | null; // null for top-level comments
  sortBy: 'createdAt' | 'likeCount' | 'replyCount';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
  includeReplies?: boolean;
  maxDepth?: number; // Maximum nesting depth
}

// Comment list response
export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Comment moderation action
export interface CommentModerationAction {
  commentId: string;
  action: 'approve' | 'reject' | 'mark_spam' | 'hide';
  reason?: string;
  moderatorId: string;
  timestamp: Date;
}

// Comment statistics
export interface CommentStats {
  totalComments: number;
  approvedComments: number;
  pendingComments: number;
  rejectedComments: number;
  spamComments: number;
  commentsToday: number;
  commentsThisWeek: number;
  commentsThisMonth: number;
  averageCommentsPerPost: number;
  topCommenters: {
    userId: string;
    username: string;
    commentCount: number;
  }[];
}

// Social interaction types
export enum InteractionType {
  LIKE = 'like',
  BOOKMARK = 'bookmark',
  SHARE = 'share',
  FOLLOW = 'follow',
  VIEW = 'view'
}

// Social interaction interface
export interface SocialInteraction {
  id: string;
  userId: string;
  targetId: string; // Post ID, Comment ID, or User ID
  targetType: 'post' | 'comment' | 'user';
  type: InteractionType;
  
  // Additional metadata
  metadata?: {
    platform?: string; // For shares (twitter, facebook, etc.)
    referrer?: string; // For views
    duration?: number; // For views (time spent)
    note?: string; // For bookmarks
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Like interface (specific type of interaction)
export interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  createdAt: Date;
}

// Bookmark interface
export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  note?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Share interface
export interface Share {
  id: string;
  userId: string;
  postId: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'email' | 'copy_link' | 'other';
  metadata?: {
    url?: string;
    customMessage?: string;
  };
  createdAt: Date;
}

// Follow relationship interface
export interface FollowRelationship {
  id: string;
  followerId: string; // User who is following
  followingId: string; // User being followed
  createdAt: Date;
  
  // Optional relationship metadata
  metadata?: {
    source?: string; // How they discovered this user
    notes?: string;
  };
}

// User social stats
export interface UserSocialStats {
  followerCount: number;
  followingCount: number;
  totalLikes: number;
  totalBookmarks: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number;
  averageLikesPerPost: number;
  recentFollowers: {
    userId: string;
    username: string;
    avatar?: string;
    followedAt: Date;
  }[];
}

// Post engagement stats
export interface PostEngagementStats {
  viewCount: number;
  uniqueViewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  engagementRate: number;
  averageReadTime: number;
  
  // Detailed breakdowns
  sharesByPlatform: {
    platform: string;
    count: number;
  }[];
  
  viewsByDate: {
    date: string;
    views: number;
    uniqueViews: number;
  }[];
  
  engagementByHour: {
    hour: number;
    interactions: number;
  }[];
}

// Notification interface for social interactions
export interface SocialNotification {
  id: string;
  recipientId: string;
  actorId: string; // User who performed the action
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention';
  targetId: string; // Post, Comment, or User ID
  targetType: 'post' | 'comment' | 'user';
  
  // Notification content
  title: string;
  message: string;
  actionUrl?: string;
  
  // Actor information (populated when needed)
  actor?: {
    username: string;
    displayName?: string;
    avatar?: string;
  };
  
  // Target information (populated when needed)
  target?: {
    title?: string; // For posts
    content?: string; // For comments
    username?: string; // For users
  };
  
  // Status
  isRead: boolean;
  readAt: Date | null;
  
  // Timestamps
  createdAt: Date;
}

// Trending content interface
export interface TrendingContent {
  type: 'post' | 'tag' | 'author';
  id: string;
  score: number; // Trending score based on engagement
  timeframe: '1h' | '24h' | '7d' | '30d';
  
  // Content details (populated based on type)
  post?: {
    title: string;
    slug: string;
    author: string;
    publishedAt: Date;
  };
  
  tag?: {
    name: string;
    postCount: number;
    recentGrowth: number;
  };
  
  author?: {
    username: string;
    displayName?: string;
    followerGrowth: number;
    recentPostCount: number;
  };
}

// Content recommendation interface
export interface ContentRecommendation {
  postId: string;
  userId: string;
  score: number;
  reason: 'similar_content' | 'author_follow' | 'popular_in_category' | 'trending' | 'personalized';
  metadata?: {
    similarPostIds?: string[];
    categories?: string[];
    tags?: string[];
  };
  createdAt: Date;
}