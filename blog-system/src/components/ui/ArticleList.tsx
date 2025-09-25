import React from 'react';
import { ArticleCard } from '../../types';
import { LoadingSpinner } from '../ui';
import ArticleCardComponent from '../ui/ArticleCard';

interface ArticleListProps {
  articles: ArticleCard[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  loading = false,
  error = null,
  emptyMessage = '暂无文章',
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">加载失败</p>
          <p className="text-sm text-secondary-600 mt-2">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-secondary-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-secondary-700">{emptyMessage}</p>
          <p className="text-sm text-secondary-500 mt-2">
            还没有发布任何文章，快去写第一篇吧！
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {articles.map((article) => (
        <ArticleCardComponent
          key={article.id}
          article={article}
        />
      ))}
    </div>
  );
};

export default ArticleList;