import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home, Settings, ArrowLeft } from 'lucide-react';
import { AppProvider } from './contexts';
import { WeatherHeader } from './components/WeatherHeader';
import { HomePage, SettingsPage } from './pages';
import './styles/globals.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'settings'>('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // 处理页面导航
  const handleNavigate = (page: 'home' | 'settings') => {
    setCurrentPage(page);
    setShowMobileMenu(false);
  };

  // 监听浏览器返回按钮
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/settings') {
        setCurrentPage('settings');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 更新浏览器历史
  useEffect(() => {
    const path = currentPage === 'settings' ? '/settings' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [currentPage]);

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 头部导航 */}
        <WeatherHeader
          onOpenSettings={() => handleNavigate('settings')}
          onOpenMenu={() => setShowMobileMenu(true)}
        />

        {/* 主内容区域 */}
        <main className="pb-safe-bottom">
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'settings' && <SettingsPage />}
        </main>

        {/* 底部导航栏 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom lg:hidden">
          <div className="flex">
            <button
              onClick={() => handleNavigate('home')}
              className={`flex-1 py-3 px-4 text-center transition-colors ${
                currentPage === 'home'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Home className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">首页</span>
            </button>
            
            <button
              onClick={() => handleNavigate('settings')}
              className={`flex-1 py-3 px-4 text-center transition-colors ${
                currentPage === 'settings'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Settings className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">设置</span>
            </button>
          </div>
        </nav>

        {/* 侧边菜单 (大屏幕) */}
        <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:flex lg:flex-col">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">天气预报</h1>
          </div>
          
          <nav className="flex-1 px-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigate('home')}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    currentPage === 'home'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-5 h-5 mr-3" />
                  首页
                </button>
              </li>
              
              <li>
                <button
                  onClick={() => handleNavigate('settings')}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    currentPage === 'settings'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  设置
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* 主内容区域适配大屏幕 */}
        <div className="lg:ml-64">
          {/* 内容已在上面的 main 标签中 */}
        </div>

        {/* 移动端菜单覆盖层 */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
            <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">菜单</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => handleNavigate('home')}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        currentPage === 'home'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Home className="w-5 h-5 mr-3" />
                      首页
                    </button>
                  </li>
                  
                  <li>
                    <button
                      onClick={() => handleNavigate('settings')}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        currentPage === 'settings'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      设置
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}

export default App;