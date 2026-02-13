import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Link, Code, Image, List, Quote, Eye, EyeOff, Save, Upload } from 'lucide-react';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  previewMode?: 'split' | 'preview' | 'editor';
  onPreviewModeChange?: (mode: 'split' | 'preview' | 'editor') => void;
  autoSave?: boolean;
  onAutoSave?: () => void;
  height?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '开始写作...',
  previewMode = 'split',
  onPreviewModeChange,
  autoSave = true,
  onAutoSave,
  height = '400px',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 自动保存功能
  useEffect(() => {
    if (autoSave && onAutoSave) {
      const timer = setTimeout(() => {
        onAutoSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [value, autoSave, onAutoSave]);

  // 工具栏操作
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);

    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarActions = {
    bold: () => insertText('**', '**', '粗体文字'),
    italic: () => insertText('*', '*', '斜体文字'),
    link: () => insertText('[', '](http://)', '链接文字'),
    code: () => insertText('`', '`', '代码'),
    codeBlock: () => insertText('\n```\n', '\n```\n', '代码块'),
    image: () => insertText('![', '](http://)', '图片描述'),
    list: () => insertText('\n- ', '', '列表项'),
    numberedList: () => insertText('\n1. ', '', '列表项'),
    quote: () => insertText('\n> ', '', '引用文字'),
    heading1: () => insertText('\n# ', '', '一级标题'),
    heading2: () => insertText('\n## ', '', '二级标题'),
    heading3: () => insertText('\n### ', '', '三级标题'),
  };

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          toolbarActions.bold();
          break;
        case 'i':
          e.preventDefault();
          toolbarActions.italic();
          break;
        case 'k':
          e.preventDefault();
          toolbarActions.link();
          break;
        case 's':
          e.preventDefault();
          onAutoSave?.();
          break;
      }
    }

    // Tab 键处理
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  // 拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // 这里应该上传图片并获取URL
        const imageUrl = URL.createObjectURL(file);
        insertText(`![${file.name}](${imageUrl})`);
      }
    });
  };

  // 简单的 Markdown 预览渲染
  const renderPreview = (markdown: string) => {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div className="markdown-editor">
      {/* 工具栏 */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={toolbarActions.bold}
            className="toolbar-btn"
            title="粗体 (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={toolbarActions.italic}
            className="toolbar-btn"
            title="斜体 (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={toolbarActions.link}
            className="toolbar-btn"
            title="链接 (Ctrl+K)"
          >
            <Link size={16} />
          </button>
          <button
            type="button"
            onClick={toolbarActions.code}
            className="toolbar-btn"
            title="行内代码"
          >
            <Code size={16} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={toolbarActions.image}
            className="toolbar-btn"
            title="插入图片"
          >
            <Image size={16} />
          </button>
          <button
            type="button"
            onClick={toolbarActions.list}
            className="toolbar-btn"
            title="无序列表"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={toolbarActions.quote}
            className="toolbar-btn"
            title="引用"
          >
            <Quote size={16} />
          </button>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              const action = e.target.value;
              if (action && toolbarActions[action as keyof typeof toolbarActions]) {
                toolbarActions[action as keyof typeof toolbarActions]();
              }
              e.target.value = '';
            }}
            className="heading-select"
          >
            <option value="">标题</option>
            <option value="heading1">H1</option>
            <option value="heading2">H2</option>
            <option value="heading3">H3</option>
          </select>
        </div>

        <div className="toolbar-group">
          {onAutoSave && (
            <button
              type="button"
              onClick={onAutoSave}
              className="toolbar-btn"
              title="保存 (Ctrl+S)"
            >
              <Save size={16} />
            </button>
          )}
        </div>

        {onPreviewModeChange && (
          <div className="toolbar-group preview-controls">
            <button
              type="button"
              onClick={() => onPreviewModeChange('editor')}
              className={`toolbar-btn ${previewMode === 'editor' ? 'active' : ''}`}
              title="编辑模式"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => onPreviewModeChange('split')}
              className={`toolbar-btn ${previewMode === 'split' ? 'active' : ''}`}
              title="分屏模式"
            >
              分屏
            </button>
            <button
              type="button"
              onClick={() => onPreviewModeChange('preview')}
              className={`toolbar-btn ${previewMode === 'preview' ? 'active' : ''}`}
              title="预览模式"
            >
              预览
            </button>
          </div>
        )}
      </div>

      {/* 编辑器内容区 */}
      <div className={`editor-content ${previewMode}`} style={{ height }}>
        {/* 编辑器 */}
        {(previewMode === 'editor' || previewMode === 'split') && (
          <div
            className={`editor-panel ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="editor-textarea"
              spellCheck={false}
            />
            {isDragging && (
              <div className="drag-overlay">
                <Upload size={48} />
                <p>拖拽图片到这里上传</p>
              </div>
            )}
          </div>
        )}

        {/* 预览面板 */}
        {(previewMode === 'preview' || previewMode === 'split') && (
          <div className="preview-panel">
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{
                __html: renderPreview(value) || '<p class="empty-preview">预览内容将在这里显示...</p>'
              }}
            />
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="editor-status">
        <div className="status-left">
          <span>字符数: {value.length}</span>
          <span>单词数: {value.split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>行数: {value.split('\n').length}</span>
        </div>
        <div className="status-right">
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;