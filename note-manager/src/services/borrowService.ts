// 借阅管理服务层
import { httpClient } from '../utils/httpClient';
import type {
  BorrowRecord,
  NewBorrowRecord,
  BorrowStats,
  BorrowFilter,
  BookReservation,
  RenewalRequest,
  ReturnProcess,
  FineRecord,
  UserBorrowSummary,
  BorrowRules,
  BorrowStatus,
  DEFAULT_BORROW_FILTER,
  DEFAULT_BORROW_RULES
} from '../types/borrow';

// API 端点配置
const BORROW_API_BASE = '/api/borrows';
const RESERVATION_API_BASE = '/api/reservations';
const FINES_API_BASE = '/api/fines';

export class BorrowService {
  
  // 获取借阅记录列表（带分页和过滤）
  static async getBorrowRecords(filter: BorrowFilter = DEFAULT_BORROW_FILTER, page = 1, limit = 20): Promise<{
    records: BorrowRecord[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
        ...(filter.searchTerm && { search: filter.searchTerm }),
        ...(filter.userId && { userId: filter.userId }),
        ...(filter.bookId && { bookId: filter.bookId }),
        ...(filter.overdueOnly && { overdueOnly: 'true' }),
        ...(filter.hasUnpaidFines && { hasUnpaidFines: 'true' }),
      });

      // 添加状态过滤
      if (filter.status.length > 0) {
        filter.status.forEach(status => {
          params.append('status', status);
        });
      }

      // 添加日期范围过滤
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start.toISOString());
        params.append('endDate', filter.dateRange.end.toISOString());
      }

      const response = await httpClient.get(`${BORROW_API_BASE}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch borrow records:', error);
      throw new Error('获取借阅记录失败');
    }
  }

  // 根据ID获取借阅记录详情
  static async getBorrowRecordById(id: string): Promise<BorrowRecord> {
    try {
      const response = await httpClient.get(`${BORROW_API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch borrow record ${id}:`, error);
      throw new Error('获取借阅记录详情失败');
    }
  }

  // 创建借阅记录
  static async createBorrowRecord(borrowData: NewBorrowRecord): Promise<BorrowRecord> {
    try {
      const response = await httpClient.post(BORROW_API_BASE, borrowData);
      return response.data;
    } catch (error) {
      console.error('Failed to create borrow record:', error);
      throw new Error('创建借阅记录失败');
    }
  }

  // 处理图书归还
  static async returnBook(returnData: ReturnProcess): Promise<BorrowRecord> {
    try {
      const response = await httpClient.post(`${BORROW_API_BASE}/${returnData.borrowRecordId}/return`, returnData);
      return response.data;
    } catch (error) {
      console.error('Failed to return book:', error);
      throw new Error('归还图书失败');
    }
  }

  // 续借图书
  static async renewBook(renewalData: RenewalRequest): Promise<BorrowRecord> {
    try {
      const response = await httpClient.post(`${BORROW_API_BASE}/${renewalData.borrowRecordId}/renew`, renewalData);
      return response.data;
    } catch (error) {
      console.error('Failed to renew book:', error);
      throw new Error('续借图书失败');
    }
  }

  // 获取借阅统计信息
  static async getBorrowStats(userId?: string): Promise<BorrowStats> {
    try {
      const params = userId ? `?userId=${userId}` : '';
      const response = await httpClient.get(`${BORROW_API_BASE}/stats${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get borrow stats:', error);
      throw new Error('获取借阅统计失败');
    }
  }

  // 获取用户借阅摘要
  static async getUserBorrowSummary(userId: string): Promise<UserBorrowSummary> {
    try {
      const response = await httpClient.get(`${BORROW_API_BASE}/users/${userId}/summary`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user borrow summary for ${userId}:`, error);
      throw new Error('获取用户借阅摘要失败');
    }
  }

  // 获取逾期借阅记录
  static async getOverdueRecords(page = 1, limit = 20): Promise<{
    records: BorrowRecord[];
    total: number;
    totalPages: number;
  }> {
    try {
      const response = await httpClient.get(`${BORROW_API_BASE}/overdue?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get overdue records:', error);
      throw new Error('获取逾期记录失败');
    }
  }

  // 批量处理逾期通知
  static async sendOverdueNotifications(borrowRecordIds: string[]): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await httpClient.post(`${BORROW_API_BASE}/overdue/notify`, { borrowRecordIds });
      return response.data;
    } catch (error) {
      console.error('Failed to send overdue notifications:', error);
      throw new Error('发送逾期通知失败');
    }
  }
}

export class ReservationService {
  
  // 创建图书预约
  static async createReservation(bookId: string, userId: string): Promise<BookReservation> {
    try {
      const response = await httpClient.post(RESERVATION_API_BASE, { bookId, userId });
      return response.data;
    } catch (error) {
      console.error('Failed to create reservation:', error);
      throw new Error('创建预约失败');
    }
  }

  // 取消预约
  static async cancelReservation(reservationId: string): Promise<void> {
    try {
      await httpClient.delete(`${RESERVATION_API_BASE}/${reservationId}`);
    } catch (error) {
      console.error(`Failed to cancel reservation ${reservationId}:`, error);
      throw new Error('取消预约失败');
    }
  }

  // 获取用户的预约列表
  static async getUserReservations(userId: string): Promise<BookReservation[]> {
    try {
      const response = await httpClient.get(`${RESERVATION_API_BASE}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user reservations for ${userId}:`, error);
      throw new Error('获取用户预约失败');
    }
  }

  // 获取图书的预约队列
  static async getBookReservations(bookId: string): Promise<BookReservation[]> {
    try {
      const response = await httpClient.get(`${RESERVATION_API_BASE}/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get book reservations for ${bookId}:`, error);
      throw new Error('获取图书预约队列失败');
    }
  }

  // 处理预约就绪通知
  static async processReadyReservations(): Promise<{
    processed: number;
    notifications: number;
  }> {
    try {
      const response = await httpClient.post(`${RESERVATION_API_BASE}/process-ready`);
      return response.data;
    } catch (error) {
      console.error('Failed to process ready reservations:', error);
      throw new Error('处理预约通知失败');
    }
  }
}

export class FineService {
  
  // 获取罚金记录
  static async getFineRecords(userId?: string, isPaid?: boolean, page = 1, limit = 20): Promise<{
    records: FineRecord[];
    total: number;
    totalPages: number;
    totalAmount: number;
    unpaidAmount: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(userId && { userId }),
        ...(isPaid !== undefined && { isPaid: isPaid.toString() }),
      });

      const response = await httpClient.get(`${FINES_API_BASE}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch fine records:', error);
      throw new Error('获取罚金记录失败');
    }
  }

  // 支付罚金
  static async payFine(fineId: string, amount: number, paymentMethod: string): Promise<FineRecord> {
    try {
      const response = await httpClient.post(`${FINES_API_BASE}/${fineId}/pay`, {
        amount,
        paymentMethod,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to pay fine ${fineId}:`, error);
      throw new Error('支付罚金失败');
    }
  }

  // 批量支付罚金
  static async payMultipleFines(fineIds: string[], paymentMethod: string): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
    totalPaid: number;
  }> {
    try {
      const response = await httpClient.post(`${FINES_API_BASE}/batch-pay`, {
        fineIds,
        paymentMethod,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to pay multiple fines:', error);
      throw new Error('批量支付罚金失败');
    }
  }

  // 计算逾期罚金
  static async calculateOverdueFine(borrowRecordId: string): Promise<{
    fineAmount: number;
    overdueDays: number;
    dailyRate: number;
  }> {
    try {
      const response = await httpClient.get(`${FINES_API_BASE}/calculate/${borrowRecordId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to calculate fine for ${borrowRecordId}:`, error);
      throw new Error('计算罚金失败');
    }
  }
}

export class BorrowRulesService {
  
  // 获取借阅规则
  static async getBorrowRules(): Promise<BorrowRules> {
    try {
      const response = await httpClient.get('/api/system/borrow-rules');
      return response.data;
    } catch (error) {
      console.error('Failed to get borrow rules:', error);
      return DEFAULT_BORROW_RULES;
    }
  }

  // 更新借阅规则
  static async updateBorrowRules(rules: Partial<BorrowRules>): Promise<BorrowRules> {
    try {
      const response = await httpClient.put('/api/system/borrow-rules', rules);
      return response.data;
    } catch (error) {
      console.error('Failed to update borrow rules:', error);
      throw new Error('更新借阅规则失败');
    }
  }

  // 检查用户是否可以借阅
  static async checkBorrowEligibility(userId: string, bookId: string): Promise<{
    canBorrow: boolean;
    reason?: string;
    suggestions?: string[];
  }> {
    try {
      const response = await httpClient.get(`/api/system/check-eligibility?userId=${userId}&bookId=${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to check borrow eligibility:', error);
      throw new Error('检查借阅资格失败');
    }
  }
}

// 模拟数据服务（用于开发测试）
export const mockBorrowService = {
  borrowRecords: [
    {
      id: '1',
      bookId: '1',
      userId: 'user-1',
      borrowDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-31'),
      returnDate: undefined,
      status: 'ACTIVE' as BorrowStatus,
      renewCount: 0,
      maxRenewals: 2,
      fine: 0,
      librarian: 'admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      book: {
        title: '深入理解计算机系统',
        author: 'Randal E. Bryant',
        isbn: '9787111321312',
      },
      user: {
        username: '张三',
        email: 'zhang@example.com',
      },
    },
    {
      id: '2',
      bookId: '2',
      userId: 'user-2',
      borrowDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-14'),
      returnDate: new Date('2024-02-10'),
      status: 'RETURNED' as BorrowStatus,
      renewCount: 0,
      maxRenewals: 2,
      fine: 0,
      librarian: 'admin',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-10'),
      book: {
        title: '人类简史',
        author: '尤瓦尔·赫拉利',
        isbn: '9787508660752',
      },
      user: {
        username: '李四',
        email: 'li@example.com',
      },
    }
  ] as BorrowRecord[],

  async getBorrowRecords(filter = DEFAULT_BORROW_FILTER, page = 1, limit = 20) {
    let filteredRecords = this.borrowRecords;

    // 简单过滤逻辑
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filteredRecords = filteredRecords.filter(record =>
        record.book?.title.toLowerCase().includes(searchTerm) ||
        record.user?.username.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.status.length > 0) {
      filteredRecords = filteredRecords.filter(record =>
        filter.status.includes(record.status)
      );
    }

    if (filter.overdueOnly) {
      const now = new Date();
      filteredRecords = filteredRecords.filter(record =>
        record.status === 'ACTIVE' && record.dueDate < now
      );
    }

    // 排序
    filteredRecords.sort((a, b) => {
      const aValue = a[filter.sortBy as keyof BorrowRecord];
      const bValue = b[filter.sortBy as keyof BorrowRecord];
      
      if (filter.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    return {
      records: paginatedRecords,
      total: filteredRecords.length,
      totalPages: Math.ceil(filteredRecords.length / limit),
      currentPage: page,
    };
  },

  async getBorrowStats(): Promise<BorrowStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      totalBorrows: this.borrowRecords.length,
      activeBorrows: this.borrowRecords.filter(r => r.status === 'ACTIVE').length,
      overdueBorrows: this.borrowRecords.filter(r => 
        r.status === 'ACTIVE' && r.dueDate < now
      ).length,
      returnedToday: this.borrowRecords.filter(r => 
        r.returnDate && r.returnDate >= today
      ).length,
      borrowedToday: this.borrowRecords.filter(r => 
        r.borrowDate >= today
      ).length,
      totalFines: 0,
      paidFines: 0,
      unpaidFines: 0,
      averageBorrowDays: 15,
      topBorrowers: [],
      popularBooks: [],
    };
  }
};