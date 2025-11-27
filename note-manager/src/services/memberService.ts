// Member Service - Handles all member-related API operations

import { 
  Member, 
  NewMember, 
  MemberSearchQuery,
  MemberSearchResult,
  MembershipType,
  MemberStatus,
  ApiResponse,
  PaginatedResponse,
  ApiError
} from '../types/library';
import { httpClient } from '../utils/httpClient';

class MemberService {
  private readonly baseUrl = '/api/members';

  /**
   * Search members with pagination and filtering
   */
  async searchMembers(
    query: MemberSearchQuery, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedResponse<Member>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...this.buildQueryParams(query)
      });

      const response = await httpClient.get<PaginatedResponse<Member>>(
        `${this.baseUrl}?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to search members');
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(id: string): Promise<Member> {
    try {
      const response = await httpClient.get<ApiResponse<Member>>(
        `${this.baseUrl}/${id}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get member with ID: ${id}`);
    }
  }

  /**
   * Get member by membership ID
   */
  async getMemberByMembershipId(membershipId: string): Promise<Member> {
    try {
      const response = await httpClient.get<ApiResponse<Member>>(
        `${this.baseUrl}/membership/${membershipId}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get member with membership ID: ${membershipId}`);
    }
  }

  /**
   * Get member by email
   */
  async getMemberByEmail(email: string): Promise<Member> {
    try {
      const response = await httpClient.get<ApiResponse<Member>>(
        `${this.baseUrl}/email/${encodeURIComponent(email)}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get member with email: ${email}`);
    }
  }

  /**
   * Create a new member
   */
  async createMember(memberData: NewMember): Promise<Member> {
    try {
      const response = await httpClient.post<ApiResponse<Member>>(
        this.baseUrl,
        memberData
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create member');
    }
  }

  /**
   * Update an existing member
   */
  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    try {
      const response = await httpClient.put<ApiResponse<Member>>(
        `${this.baseUrl}/${id}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update member with ID: ${id}`);
    }
  }

  /**
   * Delete a member (soft delete)
   */
  async deleteMember(id: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete member with ID: ${id}`);
    }
  }

  /**
   * Validate member status for lending operations
   */
  async validateMemberStatus(memberId: string): Promise<{
    isValid: boolean;
    canBorrow: boolean;
    reasons: string[];
    member: Member;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        isValid: boolean;
        canBorrow: boolean;
        reasons: string[];
        member: Member;
      }>>(`${this.baseUrl}/${memberId}/validate`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to validate member status: ${memberId}`);
    }
  }

  /**
   * Get member's borrowing history
   */
  async getMemberHistory(
    memberId: string, 
    options: {
      page?: number;
      pageSize?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    transactions: any[];
    stats: {
      totalBorrows: number;
      currentBorrows: number;
      overdueBooks: number;
      totalFines: number;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        pageSize: (options.pageSize || 20).toString(),
        ...(options.status && { status: options.status }),
        ...(options.sortBy && { sortBy: options.sortBy }),
        ...(options.sortOrder && { sortOrder: options.sortOrder })
      });

      const response = await httpClient.get<ApiResponse<{
        transactions: any[];
        stats: {
          totalBorrows: number;
          currentBorrows: number;
          overdueBooks: number;
          totalFines: number;
        };
      }>>(`${this.baseUrl}/${memberId}/history?${params.toString()}`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get member history: ${memberId}`);
    }
  }

  /**
   * Renew member's membership
   */
  async renewMembership(
    memberId: string, 
    membershipType?: MembershipType,
    duration?: number
  ): Promise<Member> {
    try {
      const response = await httpClient.post<ApiResponse<Member>>(
        `${this.baseUrl}/${memberId}/renew`,
        {
          membershipType,
          duration
        }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to renew membership: ${memberId}`);
    }
  }

  /**
   * Suspend or activate member
   */
  async updateMemberStatus(
    memberId: string, 
    status: MemberStatus,
    reason?: string
  ): Promise<Member> {
    try {
      const response = await httpClient.patch<ApiResponse<Member>>(
        `${this.baseUrl}/${memberId}/status`,
        {
          status,
          reason
        }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update member status: ${memberId}`);
    }
  }

  /**
   * Get members with overdue books
   */
  async getMembersWithOverdue(): Promise<Member[]> {
    try {
      const response = await httpClient.get<ApiResponse<Member[]>>(
        `${this.baseUrl}/overdue`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get members with overdue books');
    }
  }

  /**
   * Get members with outstanding fines
   */
  async getMembersWithFines(minimumAmount?: number): Promise<Member[]> {
    try {
      const params = minimumAmount 
        ? `?minimumAmount=${minimumAmount}` 
        : '';
      
      const response = await httpClient.get<ApiResponse<Member[]>>(
        `${this.baseUrl}/fines${params}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get members with fines');
    }
  }

  /**
   * Get membership statistics
   */
  async getMembershipStats(): Promise<{
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    suspendedMembers: number;
    membershipDistribution: Record<MembershipType, number>;
    recentJoins: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        totalMembers: number;
        activeMembers: number;
        expiredMembers: number;
        suspendedMembers: number;
        membershipDistribution: Record<MembershipType, number>;
        recentJoins: number;
      }>>(`${this.baseUrl}/stats`);
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get membership statistics');
    }
  }

  /**
   * Send notification to member
   */
  async sendNotification(
    memberId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      channels: ('email' | 'sms' | 'push')[];
    }
  ): Promise<void> {
    try {
      await httpClient.post(
        `${this.baseUrl}/${memberId}/notify`,
        notification
      );
    } catch (error) {
      throw this.handleError(error, `Failed to send notification to member: ${memberId}`);
    }
  }

  /**
   * Bulk import members from CSV or JSON
   */
  async bulkImport(file: File, format: 'csv' | 'json'): Promise<{ 
    imported: number; 
    failed: number; 
    errors: string[] 
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      const response = await httpClient.post<ApiResponse<{
        imported: number;
        failed: number;
        errors: string[];
      }>>(
        `${this.baseUrl}/bulk-import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to import members');
    }
  }

  /**
   * Export members to CSV or JSON
   */
  async exportMembers(
    query: MemberSearchQuery,
    format: 'csv' | 'json'
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format,
        ...this.buildQueryParams(query)
      });

      const response = await httpClient.get(
        `${this.baseUrl}/export?${params.toString()}`,
        {
          responseType: 'blob'
        }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to export members');
    }
  }

  /**
   * Build query parameters from search query object
   */
  private buildQueryParams(query: MemberSearchQuery): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (query.searchTerm) params.searchTerm = query.searchTerm;
    if (query.membershipId) params.membershipId = query.membershipId;
    if (query.email) params.email = query.email;
    if (query.membershipType) params.membershipType = query.membershipType;
    if (query.status) params.status = query.status;
    if (query.hasOverdueBooks !== undefined) params.hasOverdueBooks = query.hasOverdueBooks.toString();
    if (query.hasFines !== undefined) params.hasFines = query.hasFines.toString();
    
    return params;
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: any, defaultMessage: string): ApiError {
    console.error('MemberService Error:', error);
    
    if (error.response?.data?.message) {
      return {
        code: error.response.data.code || 'MEMBER_SERVICE_ERROR',
        message: error.response.data.message,
        details: error.response.data.details,
        statusCode: error.response.status
      };
    }
    
    return {
      code: 'MEMBER_SERVICE_ERROR',
      message: defaultMessage,
      statusCode: 500
    };
  }
}

export default new MemberService();