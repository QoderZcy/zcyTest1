// Library Dashboard Component - Operational overview for librarians

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  Download,
  Plus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLibraryStats, useLending } from '../hooks/useLibrary';
import { 
  LibraryStats,
  LendingTransaction,
  UserRole
} from '../types/library';
import { PERMISSIONS } from '../types/auth';

interface QuickStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'yellow' | 'red';
  onClick?: () => void;
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div 
      className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp size={16} className="text-green-600 mr-1" />
              ) : (
                <TrendingDown size={16} className="text-red-600 mr-1" />
              )}
              <span className={`text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export const LibraryDashboard: React.FC = () => {
  const { user, hasRole, hasPermission } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useLibraryStats();
  const { getOverdueTransactions, stats: lendingStats } = useLending();
  
  const [recentTransactions, setRecentTransactions] = useState<LendingTransaction[]>([]);
  const [overdueTransactions, setOverdueTransactions] = useState<LendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overdue transactions if user has permission
      if (hasPermission(PERMISSIONS.LENDING_CHECKOUT)) {
        const overdue = await getOverdueTransactions();
        setOverdueTransactions(overdue.slice(0, 5)); // Show only first 5
      }
      
      // Refresh library stats
      await refreshStats();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.username}!`;
  };

  const getRoleDashboard = () => {
    if (hasRole(UserRole.MEMBER)) {
      return (
        <div className="text-center py-12">
          <Users size={48} className="text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Member Dashboard</h3>
          <p className="text-gray-600">Access your personal library dashboard from the navigation menu.</p>
        </div>
      );
    }

    return null;
  };

  // For members, show different content
  if (hasRole(UserRole.MEMBER) && !hasRole(UserRole.LIBRARIAN)) {
    return getRoleDashboard();
  }

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening in your library today
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
            {hasPermission(PERMISSIONS.REPORTS_EXPORT) && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                <Download size={16} className="mr-2" />
                Export Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStatsCard
          title="Total Books"
          value={stats?.totalBooks || 0}
          icon={BookOpen}
          color="blue"
          trend={{
            value: 5.2,
            isPositive: true
          }}
        />
        <QuickStatsCard
          title="Active Members"
          value={stats?.totalMembers || 0}
          icon={Users}
          color="green"
          trend={{
            value: 3.1,
            isPositive: true
          }}
        />
        <QuickStatsCard
          title="Active Loans"
          value={lendingStats?.totalActive || 0}
          icon={ArrowLeftRight}
          color="yellow"
        />
        <QuickStatsCard
          title="Overdue Books"
          value={lendingStats?.totalOverdue || 0}
          icon={AlertTriangle}
          color="red"
          trend={{
            value: 12.5,
            isPositive: false
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Activity</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {lendingStats?.totalToday || 0}
              </div>
              <div className="text-sm text-blue-600">Checkouts</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-green-600">Returns</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-purple-600">Renewals</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {hasPermission(PERMISSIONS.LENDING_CHECKOUT) && (
                <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Plus size={16} className="mr-2 text-blue-600" />
                  <span className="text-sm">Checkout</span>
                </button>
              )}
              {hasPermission(PERMISSIONS.LENDING_RETURN) && (
                <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <CheckCircle size={16} className="mr-2 text-green-600" />
                  <span className="text-sm">Return</span>
                </button>
              )}
              {hasPermission(PERMISSIONS.BOOKS_CREATE) && (
                <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <BookOpen size={16} className="mr-2 text-purple-600" />
                  <span className="text-sm">Add Book</span>
                </button>
              )}
              {hasPermission(PERMISSIONS.MEMBERS_CREATE) && (
                <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Users size={16} className="mr-2 text-orange-600" />
                  <span className="text-sm">Add Member</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-6">
          {/* Overdue Books Alert */}
          {overdueTransactions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <AlertTriangle size={16} className="text-red-500 mr-2" />
                  Overdue Books
                </h3>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {overdueTransactions.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {overdueTransactions.slice(0, 3).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {transaction.book?.title}
                      </p>
                      <p className="text-gray-600 truncate">
                        {transaction.member?.firstName} {transaction.member?.lastName}
                      </p>
                    </div>
                    <div className="text-red-600 text-xs ml-3">
                      {Math.ceil((new Date().getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                ))}
              </div>
              
              {overdueTransactions.length > 3 && (
                <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800">
                  View all {overdueTransactions.length} overdue books
                </button>
              )}
            </div>
          )}

          {/* Popular Books */}
          {stats?.popularBooks && stats.popularBooks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp size={16} className="text-green-500 mr-2" />
                Popular Books
              </h3>
              
              <div className="space-y-3">
                {stats.popularBooks.slice(0, 3).map((item, index) => (
                  <div key={item.book.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.book.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.borrowCount} checkouts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Library System</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};