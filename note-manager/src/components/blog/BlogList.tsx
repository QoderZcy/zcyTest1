import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, Grid, List, RefreshCw } from 'lucide-react';
import { useBlog } from '../../contexts/BlogContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import BlogCard from './BlogCard';
import BlogFilter from './BlogFilter';
import BlogPagination from './BlogPagination';
import { BlogFilter as FilterType, ArticleStatus, Visibility } from '../../types/blog';
import './BlogList.css';

interface BlogListProps {
  showPrivateArticles?: boolean; // 是否显示私人文章
  authorId?: string; // 特定作者的文章
}

const BlogList: React.FC<BlogListProps> = ({ 
  showPrivateArticles = false,
  authorId
}) => {
  const {
    articles,
    filter,
    pagination,
    isLoading,
    error,
    allTags,
    allCategories,
    loadArticles,
    loadPublicArticles,
    setFilter,
    setPagination,
    resetFilter,
    clearError,
    loadAllTags,
    loadAllCategories,
  } = useBlog();
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilter, setShowFilter] = useState(false);
  const [searchInput, setSearchInput] = useState(filter.searchTerm);

  // 页面加载时获取数据
  useEffect(() => {
    loadData();
    loadAllTags();
    loadAllCategories();
  }, [showPrivateArticles, authorId]);

  // 筛选条件变化时重新加载数据
  useEffect(() => {
    loadData();
  }, [filter, pagination.currentPage]);

  const loadData = async () => {
    try {
      const currentFilter = {
        ...filter,
        authorId: authorId || filter.authorId,
      };

      if (showPrivateArticles && isAuthenticated) {
        await loadArticles(currentFilter, pagination);
      } else {
        await loadPublicArticles(currentFilter, pagination);
      }
    } catch (error) {
      console.error('加载文章列表失败:', error);
    }
  };

  const handleSearch = () => {
    setFilter({ searchTerm: searchInput });
    setPagination({ currentPage: 1 });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (newFilter: Partial<FilterType>) => {
    setFilter(newFilter);
    setPagination({ currentPage: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ currentPage: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateArticle = () => {
    navigate('/blog/create');
  };

  const handleRefresh = () => {
    clearError();
    loadData();
  };

  const handleResetFilter = () => {
    setSearchInput('');
    resetFilter();
  };

  if (error) {
    return (
      <div className="blog-list-error">
        <div className="error-content">
          <h3>加载失败</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-list">
      {/* 头部工具栏 */}
      <div className="blog-list-header">
        <div className="header-left">
          <h1 className="blog-list-title">
            {showPrivateArticles ? '我的博客' : '博客文章'}
          </h1>
          <span className="article-count">
            共 {pagination.totalItems} 篇文章
          </span>
        </div>
        
        <div className="header-right">
          {isAuthenticated && (
            <button 
              onClick={handleCreateArticle}
              className="btn btn-primary create-article-btn"
            >
              <Plus size={16} />
              写文章
            </button>
          )}
          
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="网格视图"
            >
              <Grid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="blog-list-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="搜索文章标题、内容、标签..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <button 
              onClick={handleSearch}
              className="search-btn"
            >
              搜索
            </button>
          </div>
        </div>
        
        <div className="filter-controls">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`filter-toggle-btn ${showFilter ? 'active' : ''}`}
          >
            <Filter size={16} />
            筛选
          </button>
          
          {(filter.selectedTags.length > 0 || 
            filter.selectedCategories.length > 0 || 
            filter.searchTerm) && (
            <button
              onClick={handleResetFilter}
              className="reset-filter-btn"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilter && (
        <BlogFilter
          filter={filter}
          allTags={allTags}
          allCategories={allCategories}
          onFilterChange={handleFilterChange}
          showStatusFilter={showPrivateArticles}
          showVisibilityFilter={showPrivateArticles}
        />
      )}

      {/* 活动筛选标签 */}
      {(filter.selectedTags.length > 0 || filter.selectedCategories.length > 0) && (
        <div className="active-filters">
          {filter.selectedTags.map(tag => (
            <span key={tag} className="filter-tag">
              #{tag}
              <button
                onClick={() => handleFilterChange({
                  selectedTags: filter.selectedTags.filter(t => t !== tag)
                })}
                className="remove-filter"
              >
                ×
              </button>
            </span>
          ))}
          {filter.selectedCategories.map(category => (
            <span key={category} className="filter-category">
              {category}
              <button
                onClick={() => handleFilterChange({
                  selectedCategories: filter.selectedCategories.filter(c => c !== category)
                })}
                className="remove-filter"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 文章列表 */}
      <div className={`articles-container ${viewMode}`}>
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-content">
              <h3>暂无文章</h3>
              <p>
                {filter.searchTerm || filter.selectedTags.length > 0 || filter.selectedCategories.length > 0
                  ? '没有找到符合条件的文章，请尝试调整筛选条件'
                  : showPrivateArticles
                  ? '您还没有创建任何文章，点击"写文章"开始创作吧'
                  : '暂时没有公开的文章'
                }
              </p>
              {isAuthenticated && showPrivateArticles && (
                <button 
                  onClick={handleCreateArticle}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  写第一篇文章
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`articles-grid ${viewMode}`}>
            {articles.map(article => (
              <BlogCard
                key={article.id}
                article={article}
                viewMode={viewMode}
                showPrivateIndicator={showPrivateArticles}
              />
            ))}
          </div>
        )}
      </div>

      {/* 分页组件 */}
      {!isLoading && articles.length > 0 && pagination.totalPages > 1 && (
        <BlogPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default BlogList;