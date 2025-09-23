import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BlogProvider } from '../../contexts/BlogContext';
import { useAuth } from '../../contexts/AuthContext';
import BlogList from './BlogList';
import BlogDetail from './BlogDetail';
import BlogEditor from './BlogEditor';
import BlogManagement from './BlogManagement';
import UserBlog from './UserBlog';
import CategoryBlog from './CategoryBlog';

// 博客模块主组件
const BlogModule: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BlogProvider>
      <div className="blog-module">
        <Routes>
          {/* 公开路由 */}
          <Route path="/" element={<BlogList />} />
          <Route path="/post/:id" element={<BlogDetail />} />
          <Route path="/user/:username" element={<UserBlog />} />
          <Route path="/category/:name" element={<CategoryBlog />} />
          
          {/* 需要认证的路由 */}
          {isAuthenticated ? (
            <>
              <Route path="/create" element={<BlogEditor />} />
              <Route path="/edit/:id" element={<BlogEditor />} />
              <Route path="/manage" element={<BlogManagement />} />
            </>
          ) : (
            <>
              <Route path="/create" element={<Navigate to="/blog" replace />} />
              <Route path="/edit/:id" element={<Navigate to="/blog" replace />} />
              <Route path="/manage" element={<Navigate to="/blog" replace />} />
            </>
          )}
          
          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/blog" replace />} />
        </Routes>
      </div>
    </BlogProvider>
  );
};

export default BlogModule;