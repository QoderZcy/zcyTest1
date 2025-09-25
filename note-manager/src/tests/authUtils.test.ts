import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JWTUtils, ValidationUtils, EncryptionUtils, ErrorUtils } from '../utils/authUtils';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    decode: vi.fn(),
  },
}));

describe('JWTUtils', () => {
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE2MDA5NjAwMDAsImV4cCI6MTYwMDk2MzYwMH0.fake-signature';
  
  const mockPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    iat: 1600960000,
    exp: 1600963600, // 1小时后过期
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('decode', () => {
    it('应该成功解码有效的JWT令牌', () => {
      (jwt.decode as any).mockReturnValue(mockPayload);

      const result = JWTUtils.decode(mockToken);

      expect(jwt.decode).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockPayload);
    });

    it('应该在解码失败时返回null', () => {
      (jwt.decode as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = JWTUtils.decode('invalid-token');

      expect(result).toBeNull();
    });

    it('应该在令牌为空时返回null', () => {
      const result = JWTUtils.decode('');

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('应该正确识别已过期的令牌', () => {
      const expiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1小时前过期
      };
      
      (jwt.decode as any).mockReturnValue(expiredPayload);

      const result = JWTUtils.isTokenExpired(mockToken);

      expect(result).toBe(true);
    });

    it('应该正确识别未过期的令牌', () => {
      const validPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      };
      
      (jwt.decode as any).mockReturnValue(validPayload);

      const result = JWTUtils.isTokenExpired(mockToken);

      expect(result).toBe(false);
    });

    it('应该在令牌无效时返回true', () => {
      (jwt.decode as any).mockReturnValue(null);

      const result = JWTUtils.isTokenExpired('invalid-token');

      expect(result).toBe(true);
    });

    it('应该在缺少过期时间时返回true', () => {
      const payloadWithoutExp = {
        sub: 'user-123',
        email: 'test@example.com',
      };
      
      (jwt.decode as any).mockReturnValue(payloadWithoutExp);

      const result = JWTUtils.isTokenExpired(mockToken);

      expect(result).toBe(true);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('应该正确识别即将过期的令牌', () => {
      const soonExpiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) + 120, // 2分钟后过期
      };
      
      (jwt.decode as any).mockReturnValue(soonExpiredPayload);

      const result = JWTUtils.isTokenExpiringSoon(mockToken, 300); // 5分钟阈值

      expect(result).toBe(true);
    });

    it('应该正确识别不会很快过期的令牌', () => {
      const validPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      };
      
      (jwt.decode as any).mockReturnValue(validPayload);

      const result = JWTUtils.isTokenExpiringSoon(mockToken, 300); // 5分钟阈值

      expect(result).toBe(false);
    });

    it('应该使用默认阈值(5分钟)', () => {
      const soonExpiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) + 120, // 2分钟后过期
      };
      
      (jwt.decode as any).mockReturnValue(soonExpiredPayload);

      const result = JWTUtils.isTokenExpiringSoon(mockToken); // 使用默认阈值

      expect(result).toBe(true);
    });
  });

  describe('extractUserFromToken', () => {
    it('应该成功从令牌中提取用户信息', () => {
      (jwt.decode as any).mockReturnValue(mockPayload);

      const result = JWTUtils.extractUserFromToken(mockToken);

      expect(result).toEqual({
        id: mockPayload.sub,
        email: mockPayload.email,
        username: mockPayload.username,
      });
    });

    it('应该在令牌无效时返回null', () => {
      (jwt.decode as any).mockReturnValue(null);

      const result = JWTUtils.extractUserFromToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('getTokenRemainingTime', () => {
    it('应该正确计算令牌剩余时间', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 1800; // 30分钟后过期
      const futurePayload = {
        ...mockPayload,
        exp: futureExp,
      };
      
      (jwt.decode as any).mockReturnValue(futurePayload);

      const result = JWTUtils.getTokenRemainingTime(mockToken);

      expect(result).toBeGreaterThan(1700); // 约30分钟
      expect(result).toBeLessThan(1800);
    });

    it('应该在令牌已过期时返回0', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 1800; // 30分钟前过期
      const pastPayload = {
        ...mockPayload,
        exp: pastExp,
      };
      
      (jwt.decode as any).mockReturnValue(pastPayload);

      const result = JWTUtils.getTokenRemainingTime(mockToken);

      expect(result).toBe(0);
    });

    it('应该在令牌无效时返回0', () => {
      (jwt.decode as any).mockReturnValue(null);

      const result = JWTUtils.getTokenRemainingTime('invalid-token');

      expect(result).toBe(0);
    });
  });

  describe('isValidTokenFormat', () => {
    it('应该验证有效的JWT令牌格式', () => {
      const validToken = 'header.payload.signature';
      
      const result = JWTUtils.isValidTokenFormat(validToken);

      expect(result).toBe(true);
    });

    it('应该拒绝无效的JWT令牌格式', () => {
      const invalidFormats = [
        '',
        'invalid',
        'header.payload',
        'header.payload.signature.extra',
        null,
        undefined,
      ];

      invalidFormats.forEach(format => {
        const result = JWTUtils.isValidTokenFormat(format as any);
        expect(result).toBe(false);
      });
    });
  });
});

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'email@123.123.123.123', // IP地址形式
      ];

      validEmails.forEach(email => {
        expect(ValidationUtils.isValidEmail(email)).toBe(true);
      });
    });

    it('应该拒绝无效的邮箱地址', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'test@',
        'test.example.com',
        'test..test@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(ValidationUtils.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('应该验证强密码', () => {
      const strongPassword = 'StrongPass123!';
      
      const result = ValidationUtils.validatePassword(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该识别弱密码并返回相应错误', () => {
      const weakPassword = 'weak';
      
      const result = ValidationUtils.validatePassword(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码长度至少8位');
      expect(result.errors).toContain('密码必须包含大写字母');
      expect(result.errors).toContain('密码必须包含数字');
      expect(result.errors).toContain('密码必须包含特殊字符');
    });

    it('应该验证各种密码规则', () => {
      const testCases = [
        {
          password: 'NoSpecialChar123',
          expectedErrors: ['密码必须包含特殊字符'],
        },
        {
          password: 'nouppercasechar123!',
          expectedErrors: ['密码必须包含大写字母'],
        },
        {
          password: 'NOLOWERCASECHAR123!',
          expectedErrors: ['密码必须包含小写字母'],
        },
        {
          password: 'NoNumbers!',
          expectedErrors: ['密码必须包含数字'],
        },
      ];

      testCases.forEach(({ password, expectedErrors }) => {
        const result = ValidationUtils.validatePassword(password);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach(error => {
          expect(result.errors).toContain(error);
        });
      });
    });
  });

  describe('isValidUsername', () => {
    it('应该验证有效的用户名', () => {
      const validUsernames = [
        'user123',
        'test_user',
        '测试用户',
        'User_Name_123',
        '用户名123',
      ];

      validUsernames.forEach(username => {
        expect(ValidationUtils.isValidUsername(username)).toBe(true);
      });
    });

    it('应该拒绝无效的用户名', () => {
      const invalidUsernames = [
        '',
        'ab', // 太短
        'a'.repeat(21), // 太长
        'user@name', // 包含特殊字符
        'user name', // 包含空格
        'user-name', // 包含连字符
      ];

      invalidUsernames.forEach(username => {
        expect(ValidationUtils.isValidUsername(username)).toBe(false);
      });
    });
  });

  describe('isPasswordMatch', () => {
    it('应该验证密码匹配', () => {
      const password = 'testpassword';
      const confirmPassword = 'testpassword';

      const result = ValidationUtils.isPasswordMatch(password, confirmPassword);

      expect(result).toBe(true);
    });

    it('应该识别密码不匹配', () => {
      const password = 'testpassword';
      const confirmPassword = 'differentpassword';

      const result = ValidationUtils.isPasswordMatch(password, confirmPassword);

      expect(result).toBe(false);
    });
  });
});

describe('EncryptionUtils', () => {
  describe('encrypt and decrypt', () => {
    it('应该正确加密和解密文本', () => {
      const originalText = 'Hello, World!';
      
      const encrypted = EncryptionUtils.encrypt(originalText);
      expect(encrypted).not.toBe(originalText);
      
      const decrypted = EncryptionUtils.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('应该处理包含特殊字符的文本', () => {
      const specialText = '特殊字符测试!@#$%^&*()';
      
      const encrypted = EncryptionUtils.encrypt(specialText);
      const decrypted = EncryptionUtils.decrypt(encrypted);
      
      expect(decrypted).toBe(specialText);
    });

    it('应该处理空字符串', () => {
      const emptyText = '';
      
      const encrypted = EncryptionUtils.encrypt(emptyText);
      const decrypted = EncryptionUtils.decrypt(encrypted);
      
      expect(decrypted).toBe(emptyText);
    });
  });

  describe('generateRandomString', () => {
    it('应该生成指定长度的随机字符串', () => {
      const length = 16;
      const randomString = EncryptionUtils.generateRandomString(length);
      
      expect(randomString).toHaveLength(length);
      expect(typeof randomString).toBe('string');
    });

    it('应该生成不同的随机字符串', () => {
      const string1 = EncryptionUtils.generateRandomString(10);
      const string2 = EncryptionUtils.generateRandomString(10);
      
      expect(string1).not.toBe(string2);
    });

    it('应该使用默认长度', () => {
      const randomString = EncryptionUtils.generateRandomString();
      
      expect(randomString).toHaveLength(16); // 默认长度
    });

    it('应该只包含允许的字符', () => {
      const randomString = EncryptionUtils.generateRandomString(100);
      const allowedChars = /^[A-Za-z0-9]+$/;
      
      expect(allowedChars.test(randomString)).toBe(true);
    });
  });
});

describe('ErrorUtils', () => {
  describe('getErrorMessage', () => {
    it('应该返回结构化错误的消息', () => {
      const structuredError = {
        type: 'VALIDATION_ERROR',
        message: '输入验证失败',
      };

      const result = ErrorUtils.getErrorMessage(structuredError);

      expect(result).toBe('输入验证失败');
    });

    it('应该返回响应数据中的错误消息', () => {
      const responseError = {
        response: {
          data: {
            message: '服务器错误消息',
          },
        },
      };

      const result = ErrorUtils.getErrorMessage(responseError);

      expect(result).toBe('服务器错误消息');
    });

    it('应该返回标准错误的消息', () => {
      const standardError = new Error('标准错误消息');

      const result = ErrorUtils.getErrorMessage(standardError);

      expect(result).toBe('标准错误消息');
    });

    it('应该返回默认错误消息', () => {
      const unknownError = { someProperty: 'value' };

      const result = ErrorUtils.getErrorMessage(unknownError);

      expect(result).toBe('发生未知错误，请稍后重试');
    });
  });

  describe('isNetworkError', () => {
    it('应该识别网络错误', () => {
      const networkErrors = [
        { code: 'ECONNABORTED' },
        { code: 'ERR_NETWORK' },
        { message: 'Network request failed' }, // 没有response
      ];

      networkErrors.forEach(error => {
        expect(ErrorUtils.isNetworkError(error)).toBe(true);
      });
    });

    it('应该识别非网络错误', () => {
      const nonNetworkErrors = [
        { response: { status: 400 } },
        { response: { status: 500 } },
        { code: 'OTHER_ERROR', response: {} },
      ];

      nonNetworkErrors.forEach(error => {
        expect(ErrorUtils.isNetworkError(error)).toBe(false);
      });
    });
  });

  describe('isAuthError', () => {
    it('应该识别认证错误', () => {
      const authErrors = [
        { response: { status: 401 } },
        { type: 'TOKEN_INVALID' },
      ];

      authErrors.forEach(error => {
        expect(ErrorUtils.isAuthError(error)).toBe(true);
      });
    });

    it('应该识别非认证错误', () => {
      const nonAuthErrors = [
        { response: { status: 400 } },
        { response: { status: 500 } },
        { type: 'NETWORK_ERROR' },
        { message: 'Some other error' },
      ];

      nonAuthErrors.forEach(error => {
        expect(ErrorUtils.isAuthError(error)).toBe(false);
      });
    });
  });
});