import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { state: authState, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <header className={`bg-white shadow-sm border-b border-secondary-200 ${className}`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-secondary-900">博客系统</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
            >
              首页
            </Link>
            <Link 
              to="/articles" 
              className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
            >
              文章
            </Link>
            <Link 
              to="/categories" 
              className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
            >
              分类
            </Link>
            <Link 
              to="/time" 
              className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
            >
              时间工具
            </Link>
            <Link 
              to="/about" 
              className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
            >
              关于
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="搜索文章..."
                className="input pr-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query.trim()) {
                      navigate(`/search?q=${encodeURIComponent(query)}`);
                    }
                  }
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-secondary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {authState.isAuthenticated ? (
              <div className="relative">
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/write" 
                    className="btn-primary hidden md:inline-flex"
                  >
                    写文章
                  </Link>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 text-secondary-700 hover:text-primary-600 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {authState.user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:block">{authState.user?.username}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-secondary-200">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      个人中心
                    </Link>
                    <Link
                      to="/write"
                      className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200 md:hidden"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      写文章
                    </Link>
                    <Link
                      to="/my-articles"
                      className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      我的文章
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      设置
                    </Link>
                    <hr className="my-1 border-secondary-200" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
                >
                  登录
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary"
                >
                  注册
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 transition-colors duration-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-200">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索文章..."
                  className="input pr-10"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const query = (e.target as HTMLInputElement).value;
                      if (query.trim()) {
                        navigate(`/search?q=${encodeURIComponent(query)}`);
                        setIsMenuOpen(false);
                      }
                    }
                  }}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-secondary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-2">
                <Link
                  to="/"
                  className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  首页
                </Link>
                <Link
                  to="/articles"
                  className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  文章
                </Link>
                <Link
                  to="/categories"
                  className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  分类
                </Link>
                <Link
                  to="/time"
                  className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  时间工具
                </Link>
                <Link
                  to="/about"
                  className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  关于
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Click outside handler for user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;