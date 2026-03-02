// Public header navigation component

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Menu, 
  X, 
  PenTool, 
  BookOpen,
  Settings,
  LogOut,
  Bell
} from 'lucide-react';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { UserRole } from '../../types/blog/user';

export const PublicHeader: React.FC = () => {
  const { user, isAuthenticated, logout } = useBlogAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const canCreateContent = user && [UserRole.AUTHOR, UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  return (
    <header className="public-header">
      <div className="header-container">
        {/* Logo and brand */}
        <div className="header-brand">
          <Link to="/" className="brand-link">
            <BookOpen size={28} />
            <span className="brand-text">BlogHub</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/categories" className="nav-link">Categories</Link>
          <Link to="/authors" className="nav-link">Authors</Link>
          <Link to="/trending" className="nav-link">Trending</Link>
        </nav>

        {/* Search and actions */}
        <div className="header-actions">
          {/* Search */}
          <div className="search-container">
            <button 
              className="search-trigger"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={20} />
            </button>
            
            {searchOpen && (
              <div className="search-dropdown">
                <input
                  type="text"
                  placeholder="Search posts, authors, topics..."
                  className="search-input"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Create content button */}
          {canCreateContent && (
            <Link to="/author/posts/new" className="btn btn-primary btn-sm">
              <PenTool size={16} />
              Write
            </Link>
          )}

          {/* User menu */}
          {isAuthenticated ? (
            <div className="user-menu-container">
              <button 
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="user-avatar" />
                ) : (
                  <User size={20} />
                )}
              </button>

              {userMenuOpen && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <div className="user-info">
                      <div className="user-name">{user?.displayName || user?.username}</div>
                      <div className="user-role">{user?.role.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div className="menu-divider" />

                  <Link to={`/author/${user?.username}`} className="menu-item">
                    <User size={16} />
                    My Profile
                  </Link>

                  {canCreateContent && (
                    <>
                      <Link to="/author/dashboard" className="menu-item">
                        <PenTool size={16} />
                        Dashboard
                      </Link>
                      <Link to="/author/posts" className="menu-item">
                        <BookOpen size={16} />
                        My Posts
                      </Link>
                    </>
                  )}

                  <Link to="/notifications" className="menu-item">
                    <Bell size={16} />
                    Notifications
                  </Link>

                  <Link to="/settings" className="menu-item">
                    <Settings size={16} />
                    Settings
                  </Link>

                  <div className="menu-divider" />

                  <button onClick={handleLogout} className="menu-item menu-item-danger">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth/login" className="btn btn-outline btn-sm">
                Sign In
              </Link>
              <Link to="/auth/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button 
            className="mobile-menu-toggle md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <Link to="/" className="mobile-nav-link">Home</Link>
            <Link to="/categories" className="mobile-nav-link">Categories</Link>
            <Link to="/authors" className="mobile-nav-link">Authors</Link>
            <Link to="/trending" className="mobile-nav-link">Trending</Link>
          </nav>

          {!isAuthenticated && (
            <div className="mobile-auth">
              <Link to="/auth/login" className="btn btn-outline btn-block">
                Sign In
              </Link>
              <Link to="/auth/register" className="btn btn-primary btn-block">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Backdrop for dropdowns */}
      {(searchOpen || userMenuOpen || mobileMenuOpen) && (
        <div 
          className="header-backdrop"
          onClick={() => {
            setSearchOpen(false);
            setUserMenuOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};