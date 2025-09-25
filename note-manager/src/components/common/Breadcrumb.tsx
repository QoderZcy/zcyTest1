// Breadcrumb navigation component

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  homeLink?: string;
  showHome?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight size={16} />,
  homeLink = '/',
  showHome = true
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs: BreadcrumbItem[] = [];

    pathnames.forEach((pathname, index) => {
      const href = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      
      // Convert pathname to readable label
      const label = pathname
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : href,
        isCurrentPage: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {showHome && (
          <li className="breadcrumb-item">
            <Link to={homeLink} className="breadcrumb-link">
              <Home size={16} />
              <span className="sr-only">Home</span>
            </Link>
            {breadcrumbItems.length > 0 && (
              <span className="breadcrumb-separator">{separator}</span>
            )}
          </li>
        )}

        {breadcrumbItems.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {item.href ? (
              <Link to={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span 
                className="breadcrumb-current" 
                aria-current={item.isCurrentPage ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}

            {index < breadcrumbItems.length - 1 && (
              <span className="breadcrumb-separator">{separator}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Predefined breadcrumb configurations for common pages
export const AuthorBreadcrumb: React.FC<{ currentPage?: string }> = ({ currentPage }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Author', href: '/author' },
  ];

  if (currentPage) {
    items.push({ label: currentPage, isCurrentPage: true });
  }

  return <Breadcrumb items={items} />;
};

export const AdminBreadcrumb: React.FC<{ currentPage?: string }> = ({ currentPage }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Admin', href: '/admin' },
  ];

  if (currentPage) {
    items.push({ label: currentPage, isCurrentPage: true });
  }

  return <Breadcrumb items={items} />;
};

export const PostBreadcrumb: React.FC<{ 
  category?: string; 
  postTitle?: string; 
}> = ({ category, postTitle }) => {
  const items: BreadcrumbItem[] = [];

  if (category) {
    items.push({ 
      label: category, 
      href: `/category/${category.toLowerCase().replace(/\s+/g, '-')}` 
    });
  }

  if (postTitle) {
    items.push({ label: postTitle, isCurrentPage: true });
  }

  return <Breadcrumb items={items} />;
};