// Analytics and performance tracking TypeScript definitions

// Analytics event types
export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  POST_VIEW = 'post_view',
  POST_LIKE = 'post_like',
  POST_SHARE = 'post_share',
  POST_BOOKMARK = 'post_bookmark',
  COMMENT_ADD = 'comment_add',
  USER_FOLLOW = 'user_follow',
  SEARCH_QUERY = 'search_query',
  CATEGORY_VIEW = 'category_view',
  TAG_VIEW = 'tag_view',
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  POST_READ_COMPLETE = 'post_read_complete'
}

// Analytics event interface
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  userId?: string; // null for anonymous users
  sessionId: string;
  
  // Event details
  targetId?: string; // Post ID, User ID, etc.
  targetType?: 'post' | 'user' | 'category' | 'tag' | 'page';
  
  // Context information
  page: string;
  referrer?: string;
  userAgent: string;
  ipAddress: string;
  
  // Geographic data
  country?: string;
  city?: string;
  timezone?: string;
  
  // Device information
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    screenResolution?: string;
  };
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  timestamp: Date;
  processedAt?: Date;
}

// Page view tracking
export interface PageView {
  id: string;
  sessionId: string;
  userId?: string;
  
  // Page information
  path: string;
  title: string;
  referrer?: string;
  
  // Timing metrics
  loadTime: number; // Page load time in milliseconds
  timeOnPage?: number; // Time spent on page in seconds
  scrollDepth?: number; // Percentage of page scrolled
  
  // Interaction data
  interactions: {
    clicks: number;
    scrolls: number;
    keystrokes: number;
  };
  
  // Technical metrics
  performanceMetrics?: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  };
  
  timestamp: Date;
  exitedAt?: Date;
}

// Post performance metrics
export interface PostAnalytics {
  postId: string;
  
  // View metrics
  totalViews: number;
  uniqueViews: number;
  averageViewDuration: number;
  bounceRate: number;
  
  // Engagement metrics
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  
  // Reading behavior
  averageReadingTime: number;
  readingCompletionRate: number;
  scrollDepthDistribution: {
    '25%': number;
    '50%': number;
    '75%': number;
    '100%': number;
  };
  
  // Traffic sources
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
    email: number;
  };
  
  // Geographic distribution
  topCountries: {
    country: string;
    views: number;
    percentage: number;
  }[];
  
  // Device breakdown
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  
  // Time-based analytics
  viewsByDate: {
    date: string;
    views: number;
    uniqueViews: number;
  }[];
  
  viewsByHour: {
    hour: number;
    views: number;
  }[];
  
  // SEO metrics
  searchKeywords: {
    keyword: string;
    clicks: number;
    impressions: number;
    position: number;
  }[];
  
  // Performance scores
  engagementScore: number; // 0-100
  viralityScore: number; // 0-100
  qualityScore: number; // 0-100
  
  lastUpdated: Date;
}

// User analytics
export interface UserAnalytics {
  userId: string;
  
  // Content creation
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  averagePostLength: number;
  publishingFrequency: number; // Posts per week
  
  // Engagement received
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks: number;
  
  // Social metrics
  followers: number;
  following: number;
  followerGrowthRate: number;
  
  // Performance metrics
  averageEngagementRate: number;
  topPerformingPosts: {
    postId: string;
    title: string;
    views: number;
    engagementRate: number;
  }[];
  
  // Activity patterns
  mostActiveHours: number[];
  mostActiveDays: string[];
  postingConsistency: number; // 0-1 score
  
  // Content analysis
  topCategories: {
    category: string;
    postCount: number;
    avgViews: number;
  }[];
  
  topTags: {
    tag: string;
    usage: number;
    avgEngagement: number;
  }[];
  
  // Reader insights
  audienceRetention: number;
  returnReaderRate: number;
  averageSessionDuration: number;
  
  lastUpdated: Date;
}

// Site-wide analytics dashboard
export interface SiteAnalytics {
  // Overview metrics
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalEngagements: number;
  
  // Growth metrics
  userGrowthRate: number;
  contentGrowthRate: number;
  engagementGrowthRate: number;
  
  // Content metrics
  averagePostLength: number;
  averageReadingTime: number;
  mostPopularCategories: {
    category: string;
    postCount: number;
    views: number;
  }[];
  
  trendingTags: {
    tag: string;
    mentions: number;
    growth: number;
  }[];
  
  // User behavior
  averageSessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  
  // Top content
  topPosts: {
    postId: string;
    title: string;
    author: string;
    views: number;
    engagementRate: number;
  }[];
  
  topAuthors: {
    userId: string;
    username: string;
    postCount: number;
    totalViews: number;
    followerCount: number;
  }[];
  
  // Traffic analysis
  trafficSources: {
    source: string;
    visitors: number;
    percentage: number;
  }[];
  
  searchQueries: {
    query: string;
    count: number;
    resultClicks: number;
  }[];
  
  // Time-based data
  dailyMetrics: {
    date: string;
    users: number;
    views: number;
    posts: number;
    engagements: number;
  }[];
  
  hourlyMetrics: {
    hour: number;
    activeUsers: number;
    pageViews: number;
  }[];
  
  lastUpdated: Date;
}

// Real-time analytics
export interface RealTimeAnalytics {
  // Current activity
  activeUsers: number;
  currentPageViews: number;
  
  // Recent activity (last 30 minutes)
  recentEvents: {
    type: AnalyticsEventType;
    count: number;
    timestamp: Date;
  }[];
  
  // Popular content right now
  trendingPosts: {
    postId: string;
    title: string;
    currentViews: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  
  // Geographic activity
  activeCountries: {
    country: string;
    activeUsers: number;
  }[];
  
  // Device usage
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  
  // Traffic sources
  liveTrafficSources: {
    source: string;
    activeUsers: number;
  }[];
  
  lastUpdated: Date;
}

// Analytics query interface
export interface AnalyticsQuery {
  // Time range
  startDate: Date;
  endDate: Date;
  
  // Filters
  userId?: string;
  postId?: string;
  category?: string;
  tag?: string;
  country?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  
  // Grouping
  groupBy?: 'day' | 'week' | 'month' | 'hour' | 'country' | 'device';
  
  // Metrics to include
  metrics: string[];
  
  // Sorting and pagination
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Analytics export interface
export interface AnalyticsExport {
  id: string;
  userId: string;
  query: AnalyticsQuery;
  format: 'csv' | 'json' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

// Performance monitoring
export interface PerformanceMetrics {
  // API performance
  apiResponseTimes: {
    endpoint: string;
    averageTime: number;
    p95Time: number;
    p99Time: number;
    errorRate: number;
    requestCount: number;
  }[];
  
  // Database performance
  databaseMetrics: {
    connectionPool: number;
    queryTimes: {
      average: number;
      p95: number;
      p99: number;
    };
    slowQueries: {
      query: string;
      executionTime: number;
      frequency: number;
    }[];
  };
  
  // Frontend performance
  webVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  
  // System resources
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  
  timestamp: Date;
}

// A/B testing interface
export interface ABTest {
  id: string;
  name: string;
  description: string;
  
  // Test configuration
  variants: {
    id: string;
    name: string;
    description: string;
    weight: number; // Percentage of traffic
    config: Record<string, any>;
  }[];
  
  // Targeting
  targetAudience: {
    userRoles?: string[];
    countries?: string[];
    devices?: string[];
    newUsers?: boolean;
  };
  
  // Metrics to track
  primaryMetric: string;
  secondaryMetrics: string[];
  
  // Test status
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  
  // Results
  results?: {
    variantId: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
    isWinner: boolean;
  }[];
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}