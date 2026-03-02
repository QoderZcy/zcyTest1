import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  FileText, 
  Tag, 
  Settings, 
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';
import { useBlogEditor, useBlogPost, useBlogCategories } from '../hooks/useBlog';
import MarkdownRenderer from './MarkdownRenderer';
import { PublishStatus } from '../types/blog';

interface BlogPostEditorProps {
  postId?: string;
}

/**
 * 博客文章编辑器组件
 * 提供文章的创建和编辑功能
 */
const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ postId: propPostId }) => {
  const { postId: paramPostId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const postId = propPostId || paramPostId;
  const isEditing = Boolean(postId);

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showSettings, setShowSettings] = useState(false);
  const [newTag, setNewTag] = useState('');

  // 获取文章数据（如果是编辑模式）
  const { post, loading: postLoading, error: postError } = useBlogPost(postId || null);
  
  // 获取分类列表
  const { categories, loading: categoriesLoading } = useBlogCategories();

  // 使用编辑器hook
  const {
    title,
    content,
    category,
    tags,
    status,
    isDirty,
    saving,
    error,
    canSave,
    updateTitle,
    updateContent,
    updateCategory,
    updateTags,
    updateStatus,
    addTag,
    removeTag,
    savePost,
    resetForm
  } = useBlogEditor(post || undefined);

  // 当文章数据加载完成后，重置表单
  useEffect(() => {
    if (post && !postLoading) {
      resetForm();
    }
  }, [post, postLoading, resetForm]);

  const handleSave = async () => {
    try {
      const savedPost = await savePost(postId);
      if (!isEditing) {
        // 如果是新建文章，保存后跳转到编辑页面
        navigate(`/blog/edit/${savedPost.id}`, { replace: true });
      }
    } catch (err) {
      console.error('保存文章失败:', err);
    }
  };

  const handlePublish = async () => {
    try {
      updateStatus(PublishStatus.PUBLISHED);
      await savePost(postId);
      navigate(`/blog/post/${postId || 'new'}`);
    } catch (err) {
      console.error('发布文章失败:', err);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('有未保存的更改，确定要离开吗？')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (postLoading) {
    return (
      <div className="blog-editor-loading">
        <p>正在加载文章...</p>
      </div>
    );
  }

  if (postError) {
    return (
      <div className="blog-editor-error">
        <p>加载文章失败: {postError}</p>
        <button onClick={() => navigate('/blog')} className="back-btn">
          返回文章列表
        </button>
      </div>
    );
  }

  return (
    <div className="blog-post-editor">
      <header className="blog-editor-header">
        <div className="blog-editor-nav">
          <button onClick={handleCancel} className="back-btn">
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          
          <h1 className="blog-editor-title">
            {isEditing ? '编辑文章' : '创建文章'}
          </h1>
        </div>

        <div className="blog-editor-actions">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`blog-editor-btn ${showSettings ? 'active' : ''}`}
          >
            <Settings size={16} />
            <span>设置</span>
          </button>

          <div className="blog-editor-tabs">
            <button
              onClick={() => setActiveTab('edit')}
              className={`blog-editor-tab ${activeTab === 'edit' ? 'active' : ''}`}
            >
              <FileText size={16} />
              <span>编辑</span>
            </button>
            
            <button
              onClick={() => setActiveTab('preview')}
              className={`blog-editor-tab ${activeTab === 'preview' ? 'active' : ''}`}
            >
              <Eye size={16} />
              <span>预览</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="blog-editor-btn blog-editor-btn-primary"
          >
            <Save size={16} />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={!canSave || saving}
            className="blog-editor-btn blog-editor-btn-success"
          >
            <Eye size={16} />
            <span>发布</span>
          </button>
        </div>
      </header>

      <div className="blog-editor-body">
        {showSettings && (
          <aside className="blog-editor-sidebar">
            <div className="blog-editor-settings">
              <h3>文章设置</h3>

              <div className="blog-editor-field">
                <label htmlFor="category">分类</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => updateCategory(e.target.value)}
                  className="blog-editor-select"
                  disabled={categoriesLoading}
                >
                  <option value="">选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="blog-editor-field">
                <label>标签</label>
                <div className="blog-editor-tags">
                  {tags.map((tag, index) => (
                    <span key={index} className="blog-editor-tag">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="blog-editor-tag-remove"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  
                  <div className="blog-editor-tag-input">
                    <input
                      type="text"
                      placeholder="添加标签"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="blog-editor-input"
                    />
                    <button
                      onClick={handleAddTag}
                      className="blog-editor-tag-add"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="blog-editor-field">
                <label htmlFor="status">状态</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => updateStatus(e.target.value as PublishStatus)}
                  className="blog-editor-select"
                >
                  <option value={PublishStatus.DRAFT}>草稿</option>
                  <option value={PublishStatus.PUBLISHED}>已发布</option>
                  <option value={PublishStatus.SCHEDULED}>定时发布</option>
                </select>
              </div>

              {error && (
                <div className="blog-editor-error">
                  {error}
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="blog-editor-main">
          <div className="blog-editor-title-input">
            <input
              type="text"
              placeholder="文章标题..."
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              className="blog-editor-title-field"
            />
          </div>

          <div className="blog-editor-content">
            {activeTab === 'edit' ? (
              <textarea
                placeholder="开始写作..."
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                className="blog-editor-textarea"
              />
            ) : (
              <div className="blog-editor-preview">
                <h1 className="preview-title">{title || '无标题'}</h1>
                <MarkdownRenderer 
                  content={content || '暂无内容'} 
                  className="preview-content"
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {isDirty && (
        <div className="blog-editor-status">
          <span className="unsaved-indicator">有未保存的更改</span>
        </div>
      )}
    </div>
  );
};

export default BlogPostEditor;