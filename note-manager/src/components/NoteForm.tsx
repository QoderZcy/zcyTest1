import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Plus, Tag, Palette, Type, Hash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Note, NewNote } from '../types/note';
import { NOTE_COLORS } from '../types/note';
import { errorHandler } from '../services/errorHandler';

interface NoteFormProps {
  note?: Note | null;
  onSave: (note: NewNote) => void;
  onCancel: () => void;
  isOpen: boolean;
  loading?: boolean;
  allTags?: string[];
}

export const NoteForm: React.FC<NoteFormProps> = ({
  note,
  onSave,
  onCancel,
  isOpen,
  loading = false,
  allTags = [],
}) => {
  const [newTag, setNewTag] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      content: '',
      color: NOTE_COLORS[0],
      tags: [],
    },
  });
  
  const watchedValues = watch();
  const watchedTags = watch('tags');
  
  // 监听表单变化
  useEffect(() => {
    const subscription = watch(() => {
      setIsDirty(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);
  
  // 初始化表单数据
  useEffect(() => {
    if (note) {
      reset({
        title: note.title,
        content: note.content,
        color: note.color,
        tags: note.tags,
      });
    } else {
      reset({
        title: '',
        content: '',
        color: NOTE_COLORS[0],
        tags: [],
      });
    }
    setIsDirty(false);
  }, [note, reset]);
  
  // 自动聚焦到标题输入框
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 提交表单
  const onSubmit = async (data: NoteFormData) => {
    try {
      await onSave(data);
      setIsDirty(false);
    } catch (error) {
      console.error('保存便签失败:', error);
      errorHandler.handleError(error, { action: 'save_note' });
    }
  };
  
  // 取消表单
  const handleCancel = () => {
    if (isDirty) {
      const confirmClose = window.confirm('有未保存的更改，确定要关闭吗？');
      if (!confirmClose) return;
    }
    
    onCancel();
    setIsDirty(false);
  };

  // 添加标签
  const handleAddTag = () => {
    const tagToAdd = newTag.trim();
    if (!tagToAdd) return;
    
    if (watchedTags.includes(tagToAdd)) {
      alert('标签已存在');
      return;
    }
    
    if (watchedTags.length >= 10) {
      alert('标签数量不能超过10个');
      return;
    }
    
    const newTags = [...watchedTags, tagToAdd];
    setValue('tags', newTags);
    setNewTag('');
    setShowTagSuggestions(false);
    trigger('tags');
  };
  
  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags);
    trigger('tags');
  };
  
  // 选择建议标签
  const handleSelectSuggestedTag = (tag: string) => {
    setNewTag(tag);
    setShowTagSuggestions(false);
    setTimeout(() => handleAddTag(), 0);
  };
  
  // 过滤标签建议
  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(newTag.toLowerCase()) && 
    !watchedTags.includes(tag)
  ).slice(0, 5);
  
  // 键盘事件处理
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };
  
  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSubmit(onSubmit)();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSubmit, onSubmit]);
  
  // 表单统计信息
  const contentLength = watchedValues.content?.length || 0;
  const titleLength = watchedValues.title?.length || 0;
  const tagsCount = watchedTags.length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content note-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Type size={20} />
            <h2>{note ? '编辑便签' : '新建便签'}</h2>
            {isDirty && <span className="dirty-indicator">•</span>}
          </div>
          <button onClick={handleCancel} className="close-btn" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="note-form">
          {/* 标题输入 */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              标题 <span className="required">*</span>
              <span className="char-count">{titleLength}/100</span>
            </label>
            <input
              {...register('title')}
              ref={titleInputRef}
              id="title"
              type="text"
              placeholder="请输入便签标题..."
              className={`form-input ${errors.title ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <span className="error-message">{errors.title.message}</span>
            )}
          </div>
          
          {/* 内容输入 */}
          <div className="form-group">
            <label htmlFor="content" className="form-label">
              内容 <span className="required">*</span>
              <span className="char-count">{contentLength}/5000</span>
            </label>
            <textarea
              {...register('content')}
              id="content"
              placeholder="请输入便签内容..."
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              rows={8}
              disabled={isSubmitting}
            />
            {errors.content && (
              <span className="error-message">{errors.content.message}</span>
            )}
          </div>
          
          {/* 颜色选择 */}
          <div className="form-group">
            <label className="form-label">
              <Palette size={16} />
              颜色
            </label>
            <div className="color-picker">
              {NOTE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${watchedValues.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                  disabled={isSubmitting}
                  title={`选择颜色: ${color}`}
                />
              ))}
            </div>
          </div>
          
          {/* 标签管理 */}
          <div className="form-group">
            <label className="form-label">
              <Hash size={16} />
              标签
              <span className="tag-count">({tagsCount}/10)</span>
            </label>
            
            <div className="tags-input-container">
              <div className="tags-input">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={newTag}
                  onChange={(e) => {
                    setNewTag(e.target.value);
                    setShowTagSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleTagKeyPress}
                  onFocus={() => setShowTagSuggestions(newTag.length > 0)}
                  placeholder="输入标签..."
                  className="tag-input"
                  disabled={isSubmitting || tagsCount >= 10}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="add-tag-btn"
                  disabled={!newTag.trim() || isSubmitting || tagsCount >= 10}
                  title="添加标签"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {/* 标签建议 */}
              {showTagSuggestions && filteredTags.length > 0 && (
                <div className="tag-suggestions">
                  {filteredTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="tag-suggestion"
                      onClick={() => handleSelectSuggestedTag(tag)}
                    >
                      <Tag size={12} />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 已选标签 */}
            {watchedTags.length > 0 && (
              <div className="tags-list">
                {watchedTags.map(tag => (
                  <span key={tag} className="tag-item">
                    <Tag size={12} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="remove-tag-btn"
                      disabled={isSubmitting}
                      title={`移除标签: ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {errors.tags && (
              <span className="error-message">{errors.tags.message}</span>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <>
                  <div className="spinner" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存
                </>
              )}
            </button>
          </div>
          
          {/* 快捷键提示 */}
          <div className="form-shortcuts">
            <span className="shortcut-hint">Ctrl+S 或 Ctrl+Enter 保存，Esc 关闭</span>
          </div>
        </form>
      </div>
    </div>
  );
};