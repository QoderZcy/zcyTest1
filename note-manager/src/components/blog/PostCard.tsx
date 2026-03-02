// Post card component for displaying blog post previews

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Eye, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share, 
  MoreHorizontal,
  Calendar,
  User,
  Tag,
  ExternalLink
} from 'lucide-react';
import { BlogPost } from '../../types/blog/post';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: BlogPost;
  displayMode?: 'grid' | 'list';
  showAuthor?: boolean;
  showActions?: boolean;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  displayMode = 'grid',
  showAuthor = true,
  showActions = true,
  className = ''
}) => {
  const { user, isAuthenticated } = useBlogAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  // Handle like action
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Redirect to login or show login modal
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
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      return;
    }

    try {
      // API call to bookmark/unbookmark post would go here
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  // Handle share action
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: `${window.location.origin}/post/${post.slug}`
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
    }
  };

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
  const isScheduled = post.status === 'scheduled';
  const isDraft = post.status === 'draft';

  return (
    <article className={`post-card ${displayMode} ${className}`}>
      <Link to={`/post/${post.slug}`} className="post-card-link">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="post-image">
            <img 
              src={post.featuredImage} 
              alt={post.featuredImageAlt || post.title}
              loading="lazy"
            />
            
            {/* Post Type Badge */}
            {post.type && (
              <div className="post-type-badge">
                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
              </div>
            )}
            
            {/* Status Badges */}
            {isDraft && (
              <div className="status-badge draft">Draft</div>
            )}
            {isScheduled && (
              <div className="status-badge scheduled">Scheduled</div>
            )}
            {post.isFeatured && (
              <div className="status-badge featured">Featured</div>
            )}
            {post.isPinned && (
              <div className="status-badge pinned">Pinned</div>
            )}
          </div>
        )}

        {/* Post Content */}
        <div className="post-content">
          {/* Category and Tags */}
          <div className="post-taxonomy">
            {post.category && (
              <Link 
                to={`/category/${post.category.slug}`}
                className="post-category"
                onClick={(e) => e.stopPropagation()}
              >
                {post.category.name}
              </Link>
            )}
            
            {post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag}
                    to={`/tag/${tag}`}
                    className="post-tag"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tag size={12} />
                    {tag}
                  </Link>
                ))}
                {post.tags.length > 3 && (
                  <span className="more-tags">
                    +{post.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="post-title">{post.title}</h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="post-excerpt">{post.excerpt}</p>
          )}

          {/* Meta Information */}
          <div className="post-meta">
            <div className="meta-left">
              {/* Author */}
              {showAuthor && post.author && (
                <Link
                  to={`/author/${post.author.username}`}
                  className="post-author"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.author.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.displayName || post.author.username}
                      className="author-avatar"
                    />
                  ) : (
                    <div className="author-avatar">
                      <User size={16} />
                    </div>
                  )}
                  <span>{post.author.displayName || post.author.username}</span>
                </Link>
              )}

              {/* Publication Date */}
              <div className="post-date">
                <Calendar size={12} />
                {isScheduled ? (
                  <span>Scheduled for {formatDistanceToNow(new Date(post.scheduledAt!))}</span>
                ) : (
                  <time dateTime={publishedDate.toISOString()}>
                    {formatDistanceToNow(publishedDate, { addSuffix: true })}
                  </time>
                )}
              </div>

              {/* Reading Time */}
              <div className="reading-time">
                <Clock size={12} />
                <span>{post.readingTime.text}</span>
              </div>
            </div>

            {/* Post Statistics */}
            <div className="post-stats">
              <span className="stat">
                <Eye size={12} />
                {post.viewCount}
              </span>
              <span className="stat">
                <Heart size={12} />
                {likeCount}
              </span>
              <span className="stat">
                <MessageSquare size={12} />
                {post.commentCount}
              </span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="post-actions">
              <div className="action-buttons">
                <button
                  onClick={handleLike}
                  className={`action-btn ${isLiked ? 'active' : ''}`}
                  title="Like this post"
                >
                  <Heart size={16} />
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>

                <button
                  onClick={handleBookmark}
                  className={`action-btn ${isBookmarked ? 'active' : ''}`}
                  title="Bookmark this post"
                >
                  <Bookmark size={16} />
                </button>

                <button
                  onClick={handleShare}
                  className="action-btn"
                  title="Share this post"
                >
                  <Share size={16} />
                </button>
              </div>

              {/* More Actions Menu */}
              <div className="more-actions">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="action-btn"
                >
                  <MoreHorizontal size={16} />
                </button>

                {showMenu && (
                  <div className="actions-menu">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`/post/${post.slug}`, '_blank');
                        setShowMenu(false);
                      }}
                      className="menu-item"
                    >
                      <ExternalLink size={14} />
                      Open in new tab
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
                        setShowMenu(false);
                      }}
                      className="menu-item"
                    >
                      <Share size={14} />
                      Copy link
                    </button>

                    {user && user.id === post.authorId && (
                      <>
                        <div className="menu-divider" />
                        <Link
                          to={`/author/posts/edit/${post.id}`}
                          className="menu-item"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit post
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Backdrop for closing menu */}
      {showMenu && (
        <div 
          className="menu-backdrop"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(false);
          }}
        />
      )}
    </article>
  );
};