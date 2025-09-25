import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Sidebar from '../../components/layout/Sidebar';
import { ArticleList, Pagination, LoadingSpinner } from '../../components/ui';
import { useBlog } from '../../contexts/BlogContext';
import { ArticleListQuery, ArticleCard } from '../../types';
import { articleService, categoryService, tagService } from '../../services';
import { debounce } from '../../utils';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { name } = useParams<{ name: string }>();
  const { state: blogState } = useBlog();
  
  const [results, setResults] = useState<ArticleCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchType, setSearchType] = useState<'keyword' | 'category' | 'tag'>('keyword');
  const [filters, setFilters] = useState({
    category: '',
    tag: '',
    sortBy: 'createdAt' as 'createdAt' | 'viewCount' | 'likeCount',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // 从URL参数获取搜索信息
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const page = parseInt(searchParams.get('page') || '1');
    
    setSearchQuery(query);
    setCurrentPage(page);
    
    // 判断搜索类型
    if (window.location.pathname.includes('/category/')) {
      setSearchType('category');
      setFilters(prev => ({ ...prev, category: name || '' }));
    } else if (window.location.pathname.includes('/tag/')) {
      setSearchType('tag');
      setFilters(prev => ({ ...prev, tag: decodeURIComponent(name || '') }));
    } else {
      setSearchType('keyword');
      setFilters(prev => ({ ...prev, category, tag }));
    }
  }, [searchParams, name]);

  // 执行搜索
  useEffect(() => {
    if (searchQuery || filters.category || filters.tag) {
      performSearch();
    }
  }, [searchQuery, filters, currentPage, searchType]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (searchType === 'category' && filters.category) {
        // 分类搜索
        response = await categoryService.getCategoryArticles(filters.category, {
          page: currentPage,
          limit: 10,
          tag: filters.tag,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });
      } else if (searchType === 'tag' && filters.tag) {
        // 标签搜索
        response = await tagService.getTagArticles(filters.tag, {
          page: currentPage,
          limit: 10,
          category: filters.category,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });
      } else if (searchQuery) {
        // 关键词搜索
        response = await articleService.searchArticles({
          keyword: searchQuery,
          page: currentPage,
          limit: 10,
          category: filters.category,
          tag: filters.tag,
        });
      } else {
        // 获取所有文章
        const query: ArticleListQuery = {
          page: currentPage,
          limit: 10,
          category: filters.category,
          tag: filters.tag,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          status: 'published',
        };
        response = await articleService.getArticles(query);
      }
      
      setResults(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      setError('搜索失败，请重试');
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 防抖搜索
  const debouncedSearch = debounce((query: string) => {
    if (query !== searchQuery) {
      setSearchParams(prev => {
        if (query) {
          prev.set('q', query);
        } else {
          prev.delete('q');
        }
        prev.set('page', '1');
        return prev;
      });
    }
  }, 300);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams(prev => {
      prev.set('page', page.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const getPageTitle = () => {
    if (searchType === 'category' && filters.category) {
      const category = blogState.categories.find(c => c.id === filters.category);
      return `分类：${category?.name || filters.category}`;
    } else if (searchType === 'tag' && filters.tag) {
      return `标签：${filters.tag}`;
    } else if (searchQuery) {
      return `搜索：${searchQuery}`;
    }
    return '搜索结果';
  };

  const getPageDescription = () => {
    if (total > 0) {
      return `找到 ${total} 篇相关文章`;
    }
    return '没有找到相关文章';
  };

  return (
    <Layout>
      <div className="bg-secondary-50 min-h-screen">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
                  {getPageTitle()}
                </h1>
                
                {/* Search Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="搜索文章、标题、内容..."
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-secondary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Category Filter */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-secondary-600">分类：</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="text-sm border border-secondary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">全部分类</option>
                      {blogState.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-secondary-600">排序：</label>
                    <select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                      }}
                      className="text-sm border border-secondary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="createdAt-desc">最新发布</option>
                      <option value="viewCount-desc">最多浏览</option>
                      <option value="likeCount-desc">最多点赞</option>
                      <option value="createdAt-asc">最早发布</option>
                    </select>
                  </div>
                </div>

                {/* Result Summary */}
                <div className="mt-4 text-secondary-600">
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>搜索中...</span>
                    </div>
                  ) : (
                    <p>{getPageDescription()}</p>
                  )}
                </div>
              </div>

              {/* Search Results */}
              <ArticleList
                articles={results}
                loading={loading}
                error={error}
                emptyMessage={searchQuery ? `没有找到包含 "${searchQuery}" 的文章` : '没有找到相关文章'}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
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
      </div>
    </Layout>
  );
};

export default SearchPage;