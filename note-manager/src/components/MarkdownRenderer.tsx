import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableSyntaxHighlight?: boolean;
}

/**
 * Markdown内容渲染器组件
 * 支持代码高亮、自定义样式等功能
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  enableSyntaxHighlight = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 在内容更新后应用语法高亮
  useEffect(() => {
    if (enableSyntaxHighlight && containerRef.current) {
      // 延迟执行以确保DOM已更新
      setTimeout(() => {
        Prism.highlightAllUnder(containerRef.current!);
      }, 0);
    }
  }, [content, enableSyntaxHighlight]);

  return (
    <div 
      ref={containerRef}
      className={`markdown-renderer ${className}`}
    >
      <ReactMarkdown
        components={{
          // 自定义代码块渲染
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <pre className={`language-${language}`}>
                  <code className={`language-${language}`} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          
          // 自定义链接渲染（在新标签页打开外部链接）
          a: ({ href, children, ...props }) => {
            const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // 自定义图片渲染
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="markdown-image"
              {...props}
            />
          ),
          
          // 自定义表格渲染
          table: ({ children, ...props }) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),
          
          // 自定义引用块渲染
          blockquote: ({ children, ...props }) => (
            <blockquote className="markdown-blockquote" {...props}>
              {children}
            </blockquote>
          ),
          
          // 自定义标题渲染（添加锚点）
          h1: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
              : undefined;
            return <h1 id={id} {...props}>{children}</h1>;
          },
          
          h2: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
              : undefined;
            return <h2 id={id} {...props}>{children}</h2>;
          },
          
          h3: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
              : undefined;
            return <h3 id={id} {...props}>{children}</h3>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;