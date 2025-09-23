// 借阅管理相关的 TypeScript 类型定义

// 借阅状态枚举
export enum BorrowStatus {
  ACTIVE = 'ACTIVE',           // 借阅中
  RETURNED = 'RETURNED',       // 已归还
  OVERDUE = 'OVERDUE',        // 逾期
  RENEWED = 'RENEWED',        // 已续借
  LOST = 'LOST',              // 遗失
}

// 借阅记录接口
export interface BorrowRecord {
  id: string;                  // 借阅记录唯一标识
  bookId: string;             // 图书ID
  userId: string;             // 借阅用户ID
  borrowDate: Date;           // 借阅日期
  dueDate: Date;              // 应还日期
  returnDate?: Date;          // 实际归还日期
  status: BorrowStatus;       // 借阅状态
  renewCount: number;         // 续借次数
  maxRenewals: number;        // 最大续借次数
  fine: number;               // 罚金金额
  notes?: string;             // 备注信息
  librarian: string;          // 管理员ID
  createdAt: Date;            // 创建时间
  updatedAt: Date;            // 更新时间
  
  // 关联数据（用于显示）
  book?: {
    title: string;
    author: string;
    isbn?: string;
    coverImage?: string;
  };
  user?: {
    username: string;
    email: string;
  };
}

// 新建借阅记录
export interface NewBorrowRecord {
  bookId: string;
  userId: string;
  borrowPeriodDays?: number;   // 借阅期限（天），默认为系统设置
  notes?: string;
}

// 图书预约记录
export interface BookReservation {
  id: string;
  bookId: string;
  userId: string;
  reservedAt: Date;
  expiresAt: Date;            // 预约过期时间
  status: 'WAITING' | 'READY' | 'EXPIRED' | 'CANCELLED';
  notified: boolean;          // 是否已通知用户
  position: number;           // 在预约队列中的位置
  
  // 关联数据
  book?: {
    title: string;
    author: string;
    coverImage?: string;
  };
  user?: {
    username: string;
    email: string;
  };
}

// 借阅统计信息
export interface BorrowStats {
  totalBorrows: number;        // 总借阅次数
  activeBorrows: number;       // 当前借阅中的数量
  overdueBorrows: number;      // 逾期借阅数量
  returnedToday: number;       // 今日归还数量
  borrowedToday: number;       // 今日借阅数量
  totalFines: number;          // 总罚金金额
  paidFines: number;           // 已支付罚金
  unpaidFines: number;         // 未支付罚金
  averageBorrowDays: number;   // 平均借阅天数
  topBorrowers: Array<{
    userId: string;
    username: string;
    borrowCount: number;
  }>;
  popularBooks: Array<{
    bookId: string;
    title: string;
    borrowCount: number;
  }>;
}

// 借阅过滤器
export interface BorrowFilter {
  searchTerm: string;          // 搜索关键词（书名、用户名等）
  status: BorrowStatus[];      // 借阅状态过滤
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;             // 特定用户过滤
  bookId?: string;             // 特定图书过滤
  overdueOnly: boolean;        // 仅显示逾期记录
  hasUnpaidFines: boolean;     // 仅显示有未支付罚金的记录
  sortBy: 'borrowDate' | 'dueDate' | 'returnDate' | 'fine' | 'renewCount';
  sortOrder: 'asc' | 'desc';
}

// 续借请求
export interface RenewalRequest {
  borrowRecordId: string;
  requestedDays: number;       // 请求续借天数
  reason?: string;             // 续借原因
}

// 归还处理
export interface ReturnProcess {
  borrowRecordId: string;
  returnDate: Date;
  condition: 'GOOD' | 'DAMAGED' | 'LOST';
  damageDescription?: string;  // 损坏描述
  additionalFine?: number;     // 额外罚金（如损坏费）
  librarianId: string;         // 处理归还的管理员ID
}

// 罚金记录
export interface FineRecord {
  id: string;
  borrowRecordId: string;
  userId: string;
  amount: number;              // 罚金金额
  reason: 'OVERDUE' | 'DAMAGE' | 'LOST' | 'OTHER';
  description: string;         // 罚金描述
  isPaid: boolean;             // 是否已支付
  paidAt?: Date;              // 支付时间
  paidAmount?: number;         // 实际支付金额
  paymentMethod?: string;      // 支付方式
  createdAt: Date;
  updatedAt: Date;
}

// 借阅规则配置
export interface BorrowRules {
  maxBooksPerUser: number;     // 每用户最大借阅数量
  defaultBorrowDays: number;   // 默认借阅天数
  maxRenewalTimes: number;     // 最大续借次数
  renewalDays: number;         // 每次续借天数
  overdueFineDailyRate: number; // 逾期罚金日利率
  maxFineAmount: number;       // 最大罚金金额
  reservationExpiryDays: number; // 预约过期天数
  blacklistThreshold: number;  // 黑名单阈值（逾期次数）
}

// 用户借阅摘要
export interface UserBorrowSummary {
  userId: string;
  username: string;
  email: string;
  activeBorrows: BorrowRecord[];
  overdueCount: number;
  totalBorrows: number;
  unpaidFines: number;
  reservations: BookReservation[];
  borrowHistory: BorrowRecord[];
  isBlacklisted: boolean;
  blacklistReason?: string;
}

// 借阅状态标签映射
export const BORROW_STATUS_LABELS: Record<BorrowStatus, string> = {
  [BorrowStatus.ACTIVE]: '借阅中',
  [BorrowStatus.RETURNED]: '已归还',
  [BorrowStatus.OVERDUE]: '逾期',
  [BorrowStatus.RENEWED]: '已续借',
  [BorrowStatus.LOST]: '遗失',
};

// 借阅状态颜色映射
export const BORROW_STATUS_COLORS: Record<BorrowStatus, string> = {
  [BorrowStatus.ACTIVE]: '#22C55E',     // 绿色
  [BorrowStatus.RETURNED]: '#6B7280',   // 灰色
  [BorrowStatus.OVERDUE]: '#EF4444',    // 红色
  [BorrowStatus.RENEWED]: '#F59E0B',    // 橙色
  [BorrowStatus.LOST]: '#7C3AED',       // 紫色
};

// 默认借阅过滤器
export const DEFAULT_BORROW_FILTER: BorrowFilter = {
  searchTerm: '',
  status: [],
  dateRange: undefined,
  userId: undefined,
  bookId: undefined,
  overdueOnly: false,
  hasUnpaidFines: false,
  sortBy: 'borrowDate',
  sortOrder: 'desc',
};

// 默认借阅规则
export const DEFAULT_BORROW_RULES: BorrowRules = {
  maxBooksPerUser: 5,
  defaultBorrowDays: 30,
  maxRenewalTimes: 2,
  renewalDays: 15,
  overdueFineDailyRate: 0.5,
  maxFineAmount: 50,
  reservationExpiryDays: 3,
  blacklistThreshold: 5,
};