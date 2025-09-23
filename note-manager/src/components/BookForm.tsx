import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  X, 
  Save, 
  Upload, 
  Plus, 
  Minus, 
  BookOpen,
  Calendar,
  MapPin,
  Tag as TagIcon,
  Building
} from 'lucide-react';
import type { Book, NewBook, BookCategory } from '../types/book';
import { BOOK_CATEGORY_LABELS } from '../types/book';

// 图书表单验证模式
const bookFormSchema = z.object({
  title: z.string().min(1, '图书标题不能为空').max(200, '标题长度不能超过200字符'),
  author: z.string().min(1, '作者不能为空').max(100, '作者长度不能超过100字符'),
  isbn: z.string().optional().refine(
    (val) => !val || /^(97[89])?\d{9}(\d|X)$/.test(val.replace(/-/g, '')),
    '请输入有效的ISBN号码'
  ),
  publisher: z.string().max(100, '出版社名称长度不能超过100字符').optional(),
  publishDate: z.date().optional(),
  category: z.nativeEnum(Object.keys(BOOK_CATEGORY_LABELS).reduce((acc, key) => {
    acc[key as keyof typeof BOOK_CATEGORY_LABELS] = key;
    return acc;
  }, {} as any) as { [K in keyof typeof BOOK_CATEGORY_LABELS]: K }),
  description: z.string().max(1000, '描述长度不能超过1000字符').optional(),
  totalCopies: z.number().min(1, '总册数至少为1').max(999, '总册数不能超过999'),
  location: z.string().max(50, '位置信息长度不能超过50字符').optional(),
  tags: z.array(z.string().min(1).max(20)).max(10, '标签数量不能超过10个'),
});

type BookFormData = z.infer<typeof bookFormSchema>;

interface BookFormProps {
  book?: Book | null;
  isOpen: boolean;
  onSave: (bookData: NewBook) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

export const BookForm: React.FC<BookFormProps> = ({
  book,
  isOpen,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      publishDate: undefined,
      category: 'FICTION' as BookCategory,
      description: '',
      totalCopies: 1,
      location: '',
      tags: [],
    },
  });

  const watchedTags = watch('tags');

  // 重置表单数据
  useEffect(() => {
    if (isOpen) {
      if (book) {
        reset({
          title: book.title,
          author: book.author,
          isbn: book.isbn || '',
          publisher: book.publisher || '',
          publishDate: book.publishDate ? new Date(book.publishDate) : undefined,
          category: book.category,
          description: book.description || '',
          totalCopies: book.totalCopies,
          location: book.location || '',
          tags: book.tags,
        });
        setCoverImagePreview(book.coverImage || '');
      } else {
        reset({
          title: '',
          author: '',
          isbn: '',
          publisher: '',
          publishDate: undefined,
          category: 'FICTION' as BookCategory,
          description: '',
          totalCopies: 1,
          location: '',
          tags: [],
        });
        setCoverImagePreview('');
      }
      setCoverImageFile(null);
      setTagInput('');
    }
  }, [book, isOpen, reset]);

  const handleFormSubmit = async (data: BookFormData) => {
    try {
      const bookData: NewBook = {
        title: data.title,
        author: data.author,
        isbn: data.isbn || undefined,
        publisher: data.publisher || undefined,
        publishDate: data.publishDate,
        category: data.category,
        description: data.description || undefined,
        totalCopies: data.totalCopies,
        location: data.location || undefined,
        tags: data.tags,
        coverImage: coverImagePreview || undefined,
      };

      await onSave(bookData);
    } catch (error) {
      console.error('Failed to save book:', error);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('表单有未保存的更改，确定要取消吗？')) {
      return;
    }
    onCancel();
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('图片文件大小不能超过5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('请选择有效的图片文件');
        return;
      }

      setCoverImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !watchedTags.includes(tag) && watchedTags.length < 10) {
      setValue('tags', [...watchedTags, tag], { shouldDirty: true });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = watchedTags.filter((_, i) => i !== index);
    setValue('tags', newTags, { shouldDirty: true });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal book-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <BookOpen size={24} />
            {book ? '编辑图书' : '添加图书'}
          </h2>
          <button
            className="modal-close"
            onClick={handleCancel}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="book-form">
          <div className="modal-body">
            <div className="book-form__layout">
              {/* 左侧：基本信息 */}
              <div className="book-form__section book-form__basic-info">
                <h3 className="book-form__section-title">基本信息</h3>

                {/* 图书标题 */}
                <div className="form-group">
                  <label htmlFor="title" className="form-label required">
                    图书标题
                  </label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="title"
                        type="text"
                        className={`form-input ${errors.title ? 'error' : ''}`}
                        placeholder="请输入图书标题"
                        autoFocus
                      />
                    )}
                  />
                  {errors.title && (
                    <span className="form-error">{errors.title.message}</span>
                  )}
                </div>

                {/* 作者 */}
                <div className="form-group">
                  <label htmlFor="author" className="form-label required">
                    作者
                  </label>
                  <Controller
                    name="author"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="author"
                        type="text"
                        className={`form-input ${errors.author ? 'error' : ''}`}
                        placeholder="请输入作者姓名"
                      />
                    )}
                  />
                  {errors.author && (
                    <span className="form-error">{errors.author.message}</span>
                  )}
                </div>

                {/* ISBN */}
                <div className="form-group">
                  <label htmlFor="isbn" className="form-label">
                    ISBN
                  </label>
                  <Controller
                    name="isbn"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="isbn"
                        type="text"
                        className={`form-input ${errors.isbn ? 'error' : ''}`}
                        placeholder="请输入ISBN号码（可选）"
                      />
                    )}
                  />
                  {errors.isbn && (
                    <span className="form-error">{errors.isbn.message}</span>
                  )}
                </div>

                {/* 出版社 */}
                <div className="form-group">
                  <label htmlFor="publisher" className="form-label">
                    <Building size={16} />
                    出版社
                  </label>
                  <Controller
                    name="publisher"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="publisher"
                        type="text"
                        className={`form-input ${errors.publisher ? 'error' : ''}`}
                        placeholder="请输入出版社名称"
                      />
                    )}
                  />
                  {errors.publisher && (
                    <span className="form-error">{errors.publisher.message}</span>
                  )}
                </div>

                {/* 出版日期 */}
                <div className="form-group">
                  <label htmlFor="publishDate" className="form-label">
                    <Calendar size={16} />
                    出版日期
                  </label>
                  <Controller
                    name="publishDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        id="publishDate"
                        type="date"
                        className="form-input"
                      />
                    )}
                  />
                </div>

                {/* 分类 */}
                <div className="form-group">
                  <label htmlFor="category" className="form-label required">
                    图书分类
                  </label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        id="category"
                        className={`form-select ${errors.category ? 'error' : ''}`}
                      >
                        {Object.entries(BOOK_CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.category && (
                    <span className="form-error">{errors.category.message}</span>
                  )}
                </div>
              </div>

              {/* 右侧：详细信息 */}
              <div className="book-form__section book-form__details">
                <h3 className="book-form__section-title">详细信息</h3>

                {/* 封面图片 */}
                <div className="form-group">
                  <label className="form-label">封面图片</label>
                  <div className="book-form__cover-upload">
                    {coverImagePreview ? (
                      <div className="book-form__cover-preview">
                        <img
                          src={coverImagePreview}
                          alt="封面预览"
                          className="book-form__cover-image"
                        />
                        <button
                          type="button"
                          className="book-form__cover-remove"
                          onClick={() => {
                            setCoverImagePreview('');
                            setCoverImageFile(null);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="book-form__cover-placeholder">
                        <BookOpen size={32} />
                        <span>暂无封面</span>
                      </div>
                    )}
                    <label className="btn btn-outline btn-sm">
                      <Upload size={16} />
                      上传封面
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="book-form__cover-input"
                      />
                    </label>
                  </div>
                </div>

                {/* 总册数 */}
                <div className="form-group">
                  <label htmlFor="totalCopies" className="form-label required">
                    总册数
                  </label>
                  <Controller
                    name="totalCopies"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        id="totalCopies"
                        type="number"
                        min="1"
                        max="999"
                        className={`form-input ${errors.totalCopies ? 'error' : ''}`}
                        placeholder="请输入总册数"
                      />
                    )}
                  />
                  {errors.totalCopies && (
                    <span className="form-error">{errors.totalCopies.message}</span>
                  )}
                </div>

                {/* 存放位置 */}
                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    <MapPin size={16} />
                    存放位置
                  </label>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="location"
                        type="text"
                        className={`form-input ${errors.location ? 'error' : ''}`}
                        placeholder="如：A-001-001"
                      />
                    )}
                  />
                  {errors.location && (
                    <span className="form-error">{errors.location.message}</span>
                  )}
                </div>

                {/* 标签 */}
                <div className="form-group">
                  <label className="form-label">
                    <TagIcon size={16} />
                    标签
                  </label>
                  <div className="book-form__tags">
                    <div className="book-form__tag-input">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="添加标签"
                        className="form-input"
                        disabled={watchedTags.length >= 10}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        disabled={!tagInput.trim() || watchedTags.includes(tagInput.trim()) || watchedTags.length >= 10}
                        className="btn btn-icon btn-sm"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="book-form__tag-list">
                      {watchedTags.map((tag, index) => (
                        <span key={index} className="book-form__tag">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(index)}
                            className="book-form__tag-remove"
                          >
                            <Minus size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  {errors.tags && (
                    <span className="form-error">{errors.tags.message}</span>
                  )}
                </div>

                {/* 描述 */}
                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    图书描述
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        id="description"
                        rows={4}
                        className={`form-textarea ${errors.description ? 'error' : ''}`}
                        placeholder="请输入图书描述（可选）"
                      />
                    )}
                  />
                  {errors.description && (
                    <span className="form-error">{errors.description.message}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};