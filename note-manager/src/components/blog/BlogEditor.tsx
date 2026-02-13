import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, Settings, Upload, Tag, Hash, Globe, Lock, Clock } from 'lucide-react';
import { useBlogEditor } from '../../hooks/useBlog';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownEditor from './MarkdownEditor';
import PublishOptions from './PublishOptions';
import { Visibility, ArticleStatus } from '../../types/blog';
import './BlogEditor.css';

const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const {
    title,
    content,
    tags,
    categories,
    excerpt,
    isAutoSaving,
    lastSaved,
    isDirty,
    readTime,
    wordCount,
    characterCount,
    handleTitleChange,
    handleContentChange,
    handleTagsChange,
    handleCategoriesChange,
    handleExcerptChange,
    saveDraftManually,
    publishArticle,
  } = useBlogEditor(id);

  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'preview' | 'editor'>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // 监听保存状态变化
  useEffect(() => {
    if (isAutoSaving) {
      setSaveStatus('saving');
    } else if (isDirty) {
      setSaveStatus('unsaved');
    } else {
      setSaveStatus('saved');
    }
  }, [isAutoSaving, isDirty]);

  // 页面离开确认
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      await saveDraftManually();
      setSaveStatus('saved');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (publishSettings: any) => {
    try {
      setIsSaving(true);
      const article = await publishArticle(publishSettings);
      navigate(`/blog/post/${article.id}`);
    } catch (error) {
      console.error('发布失败:', error);
    } finally {
      setIsSaving(false);
      setShowPublishOptions(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      handleTagsChange([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCategory = (category: string) => {
    if (category && !categories.includes(category)) {
      handleCategoriesChange([...categories, category]);
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    handleCategoriesChange(categories.filter(cat => cat !== categoryToRemove));
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Clock size={16} className="animate-spin" />;
      case 'unsaved':
        return <Save size={16} />;
      default:
        return <Save size={16} />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '保存中...';
      case 'unsaved':
        return '有未保存的更改';
      case 'saved':
        return lastSaved ? `已保存于 ${lastSaved.toLocaleTimeString()}` : '已保存';
    }
  };

  return (
    <div className="blog-editor">
      {/* 编辑器头部 */}
      <div className="editor-header">
        <div className="header-left">
          <h1 className="editor-title">
            {isEditing ? '编辑文章' : '创建新文章'}
          </h1>
          <div className="save-status">
            {getSaveStatusIcon()}
            <span className={`status-text ${saveStatus}`}>
              {getSaveStatusText()}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || !isDirty}
            className="btn btn-secondary"
          >
            <Save size={16} />
            保存草稿
          </button>
          
          <button
            onClick={() => setShowPublishOptions(true)}
            disabled={!title.trim() || !content.trim()}
            className="btn btn-primary"
          >
            <Upload size={16} />
            {isEditing ? '更新文章' : '发布文章'}
          </button>
        </div>
      </div>

      <div className="editor-container">
        {/* 侧边栏 */}
        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              <Settings size={16} />
              文章设置
            </h3>

            {/* 文章标题 */}
            <div className="form-group">
              <label htmlFor="title">文章标题</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="输入文章标题..."
                className="title-input"
              />
            </div>

            {/* 文章摘要 */}
            <div className="form-group">
              <label htmlFor="excerpt">文章摘要</label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => handleExcerptChange(e.target.value)}
                placeholder="简要描述文章内容（可选）..."
                rows={3}
                className="excerpt-textarea"
              />
              <small className="form-hint">
                {excerpt.length}/200 字符
              </small>
            </div>

            {/* 标签管理 */}
            <div className="form-group">
              <label>
                <Tag size={16} />
                标签
              </label>
              <TagInput
                tags={tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </div>

            {/* 分类管理 */}
            <div className="form-group">
              <label>
                <Hash size={16} />
                分类
              </label>
              <CategoryInput
                categories={categories}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
              />
            </div>
          </div>

          {/* 文章统计 */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">文章统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">字数</span>
                <span className="stat-value">{wordCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">字符数</span>
                <span className="stat-value">{characterCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">预计阅读</span>
                <span className="stat-value">{readTime} 分钟</span>
              </div>
            </div>
          </div>
        </div>

        {/* 主编辑区域 */}
        <div className="editor-main">
          <MarkdownEditor
            value={content}
            onChange={handleContentChange}
            placeholder="开始写作您的文章..."
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            autoSave={true}
            onAutoSave={handleSaveDraft}
            height="calc(100vh - 200px)"
          />
        </div>
      </div>

      {/* 发布选项弹窗 */}
      {showPublishOptions && (
        <PublishOptions
          isOpen={showPublishOptions}
          onClose={() => setShowPublishOptions(false)}
          onPublish={handlePublish}
          articleData={{
            title,
            content,
            excerpt,
            tags,
            categories,
          }}
          isEditing={isEditing}
        />
      )}
    </div>
  );
};

// 标签输入组件
interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onAddTag, onRemoveTag }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-list">
        {tags.map(tag => (
          <span key={tag} className="tag">
            <Tag size={12} />
            {tag}
            <button
              onClick={() => onRemoveTag(tag)}
              className="tag-remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="tag-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="添加标签..."
          className="tag-input-field"
        />
      </form>
    </div>
  );
};

// 分类输入组件
interface CategoryInputProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
  categories,
  onAddCategory,
  onRemoveCategory,
}) => {
  const [inputValue, setInputValue] = useState('');

  const predefinedCategories = [
    '技术', '生活', '工作', '学习', '思考', '随笔',
    '前端', '后端', '设计', '产品', '创业', '投资'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddCategory(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="category-input">
      <div className="category-list">
        {categories.map(category => (
          <span key={category} className="category">
            {category}
            <button
              onClick={() => onRemoveCategory(category)}
              className="category-remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      
      <div className="predefined-categories">
        {predefinedCategories
          .filter(cat => !categories.includes(cat))
          .slice(0, 6)
          .map(category => (
          <button
            key={category}
            onClick={() => onAddCategory(category)}
            className="predefined-category"
          >
            {category}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="category-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="自定义分类..."
          className="category-input-field"
        />
      </form>
    </div>
  );
};

export default BlogEditor;