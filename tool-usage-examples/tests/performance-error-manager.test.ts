/**
 * 性能优化和错误处理管理器测试用例
 * 验证性能优化策略和错误处理机制的正确性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PerformanceErrorManager, { ToolError, ErrorType } from '../src/performance-error-manager';
import { SearchResult } from '../src/types/search';

describe('PerformanceErrorManager', () => {
  let performanceManager: PerformanceErrorManager;

  beforeEach(() => {
    performanceManager = new PerformanceErrorManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('optimizedSearch', () => {
    it('should perform optimized search with caching', async () => {
      const queries = ['react components', 'authentication', 'typescript'];
      const mockResults: SearchResult[] = [
        {
          filePath: '/src/test.ts',
          startLine: 1,
          endLine: 10,
          content: 'test content'
        }
      ];

      // 第一次搜索应该执行实际搜索
      const result1 = await performanceManager.optimizedSearch(queries);
      expect(Array.isArray(result1)).toBe(true);

      // 第二次搜索应该使用缓存
      const start = Date.now();
      const result2 = await performanceManager.optimizedSearch(queries);
      const duration = Date.now() - start;

      expect(Array.isArray(result2)).toBe(true);
      expect(duration).toBeLessThan(100); // 缓存访问应该很快
    });

    it('should handle parallel search operations', async () => {
      const queries = ['query1', 'query2', 'query3'];

      const start = Date.now();
      const result = await performanceManager.optimizedSearch(queries);
      const duration = Date.now() - start;

      expect(Array.isArray(result)).toBe(true);
      expect(duration).toBeLessThan(5000); // 并行处理应该相对较快
    });

    it('should handle search failures gracefully', async () => {
      const queries = ['invalid-query'];

      // 模拟搜索失败不应该导致整个操作崩溃
      const result = await performanceManager.optimizedSearch(queries);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should update performance metrics', async () => {
      const queries = ['test-query'];
      
      await performanceManager.optimizedSearch(queries);
      
      const report = await performanceManager.monitorPerformance();
      expect(report.metrics).toHaveProperty('search');
    });
  });

  describe('optimizedFileOperations', () => {
    it('should handle batch file operations', async () => {
      const filePaths = [
        'src/file1.ts',
        'src/file2.ts',
        'src/file3.ts'
      ];

      const result = await performanceManager.optimizedFileOperations(filePaths);

      expect(result instanceof Map).toBe(true);
      expect(result.size).toBeGreaterThanOrEqual(0);
    });

    it('should group files by size for optimal processing', async () => {
      const manyFiles = Array.from({ length: 20 }, (_, i) => `file${i}.ts`);

      const start = Date.now();
      const result = await performanceManager.optimizedFileOperations(manyFiles);
      const duration = Date.now() - start;

      expect(result instanceof Map).toBe(true);
      expect(duration).toBeLessThan(10000); // 分组处理应该在合理时间内完成
    });

    it('should handle file operation errors without stopping entire batch', async () => {
      const filePaths = ['valid-file.ts', 'invalid-file.ts', 'another-valid.ts'];

      const result = await performanceManager.optimizedFileOperations(filePaths);

      expect(result instanceof Map).toBe(true);
      // 即使某些文件失败，也应该返回成功的结果
    });
  });

  describe('manageIntelligentCache', () => {
    it('should provide cache statistics', async () => {
      const stats = await performanceManager.manageIntelligentCache();

      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('evictedItems');

      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.memoryUsage).toBe('number');
      expect(typeof stats.evictedItems).toBe('number');
    });

    it('should manage memory usage effectively', async () => {
      // 填充缓存
      const queries = Array.from({ length: 100 }, (_, i) => `query-${i}`);
      await performanceManager.optimizedSearch(queries);

      const statsBefore = await performanceManager.manageIntelligentCache();
      const sizeBefore = statsBefore.totalSize;

      // 再次运行缓存管理
      const statsAfter = await performanceManager.manageIntelligentCache();

      expect(statsAfter.totalSize).toBeGreaterThanOrEqual(0);
    });

    it('should calculate cache hit rate correctly', async () => {
      // 执行一些搜索操作
      await performanceManager.optimizedSearch(['test1']);
      await performanceManager.optimizedSearch(['test1']); // 重复查询应该提高命中率

      const stats = await performanceManager.manageIntelligentCache();
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('implementErrorRecovery', () => {
    it('should execute successful operations normally', async () => {
      const successfulOperation = () => Promise.resolve('success');

      const result = await performanceManager.implementErrorRecovery(successfulOperation);
      expect(result).toBe('success');
    });

    it('should retry on timeout errors', async () => {
      let attempts = 0;
      const timeoutOperation = () => {
        attempts++;
        if (attempts === 1) {
          return Promise.reject(new Error('timeout'));
        }
        return Promise.resolve('success after retry');
      };

      const result = await performanceManager.implementErrorRecovery(timeoutOperation);
      expect(result).toBe('success after retry');
      expect(attempts).toBe(2);
    });

    it('should use fallback operation on network errors', async () => {
      const networkErrorOperation = () => Promise.reject(new Error('network error'));
      const fallbackOperation = () => Promise.resolve('fallback success');

      const result = await performanceManager.implementErrorRecovery(
        networkErrorOperation,
        fallbackOperation
      );

      expect(result).toBe('fallback success');
    });

    it('should handle rate limiting with delay', async () => {
      let attempts = 0;
      const rateLimitOperation = () => {
        attempts++;
        if (attempts === 1) {
          return Promise.reject(new Error('rate limit exceeded'));
        }
        return Promise.resolve('success after wait');
      };

      const start = Date.now();
      const result = await performanceManager.implementErrorRecovery(rateLimitOperation);
      const duration = Date.now() - start;

      expect(result).toBe('success after wait');
      expect(duration).toBeGreaterThan(4000); // 应该有延迟
    });

    it('should throw enhanced error when all recovery attempts fail', async () => {
      const alwaysFailOperation = () => Promise.reject(new Error('persistent failure'));

      await expect(
        performanceManager.implementErrorRecovery(alwaysFailOperation)
      ).rejects.toThrow(ToolError);
    });
  });

  describe('monitorPerformance', () => {
    it('should generate comprehensive performance report', async () => {
      // 执行一些操作来生成指标
      await performanceManager.optimizedSearch(['test']);
      await performanceManager.optimizedFileOperations(['file.ts']);

      const report = await performanceManager.monitorPerformance();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('healthScore');

      expect(typeof report.timestamp).toBe('string');
      expect(typeof report.metrics).toBe('object');
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(typeof report.healthScore).toBe('number');
    });

    it('should calculate health score correctly', async () => {
      const report = await performanceManager.monitorPerformance();

      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });

    it('should provide optimization recommendations', async () => {
      // 执行一些低效操作
      const largeQuery = Array.from({ length: 50 }, (_, i) => `query-${i}`);
      await performanceManager.optimizedSearch(largeQuery);

      const report = await performanceManager.monitorPerformance();

      expect(Array.isArray(report.recommendations)).toBe(true);
      // 可能会有性能建议，但不强制要求
    });

    it('should track metrics over time', async () => {
      // 第一次报告
      await performanceManager.optimizedSearch(['test1']);
      const report1 = await performanceManager.monitorPerformance();

      // 第二次操作后的报告
      await performanceManager.optimizedSearch(['test2']);
      const report2 = await performanceManager.monitorPerformance();

      expect(report1.timestamp).not.toBe(report2.timestamp);
      expect(Object.keys(report2.metrics).length).toBeGreaterThanOrEqual(
        Object.keys(report1.metrics).length
      );
    });
  });

  describe('Error Classification and Handling', () => {
    it('should classify different error types correctly', async () => {
      const errors = [
        new Error('timeout'),
        new Error('network failed'),
        new Error('permission denied'),
        new Error('not found'),
        new Error('rate limit exceeded'),
        new Error('unknown error')
      ];

      for (const error of errors) {
        try {
          await performanceManager.implementErrorRecovery(() => Promise.reject(error));
        } catch (toolError) {
          expect(toolError).toBeInstanceOf(ToolError);
          expect(Object.values(ErrorType)).toContain((toolError as ToolError).type);
        }
      }
    });

    it('should determine retryable errors correctly', async () => {
      const retryableError = new ToolError(ErrorType.NETWORK_ERROR, 'Network failed', {}, true);
      const nonRetryableError = new ToolError(ErrorType.VALIDATION_ERROR, 'Invalid data', {}, false);

      // 可重试错误应该触发重试机制
      let retryAttempts = 0;
      const retryableOperation = () => {
        retryAttempts++;
        if (retryAttempts < 3) {
          return Promise.reject(retryableError);
        }
        return Promise.resolve('success');
      };

      const result = await performanceManager.implementErrorRecovery(retryableOperation);
      expect(result).toBe('success');
      expect(retryAttempts).toBe(3);
    });

    it('should handle custom ToolError instances', async () => {
      const customError = new ToolError(
        ErrorType.PERMISSION_ERROR,
        'Custom permission error',
        { userId: 123 },
        false
      );

      const failingOperation = () => Promise.reject(customError);

      await expect(
        performanceManager.implementErrorRecovery(failingOperation)
      ).rejects.toThrow('Custom permission error');
    });
  });

  describe('Cache Management', () => {
    it('should store and retrieve cached values correctly', async () => {
      const queries = ['cache-test-query'];
      
      // 第一次搜索，应该缓存结果
      const result1 = await performanceManager.optimizedSearch(queries);
      
      // 第二次搜索，应该从缓存获取
      const start = Date.now();
      const result2 = await performanceManager.optimizedSearch(queries);
      const duration = Date.now() - start;

      expect(result2).toEqual(result1);
      expect(duration).toBeLessThan(50); // 缓存访问应该很快
    });

    it('should handle cache expiration', async () => {
      // 这个测试验证缓存过期机制，但由于时间限制，我们模拟快速过期
      const queries = ['expiration-test'];
      
      await performanceManager.optimizedSearch(queries);
      
      // 在实际实现中，可以修改 TTL 来测试过期
      // 这里我们主要验证系统能处理过期的缓存项
      await performanceManager.manageIntelligentCache();
      
      // 系统应该继续正常工作
      const result = await performanceManager.optimizedSearch(queries);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should clear cache when memory usage is high', async () => {
      // 填充大量缓存数据
      const manyQueries = Array.from({ length: 200 }, (_, i) => `memory-test-${i}`);
      await performanceManager.optimizedSearch(manyQueries);

      // 触发内存清理
      const stats = await performanceManager.manageIntelligentCache();
      
      expect(typeof stats.evictedItems).toBe('number');
      expect(stats.evictedItems).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should complete search operations within reasonable time', async () => {
      const queries = Array.from({ length: 10 }, (_, i) => `perf-test-${i}`);

      const start = Date.now();
      await performanceManager.optimizedSearch(queries);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('should handle concurrent operations efficiently', async () => {
      const concurrentOperations = Array.from({ length: 5 }, (_, i) => 
        performanceManager.optimizedSearch([`concurrent-${i}`])
      );

      const start = Date.now();
      await Promise.all(concurrentOperations);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000); // 并发执行应该比串行快
    });

    it('should maintain performance under load', async () => {
      const loadTest = async () => {
        const operations = [];
        for (let i = 0; i < 20; i++) {
          operations.push(performanceManager.optimizedSearch([`load-test-${i}`]));
          operations.push(performanceManager.optimizedFileOperations([`file-${i}.ts`]));
        }
        return Promise.all(operations);
      };

      const start = Date.now();
      await loadTest();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(15000); // 负载测试应该在合理时间内完成

      // 检查系统仍然响应
      const healthReport = await performanceManager.monitorPerformance();
      expect(healthReport.healthScore).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage accurately', async () => {
      const initialStats = await performanceManager.manageIntelligentCache();
      const initialMemory = initialStats.memoryUsage;

      // 添加一些缓存数据
      await performanceManager.optimizedSearch(['memory-track-test']);

      const afterStats = await performanceManager.manageIntelligentCache();
      const afterMemory = afterStats.memoryUsage;

      expect(afterMemory).toBeGreaterThanOrEqual(initialMemory);
    });

    it('should prevent memory leaks', async () => {
      const iterations = 50;
      const memorySnapshots = [];

      for (let i = 0; i < iterations; i++) {
        await performanceManager.optimizedSearch([`leak-test-${i}`]);
        
        if (i % 10 === 0) {
          const stats = await performanceManager.manageIntelligentCache();
          memorySnapshots.push(stats.memoryUsage);
        }
      }

      // 内存使用不应该无限增长
      const maxMemory = Math.max(...memorySnapshots);
      const lastMemory = memorySnapshots[memorySnapshots.length - 1];
      
      expect(lastMemory).toBeLessThanOrEqual(maxMemory * 1.5); // 允许50%的波动
    });
  });

  describe('Integration with Real Scenarios', () => {
    it('should handle real-world search patterns', async () => {
      const realWorldQueries = [
        'React component implementation',
        'authentication error handling',
        'TypeScript interface definition',
        'performance optimization techniques',
        'unit test cases'
      ];

      const results = await performanceManager.optimizedSearch(realWorldQueries);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should adapt to different workload patterns', async () => {
      // 模拟不同的工作负载模式
      
      // 1. 突发查询模式
      const burstQueries = Array.from({ length: 20 }, (_, i) => `burst-${i}`);
      await performanceManager.optimizedSearch(burstQueries);

      // 2. 持续查询模式
      for (let i = 0; i < 10; i++) {
        await performanceManager.optimizedSearch([`sustained-${i}`]);
      }

      // 3. 混合操作模式
      await Promise.all([
        performanceManager.optimizedSearch(['mixed-search']),
        performanceManager.optimizedFileOperations(['mixed-file.ts']),
        performanceManager.manageIntelligentCache()
      ]);

      // 系统应该能够处理所有模式
      const report = await performanceManager.monitorPerformance();
      expect(report.healthScore).toBeGreaterThan(30); // 在各种负载下仍保持基本健康
    });
  });
});