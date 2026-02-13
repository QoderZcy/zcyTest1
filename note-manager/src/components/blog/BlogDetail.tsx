import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Eye, Heart, Share2, Tag, User, Edit, ArrowLeft, BookOpen } from 'lucide-react';
import { useBlogDetail } from '../../hooks/useBlog';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatReadTime } from '../../utils/dateUtils';
import './BlogDetail.css';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    article,
    isLoading,
    relatedArticles,
    isLiked,
    toggleLike,
    shareArticle,
  } = useBlogDetail(id!);

  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/blog');
    }
  }, [id, navigate]);

  const handleEdit = () => {
    if (article) {
      navigate(`/blog/edit/${article.id}`);
    }
  };

  const handleShare = async (platform: string) => {
    await shareArticle(platform);
    setShowShareMenu(false);
  };

  const canEdit = isAuthenticated && article && article.authorId === user?.id;

  if (isLoading) {
    return (
      <div className="blog-detail-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="blog-detail-error">
        <h2>文章未找到</h2>
        <p>抱歉，您要查看的文章不存在或已被删除。</p>
        <Link to="/blog" className="btn btn-primary">
          <ArrowLeft size={16} />
          返回博客首页
        </Link>
      </div>
    );
  }

  return (
    <div className="blog-detail">
      <div className="blog-detail-container">
        {/* 返回导航 */}
        <div className="detail-nav">
          <Link to="/blog" className="back-link">
            <ArrowLeft size={16} />
            返回博客
          </Link>
          
          {canEdit && (
            <button onClick={handleEdit} className="edit-link">
              <Edit size={16} />
              编辑文章
            </button>
          )}
        </div>

        {/* 文章头部 */}
        <header className="article-header">
          {article.coverImage && (
            <div className="article-cover">
              <img src={article.coverImage} alt={article.title} />
            </div>
          )}
          
          <div className="article-meta-wrapper">
            <h1 className="article-title">{article.title}</h1>
            
            {article.excerpt && (
              <p className="article-excerpt">{article.excerpt}</p>
            )}
            
            <div className="article-meta">
              <div className="meta-left">
                <span className="meta-item author">
                  <User size={16} />
                  {article.authorId}
                </span>
                
                <span className="meta-item date">
                  <Calendar size={16} />
                  {article.publishedAt 
                    ? formatDate(article.publishedAt)
                    : formatDate(article.createdAt)
                  }
                </span>

                {article.readTime && (
                  <span className="meta-item read-time">
                    <Clock size={16} />
                    {formatReadTime(article.readTime)}
                  </span>
                )}
                
                {article.viewCount !== undefined && (
                  <span className="meta-item views">
                    <Eye size={16} />
                    {article.viewCount} 次浏览
                  </span>
                )}
              </div>
              
              <div className="meta-right">
                <div className="article-actions">
                  {article.likeCount !== undefined && (
                    <button 
                      className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={toggleLike}
                    >
                      <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                      {article.likeCount}
                    </button>
                  )}
                  
                  <div className="share-dropdown">
                    <button 
                      className="action-btn share-btn"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                    >
                      <Share2 size={16} />
                      分享
                    </button>
                    
                    {showShareMenu && (
                      <div className="share-menu">
                        <button onClick={() => handleShare('native')}>原生分享</button>
                        <button onClick={() => handleShare('copy')}>复制链接</button>
                        <button onClick={() => handleShare('twitter')}>Twitter</button>
                        <button onClick={() => handleShare('facebook')}>Facebook</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 标签和分类 */}
            {(article.tags.length > 0 || article.categories.length > 0) && (
              <div className="article-taxonomy">
                {article.categories.length > 0 && (
                  <div className="article-categories">
                    {article.categories.map(category => (
                      <Link 
                        key={category} 
                        to={`/blog/category/${encodeURIComponent(category)}`}
                        className="category-link"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                )}
                
                {article.tags.length > 0 && (
                  <div className="article-tags">
                    {article.tags.map(tag => (
                      <Link 
                        key={tag} 
                        to={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="tag-link"
                      >
                        <Tag size={12} />
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* 文章内容 */}
        <main className="article-content">
          <BlogContent content={article.content} />
        </main>

        {/* 相关文章 */}
        {relatedArticles.length > 0 && (
          <aside className="related-articles">
            <h3>相关文章</h3>
            <div className="related-grid">
              {relatedArticles.map(relatedArticle => (
                <Link 
                  key={relatedArticle.id}
                  to={`/blog/post/${relatedArticle.id}`}
                  className="related-card"
                >
                  {relatedArticle.coverImage && (
                    <img src={relatedArticle.coverImage} alt={relatedArticle.title} />
                  )}
                  <div className="related-content">
                    <h4>{relatedArticle.title}</h4>
                    <p>{relatedArticle.excerpt}</p>
                    <span className="related-date">
                      {formatDate(relatedArticle.publishedAt || relatedArticle.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

// 博客内容渲染组件
interface BlogContentProps {
  content: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ content }) => {
  // 简单的 Markdown 渲染（实际项目中应使用 react-markdown）
  const renderMarkdown = (markdown: string) => {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div 
      className="blog-content"
      dangerouslySetInnerHTML={{
        __html: `<p>${renderMarkdown(content)}</p>`
      }}
    />
  );
};

export default BlogDetail;