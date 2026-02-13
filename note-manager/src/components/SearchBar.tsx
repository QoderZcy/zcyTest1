import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, SortDesc, SortAsc, X, Calendar, Hash, Type, Clock } from 'lucide-react';
import type { NoteFilter } from '../types/note';
import { useNoteSearch } from '../hooks/useNotes';

interface SearchBarProps {
  filter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  allTags: string[];
  totalNotes?: number;
  filteredCount?: number;
  onAdvancedSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filter,
  onFilterChange,
  allTags,
  totalNotes = 0,
  filteredCount = 0,
  onAdvancedSearch,
}) => {
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 初始化搜索历史
  useEffect(() => {
    const stored = localStorage.getItem('search_history');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (error) {
        console.error('加载搜索历史失败:', error);
      }
    }
  }, []);
  
  // 保存搜索历史
  const saveSearchHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [searchTerm, ...searchHistory.filter(term => term !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  }, [searchHistory]);
  // 搜索输入处理
  const handleSearchChange = (searchTerm: string) => {
    onFilterChange({ ...filter, searchTerm });
    
    // 如果是清空搜索，保存到历史
    if (searchTerm.trim() && searchTerm !== filter.searchTerm) {
      setTimeout(() => saveSearchHistory(searchTerm), 1000);
    }
  };
  
  // 从历史中选择搜索词
  const handleSelectFromHistory = (searchTerm: string) => {
    handleSearchChange(searchTerm);
    setShowSearchHistory(false);
    searchInputRef.current?.focus();
  };
  
  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
    setShowSearchHistory(false);
  };

  // 标签过滤处理
  const handleTagToggle = (tag: string) => {
    const selectedTags = filter.selectedTags.includes(tag)
      ? filter.selectedTags.filter(t => t !== tag)
      : [...filter.selectedTags, tag];
    onFilterChange({ ...filter, selectedTags });
  };
  
  // 批量选择标签
  const handleSelectAllTags = () => {
    onFilterChange({ ...filter, selectedTags: [...allTags] });
  };
  
  const handleClearAllTags = () => {
    onFilterChange({ ...filter, selectedTags: [] });
  };

  // 排序处理
  const handleSortChange = (sortBy: 'createdAt' | 'updatedAt' | 'title') => {
    const sortOrder = filter.sortBy === sortBy && filter.sortOrder === 'desc' ? 'asc' : 'desc';
    onFilterChange({ ...filter, sortBy, sortOrder });
  };
  
  // 获取排序显示文本
  const getSortDisplayText = (sortBy: string) => {
    const labels = {
      updatedAt: '更新时间',
      createdAt: '创建时间',
      title: '标题'
    };
    return labels[sortBy] || sortBy;
  };

  // 清除所有过滤器
  const clearFilters = () => {
    onFilterChange({
      searchTerm: '',
      selectedTags: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
    setShowAdvancedFilter(false);
    setShowTagFilter(false);
  };
  
  // 检查是否有活跃过滤器
  const hasActiveFilters = filter.searchTerm || filter.selectedTags.length > 0;
  const hasAdvancedFilters = filter.sortBy !== 'updatedAt' || filter.sortOrder !== 'desc';
  
  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearchHistory(false);
      setShowAdvancedFilter(false);
      setShowTagFilter(false);
    } else if (e.key === 'Enter' && onAdvancedSearch) {
      onAdvancedSearch(filter.searchTerm);
    }
  };

  return (
    <div className="search-bar">
      {/* 搜索输入区域 */}
      <div className="search-section">
        <div className="search-input-container">
          <Search size={20} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索便签标题、内容或标签..."
            value={filter.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSearchHistory(searchHistory.length > 0 && !filter.searchTerm)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          
          {/* 搜索操作按钮 */}
          <div className="search-actions">
            {filter.searchTerm && (
              <button 
                onClick={() => handleSearchChange('')} 
                className="clear-search-btn"
                title="清除搜索"
              >
                <X size={16} />
              </button>
            )}
            
            {hasActiveFilters && (
              <button 
                onClick={clearFilters} 
                className="clear-filters-btn"
                title="清除所有过滤"
              >
                <Filter size={16} />
                <X size={12} className="clear-icon" />
              </button>
            )}
          </div>
          
          {/* 搜索历史下拉框 */}
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="search-history-dropdown">
              <div className="search-history-header">
                <span>搜索历史</span>
                <button onClick={clearSearchHistory} className="clear-history-btn">
                  <X size={14} />
                </button>
              </div>
              <div className="search-history-list">
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectFromHistory(term)}
                    className="search-history-item"
                  >
                    <Clock size={14} />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 搜索统计 */}
        <div className="search-stats">
          {hasActiveFilters ? (
            <span className="filter-results">
              显示 {filteredCount} / {totalNotes} 个便签
            </span>
          ) : (
            <span className="total-notes">
              共 {totalNotes} 个便签
            </span>
          )}
        </div>
      </div>
      
      {/* 过滤控件区域 */}
      <div className="filter-section">
        {/* 排序控件 */}
        <div className="sort-controls">
          <span className="sort-label">排序:</span>
          
          {(['updatedAt', 'createdAt', 'title'] as const).map(sortKey => (
            <button
              key={sortKey}
              onClick={() => handleSortChange(sortKey)}
              className={`sort-btn ${filter.sortBy === sortKey ? 'active' : ''}`}
              title={`按${getSortDisplayText(sortKey)}排序`}
            >
              <span className="sort-text">{getSortDisplayText(sortKey)}</span>
              {filter.sortBy === sortKey && (
                filter.sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />
              )}
            </button>
          ))}
        </div>
        
        {/* 标签过滤控件 */}
        {allTags.length > 0 && (
          <div className="tag-filter-section">
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={`tag-filter-toggle ${showTagFilter ? 'active' : ''} ${filter.selectedTags.length > 0 ? 'has-selection' : ''}`}
            >
              <Hash size={16} />
              标签过滤
              {filter.selectedTags.length > 0 && (
                <span className="tag-count">({filter.selectedTags.length})</span>
              )}
            </button>
            
            {showTagFilter && (
              <div className="tag-filter-dropdown">
                <div className="tag-filter-header">
                  <span>选择标签</span>
                  <div className="tag-filter-actions">
                    <button onClick={handleSelectAllTags} className="select-all-btn">
                      全选
                    </button>
                    <button onClick={handleClearAllTags} className="clear-all-btn">
                      清除
                    </button>
                  </div>
                </div>
                
                <div className="tag-filter-list">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`tag-filter-item ${filter.selectedTags.includes(tag) ? 'active' : ''}`}
                    >
                      <Hash size={12} />
                      {tag}
                      {filter.selectedTags.includes(tag) && (
                        <span className="tag-selected-icon">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 高级过滤器 */}
        <button
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          className={`advanced-filter-btn ${showAdvancedFilter ? 'active' : ''} ${hasAdvancedFilters ? 'has-filters' : ''}`}
        >
          <Filter size={16} />
          高级
        </button>
      </div>
      
      {/* 高级过滤面板 */}
      {showAdvancedFilter && (
        <div className="advanced-filter-panel">
          <div className="advanced-filter-content">
            <h4>高级过滤选项</h4>
            
            {/* 更多排序选项 */}
            <div className="filter-group">
              <label>排序方式:</label>
              <div className="sort-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sortOrder"
                    checked={filter.sortOrder === 'desc'}
                    onChange={() => onFilterChange({ ...filter, sortOrder: 'desc' })}
                  />
                  降序 (新到旧)
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sortOrder"
                    checked={filter.sortOrder === 'asc'}
                    onChange={() => onFilterChange({ ...filter, sortOrder: 'asc' })}
                  />
                  升序 (旧到新)
                </label>
              </div>
            </div>
            
            {/* 快速操作 */}
            <div className="filter-group">
              <label>快速操作:</label>
              <div className="quick-actions">
                <button 
                  onClick={() => handleSearchChange('')}
                  className="quick-action-btn"
                >
                  清除搜索
                </button>
                <button 
                  onClick={clearFilters}
                  className="quick-action-btn"
                >
                  重置所有
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 活跃过滤器指示 */}
      {(hasActiveFilters || hasAdvancedFilters) && (
        <div className="active-filters-indicator">
          <span className="active-filters-label">活跃过滤器:</span>
          
          {filter.searchTerm && (
            <span className="active-filter-item">
              搜索: "{filter.searchTerm}"
              <button onClick={() => handleSearchChange('')}>
                <X size={12} />
              </button>
            </span>
          )}
          
          {filter.selectedTags.map(tag => (
            <span key={tag} className="active-filter-item">
              标签: {tag}
              <button onClick={() => handleTagToggle(tag)}>
                <X size={12} />
              </button>
            </span>
          ))}
          
          {hasAdvancedFilters && (
            <span className="active-filter-item">
              排序: {getSortDisplayText(filter.sortBy)} ({filter.sortOrder === 'desc' ? '降序' : '升序'})
            </span>
          )}
        </div>
      )}
    </div>
  );
};