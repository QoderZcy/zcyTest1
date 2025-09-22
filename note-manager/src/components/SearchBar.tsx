import React from 'react';
import { Search, Filter, SortDesc, SortAsc, X } from 'lucide-react';
import type { NoteFilter } from '../types/note';

interface SearchBarProps {
  filter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  allTags: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filter,
  onFilterChange,
  allTags,
}) => {
  const handleSearchChange = (searchTerm: string) => {
    onFilterChange({ ...filter, searchTerm });
  };

  const handleTagToggle = (tag: string) => {
    const selectedTags = filter.selectedTags.includes(tag)
      ? filter.selectedTags.filter(t => t !== tag)
      : [...filter.selectedTags, tag];
    onFilterChange({ ...filter, selectedTags });
  };

  const handleSortChange = (sortBy: 'createdAt' | 'updatedAt' | 'title') => {
    const sortOrder = filter.sortBy === sortBy && filter.sortOrder === 'desc' ? 'asc' : 'desc';
    onFilterChange({ ...filter, sortBy, sortOrder });
  };

  const clearFilters = () => {
    onFilterChange({
      searchTerm: '',
      selectedTags: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = filter.searchTerm || filter.selectedTags.length > 0;

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="搜索便签..."
          value={filter.searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="search-input"
        />
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn" title="清除过滤">
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="filter-controls">
        <div className="sort-controls">
          <button
            onClick={() => handleSortChange('updatedAt')}
            className={`sort-btn ${filter.sortBy === 'updatedAt' ? 'active' : ''}`}
            title="按更新时间排序"
          >
            更新时间
            {filter.sortBy === 'updatedAt' && (
              filter.sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />
            )}
          </button>
          
          <button
            onClick={() => handleSortChange('createdAt')}
            className={`sort-btn ${filter.sortBy === 'createdAt' ? 'active' : ''}`}
            title="按创建时间排序"
          >
            创建时间
            {filter.sortBy === 'createdAt' && (
              filter.sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />
            )}
          </button>
          
          <button
            onClick={() => handleSortChange('title')}
            className={`sort-btn ${filter.sortBy === 'title' ? 'active' : ''}`}
            title="按标题排序"
          >
            标题
            {filter.sortBy === 'title' && (
              filter.sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />
            )}
          </button>
        </div>
        
        {allTags.length > 0 && (
          <div className="tag-filters">
            <Filter size={16} className="filter-icon" />
            <div className="tag-filter-list">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`tag-filter ${filter.selectedTags.includes(tag) ? 'active' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};