// Library Layout Component - Main navigation and layout for library management system

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  Settings, 
  Bell,
  Menu,
  X,
  Home,
  User,
  LogOut,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LibraryService } from '../services';
import { UserRole, PERMISSIONS } from '../types/auth';
import { Library } from '../types/library';

interface LibraryLayoutProps {
  children: React.ReactNode;
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  requiredPermissions?: string[];
  requiredRoles?: UserRole[];
  children?: NavigationItem[];
}

export const LibraryLayout: React.FC<LibraryLayoutProps> = ({
  children,
  currentSection = 'dashboard',
  onSectionChange
}) => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [libraryInfo, setLibraryInfo] = useState<Library | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Navigation configuration based on user role
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      requiredRoles: [UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.SENIOR_LIBRARIAN, UserRole.ADMIN]
    },
    {
      id: 'catalog',
      label: 'Book Catalog',
      icon: BookOpen,
      requiredPermissions: [PERMISSIONS.BOOKS_READ],
      children: [
        {
          id: 'catalog-browse',
          label: 'Browse Books',
          icon: BookOpen,
          requiredPermissions: [PERMISSIONS.BOOKS_READ]
        },
        ...(hasPermission(PERMISSIONS.BOOKS_CREATE) ? [{
          id: 'catalog-manage',
          label: 'Manage Books',
          icon: Settings,
          requiredPermissions: [PERMISSIONS.BOOKS_CREATE]
        }] : [])
      ]
    },
    ...(hasPermission(PERMISSIONS.MEMBERS_READ) ? [{
      id: 'members',
      label: 'Members',
      icon: Users,
      requiredPermissions: [PERMISSIONS.MEMBERS_READ],
      children: [
        {
          id: 'members-list',
          label: 'Member Directory',
          icon: Users,
          requiredPermissions: [PERMISSIONS.MEMBERS_READ]
        },
        ...(hasPermission(PERMISSIONS.MEMBERS_CREATE) ? [{
          id: 'members-manage',
          label: 'Manage Members',
          icon: Settings,
          requiredPermissions: [PERMISSIONS.MEMBERS_CREATE]
        }] : [])
      ]
    }] : []),
    ...(hasPermission(PERMISSIONS.LENDING_CHECKOUT) ? [{
      id: 'lending',
      label: 'Lending Operations',
      icon: ArrowLeftRight,
      requiredPermissions: [PERMISSIONS.LENDING_CHECKOUT],
      children: [
        {
          id: 'checkout',
          label: 'Check Out',
          icon: ArrowLeftRight,
          requiredPermissions: [PERMISSIONS.LENDING_CHECKOUT]
        },
        {
          id: 'return',
          label: 'Return Books',
          icon: ArrowLeftRight,
          requiredPermissions: [PERMISSIONS.LENDING_RETURN]
        },
        {
          id: 'renewals',
          label: 'Renewals',
          icon: ArrowLeftRight,
          requiredPermissions: [PERMISSIONS.LENDING_RENEW]
        }
      ]
    }] : []),
    ...(hasPermission(PERMISSIONS.REPORTS_READ) ? [{
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      requiredPermissions: [PERMISSIONS.REPORTS_READ]
    }] : []),
    ...(hasPermission(PERMISSIONS.SYSTEM_CONFIG) ? [{
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      requiredPermissions: [PERMISSIONS.SYSTEM_CONFIG]
    }] : [])
  ];

  // Load library information and status
  useEffect(() => {
    const loadLibraryInfo = async () => {
      try {
        const [info, status] = await Promise.all([
          LibraryService.getLibraryInfo(),
          LibraryService.isLibraryOpen()
        ]);
        setLibraryInfo(info);
        setIsLibraryOpen(status.isOpen);
      } catch (error) {
        console.error('Failed to load library info:', error);
      }
    };

    loadLibraryInfo();
  }, []);

  // Load notifications for current user
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // This would typically fetch user-specific notifications
        // For now, we'll use announcements as a placeholder
        const announcements = await LibraryService.getAnnouncements({ 
          active: true, 
          limit: 5 
        });
        setNotifications(announcements);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  const handleNavigation = (itemId: string) => {
    onSectionChange?.(itemId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    // Check permissions and roles
    if (item.requiredPermissions && 
        !item.requiredPermissions.some(permission => hasPermission(permission))) {
      return null;
    }
    
    if (item.requiredRoles && 
        !item.requiredRoles.some(role => hasRole(role))) {
      return null;
    }

    const isActive = currentSection === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleNavigation(item.id)}
          className={`
            w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors
            ${level > 0 ? 'ml-4 text-sm' : 'text-base'}
            ${isActive 
              ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <Icon size={level > 0 ? 16 : 20} className="mr-3 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
        </button>
        
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Library Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {libraryInfo?.name || 'Library System'}
              </h1>
              <div className="flex items-center mt-1">
                <div className={`
                  w-2 h-2 rounded-full mr-2
                  ${isLibraryOpen ? 'bg-green-500' : 'bg-red-500'}
                `} />
                <span className="text-sm text-gray-600">
                  {isLibraryOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <User size={16} className="mr-2" />
            <span>{user?.username}</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>

              {/* Page title */}
              <div className="flex-1 lg:flex-none">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {currentSection.replace('-', ' ')}
                </h2>
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Notifications
                        </h3>
                        {notifications.length > 0 ? (
                          <div className="space-y-3">
                            {notifications.map((notification, index) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {notification.title}
                                </div>
                                <div className="text-gray-600 mt-1">
                                  {notification.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No new notifications</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <User size={20} />
                  </button>

                  {/* User menu dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-900 border-b">
                          <div className="font-medium">{user?.username}</div>
                          <div className="text-gray-500">{user?.email}</div>
                        </div>
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          {isLoggingOut ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Signing out...
                            </>
                          ) : (
                            <>
                              <LogOut size={16} className="mr-2" />
                              Sign out
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
};