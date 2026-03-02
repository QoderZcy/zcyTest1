import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { BlogPost, PostStatus, PostType } from '../../types/blog/post';
import { Permission } from '../../types/blog/user';
import { formatDistanceToNow, format } from 'date-fns';

interface DraftFilters {
  search: string;
  type: PostType | 'all';
  sortBy: 'updated' | 'created' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface BulkAction {
  type: 'delete' | 'publish' | 'archive';
  label: string;
  icon: string;
  color: string;
  requiresConfirmation: boolean;
}

export const DraftManager: React.FC = () => {
  const { user, hasPermission } = useBlogAuth();
  const navigate = useNavigate();
  
  const [drafts, setDrafts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<DraftFilters>({
    search: '',
    type: 'all',
    sortBy: 'updated',
    sortOrder: 'desc'
  });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: BulkAction;
    draftIds: string[];
  } | null>(null);

  const bulkActions: BulkAction[] = [
    {
      type: 'publish',
      label: 'Publish Selected',
      icon: '🚀',
      color: 'bg-green-600 hover:bg-green-700',
      requiresConfirmation: true
    },
    {
      type: 'archive',
      label: 'Archive Selected',
      icon: '📦',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      requiresConfirmation: true
    },
    {
      type: 'delete',
      label: 'Delete Selected',
      icon: '🗑️',
      color: 'bg-red-600 hover:bg-red-700',
      requiresConfirmation: true
    }
  ];

  useEffect(() => {
    fetchDrafts();
  }, [filters, user?.id]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        status: PostStatus.DRAFT,
        author: user?.id || '',
        search: filters.search,
        type: filters.type === 'all' ? '' : filters.type,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: '50'
      });

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }

      const data = await response.json();
      setDrafts(data.posts || []);
    } catch (err) {
      console.error('Failed to fetch drafts:', err);
      setError('Failed to load drafts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDraft = (draftId: string, checked: boolean) => {
    const newSelected = new Set(selectedDrafts);
    if (checked) {
      newSelected.add(draftId);
    } else {
      newSelected.delete(draftId);
    }
    setSelectedDrafts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDrafts(new Set(drafts.map(draft => draft.id)));
    } else {
      setSelectedDrafts(new Set());
    }
  };

  const handleBulkAction = (action: BulkAction) => {
    const draftIds = Array.from(selectedDrafts);
    if (draftIds.length === 0) return;

    if (action.requiresConfirmation) {
      setConfirmAction({ action, draftIds });
    } else {
      executeBulkAction(action, draftIds);
    }
  };

  const executeBulkAction = async (action: BulkAction, draftIds: string[]) => {
    try {
      const response = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.type,
          postIds: draftIds
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action.type} drafts`);
      }

      // Refresh the drafts list
      await fetchDrafts();
      setSelectedDrafts(new Set());
      setConfirmAction(null);
    } catch (err) {
      console.error(`Failed to ${action.type} drafts:`, err);
      setError(`Failed to ${action.type} selected drafts. Please try again.`);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${draftId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete draft');
      }

      setDrafts(drafts.filter(draft => draft.id !== draftId));
      setSelectedDrafts(prev => {
        const newSet = new Set(prev);
        newSet.delete(draftId);
        return newSet;
      });
    } catch (err) {
      console.error('Failed to delete draft:', err);
      setError('Failed to delete draft. Please try again.');
    }
  };

  const handlePublishDraft = async (draftId: string) => {
    try {
      const response = await fetch(`/api/posts/${draftId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to publish draft');
      }

      // Remove from drafts list and navigate to published post
      setDrafts(drafts.filter(draft => draft.id !== draftId));
      const publishedPost = await response.json();
      navigate(`/blog/posts/${publishedPost.slug}`);
    } catch (err) {
      console.error('Failed to publish draft:', err);
      setError('Failed to publish draft. Please try again.');
    }
  };

  const getPostTypeIcon = (type: PostType): string => {
    switch (type) {
      case PostType.ARTICLE:
        return '📄';
      case PostType.TUTORIAL:
        return '📚';
      case PostType.NEWS:
        return '📰';
      case PostType.REVIEW:
        return '⭐';
      default:
        return '📝';
    }
  };

  const getPostTypeColor = (type: PostType): string => {
    switch (type) {
      case PostType.ARTICLE:
        return 'bg-blue-100 text-blue-800';
      case PostType.TUTORIAL:
        return 'bg-green-100 text-green-800';
      case PostType.NEWS:
        return 'bg-red-100 text-red-800';
      case PostType.REVIEW:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Draft Manager</h1>
          <p className="text-gray-600 mt-2">
            Manage your unpublished content ({drafts.length} drafts)
          </p>
        </div>
        <Link
          to="/author/posts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          <span className="mr-2">✏️</span>
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search drafts..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as PostType | 'all' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value={PostType.ARTICLE}>Article</option>
              <option value={PostType.TUTORIAL}>Tutorial</option>
              <option value={PostType.NEWS}>News</option>
              <option value={PostType.REVIEW}>Review</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'updated' | 'created' | 'title' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDrafts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedDrafts.size} draft{selectedDrafts.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              {bulkActions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => handleBulkAction(action)}
                  className={`inline-flex items-center px-3 py-1 text-white text-sm font-medium rounded-md ${action.color}`}
                >
                  <span className="mr-1">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Drafts List */}
      {drafts.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedDrafts.size === drafts.length && drafts.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Select All
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {drafts.map((draft) => (
              <div key={draft.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedDrafts.has(draft.id)}
                    onChange={(e) => handleSelectDraft(draft.id, e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getPostTypeIcon(draft.type)}</span>
                      <Link
                        to={`/author/posts/${draft.id}/edit`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate"
                      >
                        {draft.title || 'Untitled'}
                      </Link>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPostTypeColor(draft.type)}`}>
                        {draft.type}
                      </span>
                    </div>
                    {draft.excerpt && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {draft.excerpt}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Updated {formatDistanceToNow(new Date(draft.updatedAt))} ago
                      </span>
                      <span>
                        Created {format(new Date(draft.createdAt), 'MMM d, yyyy')}
                      </span>
                      {draft.readingTime && (
                        <span>{draft.readingTime.minutes} min read</span>
                      )}
                      <span>{draft.wordCount || 0} words</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/author/posts/${draft.id}/edit`}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md hover:bg-blue-200"
                    >
                      Edit
                    </Link>
                    {hasPermission(Permission.PUBLISH_POST) && (
                      <button
                        onClick={() => handlePublishDraft(draft.id)}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md hover:bg-green-200"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.type !== 'all' 
              ? 'Try adjusting your filters to see more drafts.'
              : 'Start writing your first draft to see it here.'
            }
          </p>
          <Link
            to="/author/posts/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            <span className="mr-2">✏️</span>
            Create New Post
          </Link>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm {confirmAction.action.label}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmAction.action.type} {confirmAction.draftIds.length} draft{confirmAction.draftIds.length > 1 ? 's' : ''}?
              {confirmAction.action.type === 'delete' && ' This action cannot be undone.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => executeBulkAction(confirmAction.action, confirmAction.draftIds)}
                className={`px-4 py-2 text-white rounded-md ${confirmAction.action.color}`}
              >
                {confirmAction.action.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftManager;