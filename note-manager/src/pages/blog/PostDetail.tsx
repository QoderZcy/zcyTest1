// Post detail page component with full content display

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share, 
  Tag,
  Calendar,
  User,
  Edit,
  MoreHorizontal,
  Flag,
  ExternalLink,
  Copy,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useBlog } from '../../contexts/blog/BlogContext';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { BlogPost } from '../../types/blog/post';
import { Permission } from '../../types/blog/user';
import { PermissionRenderer } from '../auth/guards';
import { PostBreadcrumb } from '../common/Breadcrumb';
import { formatDistanceToNow, format } from 'date-fns';

interface PostDetailProps {
  className?: string;
}

export const PostDetail: React.FC<PostDetailProps> = ({ className = '' }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { fetchPost, loading, error } = useBlog();
  const { user, isAuthenticated } = useBlogAuth();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  // Load post data
  useEffect(() => {
    if (slug) {
      fetchPost(slug).then(fetchedPost => {
        if (fetchedPost) {
          setPost(fetchedPost);
          setLikeCount(fetchedPost.likeCount);
          setViewCount(fetchedPost.viewCount);
          
          // Track page view
          trackPageView(fetchedPost.id);
        }
      });
    }
  }, [slug, fetchPost]);

  // Track page view
  const trackPageView = async (postId: string) => {
    try {
      // API call to track page view would go here
      setViewCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  // Handle like action
  const handleLike = async () => {
    if (!isAuthenticated || !post) {
      return;
    }

    try {
      // API call to like/unlike post would go here
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Handle bookmark action
  const handleBookmark = async () => {
    if (!isAuthenticated || !post) {
      return;
    }

    try {
      // API call to bookmark/unbookmark post would go here
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  // Handle share actions
  const handleShare = async (platform?: string) => {
    if (!post) return;

    const url = `${window.location.origin}/post/${post.slug}`;
    const title = post.title;
    const text = post.excerpt || title;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
      default:
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
          } catch (error) {
            console.error('Error sharing:', error);
          }
        } else {
          navigator.clipboard.writeText(url);
        }
    }
    
    setShowShareMenu(false);
  };

  // Custom markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h1>,
    h2: ({ children }: any) => <h2 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h2>,
    h3: ({ children }: any) => <h3 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h3>,
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-error">
        <h1>Post Not Found</h1>
        <p>The post you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
  const canEdit = user && (user.id === post.authorId || user.role === 'admin' || user.role === 'super_admin');

  return (
    <article className={`post-detail ${className}`}>
      {/* Breadcrumb */}
      <PostBreadcrumb 
        category={post.category?.name}
        postTitle={post.title}
      />

      {/* Header */}
      <header className="post-header">
        <div className="header-actions">
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="action-group">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`action-btn ${isLiked ? 'active' : ''}`}
              disabled={!isAuthenticated}
              title={!isAuthenticated ? 'Login to like posts' : 'Like this post'}
            >
              <Heart size={16} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`action-btn ${isBookmarked ? 'active' : ''}`}
              disabled={!isAuthenticated}
              title={!isAuthenticated ? 'Login to bookmark posts' : 'Bookmark this post'}
            >
              <Bookmark size={16} />
            </button>

            {/* Share Button */}
            <div className="share-container">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="action-btn"
              >
                <Share size={16} />
              </button>

              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={() => handleShare('twitter')} className="share-item">
                    <Twitter size={16} />
                    Twitter
                  </button>
                  <button onClick={() => handleShare('facebook')} className="share-item">
                    <Facebook size={16} />
                    Facebook
                  </button>
                  <button onClick={() => handleShare('linkedin')} className="share-item">
                    <Linkedin size={16} />
                    LinkedIn
                  </button>
                  <button onClick={() => handleShare('copy')} className="share-item">
                    <Copy size={16} />
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* More Actions */}
            <div className="more-container">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="action-btn"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMoreMenu && (
                <div className="more-menu">
                  <button
                    onClick={() => window.open(`/post/${post.slug}`, '_blank')}
                    className="menu-item"
                  >
                    <ExternalLink size={14} />
                    Open in new tab
                  </button>

                  {canEdit && (
                    <>
                      <div className="menu-divider" />
                      <Link
                        to={`/author/posts/edit/${post.id}`}
                        className="menu-item"
                      >
                        <Edit size={14} />
                        Edit post
                      </Link>
                    </>
                  )}

                  <div className="menu-divider" />
                  <button className="menu-item">
                    <Flag size={14} />
                    Report content
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Meta */}
        <div className="post-meta">
          {/* Category */}
          {post.category && (
            <Link 
              to={`/category/${post.category.slug}`}
              className="post-category"
            >
              {post.category.name}
            </Link>
          )}

          {/* Post Type */}
          <span className="post-type">
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </span>
        </div>

        {/* Title */}
        <h1 className="post-title">{post.title}</h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="post-excerpt">{post.excerpt}</p>
        )}

        {/* Author and Publication Info */}
        <div className="post-info">
          {/* Author */}
          {post.author && (
            <Link 
              to={`/author/${post.author.username}`}
              className="author-info"
            >
              {post.author.avatar ? (
                <img 
                  src={post.author.avatar} 
                  alt={post.author.displayName || post.author.username}
                  className="author-avatar"
                />
              ) : (
                <div className="author-avatar">
                  <User size={20} />
                </div>
              )}
              <div className="author-details">
                <span className="author-name">
                  {post.author.displayName || post.author.username}
                </span>
                <span className="author-role">{post.author.role}</span>
              </div>
            </Link>
          )}

          {/* Publication Date */}
          <div className="publication-info">
            <div className="pub-date">
              <Calendar size={14} />
              <time dateTime={publishedDate.toISOString()}>
                {format(publishedDate, 'MMMM d, yyyy')}
              </time>
              <span className="relative-time">
                ({formatDistanceToNow(publishedDate, { addSuffix: true })})
              </span>
            </div>

            {/* Reading Time */}
            <div className="reading-time">
              <Clock size={14} />
              <span>{post.readingTime.text}</span>
            </div>

            {/* View Count */}
            <div className="view-count">
              <Eye size={14} />
              <span>{viewCount} views</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/tag/${tag}`}
                className="post-tag"
              >
                <Tag size={12} />
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="post-featured-image">
          <img 
            src={post.featuredImage} 
            alt={post.featuredImageAlt || post.title}
          />
          {post.featuredImageAlt && (
            <figcaption>{post.featuredImageAlt}</figcaption>
          )}
        </div>
      )}

      {/* Content */}
      <div className="post-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
          className="markdown-content"
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Footer */}
      <footer className="post-footer">
        {/* Updated Date */}
        {post.updatedAt && new Date(post.updatedAt) > new Date(post.createdAt) && (
          <div className="last-updated">
            <p>
              Last updated on {format(new Date(post.updatedAt), 'MMMM d, yyyy')}
              {post.lastEditedBy && (
                <span> by {post.lastEditedBy}</span>
              )}
            </p>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="engagement-stats">
          <div className="stats-row">
            <div className="stat">
              <span className="stat-value">{likeCount}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat">
              <span className="stat-value">{post.commentCount}</span>
              <span className="stat-label">Comments</span>
            </div>
            <div className="stat">
              <span className="stat-value">{post.shareCount}</span>
              <span className="stat-label">Shares</span>
            </div>
            <div className="stat">
              <span className="stat-value">{viewCount}</span>
              <span className="stat-label">Views</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="cta-section">
            <h3>Join the conversation</h3>
            <p>Sign up to like, comment, and engage with this post.</p>
            <div className="cta-buttons">
              <Link to="/auth/register" className="btn btn-primary">
                Sign Up
              </Link>
              <Link to="/auth/login" className="btn btn-outline">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </footer>

      {/* Close menus when clicking outside */}
      {(showShareMenu || showMoreMenu) && (
        <div 
          className="menu-backdrop"
          onClick={() => {
            setShowShareMenu(false);
            setShowMoreMenu(false);
          }}
        />
      )}

      {/* Comments Section Placeholder */}
      <section className="comments-section">
        <h3>
          <MessageSquare size={20} />
          Comments ({post.commentCount})
        </h3>
        
        {post.allowComments ? (
          <div className="comments-placeholder">
            <p>Comments component will be implemented here</p>
          </div>
        ) : (
          <div className="comments-disabled">
            <p>Comments are disabled for this post.</p>
          </div>
        )}
      </section>

      {/* Related Posts Placeholder */}
      <section className="related-posts">
        <h3>Related Posts</h3>
        <div className="related-posts-placeholder">
          <p>Related posts will be shown here</p>
        </div>
      </section>
    </article>
  );
};