import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Award,
  RefreshCw,
  Eye,
  ChevronRight
} from 'lucide-react';
import type { BookStats } from '../types/book';
import type { BorrowStats } from '../types/borrow';

interface LibraryStatsPanelProps {
  bookStats?: BookStats;
  borrowStats?: BorrowStats;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (type: 'books' | 'borrows' | 'users' | 'fines') => void;
  compact?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  onClick,
  loading = false,
}) => {
  return (
    <div 
      className={`stat-card stat-card--${color} ${onClick ? 'stat-card--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card__content">
        <div className="stat-card__header">
          <div className="stat-card__icon">
            {loading ? <RefreshCw size={20} className="animate-spin" /> : icon}
          </div>
          {trend && (
            <div className={`stat-card__trend stat-card__trend--${trend.direction}`}>
              {trend.direction === 'up' ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        
        <div className="stat-card__body">
          <div className="stat-card__value">
            {loading ? '...' : value}
          </div>
          <div className="stat-card__title">{title}</div>
        </div>
        
        {onClick && (
          <div className="stat-card__footer">
            <button className="stat-card__view-more">
              查看详情
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const LibraryStatsPanel: React.FC<LibraryStatsPanelProps> = ({
  bookStats,
  borrowStats,
  loading = false,
  error = null,
  onRefresh,
  onViewDetails,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'borrows' | 'users'>('overview');

  // 计算综合统计数据
  const overallStats = useMemo(() => {
    if (!bookStats || !borrowStats) return null;

    const borrowRate = bookStats.totalBooks > 0 
      ? ((bookStats.borrowedBooks / bookStats.totalBooks) * 100).toFixed(1)
      : '0';

    const overdueRate = borrowStats.activeBorrows > 0
      ? ((borrowStats.overdueBorrows / borrowStats.activeBorrows) * 100).toFixed(1)
      : '0';

    return {
      totalItems: bookStats.totalBooks,
      activeUsers: borrowStats.topBorrowers?.length || 0,
      borrowRate: parseFloat(borrowRate),
      overdueRate: parseFloat(overdueRate),
      totalRevenue: borrowStats.paidFines || 0,
    };
  }, [bookStats, borrowStats]);

  // 错误状态
  if (error) {
    return (
      <div className="library-stats-panel library-stats-panel--error">
        <div className="library-stats-panel__error">
          <AlertTriangle size={32} className="library-stats-panel__error-icon" />
          <h3 className="library-stats-panel__error-title">统计数据加载失败</h3>
          <p className="library-stats-panel__error-message">{error}</p>
          {onRefresh && (
            <button className="btn btn-primary btn-sm" onClick={onRefresh}>
              <RefreshCw size={16} />
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`library-stats-panel ${compact ? 'library-stats-panel--compact' : ''}`}>
      {/* 标题栏 */}
      <div className="library-stats-panel__header">
        <div className="library-stats-panel__title">
          <BarChart3 size={24} />
          <h2>图书馆统计</h2>
        </div>
        
        <div className="library-stats-panel__actions">
          {onRefresh && (
            <button 
              className="btn btn-icon btn-sm" 
              onClick={onRefresh}
              disabled={loading}
              title="刷新数据"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* 标签页导航 */}
      {!compact && (
        <div className="library-stats-panel__tabs">
          <button
            className={`library-stats-panel__tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} />
            总览
          </button>
          <button
            className={`library-stats-panel__tab ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            <BookOpen size={16} />
            图书
          </button>
          <button
            className={`library-stats-panel__tab ${activeTab === 'borrows' ? 'active' : ''}`}
            onClick={() => setActiveTab('borrows')}
          >
            <Clock size={16} />
            借阅
          </button>
          <button
            className={`library-stats-panel__tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            用户
          </button>
        </div>
      )}

      {/* 统计内容 */}
      <div className="library-stats-panel__content">
        {/* 总览标签页 */}
        {(compact || activeTab === 'overview') && (
          <div className="library-stats-panel__overview">
            <div className="library-stats-panel__stat-grid">
              <StatCard
                title="总藏书量"
                value={bookStats?.totalBooks || 0}
                icon={<BookOpen size={20} />}
                color="primary"
                onClick={() => onViewDetails?.('books')}
                loading={loading}
              />
              
              <StatCard
                title="可借图书"
                value={bookStats?.availableBooks || 0}
                icon={<BookOpen size={20} />}
                color="success"
                onClick={() => onViewDetails?.('books')}
                loading={loading}
              />
              
              <StatCard
                title="借阅中"
                value={borrowStats?.activeBorrows || 0}
                icon={<Clock size={20} />}
                color="info"
                onClick={() => onViewDetails?.('borrows')}
                loading={loading}
              />
              
              <StatCard
                title="逾期图书"
                value={borrowStats?.overdueBorrows || 0}
                icon={<AlertTriangle size={20} />}
                color="danger"
                onClick={() => onViewDetails?.('borrows')}
                loading={loading}
              />
              
              {!compact && (
                <>
                  <StatCard
                    title="今日借阅"
                    value={borrowStats?.borrowedToday || 0}
                    icon={<TrendingUp size={20} />}
                    color="success"
                    loading={loading}
                  />
                  
                  <StatCard
                    title="今日归还"
                    value={borrowStats?.returnedToday || 0}
                    icon={<TrendingDown size={20} />}
                    color="info"
                    loading={loading}
                  />
                  
                  <StatCard
                    title="未付罚金"
                    value={`¥${(borrowStats?.unpaidFines || 0).toFixed(2)}`}
                    icon={<DollarSign size={20} />}
                    color="warning"
                    onClick={() => onViewDetails?.('fines')}
                    loading={loading}
                  />
                  
                  <StatCard
                    title="活跃用户"
                    value={borrowStats?.topBorrowers?.length || 0}
                    icon={<Users size={20} />}
                    color="primary"
                    onClick={() => onViewDetails?.('users')}
                    loading={loading}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* 图书标签页 */}
        {!compact && activeTab === 'books' && bookStats && (
          <div className="library-stats-panel__books">
            <div className="library-stats-panel__section">
              <h3 className="library-stats-panel__section-title">
                <BookOpen size={18} />
                图书统计
              </h3>
              
              <div className="library-stats-panel__stat-grid">
                <StatCard
                  title="总藏书量"
                  value={bookStats.totalBooks}
                  icon={<BookOpen size={20} />}
                  color="primary"
                  loading={loading}
                />
                
                <StatCard
                  title="可借图书"
                  value={bookStats.availableBooks}
                  icon={<BookOpen size={20} />}
                  color="success"
                  loading={loading}
                />
                
                <StatCard
                  title="已借出"
                  value={bookStats.borrowedBooks}
                  icon={<Clock size={20} />}
                  color="warning"
                  loading={loading}
                />
                
                <StatCard
                  title="已预约"
                  value={bookStats.reservedBooks}
                  icon={<Calendar size={20} />}
                  color="info"
                  loading={loading}
                />
              </div>
            </div>

            {/* 热门图书 */}
            {bookStats.popularBooks && bookStats.popularBooks.length > 0 && (
              <div className="library-stats-panel__section">
                <h3 className="library-stats-panel__section-title">
                  <Star size={18} />
                  热门图书
                </h3>
                
                <div className="library-stats-panel__popular-books">
                  {bookStats.popularBooks.slice(0, 5).map((book, index) => (
                    <div key={book.id} className="library-stats-panel__popular-item">
                      <div className="library-stats-panel__popular-rank">
                        {index + 1}
                      </div>
                      <div className="library-stats-panel__popular-info">
                        <div className="library-stats-panel__popular-title">{book.title}</div>
                        <div className="library-stats-panel__popular-author">{book.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 借阅标签页 */}
        {!compact && activeTab === 'borrows' && borrowStats && (
          <div className="library-stats-panel__borrows">
            <div className="library-stats-panel__section">
              <h3 className="library-stats-panel__section-title">
                <Clock size={18} />
                借阅统计
              </h3>
              
              <div className="library-stats-panel__stat-grid">
                <StatCard
                  title="总借阅次数"
                  value={borrowStats.totalBorrows}
                  icon={<BookOpen size={20} />}
                  color="primary"
                  loading={loading}
                />
                
                <StatCard
                  title="当前借阅"
                  value={borrowStats.activeBorrows}
                  icon={<Clock size={20} />}
                  color="info"
                  loading={loading}
                />
                
                <StatCard
                  title="逾期图书"
                  value={borrowStats.overdueBorrows}
                  icon={<AlertTriangle size={20} />}
                  color="danger"
                  loading={loading}
                />
                
                <StatCard
                  title="平均借阅天数"
                  value={`${borrowStats.averageBorrowDays}天`}
                  icon={<Calendar size={20} />}
                  color="info"
                  loading={loading}
                />
              </div>
            </div>

            {/* 罚金统计 */}
            <div className="library-stats-panel__section">
              <h3 className="library-stats-panel__section-title">
                <DollarSign size={18} />
                罚金统计
              </h3>
              
              <div className="library-stats-panel__stat-grid">
                <StatCard
                  title="总罚金"
                  value={`¥${borrowStats.totalFines.toFixed(2)}`}
                  icon={<DollarSign size={20} />}
                  color="warning"
                  loading={loading}
                />
                
                <StatCard
                  title="已收取"
                  value={`¥${borrowStats.paidFines.toFixed(2)}`}
                  icon={<DollarSign size={20} />}
                  color="success"
                  loading={loading}
                />
                
                <StatCard
                  title="待收取"
                  value={`¥${borrowStats.unpaidFines.toFixed(2)}`}
                  icon={<DollarSign size={20} />}
                  color="danger"
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* 用户标签页 */}
        {!compact && activeTab === 'users' && borrowStats && (
          <div className="library-stats-panel__users">
            <div className="library-stats-panel__section">
              <h3 className="library-stats-panel__section-title">
                <Users size={18} />
                用户统计
              </h3>
              
              <div className="library-stats-panel__stat-grid">
                <StatCard
                  title="活跃用户"
                  value={borrowStats.topBorrowers?.length || 0}
                  icon={<Users size={20} />}
                  color="primary"
                  loading={loading}
                />
                
                <StatCard
                  title="今日借阅用户"
                  value={borrowStats.borrowedToday}
                  icon={<TrendingUp size={20} />}
                  color="success"
                  loading={loading}
                />
                
                <StatCard
                  title="今日归还用户"
                  value={borrowStats.returnedToday}
                  icon={<TrendingDown size={20} />}
                  color="info"
                  loading={loading}
                />
              </div>
            </div>

            {/* 活跃借阅者 */}
            {borrowStats.topBorrowers && borrowStats.topBorrowers.length > 0 && (
              <div className="library-stats-panel__section">
                <h3 className="library-stats-panel__section-title">
                  <Award size={18} />
                  活跃借阅者
                </h3>
                
                <div className="library-stats-panel__top-borrowers">
                  {borrowStats.topBorrowers.slice(0, 5).map((borrower, index) => (
                    <div key={borrower.userId} className="library-stats-panel__borrower-item">
                      <div className="library-stats-panel__borrower-rank">
                        {index + 1}
                      </div>
                      <div className="library-stats-panel__borrower-info">
                        <div className="library-stats-panel__borrower-name">{borrower.username}</div>
                        <div className="library-stats-panel__borrower-count">
                          借阅 {borrower.borrowCount} 次
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 最后更新时间 */}
      {!loading && (
        <div className="library-stats-panel__footer">
          <small className="library-stats-panel__last-updated">
            最后更新：{new Date().toLocaleString()}
          </small>
        </div>
      )}
    </div>
  );
};