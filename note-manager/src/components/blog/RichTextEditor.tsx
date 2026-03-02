// Rich text editor for blog post creation

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  List, 
  ListOrdered,
  Quote,
  Code,
  Eye,
  EyeOff,
  Save,
  Upload,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autoSave?: boolean;
  onSave?: () => void;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing your blog post...',
  autoSave = true,
  onSave,
  className = ''
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && onSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        onSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, autoSave, onSave]);

  // Insert text at cursor position
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const textToInsert = selectedText || placeholder;
    const newText = before + textToInsert + after;
    
    const newContent = content.substring(0, start) + newText + content.substring(end);
    onChange(newContent);

    // Set cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length);
      }
      textarea.focus();
    }, 0);
  };

  // Insert line break and text
  const insertLine = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const beforeCursor = content.substring(0, start);
    const afterCursor = content.substring(start);
    
    // Check if we need to add line breaks
    const needsLineBreakBefore = beforeCursor && !beforeCursor.endsWith('\n');
    const needsLineBreakAfter = afterCursor && !afterCursor.startsWith('\n');
    
    const prefix = needsLineBreakBefore ? '\n' : '';
    const suffix = needsLineBreakAfter ? '\n' : '';
    
    const newContent = beforeCursor + prefix + text + suffix + afterCursor;
    onChange(newContent);

    // Set cursor position
    setTimeout(() => {
      const newPosition = start + prefix.length + text.length + suffix.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // Toolbar button handlers
  const handleBold = () => insertText('**', '**', 'bold text');
  const handleItalic = () => insertText('*', '*', 'italic text');
  const handleUnderline = () => insertText('<u>', '</u>', 'underlined text');
  const handleCode = () => insertText('`', '`', 'code');
  const handleLink = () => insertText('[', '](url)', 'link text');
  const handleImage = () => insertText('![', '](image-url)', 'alt text');
  const handleQuote = () => insertLine('> Quote text');
  const handleUnorderedList = () => insertLine('- List item');
  const handleOrderedList = () => insertLine('1. List item');
  const handleH1 = () => insertLine('# Heading 1');
  const handleH2 = () => insertLine('## Heading 2');
  const handleH3 = () => insertLine('### Heading 3');

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // In a real app, you would upload the file and get a URL
        const imageMarkdown = `![${file.name}](uploaded-image-url)\n`;
        onChange(content + imageMarkdown);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleBold();
          break;
        case 'i':
          e.preventDefault();
          handleItalic();
          break;
        case 's':
          e.preventDefault();
          onSave?.();
          break;
        case 'k':
          e.preventDefault();
          handleLink();
          break;
      }
    }
  };

  // Custom components for markdown rendering
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleH1}
            title="Heading 1 (Ctrl+1)"
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleH2}
            title="Heading 2 (Ctrl+2)"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleH3}
            title="Heading 3 (Ctrl+3)"
          >
            <Heading3 size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleBold}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleItalic}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleUnderline}
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleCode}
            title="Inline Code"
          >
            <Code size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleLink}
            title="Insert Link (Ctrl+K)"
          >
            <Link size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleImage}
            title="Insert Image"
          >
            <Image size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleQuote}
            title="Quote"
          >
            <Quote size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleUnorderedList}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleOrderedList}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${isPreviewMode ? 'active' : ''}`}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            title="Toggle Preview"
          >
            {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {onSave && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={onSave}
              title="Save (Ctrl+S)"
            >
              <Save size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="editor-container">
        {!isPreviewMode ? (
          <div 
            className={`editor-wrapper ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="editor-textarea"
              spellCheck
            />
            
            {isDragging && (
              <div className="drop-overlay">
                <Upload size={48} />
                <p>Drop images here to insert</p>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-container">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
              className="markdown-preview"
            >
              {content || '*Nothing to preview yet. Start writing!*'}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="editor-status">
        <div className="status-left">
          <span className="word-count">
            {content.split(/\s+/).filter(word => word.length > 0).length} words
          </span>
          <span className="char-count">
            {content.length} characters
          </span>
        </div>
        
        <div className="status-right">
          {autoSave && (
            <span className="auto-save-indicator">
              Auto-save enabled
            </span>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="editor-help">
        <details>
          <summary>Keyboard Shortcuts</summary>
          <div className="shortcuts-list">
            <div className="shortcut">
              <kbd>Ctrl</kbd> + <kbd>B</kbd> → Bold
            </div>
            <div className="shortcut">
              <kbd>Ctrl</kbd> + <kbd>I</kbd> → Italic
            </div>
            <div className="shortcut">
              <kbd>Ctrl</kbd> + <kbd>K</kbd> → Insert Link
            </div>
            <div className="shortcut">
              <kbd>Ctrl</kbd> + <kbd>S</kbd> → Save
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};