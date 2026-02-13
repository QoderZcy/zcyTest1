import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SortDesc, 
  SortAsc, 
  X, 
  ChevronDown,
  CheckSquare,
  Square,
  BookOpen,
  Tag as TagIcon,
  Calendar,
  User
} from 'lucide-react';
import type { BookFilter, BookCategory, BookStatus } from '../types/book';
import { BOOK_CATEGORY_LABELS, BOOK_STATUS_LABELS, DEFAULT_BOOK_FILTER } from '../types/book';

interface BookSearchBarProps {
  filter: BookFilter;
  onFilterChange: (filter: BookFilter) => void;
  allTags: string[];
  loading?: boolean;
  showAdvancedFilters?: boolean;
}

export const BookSearchBar: React.FC<BookSearchBarProps> = ({
  filter,
  onFilterChange,
  allTags,
  loading = false,
  showAdvancedFilters = true,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filter.searchTerm);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (searchInput !== filter.searchTerm) {
        onFilterChange({ ...filter, searchTerm: searchInput });
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput, filter, onFilterChange]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSortChange = (sortBy: BookFilter['sortBy']) => {
    const sortOrder = filter.sortBy === sortBy && filter.sortOrder === 'desc' ? 'asc' : 'desc';
    onFilterChange({ ...filter, sortBy, sortOrder });
  };

  const handleCategoryToggle = (category: BookCategory) => {
    const selectedCategories = filter.selectedCategories.includes(category)
      ? filter.selectedCategories.filter(c => c !== category)
      : [...filter.selectedCategories, category];
    onFilterChange({ ...filter, selectedCategories });
  };

  const handleTagToggle = (tag: string) => {
    const selectedTags = filter.selectedTags.includes(tag)
      ? filter.selectedTags.filter(t => t !== tag)
      : [...filter.selectedTags, tag];
    onFilterChange({ ...filter, selectedTags });
  };

  const handleStatusToggle = (status: BookStatus) => {
    const currentStatus = filter.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    onFilterChange({ ...filter, status: newStatus });
  };

  const handleAvailableOnlyToggle = () => {
    onFilterChange({ ...filter, availableOnly: !filter.availableOnly });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFilterChange(DEFAULT_BOOK_FILTER);
  };

  const hasActiveFilters = useMemo(() => {
    return filter.searchTerm || 
           filter.selectedCategories.length > 0 || 
           filter.selectedTags.length > 0 || 
           filter.availableOnly ||
           (filter.status && filter.status.length > 0);
  }, [filter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.searchTerm) count++;
    if (filter.selectedCategories.length > 0) count++;
    if (filter.selectedTags.length > 0) count++;
    if (filter.availableOnly) count++;
    if (filter.status && filter.status.length > 0) count++;
    return count;
  }, [filter]);

  return (
    <div className="book-search-bar">
      {/* 主搜索栏 */}
      <div className="book-search-bar__main">
        <div className="book-search-bar__search-input">
          <Search size={20} className="book-search-bar__search-icon" />
          <input
            type="text"
            placeholder="搜索图书标题、作者、ISBN..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="book-search-bar__input"
            disabled={loading}
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="book-search-bar__clear-btn"
              title="清除搜索"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 排序控制 */}
        <div className="book-search-bar__sort-controls">
          <button
            onClick={() => handleSortChange('title')}
            className={`book-search-bar__sort-btn ${filter.sortBy === 'title' ? 'active' : ''}`}
            title="按标题排序"
          >
            <BookOpen size={16} />
            标题
            {filter.sortBy === 'title' && (
              filter.sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />
            )}
          </button>
          
          <button
            onClick={() => handleSortChange('author')}
            className={`book-search-bar__sort-btn ${filter.sortBy === 'author' ? 'active' : ''}`}
            title="按作者排序"
          >
            <User size={16} />
            作者
            {filter.sortBy === 'author' && (
              filter.sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />
            )}
          </button>
          
          <button
            onClick={() => handleSortChange('publishDate')}
            className={`book-search-bar__sort-btn ${filter.sortBy === 'publishDate' ? 'active' : ''}`}
            title="按出版日期排序"
          >
            <Calendar size={16} />
            出版日期
            {filter.sortBy === 'publishDate' && (
              filter.sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />
            )}
          </button>

          <button
            onClick={() => handleSortChange('updatedAt')}
            className={`book-search-bar__sort-btn ${filter.sortBy === 'updatedAt' ? 'active' : ''}`}
            title="按更新时间排序"
          >
            更新时间
            {filter.sortBy === 'updatedAt' && (
              filter.sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />
            )}
          </button>
        </div>

        {/* 高级筛选切换 */}
        {showAdvancedFilters && (
          <div className="book-search-bar__advanced-toggle">
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`book-search-bar__filter-btn ${isAdvancedOpen ? 'active' : ''}`}
              title="高级筛选"
            >
              <Filter size={16} />
              筛选
              {activeFilterCount > 0 && (
                <span className="book-search-bar__filter-badge">{activeFilterCount}</span>
              )}
              <ChevronDown size={14} className={`book-search-bar__chevron ${isAdvancedOpen ? 'open' : ''}`} />
            </button>
          </div>
        )}

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="book-search-bar__clear-filters"
            title="清除所有筛选"
          >
            <X size={16} />
            清除筛选
          </button>
        )}
      </div>

      {/* 高级筛选面板 */}
      {showAdvancedFilters && isAdvancedOpen && (
        <div className="book-search-bar__advanced-filters">
          <div className="book-search-bar__filter-row">
            {/* 分类筛选 */}
            <div className="book-search-bar__filter-group" ref={categoryDropdownRef}>
              <button
                className={`book-search-bar__filter-dropdown-btn ${filter.selectedCategories.length > 0 ? 'active' : ''}`}
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                分类
                {filter.selectedCategories.length > 0 && (
                  <span className="book-search-bar__filter-count">({filter.selectedCategories.length})</span>
                )}
                <ChevronDown size={14} className={showCategoryDropdown ? 'open' : ''} />
              </button>
              
              {showCategoryDropdown && (
                <div className="book-search-bar__dropdown">
                  {Object.entries(BOOK_CATEGORY_LABELS).map(([value, label]) => (
                    <label key={value} className="book-search-bar__dropdown-item">
                      <div className="book-search-bar__checkbox">
                        {filter.selectedCategories.includes(value as BookCategory) ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={filter.selectedCategories.includes(value as BookCategory)}
                        onChange={() => handleCategoryToggle(value as BookCategory)}
                        className="book-search-bar__checkbox-input"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 标签筛选 */}
            {allTags.length > 0 && (
              <div className="book-search-bar__filter-group" ref={tagDropdownRef}>
                <button
                  className={`book-search-bar__filter-dropdown-btn ${filter.selectedTags.length > 0 ? 'active' : ''}`}
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                >
                  <TagIcon size={14} />
                  标签
                  {filter.selectedTags.length > 0 && (
                    <span className="book-search-bar__filter-count">({filter.selectedTags.length})</span>
                  )}
                  <ChevronDown size={14} className={showTagDropdown ? 'open' : ''} />
                </button>
                
                {showTagDropdown && (
                  <div className="book-search-bar__dropdown book-search-bar__dropdown--scrollable">
                    {allTags.map(tag => (
                      <label key={tag} className="book-search-bar__dropdown-item">
                        <div className="book-search-bar__checkbox">
                          {filter.selectedTags.includes(tag) ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={filter.selectedTags.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          className="book-search-bar__checkbox-input"
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 状态筛选 */}
            <div className="book-search-bar__filter-group" ref={statusDropdownRef}>
              <button
                className={`book-search-bar__filter-dropdown-btn ${(filter.status && filter.status.length > 0) ? 'active' : ''}`}
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                状态
                {filter.status && filter.status.length > 0 && (
                  <span className="book-search-bar__filter-count">({filter.status.length})</span>
                )}
                <ChevronDown size={14} className={showStatusDropdown ? 'open' : ''} />
              </button>
              
              {showStatusDropdown && (
                <div className="book-search-bar__dropdown">
                  {Object.entries(BOOK_STATUS_LABELS).map(([value, label]) => (
                    <label key={value} className="book-search-bar__dropdown-item">
                      <div className="book-search-bar__checkbox">
                        {filter.status?.includes(value as BookStatus) ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={filter.status?.includes(value as BookStatus) || false}
                        onChange={() => handleStatusToggle(value as BookStatus)}
                        className="book-search-bar__checkbox-input"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 可借阅筛选 */}
            <div className="book-search-bar__filter-group">
              <label className="book-search-bar__checkbox-filter">
                <div className="book-search-bar__checkbox">
                  {filter.availableOnly ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={filter.availableOnly}
                  onChange={handleAvailableOnlyToggle}
                  className="book-search-bar__checkbox-input"
                />
                <span>仅显示可借阅</span>
              </label>
            </div>
          </div>

          {/* 活跃筛选标签 */}
          {hasActiveFilters && (
            <div className="book-search-bar__active-filters">
              <span className="book-search-bar__active-filters-label">当前筛选：</span>
              
              {filter.selectedCategories.map(category => (
                <span key={category} className="book-search-bar__active-filter-tag">
                  {BOOK_CATEGORY_LABELS[category]}
                  <button
                    onClick={() => handleCategoryToggle(category)}
                    className="book-search-bar__active-filter-remove"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              
              {filter.selectedTags.map(tag => (
                <span key={tag} className="book-search-bar__active-filter-tag">
                  {tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="book-search-bar__active-filter-remove"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              
              {filter.status?.map(status => (
                <span key={status} className="book-search-bar__active-filter-tag">
                  {BOOK_STATUS_LABELS[status]}
                  <button
                    onClick={() => handleStatusToggle(status)}
                    className="book-search-bar__active-filter-remove"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              
              {filter.availableOnly && (
                <span className="book-search-bar__active-filter-tag">
                  仅显示可借阅
                  <button
                    onClick={handleAvailableOnlyToggle}
                    className="book-search-bar__active-filter-remove"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};