// Library Service - Handles library-wide operations and statistics

import { 
  Library,
  LibraryStats,
  LibraryPolicies,
  OperationalHours,
  NotificationData,
  ApiResponse,
  ApiError
} from '../types/library';
import { Reservation } from '../types/reservation';
import { httpClient } from '../utils/httpClient';

class LibraryService {
  private readonly baseUrl = '/api/library';

  /**
   * Get library information
   */
  async getLibraryInfo(libraryId?: string): Promise<Library> {
    try {
      const url = libraryId 
        ? `${this.baseUrl}/${libraryId}` 
        : `${this.baseUrl}/current`;
        
      const response = await httpClient.get<ApiResponse<Library>>(url);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get library information');
    }
  }

  /**
   * Update library information
   */
  async updateLibraryInfo(
    libraryId: string, 
    updates: Partial<Library>
  ): Promise<Library> {
    try {
      const response = await httpClient.put<ApiResponse<Library>>(
        `${this.baseUrl}/${libraryId}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update library information');
    }
  }

  /**
   * Get library statistics and dashboard data
   */
  async getLibraryStats(libraryId?: string): Promise<LibraryStats> {
    try {
      const url = libraryId 
        ? `${this.baseUrl}/${libraryId}/stats` 
        : `${this.baseUrl}/stats`;
        
      const response = await httpClient.get<ApiResponse<LibraryStats>>(url);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get library statistics');
    }
  }

  /**
   * Get library policies
   */
  async getLibraryPolicies(libraryId?: string): Promise<LibraryPolicies> {
    try {
      const url = libraryId 
        ? `${this.baseUrl}/${libraryId}/policies` 
        : `${this.baseUrl}/policies`;
        
      const response = await httpClient.get<ApiResponse<LibraryPolicies>>(url);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get library policies');
    }
  }

  /**
   * Update library policies
   */
  async updateLibraryPolicies(
    policies: Partial<LibraryPolicies>,
    libraryId?: string
  ): Promise<LibraryPolicies> {
    try {
      const url = libraryId 
        ? `${this.baseUrl}/${libraryId}/policies` 
        : `${this.baseUrl}/policies`;
        
      const response = await httpClient.put<ApiResponse<LibraryPolicies>>(
        url,
        policies
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update library policies');
    }
  }

  /**
   * Get operational hours
   */
  async getOperationalHours(libraryId?: string): Promise<OperationalHours> {
    try {
      const url = libraryId 
        ? `${this.baseUrl}/${libraryId}/hours` 
        : `${this.baseUrl}/hours`;
        
      const response = await httpClient.get<ApiResponse<OperationalHours>>(url);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get operational hours');
    }
  }

  /**
   * Update operational hours
   */
  async updateOperationalHours(
    hours: OperationalHours,
    libraryId?: string
  ): Promise<OperationalHours> {
    try {
      const url = libraryId 
        ? `${this.baseUrl}/${libraryId}/hours` 
        : `${this.baseUrl}/hours`;
        
      const response = await httpClient.put<ApiResponse<OperationalHours>>(
        url,
        hours
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update operational hours');
    }
  }

  /**
   * Check if library is currently open
   */
  async isLibraryOpen(libraryId?: string): Promise<{
    isOpen: boolean;
    nextOpenTime?: Date;
    nextCloseTime?: Date;
    todayHours?: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  }> {
    try {
      const url = libraryId 
        ? `${this.baseUrl}/${libraryId}/is-open` 
        : `${this.baseUrl}/is-open`;
        
      const response = await httpClient.get<ApiResponse<{
        isOpen: boolean;
        nextOpenTime?: Date;
        nextCloseTime?: Date;
        todayHours?: {
          open: string;
          close: string;
          isClosed: boolean;
        };
      }>>(url);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to check library status');
    }
  }

  /**
   * Get system announcements
   */
  async getAnnouncements(
    options: {
      active?: boolean;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      limit?: number;
    } = {}
  ): Promise<Array<{
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    createdBy: string;
  }>> {
    try {
      const params = new URLSearchParams({
        ...(options.active !== undefined && { active: options.active.toString() }),
        ...(options.priority && { priority: options.priority }),
        ...(options.limit && { limit: options.limit.toString() })
      });

      const response = await httpClient.get<ApiResponse<Array<{
        id: string;
        title: string;
        message: string;
        priority: 'low' | 'normal' | 'high' | 'urgent';
        startDate: Date;
        endDate?: Date;
        isActive: boolean;
        createdBy: string;
      }>>>(`${this.baseUrl}/announcements?${params.toString()}`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get announcements');
    }
  }

  /**
   * Create system announcement
   */
  async createAnnouncement(announcement: {
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    startDate: Date;
    endDate?: Date;
    targetAudience?: ('members' | 'staff' | 'all')[];
  }): Promise<{
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    createdBy: string;
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        id: string;
        title: string;
        message: string;
        priority: 'low' | 'normal' | 'high' | 'urgent';
        startDate: Date;
        endDate?: Date;
        isActive: boolean;
        createdBy: string;
      }>>(
        `${this.baseUrl}/announcements`,
        announcement
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create announcement');
    }
  }

  /**
   * Send bulk notification
   */
  async sendBulkNotification(notification: {
    title: string;
    message: string;
    type: string;
    targetAudience: {
      memberTypes?: string[];
      memberIds?: string[];
      staffRoles?: string[];
      all?: boolean;
    };
    channels: ('email' | 'sms' | 'push')[];
    scheduleDate?: Date;
  }): Promise<{
    scheduled: boolean;
    recipientCount: number;
    estimatedDelivery?: Date;
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        scheduled: boolean;
        recipientCount: number;
        estimatedDelivery?: Date;
      }>>(
        `${this.baseUrl}/notifications/bulk`,
        notification
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to send bulk notification');
    }
  }

  /**
   * Get reservation queue for a book
   */
  async getBookReservationQueue(bookId: string): Promise<{
    bookId: string;
    totalReservations: number;
    estimatedWaitTime: number;
    reservations: Reservation[];
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        bookId: string;
        totalReservations: number;
        estimatedWaitTime: number;
        reservations: Reservation[];
      }>>(`${this.baseUrl}/reservations/book/${bookId}/queue`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get reservation queue for book: ${bookId}`);
    }
  }

  /**
   * Create book reservation
   */
  async createReservation(reservation: {
    bookId: string;
    memberId: string;
    notes?: string;
  }): Promise<Reservation> {
    try {
      const response = await httpClient.post<ApiResponse<Reservation>>(
        `${this.baseUrl}/reservations`,
        reservation
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create reservation');
    }
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservationId: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/reservations/${reservationId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to cancel reservation: ${reservationId}`);
    }
  }

  /**
   * Get member's reservations
   */
  async getMemberReservations(memberId: string): Promise<Reservation[]> {
    try {
      const response = await httpClient.get<ApiResponse<Reservation[]>>(
        `${this.baseUrl}/reservations/member/${memberId}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get reservations for member: ${memberId}`);
    }
  }

  /**
   * Process ready reservations (when book becomes available)
   */
  async processReadyReservations(): Promise<{
    processed: number;
    notified: number;
    errors: string[];
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        processed: number;
        notified: number;
        errors: string[];
      }>>(`${this.baseUrl}/reservations/process-ready`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process ready reservations');
    }
  }

  /**
   * Get library health check and system status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: {
      database: 'up' | 'down';
      api: 'up' | 'down';
      notifications: 'up' | 'down';
      backups: 'up' | 'down';
    };
    metrics: {
      responseTime: number;
      databaseConnections: number;
      memoryUsage: number;
      diskSpace: number;
    };
    lastCheck: Date;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        status: 'healthy' | 'warning' | 'critical';
        services: {
          database: 'up' | 'down';
          api: 'up' | 'down';
          notifications: 'up' | 'down';
          backups: 'up' | 'down';
        };
        metrics: {
          responseTime: number;
          databaseConnections: number;
          memoryUsage: number;
          diskSpace: number;
        };
        lastCheck: Date;
      }>>(`${this.baseUrl}/health`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get system health');
    }
  }

  /**
   * Backup library data
   */
  async createBackup(options: {
    includeData: boolean;
    includeImages: boolean;
    compression: boolean;
  }): Promise<{
    backupId: string;
    filename: string;
    size: number;
    createdAt: Date;
    downloadUrl: string;
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        backupId: string;
        filename: string;
        size: number;
        createdAt: Date;
        downloadUrl: string;
      }>>(
        `${this.baseUrl}/backup`,
        options
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create backup');
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: any, defaultMessage: string): ApiError {
    console.error('LibraryService Error:', error);
    
    if (error.response?.data?.message) {
      return {
        code: error.response.data.code || 'LIBRARY_SERVICE_ERROR',
        message: error.response.data.message,
        details: error.response.data.details,
        statusCode: error.response.status
      };
    }
    
    return {
      code: 'LIBRARY_SERVICE_ERROR',
      message: defaultMessage,
      statusCode: 500
    };
  }
}

export default new LibraryService();