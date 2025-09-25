/**
 * RepositorySelector 组件
 * 仓库选择和切换组件
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Star, 
  Clock, 
  GitBranch, 
  Users, 
  Eye,
  Lock,
  X,
  RefreshCw,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useBranchContext } from '../contexts/BranchContext';
import { useGitIntegration } from '../hooks/useGitIntegration';
import { Repository, GitPlatform } from '../types/git';

interface RepositorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (repository: Repository) => void;
}

export const RepositorySelector: React.FC<RepositorySelectorProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const { state } = useBranchContext();
  const { 
    repositories, 
    currentRepository, 
    loadRepositories, 
    loadAllRepositories,
    searchRepositories,
    loading,
    currentPlatform
  } = useGitIntegration();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'stars'>('updated');
  const [filterBy, setFilterBy] = useState<'all' | 'owned' | 'starred' | 'recent'>('all');
  const [searchResults, setSearchResults] = useState<Repository[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 处理搜索
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || !currentPlatform) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchRepositories(searchQuery, currentPlatform);
        setSearchResults(results);
      } catch (error) {
        console.error('Search repositories error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentPlatform, searchRepositories]);

  // 处理数据加载
  useEffect(() => {
    if (isOpen && repositories.length === 0 && currentPlatform) {
      loadAllRepositories();
    }
  }, [isOpen, repositories.length, currentPlatform, loadAllRepositories]);

  // 筛选和排序仓库
  const filteredRepositories = useMemo(() => {
    let filtered = searchQuery.trim() ? searchResults : repositories;

    // 应用筛选
    switch (filterBy) {
      case 'owned':
        filtered = filtered.filter(repo => !repo.isFork);
        break;
      case 'starred':
        // 这里应该基于用户的星标数据筛选，暂时使用stars数量作为替代
        filtered = filtered.filter(repo => repo.starsCount > 0);
        break;
      case 'recent':
        filtered = filtered.filter(repo => {
          const daysSinceUpdate = (Date.now() - repo.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate <= 30;
        });
        break;
    }

    // 应用排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stars':
          return b.starsCount - a.starsCount;
        case 'updated':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

    return filtered;
  }, [repositories, searchResults, searchQuery, filterBy, sortBy]);

  // 处理仓库选择
  const handleRepositorySelect = (repository: Repository) => {
    onSelect(repository);
    onClose();
  };

  // 处理刷新
  const handleRefresh = () => {
    if (currentPlatform) {
      loadRepositories(currentPlatform);
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };

  // 渲染仓库项
  const renderRepositoryItem = (repository: Repository) => (
    <div
      key={repository.id}
      className={`repository-item ${currentRepository?.id === repository.id ? 'selected' : ''}`}
      onClick={() => handleRepositorySelect(repository)}
    >
      <div className="repository-info">
        <div className="repository-header">
          <h4 className="repository-name">
            {repository.name}
          </h4>
          <div className="repository-badges">
            {repository.isPrivate && <Lock size={12} className="badge-icon" />}
            {repository.isFork && <GitBranch size={12} className="badge-icon" />}
          </div>
        </div>
        
        {repository.description && (
          <p className="repository-description">
            {repository.description}
          </p>
        )}
        
        <div className="repository-meta">
          <div className="meta-item">
            <Star size={12} />
            <span>{repository.starsCount}</span>
          </div>
          <div className="meta-item">
            <GitBranch size={12} />
            <span>{repository.forksCount}</span>
          </div>
          <div className="meta-item">
            <Eye size={12} />
            <span>{repository.watchersCount}</span>
          </div>
          <div className="meta-item">
            <Clock size={12} />
            <span>{formatTime(repository.updatedAt)}</span>
          </div>
        </div>

        {repository.topics && repository.topics.length > 0 && (
          <div className="repository-topics">
            {repository.topics.slice(0, 3).map(topic => (
              <span key={topic} className="topic-tag">
                {topic}
              </span>
            ))}
            {repository.topics.length > 3 && (
              <span className="topic-tag more">
                +{repository.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="repository-selector">
      <div className="selector-overlay" onClick={onClose} />
      <div className="selector-content">
        <div className="selector-header">
          <h3>选择仓库</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="selector-controls">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="搜索仓库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {isSearching && <RefreshCw size={16} className="animate-spin search-loading" />}
          </div>

          <div className="filter-controls">
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">所有仓库</option>
              <option value="owned">我的仓库</option>
              <option value="starred">已星标</option>
              <option value="recent">最近更新</option>
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="updated">最新更新</option>
              <option value="name">仓库名称</option>
              <option value="stars">星标数量</option>
            </select>

            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={loading.repositories}
              title="刷新"
            >
              <RefreshCw 
                size={16} 
                className={loading.repositories ? 'animate-spin' : ''} 
              />
            </button>
          </div>
        </div>

        <div className="selector-body">
          {loading.repositories && repositories.length === 0 ? (
            <div className="loading-state">
              <RefreshCw size={32} className="animate-spin" />
              <p>加载仓库中...</p>
            </div>
          ) : filteredRepositories.length > 0 ? (
            <div className="repository-list">
              {filteredRepositories.map(renderRepositoryItem)}
            </div>
          ) : (
            <div className="empty-state">
              {searchQuery ? (
                <>
                  <Search size={32} className="empty-icon" />
                  <h4>未找到匹配的仓库</h4>
                  <p>尝试使用不同的关键词搜索</p>
                </>
              ) : (
                <>
                  <GitBranch size={32} className="empty-icon" />
                  <h4>没有仓库</h4>
                  <p>当前平台下没有可用的仓库</p>
                  <button className="btn btn-primary" onClick={handleRefresh}>
                    刷新试试
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="selector-footer">
          <div className="footer-info">
            <span>找到 {filteredRepositories.length} 个仓库</span>
            {currentPlatform && (
              <span>来源: {currentPlatform.toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};