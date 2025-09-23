import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Plus, StickyNote, User, LogOut, Settings, Loader2, FileText, BookOpen } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { useNotes } from './hooks/useNotes';
import { useAuth } from './contexts/AuthContext';
import { NoteForm } from './components/NoteForm';
import { SearchBar } from './components/SearchBar';
import { NotesGrid } from './components/NotesGrid';
import { StatsPanel } from './components/StatsPanel';
import BlogRoutes from './routes/BlogRoutes';
import type { Note } from './types/note';
import './App.css';
import './styles/blog.css';
import './styles/blog-detail.css';
import './styles/blog-editor.css';
import './styles/markdown.css';

// 主应用组件（已认证用户）
const MainApp: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated, loading, checkTokenExpiration } = useAuth();
  const {
    notes,
    allTags,
    filter,
    stats,
    migrationStatus,
    setFilter,
    createNote,
    updateNote,
    deleteNote,
    clearMigration,
    retryMigration,
  } = useNotes();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 判断当前是否在博客页面
  const isBlogPage = location.pathname.startsWith('/blog');

  // 定期检查令牌状态
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        checkTokenExpiration();
      }, 60000); // 每分钟检查一次

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, checkTokenExpiration]);

  // 页面可见性变化时检查令牌
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        checkTokenExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, checkTokenExpiration]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsFormOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleSaveNote = (noteData: any) => {
    if (editingNote) {
      updateNote(editingNote.id, noteData);
    } else {
      createNote(noteData);
    }
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      
      console.log('[App] 开始登出流程');
      await logout();
      console.log('[App] 登出成功');
    } catch (error) {
      console.error('[App] 登出失败:', error);
      // 即使登出失败，也要重置状态
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // 数据迁移提示
  if (migrationStatus?.isInProgress) {
    return (
      <div className="migration-screen">
        <div className="migration-container">
          <div className="migration-content">
            <StickyNote size={48} className="migration-icon" />
            <h2>正在迁移您的便签数据</h2>
            <p>请稍候，我们正在将您的本地便签迁移到个人账户...</p>
            
            <div className="migration-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(migrationStatus.processedNotes / migrationStatus.totalNotes) * 100}%` 
                  }}
                />
              </div>
              <span className="progress-text">
                {migrationStatus.processedNotes} / {migrationStatus.totalNotes} 便签已处理
              </span>
            </div>
            
            {migrationStatus.errors.length > 0 && (
              <div className="migration-errors">
                <h3>迁移错误：</h3>
                <ul>
                  {migrationStatus.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <button className="btn btn-outline" onClick={retryMigration}>
                  重试迁移
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <StickyNote size={28} className="app-icon" />
            <h1>便签管理系统</h1>
          </div>
          
          {/* 主导航 */}
          <nav className="main-navigation">
            <Link 
              to="/" 
              className={`nav-link ${!isBlogPage ? 'active' : ''}`}
            >
              <FileText size={20} />
              <span>便签管理</span>
            </Link>
            
            <Link 
              to="/blog" 
              className={`nav-link ${isBlogPage ? 'active' : ''}`}
            >
              <BookOpen size={20} />
              <span>博客中心</span>
            </Link>
          </nav>
          
          <div className="header-actions">
            {!isBlogPage && (
              <button
                onClick={handleCreateNote}
                className="btn btn-primary create-btn"
              >
                <Plus size={20} />
                新建便签
              </button>
            )}
            
            {/* 用户菜单 */}
            <div className="user-menu-container">
              <button 
                className="user-menu-trigger"
                onClick={toggleUserMenu}
                aria-label="用户菜单"
              >
                <User size={20} />
                <span className="user-name">{user?.username}</span>
              </button>
              
              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <div className="user-avatar">
                      <User size={32} />
                    </div>
                    <div className="user-info">
                      <div className="user-display-name">{user?.username}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                  
                  <div className="user-menu-divider" />
                  
                  <button className="user-menu-item">
                    <Settings size={16} />
                    设置
                  </button>
                  
                  <button 
                    className="user-menu-item user-menu-logout"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        登出中...
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        登出
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          {/* 便签管理页面 */}
          <Route 
            path="/" 
            element={
              <div className="content-wrapper">
                <div className="top-section">
                  <StatsPanel stats={stats} />
                  <SearchBar
                    filter={filter}
                    onFilterChange={setFilter}
                    allTags={allTags}
                  />
                </div>
                
                <div className="notes-section">
                  <NotesGrid
                    notes={notes}
                    onEditNote={handleEditNote}
                    onDeleteNote={deleteNote}
                  />
                </div>
              </div>
            } 
          />
          
          {/* 博客相关路由 */}
          <Route path="/blog/*" element={<BlogRoutes />} />
        </Routes>
      </main>

      <NoteForm
        note={editingNote}
        isOpen={isFormOpen}
        onSave={handleSaveNote}
        onCancel={handleCancelForm}
      />
      
      {/* 点击外部关闭用户菜单 */}
      {showUserMenu && (
        <div 
          className="overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

// 根应用组件
function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthGuard>
          <MainApp />
        </AuthGuard>
      </Router>
    </AuthProvider>
  );
}

export default App;
