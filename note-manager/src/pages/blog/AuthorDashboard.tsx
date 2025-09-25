import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { BlogPost, PostStatus } from '../../types/blog/post';
import { AnalyticsData } from '../../types/blog/analytics';
import { Permission } from '../../types/blog/user';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  weeklyViews: number;
  weeklyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'post_published' | 'comment_received' | 'like_received' | 'post_viewed';
  title: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const AuthorDashboard: React.FC = () => {
  const { user, hasPermission } = useBlogAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard statistics
        const statsResponse = await fetch(`/api/authors/${user?.id}/stats`);
        if (!statsResponse.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch recent posts
        const postsResponse = await fetch(`/api/authors/${user?.id}/posts?limit=5&sort=updated_desc`);
        if (!postsResponse.ok) throw new Error('Failed to fetch recent posts');
        const postsData = await postsResponse.json();
        setRecentPosts(postsData.posts);

        // Fetch recent activity
        const activityResponse = await fetch(`/api/authors/${user?.id}/activity?limit=10`);
        if (!activityResponse.ok) throw new Error('Failed to fetch activity');
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities);

        // Fetch analytics data if user has permission
        if (hasPermission(Permission.VIEW_ANALYTICS)) {
          const analyticsResponse = await fetch(`/api/authors/${user?.id}/analytics?period=30d`);
          if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            setAnalyticsData(analytics);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, hasPermission]);

  const getStatusColor = (status: PostStatus): string => {
    switch (status) {
      case PostStatus.PUBLISHED:
        return 'text-green-600 bg-green-50';
      case PostStatus.DRAFT:
        return 'text-yellow-600 bg-yellow-50';
      case PostStatus.SCHEDULED:
        return 'text-blue-600 bg-blue-50';
      case PostStatus.ARCHIVED:
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'post_published':
        return '📝';
      case 'comment_received':
        return '💬';
      case 'like_received':
        return '❤️';
      case 'post_viewed':
        return '👁️';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.profile?.displayName || user?.email}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your blog content
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <span className="text-2xl">👁️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <span className="text-2xl">❤️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLikes.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalComments.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Performance */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Views This Week</p>
                <p className="text-3xl font-bold text-blue-600">{stats.weeklyViews.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className={`text-3xl font-bold ${stats.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Published This Week</p>
                <p className="text-3xl font-bold text-purple-600">
                  {recentPosts.filter(post => 
                    post.status === PostStatus.PUBLISHED && 
                    new Date(post.publishedAt!) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
                <Link
                  to="/author/posts"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/author/posts/${post.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                          >
                            {post.title}
                          </Link>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{post.viewCount} views</span>
                          <span>{post.likeCount} likes</span>
                          <span>{post.commentCount} comments</span>
                          <span>{formatDistanceToNow(new Date(post.updatedAt))} ago</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No posts yet</p>
                  <Link
                    to="/author/posts/new"
                    className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Create Your First Post
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp))} ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/author/posts/new"
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">✏️</span>
              Create New Post
            </Link>
            <Link
              to="/author/drafts"
              className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">📄</span>
              Manage Drafts
            </Link>
            <Link
              to="/author/analytics"
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              <span className="mr-2">📊</span>
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorDashboard;