import { describe, it, expect } from 'vitest';
import { 
  formatDate, 
  formatRelativeTime, 
  truncateText, 
  isValidEmail, 
  calculateReadTime,
  slugify 
} from '../utils/helpers';

describe('Helper Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-10-01T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toContain('2023');
      expect(formatted).toContain('10');
      expect(formatted).toContain('1');
    });

    it('should handle string input', () => {
      const formatted = formatDate('2023-10-01');
      expect(formatted).toContain('2023');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "刚刚" for recent time', () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      expect(result).toBe('刚刚');
    });

    it('should return minutes for time within an hour', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toBe('5分钟前');
    });

    it('should return hours for time within a day', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toBe('2小时前');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateText(longText, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      const result = truncateText(shortText, 20);
      expect(result).toBe('Short text');
    });

    it('should use custom suffix', () => {
      const text = 'This is a long text';
      const result = truncateText(text, 10, '---');
      expect(result).toBe('This i---');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('calculateReadTime', () => {
    it('should calculate read time for Chinese text', () => {
      const chineseText = '这是一篇中文文章，包含很多中文字符。'.repeat(10);
      const readTime = calculateReadTime(chineseText, 200);
      expect(readTime).toBeGreaterThan(0);
    });

    it('should calculate read time for English text', () => {
      const englishText = 'This is an English article with many words. '.repeat(20);
      const readTime = calculateReadTime(englishText, 200);
      expect(readTime).toBeGreaterThan(0);
    });

    it('should handle HTML content', () => {
      const htmlContent = '<p>This is a <strong>HTML</strong> content with <em>tags</em>.</p>';
      const readTime = calculateReadTime(htmlContent);
      expect(readTime).toBe(1); // Should be at least 1 minute
    });
  });

  describe('slugify', () => {
    it('should convert text to URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('React 18 新特性')).toBe('react-18-新特性');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
      expect(slugify('Test@Example.com')).toBe('test-example-com');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });
});