/**
 * useBranchOperations Hook
 * 提供分支操作相关的高级业务逻辑
 */

import { useCallback, useMemo, useState } from 'react';
import { useBranchContext } from '../contexts/BranchContext';
import { gitService } from '../services/gitService';
import {
  Branch,
  MergeRequest,
  BranchComparison,
  BranchProtection,
  GitPlatform,
  OperationResult,
  MergeRequestStatus
} from '../types/git';
import {
  CreateMergeRequestOptions,
  UpdateMergeRequestOptions,
  MergeBranchOptions
} from '../types/gitAdapter';

export interface UseBranchOperationsReturn {
  // 分支比较
  compareBranches: (baseBranch: string, headBranch: string) => Promise<OperationResult<BranchComparison>>;
  
  // 分支保护
  getBranchProtection: (branchName: string) => Promise<OperationResult<BranchProtection>>;
  setBranchProtection: (branchName: string, protection: BranchProtection) => Promise<OperationResult<BranchProtection>>;
  removeBranchProtection: (branchName: string) => Promise<OperationResult<void>>;
  
  // 合并请求管理
  mergeRequests: MergeRequest[];
  selectedMergeRequest: MergeRequest | null;
  loadMergeRequests: () => Promise<void>;
  createMergeRequest: (options: CreateMergeRequestOptions) => Promise<OperationResult<MergeRequest>>;
  updateMergeRequest: (id: string | number, options: UpdateMergeRequestOptions) => Promise<OperationResult<MergeRequest>>;
  mergeBranch: (id: string | number, options?: MergeBranchOptions) => Promise<OperationResult<MergeRequest>>;
  closeMergeRequest: (id: string | number) => Promise<OperationResult<MergeRequest>>;
  selectMergeRequest: (mergeRequest: MergeRequest | null) => void;
  
  // 批量操作
  batchDeleteBranches: (branchNames: string[]) => Promise<{ success: string[]; failed: string[] }>;
  batchCreateBranches: (branches: Array<{ name: string; ref: string }>) => Promise<{ success: Branch[]; failed: string[] }>;
  
  // 高级操作
  syncBranchWithUpstream: (branchName: string, upstreamBranch: string) => Promise<OperationResult<void>>;
  rebaseOnto: (branchName: string, ontoBranch: string) => Promise<OperationResult<void>>;
  cherryPick: (commitSha: string, targetBranch: string) => Promise<OperationResult<void>>;
  
  // 工作流操作
  createFeatureBranch: (featureName: string, baseBranch?: string) => Promise<OperationResult<Branch>>;
  createHotfixBranch: (version: string, baseBranch?: string) => Promise<OperationResult<Branch>>;
  createReleaseBranch: (version: string, baseBranch?: string) => Promise<OperationResult<Branch>>;
  
  // 操作历史
  operationHistory: OperationHistoryItem[];
  clearOperationHistory: () => void;
  
  // 加载状态
  loading: {
    comparison: boolean;
    protection: boolean;
    mergeRequests: boolean;
    operations: boolean;
  };
  
  // 错误状态
  errors: {
    comparison: string | null;
    protection: string | null;
    mergeRequests: string | null;
    operations: string | null;
  };
}

interface OperationHistoryItem {
  id: string;
  type: 'create' | 'delete' | 'merge' | 'protect' | 'compare';
  target: string;
  result: 'success' | 'error';
  message: string;
  timestamp: Date;
}

export const useBranchOperations = (): UseBranchOperationsReturn => {
  const {
    state,
    setMergeRequests,
    setSelectedMergeRequest,
    setLoading: setGlobalLoading,
    addError,
    removeError
  } = useBranchContext();

  const [localLoading, setLocalLoading] = useState({
    comparison: false,
    protection: false,
    mergeRequests: false,
    operations: false
  });

  const [operationHistory, setOperationHistory] = useState<OperationHistoryItem[]>([]);

  const {
    currentPlatform,
    currentRepository,
    mergeRequests,
    selectedMergeRequest,
    loading: globalLoading
  } = state;

  // 添加操作历史记录
  const addOperationHistory = useCallback((item: Omit<OperationHistoryItem, 'id' | 'timestamp'>) => {
    const historyItem: OperationHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setOperationHistory(prev => [historyItem, ...prev.slice(0, 49)]); // 保留最近50条记录
  }, []);

  // 分支比较
  const compareBranches = useCallback(async (
    baseBranch: string, 
    headBranch: string
  ): Promise<OperationResult<BranchComparison>> => {
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

    setLocalLoading(prev => ({ ...prev, comparison: true }));
    removeError('COMPARISON_ERROR');

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.compareBranches(currentPlatform, owner, repo, baseBranch, headBranch);
      
      if (result.success) {
        addOperationHistory({
          type: 'compare',
          target: `${baseBranch}...${headBranch}`,
          result: 'success',
          message: `比较分支 ${baseBranch} 和 ${headBranch}`
        });
      } else {
        const errorMessage = result.error?.message || '分支比较失败';
        addError({
          code: 'COMPARISON_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        });
        
        addOperationHistory({
          type: 'compare',
          target: `${baseBranch}...${headBranch}`,
          result: 'error',
          message: errorMessage
        });
      }

      return result;
    } catch (error) {
      console.error('Compare branches error:', error);
      const errorResult = {
        success: false as const,
        error: {
          code: 'COMPARISON_ERROR',
          message: '分支比较时发生未知错误',
          details: error,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        }
      };

      addError(errorResult.error);
      addOperationHistory({
        type: 'compare',
        target: `${baseBranch}...${headBranch}`,
        result: 'error',
        message: errorResult.error.message
      });

      return errorResult;
    } finally {
      setLocalLoading(prev => ({ ...prev, comparison: false }));
    }
  }, [currentPlatform, currentRepository, addError, removeError, addOperationHistory]);

  // 获取分支保护规则
  const getBranchProtection = useCallback(async (branchName: string): Promise<OperationResult<BranchProtection>> => {
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

    setLocalLoading(prev => ({ ...prev, protection: true }));

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.getBranchProtection(currentPlatform, owner, repo, branchName);
      return result;
    } catch (error) {
      console.error('Get branch protection error:', error);
      return {
        success: false,
        error: {
          code: 'PROTECTION_ERROR',
          message: '获取分支保护规则时发生错误',
          details: error,
          timestamp: new Date()
        }
      };
    } finally {
      setLocalLoading(prev => ({ ...prev, protection: false }));
    }
  }, [currentPlatform, currentRepository]);

  // 设置分支保护规则
  const setBranchProtection = useCallback(async (
    branchName: string, 
    protection: BranchProtection
  ): Promise<OperationResult<BranchProtection>> => {
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

    setLocalLoading(prev => ({ ...prev, protection: true }));

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.setBranchProtection(currentPlatform, owner, repo, branchName, protection);
      
      if (result.success) {
        addOperationHistory({
          type: 'protect',
          target: branchName,
          result: 'success',
          message: `设置分支 ${branchName} 的保护规则`
        });
      } else {
        addOperationHistory({
          type: 'protect',
          target: branchName,
          result: 'error',
          message: result.error?.message || '设置保护规则失败'
        });
      }

      return result;
    } catch (error) {
      console.error('Set branch protection error:', error);
      const errorResult = {
        success: false as const,
        error: {
          code: 'PROTECTION_ERROR',
          message: '设置分支保护时发生错误',
          details: error,
          timestamp: new Date()
        }
      };

      addOperationHistory({
        type: 'protect',
        target: branchName,
        result: 'error',
        message: errorResult.error.message
      });

      return errorResult;
    } finally {
      setLocalLoading(prev => ({ ...prev, protection: false }));
    }
  }, [currentPlatform, currentRepository, addOperationHistory]);

  // 移除分支保护规则
  const removeBranchProtection = useCallback(async (branchName: string): Promise<OperationResult<void>> => {
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

    setLocalLoading(prev => ({ ...prev, protection: true }));

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.removeBranchProtection(currentPlatform, owner, repo, branchName);
      
      if (result.success) {
        addOperationHistory({
          type: 'protect',
          target: branchName,
          result: 'success',
          message: `移除分支 ${branchName} 的保护规则`
        });
      } else {
        addOperationHistory({
          type: 'protect',
          target: branchName,
          result: 'error',
          message: result.error?.message || '移除保护规则失败'
        });
      }

      return result;
    } catch (error) {
      console.error('Remove branch protection error:', error);
      const errorResult = {
        success: false as const,
        error: {
          code: 'PROTECTION_ERROR',
          message: '移除分支保护时发生错误',
          details: error,
          timestamp: new Date()
        }
      };

      addOperationHistory({
        type: 'protect',
        target: branchName,
        result: 'error',
        message: errorResult.error.message
      });

      return errorResult;
    } finally {
      setLocalLoading(prev => ({ ...prev, protection: false }));
    }
  }, [currentPlatform, currentRepository, addOperationHistory]);

  // 加载合并请求列表
  const loadMergeRequests = useCallback(async () => {
    if (!currentPlatform || !currentRepository) {
      return;
    }

    setLocalLoading(prev => ({ ...prev, mergeRequests: true }));
    setGlobalLoading({ mergeRequests: true });
    removeError('MERGE_REQUESTS_ERROR');

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.listMergeRequests(currentPlatform, owner, repo, {
        page: 1,
        perPage: 100,
        state: 'all'
      });

      if (result.success && result.data) {
        setMergeRequests(result.data.data);
      } else {
        const errorMessage = result.error?.message || '加载合并请求失败';
        addError({
          code: 'MERGE_REQUESTS_ERROR',
          message: errorMessage,
          timestamp: new Date(),
          platform: currentPlatform,
          repository: currentRepository.fullName
        });
      }
    } catch (error) {
      console.error('Load merge requests error:', error);
      addError({
        code: 'MERGE_REQUESTS_ERROR',
        message: '加载合并请求时发生未知错误',
        details: error,
        timestamp: new Date(),
        platform: currentPlatform,
        repository: currentRepository.fullName
      });
    } finally {
      setLocalLoading(prev => ({ ...prev, mergeRequests: false }));
      setGlobalLoading({ mergeRequests: false });
    }
  }, [currentPlatform, currentRepository, setMergeRequests, setGlobalLoading, addError, removeError]);

  // 创建合并请求
  const createMergeRequest = useCallback(async (options: CreateMergeRequestOptions): Promise<OperationResult<MergeRequest>> => {
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

    setLocalLoading(prev => ({ ...prev, operations: true }));

    try {
      const [owner, repo] = currentRepository.fullName.split('/');
      const result = await gitService.createMergeRequest(currentPlatform, owner, repo, options);
      
      if (result.success && result.data) {
        // 刷新合并请求列表
        await loadMergeRequests();
        
        addOperationHistory({
          type: 'merge',
          target: `${options.sourceBranch} → ${options.targetBranch}`,
          result: 'success',
          message: `创建合并请求: ${options.title}`
        });
      } else {
        const errorMessage = result.error?.message || '创建合并请求失败';
        addOperationHistory({
          type: 'merge',
          target: `${options.sourceBranch} → ${options.targetBranch}`,
          result: 'error',
          message: errorMessage
        });
      }

      return result;
    } catch (error) {
      console.error('Create merge request error:', error);
      const errorResult = {
        success: false as const,
        error: {
          code: 'MERGE_REQUEST_ERROR',
          message: '创建合并请求时发生未知错误',
          details: error,
          timestamp: new Date()
        }
      };

      addOperationHistory({
        type: 'merge',
        target: `${options.sourceBranch} → ${options.targetBranch}`,
        result: 'error',
        message: errorResult.error.message
      });

      return errorResult;
    } finally {
      setLocalLoading(prev => ({ ...prev, operations: false }));
    }
  }, [currentPlatform, currentRepository, loadMergeRequests, addOperationHistory]);

  // 更新合并请求
  const updateMergeRequest = useCallback(async (
    id: string | number, 
    options: UpdateMergeRequestOptions
  ): Promise<OperationResult<MergeRequest>> => {
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

    const [owner, repo] = currentRepository.fullName.split('/');
    return await gitService.updateMergeRequest(currentPlatform, owner, repo, id, options);
  }, [currentPlatform, currentRepository]);

  // 合并分支
  const mergeBranch = useCallback(async (
    id: string | number, 
    options?: MergeBranchOptions
  ): Promise<OperationResult<MergeRequest>> => {
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

    const [owner, repo] = currentRepository.fullName.split('/');
    return await gitService.mergeBranch(currentPlatform, owner, repo, id, options);
  }, [currentPlatform, currentRepository]);

  // 关闭合并请求
  const closeMergeRequest = useCallback(async (id: string | number): Promise<OperationResult<MergeRequest>> => {
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

    const [owner, repo] = currentRepository.fullName.split('/');
    return await gitService.closeMergeRequest(currentPlatform, owner, repo, id);
  }, [currentPlatform, currentRepository]);

  // 选择合并请求
  const selectMergeRequest = useCallback((mergeRequest: MergeRequest | null) => {
    setSelectedMergeRequest(mergeRequest);
  }, [setSelectedMergeRequest]);

  // 批量删除分支
  const batchDeleteBranches = useCallback(async (branchNames: string[]): Promise<{ success: string[]; failed: string[] }> => {
    if (!currentPlatform || !currentRepository) {
      return { success: [], failed: branchNames };
    }

    setLocalLoading(prev => ({ ...prev, operations: true }));

    const results = { success: [] as string[], failed: [] as string[] };

    for (const branchName of branchNames) {
      try {
        const [owner, repo] = currentRepository.fullName.split('/');
        const result = await gitService.deleteBranch(currentPlatform, owner, repo, branchName);
        
        if (result.success) {
          results.success.push(branchName);
        } else {
          results.failed.push(branchName);
        }
      } catch (error) {
        results.failed.push(branchName);
      }
    }

    setLocalLoading(prev => ({ ...prev, operations: false }));

    addOperationHistory({
      type: 'delete',
      target: `${results.success.length + results.failed.length} branches`,
      result: results.failed.length === 0 ? 'success' : 'error',
      message: `批量删除分支: ${results.success.length} 成功, ${results.failed.length} 失败`
    });

    return results;
  }, [currentPlatform, currentRepository, addOperationHistory]);

  // 批量创建分支
  const batchCreateBranches = useCallback(async (
    branches: Array<{ name: string; ref: string }>
  ): Promise<{ success: Branch[]; failed: string[] }> => {
    if (!currentPlatform || !currentRepository) {
      return { success: [], failed: branches.map(b => b.name) };
    }

    setLocalLoading(prev => ({ ...prev, operations: true }));

    const results = { success: [] as Branch[], failed: [] as string[] };

    for (const branch of branches) {
      try {
        const [owner, repo] = currentRepository.fullName.split('/');
        const result = await gitService.createBranch(currentPlatform, owner, repo, {
          name: branch.name,
          ref: branch.ref
        });
        
        if (result.success && result.data) {
          results.success.push(result.data);
        } else {
          results.failed.push(branch.name);
        }
      } catch (error) {
        results.failed.push(branch.name);
      }
    }

    setLocalLoading(prev => ({ ...prev, operations: false }));

    addOperationHistory({
      type: 'create',
      target: `${results.success.length + results.failed.length} branches`,
      result: results.failed.length === 0 ? 'success' : 'error',
      message: `批量创建分支: ${results.success.length} 成功, ${results.failed.length} 失败`
    });

    return results;
  }, [currentPlatform, currentRepository, addOperationHistory]);

  // 创建功能分支
  const createFeatureBranch = useCallback(async (
    featureName: string, 
    baseBranch = 'main'
  ): Promise<OperationResult<Branch>> => {
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

    const branchName = `feature/${featureName}`;
    const [owner, repo] = currentRepository.fullName.split('/');
    
    return await gitService.createBranch(currentPlatform, owner, repo, {
      name: branchName,
      ref: baseBranch
    });
  }, [currentPlatform, currentRepository]);

  // 创建热修复分支
  const createHotfixBranch = useCallback(async (
    version: string, 
    baseBranch = 'main'
  ): Promise<OperationResult<Branch>> => {
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

    const branchName = `hotfix/${version}`;
    const [owner, repo] = currentRepository.fullName.split('/');
    
    return await gitService.createBranch(currentPlatform, owner, repo, {
      name: branchName,
      ref: baseBranch
    });
  }, [currentPlatform, currentRepository]);

  // 创建发布分支
  const createReleaseBranch = useCallback(async (
    version: string, 
    baseBranch = 'develop'
  ): Promise<OperationResult<Branch>> => {
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

    const branchName = `release/${version}`;
    const [owner, repo] = currentRepository.fullName.split('/');
    
    return await gitService.createBranch(currentPlatform, owner, repo, {
      name: branchName,
      ref: baseBranch
    });
  }, [currentPlatform, currentRepository]);

  // 占位符实现的高级操作
  const syncBranchWithUpstream = useCallback(async (): Promise<OperationResult<void>> => {
    return { success: false, error: { code: 'NOT_IMPLEMENTED', message: '功能开发中', timestamp: new Date() } };
  }, []);

  const rebaseOnto = useCallback(async (): Promise<OperationResult<void>> => {
    return { success: false, error: { code: 'NOT_IMPLEMENTED', message: '功能开发中', timestamp: new Date() } };
  }, []);

  const cherryPick = useCallback(async (): Promise<OperationResult<void>> => {
    return { success: false, error: { code: 'NOT_IMPLEMENTED', message: '功能开发中', timestamp: new Date() } };
  }, []);

  // 清理操作历史
  const clearOperationHistory = useCallback(() => {
    setOperationHistory([]);
  }, []);

  // 组合加载状态
  const loading = useMemo(() => ({
    comparison: localLoading.comparison,
    protection: localLoading.protection,
    mergeRequests: localLoading.mergeRequests || globalLoading.mergeRequests,
    operations: localLoading.operations
  }), [localLoading, globalLoading]);

  // 组合错误状态
  const errors = useMemo(() => {
    const comparisonErrors = state.errors.filter(err => err.code === 'COMPARISON_ERROR');
    const protectionErrors = state.errors.filter(err => err.code === 'PROTECTION_ERROR');
    const mergeRequestErrors = state.errors.filter(err => err.code === 'MERGE_REQUESTS_ERROR');
    const operationErrors = state.errors.filter(err => err.code.includes('OPERATION'));

    return {
      comparison: comparisonErrors.length > 0 ? comparisonErrors[0].message : null,
      protection: protectionErrors.length > 0 ? protectionErrors[0].message : null,
      mergeRequests: mergeRequestErrors.length > 0 ? mergeRequestErrors[0].message : null,
      operations: operationErrors.length > 0 ? operationErrors[0].message : null
    };
  }, [state.errors]);

  return {
    // 分支比较
    compareBranches,
    
    // 分支保护
    getBranchProtection,
    setBranchProtection,
    removeBranchProtection,
    
    // 合并请求管理
    mergeRequests,
    selectedMergeRequest,
    loadMergeRequests,
    createMergeRequest,
    updateMergeRequest,
    mergeBranch,
    closeMergeRequest,
    selectMergeRequest,
    
    // 批量操作
    batchDeleteBranches,
    batchCreateBranches,
    
    // 高级操作
    syncBranchWithUpstream,
    rebaseOnto,
    cherryPick,
    
    // 工作流操作
    createFeatureBranch,
    createHotfixBranch,
    createReleaseBranch,
    
    // 操作历史
    operationHistory,
    clearOperationHistory,
    
    // 加载状态
    loading,
    
    // 错误状态
    errors
  };
};