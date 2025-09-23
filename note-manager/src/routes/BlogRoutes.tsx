import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import BlogLayout from '../components/BlogLayout';
import BlogPostList from '../components/BlogPostList';
import BlogPostDetail from '../components/BlogPostDetail';
import BlogPostEditor from '../components/BlogPostEditor';
import { PublishStatus } from '../types/blog';

/**
 * 博客路由配置组件
 */
const BlogRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/blog" element={<BlogLayout />}>
        {/* 博客首页 - 所有文章 */}
        <Route 
          index 
          element={
            <BlogPostList 
              title="所有文章"
              showCategoryFilter={true}
              showActions={true}
            />
          } 
        />
        
        {/* 已发布文章 */}
        <Route 
          path="published" 
          element={
            <BlogPostList 
              initialFilter={{ status: PublishStatus.PUBLISHED }}
              title="已发布文章"
              showCategoryFilter={true}
              showActions={true}
            />
          } 
        />
        
        {/* 草稿箱 */}
        <Route 
          path="drafts" 
          element={
            <BlogPostList 
              initialFilter={{ status: PublishStatus.DRAFT }}
              title="草稿箱"
              showCategoryFilter={false}
              showActions={true}
            />
          } 
        />
        
        {/* 归档文章 */}
        <Route 
          path="archived" 
          element={
            <BlogPostList 
              initialFilter={{ status: PublishStatus.ARCHIVED }}
              title="归档文章"
              showCategoryFilter={true}
              showActions={true}
            />
          } 
        />
        
        {/* 按分类查看文章 */}
        <Route 
          path="category/:category" 
          element={<CategoryPostList />} 
        />
        
        {/* 分类管理页面 */}
        <Route 
          path="categories" 
          element={<CategoryManagement />} 
        />
        
        {/* 数据统计页面 */}
        <Route 
          path="stats" 
          element={<BlogStats />} 
        />
        
        {/* 博客设置页面 */}
        <Route 
          path="settings" 
          element={<BlogSettings />} 
        />
        
        {/* 创建新文章 */}
        <Route 
          path="edit" 
          element={<BlogPostEditor />} 
        />
        
        {/* 编辑文章 */}
        <Route 
          path="edit/:postId" 
          element={<BlogPostEditor />} 
        />
        
        {/* 文章详情页 */}
        <Route 
          path="post/:postId" 
          element={
            <BlogPostDetail 
              showActions={true}
              showRelatedPosts={true}
            />
          } 
        />
        
        {/* 重定向旧路径 */}
        <Route path="posts" element={<Navigate to="/blog" replace />} />
        <Route path="posts/:postId" element={<Navigate to="../post/:postId" replace />} />
      </Route>
    </Routes>
  );
};

/**
 * 按分类查看文章的组件
 */
const CategoryPostList: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  
  return (
    <BlogPostList 
      initialFilter={{ category }}
      title={`分类：${category}`}
      showCategoryFilter={true}
      showActions={true}
    />
  );
};

/**
 * 分类管理组件
 */
const CategoryManagement: React.FC = () => {
  return (
    <div className="category-management">
      <h1>分类管理</h1>
      <p>分类管理功能开发中...</p>
    </div>
  );
};

/**
 * 博客统计组件
 */
const BlogStats: React.FC = () => {
  return (
    <div className="blog-stats">
      <h1>数据统计</h1>
      <p>统计功能开发中...</p>
    </div>
  );
};

/**
 * 博客设置组件
 */
const BlogSettings: React.FC = () => {
  return (
    <div className="blog-settings">
      <h1>博客设置</h1>
      <p>设置功能开发中...</p>
    </div>
  );
};

export default BlogRoutes;