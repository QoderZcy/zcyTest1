import React, { useState } from 'react';
import { BookOpen, Settings, Tag, Globe, Lock, Eye } from 'lucide-react';
import { Note } from '../../types/note';
import { ConvertSettings, Visibility } from '../../types/blog';
import { useBlog } from '../../contexts/BlogContext';

interface NoteConverterProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (settings: ConvertSettings) => Promise<void>;
}

const NoteConverter: React.FC<NoteConverterProps> = ({
  note,
  isOpen,
  onClose,
  onConvert,
}) => {
  const [settings, setSettings] = useState<ConvertSettings>({
    visibility: Visibility.PUBLIC,
    publishImmediately: false,
    addCategories: [],
    addTags: [],
    generateExcerpt: true,
    preserveFormatting: true,
  });

  const [isConverting, setIsConverting] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [customTag, setCustomTag] = useState('');

  const handleConvert = async () => {
    try {
      setIsConverting(true);
      await onConvert(settings);
      onClose();
    } catch (error) {
      console.error('转换失败:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const addCategory = () => {
    if (customCategory && !settings.addCategories.includes(customCategory)) {
      setSettings(prev => ({
        ...prev,
        addCategories: [...prev.addCategories, customCategory],
      }));
      setCustomCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setSettings(prev => ({
      ...prev,
      addCategories: prev.addCategories.filter(c => c !== category),
    }));
  };

  const addTag = () => {
    if (customTag && !settings.addTags.includes(customTag)) {
      setSettings(prev => ({
        ...prev,
        addTags: [...prev.addTags, customTag],
      }));
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSettings(prev => ({
      ...prev,
      addTags: prev.addTags.filter(t => t !== tag),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className=\"note-converter-overlay\">
      <div className=\"note-converter-modal\">
        <div className=\"modal-header\">
          <div className=\"modal-title\">
            <BookOpen size={24} />
            <h2>转换为博客文章</h2>
          </div>
          <button onClick={onClose} className=\"close-btn\">
            ×
          </button>
        </div>

        <div className=\"modal-content\">
          {/* 便签预览 */}
          <div className=\"note-preview\">
            <h3>便签预览</h3>
            <div className=\"preview-card\">
              <h4>{note.title}</h4>
              <p className=\"preview-content\">
                {note.content.slice(0, 200)}
                {note.content.length > 200 && '...'}
              </p>
              <div className=\"preview-tags\">
                {note.tags.map(tag => (
                  <span key={tag} className=\"tag\">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 转换设置 */}
          <div className=\"convert-settings\">
            <h3>
              <Settings size={20} />
              转换设置
            </h3>

            {/* 可见性设置 */}
            <div className=\"setting-group\">
              <label className=\"setting-label\">文章可见性</label>
              <div className=\"visibility-options\">
                <button
                  className={`visibility-btn ${
                    settings.visibility === Visibility.PUBLIC ? 'active' : ''
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, visibility: Visibility.PUBLIC }))}
                >
                  <Globe size={16} />
                  公开
                </button>
                <button
                  className={`visibility-btn ${
                    settings.visibility === Visibility.UNLISTED ? 'active' : ''
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, visibility: Visibility.UNLISTED }))}
                >
                  <Eye size={16} />
                  不公开列出
                </button>
                <button
                  className={`visibility-btn ${
                    settings.visibility === Visibility.PRIVATE ? 'active' : ''
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, visibility: Visibility.PRIVATE }))}
                >
                  <Lock size={16} />
                  私有
                </button>
              </div>
            </div>

            {/* 发布选项 */}
            <div className=\"setting-group\">
              <label className=\"checkbox-label\">
                <input
                  type=\"checkbox\"
                  checked={settings.publishImmediately}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    publishImmediately: e.target.checked,
                  }))}
                />
                立即发布
              </label>
              <p className=\"setting-description\">
                {settings.publishImmediately 
                  ? '文章将立即发布并对外可见（根据可见性设置）'
                  : '文章将保存为草稿，您可以稍后发布'
                }
              </p>
            </div>

            {/* 额外分类 */}
            <div className=\"setting-group\">
              <label className=\"setting-label\">添加分类</label>
              <div className=\"input-with-button\">
                <input
                  type=\"text\"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder=\"输入分类名称\"
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button onClick={addCategory} disabled={!customCategory}>
                  添加
                </button>
              </div>
              {settings.addCategories.length > 0 && (
                <div className=\"tags-list\">
                  {settings.addCategories.map(category => (
                    <span key={category} className=\"tag\">
                      {category}
                      <button onClick={() => removeCategory(category)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 额外标签 */}
            <div className=\"setting-group\">
              <label className=\"setting-label\">添加标签</label>
              <div className=\"input-with-button\">
                <input
                  type=\"text\"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder=\"输入标签名称\"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button onClick={addTag} disabled={!customTag}>
                  添加
                </button>
              </div>
              {settings.addTags.length > 0 && (
                <div className=\"tags-list\">
                  {settings.addTags.map(tag => (
                    <span key={tag} className=\"tag\">
                      <Tag size={12} />
                      {tag}
                      <button onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <p className=\"setting-description\">
                原有标签：{note.tags.join('、')}
              </p>
            </div>

            {/* 其他选项 */}
            <div className=\"setting-group\">
              <label className=\"checkbox-label\">
                <input
                  type=\"checkbox\"
                  checked={settings.generateExcerpt}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    generateExcerpt: e.target.checked,
                  }))}
                />
                自动生成摘要
              </label>
              
              <label className=\"checkbox-label\">
                <input
                  type=\"checkbox\"
                  checked={settings.preserveFormatting}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    preserveFormatting: e.target.checked,
                  }))}
                />
                保持原有格式
              </label>
            </div>
          </div>
        </div>

        <div className=\"modal-footer\">
          <button onClick={onClose} className=\"btn btn-secondary\">
            取消
          </button>
          <button 
            onClick={handleConvert} 
            className=\"btn btn-primary\"
            disabled={isConverting}
          >
            {isConverting ? '转换中...' : '转换为博客'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 便签转博客的批量转换组件
interface BatchNoteConverterProps {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onBatchConvert: (notes: Note[], settings: ConvertSettings) => Promise<void>;
}

const BatchNoteConverter: React.FC<BatchNoteConverterProps> = ({
  notes,
  isOpen,
  onClose,
  onBatchConvert,
}) => {
  const [settings, setSettings] = useState<ConvertSettings>({
    visibility: Visibility.PUBLIC,
    publishImmediately: false,
    addCategories: ['便签转换'],
    addTags: [],
    generateExcerpt: true,
    preserveFormatting: true,
  });

  const [isConverting, setIsConverting] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>(notes.map(n => n.id));

  const handleBatchConvert = async () => {
    try {
      setIsConverting(true);
      const notesToConvert = notes.filter(note => selectedNotes.includes(note.id));
      await onBatchConvert(notesToConvert, settings);
      onClose();
    } catch (error) {
      console.error('批量转换失败:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const selectAll = () => {
    setSelectedNotes(notes.map(n => n.id));
  };

  const selectNone = () => {
    setSelectedNotes([]);
  };

  if (!isOpen) return null;

  return (
    <div className=\"note-converter-overlay\">
      <div className=\"note-converter-modal batch-converter\">
        <div className=\"modal-header\">
          <div className=\"modal-title\">
            <BookOpen size={24} />
            <h2>批量转换便签为博客文章</h2>
          </div>
          <button onClick={onClose} className=\"close-btn\">
            ×
          </button>
        </div>

        <div className=\"modal-content\">
          {/* 便签选择 */}
          <div className=\"note-selection\">
            <div className=\"selection-header\">
              <h3>选择要转换的便签 ({selectedNotes.length}/{notes.length})</h3>
              <div className=\"selection-actions\">
                <button onClick={selectAll} className=\"btn btn-sm\">
                  全选
                </button>
                <button onClick={selectNone} className=\"btn btn-sm\">
                  全不选
                </button>
              </div>
            </div>
            
            <div className=\"notes-list\">
              {notes.map(note => (
                <div key={note.id} className=\"note-item\">
                  <label className=\"note-checkbox\">
                    <input
                      type=\"checkbox\"
                      checked={selectedNotes.includes(note.id)}
                      onChange={() => toggleNoteSelection(note.id)}
                    />
                    <div className=\"note-info\">
                      <h4>{note.title}</h4>
                      <p>{note.content.slice(0, 100)}...</p>
                      <div className=\"note-meta\">
                        <span>{note.tags.length} 个标签</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 批量转换设置（简化版） */}
          <div className=\"convert-settings\">
            <h3>批量转换设置</h3>
            
            <div className=\"setting-group\">
              <label className=\"setting-label\">统一可见性</label>
              <select 
                value={settings.visibility}
                onChange={(e) => setSettings(prev => ({
                  ...prev, 
                  visibility: e.target.value as Visibility
                }))}
              >
                <option value={Visibility.PUBLIC}>公开</option>
                <option value={Visibility.UNLISTED}>不公开列出</option>
                <option value={Visibility.PRIVATE}>私有</option>
              </select>
            </div>

            <div className=\"setting-group\">
              <label className=\"checkbox-label\">
                <input
                  type=\"checkbox\"
                  checked={settings.publishImmediately}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    publishImmediately: e.target.checked,
                  }))}
                />
                立即发布所有文章
              </label>
            </div>

            <div className=\"setting-group\">
              <label className=\"checkbox-label\">
                <input
                  type=\"checkbox\"
                  checked={settings.generateExcerpt}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    generateExcerpt: e.target.checked,
                  }))}
                />
                自动生成摘要
              </label>
            </div>
          </div>
        </div>

        <div className=\"modal-footer\">
          <button onClick={onClose} className=\"btn btn-secondary\">
            取消
          </button>
          <button 
            onClick={handleBatchConvert} 
            className=\"btn btn-primary\"
            disabled={isConverting || selectedNotes.length === 0}
          >
            {isConverting 
              ? `转换中... (${selectedNotes.length}篇)` 
              : `转换 ${selectedNotes.length} 篇便签`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// 便签转博客的主要组件，集成到便签列表中
interface NoteConverterButtonProps {
  note?: Note;
  notes?: Note[];
  variant: 'single' | 'batch';
}

const NoteConverterButton: React.FC<NoteConverterButtonProps> = ({
  note,
  notes = [],
  variant,
}) => {
  const { convertNoteToArticle, batchConvertNotes } = useBlog();
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  const handleSingleConvert = async (settings: ConvertSettings) => {
    if (!note) return;
    
    try {
      const article = await convertNoteToArticle(note, settings);
      console.log('便签转换成功:', article);
      // 可以显示成功提示或跳转到博客页面
    } catch (error) {
      console.error('便签转换失败:', error);
      // 显示错误提示
    }
  };

  const handleBatchConvert = async (selectedNotes: Note[], settings: ConvertSettings) => {
    try {
      const articles = await batchConvertNotes(selectedNotes, settings);
      console.log('批量转换成功:', articles);
      // 可以显示成功提示或跳转到博客页面
    } catch (error) {
      console.error('批量转换失败:', error);
      // 显示错误提示
    }
  };

  if (variant === 'single' && note) {
    return (
      <>
        <button
          onClick={() => setIsConverterOpen(true)}
          className=\"note-converter-btn\"
          title=\"转换为博客文章\"
        >
          <BookOpen size={16} />
          转换为博客
        </button>
        
        <NoteConverter
          note={note}
          isOpen={isConverterOpen}
          onClose={() => setIsConverterOpen(false)}
          onConvert={handleSingleConvert}
        />
      </>
    );
  }

  if (variant === 'batch' && notes.length > 0) {
    return (
      <>
        <button
          onClick={() => setIsConverterOpen(true)}
          className=\"batch-converter-btn btn btn-secondary\"
        >
          <BookOpen size={16} />
          批量转换为博客 ({notes.length})
        </button>
        
        <BatchNoteConverter
          notes={notes}
          isOpen={isConverterOpen}
          onClose={() => setIsConverterOpen(false)}
          onBatchConvert={handleBatchConvert}
        />
      </>
    );
  }

  return null;
};

export { NoteConverter, BatchNoteConverter, NoteConverterButton };
export default NoteConverterButton;