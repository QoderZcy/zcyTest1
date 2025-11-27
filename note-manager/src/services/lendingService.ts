// Lending Service - Handles all lending transaction operations

import { 
  LendingTransaction,
  CheckoutRequest,
  ReturnRequest,
  RenewalRequest,
  CheckoutResult,
  ReturnResult,
  RenewalResult,
  TransactionStatus,
  OverdueReport,
  ApiResponse,
  PaginatedResponse,
  ApiError
} from '../types/library';
import { httpClient } from '../utils/httpClient';

class LendingService {
  private readonly baseUrl = '/api/lending';

  /**
   * Process book checkout
   */
  async processCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    try {
      const response = await httpClient.post<ApiResponse<CheckoutResult>>(
        `${this.baseUrl}/checkout`,
        request
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process checkout');
    }
  }

  /**
   * Process book return
   */
  async processReturn(request: ReturnRequest): Promise<ReturnResult> {
    try {
      const response = await httpClient.post<ApiResponse<ReturnResult>>(
        `${this.baseUrl}/return`,
        request
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process return');
    }
  }

  /**
   * Process book renewal
   */
  async processRenewal(request: RenewalRequest): Promise<RenewalResult> {
    try {
      const response = await httpClient.post<ApiResponse<RenewalResult>>(
        `${this.baseUrl}/renew`,
        request
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process renewal');
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<LendingTransaction> {
    try {
      const response = await httpClient.get<ApiResponse<LendingTransaction>>(
        `${this.baseUrl}/transactions/${id}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get transaction: ${id}`);
    }
  }

  /**
   * Get all transactions with filtering and pagination
   */
  async getTransactions(options: {
    page?: number;
    pageSize?: number;
    status?: TransactionStatus;
    memberId?: string;
    bookId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<LendingTransaction>> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        pageSize: (options.pageSize || 20).toString(),
        ...(options.status && { status: options.status }),
        ...(options.memberId && { memberId: options.memberId }),
        ...(options.bookId && { bookId: options.bookId }),
        ...(options.dateFrom && { dateFrom: options.dateFrom.toISOString() }),
        ...(options.dateTo && { dateTo: options.dateTo.toISOString() }),
        ...(options.sortBy && { sortBy: options.sortBy }),
        ...(options.sortOrder && { sortOrder: options.sortOrder })
      });

      const response = await httpClient.get<PaginatedResponse<LendingTransaction>>(
        `${this.baseUrl}/transactions?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get transactions');
    }
  }

  /**
   * Get active transactions for a member
   */
  async getMemberActiveTransactions(memberId: string): Promise<LendingTransaction[]> {
    try {
      const response = await httpClient.get<ApiResponse<LendingTransaction[]>>(
        `${this.baseUrl}/members/${memberId}/active`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get active transactions for member: ${memberId}`);
    }
  }

  /**
   * Get transaction history for a member
   */
  async getMemberTransactionHistory(
    memberId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: TransactionStatus;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<LendingTransaction>> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        pageSize: (options.pageSize || 20).toString(),
        ...(options.status && { status: options.status }),
        ...(options.sortBy && { sortBy: options.sortBy }),
        ...(options.sortOrder && { sortOrder: options.sortOrder })
      });

      const response = await httpClient.get<PaginatedResponse<LendingTransaction>>(
        `${this.baseUrl}/members/${memberId}/history?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get transaction history for member: ${memberId}`);
    }
  }

  /**
   * Get overdue transactions report
   */
  async getOverdueReport(): Promise<OverdueReport> {
    try {
      const response = await httpClient.get<ApiResponse<OverdueReport>>(
        `${this.baseUrl}/overdue`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get overdue report');
    }
  }

  /**
   * Calculate due date for a checkout
   */
  async calculateDueDate(memberId: string, bookId: string): Promise<{
    dueDate: Date;
    loanDuration: number;
    membershipType: string;
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        dueDate: Date;
        loanDuration: number;
        membershipType: string;
      }>>(
        `${this.baseUrl}/calculate-due-date`,
        { memberId, bookId }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to calculate due date');
    }
  }

  /**
   * Calculate fine amount for a transaction
   */
  async calculateFine(transactionId: string): Promise<{
    fineAmount: number;
    daysOverdue: number;
    finePerDay: number;
    maxFine?: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        fineAmount: number;
        daysOverdue: number;
        finePerDay: number;
        maxFine?: number;
      }>>(`${this.baseUrl}/transactions/${transactionId}/calculate-fine`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to calculate fine for transaction: ${transactionId}`);
    }
  }

  /**
   * Mark book as lost
   */
  async markBookAsLost(
    transactionId: string,
    notes?: string
  ): Promise<LendingTransaction> {
    try {
      const response = await httpClient.patch<ApiResponse<LendingTransaction>>(
        `${this.baseUrl}/transactions/${transactionId}/mark-lost`,
        { notes }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to mark book as lost: ${transactionId}`);
    }
  }

  /**
   * Send overdue reminders
   */
  async sendOverdueReminders(
    transactionIds?: string[]
  ): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        sent: number;
        failed: number;
        errors: string[];
      }>>(
        `${this.baseUrl}/send-reminders`,
        { transactionIds }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to send overdue reminders');
    }
  }

  /**
   * Get circulation statistics
   */
  async getCirculationStats(options: {
    dateFrom?: Date;
    dateTo?: Date;
    granularity?: 'day' | 'week' | 'month';
  } = {}): Promise<{
    totalCheckouts: number;
    totalReturns: number;
    totalRenewals: number;
    averageLoanDuration: number;
    popularBooks: Array<{
      bookId: string;
      title: string;
      checkoutCount: number;
    }>;
    circulationTrend: Array<{
      date: string;
      checkouts: number;
      returns: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams({
        ...(options.dateFrom && { dateFrom: options.dateFrom.toISOString() }),
        ...(options.dateTo && { dateTo: options.dateTo.toISOString() }),
        ...(options.granularity && { granularity: options.granularity })
      });

      const response = await httpClient.get<ApiResponse<{
        totalCheckouts: number;
        totalReturns: number;
        totalRenewals: number;
        averageLoanDuration: number;
        popularBooks: Array<{
          bookId: string;
          title: string;
          checkoutCount: number;
        }>;
        circulationTrend: Array<{
          date: string;
          checkouts: number;
          returns: number;
        }>;
      }>>(`${this.baseUrl}/stats?${params.toString()}`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get circulation statistics');
    }
  }

  /**
   * Check if member can borrow a book
   */
  async canMemberBorrow(memberId: string, bookId: string): Promise<{
    canBorrow: boolean;
    reasons: string[];
    suggestions: string[];
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        canBorrow: boolean;
        reasons: string[];
        suggestions: string[];
      }>>(
        `${this.baseUrl}/can-borrow`,
        { memberId, bookId }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to check borrowing eligibility');
    }
  }

  /**
   * Check if transaction can be renewed
   */
  async canRenewTransaction(transactionId: string): Promise<{
    canRenew: boolean;
    reasons: string[];
    maxRenewals: number;
    currentRenewals: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        canRenew: boolean;
        reasons: string[];
        maxRenewals: number;
        currentRenewals: number;
      }>>(`${this.baseUrl}/transactions/${transactionId}/can-renew`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to check renewal eligibility: ${transactionId}`);
    }
  }

  /**
   * Bulk process returns
   */
  async bulkReturn(transactionIds: string[]): Promise<{
    processed: number;
    failed: number;
    errors: Array<{
      transactionId: string;
      error: string;
    }>;
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        processed: number;
        failed: number;
        errors: Array<{
          transactionId: string;
          error: string;
        }>;
      }>>(
        `${this.baseUrl}/bulk-return`,
        { transactionIds }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process bulk returns');
    }
  }

  /**
   * Export transaction data
   */
  async exportTransactions(
    options: {
      status?: TransactionStatus;
      dateFrom?: Date;
      dateTo?: Date;
      format: 'csv' | 'json' | 'pdf';
    }
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format: options.format,
        ...(options.status && { status: options.status }),
        ...(options.dateFrom && { dateFrom: options.dateFrom.toISOString() }),
        ...(options.dateTo && { dateTo: options.dateTo.toISOString() })
      });

      const response = await httpClient.get(
        `${this.baseUrl}/export?${params.toString()}`,
        {
          responseType: 'blob'
        }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to export transactions');
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: any, defaultMessage: string): ApiError {
    console.error('LendingService Error:', error);
    
    if (error.response?.data?.message) {
      return {
        code: error.response.data.code || 'LENDING_SERVICE_ERROR',
        message: error.response.data.message,
        details: error.response.data.details,
        statusCode: error.response.status
      };
    }
    
    return {
      code: 'LENDING_SERVICE_ERROR',
      message: defaultMessage,
      statusCode: 500
    };
  }
}

export default new LendingService();