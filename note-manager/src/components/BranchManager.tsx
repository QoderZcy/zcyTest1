/**
 * BranchManager 主容器组件
 * 分支管理系统的核心容器，协调各子组件交互
 */

import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Settings, 
  RefreshCw, 
  Filter, 
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  Search,
  Grid,
  List,
  Network,
  AlertTriangle,
  X
} from 'lucide-react';
import { useBranchContext } from '../contexts/BranchContext';
import { useGitIntegration } from '../hooks/useGitIntegration';
import { useBranches } from '../hooks/useBranches';
import { useBranchOperations } from '../hooks/useBranchOperations';
import { GitPlatform } from '../types/git';

interface BranchManagerProps {
  className?: string;
  initialPlatform?: GitPlatform;
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  className = '',
  initialPlatform
}) => {
  const { state, toggleSidebar, setViewMode, toggleRepositorySelector, clearErrors } = useBranchContext();
  const { 
    authenticatedPlatforms, 
    currentPlatform, 
    currentRepository, 
    loadAllRepositories,
    switchPlatform 
  } = useGitIntegration();
  const { 
    branches, 
    filteredBranches, 
    branchFilter,
    loading: branchLoading,
    loadBranches,
    refreshBranches,
    setFilter
  } = useBranches();
  const { 
    mergeRequests, 
    loadMergeRequests, 
    loading: operationLoading 
  } = useBranchOperations();

  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 初始化平台
  useEffect(() => {
    if (initialPlatform && authenticatedPlatforms.includes(initialPlatform)) {
      switchPlatform(initialPlatform);
    }
  }, [initialPlatform, authenticatedPlatforms, switchPlatform]);

  // 自动加载数据
  useEffect(() => {
    if (currentRepository && currentPlatform) {
      loadBranches();
      loadMergeRequests();
    }
  }, [currentRepository, currentPlatform, loadBranches, loadMergeRequests]);

  // 处理搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilter({ search: searchQuery });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, setFilter]);

  // 处理平台切换
  const handlePlatformSwitch = (platform: GitPlatform) => {
    switchPlatform(platform);
    setShowPlatformSelector(false);
    loadAllRepositories();
  };

  // 处理视图模式切换
  const handleViewModeChange = (mode: 'tree' | 'list' | 'graph') => {
    setViewMode(mode);
  };

  // 处理刷新
  const handleRefresh = async () => {
    await refreshBranches();
    await loadMergeRequests();
  };

  // 渲染平台选择器
  const renderPlatformSelector = () => {
    if (!showPlatformSelector) return null;

    return (
      <div className="platform-selector-dropdown">
        <div className="dropdown-overlay" onClick={() => setShowPlatformSelector(false)} />
        <div className="dropdown-content">
          <div className="dropdown-header">
            <h3>选择Git平台</h3>
            <button 
              className="close-btn"
              onClick={() => setShowPlatformSelector(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="platform-list">
            {authenticatedPlatforms.map(platform => (
              <button
                key={platform}
                className={`platform-item ${currentPlatform === platform ? 'active' : ''}`}
                onClick={() => handlePlatformSwitch(platform)}
              >
                <div className="platform-info">
                  <span className="platform-name">{platform.toUpperCase()}</span>
                  {currentPlatform === platform && (
                    <span className="current-indicator">当前平台</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          {authenticatedPlatforms.length === 0 && (
            <div className="empty-state">
              <p>没有已认证的平台</p>
              <p className="text-secondary">请先在设置中添加Git平台认证</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染筛选面板
  const renderFilterPanel = () => {
    if (!showFilterPanel) return null;

    return (
      <div className="filter-panel">
        <div className="filter-header">
          <h4>筛选分支</h4>
          <button 
            className="close-btn"
            onClick={() => setShowFilterPanel(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="filter-content">
          <div className="filter-group">
            <label>分支状态</label>
            <div className="checkbox-group">
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>活跃</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>陈旧</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>已合并</span>
              </label>
            </div>
          </div>
          
          <div className="filter-group">
            <label>分支保护</label>
            <div className="checkbox-group">
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>受保护</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>未保护</span>
              </label>
            </div>
          </div>

          <div className="filter-group">
            <label>排序方式</label>
            <select 
              value={branchFilter.sortBy}
              onChange={(e) => setFilter({ sortBy: e.target.value as any })}
            >
              <option value="updated">最新更新</option>
              <option value="name">分支名称</option>
              <option value="created">创建时间</option>
              <option value="commits">提交数量</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn btn-outline" onClick={() => setFilter({})}>
              重置筛选
            </button>
            <button className="btn btn-primary" onClick={() => setShowFilterPanel(false)}>
              应用筛选
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="branch-toolbar">
      <div className="toolbar-left">
        <div className="platform-selector">
          <button 
            className="platform-trigger"
            onClick={() => setShowPlatformSelector(true)}
          >
            <GitBranch size={20} />
            <span>{currentPlatform ? currentPlatform.toUpperCase() : '选择平台'}</span>
          </button>
          {renderPlatformSelector()}
        </div>

        <div className="repository-selector">
          <button 
            className="repository-trigger"
            onClick={toggleRepositorySelector}
          >
            <span>
              {currentRepository ? currentRepository.name : '选择仓库'}
            </span>
          </button>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="搜索分支..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="toolbar-right">
        <div className="view-mode-selector">
          <button
            className={`view-btn ${state.ui.viewMode === 'tree' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('tree')}
            title="树状视图"
          >
            <Network size={16} />
          </button>
          <button
            className={`view-btn ${state.ui.viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
            title="列表视图"
          >
            <List size={16} />
          </button>
          <button
            className={`view-btn ${state.ui.viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('graph')}
            title="图形视图"
          >
            <Grid size={16} />
          </button>
        </div>

        <button
          className="toolbar-btn"
          onClick={() => setShowFilterPanel(true)}
          title="筛选"
        >
          <Filter size={16} />
        </button>

        <button
          className="toolbar-btn"
          onClick={handleRefresh}
          disabled={branchLoading || operationLoading.mergeRequests}
          title="刷新"
        >
          <RefreshCw 
            size={16} 
            className={branchLoading || operationLoading.mergeRequests ? 'animate-spin' : ''} 
          />
        </button>

        <button
          className="toolbar-btn"
          onClick={toggleSidebar}
          title={state.ui.sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {state.ui.sidebarCollapsed ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        <button className="toolbar-btn" title="更多">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );

  // 渲染状态栏
  const renderStatusBar = () => (
    <div className="branch-status-bar">
      <div className="status-left">
        <span className="status-item">
          分支: {filteredBranches.length}/{branches.length}
        </span>
        <span className="status-item">
          合并请求: {mergeRequests.filter(mr => mr.state === 'open').length}
        </span>
        {currentRepository && (
          <span className="status-item">
            仓库: {currentRepository.name}
          </span>
        )}
      </div>

      <div className="status-right">
        {(branchLoading || operationLoading.mergeRequests) && (
          <span className="status-item loading">
            <RefreshCw size={12} className="animate-spin" />
            加载中...
          </span>
        )}
        {state.errors.length > 0 && (
          <button 
            className="status-item error" 
            onClick={clearErrors}
            title="清除错误"
          >
            <AlertTriangle size={12} />
            {state.errors.length} 错误
          </button>
        )}
      </div>
    </div>
  );

  // 渲染主要内容区域
  const renderMainContent = () => {
    if (!currentPlatform) {
      return (
        <div className="empty-state">
          <GitBranch size={48} className="empty-icon" />
          <h3>选择Git平台</h3>
          <p>请选择一个已认证的Git平台开始管理分支</p>
          {authenticatedPlatforms.length > 0 ? (
            <button 
              className="btn btn-primary"
              onClick={() => setShowPlatformSelector(true)}
            >
              选择平台
            </button>
          ) : (
            <div>
              <p className="text-secondary">没有已认证的平台</p>
              <button className="btn btn-outline">
                添加平台认证
              </button>
            </div>
          )}
        </div>
      );
    }

    if (!currentRepository) {
      return (
        <div className="empty-state">
          <Plus size={48} className="empty-icon" />
          <h3>选择仓库</h3>
          <p>请选择一个仓库开始管理分支</p>
          <button 
            className="btn btn-primary"
            onClick={toggleRepositorySelector}
          >
            选择仓库
          </button>
        </div>
      );
    }

    if (branchLoading && branches.length === 0) {
      return (
        <div className="loading-state">
          <RefreshCw size={48} className="animate-spin loading-icon" />
          <h3>加载分支中...</h3>
          <p>正在从 {currentPlatform.toUpperCase()} 获取分支信息</p>
        </div>
      );
    }

    return (
      <div className="branch-content">
        <div className={`branch-layout ${state.ui.sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {/* 主要分支列表区域 */}
          <div className="branch-main">
            {/* 这里将渲染具体的分支视图组件 */}
            <div className="branch-view">
              {state.ui.viewMode === 'tree' && (
                <div className="tree-view">
                  <p>树状视图 - 开发中</p>
                  <p>分支数量: {filteredBranches.length}</p>
                </div>
              )}
              {state.ui.viewMode === 'list' && (
                <div className="list-view">
                  <p>列表视图 - 开发中</p>
                  <p>分支数量: {filteredBranches.length}</p>
                </div>
              )}
              {state.ui.viewMode === 'graph' && (
                <div className="graph-view">
                  <p>图形视图 - 开发中</p>
                  <p>分支数量: {filteredBranches.length}</p>
                </div>
              )}
            </div>
          </div>

          {/* 侧边详情面板 */}
          {!state.ui.sidebarCollapsed && (
            <div className="branch-sidebar">
              <div className="sidebar-content">
                <h4>分支详情</h4>
                {state.selectedBranch ? (
                  <div className="branch-details">
                    <p><strong>分支名称:</strong> {state.selectedBranch.name}</p>
                    <p><strong>最新提交:</strong> {state.selectedBranch.lastCommit.message.substring(0, 50)}...</p>
                    <p><strong>更新时间:</strong> {state.selectedBranch.updatedAt.toLocaleDateString()}</p>
                    <p><strong>保护状态:</strong> {state.selectedBranch.isProtected ? '受保护' : '未保护'}</p>
                  </div>
                ) : (
                  <p className="text-secondary">选择一个分支查看详情</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`branch-manager ${className}`}>
      {renderToolbar()}
      {renderFilterPanel()}
      
      <div className="branch-manager-body">
        {renderMainContent()}
      </div>

      {renderStatusBar()}
    </div>
  );
};