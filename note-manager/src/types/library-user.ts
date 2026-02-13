// 图书管理系统权限和角色相关的 TypeScript 类型定义

// 用户角色枚举
export enum UserRole {
  READER = 'READER',               // 普通读者
  LIBRARIAN = 'LIBRARIAN',         // 图书管理员
  ADMIN = 'ADMIN',                 // 系统管理员
}

// 权限枚举
export enum Permission {
  // 图书管理权限
  BOOK_VIEW = 'BOOK_VIEW',                    // 浏览图书
  BOOK_CREATE = 'BOOK_CREATE',                // 添加图书
  BOOK_UPDATE = 'BOOK_UPDATE',                // 编辑图书
  BOOK_DELETE = 'BOOK_DELETE',                // 删除图书
  BOOK_BATCH_IMPORT = 'BOOK_BATCH_IMPORT',    // 批量导入图书
  
  // 借阅管理权限
  BORROW_CREATE = 'BORROW_CREATE',            // 创建借阅
  BORROW_VIEW_OWN = 'BORROW_VIEW_OWN',        // 查看自己的借阅记录
  BORROW_VIEW_ALL = 'BORROW_VIEW_ALL',        // 查看所有借阅记录
  BORROW_UPDATE = 'BORROW_UPDATE',            // 更新借阅记录
  BORROW_RETURN = 'BORROW_RETURN',            // 处理归还
  BORROW_RENEW = 'BORROW_RENEW',              // 续借
  BORROW_CANCEL = 'BORROW_CANCEL',            // 取消借阅
  
  // 预约管理权限
  RESERVATION_CREATE = 'RESERVATION_CREATE',   // 创建预约
  RESERVATION_VIEW_OWN = 'RESERVATION_VIEW_OWN', // 查看自己的预约
  RESERVATION_VIEW_ALL = 'RESERVATION_VIEW_ALL', // 查看所有预约
  RESERVATION_CANCEL = 'RESERVATION_CANCEL',   // 取消预约
  
  // 用户管理权限
  USER_VIEW = 'USER_VIEW',                    // 查看用户信息
  USER_CREATE = 'USER_CREATE',                // 创建用户
  USER_UPDATE = 'USER_UPDATE',                // 更新用户信息
  USER_DELETE = 'USER_DELETE',                // 删除用户
  USER_ROLE_ASSIGN = 'USER_ROLE_ASSIGN',      // 分配用户角色
  USER_BLACKLIST = 'USER_BLACKLIST',          // 用户黑名单管理
  
  // 统计和报表权限
  STATS_VIEW_OWN = 'STATS_VIEW_OWN',          // 查看个人统计
  STATS_VIEW_ALL = 'STATS_VIEW_ALL',          // 查看全局统计
  REPORTS_GENERATE = 'REPORTS_GENERATE',       // 生成报表
  
  // 系统管理权限
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',            // 系统配置
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',            // 系统备份
  SYSTEM_RESTORE = 'SYSTEM_RESTORE',          // 系统恢复
  AUDIT_LOGS = 'AUDIT_LOGS',                  // 审计日志
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.READER]: [
    Permission.BOOK_VIEW,
    Permission.BORROW_CREATE,
    Permission.BORROW_VIEW_OWN,
    Permission.BORROW_RENEW,
    Permission.BORROW_CANCEL,
    Permission.RESERVATION_CREATE,
    Permission.RESERVATION_VIEW_OWN,
    Permission.RESERVATION_CANCEL,
    Permission.STATS_VIEW_OWN,
  ],
  
  [UserRole.LIBRARIAN]: [
    Permission.BOOK_VIEW,
    Permission.BOOK_CREATE,
    Permission.BOOK_UPDATE,
    Permission.BOOK_BATCH_IMPORT,
    Permission.BORROW_CREATE,
    Permission.BORROW_VIEW_ALL,
    Permission.BORROW_UPDATE,
    Permission.BORROW_RETURN,
    Permission.BORROW_RENEW,
    Permission.BORROW_CANCEL,
    Permission.RESERVATION_VIEW_ALL,
    Permission.RESERVATION_CANCEL,
    Permission.USER_VIEW,
    Permission.USER_BLACKLIST,
    Permission.STATS_VIEW_ALL,
    Permission.REPORTS_GENERATE,
  ],
  
  [UserRole.ADMIN]: [
    // 管理员拥有所有权限
    ...Object.values(Permission),
  ],
};

// 扩展的用户信息接口
export interface LibraryUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: UserRole;                          // 用户角色
  permissions: Permission[];               // 用户权限列表
  isActive: boolean;                       // 账户是否激活
  isBlacklisted: boolean;                  // 是否被拉黑
  blacklistReason?: string;                // 拉黑原因
  borrowLimit: number;                     // 借阅限制
  currentBorrowCount: number;              // 当前借阅数量
  totalFines: number;                      // 总罚金
  unpaidFines: number;                     // 未支付罚金
  registrationDate: Date;                  // 注册日期
  lastLoginAt: Date;                       // 最后登录时间
  lastBorrowAt?: Date;                     // 最后借阅时间
  preferences?: LibraryUserPreferences;    // 用户偏好设置
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                      // 创建者ID（管理员创建的用户）
}

// 图书管理系统用户偏好设置
export interface LibraryUserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  defaultBookView: 'grid' | 'list';        // 默认图书视图
  itemsPerPage: number;                     // 每页显示数量
  autoRenewalEnabled: boolean;              // 自动续借
  emailNotifications: {
    dueDateReminder: boolean;               // 到期提醒
    reservationReady: boolean;              // 预约可取
    overdueNotice: boolean;                 // 逾期通知
    fineNotice: boolean;                    // 罚金通知
  };
  smsNotifications: {
    dueDateReminder: boolean;
    reservationReady: boolean;
    overdueNotice: boolean;
  };
  favoriteCategories: string[];            // 偏好分类
  searchHistory: string[];                 // 搜索历史
}

// 用户注册信息（扩展）
export interface LibraryUserRegistration {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  acceptTerms: boolean;
  role?: UserRole;                         // 可选，管理员创建用户时使用
  borrowLimit?: number;                    // 可选，自定义借阅限制
}

// 用户角色变更记录
export interface UserRoleHistory {
  id: string;
  userId: string;
  previousRole: UserRole;
  newRole: UserRole;
  changedBy: string;                       // 操作者ID
  reason: string;                          // 变更原因
  changedAt: Date;
}

// 用户黑名单记录
export interface UserBlacklistRecord {
  id: string;
  userId: string;
  reason: string;                          // 拉黑原因
  blacklistedBy: string;                   // 操作管理员ID
  blacklistedAt: Date;                     // 拉黑时间
  expiresAt?: Date;                        // 过期时间（可选）
  isActive: boolean;                       // 是否有效
  liftedBy?: string;                       // 解除拉黑的管理员ID
  liftedAt?: Date;                         // 解除时间
  liftReason?: string;                     // 解除原因
}

// 权限检查结果
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;                         // 无权限的原因
  requiredRole?: UserRole;                 // 需要的角色
}

// 用户操作审计日志
export interface UserAuditLog {
  id: string;
  userId: string;
  action: string;                          // 操作类型
  resource: string;                        // 操作的资源
  resourceId?: string;                     // 资源ID
  details: Record<string, any>;            // 操作详情
  ip: string;                              // IP地址
  userAgent: string;                       // 用户代理
  timestamp: Date;                         // 操作时间
  success: boolean;                        // 操作是否成功
  errorMessage?: string;                   // 错误信息
}

// 角色显示标签
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.READER]: '读者',
  [UserRole.LIBRARIAN]: '图书管理员',
  [UserRole.ADMIN]: '系统管理员',
};

// 角色颜色映射
export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.READER]: '#22C55E',            // 绿色
  [UserRole.LIBRARIAN]: '#3B82F6',         // 蓝色
  [UserRole.ADMIN]: '#EF4444',             // 红色
};

// 权限分组（用于UI展示）
export const PERMISSION_GROUPS = {
  books: {
    label: '图书管理',
    permissions: [
      Permission.BOOK_VIEW,
      Permission.BOOK_CREATE,
      Permission.BOOK_UPDATE,
      Permission.BOOK_DELETE,
      Permission.BOOK_BATCH_IMPORT,
    ],
  },
  borrowing: {
    label: '借阅管理',
    permissions: [
      Permission.BORROW_CREATE,
      Permission.BORROW_VIEW_OWN,
      Permission.BORROW_VIEW_ALL,
      Permission.BORROW_UPDATE,
      Permission.BORROW_RETURN,
      Permission.BORROW_RENEW,
      Permission.BORROW_CANCEL,
    ],
  },
  reservations: {
    label: '预约管理',
    permissions: [
      Permission.RESERVATION_CREATE,
      Permission.RESERVATION_VIEW_OWN,
      Permission.RESERVATION_VIEW_ALL,
      Permission.RESERVATION_CANCEL,
    ],
  },
  users: {
    label: '用户管理',
    permissions: [
      Permission.USER_VIEW,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.USER_DELETE,
      Permission.USER_ROLE_ASSIGN,
      Permission.USER_BLACKLIST,
    ],
  },
  reports: {
    label: '统计报表',
    permissions: [
      Permission.STATS_VIEW_OWN,
      Permission.STATS_VIEW_ALL,
      Permission.REPORTS_GENERATE,
    ],
  },
  system: {
    label: '系统管理',
    permissions: [
      Permission.SYSTEM_CONFIG,
      Permission.SYSTEM_BACKUP,
      Permission.SYSTEM_RESTORE,
      Permission.AUDIT_LOGS,
    ],
  },
};

// 默认用户偏好设置
export const DEFAULT_USER_PREFERENCES: LibraryUserPreferences = {
  theme: 'auto',
  language: 'zh-CN',
  defaultBookView: 'grid',
  itemsPerPage: 20,
  autoRenewalEnabled: false,
  emailNotifications: {
    dueDateReminder: true,
    reservationReady: true,
    overdueNotice: true,
    fineNotice: true,
  },
  smsNotifications: {
    dueDateReminder: false,
    reservationReady: false,
    overdueNotice: false,
  },
  favoriteCategories: [],
  searchHistory: [],
};