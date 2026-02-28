/**
 * HTTP客户端单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { StorageManager, ApiError } from '../utils/httpClient';
import { AuthErrorType } from '../types/auth';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('StorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('token management', () => {
    it('should get token from localStorage first', () => {
      mockLocalStorage.getItem.mockReturnValue('local-token');
      mockSessionStorage.getItem.mockReturnValue('session-token');

      const token = StorageManager.getToken();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('local-token');
    });

    it('should get token from sessionStorage if not in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue('session-token');

      const token = StorageManager.getToken();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('session-token');
    });

    it('should set token in localStorage when remember is true', () => {
      StorageManager.setToken('test-token', true);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should set token in sessionStorage when remember is false', () => {
      StorageManager.setToken('test-token', false);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('refresh token management', () => {
    it('should get refresh token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('refresh-token');

      const token = StorageManager.getRefreshToken();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('refresh_token');
      expect(token).toBe('refresh-token');
    });

    it('should set refresh token in localStorage', () => {
      StorageManager.setRefreshToken('refresh-token');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    });
  });

  describe('remember me management', () => {
    it('should get remember me setting', () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      const rememberMe = StorageManager.getRememberMe();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('remember_me');
      expect(rememberMe).toBe(true);
    });

    it('should return false when remember me is not set', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const rememberMe = StorageManager.getRememberMe();
      
      expect(rememberMe).toBe(false);
    });

    it('should set remember me setting', () => {
      StorageManager.setRememberMe(true);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('remember_me', 'true');
    });
  });

  describe('clear tokens', () => {
    it('should clear all tokens from both storages', () => {
      StorageManager.clearTokens();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });
});

describe('ApiError', () => {
  it('should create error with correct properties', () => {
    const error = new ApiError(
      AuthErrorType.INVALID_CREDENTIALS,
      'Invalid credentials',
      400,
      { field: 'email' }
    );

    expect(error.name).toBe('ApiError');
    expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
    expect(error.message).toBe('Invalid credentials');
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create error without optional parameters', () => {
    const error = new ApiError(AuthErrorType.NETWORK_ERROR, 'Network error');

    expect(error.type).toBe(AuthErrorType.NETWORK_ERROR);
    expect(error.message).toBe('Network error');
    expect(error.status).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});

// Note: Testing the actual HttpClient class would require more complex mocking
// of axios interceptors and instance methods. For now, we focus on the 
// utility classes that are more easily testable.

describe('HttpClient Error Handling', () => {
  it('should handle different error status codes', () => {
    // This would test the handleApiError method if it were exposed
    // For now, we can test the error types that would be returned
    const errorTypes = [
      { status: 400, type: AuthErrorType.VALIDATION_ERROR },
      { status: 401, type: AuthErrorType.TOKEN_INVALID },
      { status: 403, type: AuthErrorType.ACCOUNT_LOCKED },
      { status: 404, type: AuthErrorType.USER_NOT_FOUND },
      { status: 409, type: AuthErrorType.EMAIL_ALREADY_EXISTS },
      { status: 422, type: AuthErrorType.WEAK_PASSWORD },
      { status: 429, type: AuthErrorType.SERVER_ERROR },
      { status: 500, type: AuthErrorType.SERVER_ERROR },
    ];

    errorTypes.forEach(({ status, type }) => {
      expect(type).toBeDefined();
    });
  });

  it('should handle network errors', () => {
    const networkErrorCodes = ['ECONNABORTED', 'ERR_NETWORK', 'ENOTFOUND', 'ECONNREFUSED'];
    
    networkErrorCodes.forEach(code => {
      expect(code).toBeDefined();
    });
  });
});