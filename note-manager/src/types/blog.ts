// 博客功能相关的 TypeScript 类型定义

// 文章状态枚举
export enum ArticleStatus {
  DRAFT = 'DRAFT',           // 草稿
  PUBLISHED = 'PUBLISHED',   // 已发布
  ARCHIVED = 'ARCHIVED',     // 已归档
  DELETED = 'DELETED',       // 已删除
}

// 可见性枚举
export enum Visibility {
  PUBLIC = 'PUBLIC',         // 公开
  PRIVATE = 'PRIVATE',       // 私有
  UNLISTED = 'UNLISTED',     // 不公开列出
  PASSWORD = 'PASSWORD',     // 密码保护
}

// 博客文章接口
export interface BlogArticle {
  id: string;
  title: string;
  content: string;              // Markdown 格式内容
  excerpt?: string;             // 文章摘要
  coverImage?: string;          // 封面图片 URL
  status: ArticleStatus;        // 文章状态
  visibility: Visibility;      // 可见性设置
  publishedAt?: Date;           // 发布时间
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
  authorId: string;             // 作者 ID
  tags: string[];               // 文章标签
  categories: string[];         // 文章分类
  readTime?: number;            // 预估阅读时间（分钟）
  viewCount?: number;           // 浏览次数
  likeCount?: number;           // 点赞次数
  password?: string;            // 密码保护时的密码
  slug?: string;                // URL 友好的文章标识
}

// 创建文章数据接口
export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  categories: string[];
  visibility: Visibility;
  password?: string;
  publishImmediately?: boolean; // 是否立即发布
}

// 更新文章数据接口
export interface UpdateArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  categories?: string[];
  visibility?: Visibility;
  password?: string;
}

// 博客草稿接口
export interface BlogDraft {
  id: string;
  title: string;
  content: string;
  tags: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  autoSavedAt?: Date;          // 自动保存时间
}

// 用户博客设置接口
export interface UserBlogSettings {
  userId: string;
  blogTitle: string;           // 博客标题
  blogDescription: string;     // 博客描述
  blogAvatar?: string;         // 博客头像 URL
  blogTheme: string;           // 博客主题
  allowComments: boolean;      // 是否允许评论
  moderateComments: boolean;   // 是否需要审核评论
  seoEnabled: boolean;         // 是否启用 SEO 优化
  customDomain?: string;       // 自定义域名
  socialLinks: {               // 社交媒体链接
    twitter?: string;
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

// 博客筛选接口
export interface BlogFilter {
  searchTerm: string;          // 搜索关键词
  selectedTags: string[];     // 选中的标签
  selectedCategories: string[]; // 选中的分类
  status?: ArticleStatus;      // 文章状态筛选
  visibility?: Visibility;    // 可见性筛选
  authorId?: string;           // 作者筛选
  sortBy: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'viewCount'; // 排序字段
  sortOrder: 'asc' | 'desc';   // 排序方向
  dateRange?: {                // 日期范围筛选
    startDate: Date;
    endDate: Date;
  };
}

// 分页状态接口
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// 编辑器状态接口
export interface EditorState {
  isEditing: boolean;
  isDirty: boolean;            // 是否有未保存的更改
  autoSaveEnabled: boolean;
  lastSavedAt?: Date;
  currentDraft?: BlogDraft;
  previewMode: 'split' | 'preview' | 'editor'; // 预览模式
}

// 博客状态接口
export interface BlogState {
  // 文章相关
  articles: BlogArticle[];
  currentArticle: BlogArticle | null;
  drafts: BlogDraft[];
  
  // 用户博客设置
  userBlogSettings: UserBlogSettings | null;
  
  // UI 状态
  isLoading: boolean;
  error: string | null;
  
  // 筛选和分页
  filter: BlogFilter;
  pagination: PaginationState;
  
  // 编辑器状态
  editorState: EditorState;
  
  // 缓存状态
  allTags: string[];           // 所有标签
  allCategories: string[];     // 所有分类
  recentArticles: BlogArticle[]; // 最近文章
}

// 便签转博客设置接口
export interface ConvertSettings {
  visibility: Visibility;
  publishImmediately: boolean;
  addCategories: string[];     // 额外添加的分类
  addTags: string[];          // 额外添加的标签
  generateExcerpt: boolean;   // 是否自动生成摘要
  preserveFormatting: boolean; // 是否保持原有格式
}

// 博客统计接口
export interface BlogStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalLikes: number;
  totalTags: number;
  totalCategories: number;
  recentActivity: {
    articlesThisWeek: number;
    viewsThisWeek: number;
    likesThisWeek: number;
  };
}

// 博客评论接口（为未来扩展预留）
export interface BlogComment {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Date;
  isApproved: boolean;
  parentId?: string;           // 回复评论的 ID
}

// 文章分享配置接口
export interface ShareConfig {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'email' | 'copy';
  title: string;
  url: string;
  description?: string;
}

// 博客 SEO 元数据接口
export interface BlogSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

// 预定义的博客分类
export const BLOG_CATEGORIES = [
  '技术', '生活', '工作', '学习', '思考', '随笔',
  '前端', '后端', '设计', '产品', '创业', '投资'
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];

// 预定义的博客主题
export const BLOG_THEMES = [
  'default', 'minimal', 'dark', 'colorful', 'professional'
] as const;

export type BlogTheme = typeof BLOG_THEMES[number];

// 文章阅读时间计算配置
export interface ReadTimeConfig {
  wordsPerMinute: number;      // 每分钟阅读词数
  includeImages: boolean;      // 是否计算图片阅读时间
  imageReadTime: number;       // 每张图片的阅读时间（秒）
}

// 默认的博客筛选配置
export const DEFAULT_BLOG_FILTER: BlogFilter = {
  searchTerm: '',
  selectedTags: [],
  selectedCategories: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// 默认的分页配置
export const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

// 默认的编辑器状态
export const DEFAULT_EDITOR_STATE: EditorState = {
  isEditing: false,
  isDirty: false,
  autoSaveEnabled: true,
  previewMode: 'split',
};