// Category and tag management component

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Folder, 
  Tag as TagIcon, 
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  TrendingUp,
  Hash
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBlog } from '../../contexts/blog/BlogContext';
import { Category, Tag } from '../../types/blog';
import { PermissionRenderer } from '../auth/guards';
import { Permission } from '../../types/blog/user';

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(30, 'Name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type TagFormData = z.infer<typeof tagSchema>;

interface CategoryManagerProps {
  onClose?: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const { 
    categories, 
    tags, 
    createCategory, 
    createTag, 
    fetchCategories, 
    fetchTags,
    loading 
  } = useBlog();

  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);

  // Category form
  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    formState: { errors: categoryErrors },
    reset: resetCategory
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema)
  });

  // Tag form
  const {
    register: registerTag,
    handleSubmit: handleSubmitTag,
    formState: { errors: tagErrors },
    reset: resetTag
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema)
  });

  // Load data on mount
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [fetchCategories, fetchTags]);

  // Filter categories and tags
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive || category.isActive;
    return matchesSearch && matchesStatus;
  });

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handle category submission
  const onSubmitCategory = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        // Update category logic would go here
        console.log('Update category:', editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      
      resetCategory();
      setEditingCategory(null);
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  // Handle tag submission
  const onSubmitTag = async (data: TagFormData) => {
    try {
      if (editingTag) {
        // Update tag logic would go here
        console.log('Update tag:', editingTag.id, data);
      } else {
        await createTag(data);
      }
      
      resetTag();
      setEditingTag(null);
      setShowTagForm(false);
      fetchTags();
    } catch (error) {
      console.error('Failed to save tag:', error);
    }
  };

  // Start editing category
  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    resetCategory({
      name: category.name,
      description: category.description || '',
      color: category.color || '',
      icon: category.icon || '',
      parentId: category.parentId || '',
    });
    setShowCategoryForm(true);
  };

  // Start editing tag
  const startEditTag = (tag: Tag) => {
    setEditingTag(tag);
    resetTag({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '',
    });
    setShowTagForm(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingTag(null);
    setShowCategoryForm(false);
    setShowTagForm(false);
    resetCategory();
    resetTag();
  };

  return (
    <div className="category-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-left">
          <h2>Content Organization</h2>
          <p>Manage categories and tags for your blog posts</p>
        </div>
        
        <div className="header-actions">
          {onClose && (
            <button onClick={onClose} className="btn btn-outline">
              <X size={16} />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="manager-tabs">
        <button
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Folder size={16} />
          Categories ({categories.length})
        </button>
        <button
          className={`tab ${activeTab === 'tags' ? 'active' : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          <TagIcon size={16} />
          Tags ({tags.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="manager-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === 'categories' && (
            <label className="filter-toggle">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive
            </label>
          )}
        </div>

        <div className="toolbar-right">
          <PermissionRenderer permissions={[Permission.MANAGE_CATEGORIES, Permission.MANAGE_TAGS]}>
            <button
              onClick={() => {
                if (activeTab === 'categories') {
                  setShowCategoryForm(true);
                } else {
                  setShowTagForm(true);
                }
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              Add {activeTab === 'categories' ? 'Category' : 'Tag'}
            </button>
          </PermissionRenderer>
        </div>
      </div>

      {/* Content */}
      <div className="manager-content">
        {activeTab === 'categories' ? (
          <div className="categories-list">
            {filteredCategories.length === 0 ? (
              <div className="empty-state">
                <Folder size={48} />
                <h3>No categories found</h3>
                <p>Create your first category to organize your content</p>
                <PermissionRenderer permissions={[Permission.MANAGE_CATEGORIES]}>
                  <button
                    onClick={() => setShowCategoryForm(true)}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    Create Category
                  </button>
                </PermissionRenderer>
              </div>
            ) : (
              <div className="categories-grid">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="card-header">
                      <div className="category-info">
                        <div className="category-icon">
                          {category.icon ? (
                            <span>{category.icon}</span>
                          ) : (
                            <Folder size={20} />
                          )}
                        </div>
                        <div>
                          <h4>{category.name}</h4>
                          <p className="category-description">{category.description}</p>
                        </div>
                      </div>
                      
                      <PermissionRenderer permissions={[Permission.MANAGE_CATEGORIES]}>
                        <div className="card-actions">
                          <button
                            onClick={() => startEditCategory(category)}
                            className="btn btn-sm btn-outline"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              // Delete category logic
                              console.log('Delete category:', category.id);
                            }}
                            className="btn btn-sm btn-outline btn-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </PermissionRenderer>
                    </div>

                    <div className="card-stats">
                      <div className="stat">
                        <span className="stat-value">{category.postCount}</span>
                        <span className="stat-label">Posts</span>
                      </div>
                      <div className="stat">
                        <span className={`status ${category.isActive ? 'active' : 'inactive'}`}>
                          {category.isActive ? (
                            <>
                              <Eye size={12} />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} />
                              Inactive
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="tags-list">
            {filteredTags.length === 0 ? (
              <div className="empty-state">
                <TagIcon size={48} />
                <h3>No tags found</h3>
                <p>Create tags to help readers discover your content</p>
                <PermissionRenderer permissions={[Permission.MANAGE_TAGS]}>
                  <button
                    onClick={() => setShowTagForm(true)}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    Create Tag
                  </button>
                </PermissionRenderer>
              </div>
            ) : (
              <div className="tags-grid">
                {filteredTags.map((tag) => (
                  <div key={tag.id} className="tag-card">
                    <div className="card-header">
                      <div className="tag-info">
                        <div className="tag-icon">
                          <Hash size={16} />
                        </div>
                        <div>
                          <h4>#{tag.name}</h4>
                          {tag.description && (
                            <p className="tag-description">{tag.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <PermissionRenderer permissions={[Permission.MANAGE_TAGS]}>
                        <div className="card-actions">
                          <button
                            onClick={() => startEditTag(tag)}
                            className="btn btn-sm btn-outline"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              // Delete tag logic
                              console.log('Delete tag:', tag.id);
                            }}
                            className="btn btn-sm btn-outline btn-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </PermissionRenderer>
                    </div>

                    <div className="card-stats">
                      <div className="stat">
                        <span className="stat-value">{tag.postCount}</span>
                        <span className="stat-label">Posts</span>
                      </div>
                      {tag.trending && (
                        <div className="trending-badge">
                          <TrendingUp size={12} />
                          Trending
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button onClick={cancelEdit} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory(onSubmitCategory)}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="categoryName">Name *</label>
                  <input
                    id="categoryName"
                    type="text"
                    {...registerCategory('name')}
                    className={categoryErrors.name ? 'error' : ''}
                    placeholder="Enter category name"
                  />
                  {categoryErrors.name && (
                    <span className="error-message">{categoryErrors.name.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="categoryDescription">Description</label>
                  <textarea
                    id="categoryDescription"
                    {...registerCategory('description')}
                    className={categoryErrors.description ? 'error' : ''}
                    placeholder="Describe this category"
                    rows={3}
                  />
                  {categoryErrors.description && (
                    <span className="error-message">{categoryErrors.description.message}</span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="categoryColor">Color</label>
                    <input
                      id="categoryColor"
                      type="color"
                      {...registerCategory('color')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="categoryIcon">Icon</label>
                    <input
                      id="categoryIcon"
                      type="text"
                      {...registerCategory('icon')}
                      placeholder="📁"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="parentCategory">Parent Category</label>
                  <select id="parentCategory" {...registerCategory('parentId')}>
                    <option value="">None (Top level)</option>
                    {categories
                      .filter(cat => cat.id !== editingCategory?.id)
                      .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cancelEdit} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} />
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Form Modal */}
      {showTagForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTag ? 'Edit Tag' : 'Create Tag'}</h3>
              <button onClick={cancelEdit} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitTag(onSubmitTag)}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="tagName">Name *</label>
                  <input
                    id="tagName"
                    type="text"
                    {...registerTag('name')}
                    className={tagErrors.name ? 'error' : ''}
                    placeholder="Enter tag name"
                  />
                  {tagErrors.name && (
                    <span className="error-message">{tagErrors.name.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="tagDescription">Description</label>
                  <textarea
                    id="tagDescription"
                    {...registerTag('description')}
                    className={tagErrors.description ? 'error' : ''}
                    placeholder="Describe this tag"
                    rows={2}
                  />
                  {tagErrors.description && (
                    <span className="error-message">{tagErrors.description.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="tagColor">Color</label>
                  <input
                    id="tagColor"
                    type="color"
                    {...registerTag('color')}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cancelEdit} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} />
                  {editingTag ? 'Update' : 'Create'} Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};