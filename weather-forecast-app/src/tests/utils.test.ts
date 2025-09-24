import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataFormatter, TimeUtils, StorageManager } from '../utils';

describe('DataFormatter', () => {
  describe('formatTemperature', () => {
    it('应该正确格式化摄氏度', () => {
      expect(DataFormatter.formatTemperature(25)).toBe('25°C');
      expect(DataFormatter.formatTemperature(25.7)).toBe('26°C');
      expect(DataFormatter.formatTemperature(-5.3)).toBe('-5°C');
    });

    it('应该正确格式化华氏度', () => {
      expect(DataFormatter.formatTemperature(25, 'fahrenheit')).toBe('77°F');
      expect(DataFormatter.formatTemperature(0, 'fahrenheit')).toBe('32°F');
    });
  });

  describe('formatWindSpeed', () => {
    it('应该正确格式化不同单位的风速', () => {
      expect(DataFormatter.formatWindSpeed(36)).toBe('36 km/h');
      expect(DataFormatter.formatWindSpeed(36, 'mph')).toBe('22 mph');
      expect(DataFormatter.formatWindSpeed(36, 'ms')).toBe('10 m/s');
    });
  });

  describe('formatUVIndex', () => {
    it('应该正确分类紫外线指数', () => {
      const low = DataFormatter.formatUVIndex(1);
      expect(low.level).toBe('低');
      expect(low.color).toBe('#4CAF50');

      const high = DataFormatter.formatUVIndex(8);
      expect(high.level).toBe('很高');
      expect(high.color).toBe('#9C27B0');
    });
  });

  describe('formatAQI', () => {
    it('应该正确分类空气质量指数', () => {
      const good = DataFormatter.formatAQI(30);
      expect(good.level).toBe('优');
      expect(good.color).toBe('#4CAF50');

      const unhealthy = DataFormatter.formatAQI(180);
      expect(unhealthy.level).toBe('中度污染');
      expect(unhealthy.color).toBe('#F44336');
    });
  });
});

describe('TimeUtils', () => {
  describe('formatTime', () => {
    it('应该正确格式化24小时制时间', () => {
      const date = new Date('2024-01-01T14:30:00');
      expect(TimeUtils.formatTime(date, true)).toBe('14:30');
    });

    it('应该正确格式化12小时制时间', () => {
      const date = new Date('2024-01-01T14:30:00');
      const result = TimeUtils.formatTime(date, false);
      expect(result).toMatch(/下午|PM/);
    });
  });

  describe('getRelativeTime', () => {
    it('应该返回相对时间描述', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneHourAgo = new Date(now.getTime() - 3600000);

      expect(TimeUtils.getRelativeTime(oneMinuteAgo)).toBe('1分钟前');
      expect(TimeUtils.getRelativeTime(oneHourAgo)).toBe('1小时前');
    });
  });

  describe('isToday', () => {
    it('应该正确判断是否为今天', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      expect(TimeUtils.isToday(today)).toBe(true);
      expect(TimeUtils.isToday(yesterday)).toBe(false);
    });
  });
});

describe('StorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('save and load', () => {
    it('应该能保存和读取数据', () => {
      const testData = { test: 'value', number: 123 };
      
      StorageManager.save('test-key', testData);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );

      // Mock localStorage.getItem 返回值
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(testData));
      
      const result = StorageManager.load('test-key');
      expect(result).toEqual(testData);
    });

    it('应该处理无效数据', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid json');
      
      const result = StorageManager.load('invalid-key');
      expect(result).toBeNull();
    });
  });

  describe('saveCache and loadCache', () => {
    it('应该能保存和读取缓存数据', () => {
      const testData = { cached: 'data' };
      
      StorageManager.saveCache('cache-key', testData, 30);
      
      // 验证缓存数据结构
      const savedArgs = vi.mocked(localStorage.setItem).mock.calls[0];
      const savedData = JSON.parse(savedArgs[1]);
      
      expect(savedData.data).toEqual(testData);
      expect(savedData.timestamp).toBeDefined();
      expect(savedData.expiry).toBeDefined();
    });

    it('应该正确处理过期缓存', () => {
      const expiredCache = {
        data: { test: 'data' },
        timestamp: new Date(Date.now() - 60000).toISOString(),
        expiry: new Date(Date.now() - 30000).toISOString()
      };
      
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(expiredCache));
      
      const result = StorageManager.loadCache('expired-key');
      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('expired-key');
    });
  });
});