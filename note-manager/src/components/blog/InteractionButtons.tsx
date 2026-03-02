// Like and bookmark functionality components

import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Share, Eye, MessageSquare } from 'lucide-react';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { SocialInteraction, InteractionType } from '../../types/blog/comment';

interface InteractionButtonsProps {
  postId: string;
  initialLikes?: number;
  initialBookmarks?: number;
  initialShares?: number;
  views?: number;
  comments?: number;
  className?: string;
  showCounts?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
}

export const InteractionButtons: React.FC<InteractionButtonsProps> = ({
  postId,
  initialLikes = 0,
  initialBookmarks = 0,
  initialShares = 0,
  views = 0,
  comments = 0,
  className = '',
  showCounts = true,
  size = 'md',
  variant = 'default'
}) => {
  const { user, isAuthenticated } = useBlogAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarks);
  const [shareCount, setShareCount] = useState(initialShares);
  const [loading, setLoading] = useState(false);

  // Check user's interaction status on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      checkUserInteractions();
    }
  }, [isAuthenticated, user, postId]);

  // Check if user has already liked/bookmarked this post
  const checkUserInteractions = async () => {
    try {
      // Mock API call - replace with actual service
      const userInteractions = {
        hasLiked: false,
        hasBookmarked: false
      };
      
      setIsLiked(userInteractions.hasLiked);
      setIsBookmarked(userInteractions.hasBookmarked);
    } catch (error) {
      console.error('Failed to check user interactions:', error);
    }
  };

  // Handle like action
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Could trigger login modal here
      return;
    }

    if (loading) return;

    setLoading(true);
    const newLikedState = !isLiked;

    try {
      // Optimistic update
      setIsLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

      // API call - replace with actual service
      const interaction: Partial<SocialInteraction> = {
        userId: user!.id,
        targetId: postId,
        targetType: 'post',
        type: InteractionType.LIKE,
        createdAt: new Date()
      };

      if (newLikedState) {
        // Create like
        console.log('Creating like:', interaction);
      } else {
        // Remove like
        console.log('Removing like:', postId);
      }

      // Track the interaction for analytics
      trackInteraction('like', newLikedState);

    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
      console.error('Failed to toggle like:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle bookmark action
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return;
    }

    if (loading) return;

    setLoading(true);
    const newBookmarkedState = !isBookmarked;

    try {
      // Optimistic update
      setIsBookmarked(newBookmarkedState);
      setBookmarkCount(prev => newBookmarkedState ? prev + 1 : prev - 1);

      // API call - replace with actual service
      const interaction: Partial<SocialInteraction> = {
        userId: user!.id,
        targetId: postId,
        targetType: 'post',
        type: InteractionType.BOOKMARK,
        createdAt: new Date()
      };

      if (newBookmarkedState) {
        // Create bookmark
        console.log('Creating bookmark:', interaction);
      } else {
        // Remove bookmark
        console.log('Removing bookmark:', postId);
      }

      // Track the interaction
      trackInteraction('bookmark', newBookmarkedState);

    } catch (error) {
      // Revert optimistic update on error
      setIsBookmarked(!newBookmarkedState);
      setBookmarkCount(prev => newBookmarkedState ? prev - 1 : prev + 1);
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle share action
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const url = `${window.location.origin}/post/${postId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          url: url
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        // Could show toast notification here
      }

      // Update share count and track interaction
      setShareCount(prev => prev + 1);
      trackInteraction('share', true);

    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  // Track interaction for analytics
  const trackInteraction = async (type: string, added: boolean) => {
    try {
      // Analytics tracking would go here
      console.log(`Tracked ${type} interaction:`, { postId, added, userId: user?.id });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20
  }[size];

  if (variant === 'minimal') {
    return (
      <div className={`interaction-buttons minimal ${size} ${className}`}>
        <button
          onClick={handleLike}
          className={`interaction-btn like ${isLiked ? 'active' : ''}`}
          disabled={loading || !isAuthenticated}
          title={!isAuthenticated ? 'Sign in to like' : isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={iconSize} />
        </button>

        <button
          onClick={handleBookmark}
          className={`interaction-btn bookmark ${isBookmarked ? 'active' : ''}`}
          disabled={loading || !isAuthenticated}
          title={!isAuthenticated ? 'Sign in to bookmark' : isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark size={iconSize} />
        </button>

        <button
          onClick={handleShare}
          className="interaction-btn share"
          title="Share"
        >
          <Share size={iconSize} />
        </button>
      </div>
    );
  }

  return (
    <div className={`interaction-buttons ${variant} ${size} ${className}`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        className={`interaction-btn like ${isLiked ? 'active' : ''}`}
        disabled={loading || !isAuthenticated}
        title={!isAuthenticated ? 'Sign in to like posts' : isLiked ? 'Unlike this post' : 'Like this post'}
      >
        <Heart size={iconSize} />
        {showCounts && <span className="count">{likeCount}</span>}
        {variant === 'detailed' && (
          <span className="label">{likeCount === 1 ? 'Like' : 'Likes'}</span>
        )}
      </button>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        className={`interaction-btn bookmark ${isBookmarked ? 'active' : ''}`}
        disabled={loading || !isAuthenticated}
        title={!isAuthenticated ? 'Sign in to bookmark posts' : isBookmarked ? 'Remove from bookmarks' : 'Bookmark this post'}
      >
        <Bookmark size={iconSize} />
        {showCounts && variant === 'detailed' && (
          <span className="count">{bookmarkCount}</span>
        )}
        {variant === 'detailed' && (
          <span className="label">Bookmark</span>
        )}
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="interaction-btn share"
        title="Share this post"
      >
        <Share size={iconSize} />
        {showCounts && <span className="count">{shareCount}</span>}
        {variant === 'detailed' && (
          <span className="label">{shareCount === 1 ? 'Share' : 'Shares'}</span>
        )}
      </button>

      {/* Read-only stats */}
      {variant === 'detailed' && (
        <>
          {/* Views */}
          {views > 0 && (
            <div className="stat-item views">
              <Eye size={iconSize} />
              <span className="count">{views}</span>
              <span className="label">{views === 1 ? 'View' : 'Views'}</span>
            </div>
          )}

          {/* Comments */}
          {comments > 0 && (
            <div className="stat-item comments">
              <MessageSquare size={iconSize} />
              <span className="count">{comments}</span>
              <span className="label">{comments === 1 ? 'Comment' : 'Comments'}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Bookmark button standalone component
interface BookmarkButtonProps {
  postId: string;
  isBookmarked?: boolean;
  onToggle?: (bookmarked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  postId,
  isBookmarked: initialBookmarked = false,
  onToggle,
  size = 'md',
  className = ''
}) => {
  const { user, isAuthenticated } = useBlogAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) return;
    if (loading) return;

    setLoading(true);
    const newState = !isBookmarked;

    try {
      setIsBookmarked(newState);
      
      // API call would go here
      console.log(`${newState ? 'Bookmarked' : 'Unbookmarked'} post:`, postId);
      
      onToggle?.(newState);
    } catch (error) {
      setIsBookmarked(!newState);
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20
  }[size];

  return (
    <button
      onClick={handleToggle}
      className={`bookmark-btn ${size} ${isBookmarked ? 'active' : ''} ${className}`}
      disabled={loading || !isAuthenticated}
      title={!isAuthenticated ? 'Sign in to bookmark' : isBookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      <Bookmark size={iconSize} />
    </button>
  );
};

// Like button standalone component
interface LikeButtonProps {
  postId: string;
  initialCount?: number;
  isLiked?: boolean;
  onToggle?: (liked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  initialCount = 0,
  isLiked: initialLiked = false,
  onToggle,
  size = 'md',
  showCount = true,
  className = ''
}) => {
  const { user, isAuthenticated } = useBlogAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) return;
    if (loading) return;

    setLoading(true);
    const newLikedState = !isLiked;
    const newCount = newLikedState ? count + 1 : count - 1;

    try {
      setIsLiked(newLikedState);
      setCount(newCount);
      
      // API call would go here
      console.log(`${newLikedState ? 'Liked' : 'Unliked'} post:`, postId);
      
      onToggle?.(newLikedState, newCount);
    } catch (error) {
      setIsLiked(!newLikedState);
      setCount(newLikedState ? newCount - 1 : newCount + 1);
      console.error('Failed to toggle like:', error);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20
  }[size];

  return (
    <button
      onClick={handleToggle}
      className={`like-btn ${size} ${isLiked ? 'active' : ''} ${className}`}
      disabled={loading || !isAuthenticated}
      title={!isAuthenticated ? 'Sign in to like' : isLiked ? 'Unlike' : 'Like'}
    >
      <Heart size={iconSize} />
      {showCount && count > 0 && (
        <span className="count">{count}</span>
      )}
    </button>
  );
};