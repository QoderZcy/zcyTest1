import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('../pages/home'));
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage'));
const ArticlePage = React.lazy(() => import('../pages/article'));
const WritePage = React.lazy(() => import('../pages/write'));
const ProfilePage = React.lazy(() => import('../pages/profile'));
const SearchPage = React.lazy(() => import('../pages/search'));
const TimeUtilPage = React.lazy(() => import('../pages/TimeUtilPage'));

// Loading component
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// 404 Not Found component
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-secondary-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-secondary-700 mb-4">页面未找到</h2>
      <p className="text-secondary-600 mb-8">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <div className="space-x-4">
        <a
          href="/"
          className="btn-primary"
        >
          返回首页
        </a>
        <button
          onClick={() => window.history.back()}
          className="btn-secondary"
        >
          返回上页
        </button>
      </div>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/articles/:id" element={<ArticlePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/category/:name" element={<SearchPage />} />
        <Route path="/tag/:name" element={<SearchPage />} />

        {/* Guest Only Routes (not authenticated) */}
        <Route 
          path="/login" 
          element={
            <ProtectedRoute requireGuest={true}>
              <LoginPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <ProtectedRoute requireGuest={true}>
              <RegisterPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes (require authentication) */}
        <Route 
          path="/write" 
          element={
            <ProtectedRoute>
              <WritePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/write/:id" 
          element={
            <ProtectedRoute>
              <WritePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-articles" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Static Pages */}
        <Route path="/time" element={<TimeUtilPage />} />
        <Route path="/about" element={<div>关于我们页面</div>} />
        <Route path="/contact" element={<div>联系我们页面</div>} />
        <Route path="/help" element={<div>帮助页面</div>} />
        <Route path="/privacy" element={<div>隐私政策页面</div>} />
        <Route path="/terms" element={<div>服务条款页面</div>} />

        {/* Redirects */}
        <Route path="/articles" element={<Navigate to="/" replace />} />
        <Route path="/categories" element={<Navigate to="/" replace />} />
        <Route path="/tags" element={<Navigate to="/" replace />} />
        <Route path="/archives" element={<Navigate to="/" replace />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;