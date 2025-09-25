// Comment system with nested replies

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Reply, 
  Heart, 
  Flag, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Send,
  User,
  Shield,
  AlertCircle,
  Check,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { Comment, CommentStatus, CreateCommentData } from '../../types/blog/comment';
import { Permission } from '../../types/blog/user';
import { PermissionRenderer } from '../auth/guards';

// Comment form validation
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentComponentProps {
  comment: Comment;
  level?: number;
  maxDepth?: number;
  onReply?: (parentId: string, content: string) => Promise<void>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onLike?: (commentId: string) => Promise<void>;
  onReport?: (commentId: string, reason: string) => Promise<void>;
  onModerate?: (commentId: string, action: 'approve' | 'reject' | 'spam') => Promise<void>;
}

const CommentComponent: React.FC<CommentComponentProps> = ({
  comment,
  level = 0,
  maxDepth = 3,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onReport,
  onModerate
}) => {
  const { user, hasPermission } = useBlogAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isExpanded, setIsExpanded] = useState(level < 2);

  // Reply form
  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    formState: { errors: replyErrors },
    reset: resetReply
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  });

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: comment.content }
  });

  useEffect(() => {
    setEditValue('content', comment.content);
  }, [comment.content, setEditValue]);

  // Handle reply submission
  const onSubmitReply = async (data: CommentFormData) => {
    if (onReply) {
      try {
        await onReply(comment.id, data.content);
        resetReply();
        setShowReplyForm(false);
      } catch (error) {
        console.error('Failed to submit reply:', error);
      }
    }
  };

  // Handle edit submission
  const onSubmitEdit = async (data: CommentFormData) => {
    if (onEdit) {
      try {
        await onEdit(comment.id, data.content);
        setShowEditForm(false);
      } catch (error) {
        console.error('Failed to edit comment:', error);
      }
    }
  };

  // Handle like toggle
  const handleLike = async () => {
    if (!user || !onLike) return;
    
    try {
      await onLike(comment.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  // Handle moderation actions
  const handleModerate = async (action: 'approve' | 'reject' | 'spam') => {
    if (!onModerate) return;
    
    try {
      await onModerate(comment.id, action);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to moderate comment:', error);
    }
  };

  const canEdit = user && (user.id === comment.authorId || hasPermission(Permission.MODERATE_COMMENTS));
  const canDelete = user && (user.id === comment.authorId || hasPermission(Permission.MODERATE_COMMENTS));
  const canModerate = user && hasPermission(Permission.MODERATE_COMMENTS);
  const canReply = user && level < maxDepth && onReply;

  const statusColor = {
    [CommentStatus.APPROVED]: 'approved',
    [CommentStatus.PENDING]: 'pending',
    [CommentStatus.REJECTED]: 'rejected',
    [CommentStatus.SPAM]: 'spam',
    [CommentStatus.HIDDEN]: 'hidden'
  }[comment.status];

  return (
    <div className={`comment ${statusColor} level-${level}`}>
      <div className="comment-main">
        {/* Avatar */}
        <div className="comment-avatar">
          {comment.author?.avatar ? (
            <img 
              src={comment.author.avatar} 
              alt={comment.author.displayName || comment.author.username}
            />
          ) : (
            <div className="default-avatar">
              <User size={24} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="comment-content">
          {/* Header */}
          <div className="comment-header">
            <div className="comment-author">
              <span className="author-name">
                {comment.author?.displayName || comment.author?.username || 'Anonymous'}
              </span>
              {comment.author?.role && (
                <span className={`role-badge ${comment.author.role}`}>
                  {comment.author.role === 'admin' && <Shield size={12} />}
                  {comment.author.role}
                </span>
              )}
            </div>

            <div className="comment-meta">
              <time dateTime={comment.createdAt.toISOString()}>
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </time>
              
              {comment.isEdited && (
                <span className="edited-indicator" title={`Edited ${comment.editedAt ? formatDistanceToNow(new Date(comment.editedAt), { addSuffix: true }) : ''}`}>
                  <Edit size={12} />
                  edited
                </span>
              )}

              {/* Status Indicator */}
              {comment.status !== CommentStatus.APPROVED && (
                <span className={`status-badge ${statusColor}`}>
                  {comment.status === CommentStatus.PENDING && <Clock size={12} />}
                  {comment.status === CommentStatus.REJECTED && <AlertCircle size={12} />}
                  {comment.status === CommentStatus.SPAM && <Flag size={12} />}
                  {comment.status}
                </span>
              )}
            </div>

            {/* Actions Menu */}
            <div className="comment-actions">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="action-btn"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="actions-menu">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setShowEditForm(true);
                        setShowMenu(false);
                      }}
                      className="menu-item"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="menu-item danger"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}

                  {user && user.id !== comment.authorId && (
                    <button
                      onClick={() => {
                        if (onReport) onReport(comment.id, 'inappropriate');
                        setShowMenu(false);
                      }}
                      className="menu-item"
                    >
                      <Flag size={14} />
                      Report
                    </button>
                  )}

                  {canModerate && comment.status === CommentStatus.PENDING && (
                    <>
                      <div className="menu-divider" />
                      <button
                        onClick={() => handleModerate('approve')}
                        className="menu-item"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerate('reject')}
                        className="menu-item"
                      >
                        <AlertCircle size={14} />
                        Reject
                      </button>
                      <button
                        onClick={() => handleModerate('spam')}
                        className="menu-item danger"
                      >
                        <Flag size={14} />
                        Mark as Spam
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="comment-body">
            {showEditForm ? (
              <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="edit-form">
                <textarea
                  {...registerEdit('content')}
                  className={`edit-textarea ${editErrors.content ? 'error' : ''}`}
                  rows={3}
                />
                {editErrors.content && (
                  <span className="error-message">{editErrors.content.message}</span>
                )}
                
                <div className="edit-actions">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                  >
                    <Check size={14} />
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="comment-text">
                {comment.content}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="comment-footer">
            <div className="comment-stats">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`stat-btn ${isLiked ? 'active' : ''}`}
                disabled={!user}
              >
                <Heart size={14} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>

              {/* Reply Button */}
              {canReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="stat-btn"
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}

              {/* Reply Count */}
              {comment.replyCount > 0 && level < maxDepth && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="replies-toggle"
                >
                  <MessageSquare size={14} />
                  {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                  {isExpanded ? ' (hide)' : ' (show)'}
                </button>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleSubmitReply(onSubmitReply)} className="reply-form">
              <div className="reply-input-container">
                <div className="reply-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.displayName || user.username} />
                  ) : (
                    <div className="default-avatar">
                      <User size={20} />
                    </div>
                  )}
                </div>
                
                <div className="reply-input-wrapper">
                  <textarea
                    {...registerReply('content')}
                    placeholder={`Reply to ${comment.author?.displayName || comment.author?.username || 'this comment'}...`}
                    className={`reply-textarea ${replyErrors.content ? 'error' : ''}`}
                    rows={3}
                  />
                  {replyErrors.content && (
                    <span className="error-message">{replyErrors.content.message}</span>
                  )}
                </div>
              </div>
              
              <div className="reply-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    resetReply();
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  <Send size={14} />
                  Reply
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && isExpanded && level < maxDepth && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentComponent
              key={reply.id}
              comment={reply}
              level={level + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onReport={onReport}
              onModerate={onModerate}
            />
          ))}
        </div>
      )}

      {/* Menu Backdrop */}
      {showMenu && (
        <div 
          className="menu-backdrop"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

interface CommentSectionProps {
  postId: string;
  allowComments?: boolean;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  allowComments = true,
  className = ''
}) => {
  const { user, isAuthenticated } = useBlogAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  
  // New comment form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  });

  // Load comments
  useEffect(() => {
    loadComments();
  }, [postId, sortBy]);

  const loadComments = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual service
      const mockComments: Comment[] = [];
      setComments(mockComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit new comment
  const onSubmitComment = async (data: CommentFormData) => {
    if (!user) return;

    try {
      // Mock API call
      const newComment: Comment = {
        id: Date.now().toString(),
        content: data.content,
        postId,
        authorId: user.id,
        parentId: null,
        status: CommentStatus.APPROVED,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
        editedAt: null,
        createdAt: new Date(),
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role
        }
      };

      setComments(prev => [newComment, ...prev]);
      reset();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  // Comment actions
  const handleReply = async (parentId: string, content: string) => {
    // Implementation for reply
    console.log('Reply to:', parentId, content);
  };

  const handleEdit = async (commentId: string, content: string) => {
    // Implementation for edit
    console.log('Edit comment:', commentId, content);
  };

  const handleDelete = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleLike = async (commentId: string) => {
    // Implementation for like
    console.log('Like comment:', commentId);
  };

  const handleReport = async (commentId: string, reason: string) => {
    // Implementation for report
    console.log('Report comment:', commentId, reason);
  };

  const handleModerate = async (commentId: string, action: 'approve' | 'reject' | 'spam') => {
    // Implementation for moderation
    console.log('Moderate comment:', commentId, action);
  };

  if (!allowComments) {
    return (
      <div className={`comment-section disabled ${className}`}>
        <div className="comments-disabled">
          <MessageSquare size={24} />
          <p>Comments are disabled for this post.</p>
        </div>
      </div>
    );
  }

  return (
    <section className={`comment-section ${className}`}>
      {/* Header */}
      <div className="comments-header">
        <h3>
          <MessageSquare size={20} />
          Comments ({comments.length})
        </h3>

        {comments.length > 0 && (
          <div className="comments-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="popular">Most popular</option>
            </select>
          </div>
        )}
      </div>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit(onSubmitComment)} className="new-comment-form">
          <div className="comment-input-container">
            <div className="comment-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.displayName || user.username} />
              ) : (
                <div className="default-avatar">
                  <User size={24} />
                </div>
              )}
            </div>
            
            <div className="comment-input-wrapper">
              <textarea
                {...register('content')}
                placeholder="Share your thoughts..."
                className={`comment-textarea ${errors.content ? 'error' : ''}`}
                rows={4}
              />
              {errors.content && (
                <span className="error-message">{errors.content.message}</span>
              )}
            </div>
          </div>
          
          <div className="comment-actions">
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Send size={16} />
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <p>Please sign in to leave a comment.</p>
          <div className="login-actions">
            <a href="/auth/login" className="btn btn-primary">
              Sign In
            </a>
            <a href="/auth/register" className="btn btn-outline">
              Sign Up
            </a>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="comments-loading">
          <div className="loading-spinner"></div>
          <p>Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="comments-list">
          {comments.map(comment => (
            <CommentComponent
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLike={handleLike}
              onReport={handleReport}
              onModerate={handleModerate}
            />
          ))}
        </div>
      ) : (
        <div className="no-comments">
          <MessageSquare size={48} />
          <h4>No comments yet</h4>
          <p>Be the first to share your thoughts!</p>
        </div>
      )}
    </section>
  );
};