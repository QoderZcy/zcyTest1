import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Search, Filter, MoreHorizontal } from 'lucide-react';
import { useBlog } from '../../contexts/BlogContext';
import { BlogArticle, BlogDraft, ArticleStatus, Visibility } from '../../types/blog';
import { formatDate } from '../../utils/dateUtils';
import './BlogManagement.css';

const BlogManagement: React.FC = () => {
  const {
    articles,
    drafts,
    filter,
    isLoading,
    loadArticles,
    loadDrafts,
    deleteArticle,
    deleteDraft,
    publishArticle,
    unpublishArticle,
    setFilter,
  } = useBlog();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadArticles({ status: ArticleStatus.PUBLISHED }, { currentPage: 1, pageSize: 20 });
    loadDrafts();
  }, []);

  const handleSearch = () => {
    if (activeTab === 'published') {
      setFilter({ searchTerm });
    }
    // 草稿搜索在本地进行
  };

  const handleEdit = (id: string) => {
    navigate(`/blog/edit/${id}`);
  };

  const handleDelete = async (id: string, isDraft: boolean = false) => {
    if (window.confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      try {
        if (isDraft) {
          await deleteDraft(id);
        } else {
          await deleteArticle(id);
        }
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishArticle(id);
      // 刷新列表
      loadArticles({ status: ArticleStatus.PUBLISHED }, { currentPage: 1, pageSize: 20 });
      loadDrafts();
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  const handleUnpublish = async (id: string) => {
    if (window.confirm('确定要取消发布这篇文章吗？文章将变为草稿状态。')) {
      try {
        await unpublishArticle(id);
        // 刷新列表
        loadArticles({ status: ArticleStatus.PUBLISHED }, { currentPage: 1, pageSize: 20 });
        loadDrafts();
      } catch (error) {
        console.error('取消发布失败:', error);
      }
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentItems = activeTab === 'published' ? articles : drafts;
    const allIds = currentItems.map(item => item.id);
    setSelectedItems(selectedItems.length === allIds.length ? [] : allIds);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`确定要删除选中的 ${selectedItems.length} 篇文章吗？此操作不可恢复。`)) {
      try {
        const promises = selectedItems.map(id => 
          activeTab === 'published' ? deleteArticle(id) : deleteDraft(id)
        );
        await Promise.all(promises);
        setSelectedItems([]);
        setShowBulkActions(false);
      } catch (error) {
        console.error('批量删除失败:', error);
      }
    }
  };

  const filteredDrafts = drafts.filter(draft => 
    !searchTerm || 
    draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = activeTab === 'published' ? articles : filteredDrafts;
  const isAllSelected = selectedItems.length === currentItems.length && currentItems.length > 0;

  return (
    <div className="blog-management">
      <div className="management-container">
        {/* 头部 */}
        <div className="management-header">
          <div className="header-left">
            <h1>文章管理</h1>
            <p>管理您的博客文章和草稿</p>
          </div>
          
          <div className="header-actions">
            <Link to="/blog/create" className="btn btn-primary">
              <Plus size={16} />
              写新文章
            </Link>
          </div>
        </div>

        {/* 标签导航 */}
        <div className="management-tabs">
          <button
            className={`tab ${activeTab === 'published' ? 'active' : ''}`}
            onClick={() => setActiveTab('published')}
          >
            已发布 ({articles.length})
          </button>
          <button
            className={`tab ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafts')}
          >
            草稿 ({drafts.length})
          </button>
        </div>

        {/* 工具栏 */}
        <div className="management-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            {selectedItems.length > 0 && (
              <div className="bulk-actions">
                <span className="selected-count">
                  已选择 {selectedItems.length} 项
                </span>
                <button 
                  onClick={handleBulkDelete}
                  className="bulk-action-btn delete"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            )}
          </div>
          
          <div className="toolbar-right">
            <button className="filter-btn">
              <Filter size={16} />
              筛选
            </button>
          </div>
        </div>

        {/* 文章列表 */}
        <div className="articles-list">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="empty-state">
              <h3>暂无{activeTab === 'published' ? '已发布文章' : '草稿'}</h3>
              <p>
                {activeTab === 'published' 
                  ? '您还没有发布任何文章，开始创作您的第一篇博客吧！'
                  : '您还没有保存任何草稿。'
                }
              </p>
              <Link to="/blog/create" className="btn btn-primary">
                <Plus size={16} />
                写新文章
              </Link>
            </div>
          ) : (
            <>
              {/* 表头 */}
              <div className="list-header">
                <div className="header-cell checkbox-cell">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="header-cell title-cell">标题</div>
                <div className="header-cell status-cell">状态</div>
                <div className="header-cell date-cell">日期</div>
                <div className="header-cell actions-cell">操作</div>
              </div>

              {/* 文章列表 */}
              <div className="list-body">
                {currentItems.map(item => (
                  <ArticleRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={() => handleSelectItem(item.id)}
                    onEdit={() => handleEdit(item.id)}
                    onDelete={() => handleDelete(item.id, activeTab === 'drafts')}
                    onPublish={activeTab === 'drafts' ? () => handlePublish(item.id) : undefined}
                    onUnpublish={activeTab === 'published' ? () => handleUnpublish(item.id) : undefined}
                    isDraft={activeTab === 'drafts'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 文章行组件
interface ArticleRowProps {
  item: BlogArticle | BlogDraft;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  isDraft: boolean;
}

const ArticleRow: React.FC<ArticleRowProps> = ({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  isDraft,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusBadge = () => {
    if (isDraft) {
      return <span className="status-badge draft">草稿</span>;
    }
    
    const article = item as BlogArticle;
    switch (article.status) {
      case ArticleStatus.PUBLISHED:
        return <span className="status-badge published">已发布</span>;
      case ArticleStatus.DRAFT:
        return <span className="status-badge draft">草稿</span>;
      case ArticleStatus.ARCHIVED:
        return <span className="status-badge archived">已归档</span>;
      default:
        return <span className="status-badge draft">草稿</span>;
    }
  };

  const getVisibilityIcon = () => {
    if (isDraft) return null;
    
    const article = item as BlogArticle;
    switch (article.visibility) {
      case Visibility.PRIVATE:
        return '🔒';
      case Visibility.PASSWORD:
        return '🔐';
      case Visibility.UNLISTED:
        return '👁️';
      default:
        return '🌐';
    }
  };

  return (
    <div className={`article-row ${isSelected ? 'selected' : ''}`}>
      <div className="row-cell checkbox-cell">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
        />
      </div>
      
      <div className="row-cell title-cell">
        <div className="article-title">
          {getVisibilityIcon()}
          <span>{item.title || '无标题'}</span>
        </div>
        <div className="article-excerpt">
          {isDraft 
            ? item.content.slice(0, 100) + '...'
            : (item as BlogArticle).excerpt || item.content.slice(0, 100) + '...'
          }
        </div>
      </div>
      
      <div className="row-cell status-cell">
        {getStatusBadge()}
      </div>
      
      <div className="row-cell date-cell">
        <div className="date-info">
          <div>{formatDate(item.updatedAt)}</div>
          <small>更新于</small>
        </div>
      </div>
      
      <div className="row-cell actions-cell">
        <div className="article-actions">
          <button onClick={onEdit} className="action-btn edit" title="编辑">
            <Edit size={14} />
          </button>
          
          {!isDraft && (
            <Link to={`/blog/post/${item.id}`} className="action-btn view" title="查看">
              <Eye size={14} />
            </Link>
          )}
          
          <div className="action-dropdown">
            <button 
              className="action-btn more"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreHorizontal size={14} />
            </button>
            
            {showActions && (
              <div className="dropdown-menu">
                {onPublish && (
                  <button onClick={onPublish} className="dropdown-item">
                    发布
                  </button>
                )}
                {onUnpublish && (
                  <button onClick={onUnpublish} className="dropdown-item">
                    取消发布
                  </button>
                )}
                <button onClick={onDelete} className="dropdown-item danger">
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;