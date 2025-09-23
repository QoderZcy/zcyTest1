import React from 'react';
import { Outlet } from 'react-router-dom';
import BlogNavigation from './BlogNavigation';

interface BlogLayoutProps {
  children?: React.ReactNode;
}

/**
 * 博客页面布局容器组件
 * 提供博客功能的整体布局结构
 */
const BlogLayout: React.FC<BlogLayoutProps> = ({ children }) => {
  return (
    <div className="blog-layout">
      <aside className="blog-sidebar">
        <BlogNavigation />
      </aside>
      
      <main className="blog-main">
        <div className="blog-content">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default BlogLayout;