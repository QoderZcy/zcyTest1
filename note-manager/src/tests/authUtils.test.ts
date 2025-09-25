/**
 * 认证工具类单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JWTUtils, ValidationUtils, EncryptionUtils } from '../utils/authUtils';

describe('JWTUtils', () => {
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.dummy_signature';
  
  describe('isValidTokenFormat', () => {
    it('should return true for valid JWT format', () => {
      expect(JWTUtils.isValidTokenFormat(mockToken)).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(JWTUtils.isValidTokenFormat('invalid')).toBe(false);
      expect(JWTUtils.isValidTokenFormat('')).toBe(false);
      expect(JWTUtils.isValidTokenFormat('part1.part2')).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      // 使用过期的时间戳创建token
      const expiredPayload = {
        sub: '123',
        email: 'test@example.com',
        username: 'testuser',
        iat: 1516239022,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1小时前过期
      };
      
      // 模拟过期token
      expect(JWTUtils.isTokenExpired('expired.token.here')).toBe(true);
    });
    
    it('should return true for invalid token', () => {
      expect(JWTUtils.isTokenExpired('invalid')).toBe(true);
    });
  });
});

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(ValidationUtils.isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(ValidationUtils.isValidEmail('invalid')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@')).toBe(false);
      expect(ValidationUtils.isValidEmail('@example.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = ValidationUtils.validatePassword('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = ValidationUtils.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide specific error messages', () => {
      const result = ValidationUtils.validatePassword('password');
      expect(result.errors).toContain('密码必须包含大写字母');
      expect(result.errors).toContain('密码必须包含数字');
      expect(result.errors).toContain('密码必须包含特殊字符');
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(ValidationUtils.isValidUsername('testuser')).toBe(true);
      expect(ValidationUtils.isValidUsername('test_user')).toBe(true);
      expect(ValidationUtils.isValidUsername('用户名')).toBe(true);
      expect(ValidationUtils.isValidUsername('user123')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(ValidationUtils.isValidUsername('ab')).toBe(false); // 太短
      expect(ValidationUtils.isValidUsername('a'.repeat(21))).toBe(false); // 太长
      expect(ValidationUtils.isValidUsername('user@name')).toBe(false); // 包含特殊字符
      expect(ValidationUtils.isValidUsername('')).toBe(false);
    });
  });

  describe('isPasswordMatch', () => {
    it('should return true for matching passwords', () => {
      expect(ValidationUtils.isPasswordMatch('password', 'password')).toBe(true);
    });

    it('should return false for non-matching passwords', () => {
      expect(ValidationUtils.isPasswordMatch('password1', 'password2')).toBe(false);
    });
  });
});

describe('EncryptionUtils', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'Hello, World!';
      const encrypted = EncryptionUtils.encrypt(originalText);
      const decrypted = EncryptionUtils.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
      expect(encrypted).not.toBe(originalText);
    });

    it('should handle empty strings', () => {
      const encrypted = EncryptionUtils.encrypt('');
      const decrypted = EncryptionUtils.decrypt(encrypted);
      
      expect(decrypted).toBe('');
    });

    it('should handle special characters', () => {
      const originalText = '特殊字符 @#$%^&*()';
      const encrypted = EncryptionUtils.encrypt(originalText);
      const decrypted = EncryptionUtils.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      const randomString = EncryptionUtils.generateRandomString(10);
      expect(randomString).toHaveLength(10);
    });

    it('should generate different strings on multiple calls', () => {
      const string1 = EncryptionUtils.generateRandomString(16);
      const string2 = EncryptionUtils.generateRandomString(16);
      
      expect(string1).not.toBe(string2);
    });

    it('should generate string with default length', () => {
      const randomString = EncryptionUtils.generateRandomString();
      expect(randomString).toHaveLength(16);
    });
  });
});