import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  User, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RotateCcw,
  DollarSign,
  Eye,
  Edit,
  RefreshCw,
  Filter,
  Download,
  Mail,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import type { BorrowRecord, BorrowFilter } from '../types/borrow';
import { BORROW_STATUS_LABELS, BORROW_STATUS_COLORS } from '../types/borrow';

interface BorrowListProps {
  records: BorrowRecord[];
  loading?: boolean;
  error?: string | null;
  filter?: BorrowFilter;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  showActions?: boolean;
  canManage?: boolean;
  onViewRecord?: (record: BorrowRecord) => void;
  onReturnBook?: (record: BorrowRecord) => void;
  onRenewBook?: (record: BorrowRecord) => void;
  onPayFine?: (record: BorrowRecord) => void;
  onSendReminder?: (record: BorrowRecord) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onExportRecords?: () => void;
  onRetry?: () => void;
}

export const BorrowList: React.FC<BorrowListProps> = ({
  records,
  loading = false,
  error = null,
  filter,
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  showActions = true,
  canManage = false,
  onViewRecord,
  onReturnBook,
  onRenewBook,
  onPayFine,
  onSendReminder,
  onPageChange,
  onPageSizeChange,
  onExportRecords,
  onRetry,
}) => {
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // 批量选择相关方法
  const handleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map(record => record.id)));
    }
  };

  const handleSelectRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  // 计算统计信息
  const stats = useMemo(() => {
    return {
      total: records.length,
      active: records.filter(r => r.status === 'ACTIVE').length,
      overdue: records.filter(r => {
        const now = new Date();
        return r.status === 'ACTIVE' && new Date(r.dueDate) < now;
      }).length,
      returned: records.filter(r => r.status === 'RETURNED').length,
      totalFines: records.reduce((sum, r) => sum + (r.fine || 0), 0),
    };
  }, [records]);

  // 获取状态图标
  const getStatusIcon = (status: BorrowRecord['status']) => {
    const iconSize = 16;
    const color = BORROW_STATUS_COLORS[status];
    
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle size={iconSize} style={{ color }} />;
      case 'RETURNED':
        return <CheckCircle size={iconSize} style={{ color }} />;
      case 'OVERDUE':
        return <AlertTriangle size={iconSize} style={{ color }} />;
      case 'RENEWED':
        return <RotateCcw size={iconSize} style={{ color }} />;
      case 'LOST':
        return <AlertTriangle size={iconSize} style={{ color }} />;
      default:
        return null;
    }
  };

  // 判断是否逾期
  const isOverdue = (record: BorrowRecord) => {
    const now = new Date();
    return record.status === 'ACTIVE' && new Date(record.dueDate) < now;
  };

  // 计算逾期天数
  const getOverdueDays = (record: BorrowRecord) => {
    if (!isOverdue(record)) return 0;
    const now = new Date();
    const dueDate = new Date(record.dueDate);
    return Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // 分页导航
  const paginationInfo = useMemo(() => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);
    return { startItem, endItem };
  }, [currentPage, pageSize, totalCount]);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index);
  };

  // 错误状态
  if (error && !loading) {
    return (
      <div className="borrow-list__error">
        <div className="borrow-list__error-content">
          <AlertTriangle size={48} className="borrow-list__error-icon" />
          <h3 className="borrow-list__error-title">加载失败</h3>
          <p className="borrow-list__error-message">{error}</p>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              <RefreshCw size={16} />
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  // 空状态
  if (!loading && records.length === 0) {
    return (
      <div className="borrow-list__empty">
        <div className="borrow-list__empty-content">
          <BookOpen size={48} className="borrow-list__empty-icon" />
          <h3 className="borrow-list__empty-title">
            {filter?.searchTerm || filter?.status.length || filter?.overdueOnly
              ? '未找到符合条件的借阅记录'
              : '暂无借阅记录'}
          </h3>
          <p className="borrow-list__empty-message">
            {filter?.searchTerm || filter?.status.length || filter?.overdueOnly
              ? '请尝试调整搜索条件或筛选器'
              : '还没有任何借阅记录'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="borrow-list">
      {/* 工具栏 */}
      <div className="borrow-list__toolbar">
        <div className="borrow-list__toolbar-left">
          {/* 批量操作 */}
          {selectedRecords.size > 0 && canManage && (
            <div className="borrow-list__batch-actions">
              <span className="borrow-list__selected-count">
                已选择 {selectedRecords.size} 项
              </span>
              <button className="btn btn-sm btn-outline">
                <Mail size={16} />
                发送提醒
              </button>
              <button className="btn btn-sm btn-outline">
                <Download size={16} />
                导出
              </button>
            </div>
          )}
          
          {/* 统计信息 */}
          {!loading && (
            <div className="borrow-list__stats">
              <div className="borrow-list__stat-item">
                <span className="borrow-list__stat-label">总计:</span>
                <span className="borrow-list__stat-value">{stats.total}</span>
              </div>
              <div className="borrow-list__stat-item">
                <span className="borrow-list__stat-label">借阅中:</span>
                <span className="borrow-list__stat-value">{stats.active}</span>
              </div>
              <div className="borrow-list__stat-item">
                <span className="borrow-list__stat-label">逾期:</span>
                <span className="borrow-list__stat-value borrow-list__stat-value--danger">{stats.overdue}</span>
              </div>
              {stats.totalFines > 0 && (
                <div className="borrow-list__stat-item">
                  <span className="borrow-list__stat-label">罚金:</span>
                  <span className="borrow-list__stat-value">¥{stats.totalFines.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* 结果信息 */}
          {!loading && (
            <div className="borrow-list__result-info">
              显示第 {paginationInfo.startItem}-{paginationInfo.endItem} 项，共 {totalCount} 项
            </div>
          )}
        </div>

        <div className="borrow-list__toolbar-right">
          {/* 每页显示数量 */}
          {onPageSizeChange && (
            <div className="borrow-list__page-size">
              <label htmlFor="page-size-select">每页显示：</label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="borrow-list__page-size-select"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}

          {/* 导出按钮 */}
          {onExportRecords && (
            <button className="btn btn-outline btn-sm" onClick={onExportRecords}>
              <Download size={16} />
              导出
            </button>
          )}
        </div>
      </div>

      {/* 批量选择工具栏 */}
      {showActions && records.length > 0 && (
        <div className="borrow-list__select-toolbar">
          <label className="borrow-list__select-all">
            <input
              type="checkbox"
              checked={selectedRecords.size === records.length && records.length > 0}
              onChange={handleSelectAll}
              className="borrow-list__select-all-checkbox"
            />
            全选
          </label>
        </div>
      )}

      {/* 借阅记录表格 */}
      <div className="borrow-list__table-container">
        <table className="borrow-list__table">
          <thead>
            <tr>
              {showActions && (
                <th className="borrow-list__th borrow-list__th--checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRecords.size === records.length && records.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              <th className="borrow-list__th">图书信息</th>
              <th className="borrow-list__th">借阅者</th>
              <th className="borrow-list__th">借阅时间</th>
              <th className="borrow-list__th">应还时间</th>
              <th className="borrow-list__th">状态</th>
              <th className="borrow-list__th">罚金</th>
              {showActions && <th className="borrow-list__th">操作</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // 加载骨架屏
              Array.from({ length: pageSize }, (_, index) => (
                <tr key={index} className="borrow-list__row borrow-list__row--skeleton">
                  {showActions && <td className="borrow-list__td"><div className="skeleton skeleton--checkbox"></div></td>}
                  <td className="borrow-list__td"><div className="skeleton skeleton--book-info"></div></td>
                  <td className="borrow-list__td"><div className="skeleton skeleton--user"></div></td>
                  <td className="borrow-list__td"><div className="skeleton skeleton--date"></div></td>
                  <td className="borrow-list__td"><div className="skeleton skeleton--date"></div></td>
                  <td className="borrow-list__td"><div className="skeleton skeleton--status"></div></td>
                  <td className="borrow-list__td"><div className="skeleton skeleton--fine"></div></td>
                  {showActions && <td className="borrow-list__td"><div className="skeleton skeleton--actions"></div></td>}
                </tr>
              ))
            ) : (
              records.map((record) => {
                const overduedays = getOverdueDays(record);
                const isExpanded = expandedRecord === record.id;
                
                return (
                  <React.Fragment key={record.id}>
                    <tr 
                      className={`borrow-list__row ${isOverdue(record) ? 'borrow-list__row--overdue' : ''}`}
                    >
                      {showActions && (
                        <td className="borrow-list__td">
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.id)}
                            onChange={() => handleSelectRecord(record.id)}
                          />
                        </td>
                      )}
                      
                      <td className="borrow-list__td borrow-list__td--book">
                        <div className="borrow-list__book-info">
                          <div className="borrow-list__book-title">{record.book?.title}</div>
                          <div className="borrow-list__book-author">{record.book?.author}</div>
                          {record.book?.isbn && (
                            <div className="borrow-list__book-isbn">ISBN: {record.book.isbn}</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="borrow-list__td borrow-list__td--user">
                        <div className="borrow-list__user-info">
                          <div className="borrow-list__user-name">{record.user?.username}</div>
                          <div className="borrow-list__user-email">{record.user?.email}</div>
                        </div>
                      </td>
                      
                      <td className="borrow-list__td borrow-list__td--date">
                        <div className="borrow-list__date-info">
                          <Calendar size={14} />
                          <span>{new Date(record.borrowDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      
                      <td className="borrow-list__td borrow-list__td--date">
                        <div className="borrow-list__date-info">
                          <Clock size={14} />
                          <span>{new Date(record.dueDate).toLocaleDateString()}</span>
                          {overduedays > 0 && (
                            <span className="borrow-list__overdue-days">
                              (逾期 {overduedays} 天)
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="borrow-list__td borrow-list__td--status">
                        <div className="borrow-list__status">
                          {getStatusIcon(record.status)}
                          <span 
                            className="borrow-list__status-label"
                            style={{ color: BORROW_STATUS_COLORS[record.status] }}
                          >
                            {BORROW_STATUS_LABELS[record.status]}
                          </span>
                        </div>
                        {record.renewCount > 0 && (
                          <div className="borrow-list__renew-info">
                            已续借 {record.renewCount} 次
                          </div>
                        )}
                      </td>
                      
                      <td className="borrow-list__td borrow-list__td--fine">
                        {record.fine > 0 ? (
                          <div className="borrow-list__fine-info">
                            <DollarSign size={14} />
                            <span>¥{record.fine.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="borrow-list__no-fine">无</span>
                        )}
                      </td>
                      
                      {showActions && (
                        <td className="borrow-list__td borrow-list__td--actions">
                          <div className="borrow-list__actions">
                            <button
                              className="btn btn-icon btn-sm"
                              onClick={() => onViewRecord?.(record)}
                              title="查看详情"
                            >
                              <Eye size={14} />
                            </button>
                            
                            {record.status === 'ACTIVE' && canManage && (
                              <>
                                <button
                                  className="btn btn-icon btn-sm"
                                  onClick={() => onReturnBook?.(record)}
                                  title="归还图书"
                                >
                                  <RotateCcw size={14} />
                                </button>
                                
                                {record.renewCount < record.maxRenewals && (
                                  <button
                                    className="btn btn-icon btn-sm"
                                    onClick={() => onRenewBook?.(record)}
                                    title="续借"
                                  >
                                    <Clock size={14} />
                                  </button>
                                )}
                                
                                <button
                                  className="btn btn-icon btn-sm"
                                  onClick={() => onSendReminder?.(record)}
                                  title="发送提醒"
                                >
                                  <Mail size={14} />
                                </button>
                              </>
                            )}
                            
                            {record.fine > 0 && (
                              <button
                                className="btn btn-icon btn-sm"
                                onClick={() => onPayFine?.(record)}
                                title="支付罚金"
                              >
                                <DollarSign size={14} />
                              </button>
                            )}
                            
                            <button
                              className="btn btn-icon btn-sm"
                              onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                              title={isExpanded ? '收起详情' : '展开详情'}
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    
                    {/* 展开的详细信息 */}
                    {isExpanded && (
                      <tr className="borrow-list__expanded-row">
                        <td colSpan={showActions ? 8 : 7} className="borrow-list__expanded-cell">
                          <div className="borrow-list__expanded-content">
                            <div className="borrow-list__expanded-section">
                              <h4>详细信息</h4>
                              <div className="borrow-list__expanded-details">
                                <div className="borrow-list__expanded-item">
                                  <strong>借阅ID:</strong> {record.id}
                                </div>
                                {record.notes && (
                                  <div className="borrow-list__expanded-item">
                                    <strong>备注:</strong> {record.notes}
                                  </div>
                                )}
                                <div className="borrow-list__expanded-item">
                                  <strong>创建时间:</strong> {new Date(record.createdAt).toLocaleString()}
                                </div>
                                <div className="borrow-list__expanded-item">
                                  <strong>更新时间:</strong> {new Date(record.updatedAt).toLocaleString()}
                                </div>
                                {record.returnDate && (
                                  <div className="borrow-list__expanded-item">
                                    <strong>归还时间:</strong> {new Date(record.returnDate).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分页器 */}
      {!loading && totalPages > 1 && onPageChange && (
        <div className="borrow-list__pagination">
          <div className="borrow-list__pagination-info">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          
          <div className="borrow-list__pagination-controls">
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              title="上一页"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="borrow-list__pagination-pages">
              {getVisiblePages().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="borrow-list__pagination-ellipsis">
                      <MoreHorizontal size={16} />
                    </span>
                  ) : (
                    <button
                      className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => onPageChange(page as number)}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              title="下一页"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};