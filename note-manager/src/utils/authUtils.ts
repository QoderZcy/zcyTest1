import jwt from 'jsonwebtoken';
import { JWTPayload, User } from '../types/auth';

// JWT工具类
export class JWTUtils {
  /**
   * 解析JWT令牌
   */
  static decode(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }

  /**
   * 检查令牌是否过期
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * 检查令牌是否即将过期（在指定秒数内）
   */
  static isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
    try {
      const decoded = this.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return (decoded.exp - currentTime) < thresholdSeconds;
    } catch (error) {
      return true;
    }
  }

  /**
   * 从令牌中提取用户信息
   */
  static extractUserFromToken(token: string): Partial<User> | null {
    try {
      const decoded = this.decode(token);
      if (!decoded) {
        return null;
      }

      return {
        id: decoded.sub,
        email: decoded.email,
        username: decoded.username,
      };
    } catch (error) {
      console.error('Extract user from token failed:', error);
      return null;
    }
  }

  /**
   * 获取令牌的剩余有效时间（秒）
   */
  static getTokenRemainingTime(token: string): number {
    try {
      const decoded = this.decode(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - currentTime;
      return Math.max(0, remainingTime);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 验证令牌格式是否正确
   */
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // JWT格式：header.payload.signature
    const parts = token.split('.');
    return parts.length === 3;
  }
}

// 表单验证工具类
export class ValidationUtils {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('密码长度至少8位');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }

    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证用户名格式
   */
  static isValidUsername(username: string): boolean {
    // 用户名：3-20位，只能包含字母、数字、下划线、中文
    const usernameRegex = /^[\u4e00-\u9fa5\w]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * 检查密码确认是否匹配
   */
  static isPasswordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
}

// 存储加密工具类
export class EncryptionUtils {
  private static readonly CRYPTO_KEY = 'notes-app-encryption-key';

  /**
   * 简单的字符串加密（仅用于演示，生产环境应使用更安全的方法）
   */
  static encrypt(text: string): string {
    try {
      // 在实际项目中，应该使用Web Crypto API或其他安全的加密库
      return btoa(encodeURIComponent(text));
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  }

  /**
   * 简单的字符串解密
   */
  static decrypt(encryptedText: string): string {
    try {
      return decodeURIComponent(atob(encryptedText));
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  }

  /**
   * 生成随机字符串
   */
  static generateRandomString(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// 错误处理工具类
export class ErrorUtils {
  /**
   * 将API错误转换为用户友好的消息
   */
  static getErrorMessage(error: any): string {
    if (error?.type) {
      return error.message;
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return error.message;
    }

    return '发生未知错误，请稍后重试';
  }

  /**
   * 检查错误是否为网络错误
   */
  static isNetworkError(error: any): boolean {
    return !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
  }

  /**
   * 检查错误是否为认证错误
   */
  static isAuthError(error: any): boolean {
    return error?.response?.status === 401 || error?.type === 'TOKEN_INVALID';
  }
}