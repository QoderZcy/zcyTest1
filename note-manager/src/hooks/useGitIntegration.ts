/**
 * useGitIntegration Hook
 * 提供Git平台集成相关的业务逻辑和认证管理
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBranchContext } from '../contexts/BranchContext';
import { gitService } from '../services/gitService';
import {
  GitPlatform,
  GitAuth,
  GitUser,
  Repository,
  GitStats,
  OperationResult
} from '../types/git';
import { 
  RepositoryListOptions,
  SearchOptions
} from '../types/gitAdapter';

export interface UseGitIntegrationReturn {
  // 认证状态
  authenticatedPlatforms: GitPlatform[];
  currentPlatform: GitPlatform | null;
  currentUser: GitUser | null;
  isAuthenticated: boolean;

  // 平台管理
  switchPlatform: (platform: GitPlatform) => void;
  authenticatePlatform: (platform: GitPlatform, token: string) => Promise<OperationResult<GitUser>>;
  disconnectPlatform: (platform: GitPlatform) => void;
  getSupportedPlatforms: () => GitPlatform[];

  // 仓库管理
  repositories: Repository[];
  currentRepository: Repository | null;
  loadRepositories: (platform?: GitPlatform) => Promise<void>;
  loadAllRepositories: () => Promise<void>;
  searchRepositories: (query: string, platform?: GitPlatform) => Promise<Repository[]>;
  selectRepository: (repository: Repository | null) => void;

  // 统计信息
  stats: GitStats | null;
  loadStats: () => Promise<void>;

  // 加载状态
  loading: {
    auth: boolean;
    repositories: boolean;
    stats: boolean;
  };

  // 错误状态
  errors: {
    auth: string | null;
    repositories: string | null;
    stats: string | null;
  };

  // 工具方法
  validateConnection: (platform: GitPlatform) => Promise<boolean>;
  clearCache: () => void;
  exportData: () => any;
  importData: (data: any) => void;
}

export const useGitIntegration = (): UseGitIntegrationReturn => {
  const {
    state,
    setCurrentPlatform,
    addAuthenticatedPlatform,
    removeAuthenticatedPlatform,
    setRepositories,
    setCurrentRepository,
    setLoading,
    addError,
    removeError
  } = useBranchContext();

  const [localLoading, setLocalLoading] = useState({
    auth: false,
    repositories: false,
    stats: false
  });

  const {
    currentPlatform,
    authenticatedPlatforms,
    currentUser,
    repositories,
    currentRepository,
    stats,
    loading: globalLoading
  } = state;

  // 获取当前用户信息
  const getCurrentUser = useCallback((): GitUser | null => {
    return currentPlatform ? currentUser[currentPlatform] || null : null;
  }, [currentPlatform, currentUser]);

  // 检查是否已认证
  const isAuthenticated = useMemo(() => {
    return currentPlatform ? authenticatedPlatforms.includes(currentPlatform) : false;
  }, [currentPlatform, authenticatedPlatforms]);

  // 切换平台
  const switchPlatform = useCallback((platform: GitPlatform) => {
    if (gitService.isPlatformSupported(platform)) {
      setCurrentPlatform(platform);
    } else {
      addError({
        code: 'UNSUPPORTED_PLATFORM',
        message: `平台 ${platform} 暂不支持`,
        timestamp: new Date()
      });
    }
  }, [setCurrentPlatform, addError]);

  // 认证平台
  const authenticatePlatform = useCallback(async (
    platform: GitPlatform, 
    token: string
  ): Promise<OperationResult<GitUser>> => {
    setLocalLoading(prev => ({ ...prev, auth: true }));
    removeError('AUTH_ERROR');

    try {
      // 设置认证信息
      const auth: GitAuth = {
        platform,
        token,
        tokenType: 'personal',
        scopes: [],
        user: {} as GitUser // 将在验证后填充
      };

      gitService.setAuth(platform, auth);

      // 验证认证信息
      const validateResult = await gitService.validateAuth(platform);
      if (!validateResult.success) {
        gitService.removeAuth(platform);
        const errorMessage = validateResult.error?.message || '认证验证失败';
        addError({
          code: 'AUTH_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform
        });
        return validateResult as OperationResult<GitUser>;
      }

      // 获取用户信息
      const userResult = await gitService.getCurrentUser(platform);
      if (!userResult.success || !userResult.data) {
        gitService.removeAuth(platform);
        const errorMessage = userResult.error?.message || '获取用户信息失败';
        addError({
          code: 'AUTH_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform
        });
        return userResult;
      }

      // 更新认证信息
      auth.user = userResult.data;
      gitService.setAuth(platform, auth);

      // 更新Context状态
      addAuthenticatedPlatform(platform, userResult.data);

      // 如果这是第一个认证的平台，则设为当前平台
      if (!currentPlatform) {
        setCurrentPlatform(platform);
      }

      return userResult;
    } catch (error) {
      console.error('Authenticate platform error:', error);
      gitService.removeAuth(platform);
      
      const errorResult = {
        success: false as const,
        error: {
          code: 'AUTH_ERROR',
          message: '认证过程中发生未知错误',
          details: error,
          timestamp: new Date(),
          platform
        }
      };

      addError(errorResult.error);
      return errorResult;
    } finally {
      setLocalLoading(prev => ({ ...prev, auth: false }));
    }
  }, [currentPlatform, setCurrentPlatform, addAuthenticatedPlatform, addError, removeError]);

  // 断开平台连接
  const disconnectPlatform = useCallback((platform: GitPlatform) => {
    gitService.removeAuth(platform);
    removeAuthenticatedPlatform(platform);
    
    // 如果断开的是当前平台，切换到其他已认证的平台
    if (currentPlatform === platform) {
      const otherPlatforms = authenticatedPlatforms.filter(p => p !== platform);
      setCurrentPlatform(otherPlatforms.length > 0 ? otherPlatforms[0] : null);
    }

    // 清除相关缓存
    gitService.clearCacheByPrefix(`repos-${platform}`);
    gitService.clearCacheByPrefix(`branches-${platform}`);
  }, [currentPlatform, authenticatedPlatforms, setCurrentPlatform, removeAuthenticatedPlatform]);

  // 获取支持的平台列表
  const getSupportedPlatforms = useCallback(() => {
    return gitService.getSupportedPlatforms();
  }, []);

  // 加载仓库列表
  const loadRepositories = useCallback(async (platform?: GitPlatform) => {
    const targetPlatform = platform || currentPlatform;
    if (!targetPlatform) {
      console.warn('No platform specified');
      return;
    }

    setLocalLoading(prev => ({ ...prev, repositories: true }));
    setLoading({ repositories: true });
    removeError('LOAD_REPOSITORIES_ERROR');

    try {
      const options: RepositoryListOptions = {
        page: 1,
        perPage: 100,
        sort: 'updated',
        order: 'desc'
      };

      const result = await gitService.listRepositories(targetPlatform, options);

      if (result.success && result.data) {
        // 如果是当前平台，更新仓库列表
        if (targetPlatform === currentPlatform) {
          setRepositories(result.data.data);
        }
      } else {
        const errorMessage = result.error?.message || '加载仓库列表失败';
        addError({
          code: 'LOAD_REPOSITORIES_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform: targetPlatform
        });
      }
    } catch (error) {
      console.error('Load repositories error:', error);
      addError({
        code: 'LOAD_REPOSITORIES_ERROR',
        message: '加载仓库列表时发生未知错误',
        details: error,
        timestamp: new Date(),
        platform: targetPlatform
      });
    } finally {
      setLocalLoading(prev => ({ ...prev, repositories: false }));
      setLoading({ repositories: false });
    }
  }, [currentPlatform, setLoading, setRepositories, addError, removeError]);

  // 加载所有平台的仓库
  const loadAllRepositories = useCallback(async () => {
    if (authenticatedPlatforms.length === 0) {
      console.warn('No authenticated platforms');
      return;
    }

    setLocalLoading(prev => ({ ...prev, repositories: true }));
    setLoading({ repositories: true });
    removeError('LOAD_REPOSITORIES_ERROR');

    try {
      const result = await gitService.listAllRepositories(authenticatedPlatforms);

      if (result.success && result.data) {
        setRepositories(result.data);
      } else {
        const errorMessage = result.error?.message || '加载仓库列表失败';
        addError({
          code: 'LOAD_REPOSITORIES_ERROR',
          message: errorMessage,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Load all repositories error:', error);
      addError({
        code: 'LOAD_REPOSITORIES_ERROR',
        message: '加载仓库列表时发生未知错误',
        details: error,
        timestamp: new Date()
      });
    } finally {
      setLocalLoading(prev => ({ ...prev, repositories: false }));
      setLoading({ repositories: false });
    }
  }, [authenticatedPlatforms, setLoading, setRepositories, addError, removeError]);

  // 搜索仓库
  const searchRepositories = useCallback(async (
    query: string, 
    platform?: GitPlatform
  ): Promise<Repository[]> => {
    const targetPlatform = platform || currentPlatform;
    if (!targetPlatform || !query.trim()) {
      return [];
    }

    try {
      const options: SearchOptions = {
        page: 1,
        perPage: 50,
        sort: 'updated',
        order: 'desc'
      };

      const result = await gitService.searchRepositories(targetPlatform, query, options);

      if (result.success && result.data) {
        return result.data.data;
      } else {
        console.error('Search repositories error:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Search repositories error:', error);
      return [];
    }
  }, [currentPlatform]);

  // 选择仓库
  const selectRepository = useCallback((repository: Repository | null) => {
    setCurrentRepository(repository);
    
    // 清除分支相关的缓存
    if (repository) {
      const [owner, repo] = repository.fullName.split('/');
      gitService.clearCacheByPrefix(`branches-${repository.platform}-${owner}-${repo}`);
    }
  }, [setCurrentRepository]);

  // 加载统计信息
  const loadStats = useCallback(async () => {
    if (authenticatedPlatforms.length === 0) {
      return;
    }

    setLocalLoading(prev => ({ ...prev, stats: true }));
    removeError('LOAD_STATS_ERROR');

    try {
      const result = await gitService.getGitStats(authenticatedPlatforms);

      if (result.success && result.data) {
        // 更新统计信息到Context
        state.stats = result.data;
      } else {
        const errorMessage = result.error?.message || '加载统计信息失败';
        addError({
          code: 'LOAD_STATS_ERROR',
          message: errorMessage,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Load stats error:', error);
      addError({
        code: 'LOAD_STATS_ERROR',
        message: '加载统计信息时发生未知错误',
        details: error,
        timestamp: new Date()
      });
    } finally {
      setLocalLoading(prev => ({ ...prev, stats: false }));
    }
  }, [authenticatedPlatforms, addError, removeError, state]);

  // 验证连接
  const validateConnection = useCallback(async (platform: GitPlatform): Promise<boolean> => {
    try {
      const result = await gitService.validateAuth(platform);
      return result.success;
    } catch (error) {
      console.error('Validate connection error:', error);
      return false;
    }
  }, []);

  // 清除缓存
  const clearCache = useCallback(() => {
    gitService.clearCache();
  }, []);

  // 导出数据
  const exportData = useCallback(() => {
    return {
      authenticatedPlatforms,
      currentPlatform,
      repositories: repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        platform: repo.platform,
        isPrivate: repo.isPrivate,
        updatedAt: repo.updatedAt
      })),
      currentRepository: currentRepository ? {
        id: currentRepository.id,
        name: currentRepository.name,
        fullName: currentRepository.fullName,
        platform: currentRepository.platform
      } : null,
      exportedAt: new Date()
    };
  }, [authenticatedPlatforms, currentPlatform, repositories, currentRepository]);

  // 导入数据
  const importData = useCallback((data: any) => {
    try {
      if (data.currentPlatform && gitService.isPlatformSupported(data.currentPlatform)) {
        setCurrentPlatform(data.currentPlatform);
      }
      
      if (data.repositories && Array.isArray(data.repositories)) {
        // 这里只导入基本信息，完整数据需要重新加载
        console.log('Import repositories:', data.repositories.length);
      }

      if (data.currentRepository) {
        console.log('Import current repository:', data.currentRepository.fullName);
      }
    } catch (error) {
      console.error('Import data error:', error);
      addError({
        code: 'IMPORT_ERROR',
        message: '导入数据时发生错误',
        details: error,
        timestamp: new Date()
      });
    }
  }, [setCurrentPlatform, addError]);

  // 错误状态计算
  const errors = useMemo(() => {
    const authErrors = state.errors.filter(err => err.code === 'AUTH_ERROR');
    const repoErrors = state.errors.filter(err => err.code === 'LOAD_REPOSITORIES_ERROR');
    const statsErrors = state.errors.filter(err => err.code === 'LOAD_STATS_ERROR');

    return {
      auth: authErrors.length > 0 ? authErrors[0].message : null,
      repositories: repoErrors.length > 0 ? repoErrors[0].message : null,
      stats: statsErrors.length > 0 ? statsErrors[0].message : null
    };
  }, [state.errors]);

  // 组合加载状态
  const loading = useMemo(() => ({
    auth: localLoading.auth,
    repositories: localLoading.repositories || globalLoading.repositories,
    stats: localLoading.stats
  }), [localLoading, globalLoading]);

  return {
    // 认证状态
    authenticatedPlatforms,
    currentPlatform,
    currentUser: getCurrentUser(),
    isAuthenticated,

    // 平台管理
    switchPlatform,
    authenticatePlatform,
    disconnectPlatform,
    getSupportedPlatforms,

    // 仓库管理
    repositories,
    currentRepository,
    loadRepositories,
    loadAllRepositories,
    searchRepositories,
    selectRepository,

    // 统计信息
    stats,
    loadStats,

    // 加载状态
    loading,

    // 错误状态
    errors,

    // 工具方法
    validateConnection,
    clearCache,
    exportData,
    importData
  };
};