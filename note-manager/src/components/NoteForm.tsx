import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Tag } from 'lucide-react';
import type { Note, NewNote } from '../types/note';
import { NOTE_COLORS } from '../types/note';

interface NoteFormProps {
  note?: Note | null;
  onSave: (note: NewNote) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const NoteForm: React.FC<NoteFormProps> = ({
  note,
  onSave,
  onCancel,
  isOpen,
}) => {
  const [formData, setFormData] = useState<NewNote>({
    title: '',
    content: '',
    color: NOTE_COLORS[0],
    tags: [],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        color: note.color,
        tags: note.tags,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        color: NOTE_COLORS[0],
        tags: [],
      });
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() && !formData.content.trim()) {
      alert('请输入标题或内容');
      return;
    }
    onSave(formData);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{note ? '编辑便签' : '新建便签'}</h2>
          <button onClick={onCancel} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="note-form">
          <div className="form-group">
            <label htmlFor="title">标题</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入便签标题..."
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">内容</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入便签内容..."
              className="form-textarea"
              rows={6}
            />
          </div>
          
          <div className="form-group">
            <label>颜色</label>
            <div className="color-picker">
              {NOTE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>标签</label>
            <div className="tags-input">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入标签..."
                className="tag-input"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="add-tag-btn"
                disabled={!newTag.trim()}
              >
                <Plus size={16} />
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="tags-list">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag-item">
                    <Tag size={12} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="remove-tag-btn"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};