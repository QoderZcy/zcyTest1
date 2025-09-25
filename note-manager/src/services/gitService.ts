/**
 * 统一的Git服务接口
 * 提供Git平台无关的统一接口，自动处理平台适配器的选择和管理
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
  GitPlatform,
  PlatformConfig,
  GitStats
} from '../types/git';
import {
  GitPlatformAdapter,
  GitPlatformAdapterFactory,
  RepositoryListOptions,
  BranchListOptions,
  MergeRequestListOptions,
  CommitListOptions,
  CreateBranchOptions,
  CreateMergeRequestOptions,
  UpdateMergeRequestOptions,
  MergeBranchOptions,
  GetFileContentOptions,
  FileOperationOptions,
  SearchOptions
} from '../types/gitAdapter';
import { GitHubAdapter } from './github/GitHubAdapter';
import { GitLabAdapter } from './gitlab/GitLabAdapter';

// Git服务配置
export interface GitServiceConfig {
  // 默认平台
  defaultPlatform?: GitPlatform;
  // 平台特定配置
  platformConfigs?: {
    [key in GitPlatform]?: Partial<PlatformConfig>;
  };
  // 缓存配置
  cacheEnabled?: boolean;
  cacheTtl?: number; // 缓存时间（毫秒）
  // 并发配置
  maxConcurrentRequests?: number;
  // 重试配置
  retryAttempts?: number;
  retryDelayMs?: number;
}

// 认证管理器
interface AuthManager {
  auths: Map<GitPlatform, GitAuth>;
  setAuth(platform: GitPlatform, auth: GitAuth): void;
  getAuth(platform: GitPlatform): GitAuth | undefined;
  removeAuth(platform: GitPlatform): void;
  hasAuth(platform: GitPlatform): boolean;
}

// 平台适配器工厂实现
export class DefaultGitPlatformAdapterFactory implements GitPlatformAdapterFactory {
  private platformConfigs: Map<GitPlatform, Partial<PlatformConfig>>;

  constructor(configs: { [key in GitPlatform]?: Partial<PlatformConfig> } = {}) {
    this.platformConfigs = new Map();
    Object.entries(configs).forEach(([platform, config]) => {
      this.platformConfigs.set(platform as GitPlatform, config);
    });
  }

  createAdapter(platform: GitPlatform, config?: Partial<PlatformConfig>): GitPlatformAdapter {
    const platformConfig = {
      ...this.platformConfigs.get(platform),
      ...config
    };

    switch (platform) {
      case GitPlatform.GITHUB:
        return new GitHubAdapter(platformConfig);
      case GitPlatform.GITLAB:
        return new GitLabAdapter(platformConfig);
      case GitPlatform.GITEE:
        throw new Error('Gitee adapter not implemented yet');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  getSupportedPlatforms(): GitPlatform[] {
    return [GitPlatform.GITHUB, GitPlatform.GITLAB];
  }

  isPlatformSupported(platform: GitPlatform): boolean {
    return this.getSupportedPlatforms().includes(platform);
  }
}

// 主要的Git服务类
export class GitService {
  private config: GitServiceConfig;
  private adapterFactory: GitPlatformAdapterFactory;
  private adapters: Map<GitPlatform, GitPlatformAdapter>;
  private authManager: AuthManager;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor(config: GitServiceConfig = {}) {
    this.config = {
      defaultPlatform: GitPlatform.GITHUB,
      cacheEnabled: true,
      cacheTtl: 5 * 60 * 1000, // 5分钟
      maxConcurrentRequests: 10,
      retryAttempts: 3,
      retryDelayMs: 1000,
      ...config
    };

    this.adapterFactory = new DefaultGitPlatformAdapterFactory(
      this.config.platformConfigs
    );
    this.adapters = new Map();
    this.cache = new Map();

    this.authManager = {
      auths: new Map(),
      setAuth: (platform, auth) => {
        this.authManager.auths.set(platform, auth);
        // 设置适配器的认证信息
        const adapter = this.getAdapter(platform);
        if (adapter) {
          adapter.setAuth(auth);
        }
      },
      getAuth: (platform) => this.authManager.auths.get(platform),
      removeAuth: (platform) => {
        this.authManager.auths.delete(platform);
        // 清除适配器的认证信息
        const adapter = this.adapters.get(platform);
        if (adapter) {
          adapter.setAuth({} as GitAuth);
        }
      },
      hasAuth: (platform) => this.authManager.auths.has(platform)
    };
  }

  // ==================== 认证管理 ====================

  /**
   * 设置平台认证信息
   */
  setAuth(platform: GitPlatform, auth: GitAuth): void {
    this.authManager.setAuth(platform, auth);
  }

  /**
   * 获取平台认证信息
   */
  getAuth(platform: GitPlatform): GitAuth | undefined {
    return this.authManager.getAuth(platform);
  }

  /**
   * 移除平台认证信息
   */
  removeAuth(platform: GitPlatform): void {
    this.authManager.removeAuth(platform);
  }

  /**
   * 检查平台是否已认证
   */
  hasAuth(platform: GitPlatform): boolean {
    return this.authManager.hasAuth(platform);
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(platform: GitPlatform): Promise<OperationResult<GitUser>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.getCurrentUser();
  }

  /**
   * 验证认证信息
   */
  async validateAuth(platform: GitPlatform): Promise<OperationResult<boolean>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.validateAuth();
  }

  // ==================== 仓库管理 ====================

  /**
   * 获取用户仓库列表（支持多平台）
   */
  async listAllRepositories(platforms?: GitPlatform[], options?: RepositoryListOptions): Promise<OperationResult<Repository[]>> {
    const targetPlatforms = platforms || this.getAuthenticatedPlatforms();
    
    if (targetPlatforms.length === 0) {
      return this.createErrorResult('No authenticated platforms available');
    }

    try {
      const results = await Promise.allSettled(
        targetPlatforms.map(platform => this.listRepositories(platform, options))
      );

      const repositories: Repository[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          repositories.push(...result.value.data!.data);
        } else {
          const platform = targetPlatforms[index];
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          errors.push(`${platform}: ${error?.message || 'Unknown error'}`);
        }
      });

      if (repositories.length === 0 && errors.length > 0) {
        return this.createErrorResult(`Failed to fetch repositories: ${errors.join('; ')}`);
      }

      // 按更新时间排序
      repositories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return this.createSuccessResult(repositories);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  /**
   * 获取指定平台的仓库列表
   */
  async listRepositories(platform: GitPlatform, options?: RepositoryListOptions): Promise<OperationResult<ApiResponse<Repository[]>>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    const cacheKey = `repos-${platform}-${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    const result = await adapter.listRepositories(options);
    
    if (result.success && this.config.cacheEnabled) {
      this.setCache(cacheKey, result.data);
    }

    return result;
  }

  /**
   * 获取仓库信息
   */
  async getRepository(platform: GitPlatform, owner: string, repo: string): Promise<OperationResult<Repository>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    const cacheKey = `repo-${platform}-${owner}-${repo}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    const result = await adapter.getRepository(owner, repo);
    
    if (result.success && this.config.cacheEnabled) {
      this.setCache(cacheKey, result.data);
    }

    return result;
  }

  /**
   * 搜索仓库
   */
  async searchRepositories(platform: GitPlatform, query: string, options?: SearchOptions): Promise<OperationResult<ApiResponse<Repository[]>>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.searchRepositories(query, options);
  }

  // ==================== 分支管理 ====================

  /**
   * 获取仓库分支列表
   */
  async listBranches(platform: GitPlatform, owner: string, repo: string, options?: BranchListOptions): Promise<OperationResult<ApiResponse<Branch[]>>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    const cacheKey = `branches-${platform}-${owner}-${repo}-${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    const result = await adapter.listBranches(owner, repo, options);
    
    if (result.success && this.config.cacheEnabled) {
      this.setCache(cacheKey, result.data, 2 * 60 * 1000); // 分支信息缓存2分钟
    }

    return result;
  }

  /**
   * 获取分支信息
   */
  async getBranch(platform: GitPlatform, owner: string, repo: string, branch: string): Promise<OperationResult<Branch>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.getBranch(owner, repo, branch);
  }

  /**
   * 创建分支
   */
  async createBranch(platform: GitPlatform, owner: string, repo: string, options: CreateBranchOptions): Promise<OperationResult<Branch>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    const result = await adapter.createBranch(owner, repo, options);
    
    // 清除相关缓存
    if (result.success) {
      this.clearBranchCache(platform, owner, repo);
    }

    return result;
  }

  /**
   * 删除分支
   */
  async deleteBranch(platform: GitPlatform, owner: string, repo: string, branch: string): Promise<OperationResult<void>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    const result = await adapter.deleteBranch(owner, repo, branch);
    
    // 清除相关缓存
    if (result.success) {
      this.clearBranchCache(platform, owner, repo);
    }

    return result;
  }

  /**
   * 比较分支
   */
  async compareBranches(platform: GitPlatform, owner: string, repo: string, base: string, head: string): Promise<OperationResult<BranchComparison>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.compareBranches(owner, repo, base, head);
  }

  // ==================== 合并请求管理 ====================

  /**
   * 获取合并请求列表
   */
  async listMergeRequests(platform: GitPlatform, owner: string, repo: string, options?: MergeRequestListOptions): Promise<OperationResult<ApiResponse<MergeRequest[]>>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.listMergeRequests(owner, repo, options);
  }

  /**
   * 获取合并请求信息
   */
  async getMergeRequest(platform: GitPlatform, owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.getMergeRequest(owner, repo, id);
  }

  /**
   * 创建合并请求
   */
  async createMergeRequest(platform: GitPlatform, owner: string, repo: string, options: CreateMergeRequestOptions): Promise<OperationResult<MergeRequest>> {
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return this.createErrorResult(`Platform ${platform} not supported`);
    }

    return await adapter.createMergeRequest(owner, repo, options);
  }

  // ==================== 统计信息 ====================

  /**
   * 获取Git统计信息
   */
  async getGitStats(platforms?: GitPlatform[]): Promise<OperationResult<GitStats>> {
    const targetPlatforms = platforms || this.getAuthenticatedPlatforms();
    
    try {
      const stats: GitStats = {
        totalRepositories: 0,
        totalBranches: 0,
        activeBranches: 0,
        staleBranches: 0,
        totalMergeRequests: 0,
        openMergeRequests: 0,
        myMergeRequests: 0,
        needsReview: 0
      };

      // 并行获取各平台的统计信息
      const results = await Promise.allSettled(
        targetPlatforms.map(async (platform) => {
          const reposResult = await this.listRepositories(platform, { perPage: 100 });
          if (!reposResult.success) return null;

          const repositories = reposResult.data!.data;
          stats.totalRepositories += repositories.length;

          // 获取部分仓库的分支统计（避免过多API调用）
          const sampleRepos = repositories.slice(0, 5);
          for (const repo of sampleRepos) {
            const [owner, repoName] = repo.fullName.split('/');
            const branchesResult = await this.listBranches(platform, owner, repoName, { perPage: 50 });
            if (branchesResult.success) {
              const branches = branchesResult.data!.data;
              stats.totalBranches += branches.length;
              stats.activeBranches += branches.filter(b => b.status === 'active').length;
            }

            const mrsResult = await this.listMergeRequests(platform, owner, repoName, { perPage: 20 });
            if (mrsResult.success) {
              const mrs = mrsResult.data!.data;
              stats.totalMergeRequests += mrs.length;
              stats.openMergeRequests += mrs.filter(mr => mr.state === 'open').length;
            }
          }

          return true;
        })
      );

      return this.createSuccessResult(stats);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 获取已认证的平台列表
   */
  getAuthenticatedPlatforms(): GitPlatform[] {
    return Array.from(this.authManager.auths.keys());
  }

  /**
   * 获取支持的平台列表
   */
  getSupportedPlatforms(): GitPlatform[] {
    return this.adapterFactory.getSupportedPlatforms();
  }

  /**
   * 检查平台是否支持
   */
  isPlatformSupported(platform: GitPlatform): boolean {
    return this.adapterFactory.isPlatformSupported(platform);
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除指定前缀的缓存
   */
  clearCacheByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // ==================== 私有方法 ====================

  private getAdapter(platform: GitPlatform): GitPlatformAdapter | null {
    if (!this.adapters.has(platform)) {
      try {
        const adapter = this.adapterFactory.createAdapter(platform);
        
        // 设置认证信息
        const auth = this.authManager.getAuth(platform);
        if (auth) {
          adapter.setAuth(auth);
        }
        
        this.adapters.set(platform, adapter);
      } catch (error) {
        console.error(`Failed to create adapter for ${platform}:`, error);
        return null;
      }
    }

    return this.adapters.get(platform) || null;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.config.cacheEnabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > (this.config.cacheTtl || 5 * 60 * 1000);
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 定时清理过期缓存
    if (ttl) {
      setTimeout(() => {
        this.cache.delete(key);
      }, ttl);
    }
  }

  private clearBranchCache(platform: GitPlatform, owner: string, repo: string): void {
    const prefix = `branches-${platform}-${owner}-${repo}`;
    this.clearCacheByPrefix(prefix);
  }

  private createSuccessResult<T>(data: T, message?: string): OperationResult<T> {
    return {
      success: true,
      data,
      message
    };
  }

  private createErrorResult<T>(error: any, message?: string): OperationResult<T> {
    return {
      success: false,
      error: {
        code: error?.code || 'UNKNOWN_ERROR',
        message: error?.message || message || 'Unknown error occurred',
        details: error,
        timestamp: new Date()
      }
    };
  }
}

// 创建默认的Git服务实例
export const gitService = new GitService();

// 导出类型
export type {
  GitServiceConfig,
  GitPlatformAdapterFactory
};