import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Sidebar from '../../components/layout/Sidebar';
import ArticleList from '../../components/ui/ArticleList';
import Pagination from '../../components/ui/Pagination';
import { useBlog } from '../../contexts/BlogContext';
import { ArticleListQuery } from '../../types';

const HomePage: React.FC = () => {
  const { state, fetchArticles, fetchCategories, fetchTags } = useBlog();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'viewCount' | 'likeCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // 初始化数据
    const query: ArticleListQuery = {
      page: currentPage,
      limit: 10,
      sortBy,
      sortOrder,
      status: 'published',
    };
    
    fetchArticles(query);
    fetchCategories();
    fetchTags();
  }, [currentPage, sortBy, sortOrder, fetchArticles, fetchCategories, fetchTags]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="bg-secondary-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="container-custom py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                欢迎来到博客系统
              </h1>
              <p className="text-xl md:text-2xl text-primary-100 mb-8">
                分享知识，记录成长，连接世界
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <a
                  href="#articles"
                  className="btn bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 text-lg"
                >
                  开始阅读
                </a>
                <a
                  href="/write"
                  className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 text-lg"
                >
                  开始写作
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom py-8" id="articles">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Articles Section */}
            <div className="lg:col-span-3">
              {/* Filter and Sort Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <h2 className="text-2xl font-bold text-secondary-900">
                  最新文章
                  {state.pagination.total > 0 && (
                    <span className="text-lg font-normal text-secondary-600 ml-2">
                      共 {state.pagination.total} 篇
                    </span>
                  )}
                </h2>
                
                {/* Sort Options */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-secondary-600">排序：</span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                      handleSortChange(newSortBy, newSortOrder);
                    }}
                    className="input text-sm py-1 px-2"
                  >
                    <option value="createdAt-desc">最新发布</option>
                    <option value="viewCount-desc">最多浏览</option>
                    <option value="likeCount-desc">最多点赞</option>
                    <option value="createdAt-asc">最早发布</option>
                  </select>
                </div>
              </div>

              {/* Articles List */}
              <ArticleList
                articles={state.articles}
                loading={state.articlesLoading}
                error={state.error}
                emptyMessage="还没有发布任何文章"
              />

              {/* Pagination */}
              {state.pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={state.pagination.current}
                    totalPages={state.pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar className="sticky top-8" />
            </div>
          </div>
        </div>

        {/* Featured Section */}
        <div className="bg-white py-16">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                为什么选择我们的博客系统？
              </h2>
              <p className="text-lg text-secondary-600">
                现代化的设计，强大的功能，优秀的用户体验
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">易于使用</h3>
                <p className="text-secondary-600">
                  直观的用户界面，简单的操作流程，让写作变得轻松愉快
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">高性能</h3>
                <p className="text-secondary-600">
                  基于现代化技术栈，快速响应，流畅的用户体验
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">安全可靠</h3>
                <p className="text-secondary-600">
                  完善的权限控制，数据加密传输，保护您的内容安全
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;