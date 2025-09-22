import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">
          <User size={20} />
        </div>
        <span className="username">{user.username}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-avatar-large">
              <User size={24} />
            </div>
            <div className="user-details">
              <div className="user-name">{user.username}</div>
              {user.email && <div className="user-email">{user.email}</div>}
            </div>
          </div>
          
          <hr className="menu-divider" />
          
          <button className="menu-item logout-item" onClick={handleLogout}>
            <LogOut size={16} />
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
};