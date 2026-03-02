import React from 'react';
import { Filter, X } from 'lucide-react';
import { BlogCategory } from '../types/blog';

interface CategoryFilterProps {
  categories: BlogCategory[];
  selectedCategory?: string;
  onCategorySelect: (category: string | undefined) => void;
  loading?: boolean;
}

/**
 * 分类筛选组件
 * 提供博客文章的分类筛选功能
 */
const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  loading = false
}) => {
  const handleCategoryClick = (categorySlug: string) => {
    if (selectedCategory === categorySlug) {
      onCategorySelect(undefined);
    } else {
      onCategorySelect(categorySlug);
    }
  };

  const handleClearFilter = () => {
    onCategorySelect(undefined);
  };

  if (loading) {
    return (
      <div className="category-filter loading">
        <div className="category-filter-header">
          <Filter size={16} />
          <span>加载分类中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="category-filter">
      <div className="category-filter-header">
        <Filter size={16} />
        <span>分类筛选</span>
        {selectedCategory && (
          <button
            onClick={handleClearFilter}
            className="category-filter-clear"
            title="清除筛选"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="category-filter-list">
        <button
          className={`category-filter-item ${!selectedCategory ? 'active' : ''}`}
          onClick={() => onCategorySelect(undefined)}
        >
          <span className="category-name">全部</span>
          <span className="category-count">
            {categories.reduce((total, cat) => total + cat.postCount, 0)}
          </span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-filter-item ${selectedCategory === category.slug ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.slug)}
          >
            <span className="category-name">{category.name}</span>
            <span className="category-count">{category.postCount}</span>
          </button>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="category-filter-empty">
          暂无分类
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;