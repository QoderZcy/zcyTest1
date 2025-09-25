import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Sidebar from '../../components/layout/Sidebar';
import CommentSection from '../../components/ui/CommentSection';
import { LoadingSpinner, Button } from '../../components/ui';
import { useBlog } from '../../contexts/BlogContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatRelativeTime, calculateReadTime } from '../../utils';
import { articleService } from '../../services';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: blogState, fetchArticle } = useBlog();
  const { state: authState } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const article = blogState.currentArticle;

  useEffect(() => {
    if (id) {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await fetchArticle(articleId);
      
      // 增加浏览量
      await articleService.incrementViewCount(articleId);
      
      if (blogState.currentArticle) {
        setLikeCount(blogState.currentArticle.likeCount);
        setViewCount(blogState.currentArticle.viewCount + 1);
      }
    } catch (error) {
      setError('文章加载失败');
      console.error('Failed to load article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!authState.isAuthenticated || !article) {
      navigate('/login');
      return;
    }

    try {
      const response = isLiked 
        ? await articleService.unlikeArticle(article.id)
        : await articleService.likeArticle(article.id);
      
      setIsLiked(response.liked);
      setLikeCount(response.likeCount);
    } catch (error) {
      console.error('Failed to like article:', error);
    }
  };

  const handleShare = async () => {
    if (!article) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <div className="flex justify-center items-center min-h-96">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-medium">文章加载失败</p>
              <p className="text-sm text-secondary-600 mt-2">{error || '文章不存在或已被删除'}</p>
            </div>
            <div className="space-x-4">
              <Button onClick={() => window.location.reload()}>重新加载</Button>
              <Button variant="secondary" onClick={() => navigate('/')}>返回首页</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const readTime = calculateReadTime(article.content);
  const isAuthor = authState.user?.id === article.authorId;

  return (
    <Layout>
      <div className="bg-secondary-50 min-h-screen">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <article className="bg-white rounded-lg shadow-sm">
                {/* Article Header */}
                <div className="p-6 border-b border-secondary-200">
                  {/* Breadcrumb */}
                  <nav className="flex items-center space-x-2 text-sm text-secondary-500 mb-4">
                    <Link to="/" className="hover:text-primary-600">首页</Link>
                    <span>/</span>
                    {article.category && (
                      <>
                        <Link 
                          to={`/category/${article.category.id}`}
                          className="hover:text-primary-600"
                        >
                          {article.category.name}
                        </Link>
                        <span>/</span>
                      </>
                    )}
                    <span className="text-secondary-900">文章详情</span>
                  </nav>

                  {/* Article Title */}
                  <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4 leading-tight">
                    {article.title}
                  </h1>

                  {/* Article Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                    {/* Author */}
                    <div className="flex items-center space-x-2">
                      {article.author?.avatar ? (
                        <img
                          src={article.author.avatar}
                          alt={article.author.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {article.author?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <Link 
                        to={`/user/${article.authorId}`}
                        className="font-medium hover:text-primary-600 transition-colors duration-200"
                      >
                        {article.author?.username}
                      </Link>
                    </div>

                    <span>•</span>

                    {/* Publish Date */}
                    <time dateTime={article.publishedAt?.toISOString()}>
                      {article.publishedAt ? formatDate(article.publishedAt) : formatDate(article.createdAt)}
                    </time>

                    <span>•</span>

                    {/* Read Time */}
                    <span>约{readTime}分钟阅读</span>

                    <span>•</span>

                    {/* View Count */}
                    <span>{viewCount.toLocaleString()}次浏览</span>
                  </div>

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {article.tags.map((tag) => (
                        <Link
                          key={tag}
                          to={`/tag/${encodeURIComponent(tag)}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-100 text-secondary-700 hover:bg-primary-100 hover:text-primary-700 transition-colors duration-200"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center space-x-4">
                      {/* Like Button */}
                      <Button
                        onClick={handleLike}
                        variant={isLiked ? "accent" : "outline"}
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <svg
                          className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{likeCount}</span>
                      </Button>

                      {/* Share Button */}
                      <Button
                        onClick={handleShare}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span>分享</span>
                      </Button>
                    </div>

                    {/* Edit Button (for author) */}
                    {isAuthor && (
                      <Link to={`/write/${article.id}`}>
                        <Button variant="secondary" size="sm">
                          编辑文章
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6">
                  <div 
                    className="article-content prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                </div>

                {/* Article Footer */}
                <div className="p-6 border-t border-secondary-200 bg-secondary-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-secondary-600">
                      <span>最后更新：{formatRelativeTime(article.updatedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-secondary-500">
                      <span>{likeCount}人点赞</span>
                      <span>{article.commentCount}条评论</span>
                    </div>
                  </div>
                </div>
              </article>

              {/* Related Articles */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">相关文章</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Placeholder for related articles */}
                  <div className="bg-white p-4 rounded-lg border border-secondary-200">
                    <h4 className="font-medium text-secondary-900 mb-2">相关文章功能</h4>
                    <p className="text-sm text-secondary-600">即将推出相关文章推荐功能</p>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-8">
                <CommentSection articleId={article.id} />
              </div>
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

export default ArticlePage;