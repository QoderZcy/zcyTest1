/**
 * GitHub API适配器实现
 * 基于GitHub REST API v4实现GitPlatformAdapter接口
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
  MergeRequestStatus,
  Permission
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

// GitHub API响应类型定义
interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email?: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  owner: GitHubUser;
  private: boolean;
  fork: boolean;
  forks_count: number;
  stargazers_count: number;
  watchers_count: number;
  size: number;
  language?: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  archived: boolean;
  disabled: boolean;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_downloads: boolean;
  default_branch: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    commit: {
      author: {
        name: string;
        email: string;
        date: string;
      };
      committer: {
        name: string;
        email: string;
        date: string;
      };
      message: string;
    };
    author: GitHubUser;
    committer: GitHubUser;
    html_url: string;
  };
  protected: boolean;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  user: GitHubUser;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  head: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  base: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  merged: boolean;
  mergeable: boolean;
  mergeable_state: string;
  draft: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  milestone?: { title: string };
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: GitHubUser;
  committer: GitHubUser;
  html_url: string;
  parents: Array<{ sha: string }>;
}

export class GitHubAdapter extends BaseGitPlatformAdapter {
  readonly platform = GitPlatform.GITHUB;
  readonly config: PlatformConfig;
  private client: AxiosInstance;

  constructor(config?: Partial<PlatformConfig>) {
    super();
    
    this.config = {
      platform: GitPlatform.GITHUB,
      baseUrl: 'https://api.github.com',
      apiVersion: 'v3',
      defaultPerPage: 30,
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
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'note-manager-branch-management'
      }
    });

    // 请求拦截器
    this.client.interceptors.request.use((config) => {
      if (this.auth?.token) {
        config.headers.Authorization = `token ${this.auth.token}`;
      }
      return config;
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[GitHub API Error]', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ==================== 认证相关 ====================

  async getCurrentUser(): Promise<OperationResult<GitUser>> {
    try {
      const response = await this.client.get<GitHubUser>('/user');
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
        affiliation: options.affiliation || 'owner,collaborator,organization_member',
        type: options.type || 'all',
        sort: options.sort || 'updated',
        direction: options.order || 'desc'
      };

      const response = await this.client.get<GitHubRepository[]>('/user/repos', { params });
      
      const repositories = response.data.map(repo => this.transformRepository(repo));
      const apiResponse = this.createApiResponse(repositories, response);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, '获取仓库列表失败');
    }
  }

  async getRepository(owner: string, repo: string): Promise<OperationResult<Repository>> {
    try {
      const response = await this.client.get<GitHubRepository>(`/repos/${owner}/${repo}`);
      return this.createSuccessResult(this.transformRepository(response.data));
    } catch (error) {
      return this.createErrorResult(error, `获取仓库 ${owner}/${repo} 信息失败`);
    }
  }

  async searchRepositories(query: string, options: SearchOptions = {}): Promise<OperationResult<ApiResponse<Repository[]>>> {
    try {
      const params = {
        q: query,
        page: options.page || 1,
        per_page: Math.min(options.perPage || this.config.defaultPerPage, this.config.maxPerPage),
        sort: options.sort || 'updated',
        order: options.order || 'desc'
      };

      const response = await this.client.get<{
        total_count: number;
        incomplete_results: boolean;
        items: GitHubRepository[];
      }>('/search/repositories', { params });

      const repositories = response.data.items.map(repo => this.transformRepository(repo));
      const apiResponse = this.createSearchApiResponse(repositories, response.data, params);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, '搜索仓库失败');
    }
  }

  // ==================== 分支管理 ====================

  async listBranches(owner: string, repo: string, options: BranchListOptions = {}): Promise<OperationResult<ApiResponse<Branch[]>>> {
    try {
      const params = {
        page: options.page || 1,
        per_page: Math.min(options.perPage || this.config.defaultPerPage, this.config.maxPerPage),
        ...(options.protected !== undefined && { protected: options.protected })
      };

      const response = await this.client.get<GitHubBranch[]>(`/repos/${owner}/${repo}/branches`, { params });
      
      // 获取默认分支信息
      const repoInfo = await this.client.get<GitHubRepository>(`/repos/${owner}/${repo}`);
      const defaultBranch = repoInfo.data.default_branch;

      const branches = await Promise.all(
        response.data.map(async (branch) => 
          this.transformBranch(branch, defaultBranch, owner, repo)
        )
      );
      
      const apiResponse = this.createApiResponse(branches, response);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, `获取仓库 ${owner}/${repo} 分支列表失败`);
    }
  }

  async getBranch(owner: string, repo: string, branch: string): Promise<OperationResult<Branch>> {
    try {
      const response = await this.client.get<GitHubBranch>(`/repos/${owner}/${repo}/branches/${branch}`);
      
      // 获取默认分支信息
      const repoInfo = await this.client.get<GitHubRepository>(`/repos/${owner}/${repo}`);
      const defaultBranch = repoInfo.data.default_branch;

      const transformedBranch = await this.transformBranch(response.data, defaultBranch, owner, repo);
      
      return this.createSuccessResult(transformedBranch);
    } catch (error) {
      return this.createErrorResult(error, `获取分支 ${branch} 信息失败`);
    }
  }

  async createBranch(owner: string, repo: string, options: CreateBranchOptions): Promise<OperationResult<Branch>> {
    try {
      // 创建引用
      await this.client.post(`/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${options.name}`,
        sha: options.ref
      });

      // 获取新创建的分支
      return await this.getBranch(owner, repo, options.name);
    } catch (error) {
      return this.createErrorResult(error, `创建分支 ${options.name} 失败`);
    }
  }

  async deleteBranch(owner: string, repo: string, branch: string): Promise<OperationResult<void>> {
    try {
      await this.client.delete(`/repos/${owner}/${repo}/git/refs/heads/${branch}`);
      return this.createSuccessResult(undefined, `分支 ${branch} 删除成功`);
    } catch (error) {
      return this.createErrorResult(error, `删除分支 ${branch} 失败`);
    }
  }

  async compareBranches(owner: string, repo: string, base: string, head: string): Promise<OperationResult<BranchComparison>> {
    try {
      const response = await this.client.get<{
        status: string;
        ahead_by: number;
        behind_by: number;
        total_commits: number;
        commits: GitHubCommit[];
        files: Array<{
          filename: string;
          previous_filename?: string;
          status: string;
          additions: number;
          deletions: number;
          changes: number;
          patch?: string;
          blob_url?: string;
        }>;
        merge_base_commit: GitHubCommit;
      }>(`/repos/${owner}/${repo}/compare/${base}...${head}`);

      const comparison: BranchComparison = {
        baseBranch: base,
        headBranch: head,
        aheadBy: response.data.ahead_by,
        behindBy: response.data.behind_by,
        totalCommits: response.data.total_commits,
        commits: response.data.commits.map(commit => this.transformCommit(commit)),
        files: response.data.files.map(file => this.transformFileChange(file)),
        mergeable: response.data.status !== 'diverged',
        mergeBase: response.data.merge_base_commit.sha
      };

      return this.createSuccessResult(comparison);
    } catch (error) {
      return this.createErrorResult(error, `比较分支 ${base}...${head} 失败`);
    }
  }

  // ==================== 其他方法的简化实现 ====================

  async getBranchProtection(owner: string, repo: string, branch: string): Promise<OperationResult<BranchProtection>> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/branches/${branch}/protection`);
      // 转换保护规则格式
      const protection: BranchProtection = {
        enabled: true,
        // 简化的保护规则转换
      };
      return this.createSuccessResult(protection);
    } catch (error) {
      if (error.response?.status === 404) {
        return this.createSuccessResult({ enabled: false });
      }
      return this.createErrorResult(error, `获取分支 ${branch} 保护规则失败`);
    }
  }

  async setBranchProtection(owner: string, repo: string, branch: string, protection: BranchProtection): Promise<OperationResult<BranchProtection>> {
    // 实现设置分支保护规则
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async removeBranchProtection(owner: string, repo: string, branch: string): Promise<OperationResult<void>> {
    // 实现删除分支保护规则
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async listCommits(owner: string, repo: string, options: CommitListOptions = {}): Promise<OperationResult<ApiResponse<Commit[]>>> {
    // 实现获取提交列表
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getCommit(owner: string, repo: string, sha: string): Promise<OperationResult<Commit>> {
    // 实现获取单个提交
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getCommitChanges(owner: string, repo: string, sha: string): Promise<OperationResult<FileChange[]>> {
    // 实现获取提交变更
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async listMergeRequests(owner: string, repo: string, options: MergeRequestListOptions = {}): Promise<OperationResult<ApiResponse<MergeRequest[]>>> {
    try {
      const params: any = {
        page: options.page || 1,
        per_page: Math.min(options.perPage || this.config.defaultPerPage, this.config.maxPerPage),
        state: options.state || 'open',
        sort: options.sort || 'created',
        direction: options.order || 'desc'
      };

      const response = await this.client.get<GitHubPullRequest[]>(`/repos/${owner}/${repo}/pulls`, { params });
      
      const mergeRequests = response.data.map(pr => this.transformPullRequest(pr));
      const apiResponse = this.createApiResponse(mergeRequests, response);
      
      return this.createSuccessResult(apiResponse);
    } catch (error) {
      return this.createErrorResult(error, `获取仓库 ${owner}/${repo} 合并请求列表失败`);
    }
  }

  async getMergeRequest(owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>> {
    try {
      const response = await this.client.get<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls/${id}`);
      return this.createSuccessResult(this.transformPullRequest(response.data));
    } catch (error) {
      return this.createErrorResult(error, `获取合并请求 #${id} 信息失败`);
    }
  }

  async createMergeRequest(owner: string, repo: string, options: CreateMergeRequestOptions): Promise<OperationResult<MergeRequest>> {
    try {
      const data: any = {
        title: options.title,
        body: options.description || '',
        head: options.sourceBranch,
        base: options.targetBranch,
        draft: options.isDraft || false
      };

      const response = await this.client.post<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls`, data);
      
      return this.createSuccessResult(this.transformPullRequest(response.data));
    } catch (error) {
      return this.createErrorResult(error, '创建合并请求失败');
    }
  }

  async updateMergeRequest(owner: string, repo: string, id: string | number, options: UpdateMergeRequestOptions): Promise<OperationResult<MergeRequest>> {
    // 实现更新合并请求
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async mergeBranch(owner: string, repo: string, id: string | number, options: MergeBranchOptions = {}): Promise<OperationResult<MergeRequest>> {
    // 实现合并分支
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async closeMergeRequest(owner: string, repo: string, id: string | number): Promise<OperationResult<MergeRequest>> {
    // 实现关闭合并请求
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getFileContent(owner: string, repo: string, path: string, options: GetFileContentOptions = {}): Promise<OperationResult<string>> {
    // 实现获取文件内容
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async createFile(owner: string, repo: string, path: string, options: FileOperationOptions): Promise<OperationResult<Commit>> {
    // 实现创建文件
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async updateFile(owner: string, repo: string, path: string, options: FileOperationOptions & { sha: string }): Promise<OperationResult<Commit>> {
    // 实现更新文件
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async deleteFile(owner: string, repo: string, path: string, options: Pick<FileOperationOptions, 'message' | 'branch' | 'authorName' | 'authorEmail'> & { sha: string }): Promise<OperationResult<Commit>> {
    // 实现删除文件
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async searchCode(query: string, options: SearchOptions = {}): Promise<OperationResult<ApiResponse<any[]>>> {
    // 实现搜索代码
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async searchCommits(query: string, options: SearchOptions = {}): Promise<OperationResult<ApiResponse<Commit[]>>> {
    // 实现搜索提交
    return this.createErrorResult(new Error('Not implemented'), '功能开发中');
  }

  async getRateLimit(): Promise<OperationResult<{ limit: number; remaining: number; reset: Date; }>> {
    try {
      const response = await this.client.get('/rate_limit');
      
      const rateLimit = {
        limit: response.data.rate.limit,
        remaining: response.data.rate.remaining,
        reset: new Date(response.data.rate.reset * 1000)
      };

      return this.createSuccessResult(rateLimit);
    } catch (error) {
      return this.createErrorResult(error, '获取API速率限制信息失败');
    }
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

  private transformUser(user: GitHubUser): GitUser {
    return {
      id: user.id,
      username: user.login,
      displayName: user.name || user.login,
      email: user.email,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url
    };
  }

  private transformRepository(repo: GitHubRepository): Repository {
    const permissions: any = repo.permissions || {};
    
    return {
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      platform: GitPlatform.GITHUB,
      owner: this.transformUser(repo.owner),
      permissions: {
        canRead: permissions.pull || false,
        canWrite: permissions.push || false,
        canAdmin: permissions.admin || false,
        canCreateBranch: permissions.push || false,
        canDeleteBranch: permissions.push || false,
        canMerge: permissions.push || false,
        canCreateMergeRequest: permissions.pull || false
      },
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      isFork: repo.fork,
      forksCount: repo.forks_count,
      starsCount: repo.stargazers_count,
      watchersCount: repo.watchers_count,
      size: repo.size,
      language: repo.language,
      topics: repo.topics,
      createdAt: new Date(repo.created_at),
      updatedAt: new Date(repo.updated_at),
      pushedAt: new Date(repo.pushed_at),
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      webUrl: repo.html_url,
      isArchived: repo.archived,
      isDisabled: repo.disabled,
      hasIssues: repo.has_issues,
      hasProjects: repo.has_projects,
      hasWiki: repo.has_wiki,
      hasPages: repo.has_pages,
      hasDownloads: repo.has_downloads
    };
  }

  private async transformBranch(branch: GitHubBranch, defaultBranch: string, owner: string, repo: string): Promise<Branch> {
    return {
      name: branch.name,
      sha: branch.commit.sha,
      isProtected: branch.protected,
      isDefault: branch.name === defaultBranch,
      lastCommit: this.transformCommit(branch.commit),
      ahead: 0, // 需要额外API调用获取
      behind: 0, // 需要额外API调用获取
      status: BranchStatus.ACTIVE,
      mergeRequestsCount: 0, // 需要额外API调用获取
      updatedAt: new Date(branch.commit.commit.committer.date)
    };
  }

  private transformCommit(commit: GitHubCommit): Commit {
    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: this.transformUser(commit.author || {
        id: 0,
        login: commit.commit.author.name,
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        avatar_url: '',
        html_url: ''
      }),
      committer: this.transformUser(commit.committer || {
        id: 0,
        login: commit.commit.committer.name,
        name: commit.commit.committer.name,
        email: commit.commit.committer.email,
        avatar_url: '',
        html_url: ''
      }),
      timestamp: new Date(commit.commit.author.date),
      url: commit.html_url,
      parentShas: commit.parents?.map(p => p.sha)
    };
  }

  private transformPullRequest(pr: GitHubPullRequest): MergeRequest {
    let status: MergeRequestStatus;
    if (pr.merged) {
      status = MergeRequestStatus.MERGED;
    } else if (pr.state === 'closed') {
      status = MergeRequestStatus.CLOSED;
    } else if (pr.draft) {
      status = MergeRequestStatus.DRAFT;
    } else {
      status = MergeRequestStatus.OPEN;
    }

    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      description: pr.body,
      state: status,
      author: this.transformUser(pr.user),
      assignees: pr.assignees.map(user => this.transformUser(user)),
      reviewers: pr.requested_reviewers.map(user => this.transformUser(user)),
      sourceBranch: pr.head.ref,
      targetBranch: pr.base.ref,
      sourceRepository: this.transformRepository(pr.head.repo),
      targetRepository: this.transformRepository(pr.base.repo),
      commits: [], // 需要额外API调用获取
      changedFiles: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
      closedAt: pr.closed_at ? new Date(pr.closed_at) : undefined,
      webUrl: pr.html_url,
      isMergeable: pr.mergeable,
      mergeStatus: pr.mergeable_state as any,
      isDraft: pr.draft,
      hasConflicts: pr.mergeable_state === 'dirty',
      labels: pr.labels.map(label => label.name),
      milestone: pr.milestone?.title
    };
  }

  private transformFileChange(file: any): FileChange {
    return {
      path: file.filename,
      oldPath: file.previous_filename,
      status: file.status as any,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
      blobUrl: file.blob_url
    };
  }

  private createApiResponse<T>(data: T[], response: AxiosResponse): ApiResponse<T[]> {
    const linkHeader = response.headers.link;
    const pagination = this.parseLinkHeader(linkHeader);
    
    return {
      data,
      pagination,
      rateLimit: {
        limit: parseInt(response.headers['x-ratelimit-limit'] || '0'),
        remaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
        reset: new Date(parseInt(response.headers['x-ratelimit-reset'] || '0') * 1000)
      }
    };
  }

  private createSearchApiResponse<T>(data: T[], searchResult: any, params: any): ApiResponse<T[]> {
    const page = params.page || 1;
    const perPage = params.per_page || this.config.defaultPerPage;
    const total = searchResult.total_count;
    const totalPages = Math.ceil(total / perPage);
    
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

  private parseLinkHeader(linkHeader?: string): any {
    if (!linkHeader) return undefined;
    
    const links: any = {};
    const parts = linkHeader.split(',');
    
    parts.forEach(part => {
      const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match) {
        const url = new URL(match[1]);
        const page = parseInt(url.searchParams.get('page') || '1');
        links[match[2]] = page;
      }
    });
    
    return {
      page: links.prev ? links.prev + 1 : 1,
      perPage: this.config.defaultPerPage,
      total: 0, // GitHub不在Link header中提供总数
      totalPages: 0,
      hasNext: !!links.next,
      hasPrev: !!links.prev
    };
  }
}