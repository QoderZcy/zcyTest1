import React from 'react';
import { X } from 'lucide-react';
import { BlogFilter as FilterType, ArticleStatus, Visibility } from '../../types/blog';
import './BlogFilter.css';

interface BlogFilterProps {
  filter: FilterType;
  allTags: string[];
  allCategories: string[];
  onFilterChange: (filter: Partial<FilterType>) => void;
  showStatusFilter?: boolean;
  showVisibilityFilter?: boolean;
}

const BlogFilter: React.FC<BlogFilterProps> = ({
  filter,
  allTags,
  allCategories,
  onFilterChange,
  showStatusFilter = false,
  showVisibilityFilter = false,
}) => {
  const handleTagToggle = (tag: string) => {
    const newTags = filter.selectedTags.includes(tag)
      ? filter.selectedTags.filter(t => t !== tag)
      : [...filter.selectedTags, tag];
    
    onFilterChange({ selectedTags: newTags });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filter.selectedCategories.includes(category)
      ? filter.selectedCategories.filter(c => c !== category)
      : [...filter.selectedCategories, category];
    
    onFilterChange({ selectedCategories: newCategories });
  };

  const handleSortChange = (sortBy: FilterType['sortBy'], sortOrder: FilterType['sortOrder']) => {
    onFilterChange({ sortBy, sortOrder });
  };

  const handleStatusChange = (status: ArticleStatus | undefined) => {
    onFilterChange({ status });
  };

  const handleVisibilityChange = (visibility: Visibility | undefined) => {
    onFilterChange({ visibility });
  };

  return (
    <div className="blog-filter">
      <div className="filter-section">
        <h4 className="filter-title">排序方式</h4>
        <div className="sort-options">
          <div className="sort-group">
            <label className="sort-label">排序字段:</label>
            <select
              value={filter.sortBy}
              onChange={(e) => handleSortChange(e.target.value as FilterType['sortBy'], filter.sortOrder)}
              className="sort-select"
            >
              <option value="createdAt">创建时间</option>
              <option value="updatedAt">更新时间</option>
              <option value="publishedAt">发布时间</option>
              <option value="title">标题</option>
              <option value="viewCount">浏览量</option>
            </select>
          </div>
          
          <div className="sort-group">
            <label className="sort-label">排序顺序:</label>
            <select
              value={filter.sortOrder}
              onChange={(e) => handleSortChange(filter.sortBy, e.target.value as FilterType['sortOrder'])}
              className="sort-select"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      </div>

      {showStatusFilter && (
        <div className="filter-section">
          <h4 className="filter-title">文章状态</h4>
          <div className="filter-options">
            <button
              className={`filter-option ${!filter.status ? 'active' : ''}`}
              onClick={() => handleStatusChange(undefined)}
            >
              全部
            </button>
            {Object.values(ArticleStatus).map(status => (
              <button
                key={status}
                className={`filter-option ${filter.status === status ? 'active' : ''}`}
                onClick={() => handleStatusChange(status)}
              >
                {status === ArticleStatus.PUBLISHED ? '已发布' :
                 status === ArticleStatus.DRAFT ? '草稿' :
                 status === ArticleStatus.ARCHIVED ? '已归档' : '已删除'}
              </button>
            ))}
          </div>
        </div>
      )}

      {showVisibilityFilter && (
        <div className="filter-section">
          <h4 className="filter-title">可见性</h4>
          <div className="filter-options">
            <button
              className={`filter-option ${!filter.visibility ? 'active' : ''}`}
              onClick={() => handleVisibilityChange(undefined)}
            >
              全部
            </button>
            {Object.values(Visibility).map(visibility => (
              <button
                key={visibility}
                className={`filter-option ${filter.visibility === visibility ? 'active' : ''}`}
                onClick={() => handleVisibilityChange(visibility)}
              >
                {visibility === Visibility.PUBLIC ? '公开' :
                 visibility === Visibility.PRIVATE ? '私有' :
                 visibility === Visibility.UNLISTED ? '不公开列出' : '密码保护'}
              </button>
            ))}
          </div>
        </div>
      )}

      {allCategories.length > 0 && (
        <div className="filter-section">
          <h4 className="filter-title">分类</h4>
          <div className="filter-tags">
            {allCategories.map(category => (
              <button
                key={category}
                className={`filter-tag ${filter.selectedCategories.includes(category) ? 'active' : ''}`}
                onClick={() => handleCategoryToggle(category)}
              >
                {category}
                {filter.selectedCategories.includes(category) && (
                  <X size={12} className="remove-icon" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="filter-section">
          <h4 className="filter-title">标签</h4>
          <div className="filter-tags">
            {allTags.slice(0, 20).map(tag => (
              <button
                key={tag}
                className={`filter-tag ${filter.selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                #{tag}
                {filter.selectedTags.includes(tag) && (
                  <X size={12} className="remove-icon" />
                )}
              </button>
            ))}
            {allTags.length > 20 && (
              <span className="more-tags-indicator">
                +{allTags.length - 20} 更多
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogFilter;