import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  X, 
  Save, 
  User, 
  BookOpen, 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  RotateCcw,
  FileText
} from 'lucide-react';
import type { Book } from '../types/book';
import type { NewBorrowRecord, BorrowRecord, ReturnProcess, RenewalRequest } from '../types/borrow';
import { BORROW_STATUS_LABELS, BORROW_STATUS_COLORS } from '../types/borrow';

// 借阅表单验证模式
const borrowFormSchema = z.object({
  bookId: z.string().min(1, '请选择图书'),
  userId: z.string().min(1, '请选择用户'),
  borrowPeriodDays: z.number().min(1, '借阅期限至少1天').max(365, '借阅期限不能超过365天').optional(),
  notes: z.string().max(500, '备注长度不能超过500字符').optional(),
});

// 归还表单验证模式
const returnFormSchema = z.object({
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST'], {
    required_error: '请选择图书状态',
  }),
  damageDescription: z.string().max(500, '损坏描述长度不能超过500字符').optional(),
  additionalFine: z.number().min(0, '额外罚金不能为负数').optional(),
});

// 续借表单验证模式
const renewalFormSchema = z.object({
  requestedDays: z.number().min(1, '续借天数至少1天').max(90, '续借天数不能超过90天').default(15),
  reason: z.string().max(200, '续借原因长度不能超过200字符').optional(),
});

type BorrowFormData = z.infer<typeof borrowFormSchema>;
type ReturnFormData = z.infer<typeof returnFormSchema>;
type RenewalFormData = z.infer<typeof renewalFormSchema>;

interface BorrowFormProps {
  type: 'borrow' | 'return' | 'renew';
  isOpen: boolean;
  onSave: (data: NewBorrowRecord | ReturnProcess | RenewalRequest) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  borrowRecord?: BorrowRecord | null;
  selectedBook?: Book | null;
  selectedUser?: { id: string; username: string; email: string } | null;
  onBookSearch?: (query: string) => Promise<Book[]>;
  onUserSearch?: (query: string) => Promise<Array<{ id: string; username: string; email: string }>>;
}

export const BorrowForm: React.FC<BorrowFormProps> = ({
  type,
  isOpen,
  onSave,
  onCancel,
  loading = false,
  borrowRecord,
  selectedBook,
  selectedUser,
  onBookSearch,
  onUserSearch,
}) => {
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<Book[]>([]);
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; username: string; email: string }>>([]);
  const [selectedBookData, setSelectedBookData] = useState<Book | null>(selectedBook || null);
  const [selectedUserData, setSelectedUserData] = useState<{ id: string; username: string; email: string } | null>(selectedUser || null);
  const [calculatedFine, setCalculatedFine] = useState<number>(0);

  // 根据表单类型选择验证模式和默认值
  const getFormConfig = () => {
    switch (type) {
      case 'borrow':
        return {
          schema: borrowFormSchema,
          defaultValues: {
            bookId: selectedBook?.id || '',
            userId: selectedUser?.id || '',
            borrowPeriodDays: 30,
            notes: '',
          } as BorrowFormData,
        };
      case 'return':
        return {
          schema: returnFormSchema,
          defaultValues: {
            condition: 'GOOD' as const,
            damageDescription: '',
            additionalFine: 0,
          } as ReturnFormData,
        };
      case 'renew':
        return {
          schema: renewalFormSchema,
          defaultValues: {
            requestedDays: 15,
            reason: '',
          } as RenewalFormData,
        };
    }
  };

  const formConfig = getFormConfig();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(formConfig.schema),
    defaultValues: formConfig.defaultValues,
  });

  // 监听表单变化以计算罚金
  const watchedCondition = watch('condition' as any);
  const watchedAdditionalFine = watch('additionalFine' as any);

  // 计算逾期罚金
  useEffect(() => {
    if (type === 'return' && borrowRecord) {
      const now = new Date();
      const dueDate = new Date(borrowRecord.dueDate);
      if (now > dueDate) {
        const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const overdueFine = overdueDays * 0.5; // 假设每天0.5元罚金
        setCalculatedFine(overdueFine + (watchedAdditionalFine || 0));
      } else {
        setCalculatedFine(watchedAdditionalFine || 0);
      }
    }
  }, [type, borrowRecord, watchedAdditionalFine]);

  // 重置表单数据
  useEffect(() => {
    if (isOpen) {
      reset(formConfig.defaultValues);
      setSelectedBookData(selectedBook || null);
      setSelectedUserData(selectedUser || null);
      setBookSearchQuery('');
      setUserSearchQuery('');
      setBookSearchResults([]);
      setUserSearchResults([]);
    }
  }, [isOpen, reset, formConfig.defaultValues, selectedBook, selectedUser]);

  // 图书搜索
  const handleBookSearch = async (query: string) => {
    setBookSearchQuery(query);
    if (query.length >= 2 && onBookSearch) {
      try {
        const results = await onBookSearch(query);
        setBookSearchResults(results);
      } catch (error) {
        console.error('Book search failed:', error);
        setBookSearchResults([]);
      }
    } else {
      setBookSearchResults([]);
    }
  };

  // 用户搜索
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (query.length >= 2 && onUserSearch) {
      try {
        const results = await onUserSearch(query);
        setUserSearchResults(results);
      } catch (error) {
        console.error('User search failed:', error);
        setUserSearchResults([]);
      }
    } else {
      setUserSearchResults([]);
    }
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBookData(book);
    setValue('bookId' as any, book.id);
    setBookSearchQuery(book.title);
    setBookSearchResults([]);
  };

  const handleUserSelect = (user: { id: string; username: string; email: string }) => {
    setSelectedUserData(user);
    setValue('userId' as any, user.id);
    setUserSearchQuery(user.username);
    setUserSearchResults([]);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      switch (type) {
        case 'borrow':
          await onSave({
            bookId: data.bookId,
            userId: data.userId,
            borrowPeriodDays: data.borrowPeriodDays,
            notes: data.notes,
          } as NewBorrowRecord);
          break;
        case 'return':
          await onSave({
            borrowRecordId: borrowRecord!.id,
            returnDate: new Date(),
            condition: data.condition,
            damageDescription: data.damageDescription,
            additionalFine: data.additionalFine,
            librarianId: 'current-user-id', // 应该从当前用户上下文获取
          } as ReturnProcess);
          break;
        case 'renew':
          await onSave({
            borrowRecordId: borrowRecord!.id,
            requestedDays: data.requestedDays,
            reason: data.reason,
          } as RenewalRequest);
          break;
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('表单有未保存的更改，确定要取消吗？')) {
      return;
    }
    onCancel();
  };

  const getFormTitle = () => {
    switch (type) {
      case 'borrow':
        return '借阅图书';
      case 'return':
        return '归还图书';
      case 'renew':
        return '续借图书';
    }
  };

  const getFormIcon = () => {
    switch (type) {
      case 'borrow':
        return <BookOpen size={24} />;
      case 'return':
        return <RotateCcw size={24} />;
      case 'renew':
        return <Clock size={24} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal borrow-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {getFormIcon()}
            {getFormTitle()}
          </h2>
          <button
            className="modal-close"
            onClick={handleCancel}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="borrow-form">
          <div className="modal-body">
            {/* 借阅表单 */}
            {type === 'borrow' && (
              <div className="borrow-form__content">
                {/* 图书选择 */}
                <div className="form-group">
                  <label className="form-label required">选择图书</label>
                  <div className="borrow-form__search-container">
                    <div className="borrow-form__search-input">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="搜索图书标题、作者或ISBN"
                        value={bookSearchQuery}
                        onChange={(e) => handleBookSearch(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    {bookSearchResults.length > 0 && (
                      <div className="borrow-form__search-results">
                        {bookSearchResults.map((book) => (
                          <div
                            key={book.id}
                            className="borrow-form__search-result"
                            onClick={() => handleBookSelect(book)}
                          >
                            <div className="borrow-form__search-result-info">
                              <div className="borrow-form__search-result-title">{book.title}</div>
                              <div className="borrow-form__search-result-author">{book.author}</div>
                              <div className="borrow-form__search-result-meta">
                                可借：{book.availableCopies}/{book.totalCopies}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedBookData && (
                    <div className="borrow-form__selected-item">
                      <BookOpen size={16} />
                      <span>{selectedBookData.title} - {selectedBookData.author}</span>
                    </div>
                  )}
                  {errors.bookId && (
                    <span className="form-error">{(errors.bookId as any).message}</span>
                  )}
                </div>

                {/* 用户选择 */}
                <div className="form-group">
                  <label className="form-label required">选择用户</label>
                  <div className="borrow-form__search-container">
                    <div className="borrow-form__search-input">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="搜索用户姓名或邮箱"
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    {userSearchResults.length > 0 && (
                      <div className="borrow-form__search-results">
                        {userSearchResults.map((user) => (
                          <div
                            key={user.id}
                            className="borrow-form__search-result"
                            onClick={() => handleUserSelect(user)}
                          >
                            <div className="borrow-form__search-result-info">
                              <div className="borrow-form__search-result-title">{user.username}</div>
                              <div className="borrow-form__search-result-author">{user.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedUserData && (
                    <div className="borrow-form__selected-item">
                      <User size={16} />
                      <span>{selectedUserData.username} ({selectedUserData.email})</span>
                    </div>
                  )}
                  {errors.userId && (
                    <span className="form-error">{(errors.userId as any).message}</span>
                  )}
                </div>

                {/* 借阅期限 */}
                <div className="form-group">
                  <label htmlFor="borrowPeriodDays" className="form-label">
                    <Calendar size={16} />
                    借阅期限（天）
                  </label>
                  <Controller
                    name="borrowPeriodDays"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        id="borrowPeriodDays"
                        type="number"
                        min="1"
                        max="365"
                        className="form-input"
                        placeholder="30"
                      />
                    )}
                  />
                  {errors.borrowPeriodDays && (
                    <span className="form-error">{(errors.borrowPeriodDays as any).message}</span>
                  )}
                </div>

                {/* 备注 */}
                <div className="form-group">
                  <label htmlFor="notes" className="form-label">
                    <FileText size={16} />
                    备注
                  </label>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        id="notes"
                        rows={3}
                        className="form-textarea"
                        placeholder="可选的备注信息"
                      />
                    )}
                  />
                  {errors.notes && (
                    <span className="form-error">{(errors.notes as any).message}</span>
                  )}
                </div>
              </div>
            )}

            {/* 归还表单 */}
            {type === 'return' && borrowRecord && (
              <div className="borrow-form__content">
                {/* 借阅信息展示 */}
                <div className="borrow-form__record-info">
                  <h3>借阅信息</h3>
                  <div className="borrow-form__record-details">
                    <div className="borrow-form__record-item">
                      <strong>图书：</strong>{borrowRecord.book?.title} - {borrowRecord.book?.author}
                    </div>
                    <div className="borrow-form__record-item">
                      <strong>借阅者：</strong>{borrowRecord.user?.username}
                    </div>
                    <div className="borrow-form__record-item">
                      <strong>借阅日期：</strong>{new Date(borrowRecord.borrowDate).toLocaleDateString()}
                    </div>
                    <div className="borrow-form__record-item">
                      <strong>应还日期：</strong>{new Date(borrowRecord.dueDate).toLocaleDateString()}
                    </div>
                    <div className="borrow-form__record-item">
                      <strong>状态：</strong>
                      <span 
                        className="borrow-form__status-badge"
                        style={{ backgroundColor: BORROW_STATUS_COLORS[borrowRecord.status] }}
                      >
                        {BORROW_STATUS_LABELS[borrowRecord.status]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 图书状态 */}
                <div className="form-group">
                  <label className="form-label required">图书状态</label>
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <div className="borrow-form__condition-options">
                        <label className="borrow-form__condition-option">
                          <input
                            type="radio"
                            value="GOOD"
                            checked={field.value === 'GOOD'}
                            onChange={field.onChange}
                          />
                          <CheckCircle size={16} />
                          <span>完好</span>
                        </label>
                        <label className="borrow-form__condition-option">
                          <input
                            type="radio"
                            value="DAMAGED"
                            checked={field.value === 'DAMAGED'}
                            onChange={field.onChange}
                          />
                          <AlertTriangle size={16} />
                          <span>损坏</span>
                        </label>
                        <label className="borrow-form__condition-option">
                          <input
                            type="radio"
                            value="LOST"
                            checked={field.value === 'LOST'}
                            onChange={field.onChange}
                          />
                          <X size={16} />
                          <span>遗失</span>
                        </label>
                      </div>
                    )}
                  />
                  {errors.condition && (
                    <span className="form-error">{(errors.condition as any).message}</span>
                  )}
                </div>

                {/* 损坏描述 */}
                {watchedCondition === 'DAMAGED' && (
                  <div className="form-group">
                    <label htmlFor="damageDescription" className="form-label">
                      损坏描述
                    </label>
                    <Controller
                      name="damageDescription"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          id="damageDescription"
                          rows={3}
                          className="form-textarea"
                          placeholder="请描述图书的损坏情况"
                        />
                      )}
                    />
                    {errors.damageDescription && (
                      <span className="form-error">{(errors.damageDescription as any).message}</span>
                    )}
                  </div>
                )}

                {/* 额外罚金 */}
                {(watchedCondition === 'DAMAGED' || watchedCondition === 'LOST') && (
                  <div className="form-group">
                    <label htmlFor="additionalFine" className="form-label">
                      额外罚金（元）
                    </label>
                    <Controller
                      name="additionalFine"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          id="additionalFine"
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-input"
                          placeholder="0.00"
                        />
                      )}
                    />
                    {errors.additionalFine && (
                      <span className="form-error">{(errors.additionalFine as any).message}</span>
                    )}
                  </div>
                )}

                {/* 罚金总计 */}
                {calculatedFine > 0 && (
                  <div className="borrow-form__fine-summary">
                    <div className="borrow-form__fine-item">
                      <span>总罚金：</span>
                      <strong>¥{calculatedFine.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 续借表单 */}
            {type === 'renew' && borrowRecord && (
              <div className="borrow-form__content">
                {/* 借阅信息展示 */}
                <div className="borrow-form__record-info">
                  <h3>借阅信息</h3>
                  <div className="borrow-form__record-details">
                    <div className="borrow-form__record-item">
                      <strong>图书：</strong>{borrowRecord.book?.title} - {borrowRecord.book?.author}
                    </div>
                    <div className="borrow-form__record-item">
                      <strong>当前到期日：</strong>{new Date(borrowRecord.dueDate).toLocaleDateString()}
                    </div>
                    <div className="borrow-form__record-item">
                      <strong>已续借次数：</strong>{borrowRecord.renewCount}/{borrowRecord.maxRenewals}
                    </div>
                  </div>
                </div>

                {/* 续借天数 */}
                <div className="form-group">
                  <label htmlFor="requestedDays" className="form-label required">
                    <Clock size={16} />
                    续借天数
                  </label>
                  <Controller
                    name="requestedDays"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        id="requestedDays"
                        type="number"
                        min="1"
                        max="90"
                        className="form-input"
                        placeholder="15"
                      />
                    )}
                  />
                  {errors.requestedDays && (
                    <span className="form-error">{(errors.requestedDays as any).message}</span>
                  )}
                </div>

                {/* 续借原因 */}
                <div className="form-group">
                  <label htmlFor="reason" className="form-label">
                    续借原因
                  </label>
                  <Controller
                    name="reason"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        id="reason"
                        rows={3}
                        className="form-textarea"
                        placeholder="可选的续借原因"
                      />
                    )}
                  />
                  {errors.reason && (
                    <span className="form-error">{(errors.reason as any).message}</span>
                  )}
                </div>
              </div>
            )}
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
                  处理中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  确认{type === 'borrow' ? '借阅' : type === 'return' ? '归还' : '续借'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};