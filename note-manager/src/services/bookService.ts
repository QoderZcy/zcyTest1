// Book Service - Handles all book-related API operations

import { 
  Book, 
  NewBook, 
  BookSearchQuery, 
  BookSearchResult, 
  AvailabilityStatus,
  ApiResponse,
  PaginatedResponse,
  ApiError
} from '../types/library';
import { httpClient } from '../utils/httpClient';

class BookService {
  private readonly baseUrl = '/api/books';

  /**
   * Search books with pagination and filtering
   */
  async searchBooks(
    query: BookSearchQuery, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedResponse<Book>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...this.buildQueryParams(query)
      });

      const response = await httpClient.get<PaginatedResponse<Book>>(
        `${this.baseUrl}?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to search books');
    }
  }

  /**
   * Get book by ID with detailed information
   */
  async getBookById(id: string): Promise<Book> {
    try {
      const response = await httpClient.get<ApiResponse<Book>>(
        `${this.baseUrl}/${id}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get book with ID: ${id}`);
    }
  }

  /**
   * Get book by ISBN
   */
  async getBookByIsbn(isbn: string): Promise<Book> {
    try {
      const response = await httpClient.get<ApiResponse<Book>>(
        `${this.baseUrl}/isbn/${isbn}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get book with ISBN: ${isbn}`);
    }
  }

  /**
   * Create a new book
   */
  async createBook(bookData: NewBook): Promise<Book> {
    try {
      const response = await httpClient.post<ApiResponse<Book>>(
        this.baseUrl,
        bookData
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create book');
    }
  }

  /**
   * Update an existing book
   */
  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    try {
      const response = await httpClient.put<ApiResponse<Book>>(
        `${this.baseUrl}/${id}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update book with ID: ${id}`);
    }
  }

  /**
   * Delete a book (soft delete)
   */
  async deleteBook(id: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete book with ID: ${id}`);
    }
  }

  /**
   * Check book availability status
   */
  async checkAvailability(bookId: string): Promise<AvailabilityStatus> {
    try {
      const response = await httpClient.get<ApiResponse<AvailabilityStatus>>(
        `${this.baseUrl}/${bookId}/availability`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to check availability for book ID: ${bookId}`);
    }
  }

  /**
   * Get popular books
   */
  async getPopularBooks(limit: number = 10): Promise<Book[]> {
    try {
      const response = await httpClient.get<ApiResponse<Book[]>>(
        `${this.baseUrl}/popular?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get popular books');
    }
  }

  /**
   * Get recently added books
   */
  async getRecentBooks(limit: number = 10): Promise<Book[]> {
    try {
      const response = await httpClient.get<ApiResponse<Book[]>>(
        `${this.baseUrl}/recent?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get recent books');
    }
  }

  /**
   * Get all unique genres
   */
  async getGenres(): Promise<string[]> {
    try {
      const response = await httpClient.get<ApiResponse<string[]>>(
        `${this.baseUrl}/genres`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get genres');
    }
  }

  /**
   * Get all unique authors
   */
  async getAuthors(): Promise<string[]> {
    try {
      const response = await httpClient.get<ApiResponse<string[]>>(
        `${this.baseUrl}/authors`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get authors');
    }
  }

  /**
   * Update book availability after lending operations
   */
  async updateAvailability(
    bookId: string, 
    operation: 'CHECKOUT' | 'RETURN',
    copies: number = 1
  ): Promise<void> {
    try {
      await httpClient.patch(`${this.baseUrl}/${bookId}/availability`, {
        operation,
        copies
      });
    } catch (error) {
      throw this.handleError(error, `Failed to update availability for book ID: ${bookId}`);
    }
  }

  /**
   * Bulk import books from CSV or JSON
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
      throw this.handleError(error, 'Failed to import books');
    }
  }

  /**
   * Export books to CSV or JSON
   */
  async exportBooks(
    query: BookSearchQuery,
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
      throw this.handleError(error, 'Failed to export books');
    }
  }

  /**
   * Build query parameters from search query object
   */
  private buildQueryParams(query: BookSearchQuery): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (query.searchTerm) params.searchTerm = query.searchTerm;
    if (query.isbn) params.isbn = query.isbn;
    if (query.authors?.length) params.authors = query.authors.join(',');
    if (query.genre?.length) params.genre = query.genre.join(',');
    if (query.language) params.language = query.language;
    if (query.availableOnly !== undefined) params.availableOnly = query.availableOnly.toString();
    if (query.location) params.location = query.location;
    if (query.condition?.length) params.condition = query.condition.join(',');
    if (query.tags?.length) params.tags = query.tags.join(',');
    if (query.publishedAfter) params.publishedAfter = query.publishedAfter.toString();
    if (query.publishedBefore) params.publishedBefore = query.publishedBefore.toString();
    
    return params;
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: any, defaultMessage: string): ApiError {
    console.error('BookService Error:', error);
    
    if (error.response?.data?.message) {
      return {
        code: error.response.data.code || 'BOOK_SERVICE_ERROR',
        message: error.response.data.message,
        details: error.response.data.details,
        statusCode: error.response.status
      };
    }
    
    return {
      code: 'BOOK_SERVICE_ERROR',
      message: defaultMessage,
      statusCode: 500
    };
  }
}

export default new BookService();