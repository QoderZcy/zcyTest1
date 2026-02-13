/**
 * Git平台集成相关的类型定义
 */

// Git平台枚举
export enum GitPlatform {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  GITEE = 'gitee'
}

// 分支状态枚举
export enum BranchStatus {
  ACTIVE = 'active',
  STALE = 'stale',
  MERGED = 'merged',
  DELETED = 'deleted'
}

// 合并请求状态枚举
export enum MergeRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged',
  DRAFT = 'draft'
}

// 用户权限枚举
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  MAINTAIN = 'maintain'
}

// 基础用户信息
export interface GitUser {
  id: string | number;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

// 提交信息
export interface Commit {
  sha: string;
  message: string;
  author: GitUser;
  committer: GitUser;
  timestamp: Date;
  url?: string;
  parentShas?: string[];
}

// 仓库权限配置
export interface RepoPermissions {
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  canCreateBranch: boolean;
  canDeleteBranch: boolean;
  canMerge: boolean;
  canCreateMergeRequest: boolean;
}

// 仓库信息
export interface Repository {
  id: string;
  name: string;
  fullName: string; // owner/repo
  description?: string;
  platform: GitPlatform;
  owner: GitUser;
  permissions: RepoPermissions;
  defaultBranch: string;
  isPrivate: boolean;
  isFork: boolean;
  forksCount: number;
  starsCount: number;
  watchersCount: number;
  size: number; // KB
  language?: string;
  topics?: string[];
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date;
  cloneUrl: string;
  sshUrl: string;
  webUrl: string;
  isArchived: boolean;
  isDisabled: boolean;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  hasDownloads: boolean;
}

// 分支信息
export interface Branch {
  name: string;
  sha: string;
  isProtected: boolean;
  isDefault: boolean;
  lastCommit: Commit;
  ahead: number; // 领先主分支的提交数
  behind: number; // 落后主分支的提交数
  status: BranchStatus;
  mergeRequestsCount: number;
  createdAt?: Date;
  updatedAt: Date;
  protection?: BranchProtection;
}

// 分支保护规则
export interface BranchProtection {
  id?: string;
  enabled: boolean;
  requiredStatusChecks?: {
    strict: boolean; // 要求分支是最新的
    contexts: string[]; // 必需的状态检查
  };
  enforceAdmins?: boolean; // 管理员也要遵守规则
  requiredPullRequestReviews?: {
    required: boolean;
    requiredReviewerCount: number;
    dismissStaleReviews: boolean; // 新提交时解除旧审查
    requireCodeOwnerReviews: boolean;
    requiredReviewingTeams?: string[];
  };
  restrictions?: { // 推送限制
    users: string[];
    teams: string[];
  };
  allowForcePushes?: boolean;
  allowDeletions?: boolean;
}

// 合并请求/拉取请求
export interface MergeRequest {
  id: string | number;
  number: number;
  title: string;
  description?: string;
  state: MergeRequestStatus;
  author: GitUser;
  assignees: GitUser[];
  reviewers: GitUser[];
  sourceBranch: string;
  targetBranch: string;
  sourceRepository: Repository;
  targetRepository: Repository;
  commits: Commit[];
  changedFiles: number;
  additions: number;
  deletions: number;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  closedAt?: Date;
  webUrl: string;
  isMergeable: boolean;
  mergeStatus: 'checking' | 'can_be_merged' | 'cannot_be_merged';
  isDraft: boolean;
  hasConflicts: boolean;
  labels: string[];
  milestone?: string;
  discussions?: Discussion[];
}

// 讨论/评论
export interface Discussion {
  id: string;
  author: GitUser;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  resolved?: boolean;
  position?: {
    filePath: string;
    lineNumber: number;
    oldLineNumber?: number;
  };
  replies?: Discussion[];
}

// 文件变更
export interface FileChange {
  path: string;
  oldPath?: string; // 重命名时的原路径
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string; // diff内容
  blobUrl?: string;
}

// 分支比较结果
export interface BranchComparison {
  baseBranch: string;
  headBranch: string;
  aheadBy: number;
  behindBy: number;
  totalCommits: number;
  commits: Commit[];
  files: FileChange[];
  mergeable: boolean;
  mergeBase?: string; // 共同祖先提交
}

// Git统计信息
export interface GitStats {
  totalRepositories: number;
  totalBranches: number;
  activeBranches: number;
  staleBranches: number;
  totalMergeRequests: number;
  openMergeRequests: number;
  myMergeRequests: number;
  needsReview: number;
}

// 分支筛选条件
export interface BranchFilter {
  search: string;
  status: BranchStatus[];
  author: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  protected?: boolean;
  merged?: boolean;
  sortBy: 'name' | 'updated' | 'created' | 'commits';
  sortOrder: 'asc' | 'desc';
}

// 错误类型
export interface GitError {
  code: string;
  message: string;
  details?: any;
  platform?: GitPlatform;
  repository?: string;
  timestamp: Date;
}

// 加载状态
export interface LoadingState {
  repositories: boolean;
  branches: boolean;
  mergeRequests: boolean;
  commits: boolean;
  details: boolean;
}

// 操作结果
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: GitError;
  message?: string;
}

// 批量操作结果
export interface BatchOperationResult<T = any> {
  total: number;
  successful: number;
  failed: number;
  results: OperationResult<T>[];
  errors: GitError[];
}

// API响应格式
export interface ApiResponse<T = any> {
  data: T;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
  };
}

// 认证信息
export interface GitAuth {
  platform: GitPlatform;
  token: string;
  tokenType: 'personal' | 'oauth' | 'app';
  scopes: string[];
  expiresAt?: Date;
  user: GitUser;
}

// 平台配置
export interface PlatformConfig {
  platform: GitPlatform;
  baseUrl: string;
  apiVersion?: string;
  defaultPerPage: number;
  maxPerPage: number;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

// Webhook事件
export interface WebhookEvent {
  id: string;
  type: 'push' | 'pull_request' | 'branch_created' | 'branch_deleted' | 'merge_request';
  platform: GitPlatform;
  repository: Repository;
  data: any;
  timestamp: Date;
}