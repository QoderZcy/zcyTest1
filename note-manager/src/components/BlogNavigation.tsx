import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Edit3, 
  Archive, 
  Tag, 
  BarChart3, 
  Settings,
  PlusCircle
} from 'lucide-react';
import { useBlogStats } from '../hooks/useBlog';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

/**
 * 博客导航组件
 * 提供博客功能的主要导航链接
 */
const BlogNavigation: React.FC = () => {
  const location = useLocation();
  const { stats } = useBlogStats();

  const navigationItems: NavigationItem[] = [
    {
      path: '/blog',
      label: '所有文章',
      icon: <FileText size={20} />,
      count: stats?.totalPosts
    },
    {
      path: '/blog/published',
      label: '已发布',
      icon: <FileText size={20} />,
      count: stats?.publishedPosts
    },
    {
      path: '/blog/drafts',
      label: '草稿箱',
      icon: <Edit3 size={20} />,
      count: stats?.draftPosts
    },
    {
      path: '/blog/archived',
      label: '归档',
      icon: <Archive size={20} />
    },
    {
      path: '/blog/categories',
      label: '分类管理',
      icon: <Tag size={20} />
    },
    {
      path: '/blog/stats',
      label: '数据统计',
      icon: <BarChart3 size={20} />
    }
  ];

  const isActivePath = (path: string) => {
    if (path === '/blog') {
      return location.pathname === '/blog' || location.pathname === '/blog/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="blog-navigation">
      <div className="blog-nav-header">
        <h2 className="blog-nav-title">博客管理</h2>
        <Link 
          to="/blog/edit" 
          className="blog-nav-create-btn"
          title="创建新文章"
        >
          <PlusCircle size={20} />
          <span>写文章</span>
        </Link>
      </div>

      <ul className="blog-nav-list">
        {navigationItems.map((item) => (
          <li key={item.path} className="blog-nav-item">
            <Link
              to={item.path}
              className={`blog-nav-link ${isActivePath(item.path) ? 'active' : ''}`}
            >
              <span className="blog-nav-icon">
                {item.icon}
              </span>
              <span className="blog-nav-label">
                {item.label}
              </span>
              {typeof item.count === 'number' && (
                <span className="blog-nav-count">
                  {item.count}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <div className="blog-nav-footer">
        <Link 
          to="/blog/settings" 
          className={`blog-nav-link ${isActivePath('/blog/settings') ? 'active' : ''}`}
        >
          <span className="blog-nav-icon">
            <Settings size={20} />
          </span>
          <span className="blog-nav-label">
            博客设置
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default BlogNavigation;