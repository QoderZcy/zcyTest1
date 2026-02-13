/**
 * useBranches Hook
 * 提供分支管理相关的业务逻辑和数据操作
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useBranchContext } from '../contexts/BranchContext';
import { gitService } from '../services/gitService';
import {
  Branch,
  BranchFilter,
  BranchStatus,
  Repository,  
  GitPlatform,
  OperationResult
} from '../types/git';
import { 
  CreateBranchOptions,
  BranchListOptions
} from '../types/gitAdapter';

export interface UseBranchesReturn {
  // 数据状态
  branches: Branch[];
  selectedBranch: Branch | null;
  filteredBranches: Branch[];
  branchFilter: BranchFilter;
  loading: boolean;
  error: string | null;

  // 数据操作
  loadBranches: () => Promise<void>;
  refreshBranches: () => Promise<void>;
  createBranch: (options: CreateBranchOptions) => Promise<OperationResult<Branch>>;
  deleteBranch: (branchName: string) => Promise<OperationResult<void>>;
  
  // 选择和筛选
  selectBranch: (branch: Branch | null) => void;
  setFilter: (filter: Partial<BranchFilter>) => void;
  clearFilter: () => void;
  
  // 工具方法
  getBranchByName: (name: string) => Branch | undefined;
  getDefaultBranch: () => Branch | undefined;
  getProtectedBranches: () => Branch[];
  getActiveBranches: () => Branch[];
  getStaleBranches: () => Branch[];
  
  // 统计信息
  branchStats: {
    total: number;
    active: number;
    stale: number;
    protected: number;
    merged: number;
  };
}

export const useBranches = (): UseBranchesReturn => {
  const {
    state,
    setBranches,
    setSelectedBranch,
    setBranchFilter,
    setLoading,
    addError,
    removeError
  } = useBranchContext();

  const {
    branches,
    selectedBranch,
    branchFilter,
    currentRepository,
    currentPlatform,
    loading: { branches: loading }
  } = state;

  // 加载分支列表
  const loadBranches = useCallback(async () => {
    if (!currentPlatform || !currentRepository) {
      console.warn('No platform or repository selected');
      return;
    }

    setLoading({ branches: true });
    removeError('LOAD_BRANCHES_ERROR');

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const options: BranchListOptions = {
        page: 1,
        perPage: 100 // 获取更多分支
      };

      const result = await gitService.listBranches(currentPlatform, owner, repo, options);
      
      if (result.success && result.data) {
        setBranches(result.data.data);
      } else {
        const errorMessage = result.error?.message || '加载分支列表失败';
        addError({
          code: 'LOAD_BRANCHES_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        });
      }
    } catch (error) {
      console.error('Load branches error:', error);
      addError({
        code: 'LOAD_BRANCHES_ERROR',
        message: '加载分支列表时发生未知错误',
        details: error,
        timestamp: new Date(),
        platform: currentPlatform,
        repository: currentRepository.fullName
      });
    } finally {
      setLoading({ branches: false });
    }
  }, [currentPlatform, currentRepository, setLoading, setBranches, addError, removeError]);

  // 刷新分支列表
  const refreshBranches = useCallback(async () => {
    // 清除缓存并重新加载
    if (currentPlatform && currentRepository) {
      const [owner, repo] = currentRepository.fullName.split('/');
      gitService.clearCacheByPrefix(`branches-${currentPlatform}-${owner}-${repo}`);
    }
    await loadBranches();
  }, [loadBranches, currentPlatform, currentRepository]);

  // 创建分支
  const createBranch = useCallback(async (options: CreateBranchOptions): Promise<OperationResult<Branch>> => {
    if (!currentPlatform || !currentRepository) {
      return {
        success: false,
        error: {
          code: 'NO_REPOSITORY',
          message: '请先选择一个仓库',
          timestamp: new Date()
        }
      };
    }

    setLoading({ branches: true });
    removeError('CREATE_BRANCH_ERROR');

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.createBranch(currentPlatform, owner, repo, options);
      
      if (result.success && result.data) {
        // 刷新分支列表
        await loadBranches();
        
        // 自动选择新创建的分支
        setSelectedBranch(result.data);
        
        return result;
      } else {
        const errorMessage = result.error?.message || '创建分支失败';
        addError({
          code: 'CREATE_BRANCH_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        });
        return result;
      }
    } catch (error) {
      console.error('Create branch error:', error);
      const errorResult = {
        success: false as const,
        error: {
          code: 'CREATE_BRANCH_ERROR',
          message: '创建分支时发生未知错误',
          details: error,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        }
      };
      
      addError(errorResult.error);
      return errorResult;
    } finally {
      setLoading({ branches: false });
    }
  }, [currentPlatform, currentRepository, setLoading, addError, removeError, loadBranches, setSelectedBranch]);

  // 删除分支
  const deleteBranch = useCallback(async (branchName: string): Promise<OperationResult<void>> => {
    if (!currentPlatform || !currentRepository) {
      return {
        success: false,
        error: {
          code: 'NO_REPOSITORY',
          message: '请先选择一个仓库',
          timestamp: new Date()
        }
      };
    }

    const branch = branches.find(b => b.name === branchName);
    if (!branch) {
      return {
        success: false,
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: `分支 ${branchName} 不存在`,
          timestamp: new Date()
        }
      };
    }

    if (branch.isDefault) {
      return {
        success: false,
        error: {
          code: 'CANNOT_DELETE_DEFAULT_BRANCH',
          message: '不能删除默认分支',
          timestamp: new Date()
        }
      };
    }

    setLoading({ branches: true });
    removeError('DELETE_BRANCH_ERROR');

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.deleteBranch(currentPlatform, owner, repo, branchName);
      
      if (result.success) {
        // 刷新分支列表
        await loadBranches();
        
        // 如果删除的是当前选中的分支，则清除选择
        if (selectedBranch?.name === branchName) {
          setSelectedBranch(null);
        }
        
        return result;
      } else {
        const errorMessage = result.error?.message || '删除分支失败';
        addError({
          code: 'DELETE_BRANCH_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        });
        return result;
      }
    } catch (error) {
      console.error('Delete branch error:', error);
      const errorResult = {
        success: false as const,
        error: {
          code: 'DELETE_BRANCH_ERROR',
          message: '删除分支时发生未知错误',
          details: error,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        }
      };
      
      addError(errorResult.error);
      return errorResult;
    } finally {
      setLoading({ branches: false });
    }
  }, [currentPlatform, currentRepository, branches, selectedBranch, setLoading, addError, removeError, loadBranches, setSelectedBranch]);

  // 选择分支
  const selectBranch = useCallback((branch: Branch | null) => {
    setSelectedBranch(branch);
  }, [setSelectedBranch]);

  // 设置筛选条件
  const setFilter = useCallback((filter: Partial<BranchFilter>) => {
    setBranchFilter(filter);
  }, [setBranchFilter]);

  // 清除筛选条件
  const clearFilter = useCallback(() => {
    setBranchFilter({
      search: '',
      status: [],
      author: [],
      sortBy: 'updated',
      sortOrder: 'desc'
    });
  }, [setBranchFilter]);

  // 筛选后的分支列表
  const filteredBranches = useMemo(() => {
    let filtered = [...branches];

    // 搜索筛选
    if (branchFilter.search) {
      const searchLower = branchFilter.search.toLowerCase();
      filtered = filtered.filter(branch => 
        branch.name.toLowerCase().includes(searchLower) ||
        branch.lastCommit.message.toLowerCase().includes(searchLower) ||
        branch.lastCommit.author.username.toLowerCase().includes(searchLower)
      );
    }

    // 状态筛选
    if (branchFilter.status.length > 0) {
      filtered = filtered.filter(branch => branchFilter.status.includes(branch.status));
    }

    // 作者筛选
    if (branchFilter.author.length > 0) {
      filtered = filtered.filter(branch => 
        branchFilter.author.includes(branch.lastCommit.author.username)
      );
    }

    // 保护状态筛选
    if (branchFilter.protected !== undefined) {
      filtered = filtered.filter(branch => branch.isProtected === branchFilter.protected);
    }

    // 合并状态筛选
    if (branchFilter.merged !== undefined) {
      filtered = filtered.filter(branch => 
        (branch.status === BranchStatus.MERGED) === branchFilter.merged
      );
    }

    // 日期范围筛选
    if (branchFilter.dateRange) {
      const { start, end } = branchFilter.dateRange;
      filtered = filtered.filter(branch => {
        const branchDate = branch.updatedAt;
        return branchDate >= start && branchDate <= end;
      });
    }

    // 排序
    const { sortBy, sortOrder } = branchFilter;
    filtered.sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'updated':
          result = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'created':
          result = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
          break;
        case 'commits':
          result = a.ahead - b.ahead;
          break;
        default:
          result = 0;
      }
      
      return sortOrder === 'desc' ? -result : result;
    });

    return filtered;
  }, [branches, branchFilter]);

  // 工具方法
  const getBranchByName = useCallback((name: string) => {
    return branches.find(branch => branch.name === name);
  }, [branches]);

  const getDefaultBranch = useCallback(() => {
    return branches.find(branch => branch.isDefault);
  }, [branches]);

  const getProtectedBranches = useCallback(() => {
    return branches.filter(branch => branch.isProtected);
  }, [branches]);

  const getActiveBranches = useCallback(() => {
    return branches.filter(branch => branch.status === BranchStatus.ACTIVE);
  }, [branches]);

  const getStaleBranches = useCallback(() => {
    return branches.filter(branch => branch.status === BranchStatus.STALE);
  }, [branches]);

  // 统计信息
  const branchStats = useMemo(() => {
    return {
      total: branches.length,
      active: branches.filter(b => b.status === BranchStatus.ACTIVE).length,
      stale: branches.filter(b => b.status === BranchStatus.STALE).length,
      protected: branches.filter(b => b.isProtected).length,
      merged: branches.filter(b => b.status === BranchStatus.MERGED).length,
    };
  }, [branches]);

  // 获取当前错误信息
  const error = useMemo(() => {
    const branchErrors = state.errors.filter(err => 
      err.code.includes('BRANCH') || err.code.includes('LOAD_BRANCHES')
    );
    return branchErrors.length > 0 ? branchErrors[0].message : null;
  }, [state.errors]);

  // 自动加载分支数据
  useEffect(() => {
    if (currentRepository && currentPlatform && branches.length === 0 && !loading) {
      loadBranches();
    }
  }, [currentRepository, currentPlatform, branches.length, loading, loadBranches]);

  return {
    // 数据状态
    branches,
    selectedBranch,
    filteredBranches,
    branchFilter,
    loading,
    error,

    // 数据操作
    loadBranches,
    refreshBranches,
    createBranch,
    deleteBranch,

    // 选择和筛选
    selectBranch,
    setFilter,
    clearFilter,

    // 工具方法
    getBranchByName,
    getDefaultBranch,
    getProtectedBranches,
    getActiveBranches,
    getStaleBranches,

    // 统计信息
    branchStats
  };
};