import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  BookOpen,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { BookCard, BookCardSkeleton } from './BookCard';
import type { Book, BookFilter } from '../types/book';

interface BookGridProps {
  books: Book[];
  loading?: boolean;
  error?: string | null;
  viewMode?: 'grid' | 'list';
  filter?: BookFilter;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  showActions?: boolean;
  compact?: boolean;
  onEditBook?: (book: Book) => void;
  onDeleteBook?: (bookId: string) => void;
  onViewBook?: (book: Book) => void;
  onBorrowBook?: (book: Book) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onRetry?: () => void;
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  loading = false,
  error = null,
  viewMode = 'grid',
  filter,
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  showActions = true,
  compact = false,
  onEditBook,
  onDeleteBook,
  onViewBook,
  onBorrowBook,
  onPageChange,
  onPageSizeChange,
  onViewModeChange,
  onRetry,
}) => {
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  // 批量选择相关方法
  const handleSelectAll = () => {
    if (selectedBooks.size === books.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(books.map(book => book.id)));
    }
  };

  const handleSelectBook = (bookId: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooks(newSelected);
  };

  // 分页导航
  const paginationInfo = useMemo(() => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);
    return { startItem, endItem };
  }, [currentPage, pageSize, totalCount]);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index);
  };

  // 错误状态
  if (error && !loading) {
    return (
      <div className="book-grid__error">
        <div className="book-grid__error-content">
          <AlertCircle size={48} className="book-grid__error-icon" />
          <h3 className="book-grid__error-title">加载失败</h3>
          <p className="book-grid__error-message">{error}</p>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              <RefreshCw size={16} />
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  // 空状态
  if (!loading && books.length === 0) {
    return (
      <div className="book-grid__empty">
        <div className="book-grid__empty-content">
          <BookOpen size={48} className="book-grid__empty-icon" />
          <h3 className="book-grid__empty-title">
            {filter?.searchTerm || filter?.selectedCategories.length || filter?.selectedTags.length
              ? '未找到符合条件的图书'
              : '暂无图书'}
          </h3>
          <p className="book-grid__empty-message">
            {filter?.searchTerm || filter?.selectedCategories.length || filter?.selectedTags.length
              ? '请尝试调整搜索条件或筛选器'
              : '还没有添加任何图书到系统中'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="book-grid">
      {/* 工具栏 */}
      <div className="book-grid__toolbar">
        <div className="book-grid__toolbar-left">
          {/* 批量操作 */}
          {selectedBooks.size > 0 && (
            <div className="book-grid__batch-actions">
              <span className="book-grid__selected-count">
                已选择 {selectedBooks.size} 项
              </span>
              <button className="btn btn-sm btn-outline">
                批量编辑
              </button>
              <button className="btn btn-sm btn-outline btn-danger">
                批量删除
              </button>
            </div>
          )}
          
          {/* 结果统计 */}
          {!loading && (
            <div className="book-grid__result-info">
              显示第 {paginationInfo.startItem}-{paginationInfo.endItem} 项，共 {totalCount} 项
            </div>
          )}
        </div>

        <div className="book-grid__toolbar-right">
          {/* 每页显示数量 */}
          {onPageSizeChange && (
            <div className="book-grid__page-size">
              <label htmlFor="page-size-select">每页显示：</label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="book-grid__page-size-select"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}

          {/* 视图切换 */}
          {onViewModeChange && (
            <div className="book-grid__view-toggle">
              <button
                className={`btn btn-icon btn-sm ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => onViewModeChange('grid')}
                title="网格视图"
                aria-label="切换到网格视图"
              >
                <Grid size={16} />
              </button>
              <button
                className={`btn btn-icon btn-sm ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => onViewModeChange('list')}
                title="列表视图"
                aria-label="切换到列表视图"
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 批量选择工具栏 */}
      {showActions && books.length > 0 && (
        <div className="book-grid__select-toolbar">
          <label className="book-grid__select-all">
            <input
              type="checkbox"
              checked={selectedBooks.size === books.length && books.length > 0}
              onChange={handleSelectAll}
              className="book-grid__select-all-checkbox"
            />
            全选
          </label>
        </div>
      )}

      {/* 图书列表 */}
      <div className={`book-grid__content book-grid__content--${viewMode} ${compact ? 'book-grid__content--compact' : ''}`}>
        {loading ? (
          // 加载骨架屏
          Array.from({ length: pageSize }, (_, index) => (
            <BookCardSkeleton key={index} compact={compact} />
          ))
        ) : (
          books.map((book) => (
            <div key={book.id} className="book-grid__item">
              {showActions && (
                <label className="book-grid__item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedBooks.has(book.id)}
                    onChange={() => handleSelectBook(book.id)}
                    className="book-grid__checkbox"
                  />
                </label>
              )}
              <BookCard
                book={book}
                onEdit={onEditBook}
                onDelete={onDeleteBook}
                onView={onViewBook}
                onBorrow={onBorrowBook}
                showActions={showActions}
                compact={compact}
              />
            </div>
          ))
        )}
      </div>

      {/* 分页器 */}
      {!loading && totalPages > 1 && onPageChange && (
        <div className="book-grid__pagination">
          <div className="book-grid__pagination-info">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          
          <div className="book-grid__pagination-controls">
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              title="上一页"
              aria-label="上一页"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="book-grid__pagination-pages">
              {getVisiblePages().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="book-grid__pagination-ellipsis">
                      <MoreHorizontal size={16} />
                    </span>
                  ) : (
                    <button
                      className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => onPageChange(page as number)}
                      aria-label={`第 ${page} 页`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              title="下一页"
              aria-label="下一页"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 快速跳转 */}
      {!loading && totalPages > 5 && onPageChange && (
        <div className="book-grid__quick-jump">
          <label htmlFor="page-jump-input">跳转到：</label>
          <input
            id="page-jump-input"
            type="number"
            min={1}
            max={totalPages}
            placeholder="页码"
            className="book-grid__jump-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = Number((e.target as HTMLInputElement).value);
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

// 图书网格骨架屏组件
export const BookGridSkeleton: React.FC<{ 
  itemCount?: number; 
  viewMode?: 'grid' | 'list';
  compact?: boolean;
}> = ({ 
  itemCount = 20, 
  viewMode = 'grid',
  compact = false 
}) => {
  return (
    <div className="book-grid">
      <div className="book-grid__toolbar">
        <div className="skeleton skeleton--toolbar-left"></div>
        <div className="skeleton skeleton--toolbar-right"></div>
      </div>
      
      <div className={`book-grid__content book-grid__content--${viewMode} ${compact ? 'book-grid__content--compact' : ''}`}>
        {Array.from({ length: itemCount }, (_, index) => (
          <BookCardSkeleton key={index} compact={compact} />
        ))}
      </div>
      
      <div className="book-grid__pagination">
        <div className="skeleton skeleton--pagination"></div>
      </div>
    </div>
  );
};