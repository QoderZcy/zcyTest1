/**
 * 分支管理状态管理Context
 * 提供分支管理相关的全局状态管理
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  Repository,
  Branch,
  MergeRequest,
  GitUser,
  GitPlatform,
  GitStats,
  BranchFilter,
  LoadingState,
  GitError,
  GitAuth
} from '../types/git';
import { gitService } from '../services/gitService';

// 分支管理状态接口
export interface BranchState {
  // 当前选中的平台
  currentPlatform: GitPlatform | null;
  
  // 仓库相关状态
  repositories: Repository[];
  currentRepository: Repository | null;
  
  // 分支相关状态
  branches: Branch[];
  selectedBranch: Branch | null;
  branchFilter: BranchFilter;
  
  // 合并请求相关状态
  mergeRequests: MergeRequest[];
  selectedMergeRequest: MergeRequest | null;
  
  // 用户和认证状态
  currentUser: { [platform in GitPlatform]?: GitUser };
  authenticatedPlatforms: GitPlatform[];
  
  // 统计信息
  stats: GitStats | null;
  
  // 加载状态
  loading: LoadingState;
  
  // 错误状态
  errors: GitError[];
  
  // UI状态
  ui: {
    repositorySelectorOpen: boolean;
    branchDetailsOpen: boolean;
    mergeRequestPanelOpen: boolean;
    viewMode: 'tree' | 'list' | 'graph';
    sidebarCollapsed: boolean;
  };
}

// Action类型定义
export type BranchAction =
  // 平台相关Actions
  | { type: 'SET_CURRENT_PLATFORM'; payload: GitPlatform }
  | { type: 'ADD_AUTHENTICATED_PLATFORM'; payload: { platform: GitPlatform; user: GitUser } }
  | { type: 'REMOVE_AUTHENTICATED_PLATFORM'; payload: GitPlatform }
  
  // 仓库相关Actions
  | { type: 'SET_REPOSITORIES'; payload: Repository[] }
  | { type: 'SET_CURRENT_REPOSITORY'; payload: Repository | null }
  | { type: 'ADD_REPOSITORY'; payload: Repository }
  | { type: 'UPDATE_REPOSITORY'; payload: Repository }
  | { type: 'REMOVE_REPOSITORY'; payload: string }
  
  // 分支相关Actions
  | { type: 'SET_BRANCHES'; payload: Branch[] }
  | { type: 'SET_SELECTED_BRANCH'; payload: Branch | null }
  | { type: 'ADD_BRANCH'; payload: Branch }
  | { type: 'UPDATE_BRANCH'; payload: Branch }
  | { type: 'REMOVE_BRANCH'; payload: string }
  | { type: 'SET_BRANCH_FILTER'; payload: Partial<BranchFilter> }
  
  // 合并请求相关Actions
  | { type: 'SET_MERGE_REQUESTS'; payload: MergeRequest[] }
  | { type: 'SET_SELECTED_MERGE_REQUEST'; payload: MergeRequest | null }
  | { type: 'ADD_MERGE_REQUEST'; payload: MergeRequest }
  | { type: 'UPDATE_MERGE_REQUEST'; payload: MergeRequest }
  | { type: 'REMOVE_MERGE_REQUEST'; payload: string | number }
  
  // 统计信息Actions
  | { type: 'SET_STATS'; payload: GitStats }
  
  // 加载状态Actions
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  
  // 错误状态Actions
  | { type: 'ADD_ERROR'; payload: GitError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  
  // UI状态Actions
  | { type: 'SET_UI_STATE'; payload: Partial<BranchState['ui']> }
  | { type: 'TOGGLE_REPOSITORY_SELECTOR' }
  | { type: 'TOGGLE_BRANCH_DETAILS' }
  | { type: 'TOGGLE_MERGE_REQUEST_PANEL' }
  | { type: 'SET_VIEW_MODE'; payload: 'tree' | 'list' | 'graph' }
  | { type: 'TOGGLE_SIDEBAR' };

// 初始状态
const initialState: BranchState = {
  currentPlatform: null,
  repositories: [],
  currentRepository: null,
  branches: [],
  selectedBranch: null,
  branchFilter: {
    search: '',
    status: [],
    author: [],
    sortBy: 'updated',
    sortOrder: 'desc'
  },
  mergeRequests: [],
  selectedMergeRequest: null,
  currentUser: {},
  authenticatedPlatforms: [],
  stats: null,
  loading: {
    repositories: false,
    branches: false,
    mergeRequests: false,
    commits: false,
    details: false
  },
  errors: [],
  ui: {
    repositorySelectorOpen: false,
    branchDetailsOpen: false,
    mergeRequestPanelOpen: false,
    viewMode: 'tree',
    sidebarCollapsed: false
  }
};

// Reducer函数
function branchReducer(state: BranchState, action: BranchAction): BranchState {
  switch (action.type) {
    // 平台相关
    case 'SET_CURRENT_PLATFORM':
      return {
        ...state,
        currentPlatform: action.payload,
        // 切换平台时重置相关状态
        repositories: [],
        currentRepository: null,
        branches: [],
        selectedBranch: null,
        mergeRequests: [],
        selectedMergeRequest: null
      };

    case 'ADD_AUTHENTICATED_PLATFORM':
      return {
        ...state,
        authenticatedPlatforms: [...state.authenticatedPlatforms.filter(p => p !== action.payload.platform), action.payload.platform],
        currentUser: {
          ...state.currentUser,
          [action.payload.platform]: action.payload.user
        }
      };

    case 'REMOVE_AUTHENTICATED_PLATFORM':
      return {
        ...state,
        authenticatedPlatforms: state.authenticatedPlatforms.filter(p => p !== action.payload),
        currentUser: {
          ...state.currentUser,
          [action.payload]: undefined
        },
        currentPlatform: state.currentPlatform === action.payload ? null : state.currentPlatform
      };

    // 仓库相关
    case 'SET_REPOSITORIES':
      return {
        ...state,
        repositories: action.payload
      };

    case 'SET_CURRENT_REPOSITORY':
      return {
        ...state,
        currentRepository: action.payload,
        // 切换仓库时重置分支和合并请求
        branches: [],
        selectedBranch: null,
        mergeRequests: [],
        selectedMergeRequest: null
      };

    case 'ADD_REPOSITORY':
      return {
        ...state,
        repositories: [action.payload, ...state.repositories]
      };

    case 'UPDATE_REPOSITORY':
      return {
        ...state,
        repositories: state.repositories.map(repo => 
          repo.id === action.payload.id ? action.payload : repo
        ),
        currentRepository: state.currentRepository?.id === action.payload.id ? action.payload : state.currentRepository
      };

    case 'REMOVE_REPOSITORY':
      return {
        ...state,
        repositories: state.repositories.filter(repo => repo.id !== action.payload),
        currentRepository: state.currentRepository?.id === action.payload ? null : state.currentRepository
      };

    // 分支相关
    case 'SET_BRANCHES':
      return {
        ...state,
        branches: action.payload
      };

    case 'SET_SELECTED_BRANCH':
      return {
        ...state,
        selectedBranch: action.payload
      };

    case 'ADD_BRANCH':
      return {
        ...state,
        branches: [action.payload, ...state.branches]
      };

    case 'UPDATE_BRANCH':
      return {
        ...state,
        branches: state.branches.map(branch => 
          branch.name === action.payload.name ? action.payload : branch
        ),
        selectedBranch: state.selectedBranch?.name === action.payload.name ? action.payload : state.selectedBranch
      };

    case 'REMOVE_BRANCH':
      return {
        ...state,
        branches: state.branches.filter(branch => branch.name !== action.payload),
        selectedBranch: state.selectedBranch?.name === action.payload ? null : state.selectedBranch
      };

    case 'SET_BRANCH_FILTER':
      return {
        ...state,
        branchFilter: {
          ...state.branchFilter,
          ...action.payload
        }
      };

    // 合并请求相关
    case 'SET_MERGE_REQUESTS':
      return {
        ...state,
        mergeRequests: action.payload
      };

    case 'SET_SELECTED_MERGE_REQUEST':
      return {
        ...state,
        selectedMergeRequest: action.payload
      };

    case 'ADD_MERGE_REQUEST':
      return {
        ...state,
        mergeRequests: [action.payload, ...state.mergeRequests]
      };

    case 'UPDATE_MERGE_REQUEST':
      return {
        ...state,
        mergeRequests: state.mergeRequests.map(mr => 
          mr.id === action.payload.id ? action.payload : mr
        ),
        selectedMergeRequest: state.selectedMergeRequest?.id === action.payload.id ? action.payload : state.selectedMergeRequest
      };

    case 'REMOVE_MERGE_REQUEST':
      return {
        ...state,
        mergeRequests: state.mergeRequests.filter(mr => mr.id !== action.payload),
        selectedMergeRequest: state.selectedMergeRequest?.id === action.payload ? null : state.selectedMergeRequest
      };

    // 统计信息
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload
      };

    // 加载状态
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          ...action.payload
        }
      };

    // 错误状态
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [action.payload, ...state.errors.slice(0, 9)] // 最多保留10个错误
      };

    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.code !== action.payload)
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: []
      };

    // UI状态
    case 'SET_UI_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };

    case 'TOGGLE_REPOSITORY_SELECTOR':
      return {
        ...state,
        ui: {
          ...state.ui,
          repositorySelectorOpen: !state.ui.repositorySelectorOpen
        }
      };

    case 'TOGGLE_BRANCH_DETAILS':
      return {
        ...state,
        ui: {
          ...state.ui,
          branchDetailsOpen: !state.ui.branchDetailsOpen
        }
      };

    case 'TOGGLE_MERGE_REQUEST_PANEL':
      return {
        ...state,
        ui: {
          ...state.ui,
          mergeRequestPanelOpen: !state.ui.mergeRequestPanelOpen
        }
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          viewMode: action.payload
        }
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarCollapsed: !state.ui.sidebarCollapsed
        }
      };

    default:
      return state;
  }
}

// Context接口
export interface BranchContextType {
  // 状态
  state: BranchState;
  
  // 基础Actions
  dispatch: React.Dispatch<BranchAction>;
  
  // 平台管理
  setCurrentPlatform: (platform: GitPlatform) => void;
  addAuthenticatedPlatform: (platform: GitPlatform, user: GitUser) => void;
  removeAuthenticatedPlatform: (platform: GitPlatform) => void;
  
  // 仓库管理
  setRepositories: (repositories: Repository[]) => void;
  setCurrentRepository: (repository: Repository | null) => void;
  
  // 分支管理
  setBranches: (branches: Branch[]) => void;
  setSelectedBranch: (branch: Branch | null) => void;
  setBranchFilter: (filter: Partial<BranchFilter>) => void;
  
  // 合并请求管理
  setMergeRequests: (mergeRequests: MergeRequest[]) => void;
  setSelectedMergeRequest: (mergeRequest: MergeRequest | null) => void;
  
  // UI控制
  toggleRepositorySelector: () => void;
  toggleBranchDetails: () => void;
  toggleMergeRequestPanel: () => void;
  setViewMode: (mode: 'tree' | 'list' | 'graph') => void;
  toggleSidebar: () => void;
  
  // 错误管理
  addError: (error: GitError) => void;
  removeError: (errorCode: string) => void;
  clearErrors: () => void;
  
  // 加载状态管理
  setLoading: (loading: Partial<LoadingState>) => void;
}

// 创建Context
const BranchContext = createContext<BranchContextType | undefined>(undefined);

// Context Provider组件
export interface BranchProviderProps {
  children: React.ReactNode;
  initialPlatform?: GitPlatform;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ 
  children, 
  initialPlatform 
}) => {
  const [state, dispatch] = useReducer(branchReducer, {
    ...initialState,
    currentPlatform: initialPlatform || null
  });

  // 初始化时加载已认证的平台
  useEffect(() => {
    const loadAuthenticatedPlatforms = async () => {
      const platforms = gitService.getAuthenticatedPlatforms();
      
      for (const platform of platforms) {
        const userResult = await gitService.getCurrentUser(platform);
        if (userResult.success && userResult.data) {
          dispatch({
            type: 'ADD_AUTHENTICATED_PLATFORM',
            payload: { platform, user: userResult.data }
          });
        }
      }

      // 如果没有设置当前平台但有已认证的平台，则设置第一个为当前平台
      if (!state.currentPlatform && platforms.length > 0) {
        dispatch({
          type: 'SET_CURRENT_PLATFORM',
          payload: platforms[0]
        });
      }
    };

    loadAuthenticatedPlatforms();
  }, []);

  // Action创建器
  const setCurrentPlatform = useCallback((platform: GitPlatform) => {
    dispatch({ type: 'SET_CURRENT_PLATFORM', payload: platform });
  }, []);

  const addAuthenticatedPlatform = useCallback((platform: GitPlatform, user: GitUser) => {
    dispatch({ type: 'ADD_AUTHENTICATED_PLATFORM', payload: { platform, user } });
  }, []);

  const removeAuthenticatedPlatform = useCallback((platform: GitPlatform) => {
    dispatch({ type: 'REMOVE_AUTHENTICATED_PLATFORM', payload: platform });
  }, []);

  const setRepositories = useCallback((repositories: Repository[]) => {
    dispatch({ type: 'SET_REPOSITORIES', payload: repositories });
  }, []);

  const setCurrentRepository = useCallback((repository: Repository | null) => {
    dispatch({ type: 'SET_CURRENT_REPOSITORY', payload: repository });
  }, []);

  const setBranches = useCallback((branches: Branch[]) => {
    dispatch({ type: 'SET_BRANCHES', payload: branches });
  }, []);

  const setSelectedBranch = useCallback((branch: Branch | null) => {
    dispatch({ type: 'SET_SELECTED_BRANCH', payload: branch });
  }, []);

  const setBranchFilter = useCallback((filter: Partial<BranchFilter>) => {
    dispatch({ type: 'SET_BRANCH_FILTER', payload: filter });
  }, []);

  const setMergeRequests = useCallback((mergeRequests: MergeRequest[]) => {
    dispatch({ type: 'SET_MERGE_REQUESTS', payload: mergeRequests });
  }, []);

  const setSelectedMergeRequest = useCallback((mergeRequest: MergeRequest | null) => {
    dispatch({ type: 'SET_SELECTED_MERGE_REQUEST', payload: mergeRequest });
  }, []);

  const toggleRepositorySelector = useCallback(() => {
    dispatch({ type: 'TOGGLE_REPOSITORY_SELECTOR' });
  }, []);

  const toggleBranchDetails = useCallback(() => {
    dispatch({ type: 'TOGGLE_BRANCH_DETAILS' });
  }, []);

  const toggleMergeRequestPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_MERGE_REQUEST_PANEL' });
  }, []);

  const setViewMode = useCallback((mode: 'tree' | 'list' | 'graph') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const addError = useCallback((error: GitError) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  }, []);

  const removeError = useCallback((errorCode: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: errorCode });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const setLoading = useCallback((loading: Partial<LoadingState>) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const contextValue: BranchContextType = {
    state,
    dispatch,
    setCurrentPlatform,
    addAuthenticatedPlatform,
    removeAuthenticatedPlatform,
    setRepositories,
    setCurrentRepository,
    setBranches,
    setSelectedBranch,
    setBranchFilter,
    setMergeRequests,
    setSelectedMergeRequest,
    toggleRepositorySelector,
    toggleBranchDetails,
    toggleMergeRequestPanel,
    setViewMode,
    toggleSidebar,
    addError,
    removeError,
    clearErrors,
    setLoading
  };

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
};

// Hook用于使用Context
export const useBranchContext = (): BranchContextType => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranchContext must be used within a BranchProvider');
  }
  return context;
};

// 导出Context（用于测试）
export { BranchContext };