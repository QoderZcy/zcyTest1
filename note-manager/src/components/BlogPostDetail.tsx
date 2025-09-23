import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Eye, 
  Tag, 
  Edit3, 
  Trash2, 
  Archive,
  ArrowLeft,
  Share2,
  Bookmark
} from 'lucide-react';
import { useBlogPost } from '../hooks/useBlog';
import MarkdownRenderer from './MarkdownRenderer';
import BlogPostCard from './BlogPostCard';
import { PublishStatus } from '../types/blog';

interface BlogPostDetailProps {
  postId?: string;
  showActions?: boolean;
  showRelatedPosts?: boolean;
}

/**
 * 博客文章详情组件
 * 展示单篇文章的完整内容和相关操作
 */
const BlogPostDetail: React.FC<BlogPostDetailProps> = ({
  postId: propPostId,
  showActions = false,
  showRelatedPosts = true
}) => {
  const { postId: paramPostId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const postId = propPostId || paramPostId;

  const {
    post,
    relatedPosts,
    loading,
    error,
    updatePost,
    deletePost,
    publishPost,
    unpublishPost,
    archivePost
  } = useBlogPost(postId || null);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = (status: PublishStatus): string => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return 'status-published';
      case PublishStatus.DRAFT:
        return 'status-draft';
      case PublishStatus.ARCHIVED:
        return 'status-archived';
      case PublishStatus.SCHEDULED:
        return 'status-scheduled';
      default:
        return 'status-draft';
    }
  };

  const getStatusText = (status: PublishStatus): string => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return '已发布';
      case PublishStatus.DRAFT:
        return '草稿';
      case PublishStatus.ARCHIVED:
        return '已归档';
      case PublishStatus.SCHEDULED:
        return '定时发布';
      default:
        return '草稿';
    }
  };

  const handleEdit = () => {
    if (post) {
      navigate(`/blog/edit/${post.id}`);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    if (window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        await deletePost(post.id);
        navigate('/blog');
      } catch (err) {
        console.error('删除文章失败:', err);
      }
    }
  };

  const handleArchive = async () => {
    if (!post) return;
    
    try {
      await archivePost(post.id);
    } catch (err) {
      console.error('归档文章失败:', err);
    }
  };

  const handleStatusToggle = async () => {
    if (!post) return;
    
    try {
      if (post.status === PublishStatus.PUBLISHED) {
        await unpublishPost(post.id);
      } else {
        await publishPost(post.id);
      }
    } catch (err) {
      console.error('更改文章状态失败:', err);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    
    const url = `${window.location.origin}/blog/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: url
        });
      } catch (err) {
        console.error('分享失败:', err);
      }
    } else {
      // 降级方案：复制到剪贴板
      try {
        await navigator.clipboard.writeText(url);
        alert('链接已复制到剪贴板');
      } catch (err) {
        console.error('复制链接失败:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="blog-post-detail-loading">
        <p>正在加载文章...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-post-detail-error">
        <p>加载文章失败: {error}</p>
        <button onClick={() => navigate('/blog')} className="back-btn">
          返回文章列表
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-post-detail-not-found">
        <p>文章不存在</p>
        <button onClick={() => navigate('/blog')} className="back-btn">
          返回文章列表
        </button>
      </div>
    );
  }

  return (
    <div className="blog-post-detail">
      <header className="blog-post-detail-header">
        <div className="blog-post-detail-nav">
          <button 
            onClick={() => navigate(-1)} 
            className="back-btn"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>

          <div className="blog-post-detail-actions">
            <button
              onClick={handleShare}
              className="blog-post-action-btn"
              title="分享文章"
            >
              <Share2 size={16} />
            </button>

            <button
              className="blog-post-action-btn"
              title="收藏文章"
            >
              <Bookmark size={16} />
            </button>

            {showActions && (
              <>
                <button
                  onClick={handleEdit}
                  className="blog-post-action-btn"
                  title="编辑文章"
                >
                  <Edit3 size={16} />
                </button>
                
                <button
                  onClick={handleStatusToggle}
                  className="blog-post-action-btn"
                  title={post.status === PublishStatus.PUBLISHED ? '取消发布' : '发布文章'}
                >
                  {post.status === PublishStatus.PUBLISHED ? '取消发布' : '发布'}
                </button>
                
                <button
                  onClick={handleArchive}
                  className="blog-post-action-btn"
                  title="归档文章"
                >
                  <Archive size={16} />
                </button>
                
                <button
                  onClick={handleDelete}
                  className="blog-post-action-btn blog-post-action-danger"
                  title="删除文章"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="blog-post-detail-meta">
          <span className={`blog-post-status ${getStatusColor(post.status)}`}>
            {getStatusText(post.status)}
          </span>
          <span className="blog-post-category">{post.category}</span>
        </div>

        <h1 className="blog-post-detail-title">{post.title}</h1>

        <div className="blog-post-detail-info">
          <span className="blog-post-author">
            <User size={16} />
            {post.author.name || post.author.email}
          </span>
          
          <span className="blog-post-date">
            <Calendar size={16} />
            {post.status === PublishStatus.PUBLISHED 
              ? formatDate(post.publishedAt) 
              : formatDate(post.updatedAt)}
          </span>
          
          {post.status === PublishStatus.PUBLISHED && (
            <span className="blog-post-views">
              <Eye size={16} />
              {post.viewCount} 次阅读
            </span>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="blog-post-detail-tags">
            <Tag size={16} />
            {post.tags.map((tag, index) => (
              <Link 
                key={index} 
                to={`/blog?tags=${encodeURIComponent(tag)}`}
                className="blog-post-tag"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="blog-post-detail-content">
        <MarkdownRenderer 
          content={post.content}
          className="blog-post-content"
        />
      </main>

      {showRelatedPosts && relatedPosts.length > 0 && (
        <aside className="blog-post-detail-related">
          <h3>相关文章</h3>
          <div className="related-posts-grid">
            {relatedPosts.map((relatedPost) => (
              <BlogPostCard
                key={relatedPost.id}
                post={relatedPost}
                showActions={false}
              />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default BlogPostDetail;