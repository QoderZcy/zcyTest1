import React from 'react';
import { 
  BookOpen, 
  User, 
  Calendar, 
  MapPin, 
  Tag, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { Book } from '../types/book';
import { BOOK_STATUS_LABELS, BOOK_STATUS_COLORS, BOOK_CATEGORY_LABELS } from '../types/book';

interface BookCardProps {
  book: Book;
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: string) => void;
  onView?: (book: Book) => void;
  onBorrow?: (book: Book) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onEdit,
  onDelete,
  onView,
  onBorrow,
  showActions = true,
  compact = false,
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(book);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除图书 "${book.title}" 吗？`)) {
      onDelete?.(book.id);
    }
  };

  const handleView = () => {
    onView?.(book);
  };

  const handleBorrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBorrow?.(book);
  };

  const getStatusIcon = () => {
    switch (book.status) {
      case 'AVAILABLE':
        return <CheckCircle size={16} style={{ color: BOOK_STATUS_COLORS[book.status] }} />;
      case 'BORROWED':
        return <Clock size={16} style={{ color: BOOK_STATUS_COLORS[book.status] }} />;
      case 'RESERVED':
        return <Clock size={16} style={{ color: BOOK_STATUS_COLORS[book.status] }} />;
      case 'MAINTENANCE':
      case 'DAMAGED':
      case 'LOST':
        return <AlertTriangle size={16} style={{ color: BOOK_STATUS_COLORS[book.status] }} />;
      default:
        return null;
    }
  };

  const canBorrow = book.status === 'AVAILABLE' && book.availableCopies > 0;

  return (
    <div 
      className={`book-card ${compact ? 'book-card--compact' : ''}`}
      onClick={handleView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleView();
        }
      }}
    >
      {/* 图书封面 */}
      <div className="book-card__cover">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={`${book.title}封面`}
            className="book-card__cover-image"
            loading="lazy"
          />
        ) : (
          <div className="book-card__cover-placeholder">
            <BookOpen size={compact ? 32 : 48} />
          </div>
        )}
        
        {/* 状态标识 */}
        <div 
          className="book-card__status-badge"
          style={{ backgroundColor: BOOK_STATUS_COLORS[book.status] }}
        >
          {getStatusIcon()}
          <span className="book-card__status-text">
            {BOOK_STATUS_LABELS[book.status]}
          </span>
        </div>

        {/* 库存信息 */}
        {!compact && (
          <div className="book-card__inventory">
            <span className="book-card__inventory-text">
              {book.availableCopies}/{book.totalCopies}
            </span>
          </div>
        )}
      </div>

      {/* 图书信息 */}
      <div className="book-card__content">
        <div className="book-card__header">
          <h3 className="book-card__title" title={book.title}>
            {book.title}
          </h3>
          {book.isbn && !compact && (
            <span className="book-card__isbn">ISBN: {book.isbn}</span>
          )}
        </div>

        <div className="book-card__meta">
          <div className="book-card__author">
            <User size={14} />
            <span title={book.author}>{book.author}</span>
          </div>

          {book.publisher && !compact && (
            <div className="book-card__publisher">
              <span>{book.publisher}</span>
            </div>
          )}

          {book.publishDate && !compact && (
            <div className="book-card__publish-date">
              <Calendar size={14} />
              <span>{new Date(book.publishDate).getFullYear()}年</span>
            </div>
          )}

          {book.location && !compact && (
            <div className="book-card__location">
              <MapPin size={14} />
              <span>{book.location}</span>
            </div>
          )}
        </div>

        {/* 分类和标签 */}
        <div className="book-card__taxonomy">
          <div className="book-card__category">
            <span className="book-card__category-badge">
              {BOOK_CATEGORY_LABELS[book.category]}
            </span>
          </div>

          {book.tags.length > 0 && !compact && (
            <div className="book-card__tags">
              <Tag size={12} />
              <div className="book-card__tags-list">
                {book.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="book-card__tag">
                    {tag}
                  </span>
                ))}
                {book.tags.length > 3 && (
                  <span className="book-card__tag book-card__tag--more">
                    +{book.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 描述 */}
        {book.description && !compact && (
          <div className="book-card__description">
            <p>{book.description.slice(0, 100)}{book.description.length > 100 ? '...' : ''}</p>
          </div>
        )}

        {/* 操作按钮 */}
        {showActions && (
          <div className="book-card__actions">
            <button
              className="btn btn-icon btn-sm"
              onClick={handleView}
              title="查看详情"
              aria-label={`查看图书 ${book.title} 的详情`}
            >
              <Eye size={16} />
            </button>

            {canBorrow && onBorrow && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleBorrow}
                title="借阅图书"
                aria-label={`借阅图书 ${book.title}`}
              >
                借阅
              </button>
            )}

            {onEdit && (
              <button
                className="btn btn-icon btn-sm"
                onClick={handleEdit}
                title="编辑图书"
                aria-label={`编辑图书 ${book.title}`}
              >
                <Edit size={16} />
              </button>
            )}

            {onDelete && (
              <button
                className="btn btn-icon btn-sm btn-danger"
                onClick={handleDelete}
                title="删除图书"
                aria-label={`删除图书 ${book.title}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}

        {/* 时间信息 */}
        {!compact && (
          <div className="book-card__timestamps">
            <small className="book-card__timestamp">
              创建于 {new Date(book.createdAt).toLocaleDateString()}
            </small>
            {book.updatedAt > book.createdAt && (
              <small className="book-card__timestamp">
                更新于 {new Date(book.updatedAt).toLocaleDateString()}
              </small>
            )}
          </div>
        )}
      </div>

      {/* 快捷借阅悬浮按钮（仅在可借阅时显示） */}
      {canBorrow && onBorrow && !compact && (
        <button
          className="book-card__quick-borrow"
          onClick={handleBorrow}
          title="快速借阅"
          aria-label={`快速借阅图书 ${book.title}`}
        >
          <BookOpen size={16} />
        </button>
      )}
    </div>
  );
};

// 图书卡片骨架屏组件
export const BookCardSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className={`book-card book-card--skeleton ${compact ? 'book-card--compact' : ''}`}>
      <div className="book-card__cover">
        <div className="book-card__cover-placeholder skeleton">
          <BookOpen size={compact ? 32 : 48} />
        </div>
      </div>
      
      <div className="book-card__content">
        <div className="book-card__header">
          <div className="skeleton skeleton--title"></div>
          {!compact && <div className="skeleton skeleton--isbn"></div>}
        </div>
        
        <div className="book-card__meta">
          <div className="skeleton skeleton--author"></div>
          {!compact && (
            <>
              <div className="skeleton skeleton--publisher"></div>
              <div className="skeleton skeleton--date"></div>
            </>
          )}
        </div>
        
        <div className="book-card__category">
          <div className="skeleton skeleton--category"></div>
        </div>
        
        {!compact && (
          <>
            <div className="book-card__description">
              <div className="skeleton skeleton--description"></div>
            </div>
            
            <div className="book-card__actions">
              <div className="skeleton skeleton--button"></div>
              <div className="skeleton skeleton--button"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};