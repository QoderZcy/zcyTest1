// Main router configuration for the blog system

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BlogAuthProvider } from '../contexts/blog/BlogAuthContext';
import { 
  AuthGuard, 
  GuestGuard, 
  AuthorGuard, 
  EditorGuard, 
  AdminGuard 
} from '../components/auth/guards';

// Layout components
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthorLayout } from '../layouts/AuthorLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public pages
import { BlogHome } from '../pages/blog/BlogHome';
import { PostDetail } from '../pages/blog/PostDetail';
import { CategoryView } from '../pages/blog/CategoryView';
import { AuthorProfile } from '../pages/blog/AuthorProfile';
import { SearchResults } from '../pages/blog/SearchResults';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

// Author pages
import { AuthorDashboard } from '../pages/author/AuthorDashboard';
import { PostEditor } from '../pages/author/PostEditor';
import { DraftManager } from '../pages/author/DraftManager';
import { AuthorSettings } from '../pages/author/AuthorSettings';
import { AuthorAnalytics } from '../pages/author/AuthorAnalytics';

// Admin pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagement } from '../pages/admin/UserManagement';
import { ContentModeration } from '../pages/admin/ContentModeration';
import { SystemSettings } from '../pages/admin/SystemSettings';

// Error pages
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { UnauthorizedPage } from '../pages/error/UnauthorizedPage';

export const BlogRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <BlogAuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<BlogHome />} />
            <Route path="post/:slug" element={<PostDetail />} />
            <Route path="category/:slug" element={<CategoryView />} />
            <Route path="author/:username" element={<AuthorProfile />} />
            <Route path="search" element={<SearchResults />} />
            <Route path="tag/:tag" element={<CategoryView />} />
          </Route>

          {/* Authentication routes */}
          <Route path="/auth">
            <Route 
              path="login" 
              element={
                <GuestGuard redirectTo="/dashboard">
                  <LoginPage />
                </GuestGuard>
              } 
            />
            <Route 
              path="register" 
              element={
                <GuestGuard redirectTo="/dashboard">
                  <RegisterPage />
                </GuestGuard>
              } 
            />
            <Route 
              path="forgot-password" 
              element={
                <GuestGuard redirectTo="/dashboard">
                  <ForgotPasswordPage />
                </GuestGuard>
              } 
            />
          </Route>

          {/* Author routes */}
          <Route 
            path="/author" 
            element={
              <AuthGuard>
                <AuthorGuard>
                  <AuthorLayout />
                </AuthorGuard>
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/author/dashboard" replace />} />
            <Route path="dashboard" element={<AuthorDashboard />} />
            <Route path="posts" element={<DraftManager />} />
            <Route path="posts/new" element={<PostEditor />} />
            <Route path="posts/edit/:id" element={<PostEditor />} />
            <Route path="drafts" element={<DraftManager />} />
            <Route path="analytics" element={<AuthorAnalytics />} />
            <Route path="settings" element={<AuthorSettings />} />
          </Route>

          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <AuthGuard>
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="content" element={<ContentModeration />} />
            <Route path="analytics" element={<AuthorAnalytics />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>

          {/* Legacy note routes - for backward compatibility */}
          <Route path="/notes" element={<Navigate to="/" replace />} />
          <Route path="/note/:id" element={<Navigate to="/" replace />} />

          {/* Error routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BlogAuthProvider>
    </BrowserRouter>
  );
};