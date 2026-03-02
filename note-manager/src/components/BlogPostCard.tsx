import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Eye, 
  Tag, 
  Edit3, 
  Trash2, 
  Archive,
  MoreHorizontal
} from 'lucide-react';
import { BlogPost, PublishStatus } from '../types/blog';

interface BlogPostCardProps {
  post: BlogPost;
  showActions?: boolean;
  onEdit?: (post: BlogPost) => void;
  onDelete?: (postId: string) => void;
  onArchive?: (postId: string) => void;
  onStatusChange?: (postId: string, status: PublishStatus) => void;
}

/**
 * 博客文章卡片组件
 * 展示文章的基本信息和操作按钮
 */
const BlogPostCard: React.FC<BlogPostCardProps> = ({
  post,
  showActions = false,
  onEdit,
  onDelete,
  onArchive,
  onStatusChange
}) => {
  const getStatusColor = (status: PublishStatus): string => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return 'status-published';
      case PublishStatus.DRAFT:
        return 'status-draft';
      case PublishStatus.ARCHIVED:
        return 'status-archived';
      case PublishStatus.SCHEDULED:
        return 'status-scheduled';
      default:
        return 'status-draft';
    }
  };

  const getStatusText = (status: PublishStatus): string => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return '已发布';
      case PublishStatus.DRAFT:
        return '草稿';
      case PublishStatus.ARCHIVED:
        return '已归档';
      case PublishStatus.SCHEDULED:
        return '定时发布';
      default:
        return '草稿';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleEdit = () => {
    onEdit?.(post);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      onDelete?.(post.id);
    }
  };

  const handleArchive = () => {
    onArchive?.(post.id);
  };

  const handleStatusToggle = () => {
    const newStatus = post.status === PublishStatus.PUBLISHED 
      ? PublishStatus.DRAFT 
      : PublishStatus.PUBLISHED;
    onStatusChange?.(post.id, newStatus);
  };

  return (
    <article className="blog-post-card">
      <div className="blog-post-card-header">
        <div className="blog-post-meta">
          <span className={`blog-post-status ${getStatusColor(post.status)}`}>
            {getStatusText(post.status)}
          </span>
          <span className="blog-post-category">{post.category}</span>
        </div>
        
        {showActions && (
          <div className="blog-post-actions">
            <button
              onClick={handleEdit}
              className="blog-post-action-btn"
              title="编辑文章"
            >
              <Edit3 size={16} />
            </button>
            
            <button
              onClick={handleStatusToggle}
              className="blog-post-action-btn"
              title={post.status === PublishStatus.PUBLISHED ? '取消发布' : '发布文章'}
            >
              <MoreHorizontal size={16} />
            </button>
            
            <button
              onClick={handleArchive}
              className="blog-post-action-btn"
              title="归档文章"
            >
              <Archive size={16} />
            </button>
            
            <button
              onClick={handleDelete}
              className="blog-post-action-btn blog-post-action-danger"
              title="删除文章"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="blog-post-card-body">
        <h3 className="blog-post-title">
          <Link to={`/blog/post/${post.id}`}>
            {post.title}
          </Link>
        </h3>
        
        <p className="blog-post-excerpt">
          {post.excerpt}
        </p>
        
        {post.tags && post.tags.length > 0 && (
          <div className="blog-post-tags">
            <Tag size={14} />
            {post.tags.map((tag, index) => (
              <span key={index} className="blog-post-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="blog-post-card-footer">
        <div className="blog-post-info">
          <span className="blog-post-author">
            <User size={14} />
            {post.author.name || post.author.email}
          </span>
          
          <span className="blog-post-date">
            <Calendar size={14} />
            {post.status === PublishStatus.PUBLISHED 
              ? formatDate(post.publishedAt) 
              : formatDate(post.updatedAt)}
          </span>
          
          {post.status === PublishStatus.PUBLISHED && (
            <span className="blog-post-views">
              <Eye size={14} />
              {post.viewCount} 次阅读
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default BlogPostCard;