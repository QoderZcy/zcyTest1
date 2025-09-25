import React from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../../contexts/BlogContext';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { state } = useBlog();

  return (
    <aside className={`w-full space-y-6 ${className}`}>
      {/* Categories Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">文章分类</h3>
        <div className="space-y-2">
          {state.categories.length > 0 ? (
            state.categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-50 transition-colors duration-200 group"
              >
                <span className="text-secondary-700 group-hover:text-primary-600 transition-colors duration-200">
                  {category.name}
                </span>
                <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded-full">
                  {category.articleCount}
                </span>
              </Link>
            ))
          ) : (
            <div className="text-secondary-500 text-sm text-center py-4">
              暂无分类
            </div>
          )}
        </div>
        <Link
          to="/categories"
          className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200"
        >
          查看所有分类 →
        </Link>
      </div>

      {/* Popular Tags */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">热门标签</h3>
        <div className="flex flex-wrap gap-2">
          {state.tags.length > 0 ? (
            state.tags.slice(0, 15).map((tag) => (
              <Link
                key={tag.id}
                to={`/tag/${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-100 text-secondary-700 hover:bg-primary-100 hover:text-primary-700 transition-colors duration-200"
              >
                #{tag.name}
                <span className="ml-1 text-xs text-secondary-500">
                  {tag.articleCount}
                </span>
              </Link>
            ))
          ) : (
            <div className="text-secondary-500 text-sm text-center py-4 w-full">
              暂无标签
            </div>
          )}
        </div>
        <Link
          to="/tags"
          className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200"
        >
          查看所有标签 →
        </Link>
      </div>

      {/* Recent Articles */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">最新文章</h3>
        <div className="space-y-3">
          {state.articles.slice(0, 5).map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
              className="block group"
            >
              <h4 className="text-sm font-medium text-secondary-900 group-hover:text-primary-600 transition-colors duration-200 line-clamp-2">
                {article.title}
              </h4>
              <div className="flex items-center mt-1 text-xs text-secondary-500">
                <span>{article.author.username}</span>
                <span className="mx-2">·</span>
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link
          to="/articles"
          className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200"
        >
          查看更多文章 →
        </Link>
      </div>

      {/* Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">站点统计</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-secondary-600">文章总数</span>
            <span className="text-secondary-900 font-medium">
              {state.pagination.total || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-600">分类数量</span>
            <span className="text-secondary-900 font-medium">
              {state.categories.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-600">标签数量</span>
            <span className="text-secondary-900 font-medium">
              {state.tags.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-600">总浏览量</span>
            <span className="text-secondary-900 font-medium">
              {state.articles.reduce((total, article) => total + article.viewCount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Archive */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">文章归档</h3>
        <div className="space-y-2">
          <Link
            to="/archives/2023"
            className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-50 transition-colors duration-200 group"
          >
            <span className="text-secondary-700 group-hover:text-primary-600 transition-colors duration-200">
              2023年
            </span>
            <span className="text-xs text-secondary-500">25篇</span>
          </Link>
          <Link
            to="/archives/2022"
            className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-50 transition-colors duration-200 group"
          >
            <span className="text-secondary-700 group-hover:text-primary-600 transition-colors duration-200">
              2022年
            </span>
            <span className="text-xs text-secondary-500">18篇</span>
          </Link>
        </div>
        <Link
          to="/archives"
          className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200"
        >
          查看完整归档 →
        </Link>
      </div>

      {/* Useful Links */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">友情链接</h3>
        <div className="space-y-2">
          <a
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-secondary-700 hover:text-primary-600 transition-colors duration-200"
          >
            React 官网
          </a>
          <a
            href="https://www.typescriptlang.org"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-secondary-700 hover:text-primary-600 transition-colors duration-200"
          >
            TypeScript 官网
          </a>
          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-secondary-700 hover:text-primary-600 transition-colors duration-200"
          >
            Tailwind CSS
          </a>
          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-secondary-700 hover:text-primary-600 transition-colors duration-200"
          >
            Vite
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;