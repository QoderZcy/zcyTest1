// Author sidebar navigation component

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  PenTool, 
  Settings, 
  Users, 
  BookOpen,
  Calendar,
  Tag,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface AuthorSidebarProps {
  onItemClick?: () => void;
}

export const AuthorSidebar: React.FC<AuthorSidebarProps> = ({ onItemClick }) => {
  const navItems = [
    {
      to: '/author/dashboard',
      icon: BarChart3,
      label: 'Dashboard',
      description: 'Overview and analytics'
    },
    {
      to: '/author/posts',
      icon: FileText,
      label: 'All Posts',
      description: 'Manage your content'
    },
    {
      to: '/author/posts/new',
      icon: PenTool,
      label: 'New Post',
      description: 'Create new content'
    },
    {
      to: '/author/drafts',
      icon: BookOpen,
      label: 'Drafts',
      description: 'Unpublished posts'
    },
    {
      to: '/author/scheduled',
      icon: Calendar,
      label: 'Scheduled',
      description: 'Future publications'
    },
    {
      to: '/author/categories',
      icon: Tag,
      label: 'Categories',
      description: 'Organize content'
    },
    {
      to: '/author/comments',
      icon: MessageSquare,
      label: 'Comments',
      description: 'Reader engagement'
    },
    {
      to: '/author/analytics',
      icon: TrendingUp,
      label: 'Analytics',
      description: 'Performance insights'
    },
    {
      to: '/author/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Account preferences'
    }
  ];

  return (
    <div className="author-sidebar">
      <div className="sidebar-header">
        <h2>Author Panel</h2>
        <p>Content management tools</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onItemClick}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={20} />
            <div className="nav-content">
              <span className="nav-label">{item.label}</span>
              <span className="nav-description">{item.description}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="quick-stats">
          <div className="stat">
            <span className="stat-label">Total Posts</span>
            <span className="stat-value">12</span>
          </div>
          <div className="stat">
            <span className="stat-label">This Month</span>
            <span className="stat-value">3</span>
          </div>
        </div>
      </div>
    </div>
  );
};