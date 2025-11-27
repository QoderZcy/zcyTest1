// Service Utilities and Common Helper Functions

import { ApiError, ValidationError } from '../types/library';

/**
 * Service response utilities
 */
export class ServiceUtils {
  /**
   * Standardize error handling across all services
   */
  static handleApiError(error: any, context: string): ApiError {
    console.error(`[${context}] API Error:`, error);
    
    // Handle network errors
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        statusCode: 0
      };
    }

    // Handle HTTP errors with specific response data
    if (error.response?.data) {
      const responseData = error.response.data;
      
      return {
        code: responseData.code || 'API_ERROR',
        message: responseData.message || 'An unexpected error occurred',
        details: responseData.details,
        statusCode: error.response.status
      };
    }

    // Handle HTTP errors without response data
    const statusCode = error.response?.status || 500;
    const statusMessages: Record<number, string> = {
      400: 'Invalid request data',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      409: 'Resource conflict',
      422: 'Validation failed',
      429: 'Too many requests',
      500: 'Internal server error',
      502: 'Service unavailable',
      503: 'Service temporarily unavailable'
    };

    return {
      code: `HTTP_${statusCode}`,
      message: statusMessages[statusCode] || 'An unexpected error occurred',
      statusCode
    };
  }

  /**
   * Format validation errors for display
   */
  static formatValidationErrors(errors: ValidationError[]): string {
    if (!errors || errors.length === 0) {
      return 'Validation failed';
    }

    if (errors.length === 1) {
      return errors[0].message;
    }

    return `Multiple validation errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
  }

  /**
   * Build URL with query parameters
   */
  static buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
    const url = new URL(baseUrl, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    return url.pathname + url.search;
  }

  /**
   * Retry logic for failed API calls
   */
  static async retryApiCall<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.response?.status >= 400 && 
            error.response?.status < 500 && 
            error.response?.status !== 429) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
          );
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Debounce function for search operations
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delayMs: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delayMs);
    };
  }

  /**
   * Throttle function for frequent API calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limitMs: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limitMs);
      }
    };
  }

  /**
   * Cache helper for API responses
   */
  static createCache<T>(ttlMs: number = 300000) { // 5 minutes default
    const cache = new Map<string, { data: T; timestamp: number }>();
    
    return {
      get(key: string): T | null {
        const entry = cache.get(key);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > ttlMs) {
          cache.delete(key);
          return null;
        }
        
        return entry.data;
      },
      
      set(key: string, data: T): void {
        cache.set(key, { data, timestamp: Date.now() });
      },
      
      delete(key: string): void {
        cache.delete(key);
      },
      
      clear(): void {
        cache.clear();
      },
      
      size(): number {
        return cache.size;
      }
    };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Format date for API transmission
   */
  static formatDateForApi(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parse date from API response
   */
  static parseDateFromApi(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Generate unique request ID for tracking
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(
    data: Record<string, any>, 
    requiredFields: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD'
        });
      }
    });
    
    return errors;
  }

  /**
   * Sanitize data for API transmission
   */
  static sanitizeApiData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          sanitized[key] = value.trim();
        } else if (value instanceof Date) {
          sanitized[key] = value.toISOString();
        } else if (Array.isArray(value)) {
          sanitized[key] = value.filter(item => item !== null && item !== undefined);
        } else {
          sanitized[key] = value;
        }
      }
    });
    
    return sanitized;
  }
}

/**
 * Response interceptors for common data transformations
 */
export class ResponseInterceptors {
  /**
   * Transform date strings to Date objects
   */
  static transformDates<T>(data: T, dateFields: string[]): T {
    if (!data || typeof data !== 'object') return data;
    
    const transformed = { ...data } as any;
    
    dateFields.forEach(field => {
      if (transformed[field] && typeof transformed[field] === 'string') {
        transformed[field] = new Date(transformed[field]);
      }
    });
    
    return transformed;
  }

  /**
   * Transform pagination metadata
   */
  static transformPagination(response: any) {
    if (response.pagination) {
      return {
        ...response,
        pagination: {
          ...response.pagination,
          hasNext: response.pagination.page < response.pagination.totalPages,
          hasPrevious: response.pagination.page > 1
        }
      };
    }
    return response;
  }
}

/**
 * Request interceptors for common data preparation
 */
export class RequestInterceptors {
  /**
   * Add common headers to requests
   */
  static addCommonHeaders(config: any) {
    return {
      ...config,
      headers: {
        'X-Request-ID': ServiceUtils.generateRequestId(),
        'X-Client-Version': '1.0.0',
        ...config.headers
      }
    };
  }

  /**
   * Transform dates to ISO strings
   */
  static transformDatesForRequest(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const transformed = { ...data };
    
    Object.keys(transformed).forEach(key => {
      if (transformed[key] instanceof Date) {
        transformed[key] = transformed[key].toISOString();
      } else if (Array.isArray(transformed[key])) {
        transformed[key] = transformed[key].map((item: any) => 
          item instanceof Date ? item.toISOString() : item
        );
      }
    });
    
    return transformed;
  }
}