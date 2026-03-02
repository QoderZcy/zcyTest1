// Complete post editor with preview and publishing workflow

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  Send, 
  Calendar, 
  Settings, 
  Image, 
  Tag, 
  FileText,
  Clock,
  Globe,
  Lock,
  Users,
  ArrowLeft,
  AlertCircle,
  Check
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RichTextEditor } from './RichTextEditor';
import { useBlog } from '../../contexts/blog/BlogContext';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { 
  BlogPost, 
  CreateBlogPostData, 
  PostStatus, 
  PostType,
  SEOMetadata 
} from '../../types/blog/post';
import { Permission } from '../../types/blog/user';
import { PermissionRenderer } from '../auth/guards';

// Form validation schema
const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  content: z.string().min(1, 'Content is required'),
  type: z.nativeEnum(PostType),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  featuredImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
  featuredImageAlt: z.string().optional(),
  status: z.nativeEnum(PostStatus),
  scheduledAt: z.date().optional(),
  allowComments: z.boolean(),
  isPinned: z.boolean(),
  isFeatured: z.boolean(),
  seoMetadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostEditorProps {
  postId?: string;
}

export const PostEditor: React.FC<PostEditorProps> = ({ postId }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentPostId = postId || id;
  
  const { 
    createPost, 
    updatePost, 
    fetchPost, 
    categories, 
    tags, 
    loading, 
    error 
  } = useBlog();
  
  const { user } = useBlogAuth();
  
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      type: PostType.ARTICLE,
      categoryId: '',
      tags: [],
      featuredImage: '',
      featuredImageAlt: '',
      status: PostStatus.DRAFT,
      allowComments: true,
      isPinned: false,
      isFeatured: false,
      seoMetadata: {
        title: '',
        description: '',
        keywords: [],
      },
    }
  });

  const watchedValues = watch();

  // Load existing post if editing
  useEffect(() => {
    if (currentPostId) {
      fetchPost(currentPostId).then(post => {
        if (post) {
          setCurrentPost(post);
          reset({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            type: post.type,
            categoryId: post.categoryId || '',
            tags: post.tags,
            featuredImage: post.featuredImage || '',
            featuredImageAlt: post.featuredImageAlt || '',
            status: post.status,
            scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : undefined,
            allowComments: post.allowComments,
            isPinned: post.isPinned,
            isFeatured: post.isFeatured,
            seoMetadata: post.seoMetadata,
          });
        }
      });
    }
  }, [currentPostId, fetchPost, reset]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [watchedValues]);

  // Auto-save functionality
  const handleAutoSave = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      const formData = watchedValues;
      
      if (currentPost) {
        await updatePost({
          id: currentPost.id,
          ...formData,
          lastEditedBy: user?.id,
        });
      } else {
        const newPost = await createPost(formData);
        setCurrentPost(newPost);
        navigate(`/author/posts/edit/${newPost.id}`, { replace: true });
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setMessage({ type: 'success', text: 'Auto-saved successfully' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Manual save
  const handleSave = async (data: PostFormData) => {
    try {
      if (currentPost) {
        await updatePost({
          id: currentPost.id,
          ...data,
          lastEditedBy: user?.id,
        });
        setMessage({ type: 'success', text: 'Post saved successfully' });
      } else {
        const newPost = await createPost(data);
        setCurrentPost(newPost);
        navigate(`/author/posts/edit/${newPost.id}`, { replace: true });
        setMessage({ type: 'success', text: 'Post created successfully' });
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save post' });
    }
  };

  // Publish post
  const handlePublish = async () => {
    try {
      const formData = watchedValues;
      const postData = {
        ...formData,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      };

      if (currentPost) {
        await updatePost({
          id: currentPost.id,
          ...postData,
        });
      } else {
        const newPost = await createPost(postData);
        setCurrentPost(newPost);
      }

      setMessage({ type: 'success', text: 'Post published successfully' });
      navigate('/author/posts');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to publish post' });
    }
  };

  // Schedule post
  const handleSchedule = async (scheduledAt: Date) => {
    try {
      const formData = watchedValues;
      const postData = {
        ...formData,
        status: PostStatus.SCHEDULED,
        scheduledAt,
      };

      if (currentPost) {
        await updatePost({
          id: currentPost.id,
          ...postData,
        });
      } else {
        const newPost = await createPost(postData);
        setCurrentPost(newPost);
      }

      setMessage({ type: 'success', text: 'Post scheduled successfully' });
      setShowScheduler(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to schedule post' });
    }
  };

  const isEditing = !!currentPost;
  const isDraft = watchedValues.status === PostStatus.DRAFT;
  const isPublished = watchedValues.status === PostStatus.PUBLISHED;

  return (
    <div className="post-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <button
            type="button"
            onClick={() => navigate('/author/posts')}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft size={16} />
            Back to Posts
          </button>
          
          <div className="post-status">
            {isEditing ? (
              <span className={`status-badge ${watchedValues.status}`}>
                {watchedValues.status.replace('_', ' ')}
              </span>
            ) : (
              <span className="status-badge draft">New Post</span>
            )}
          </div>
        </div>

        <div className="header-center">
          {lastSaved && (
            <span className="last-saved">
              <Check size={14} />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          
          {hasUnsavedChanges && (
            <span className="unsaved-indicator">
              <AlertCircle size={14} />
              Unsaved changes
            </span>
          )}
        </div>

        <div className="header-actions">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`btn btn-outline btn-sm ${isPreviewMode ? 'active' : ''}`}
          >
            <Eye size={16} />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-outline btn-sm"
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            type="button"
            onClick={handleSubmit(handleSave)}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            <Save size={16} />
            Save Draft
          </button>

          {isDraft && (
            <>
              <button
                type="button"
                onClick={() => setShowScheduler(true)}
                className="btn btn-secondary btn-sm"
              >
                <Calendar size={16} />
                Schedule
              </button>

              <PermissionRenderer permissions={[Permission.PUBLISH_POSTS]}>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                >
                  <Send size={16} />
                  Publish
                </button>
              </PermissionRenderer>
            </>
          )}

          {isPublished && (
            <button
              type="button"
              onClick={handleSubmit(handleSave)}
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              <Save size={16} />
              Update
            </button>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <Check size={16} />
          )}
          {message.text}
        </div>
      )}

      <div className="editor-content">
        {/* Main Editor */}
        <div className="editor-main">
          {!isPreviewMode ? (
            <form onSubmit={handleSubmit(handleSave)} className="editor-form">
              {/* Title */}
              <div className="form-group">
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Enter your post title..."
                  className={`title-input ${errors.title ? 'error' : ''}`}
                />
                {errors.title && (
                  <span className="error-message">{errors.title.message}</span>
                )}
              </div>

              {/* Excerpt */}
              <div className="form-group">
                <textarea
                  {...register('excerpt')}
                  placeholder="Write a brief excerpt for your post..."
                  className="excerpt-input"
                  rows={3}
                />
                {errors.excerpt && (
                  <span className="error-message">{errors.excerpt.message}</span>
                )}
              </div>

              {/* Rich Text Editor */}
              <div className="form-group">
                <RichTextEditor
                  content={watchedValues.content}
                  onChange={(content) => setValue('content', content)}
                  onSave={handleAutoSave}
                  autoSave={true}
                />
                {errors.content && (
                  <span className="error-message">{errors.content.message}</span>
                )}
              </div>
            </form>
          ) : (
            <div className="preview-mode">
              {/* Preview content would go here */}
              <div className="preview-header">
                <h1>{watchedValues.title || 'Untitled Post'}</h1>
                {watchedValues.excerpt && (
                  <p className="preview-excerpt">{watchedValues.excerpt}</p>
                )}
              </div>
              
              <div className="preview-content">
                {/* Rendered markdown content would go here */}
                <p>Preview of the post content...</p>
              </div>
            </div>
          )}
        </div>

        {/* Settings Sidebar */}
        {showSettings && (
          <div className="editor-sidebar">
            <div className="sidebar-section">
              <h3>
                <FileText size={16} />
                Post Settings
              </h3>

              <div className="form-group">
                <label htmlFor="type">Post Type</label>
                <select id="type" {...register('type')}>
                  {Object.values(PostType).map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" {...register('categoryId')}>
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  placeholder="react, javascript, tutorial"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim());
                    setValue('tags', tags);
                  }}
                />
              </div>
            </div>

            <div className="sidebar-section">
              <h3>
                <Image size={16} />
                Featured Image
              </h3>

              <div className="form-group">
                <label htmlFor="featuredImage">Image URL</label>
                <input
                  type="url"
                  id="featuredImage"
                  {...register('featuredImage')}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="featuredImageAlt">Alt Text</label>
                <input
                  type="text"
                  id="featuredImageAlt"
                  {...register('featuredImageAlt')}
                  placeholder="Describe the image"
                />
              </div>
            </div>

            <div className="sidebar-section">
              <h3>
                <Globe size={16} />
                SEO & Visibility
              </h3>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    {...register('allowComments')}
                  />
                  Allow comments
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    {...register('isPinned')}
                  />
                  Pin to top
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    {...register('isFeatured')}
                  />
                  Feature this post
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduler && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Schedule Post</h3>
              <button
                type="button"
                onClick={() => setShowScheduler(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="scheduledDate">Publication Date & Time</label>
                <input
                  type="datetime-local"
                  id="scheduledDate"
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setValue('scheduledAt', new Date(e.target.value));
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowScheduler(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (watchedValues.scheduledAt) {
                    handleSchedule(watchedValues.scheduledAt);
                  }
                }}
                className="btn btn-primary"
                disabled={!watchedValues.scheduledAt}
              >
                <Clock size={16} />
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};