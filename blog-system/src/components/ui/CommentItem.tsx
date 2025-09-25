import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Comment } from '../../types';
import { formatRelativeTime } from '../../utils';
import { Button } from './';

interface CommentItemProps {
  comment: Comment;
  onReply?: (comment: Comment) => void;
  onLike?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
  depth?: number;
  className?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onDelete,
  currentUserId,
  depth = 0,
  className = ''
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUserId === comment.authorId;
  const canReply = depth < 3; // 限制回复深度

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !onReply) return;

    setIsSubmitting(true);
    try {
      await onReply({
        ...comment,
        content: replyContent.trim(),
        parentId: comment.id,
      });
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Reply failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(comment.id);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('确定要删除这条评论吗？')) {
      onDelete(comment.id);
    }
  };

  return (
    <div className={`${className}`} style={{ marginLeft: `${depth * 1.5}rem` }}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author?.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {comment.author?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center space-x-2 mb-1">
            <Link
              to={`/user/${comment.authorId}`}
              className="text-sm font-medium text-secondary-900 hover:text-primary-600 transition-colors duration-200"
            >
              {comment.author?.username}
            </Link>
            <span className="text-sm text-secondary-500">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-secondary-400">
                (已编辑)
              </span>
            )}
          </div>

          {/* Comment Body */}
          <div className="text-secondary-900 mb-2 whitespace-pre-wrap">
            {comment.content}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 text-sm">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors duration-200 ${
                comment.isLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-secondary-500 hover:text-red-600'
              }`}
            >
              <svg
                className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{comment.likeCount}</span>
            </button>

            {/* Reply Button */}
            {canReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-secondary-500 hover:text-primary-600 transition-colors duration-200"
              >
                回复
              </button>
            )}

            {/* Delete Button (for comment owner) */}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-secondary-500 hover:text-red-600 transition-colors duration-200"
              >
                删除
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`回复 @${comment.author?.username}`}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="text-xs text-secondary-500 mt-1">
                    {replyContent.length}/1000
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim() || isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? '发送中...' : '回复'}
                </Button>
              </div>
            </form>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;