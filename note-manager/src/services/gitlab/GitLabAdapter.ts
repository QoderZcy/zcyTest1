/**
 * GitLab API适配器实现
 * 基于GitLab REST API实现GitPlatformAdapter接口
 */

import axios, { AxiosInstance } from 'axios';
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
  BranchStatus,
  MergeRequestStatus
} from '../types/git';
import {
  BaseGitPlatformAdapter,
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

// GitLab API响应类型定义
interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url: string;
  web_url: string;
}

interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  description?: string;
  owner: GitLabUser;
  visibility: 'private' | 'internal' | 'public';
  fork: boolean;
  forks_count: number;
  star_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  http_url_to_repo: string;
  ssh_url_to_repo: string;
  web_url: string;
  archived: boolean;
  topics: string[];
  default_branch: string;
  permissions?: {
    project_access?: { access_level: number };
    group_access?: { access_level: number };
  };
}

interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    message: string;
    committed_date: string;
    author_name: string;
    author_email: string;
    committer_name: string;
    committer_email: string;
    web_url: string;
  };
  protected: boolean;
  default: boolean;
}

interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: 'opened' | 'closed' | 'merged';
  author: GitLabUser;
  assignees: GitLabUser[];
  reviewers: GitLabUser[];
  source_branch: string;
  target_branch: string;
  source_project_id: number;
  target_project_id: number;
  merged_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  web_url: string;
  merge_status: 'checking' | 'can_be_merged' | 'cannot_be_merged';
  draft: boolean;
  has_conflicts: boolean;
  changes_count: string;
  user_notes_count: number;
  labels: string[];
  milestone?: { title: string };
}

export class GitLabAdapter extends BaseGitPlatformAdapter {
  readonly platform = GitPlatform.GITLAB;
  readonly config: PlatformConfig;
  private client: AxiosInstance;

  constructor(config?: Partial<PlatformConfig>) {
    super();
    
    this.config = {
      platform: GitPlatform.GITLAB,
      baseUrl: 'https://gitlab.com/api/v4',
      apiVersion: 'v4',
      defaultPerPage: 20,
      maxPerPage: 100,
      timeoutMs: 30000,
      retryAttempts: 3,
      retryDelayMs: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 请求拦截器
    this.client.interceptors.request.use((config) => {
      if (this.auth?.token) {
        config.headers.Authorization = `Bearer ${this.auth.token}`;
      }
      return config;
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[GitLab API Error]', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ==================== 认证相关 ====================

  async getCurrentUser(): Promise<OperationResult<GitUser>> {
    try {
      const response = await this.client.get<GitLabUser>('/user');
      return this.createSuccessResult(this.transformUser(response.data));
    } catch (error) {
      return this.createErrorResult(error, '获取当前用户信息失败');
    }
  }

  async validateAuth(): Promise<OperationResult<boolean>> {
    try {
      await this.client.get('/user');
      return this.createSuccessResult(true);
    } catch (error) {
      return this.createSuccessResult(false);
    }
  }

  // ==================== 仓库管理 ====================

  async listRepositories(options: RepositoryListOptions = {}): Promise<OperationResult<ApiResponse<Repository[]>>> {
    try {
      const params = {
        page: options.page || 1,
        per_page: Math.min(options.perPage || this.config.defaultPerPage, this.config.maxPerPage),
        visibility: options.visibility || 'all',
        membership: true, // 只显示用户是成员的项目
        sort: options.sort || 'updated_at',
        order_by: options.sort || 'updated_at'
      };

      const response = await this.client.get<GitLabProject[]>('/projects', { params });
      
      const repositories = response.data.map(project => this.transformProject(project));
      const apiResponse = this.createApiResponse(repositories, response);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, '获取项目列表失败');
    }
  }

  async getRepository(owner: string, repo: string): Promise<OperationResult<Repository>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await this.client.get<GitLabProject>(`/projects/${projectPath}`);
      return this.createSuccessResult(this.transformProject(response.data));
    } catch (error) {
      return this.createErrorResult(error, `获取项目 ${owner}/${repo} 信息失败`);
    }
  }

  async searchRepositories(query: string, options: SearchOptions = {}): Promise<OperationResult<ApiResponse<Repository[]>>> {
    try {
      const params = {
        search: query,
        page: options.page || 1,
        per_page: Math.min(options.perPage || this.config.defaultPerPage, this.config.maxPerPage),
        sort: options.sort || 'updated_at',
        order_by: options.sort || 'updated_at'
      };

      const response = await this.client.get<GitLabProject[]>('/projects', { params });
      
      const repositories = response.data.map(project => this.transformProject(project));
      const apiResponse = this.createApiResponse(repositories, response);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, '搜索项目失败');
    }
  }

  // ==================== 分支管理 ====================

  async listBranches(owner: string, repo: string, options: BranchListOptions = {}): Promise<OperationResult<ApiResponse<Branch[]>>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const params = {
        page: options.page || 1,
        per_page: Math.min(options.perPage || this.config.defaultPerPage, this.config.maxPerPage)
      };

      const response = await this.client.get<GitLabBranch[]>(`/projects/${projectPath}/repository/branches`, { params });
      
      const branches = response.data.map(branch => this.transformBranch(branch));
      const apiResponse = this.createApiResponse(branches, response);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, `获取项目 ${owner}/${repo} 分支列表失败`);
    }
  }

  async getBranch(owner: string, repo: string, branch: string): Promise<OperationResult<Branch>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const branchName = encodeURIComponent(branch);
      const response = await this.client.get<GitLabBranch>(`/projects/${projectPath}/repository/branches/${branchName}`);
      return this.createSuccessResult(this.transformBranch(response.data));
    } catch (error) {
      return this.createErrorResult(error, `获取分支 ${branch} 信息失败`);
    }
  }

  async createBranch(owner: string, repo: string, options: CreateBranchOptions): Promise<OperationResult<Branch>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const data = {
        branch: options.name,
        ref: options.ref
      };

      const response = await this.client.post<GitLabBranch>(`/projects/${projectPath}/repository/branches`, data);
      return this.createSuccessResult(this.transformBranch(response.data));
    } catch (error) {
      return this.createErrorResult(error, `创建分支 ${options.name} 失败`);
    }
  }

  async deleteBranch(owner: string, repo: string, branch: string): Promise<OperationResult<void>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const branchName = encodeURIComponent(branch);
      await this.client.delete(`/projects/${projectPath}/repository/branches/${branchName}`);
      return this.createSuccessResult(undefined, `分支 ${branch} 删除成功`);
    } catch (error) {
      return this.createErrorResult(error, `删除分支 ${branch} 失败`);
    }
  }

  async compareBranches(owner: string, repo: string, base: string, head: string): Promise<OperationResult<BranchComparison>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await this.client.get(`/projects/${projectPath}/repository/compare`, {
        params: { from: base, to: head }
      });

      const comparison: BranchComparison = {
        baseBranch: base,
        headBranch: head,
        aheadBy: response.data.commits?.length || 0,
        behindBy: 0, // GitLab API不直接提供behind信息
        totalCommits: response.data.commits?.length || 0,
        commits: response.data.commits?.map((commit: any) => this.transformCommit(commit)) || [],
        files: response.data.diffs?.map((diff: any) => this.transformFileChange(diff)) || [],
        mergeable: true, // 需要额外API调用确定
        mergeBase: response.data.compare_same_ref ? head : undefined
      };

      return this.createSuccessResult(comparison);
    } catch (error) {
      return this.createErrorResult(error, `比较分支 ${base}...${head} 失败`);
    }
  }

  // ==================== 其他方法的简化实现 ====================

  // 为了节省空间，这里只提供基础实现，其他方法类似GitHub适配器
  async getBranchProtection(): Promise<OperationResult<BranchProtection>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async setBranchProtection(): Promise<OperationResult<BranchProtection>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async removeBranchProtection(): Promise<OperationResult<void>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async listCommits(): Promise<OperationResult<ApiResponse<Commit[]>>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getCommit(): Promise<OperationResult<Commit>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getCommitChanges(): Promise<OperationResult<FileChange[]>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async listMergeRequests(owner: string, repo: string, options: MergeRequestListOptions = {}): Promise<OperationResult<ApiResponse<MergeRequest[]>>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const params: any = {
        page: options.page || 1,
        per_page: Math.min(options.perPage || this.config.defaultPerPage, this.config.maxPerPage),
        state: options.state || 'opened',
        sort: options.sort || 'created_at',
        order_by: options.sort || 'created_at'
      };

      const response = await this.client.get<GitLabMergeRequest[]>(`/projects/${projectPath}/merge_requests`, { params });
      
      const mergeRequests = response.data.map(mr => this.transformMergeRequest(mr));
      const apiResponse = this.createApiResponse(mergeRequests, response);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, `获取项目 ${owner}/${repo} 合并请求列表失败`);
    }
  }

  async getMergeRequest(owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await this.client.get<GitLabMergeRequest>(`/projects/${projectPath}/merge_requests/${id}`);
      return this.createSuccessResult(this.transformMergeRequest(response.data));
    } catch (error) {
      return this.createErrorResult(error, `获取合并请求 !${id} 信息失败`);
    }
  }

  async createMergeRequest(owner: string, repo: string, options: CreateMergeRequestOptions): Promise<OperationResult<MergeRequest>> {
    try {
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const data: any = {
        title: options.title,
        description: options.description || '',
        source_branch: options.sourceBranch,
        target_branch: options.targetBranch
      };

      const response = await this.client.post<GitLabMergeRequest>(`/projects/${projectPath}/merge_requests`, data);
      
      return this.createSuccessResult(this.transformMergeRequest(response.data));
    } catch (error) {
      return this.createErrorResult(error, '创建合并请求失败');
    }
  }

  // 其他方法的占位符实现
  async updateMergeRequest(): Promise<OperationResult<MergeRequest>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async mergeBranch(): Promise<OperationResult<MergeRequest>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async closeMergeRequest(): Promise<OperationResult<MergeRequest>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getFileContent(): Promise<OperationResult<string>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async createFile(): Promise<OperationResult<Commit>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async updateFile(): Promise<OperationResult<Commit>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async deleteFile(): Promise<OperationResult<Commit>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async searchCode(): Promise<OperationResult<ApiResponse<any[]>>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async searchCommits(): Promise<OperationResult<ApiResponse<Commit[]>>> {
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getRateLimit(): Promise<OperationResult<{ limit: number; remaining: number; reset: Date; }>> {
    // GitLab有不同的速率限制机制
    return this.createSuccessResult({
      limit: 2000,
      remaining: 2000,
      reset: new Date(Date.now() + 3600000) // 1小时后重置
    });
  }

  async checkConnection(): Promise<OperationResult<boolean>> {
    try {
      await this.client.get('/user');
      return this.createSuccessResult(true);
    } catch (error) {
      return this.createSuccessResult(false);
    }
  }

  // ==================== 数据转换方法 ====================

  private transformUser(user: GitLabUser): GitUser {
    return {
      id: user.id,
      username: user.username,
      displayName: user.name || user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      profileUrl: user.web_url
    };
  }

  private transformProject(project: GitLabProject): Repository {
    return {
      id: project.id.toString(),
      name: project.name,
      fullName: project.name_with_namespace,
      description: project.description,
      platform: GitPlatform.GITLAB,
      owner: this.transformUser(project.owner),
      permissions: {
        canRead: true, // 简化权限处理
        canWrite: true,
        canAdmin: false,
        canCreateBranch: true,
        canDeleteBranch: true,
        canMerge: true,
        canCreateMergeRequest: true
      },
      defaultBranch: project.default_branch,
      isPrivate: project.visibility === 'private',
      isFork: project.fork,
      forksCount: project.forks_count,
      starsCount: project.star_count,
      watchersCount: 0, // GitLab API不提供watchers_count
      size: 0, // 需要额外API调用获取
      language: undefined, // 需要额外API调用获取
      topics: project.topics,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
      pushedAt: new Date(project.last_activity_at),
      cloneUrl: project.http_url_to_repo,
      sshUrl: project.ssh_url_to_repo,
      webUrl: project.web_url,
      isArchived: project.archived,
      isDisabled: false,
      hasIssues: true, // GitLab项目默认启用Issues
      hasProjects: true,
      hasWiki: true,
      hasPages: false,
      hasDownloads: true
    };
  }

  private transformBranch(branch: GitLabBranch): Branch {
    return {
      name: branch.name,
      sha: branch.commit.id,
      isProtected: branch.protected,
      isDefault: branch.default,
      lastCommit: this.transformCommit(branch.commit),
      ahead: 0, // 需要额外API调用获取
      behind: 0, // 需要额外API调用获取
      status: BranchStatus.ACTIVE,
      mergeRequestsCount: 0, // 需要额外API调用获取
      updatedAt: new Date(branch.commit.committed_date)
    };
  }

  private transformCommit(commit: any): Commit {
    return {
      sha: commit.id,
      message: commit.message,
      author: {
        id: 0,
        username: commit.author_name,
        displayName: commit.author_name,
        email: commit.author_email,
        avatarUrl: '',
        profileUrl: ''
      },
      committer: {
        id: 0,
        username: commit.committer_name,
        displayName: commit.committer_name,
        email: commit.committer_email,
        avatarUrl: '',
        profileUrl: ''
      },
      timestamp: new Date(commit.committed_date),
      url: commit.web_url,
      parentShas: []
    };
  }

  private transformMergeRequest(mr: GitLabMergeRequest): MergeRequest {
    let status: MergeRequestStatus;
    if (mr.state === 'merged') {
      status = MergeRequestStatus.MERGED;
    } else if (mr.state === 'closed') {
      status = MergeRequestStatus.CLOSED;
    } else if (mr.draft) {
      status = MergeRequestStatus.DRAFT;
    } else {
      status = MergeRequestStatus.OPEN;
    }

    return {
      id: mr.id,
      number: mr.iid,
      title: mr.title,
      description: mr.description,
      state: status,
      author: this.transformUser(mr.author),
      assignees: mr.assignees.map(user => this.transformUser(user)),
      reviewers: mr.reviewers.map(user => this.transformUser(user)),
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      sourceRepository: {} as Repository, // 需要额外API调用获取
      targetRepository: {} as Repository, // 需要额外API调用获取
      commits: [], // 需要额外API调用获取
      changedFiles: parseInt(mr.changes_count) || 0,
      additions: 0, // GitLab API不直接提供
      deletions: 0, // GitLab API不直接提供
      createdAt: new Date(mr.created_at),
      updatedAt: new Date(mr.updated_at),
      mergedAt: mr.merged_at ? new Date(mr.merged_at) : undefined,
      closedAt: mr.closed_at ? new Date(mr.closed_at) : undefined,
      webUrl: mr.web_url,
      isMergeable: mr.merge_status === 'can_be_merged',
      mergeStatus: mr.merge_status as any,
      isDraft: mr.draft,
      hasConflicts: mr.has_conflicts,
      labels: mr.labels,
      milestone: mr.milestone?.title
    };
  }

  private transformFileChange(diff: any): FileChange {
    return {
      path: diff.new_path || diff.old_path,
      oldPath: diff.old_path,
      status: this.getFileStatus(diff),
      additions: 0, // GitLab diff格式不同
      deletions: 0,
      changes: 0,
      patch: diff.diff
    };
  }

  private getFileStatus(diff: any): 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' {
    if (diff.new_file) return 'added';
    if (diff.deleted_file) return 'deleted';
    if (diff.renamed_file) return 'renamed';
    return 'modified';
  }

  private createApiResponse<T>(data: T[], response: any): ApiResponse<T[]> {
    // GitLab使用不同的分页头
    const totalPages = parseInt(response.headers['x-total-pages'] || '1');
    const total = parseInt(response.headers['x-total'] || data.length.toString());
    const page = parseInt(response.headers['x-page'] || '1');
    const perPage = parseInt(response.headers['x-per-page'] || this.config.defaultPerPage.toString());
    
    return {
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}