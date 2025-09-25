import React, { useState, useEffect } from 'react';
import { Comment, CreateCommentRequest } from '../../types';
import { LoadingSpinner, Button } from './';
import CommentItem from './CommentItem';
import { useAuth } from '../../contexts/AuthContext';
import { commentService } from '../../services';

interface CommentSectionProps {
  articleId: string;
  className?: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  articleId,
  className = ''
}) => {
  const { state: authState } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'likeCount'>('createdAt');

  useEffect(() => {
    loadComments();
  }, [articleId, sortBy]);

  const loadComments = async (pageNumber = 1, reset = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await commentService.getComments({
        articleId,
        page: pageNumber,
        limit: 10,
        sortBy,
        sortOrder: 'desc',
      });
      
      const newComments = response.items;
      
      if (reset) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }
      
      setHasMore(response.hasNext);
      setPage(pageNumber);
    } catch (error) {
      setError('加载评论失败');
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !authState.isAuthenticated) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const commentData: CreateCommentRequest = {
        content: newComment.trim(),
        articleId,
      };
      
      const comment = await commentService.createComment(commentData);
      
      // Add the new comment to the beginning of the list
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      setError('发表评论失败');
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentComment: Comment) => {
    if (!authState.isAuthenticated) {
      return;
    }

    try {
      const replyData: CreateCommentRequest = {
        content: parentComment.content,
        articleId,
        parentId: parentComment.parentId || parentComment.id,
      };
      
      const reply = await commentService.createComment(replyData);
      
      // Update the parent comment's replies
      setComments(prev => prev.map(comment => {
        if (comment.id === parentComment.id) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply]
          };
        }
        return comment;
      }));
    } catch (error) {
      setError('回复失败');
      console.error('Failed to reply:', error);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!authState.isAuthenticated) {
      return;
    }

    try {
      const response = await commentService.likeComment(commentId);
      
      // Update the comment's like status
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likeCount: response.likeCount,
            isLiked: response.liked
          };
        }
        // Also check replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId 
                ? { ...reply, likeCount: response.likeCount, isLiked: response.liked }
                : reply
            )
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      
      // Remove the comment from the list
      setComments(prev => prev.filter(comment => {
        if (comment.id === commentId) {
          return false;
        }
        // Also remove from replies
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply.id !== commentId);
        }
        return true;
      }));
    } catch (error) {
      setError('删除评论失败');
      console.error('Failed to delete comment:', error);
    }
  };

  const loadMoreComments = () => {
    loadComments(page + 1, false);
  };

  return (
    <div className={`${className}`}>
      {/* Comment Header */}
      <div className=\"flex items-center justify-between mb-6\">
        <h3 className=\"text-xl font-semibold text-secondary-900\">
          评论 ({comments.length})
        </h3>
        
        {/* Sort Options */}
        <div className=\"flex items-center space-x-2\">
          <span className=\"text-sm text-secondary-600\">排序：</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'likeCount')}
            className=\"text-sm border border-secondary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500\"
          >
            <option value=\"createdAt\">最新</option>
            <option value=\"likeCount\">最热</option>
          </select>
        </div>
      </div>

      {/* Comment Form */}
      {authState.isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className=\"mb-8\">
          <div className=\"flex space-x-3\">
            <div className=\"flex-shrink-0\">
              {authState.user?.avatar ? (
                <img
                  src={authState.user.avatar}
                  alt={authState.user.username}
                  className=\"w-8 h-8 rounded-full object-cover\"
                />
              ) : (
                <div className=\"w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center\">
                  <span className=\"text-white text-sm font-medium\">
                    {authState.user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className=\"flex-1\">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder=\"写下您的评论...\"
                className=\"w-full px-3 py-2 border border-secondary-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent\"
                rows={4}
                maxLength={1000}
              />
              <div className=\"flex items-center justify-between mt-2\">
                <div className=\"text-xs text-secondary-500\">
                  {newComment.length}/1000
                </div>
                <Button
                  type=\"submit\"
                  disabled={!newComment.trim() || isSubmitting}
                  loading={isSubmitting}
                  size=\"sm\"
                >
                  {isSubmitting ? '发表中...' : '发表评论'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className=\"bg-secondary-50 rounded-lg p-6 text-center mb-8\">
          <p className=\"text-secondary-600 mb-4\">请登录后发表评论</p>
          <div className=\"space-x-4\">
            <Button as={Link} to=\"/login\" variant=\"primary\" size=\"sm\">
              登录
            </Button>
            <Button as={Link} to=\"/register\" variant=\"secondary\" size=\"sm\">
              注册
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className=\"bg-red-50 border border-red-200 rounded-md p-4 mb-6\">
          <div className=\"flex\">
            <svg className=\"h-5 w-5 text-red-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z\" />
            </svg>
            <div className=\"ml-3\">
              <p className=\"text-sm text-red-800\">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading && comments.length === 0 ? (
        <div className=\"flex justify-center py-8\">
          <LoadingSpinner size=\"lg\" />
        </div>
      ) : comments.length === 0 ? (
        <div className=\"text-center py-12\">
          <div className=\"text-secondary-500\">
            <svg className=\"w-12 h-12 mx-auto mb-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
            </svg>
            <p className=\"text-lg font-medium text-secondary-700\">暂无评论</p>
            <p className=\"text-sm text-secondary-500 mt-2\">
              成为第一个发表评论的人吧！
            </p>
          </div>
        </div>
      ) : (
        <div className=\"space-y-6\">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
              currentUserId={authState.user?.id}
            />
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className=\"text-center pt-6\">
              <Button
                onClick={loadMoreComments}
                variant=\"outline\"
                loading={loading}
                disabled={loading}
              >
                {loading ? '加载中...' : '加载更多评论'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;