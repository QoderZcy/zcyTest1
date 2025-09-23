import React, { useState } from 'react';
import { Globe, Lock, Eye, Calendar, Clock, Tag } from 'lucide-react';
import { Visibility, ArticleStatus } from '../../types/blog';
import './PublishOptions.css';

interface PublishOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (options: PublishSettings) => void;
  articleData: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    categories: string[];
  };
  isEditing?: boolean;
}

interface PublishSettings {
  visibility: Visibility;
  publishedAt?: Date;
  password?: string;
  status: ArticleStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

const PublishOptions: React.FC<PublishOptionsProps> = ({
  isOpen,
  onClose,
  onPublish,
  articleData,
  isEditing = false,
}) => {
  const [settings, setSettings] = useState<PublishSettings>({
    visibility: Visibility.PUBLIC,
    status: ArticleStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  const [customPublishDate, setCustomPublishDate] = useState(false);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 16));

  const handleVisibilityChange = (visibility: Visibility) => {
    setSettings(prev => ({ ...prev, visibility }));
  };

  const handlePublish = () => {
    const publishSettings = {
      ...settings,
      publishedAt: customPublishDate ? new Date(publishDate) : new Date(),
    };
    onPublish(publishSettings);
  };

  const handleSaveAsDraft = () => {
    const draftSettings = {
      ...settings,
      status: ArticleStatus.DRAFT,
    };
    onPublish(draftSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="publish-options-overlay">
      <div className="publish-options-modal">
        <div className="modal-header">
          <h2>{isEditing ? '更新文章' : '发布文章'}</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="modal-content">
          {/* 文章预览 */}
          <div className="article-preview">
            <h3>文章预览</h3>
            <div className="preview-card">
              <h4 className="preview-title">{articleData.title || '无标题'}</h4>
              <p className="preview-excerpt">
                {articleData.excerpt || articleData.content.slice(0, 150) + '...'}
              </p>
              <div className="preview-meta">
                <span>{articleData.tags.length} 个标签</span>
                <span>{articleData.categories.length} 个分类</span>
                <span>{articleData.content.length} 字符</span>
              </div>
            </div>
          </div>

          {/* 可见性设置 */}
          <div className="settings-section">
            <h3>可见性设置</h3>
            <div className="visibility-options">
              <label className={`visibility-option ${settings.visibility === Visibility.PUBLIC ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  value={Visibility.PUBLIC}
                  checked={settings.visibility === Visibility.PUBLIC}
                  onChange={() => handleVisibilityChange(Visibility.PUBLIC)}
                />
                <div className="option-content">
                  <Globe size={20} />
                  <div>
                    <div className="option-title">公开</div>
                    <div className="option-description">所有人都可以查看这篇文章</div>
                  </div>
                </div>
              </label>

              <label className={`visibility-option ${settings.visibility === Visibility.UNLISTED ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  value={Visibility.UNLISTED}
                  checked={settings.visibility === Visibility.UNLISTED}
                  onChange={() => handleVisibilityChange(Visibility.UNLISTED)}
                />
                <div className="option-content">
                  <Eye size={20} />
                  <div>
                    <div className="option-title">不公开列出</div>
                    <div className="option-description">只有拥有链接的人才能查看</div>
                  </div>
                </div>
              </label>

              <label className={`visibility-option ${settings.visibility === Visibility.PRIVATE ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  value={Visibility.PRIVATE}
                  checked={settings.visibility === Visibility.PRIVATE}
                  onChange={() => handleVisibilityChange(Visibility.PRIVATE)}
                />
                <div className="option-content">
                  <Lock size={20} />
                  <div>
                    <div className="option-title">私有</div>
                    <div className="option-description">只有您可以查看这篇文章</div>
                  </div>
                </div>
              </label>

              <label className={`visibility-option ${settings.visibility === Visibility.PASSWORD ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  value={Visibility.PASSWORD}
                  checked={settings.visibility === Visibility.PASSWORD}
                  onChange={() => handleVisibilityChange(Visibility.PASSWORD)}
                />
                <div className="option-content">
                  <Lock size={20} />
                  <div>
                    <div className="option-title">密码保护</div>
                    <div className="option-description">需要密码才能查看</div>
                  </div>
                </div>
              </label>
            </div>

            {settings.visibility === Visibility.PASSWORD && (
              <div className="password-input">
                <label htmlFor="password">访问密码</label>
                <input
                  id="password"
                  type="password"
                  value={settings.password || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="设置访问密码"
                />
              </div>
            )}
          </div>

          {/* 发布时间设置 */}
          <div className="settings-section">
            <h3>发布时间</h3>
            <div className="publish-time-options">
              <label className="time-option">
                <input
                  type="radio"
                  name="publishTime"
                  checked={!customPublishDate}
                  onChange={() => setCustomPublishDate(false)}
                />
                <Clock size={16} />
                立即发布
              </label>
              
              <label className="time-option">
                <input
                  type="radio"
                  name="publishTime"
                  checked={customPublishDate}
                  onChange={() => setCustomPublishDate(true)}
                />
                <Calendar size={16} />
                自定义发布时间
              </label>
            </div>

            {customPublishDate && (
              <div className="custom-date-input">
                <input
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>

          {/* SEO 设置 */}
          <div className="settings-section">
            <h3>SEO 设置（可选）</h3>
            <div className="seo-settings">
              <div className="form-group">
                <label htmlFor="seoTitle">SEO 标题</label>
                <input
                  id="seoTitle"
                  type="text"
                  value={settings.seoTitle || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder={articleData.title}
                  maxLength={60}
                />
                <small>{(settings.seoTitle || '').length}/60 字符</small>
              </div>

              <div className="form-group">
                <label htmlFor="seoDescription">SEO 描述</label>
                <textarea
                  id="seoDescription"
                  value={settings.seoDescription || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder={articleData.excerpt || '文章描述'}
                  maxLength={160}
                  rows={3}
                />
                <small>{(settings.seoDescription || '').length}/160 字符</small>
              </div>

              <div className="form-group">
                <label htmlFor="seoKeywords">SEO 关键词</label>
                <input
                  id="seoKeywords"
                  type="text"
                  placeholder="关键词1, 关键词2, 关键词3"
                  onChange={(e) => {
                    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                    setSettings(prev => ({ ...prev, seoKeywords: keywords }));
                  }}
                />
                <small>用逗号分隔多个关键词</small>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            取消
          </button>
          
          <button 
            onClick={handleSaveAsDraft}
            className="btn btn-outline"
          >
            保存草稿
          </button>
          
          <button 
            onClick={handlePublish}
            className="btn btn-primary"
            disabled={!articleData.title.trim() || !articleData.content.trim()}
          >
            {customPublishDate && new Date(publishDate) > new Date() 
              ? '定时发布' 
              : isEditing ? '更新' : '发布'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishOptions;