// Blog home page component with post listings and featured content

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  Eye, 
  MessageSquare, 
  Heart, 
  ArrowRight,
  Filter,
  Grid,
  List,
  Search,
  Star
} from 'lucide-react';
import { useBlog } from '../../contexts/blog/BlogContext';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { BlogPost, PostType } from '../../types/blog/post';
import { PostCard } from '../blog/PostCard';
import { Breadcrumb } from '../common/Breadcrumb';

interface BlogHomeProps {
  className?: string;
}

export const BlogHome: React.FC<BlogHomeProps> = ({ className = '' }) => {
  const { 
    posts, 
    featuredPosts, 
    categories, 
    loading, 
    fetchPosts, 
    fetchFeaturedPosts,
    filter,
    setFilter,
    currentPage,
    totalPages,
    hasNextPage,
    loadMore
  } = useBlog();
  
  const { user } = useBlogAuth();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<PostType | ''>('');

  // Load initial data
  useEffect(() => {
    fetchPosts();
    fetchFeaturedPosts();
  }, [fetchPosts, fetchFeaturedPosts]);

  // Handle filter changes
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFilter({ categoryId, page: 1 });
  };

  const handleTypeChange = (type: PostType | '') => {
    setSelectedType(type);
    setFilter({ 
      type: type ? [type] : [],
      page: 1 
    });
  };

  const handleSortChange = (sortBy: string) => {
    setFilter({ 
      sortBy: sortBy as any,
      page: 1 
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      loadMore();
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="blog-home-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className={`blog-home ${className}`}>
      {/* Hero Section with Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <Star size={16} />
                Featured
              </div>
              <h1>Welcome to Our Blog</h1>
              <p>Discover insightful articles, tutorials, and stories from our community</p>
            </div>
            
            <div className="featured-posts">
              {featuredPosts.slice(0, 3).map((post, index) => (
                <div key={post.id} className={`featured-post ${index === 0 ? 'main' : 'secondary'}`}>
                  <Link to={`/post/${post.slug}`} className="featured-post-link">
                    {post.featuredImage && (
                      <div className="featured-image">
                        <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} />
                      </div>
                    )}
                    
                    <div className="featured-content">
                      <div className="post-meta">
                        <span className="post-type">{post.type}</span>
                        <span className="reading-time">
                          <Clock size={12} />
                          {post.readingTime.text}
                        </span>
                      </div>
                      
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      
                      <div className="post-stats">
                        <span>
                          <Eye size={12} />
                          {post.viewCount}
                        </span>
                        <span>
                          <Heart size={12} />
                          {post.likeCount}
                        </span>
                        <span>
                          <MessageSquare size={12} />
                          {post.commentCount}
                        </span>
                      </div>
                      
                      {post.author && (
                        <div className="author-info">
                          <img 
                            src={post.author.avatar || '/default-avatar.png'} 
                            alt={post.author.displayName || post.author.username}
                            className="author-avatar"
                          />
                          <span>{post.author.displayName || post.author.username}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Blog', isCurrentPage: true }
            ]}
            showHome={true}
          />

          {/* Filters and Controls */}
          <div className="content-header">
            <div className="header-left">
              <h2>Latest Posts</h2>
              <p>
                {posts.length > 0 && (
                  <>Showing {posts.length} of {posts.length} posts</>
                )}
              </p>
            </div>

            <div className="header-controls">
              {/* View Mode Toggle */}
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Filters */}
              <div className="filters">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value as PostType | '')}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  {Object.values(PostType).map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="publishedAt">Latest</option>
                  <option value="viewCount">Most Viewed</option>
                  <option value="likeCount">Most Liked</option>
                  <option value="commentCount">Most Discussed</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Posts Grid/List */}
          {posts.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>No posts found</h3>
              <p>Try adjusting your filters or check back later for new content.</p>
            </div>
          ) : (
            <>
              <div className={`posts-container ${viewMode}`}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    displayMode={viewMode}
                    showAuthor={true}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="load-more-container">
                  <button
                    onClick={handleLoadMore}
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <>Loading...</>
                    ) : (
                      <>
                        Load More Posts
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="pagination-info">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Trending Section */}
      <aside className="trending-section">
        <div className="trending-container">
          <h3>
            <TrendingUp size={20} />
            Trending Now
          </h3>
          
          <div className="trending-posts">
            {posts
              .filter(post => post.viewCount > 100) // Simple trending logic
              .slice(0, 5)
              .map((post, index) => (
                <Link
                  key={post.id}
                  to={`/post/${post.slug}`}
                  className="trending-post"
                >
                  <div className="trending-number">
                    {index + 1}
                  </div>
                  <div className="trending-content">
                    <h4>{post.title}</h4>
                    <div className="trending-stats">
                      <span>
                        <Eye size={12} />
                        {post.viewCount}
                      </span>
                      <span>
                        <Heart size={12} />
                        {post.likeCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </aside>

      {/* Newsletter Signup */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h3>Stay Updated</h3>
            <p>Get the latest posts delivered right to your inbox</p>
            
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
            
            <p className="newsletter-disclaimer">
              We respect your privacy. No spam, ever.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};