// 图书管理系统相关的 TypeScript 类型定义

// 图书状态枚举
export enum BookStatus {
  AVAILABLE = 'AVAILABLE',     // 可借阅
  BORROWED = 'BORROWED',       // 已借出
  RESERVED = 'RESERVED',       // 已预约
  MAINTENANCE = 'MAINTENANCE', // 维护中
  LOST = 'LOST',              // 遗失
  DAMAGED = 'DAMAGED',        // 损坏
}

// 图书分类枚举
export enum BookCategory {
  FICTION = 'FICTION',                    // 小说
  NON_FICTION = 'NON_FICTION',          // 非小说
  SCIENCE = 'SCIENCE',                   // 科学
  TECHNOLOGY = 'TECHNOLOGY',             // 技术
  HISTORY = 'HISTORY',                   // 历史
  PHILOSOPHY = 'PHILOSOPHY',             // 哲学
  ART = 'ART',                          // 艺术
  EDUCATION = 'EDUCATION',               // 教育
  CHILDREN = 'CHILDREN',                 // 儿童读物
  REFERENCE = 'REFERENCE',               // 参考书
}

// 图书信息接口
export interface Book {
  id: string;                    // 图书唯一标识
  isbn?: string;                 // 国际标准书号
  title: string;                 // 图书标题
  author: string;                // 作者
  publisher?: string;            // 出版社
  publishDate?: Date;            // 出版日期
  category: BookCategory;        // 图书分类
  description?: string;          // 图书描述
  coverImage?: string;           // 封面图片URL
  totalCopies: number;           // 总册数
  availableCopies: number;       // 可借册数
  location?: string;             // 存放位置
  tags: string[];                // 标签列表
  status: BookStatus;            // 图书状态
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  createdBy: string;             // 创建用户ID
}

// 新建图书数据
export interface NewBook {
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishDate?: Date;
  category: BookCategory;
  description?: string;
  coverImage?: string;
  totalCopies: number;
  location?: string;
  tags: string[];
}

// 图书搜索过滤器
export interface BookFilter {
  searchTerm: string;            // 搜索关键词
  selectedCategories: BookCategory[]; // 选中的分类
  selectedTags: string[];        // 选中的标签
  availableOnly: boolean;        // 仅显示可借阅的图书
  status?: BookStatus[];         // 图书状态过滤
  sortBy: 'title' | 'author' | 'publishDate' | 'createdAt' | 'updatedAt' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

// 图书统计信息
export interface BookStats {
  totalBooks: number;            // 总图书数
  availableBooks: number;        // 可借阅图书数
  borrowedBooks: number;         // 已借出图书数
  reservedBooks: number;         // 已预约图书数
  totalCategories: number;       // 总分类数
  totalTags: number;             // 总标签数
  popularBooks: Book[];          // 热门图书
  recentlyAdded: Book[];         // 最近添加的图书
}

// 图书详情视图数据
export interface BookDetail extends Book {
  borrowHistory: BorrowRecord[]; // 借阅历史
  currentBorrower?: {
    userId: string;
    username: string;
    borrowDate: Date;
    dueDate: Date;
  };
  reservationQueue: {
    userId: string;
    username: string;
    reservedAt: Date;
  }[];
}

// 图书批量操作
export interface BookBatchOperation {
  operation: 'update_status' | 'add_tags' | 'remove_tags' | 'delete' | 'move_location';
  bookIds: string[];
  payload: any;
}

// 图书导入数据
export interface BookImportData {
  books: NewBook[];
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
    defaultStatus: BookStatus;
  };
}

// 图书搜索建议
export interface BookSearchSuggestion {
  type: 'title' | 'author' | 'category' | 'tag';
  value: string;
  count: number;
}

// 从借阅相关类型文件中前置声明
interface BorrowRecord {
  id: string;
  bookId: string;
  userId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: string;
}

// 图书分类映射（用于显示）
export const BOOK_CATEGORY_LABELS: Record<BookCategory, string> = {
  [BookCategory.FICTION]: '小说',
  [BookCategory.NON_FICTION]: '非小说',
  [BookCategory.SCIENCE]: '科学',
  [BookCategory.TECHNOLOGY]: '技术',
  [BookCategory.HISTORY]: '历史',
  [BookCategory.PHILOSOPHY]: '哲学',
  [BookCategory.ART]: '艺术',
  [BookCategory.EDUCATION]: '教育',
  [BookCategory.CHILDREN]: '儿童读物',
  [BookCategory.REFERENCE]: '参考书',
};

// 图书状态映射（用于显示）
export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  [BookStatus.AVAILABLE]: '可借阅',
  [BookStatus.BORROWED]: '已借出',
  [BookStatus.RESERVED]: '已预约',
  [BookStatus.MAINTENANCE]: '维护中',
  [BookStatus.LOST]: '遗失',
  [BookStatus.DAMAGED]: '损坏',
};

// 图书状态颜色映射
export const BOOK_STATUS_COLORS: Record<BookStatus, string> = {
  [BookStatus.AVAILABLE]: '#22C55E',    // 绿色
  [BookStatus.BORROWED]: '#EF4444',     // 红色
  [BookStatus.RESERVED]: '#F59E0B',     // 橙色
  [BookStatus.MAINTENANCE]: '#6B7280',  // 灰色
  [BookStatus.LOST]: '#7C3AED',         // 紫色
  [BookStatus.DAMAGED]: '#DC2626',      // 深红色
};

// 默认图书过滤器
export const DEFAULT_BOOK_FILTER: BookFilter = {
  searchTerm: '',
  selectedCategories: [],
  selectedTags: [],
  availableOnly: false,
  status: undefined,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};