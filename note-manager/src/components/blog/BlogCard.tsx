import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, Heart, Tag, User, Lock, Globe } from 'lucide-react';
import { BlogArticle, Visibility, ArticleStatus } from '../../types/blog';
import { formatDate, formatReadTime } from '../../utils/dateUtils';
import './BlogCard.css';

interface BlogCardProps {
  article: BlogArticle;
  viewMode: 'grid' | 'list';
  showPrivateIndicator?: boolean;
  showAuthor?: boolean;
  onLike?: (id: string) => void;
  onEdit?: (article: BlogArticle) => void;
  onDelete?: (id: string) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({
  article,
  viewMode,
  showPrivateIndicator = false,
  showAuthor = true,
  onLike,
  onEdit,
  onDelete,
}) => {
  const getVisibilityIcon = (visibility: Visibility) => {
    switch (visibility) {
      case Visibility.PRIVATE:
        return <Lock size={14} />;
      case Visibility.PASSWORD:
        return <Lock size={14} />;
      case Visibility.UNLISTED:
        return <Eye size={14} />;
      default:
        return <Globe size={14} />;
    }
  };

  const getVisibilityText = (visibility: Visibility) => {
    switch (visibility) {
      case Visibility.PRIVATE:
        return '私有';
      case Visibility.PASSWORD:
        return '密码保护';
      case Visibility.UNLISTED:
        return '不公开列出';
      default:
        return '公开';
    }
  };

  const getStatusColor = (status: ArticleStatus) => {
    switch (status) {
      case ArticleStatus.PUBLISHED:
        return 'status-published';
      case ArticleStatus.DRAFT:
        return 'status-draft';
      case ArticleStatus.ARCHIVED:
        return 'status-archived';
      default:
        return 'status-draft';
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike?.(article.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(article);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      onDelete?.(article.id);
    }
  };

  const articleUrl = `/blog/post/${article.slug || article.id}`;

  return (
    <article className={`blog-card ${viewMode}`}>
      <Link to={articleUrl} className="blog-card-link">
        {/* 封面图片 */}
        {article.coverImage && (
          <div className="blog-card-cover">
            <img 
              src={article.coverImage} 
              alt={article.title}
              loading="lazy"
            />
          </div>
        )}

        <div className="blog-card-content">
          {/* 状态和可见性指示器 */}
          {showPrivateIndicator && (
            <div className="blog-card-indicators">
              <span className={`status-badge ${getStatusColor(article.status)}`}>
                {article.status === ArticleStatus.PUBLISHED ? '已发布' : 
                 article.status === ArticleStatus.DRAFT ? '草稿' : '已归档'}
              </span>
              <span className="visibility-badge" title={getVisibilityText(article.visibility)}>
                {getVisibilityIcon(article.visibility)}
                {viewMode === 'list' && getVisibilityText(article.visibility)}
              </span>
            </div>
          )}

          {/* 文章标题 */}
          <h2 className="blog-card-title">
            {article.title}
          </h2>

          {/* 文章摘要 */}
          {article.excerpt && (
            <p className="blog-card-excerpt">
              {article.excerpt}
            </p>
          )}

          {/* 文章标签 */}
          {article.tags.length > 0 && (
            <div className="blog-card-tags">
              {article.tags.slice(0, viewMode === 'grid' ? 3 : 5).map(tag => (
                <span key={tag} className="tag">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
              {article.tags.length > (viewMode === 'grid' ? 3 : 5) && (
                <span className="more-tags">
                  +{article.tags.length - (viewMode === 'grid' ? 3 : 5)}
                </span>
              )}
            </div>
          )}

          {/* 文章分类 */}
          {article.categories.length > 0 && (
            <div className="blog-card-categories">
              {article.categories.slice(0, 2).map(category => (
                <span key={category} className="category">
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* 文章元信息 */}
          <div className="blog-card-meta">
            <div className="meta-left">
              {showAuthor && (
                <span className="meta-item author">
                  <User size={14} />
                  {article.authorId}
                </span>
              )}
              
              <span className="meta-item date">
                <Calendar size={14} />
                {article.publishedAt 
                  ? formatDate(article.publishedAt)
                  : formatDate(article.createdAt)
                }
              </span>

              {article.readTime && (
                <span className="meta-item read-time">
                  <Clock size={14} />
                  {formatReadTime(article.readTime)}
                </span>
              )}
            </div>

            <div className="meta-right">
              {article.viewCount !== undefined && (
                <span className="meta-item views">
                  <Eye size={14} />
                  {article.viewCount}
                </span>
              )}

              {article.likeCount !== undefined && (
                <button 
                  className="meta-item likes interactive"
                  onClick={handleLike}
                  title="点赞"
                >
                  <Heart size={14} />
                  {article.likeCount}
                </button>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          {(onEdit || onDelete) && (
            <div className="blog-card-actions">
              {onEdit && (
                <button 
                  className="action-btn edit-btn"
                  onClick={handleEdit}
                  title="编辑文章"
                >
                  编辑
                </button>
              )}
              
              {onDelete && (
                <button 
                  className="action-btn delete-btn"
                  onClick={handleDelete}
                  title="删除文章"
                >
                  删除
                </button>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;