import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import BlogPostCard from './BlogPostCard';
import CategoryFilter from './CategoryFilter';
import { useBlogPosts, useBlogCategories } from '../hooks/useBlog';
import { BlogFilter, PublishStatus } from '../types/blog';

interface BlogPostListProps {
  initialFilter?: BlogFilter;
  showCategoryFilter?: boolean;
  showActions?: boolean;
  title?: string;
}

type SortField = 'publishedAt' | 'updatedAt' | 'title' | 'viewCount';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

/**
 * 博客文章列表组件
 * 展示文章列表并提供筛选、排序、搜索功能
 */
const BlogPostList: React.FC<BlogPostListProps> = ({
  initialFilter = {},
  showCategoryFilter = true,
  showActions = false,
  title = '文章列表'
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('publishedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {
    posts,
    loading,
    error,
    filter,
    pagination,
    updateFilter,
    loadMore,
    refresh,
    hasMore
  } = useBlogPosts(initialFilter);

  const {
    categories,
    loading: categoriesLoading
  } = useBlogCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter({ 
      search: searchQuery.trim() || undefined,
      page: 1 
    });
  };

  const handleCategorySelect = (category: string | undefined) => {
    updateFilter({ 
      category,
      page: 1 
    });
  };

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
    
    // 这里应该更新API请求的排序参数
    // updateFilter({ sortBy: field, sortOrder: newOrder, page: 1 });
  };

  const handleEdit = (post: any) => {
    navigate(`/blog/edit/${post.id}`);
  };

  const handleDelete = async (postId: string) => {
    try {
      // 删除文章的逻辑会在blogService中处理
      // await blogService.deletePost(postId);
      refresh();
    } catch (err) {
      console.error('删除文章失败:', err);
    }
  };

  const handleArchive = async (postId: string) => {
    try {
      // 归档文章的逻辑会在blogService中处理
      // await blogService.archivePost(postId);
      refresh();
    } catch (err) {
      console.error('归档文章失败:', err);
    }
  };

  const handleStatusChange = async (postId: string, status: PublishStatus) => {
    try {
      // 更改文章状态的逻辑会在blogService中处理
      if (status === PublishStatus.PUBLISHED) {
        // await blogService.publishPost(postId);
      } else {
        // await blogService.unpublishPost(postId);
      }
      refresh();
    } catch (err) {
      console.error('更改文章状态失败:', err);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <SortAsc size={16} className="sort-icon-inactive" />;
    }
    return sortOrder === 'asc' 
      ? <SortAsc size={16} /> 
      : <SortDesc size={16} />;
  };

  if (error) {
    return (
      <div className="blog-post-list-error">
        <p>加载文章失败: {error}</p>
        <button onClick={refresh} className="retry-btn">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="blog-post-list">
      <div className="blog-post-list-header">
        <h1 className="blog-post-list-title">{title}</h1>
        
        <div className="blog-post-list-controls">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                搜索
              </button>
            </div>
          </form>

          <div className="view-controls">
            <div className="sort-controls">
              <button
                onClick={() => handleSort('publishedAt')}
                className={`sort-btn ${sortField === 'publishedAt' ? 'active' : ''}`}
                title="按发布时间排序"
              >
                发布时间 {getSortIcon('publishedAt')}
              </button>
              
              <button
                onClick={() => handleSort('viewCount')}
                className={`sort-btn ${sortField === 'viewCount' ? 'active' : ''}`}
                title="按阅读量排序"
              >
                阅读量 {getSortIcon('viewCount')}
              </button>
              
              <button
                onClick={() => handleSort('title')}
                className={`sort-btn ${sortField === 'title' ? 'active' : ''}`}
                title="按标题排序"
              >
                标题 {getSortIcon('title')}
              </button>
            </div>

            <div className="view-mode-controls">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="网格视图"
              >
                <Grid size={16} />
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="列表视图"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="blog-post-list-body">
        {showCategoryFilter && (
          <aside className="blog-post-list-sidebar">
            <CategoryFilter
              categories={categories}
              selectedCategory={filter.category}
              onCategorySelect={handleCategorySelect}
              loading={categoriesLoading}
            />
          </aside>
        )}

        <main className="blog-post-list-main">
          {loading && posts.length === 0 ? (
            <div className="blog-post-list-loading">
              <p>正在加载文章...</p>
            </div>
          ) : (
            <>
              <div className={`blog-post-grid ${viewMode}`}>
                {posts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    showActions={showActions}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>

              {posts.length === 0 && !loading && (
                <div className="blog-post-list-empty">
                  <p>暂无文章</p>
                </div>
              )}

              {hasMore && (
                <div className="blog-post-list-footer">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="load-more-btn"
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}

              <div className="blog-post-list-pagination-info">
                <p>
                  显示 {posts.length} / {pagination.total} 篇文章
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogPostList;