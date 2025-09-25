import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireGuest?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireGuest = false,
  fallbackPath
}) => {
  const { state: authState } = useAuth();
  const location = useLocation();

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Require authentication but user is not logged in
  if (requireAuth && !authState.isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath || "/login"} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Require guest (not logged in) but user is authenticated
  if (requireGuest && authState.isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath || "/"} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;