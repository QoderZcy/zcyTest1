import React from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard } from '../../types';
import { formatRelativeTime, truncateText } from '../../utils';

interface ArticleCardComponentProps {
  article: ArticleCard;
  className?: string;
}

const ArticleCardComponent: React.FC<ArticleCardComponentProps> = ({ 
  article, 
  className = '' 
}) => {
  return (
    <article className={`card hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Article Header */}
      <div className="flex items-start justify-between mb-4">
        <Link 
          to={`/articles/${article.id}`}
          className="flex-1"
        >
          <h2 className="text-xl font-semibold text-secondary-900 hover:text-primary-600 transition-colors duration-200 line-clamp-2">
            {article.title}
          </h2>
        </Link>
      </div>

      {/* Article Summary */}
      <div className="mb-4">
        <p className="text-secondary-600 line-clamp-3">
          {truncateText(article.summary, 150)}
        </p>
      </div>

      {/* Article Meta */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Author */}
          <div className="flex items-center space-x-2">
            {article.author.avatar ? (
              <img
                src={article.author.avatar}
                alt={article.author.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {article.author.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-secondary-600">
              {article.author.username}
            </span>
          </div>

          {/* Published Date */}
          <span className="text-sm text-secondary-500">
            {formatRelativeTime(article.publishedAt)}
          </span>

          {/* Read Time */}
          <span className="text-sm text-secondary-500">
            约{article.readTime}分钟阅读
          </span>
        </div>
      </div>

      {/* Tags and Category */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* Category */}
          {article.category && (
            <Link
              to={`/category/${article.category.id}`}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors duration-200"
            >
              {article.category.name}
            </Link>
          )}

          {/* Tags */}
          {article.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              to={`/tag/${encodeURIComponent(tag)}`}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors duration-200"
            >
              #{tag}
            </Link>
          ))}
          {article.tags.length > 3 && (
            <span className="text-xs text-secondary-500">
              +{article.tags.length - 3}更多
            </span>
          )}
        </div>
      </div>

      {/* Article Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
        <div className="flex items-center space-x-4 text-sm text-secondary-500">
          {/* Views */}
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{article.viewCount.toLocaleString()}</span>
          </div>

          {/* Likes */}
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{article.likeCount}</span>
          </div>

          {/* Comments */}
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{article.commentCount}</span>
          </div>
        </div>

        {/* Read More Link */}
        <Link
          to={`/articles/${article.id}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors duration-200"
        >
          阅读全文 →
        </Link>
      </div>
    </article>
  );
};

export default ArticleCardComponent;