/**
 * 安全配置和工具类
 */

import { AuthConfig, StorageType } from '../types/auth';

// 安全配置
export const SECURITY_CONFIG = {
  // 密码安全
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    commonPasswordsCheck: true,
  },
  
  // 令牌安全
  token: {
    refreshThreshold: 300, // 5分钟
    maxAge: 3600, // 1小时
    algorithm: 'HS256',
  },
  
  // 会话安全
  session: {
    timeout: 1800, // 30分钟
    renewOnActivity: true,
    maxConcurrentSessions: 3,
  },
  
  // 登录安全
  login: {
    maxAttempts: 5,
    lockoutDuration: 900, // 15分钟
    attemptWindow: 300, // 5分钟
    requireCaptchaAfter: 3,
  },
  
  // 网络安全
  network: {
    timeout: 10000,
    maxRetries: 3,
    retryDelay: 1000,
    csrfProtection: true,
  },
};

// 安全工具类
export class SecurityUtils {
  /**
   * 生成安全的随机字符串
   */
  static generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    
    // 使用crypto API如果可用
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // 回退到Math.random
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): {
    score: number;
    isValid: boolean;
    feedback: string[];
    suggestions: string[];
  } {
    const feedback: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length < SECURITY_CONFIG.password.minLength) {
      feedback.push(`密码长度至少${SECURITY_CONFIG.password.minLength}位`);
      suggestions.push('使用更长的密码');
    } else {
      score += 1;
    }

    // 大写字母
    if (SECURITY_CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('密码必须包含大写字母');
      suggestions.push('添加大写字母');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // 小写字母
    if (SECURITY_CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('密码必须包含小写字母');
      suggestions.push('添加小写字母');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    // 数字
    if (SECURITY_CONFIG.password.requireNumbers && !/\d/.test(password)) {
      feedback.push('密码必须包含数字');
      suggestions.push('添加数字');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    // 特殊字符
    if (SECURITY_CONFIG.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('密码必须包含特殊字符');
      suggestions.push('添加特殊字符 (!@#$%^&*等)');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    }

    // 常见密码检查
    if (SECURITY_CONFIG.password.commonPasswordsCheck) {
      const commonPasswords = [
        'password', '123456', '12345678', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', '123456789'
      ];
      
      if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        feedback.push('不要使用常见密码');
        suggestions.push('避免使用常见密码组合');
        score = Math.max(0, score - 2);
      }
    }

    // 重复字符检查
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('避免连续重复字符');
      suggestions.push('减少重复字符');
      score = Math.max(0, score - 1);
    }

    const isValid = feedback.length === 0 && score >= 4;

    return {
      score: Math.min(5, Math.max(0, score)),
      isValid,
      feedback,
      suggestions,
    };
  }

  /**
   * 安全地清除敏感数据
   */
  static secureClear(obj: any): void {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          // 用随机字符覆盖字符串
          obj[key] = this.generateSecureRandom(obj[key].length);
        }
        delete obj[key];
      });
    }
  }

  /**
   * 检查是否为安全上下文（HTTPS）
   */
  static isSecureContext(): boolean {
    return typeof window !== 'undefined' && 
           (window.location.protocol === 'https:' || 
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1');
  }

  /**
   * 验证令牌格式
   */
  static validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // JWT格式验证
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      // 验证每个部分都是有效的Base64
      parts.forEach(part => {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 计算密码熵
   */
  static calculatePasswordEntropy(password: string): number {
    const charSets = [
      { regex: /[a-z]/, size: 26 },
      { regex: /[A-Z]/, size: 26 },
      { regex: /[0-9]/, size: 10 },
      { regex: /[^a-zA-Z0-9]/, size: 32 },
    ];

    let charSetSize = 0;
    charSets.forEach(set => {
      if (set.regex.test(password)) {
        charSetSize += set.size;
      }
    });

    return password.length * Math.log2(charSetSize);
  }

  /**
   * 检测可疑活动
   */
  static detectSuspiciousActivity(activities: Array<{
    timestamp: number;
    type: string;
    success: boolean;
    ip?: string;
    userAgent?: string;
  }>): boolean {
    const now = Date.now();
    const recentActivities = activities.filter(
      activity => now - activity.timestamp < SECURITY_CONFIG.login.attemptWindow * 1000
    );

    // 检查失败登录尝试
    const failedAttempts = recentActivities.filter(
      activity => activity.type === 'login' && !activity.success
    );

    if (failedAttempts.length >= SECURITY_CONFIG.login.maxAttempts) {
      return true;
    }

    // 检查来自多个IP的尝试
    const uniqueIPs = new Set(recentActivities.map(activity => activity.ip).filter(Boolean));
    if (uniqueIPs.size > 3) {
      return true;
    }

    // 检查异常用户代理
    const userAgents = recentActivities.map(activity => activity.userAgent).filter(Boolean);
    const uniqueUserAgents = new Set(userAgents);
    if (uniqueUserAgents.size > 2) {
      return true;
    }

    return false;
  }
}

// 输入清理工具
export class InputSanitizer {
  /**
   * 清理HTML输入
   */
  static sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * 清理SQL注入风险字符
   */
  static sanitizeSQL(input: string): string {
    return input.replace(/[';\\]/g, '');
  }

  /**
   * 清理XSS风险字符
   */
  static sanitizeXSS(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 验证邮箱格式并清理
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '');
  }

  /**
   * 验证用户名并清理
   */
  static sanitizeUsername(username: string): string {
    return username.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fa5_]/g, '');
  }
}

// 内容安全策略（CSP）配置
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", process.env.VITE_API_BASE_URL || 'http://localhost:3001'],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
};

// 获取CSP字符串
export function getCSPString(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

// 安全头部配置
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};