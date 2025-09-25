/**
 * Git平台适配器接口定义
 * 定义了各Git平台（GitHub、GitLab等）需要实现的统一接口
 */

import {
  Repository,
  Branch,
  MergeRequest,
  Commit,
  GitUser,
  BranchProtection,
  BranchComparison,
  FileChange,
  GitAuth,
  ApiResponse,
  OperationResult,
  BatchOperationResult,
  GitPlatform,
  PlatformConfig
} from '../types/git';

// 分页选项
export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

// 搜索选项
export interface SearchOptions extends PaginationOptions {
  query?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 仓库查询选项
export interface RepositoryListOptions extends SearchOptions {
  visibility?: 'all' | 'public' | 'private';
  affiliation?: 'owner' | 'collaborator' | 'organization_member';
  type?: 'all' | 'owner' | 'public' | 'private' | 'member';
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
}

// 分支查询选项
export interface BranchListOptions extends PaginationOptions {
  protected?: boolean;
  sort?: 'name' | 'updated' | 'created';
}

// 合并请求查询选项
export interface MergeRequestListOptions extends SearchOptions {
  state?: 'open' | 'closed' | 'merged' | 'all';
  author?: string;
  assignee?: string;
  reviewer?: string;
  labels?: string[];
  milestone?: string;
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
}

// 提交查询选项
export interface CommitListOptions extends PaginationOptions {
  sha?: string;
  path?: string;
  author?: string;
  since?: Date;
  until?: Date;
}

// 创建分支的参数
export interface CreateBranchOptions {
  name: string;
  ref: string; // 源分支或提交SHA
}

// 创建合并请求的参数
export interface CreateMergeRequestOptions {
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  assigneeIds?: string[];
  reviewerIds?: string[];
  labels?: string[];
  milestone?: string;
  isDraft?: boolean;
  removeSourceBranch?: boolean;
  squash?: boolean;
}

// 更新合并请求的参数
export interface UpdateMergeRequestOptions {
  title?: string;
  description?: string;
  assigneeIds?: string[];
  reviewerIds?: string[];
  labels?: string[];
  milestone?: string;
  state?: 'open' | 'closed';
}

// 合并选项
export interface MergeBranchOptions {
  commitMessage?: string;
  mergeMethod?: 'merge' | 'squash' | 'rebase';
  sha?: string; // 要合并的具体提交
  removeSourceBranch?: boolean;
}

// 文件内容获取选项
export interface GetFileContentOptions {
  ref?: string; // 分支名或提交SHA
  format?: 'raw' | 'base64';
}

// 创建或更新文件的参数
export interface FileOperationOptions {
  content: string;
  message: string;
  branch?: string;
  encoding?: 'utf-8' | 'base64';
  authorName?: string;
  authorEmail?: string;
  committerName?: string;
  committerEmail?: string;
}

/**
 * Git平台适配器基础接口
 * 所有Git平台适配器都需要实现此接口
 */
export interface GitPlatformAdapter {
  readonly platform: GitPlatform;
  readonly config: PlatformConfig;

  // ==================== 认证相关 ====================
  
  /**
   * 设置认证信息
   */
  setAuth(auth: GitAuth): void;

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<OperationResult<GitUser>>;

  /**
   * 验证认证令牌是否有效
   */
  validateAuth(): Promise<OperationResult<boolean>>;

  // ==================== 仓库管理 ====================

  /**
   * 获取用户仓库列表
   */
  listRepositories(options?: RepositoryListOptions): Promise<OperationResult<ApiResponse<Repository[]>>>;

  /**
   * 获取单个仓库信息
   */
  getRepository(owner: string, repo: string): Promise<OperationResult<Repository>>;

  /**
   * 搜索仓库
   */
  searchRepositories(query: string, options?: SearchOptions): Promise<OperationResult<ApiResponse<Repository[]>>>;

  // ==================== 分支管理 ====================

  /**
   * 获取仓库分支列表
   */
  listBranches(owner: string, repo: string, options?: BranchListOptions): Promise<OperationResult<ApiResponse<Branch[]>>>;

  /**
   * 获取单个分支信息
   */
  getBranch(owner: string, repo: string, branch: string): Promise<OperationResult<Branch>>;

  /**
   * 创建分支
   */
  createBranch(owner: string, repo: string, options: CreateBranchOptions): Promise<OperationResult<Branch>>;

  /**
   * 删除分支
   */
  deleteBranch(owner: string, repo: string, branch: string): Promise<OperationResult<void>>;

  /**
   * 比较两个分支
   */
  compareBranches(owner: string, repo: string, base: string, head: string): Promise<OperationResult<BranchComparison>>;

  // ==================== 分支保护 ====================

  /**
   * 获取分支保护规则
   */
  getBranchProtection(owner: string, repo: string, branch: string): Promise<OperationResult<BranchProtection>>;

  /**
   * 设置分支保护规则
   */
  setBranchProtection(owner: string, repo: string, branch: string, protection: BranchProtection): Promise<OperationResult<BranchProtection>>;

  /**
   * 删除分支保护规则
   */
  removeBranchProtection(owner: string, repo: string, branch: string): Promise<OperationResult<void>>;

  // ==================== 提交管理 ====================

  /**
   * 获取提交列表
   */
  listCommits(owner: string, repo: string, options?: CommitListOptions): Promise<OperationResult<ApiResponse<Commit[]>>>;

  /**
   * 获取单个提交信息
   */
  getCommit(owner: string, repo: string, sha: string): Promise<OperationResult<Commit>>;

  /**
   * 获取提交的文件变更
   */
  getCommitChanges(owner: string, repo: string, sha: string): Promise<OperationResult<FileChange[]>>;

  // ==================== 合并请求管理 ====================

  /**
   * 获取合并请求列表
   */
  listMergeRequests(owner: string, repo: string, options?: MergeRequestListOptions): Promise<OperationResult<ApiResponse<MergeRequest[]>>>;

  /**
   * 获取单个合并请求信息
   */
  getMergeRequest(owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>>;

  /**
   * 创建合并请求
   */
  createMergeRequest(owner: string, repo: string, options: CreateMergeRequestOptions): Promise<OperationResult<MergeRequest>>;

  /**
   * 更新合并请求
   */
  updateMergeRequest(owner: string, repo: string, id: string | number, options: UpdateMergeRequestOptions): Promise<OperationResult<MergeRequest>>;

  /**
   * 合并分支
   */
  mergeBranch(owner: string, repo: string, id: string | number, options?: MergeBranchOptions): Promise<OperationResult<MergeRequest>>;

  /**
   * 关闭合并请求
   */
  closeMergeRequest(owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>>;

  // ==================== 文件操作 ====================

  /**
   * 获取文件内容
   */
  getFileContent(owner: string, repo: string, path: string, options?: GetFileContentOptions): Promise<OperationResult<string>>;

  /**
   * 创建文件
   */
  createFile(owner: string, repo: string, path: string, options: FileOperationOptions): Promise<OperationResult<Commit>>;

  /**
   * 更新文件
   */
  updateFile(owner: string, repo: string, path: string, options: FileOperationOptions & { sha: string }): Promise<OperationResult<Commit>>;

  /**
   * 删除文件
   */
  deleteFile(owner: string, repo: string, path: string, options: Pick<FileOperationOptions, 'message' | 'branch' | 'authorName' | 'authorEmail'> & { sha: string }): Promise<OperationResult<Commit>>;

  // ==================== 搜索功能 ====================

  /**
   * 搜索代码
   */
  searchCode(query: string, options?: SearchOptions): Promise<OperationResult<ApiResponse<any[]>>>;

  /**
   * 搜索提交
   */
  searchCommits(query: string, options?: SearchOptions): Promise<OperationResult<ApiResponse<Commit[]>>>;

  // ==================== 工具方法 ====================

  /**
   * 获取API速率限制信息
   */
  getRateLimit(): Promise<OperationResult<{
    limit: number;
    remaining: number;
    reset: Date;
  }>>;

  /**
   * 检查连接状态
   */
  checkConnection(): Promise<OperationResult<boolean>>;
}

/**
 * 扩展的Git平台适配器接口
 * 提供一些可选的高级功能
 */
export interface ExtendedGitPlatformAdapter extends GitPlatformAdapter {
  
  // ==================== 批量操作 ====================

  /**
   * 批量创建分支
   */
  createBranches?(owner: string, repo: string, branches: CreateBranchOptions[]): Promise<BatchOperationResult<Branch>>;

  /**
   * 批量删除分支
   */
  deleteBranches?(owner: string, repo: string, branches: string[]): Promise<BatchOperationResult<void>>;

  // ==================== 高级搜索 ====================

  /**
   * 高级仓库搜索
   */
  advancedRepositorySearch?(filters: {
    query?: string;
    language?: string;
    topics?: string[];
    stars?: string; // e.g., ">100", "10..50"
    forks?: string;
    size?: string;
    pushed?: string; // e.g., ">2023-01-01"
    created?: string;
    license?: string;
    archived?: boolean;
  }): Promise<OperationResult<ApiResponse<Repository[]>>>;

  // ==================== 统计信息 ====================

  /**
   * 获取仓库统计信息
   */
  getRepositoryStats?(owner: string, repo: string): Promise<OperationResult<{
    totalCommits: number;
    totalBranches: number;
    totalTags: number;
    totalContributors: number;
    codeFrequency: Array<[number, number, number]>; // [timestamp, additions, deletions]
    commitActivity: Array<{ week: number; total: number; days: number[] }>;
  }>>;

  /**
   * 获取分支统计信息
   */
  getBranchStats?(owner: string, repo: string, branch: string): Promise<OperationResult<{
    totalCommits: number;
    ahead: number;
    behind: number;
    lastActivity: Date;
    contributors: GitUser[];
  }>>;

  // ==================== Webhook支持 ====================

  /**
   * 创建Webhook
   */
  createWebhook?(owner: string, repo: string, config: {
    url: string;
    contentType: 'json' | 'form';
    secret?: string;
    events: string[];
    active?: boolean;
  }): Promise<OperationResult<{ id: string; url: string }>>;

  /**
   * 删除Webhook
   */
  deleteWebhook?(owner: string, repo: string, id: string): Promise<OperationResult<void>>;
}

/**
 * Git平台适配器工厂接口
 */
export interface GitPlatformAdapterFactory {
  /**
   * 创建指定平台的适配器实例
   */
  createAdapter(platform: GitPlatform, config?: Partial<PlatformConfig>): GitPlatformAdapter;

  /**
   * 获取支持的平台列表
   */
  getSupportedPlatforms(): GitPlatform[];

  /**
   * 检查平台是否支持
   */
  isPlatformSupported(platform: GitPlatform): boolean;
}

/**
 * 适配器基础抽象类
 * 提供通用的错误处理、重试逻辑等
 */
export abstract class BaseGitPlatformAdapter implements GitPlatformAdapter {
  abstract readonly platform: GitPlatform;
  abstract readonly config: PlatformConfig;
  
  protected auth?: GitAuth;

  setAuth(auth: GitAuth): void {
    this.auth = auth;
  }

  // 抽象方法，子类必须实现
  abstract getCurrentUser(): Promise<OperationResult<GitUser>>;
  abstract validateAuth(): Promise<OperationResult<boolean>>;
  abstract listRepositories(options?: RepositoryListOptions): Promise<OperationResult<ApiResponse<Repository[]>>>;
  abstract getRepository(owner: string, repo: string): Promise<OperationResult<Repository>>;
  abstract searchRepositories(query: string, options?: SearchOptions): Promise<OperationResult<ApiResponse<Repository[]>>>;
  abstract listBranches(owner: string, repo: string, options?: BranchListOptions): Promise<OperationResult<ApiResponse<Branch[]>>>;
  abstract getBranch(owner: string, repo: string, branch: string): Promise<OperationResult<Branch>>;
  abstract createBranch(owner: string, repo: string, options: CreateBranchOptions): Promise<OperationResult<Branch>>;
  abstract deleteBranch(owner: string, repo: string, branch: string): Promise<OperationResult<void>>;
  abstract compareBranches(owner: string, repo: string, base: string, head: string): Promise<OperationResult<BranchComparison>>;
  abstract getBranchProtection(owner: string, repo: string, branch: string): Promise<OperationResult<BranchProtection>>;
  abstract setBranchProtection(owner: string, repo: string, branch: string, protection: BranchProtection): Promise<OperationResult<BranchProtection>>;
  abstract removeBranchProtection(owner: string, repo: string, branch: string): Promise<OperationResult<void>>;
  abstract listCommits(owner: string, repo: string, options?: CommitListOptions): Promise<OperationResult<ApiResponse<Commit[]>>>;
  abstract getCommit(owner: string, repo: string, sha: string): Promise<OperationResult<Commit>>;
  abstract getCommitChanges(owner: string, repo: string, sha: string): Promise<OperationResult<FileChange[]>>;
  abstract listMergeRequests(owner: string, repo: string, options?: MergeRequestListOptions): Promise<OperationResult<ApiResponse<MergeRequest[]>>>;
  abstract getMergeRequest(owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>>;
  abstract createMergeRequest(owner: string, repo: string, options: CreateMergeRequestOptions): Promise<OperationResult<MergeRequest>>;
  abstract updateMergeRequest(owner: string, repo: string, id: string | number, options: UpdateMergeRequestOptions): Promise<OperationResult<MergeRequest>>;
  abstract mergeBranch(owner: string, repo: string, id: string | number, options?: MergeBranchOptions): Promise<OperationResult<MergeRequest>>;
  abstract closeMergeRequest(owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>>;
  abstract getFileContent(owner: string, repo: string, path: string, options?: GetFileContentOptions): Promise<OperationResult<string>>;
  abstract createFile(owner: string, repo: string, path: string, options: FileOperationOptions): Promise<OperationResult<Commit>>;
  abstract updateFile(owner: string, repo: string, path: string, options: FileOperationOptions & { sha: string }): Promise<OperationResult<Commit>>;
  abstract deleteFile(owner: string, repo: string, path: string, options: Pick<FileOperationOptions, 'message' | 'branch' | 'authorName' | 'authorEmail'> & { sha: string }): Promise<OperationResult<Commit>>;
  abstract searchCode(query: string, options?: SearchOptions): Promise<OperationResult<ApiResponse<any[]>>>;
  abstract searchCommits(query: string, options?: SearchOptions): Promise<OperationResult<ApiResponse<Commit[]>>>;
  abstract getRateLimit(): Promise<OperationResult<{ limit: number; remaining: number; reset: Date; }>>;
  abstract checkConnection(): Promise<OperationResult<boolean>>;

  // 通用工具方法
  protected createSuccessResult<T>(data: T, message?: string): OperationResult<T> {
    return {
      success: true,
      data,
      message
    };
  }

  protected createErrorResult<T>(error: any, message?: string): OperationResult<T> {
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || message || 'Unknown error occurred',
        details: error,
        platform: this.platform,
        timestamp: new Date()
      }
    };
  }

  // 重试逻辑
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.config.retryAttempts,
    delay: number = this.config.retryDelayMs
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }

        // 指数退避
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError;
  }
}