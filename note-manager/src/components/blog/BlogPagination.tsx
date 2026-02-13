import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import './BlogPagination.css';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

const BlogPagination: React.FC<BlogPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 7,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // 总页数较少，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总页数较多，需要省略显示
      const halfVisible = Math.floor(maxVisiblePages / 2);
      
      if (currentPage <= halfVisible + 1) {
        // 当前页在前部
        for (let i = 1; i <= maxVisiblePages - 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        // 当前页在后部
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - maxVisiblePages + 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className="blog-pagination" aria-label="文章分页导航">
      <div className="pagination-container">
        {/* 上一页按钮 */}
        <button
          className={`pagination-btn prev-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="上一页"
        >
          <ChevronLeft size={16} />
          <span className="btn-text">上一页</span>
        </button>

        {/* 页码列表 */}
        <div className="pagination-pages">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {typeof page === 'number' ? (
                <button
                  className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageClick(page)}
                  aria-label={`第 ${page} 页`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span className="pagination-ellipsis" aria-hidden="true">
                  <MoreHorizontal size={16} />
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 下一页按钮 */}
        <button
          className={`pagination-btn next-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="下一页"
        >
          <span className="btn-text">下一页</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 页码信息 */}
      <div className="pagination-info">
        第 {currentPage} 页，共 {totalPages} 页
      </div>
    </nav>
  );
};

export default BlogPagination;