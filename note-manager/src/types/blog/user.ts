// User roles and permissions TypeScript definitions

// User roles hierarchy
export enum UserRole {
  GUEST = 'guest',
  READER = 'reader',
  AUTHOR = 'author',
  EDITOR = 'editor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Granular permissions
export enum Permission {
  // Content Reading
  READ_PUBLIC_POSTS = 'read_public_posts',
  READ_DRAFT_POSTS = 'read_draft_posts',
  READ_ALL_POSTS = 'read_all_posts',
  
  // Content Creation
  CREATE_POSTS = 'create_posts',
  EDIT_OWN_POSTS = 'edit_own_posts',
  EDIT_ANY_POSTS = 'edit_any_posts',
  DELETE_OWN_POSTS = 'delete_own_posts',
  DELETE_ANY_POSTS = 'delete_any_posts',
  PUBLISH_POSTS = 'publish_posts',
  SCHEDULE_POSTS = 'schedule_posts',
  
  // User Interactions
  LIKE_POSTS = 'like_posts',
  BOOKMARK_POSTS = 'bookmark_posts',
  SHARE_POSTS = 'share_posts',
  COMMENT_ON_POSTS = 'comment_on_posts',
  EDIT_OWN_COMMENTS = 'edit_own_comments',
  DELETE_OWN_COMMENTS = 'delete_own_comments',
  
  // Following and Social
  FOLLOW_AUTHORS = 'follow_authors',
  FOLLOW_CATEGORIES = 'follow_categories',
  VIEW_AUTHOR_PROFILES = 'view_author_profiles',
  
  // Content Management
  MANAGE_CATEGORIES = 'manage_categories',
  MANAGE_TAGS = 'manage_tags',
  MODERATE_COMMENTS = 'moderate_comments',
  MODERATE_POSTS = 'moderate_posts',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_OWN_ANALYTICS = 'view_own_analytics',
  
  // User Management
  MANAGE_USERS = 'manage_users',
  CHANGE_USER_ROLES = 'change_user_roles',
  VIEW_USER_DETAILS = 'view_user_details',
  SUSPEND_USERS = 'suspend_users',
  
  // System Administration
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_BACKUPS = 'manage_backups',
  MANAGE_PLUGINS = 'manage_plugins'
}

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.READ_PUBLIC_POSTS,
    Permission.VIEW_AUTHOR_PROFILES
  ],
  
  [UserRole.READER]: [
    Permission.READ_PUBLIC_POSTS,
    Permission.LIKE_POSTS,
    Permission.BOOKMARK_POSTS,
    Permission.SHARE_POSTS,
    Permission.COMMENT_ON_POSTS,
    Permission.EDIT_OWN_COMMENTS,
    Permission.DELETE_OWN_COMMENTS,
    Permission.FOLLOW_AUTHORS,
    Permission.FOLLOW_CATEGORIES,
    Permission.VIEW_AUTHOR_PROFILES
  ],
  
  [UserRole.AUTHOR]: [
    ...ROLE_PERMISSIONS[UserRole.READER],
    Permission.CREATE_POSTS,
    Permission.EDIT_OWN_POSTS,
    Permission.DELETE_OWN_POSTS,
    Permission.PUBLISH_POSTS,
    Permission.SCHEDULE_POSTS,
    Permission.VIEW_OWN_ANALYTICS,
    Permission.READ_DRAFT_POSTS // Only own drafts
  ],
  
  [UserRole.EDITOR]: [
    ...ROLE_PERMISSIONS[UserRole.AUTHOR],
    Permission.EDIT_ANY_POSTS,
    Permission.MODERATE_COMMENTS,
    Permission.MODERATE_POSTS,
    Permission.MANAGE_CATEGORIES,
    Permission.MANAGE_TAGS,
    Permission.VIEW_ANALYTICS,
    Permission.READ_ALL_POSTS
  ],
  
  [UserRole.ADMIN]: [
    ...ROLE_PERMISSIONS[UserRole.EDITOR],
    Permission.DELETE_ANY_POSTS,
    Permission.MANAGE_USERS,
    Permission.VIEW_USER_DETAILS,
    Permission.SUSPEND_USERS,
    Permission.VIEW_SYSTEM_LOGS
  ],
  
  [UserRole.SUPER_ADMIN]: [
    ...ROLE_PERMISSIONS[UserRole.ADMIN],
    Permission.CHANGE_USER_ROLES,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.MANAGE_BACKUPS,
    Permission.MANAGE_PLUGINS
  ]
};

// Extended user interface with blog-specific fields
export interface BlogUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  
  // Profile information
  displayName?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  
  // Social links
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    facebook?: string;
    instagram?: string;
  };
  
  // Blog-specific stats
  postCount: number;
  followerCount: number;
  followingCount: number;
  totalViews: number;
  totalLikes: number;
  
  // Account status
  isActive: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  suspendedUntil?: Date | null;
  
  // Preferences
  preferences: UserPreferences;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  emailVerifiedAt: Date | null;
}

// User preferences for blog functionality
export interface UserPreferences {
  // Theme and display
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'zh-CN' | 'zh-TW';
  
  // Content preferences
  defaultPostType: string;
  defaultPostStatus: string;
  autoSave: boolean;
  defaultPostVisibility: 'public' | 'private' | 'unlisted';
  
  // Notification preferences
  emailNotifications: {
    newFollower: boolean;
    newComment: boolean;
    postLiked: boolean;
    postShared: boolean;
    weeklyDigest: boolean;
    systemUpdates: boolean;
  };
  
  // Privacy settings
  showEmail: boolean;
  showRealName: boolean;
  allowFollowing: boolean;
  allowComments: boolean;
  
  // Editor preferences
  editorMode: 'visual' | 'markdown' | 'hybrid';
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'compact' | 'normal' | 'spacious';
}

// Permission checking interface
export interface PermissionContext {
  user: BlogUser | null;
  resource?: {
    type: 'post' | 'comment' | 'user' | 'category';
    id: string;
    ownerId?: string;
  };
}

// Permission result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
}

// User session information
export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    country?: string;
    city?: string;
    device: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

// User activity tracking
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resourceType: 'post' | 'comment' | 'user' | 'category' | 'system';
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// User role change log
export interface RoleChangeLog {
  id: string;
  userId: string;
  changedBy: string;
  oldRole: UserRole;
  newRole: UserRole;
  reason?: string;
  timestamp: Date;
}

// Author profile statistics
export interface AuthorStats {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  followerCount: number;
  averageReadingTime: number;
  postsThisMonth: number;
  viewsThisMonth: number;
  engagementRate: number;
  topCategories: { name: string; count: number }[];
  topTags: { name: string; count: number }[];
  monthlyStats: {
    month: string;
    posts: number;
    views: number;
    likes: number;
    comments: number;
  }[];
}

// User notification interface
export interface UserNotification {
  id: string;
  userId: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
}