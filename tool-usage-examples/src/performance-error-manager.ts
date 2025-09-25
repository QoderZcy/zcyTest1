/**
 * 性能优化和错误处理机制实现
 * 提供全面的性能优化策略和错误处理最佳实践
 */

import { SearchResult, WebSearchResult, FetchContentResult } from './types/search';

// 性能监控接口
interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  successRate: number;
  errorCount: number;
  cacheHitRate: number;
}

// 缓存接口
interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  clear(): void;
  size(): number;
}

// 错误类型定义
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 自定义错误类
class ToolError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

/**
 * 性能优化和错误处理管理器
 * 提供统一的性能监控、缓存管理和错误处理机制
 */
export class PerformanceErrorManager {
  private cache: CacheManager;
  private metrics: Map<string, PerformanceMetrics>;
  private retryConfig: RetryConfig;
  private timeoutConfig: TimeoutConfig;

  constructor() {
    this.cache = new InMemoryCache();
    this.metrics = new Map();
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    };
    this.timeoutConfig = {
      search: 30000,      // 30秒
      fetch: 60000,       // 60秒
      fileRead: 10000,    // 10秒
      fileWrite: 15000    // 15秒
    };
  }

  /**
   * 示例 1: 性能优化的搜索操作
   * 场景：使用缓存和并行处理优化搜索性能
   */
  async optimizedSearch(queries: string[]): Promise<SearchResult[]> {
    console.log('⚡ 开始优化搜索操作...');
    
    const startTime = Date.now();
    const results: SearchResult[] = [];
    const errors: Error[] = [];

    try {
      // 1. 检查缓存
      const cachedResults = queries
        .map(query => ({
          query,
          cached: this.cache.get<SearchResult[]>(`search:${query}`)
        }))
        .filter(item => item.cached !== null);

      const uncachedQueries = queries.filter(query => 
        !this.cache.get(`search:${query}`)
      );

      console.log(`缓存命中: ${cachedResults.length}/${queries.length}`);

      // 2. 并行处理未缓存的查询
      if (uncachedQueries.length > 0) {
        const searchPromises = uncachedQueries.map(query =>
          this.performSearchWithRetry(query)
        );

        const batchResults = await Promise.allSettled(searchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const queryResults = result.value;
            results.push(...queryResults);
            
            // 缓存成功的结果
            this.cache.set(
              `search:${uncachedQueries[index]}`, 
              queryResults, 
              300000 // 5分钟缓存
            );
          } else {
            errors.push(result.reason);
          }
        });
      }

      // 3. 添加缓存的结果
      cachedResults.forEach(item => {
        if (item.cached) {
          results.push(...item.cached);
        }
      });

      // 4. 记录性能指标
      const executionTime = Date.now() - startTime;
      this.updateMetrics('search', {
        executionTime,
        successRate: (queries.length - errors.length) / queries.length,
        errorCount: errors.length,
        cacheHitRate: cachedResults.length / queries.length
      });

      console.log(`搜索完成: ${results.length} 个结果, ${executionTime}ms`);
      return results;

    } catch (error) {
      throw this.handleError(error, 'optimizedSearch');
    }
  }

  /**
   * 示例 2: 带重试机制的搜索
   * 场景：网络不稳定时自动重试搜索请求
   */
  private async performSearchWithRetry(query: string): Promise<SearchResult[]> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        console.log(`执行搜索 (第${attempt}次尝试): ${query}`);
        
        // 模拟搜索操作（实际项目中这里会调用真实的搜索 API）
        const results = await this.simulateSearch(query);
        
        console.log(`搜索成功: ${query} - ${results.length} 个结果`);
        return results;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`搜索失败 (第${attempt}次尝试): ${error.message}`);
        
        // 检查是否可重试
        if (!this.isRetryableError(error) || attempt === this.retryConfig.maxAttempts) {
          break;
        }
        
        // 计算退避延迟
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        console.log(`等待 ${delay}ms 后重试...`);
        await this.sleep(delay);
      }
    }
    
    throw new ToolError(
      ErrorType.NETWORK_ERROR,
      `搜索失败，已重试 ${this.retryConfig.maxAttempts} 次: ${lastError.message}`,
      { query, attempts: this.retryConfig.maxAttempts },
      false
    );
  }

  /**
   * 示例 3: 优化的并行文件操作
   * 场景：批量处理文件时的性能优化
   */
  async optimizedFileOperations(filePaths: string[]): Promise<Map<string, string>> {
    console.log('📁 开始优化文件操作...');
    
    const startTime = Date.now();
    const results = new Map<string, string>();
    const errors: Error[] = [];

    try {
      // 1. 按文件大小分组（避免同时加载过多大文件）
      const fileGroups = await this.groupFilesBySize(filePaths);
      
      // 2. 按组并行处理
      for (const group of fileGroups) {
        const groupPromises = group.map(filePath =>
          this.readFileWithCache(filePath)
        );
        
        const groupResults = await Promise.allSettled(groupPromises);
        
        groupResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.set(group[index], result.value);
          } else {
            errors.push(result.reason);
            console.error(`读取文件失败: ${group[index]}`, result.reason);
          }
        });
        
        // 组间添加短暂延迟，避免过载
        if (fileGroups.indexOf(group) < fileGroups.length - 1) {
          await this.sleep(100);
        }
      }

      // 3. 记录性能指标
      const executionTime = Date.now() - startTime;
      this.updateMetrics('fileOperations', {
        executionTime,
        successRate: results.size / filePaths.length,
        errorCount: errors.length,
        cacheHitRate: this.calculateCacheHitRate(filePaths)
      });

      console.log(`文件操作完成: ${results.size}/${filePaths.length} 个文件, ${executionTime}ms`);
      return results;

    } catch (error) {
      throw this.handleError(error, 'optimizedFileOperations');
    }
  }

  /**
   * 示例 4: 智能缓存管理
   * 场景：根据访问模式和内存使用情况智能管理缓存
   */
  async manageIntelligentCache(): Promise<CacheStats> {
    console.log('💾 开始智能缓存管理...');
    
    const stats: CacheStats = {
      totalSize: this.cache.size(),
      hitRate: 0,
      memoryUsage: 0,
      evictedItems: 0
    };

    try {
      // 1. 检查内存使用情况
      const memoryUsage = this.estimateMemoryUsage();
      stats.memoryUsage = memoryUsage;

      // 2. 如果内存使用过高，执行清理策略
      if (memoryUsage > 100 * 1024 * 1024) { // 100MB
        console.log('内存使用过高，开始缓存清理...');
        stats.evictedItems = await this.evictLeastUsedCache();
      }

      // 3. 预加载热点数据
      await this.preloadHotData();

      // 4. 计算缓存命中率
      stats.hitRate = this.calculateOverallCacheHitRate();

      console.log('缓存管理完成:', stats);
      return stats;

    } catch (error) {
      throw this.handleError(error, 'manageIntelligentCache');
    }
  }

  /**
   * 示例 5: 错误恢复机制
   * 场景：系统错误时的自动恢复策略
   */
  async implementErrorRecovery<T>(
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<T> {
    console.log('🛡️ 开始错误恢复操作...');

    try {
      // 1. 尝试主要操作
      return await this.executeWithTimeout(operation, 30000);
      
    } catch (primaryError) {
      console.warn('主要操作失败:', primaryError);
      
      // 2. 分析错误类型
      const errorInfo = this.analyzeError(primaryError);
      
      // 3. 根据错误类型选择恢复策略
      switch (errorInfo.type) {
        case ErrorType.TIMEOUT_ERROR:
          console.log('超时错误，尝试增加超时时间重试...');
          return await this.executeWithTimeout(operation, 60000);
          
        case ErrorType.NETWORK_ERROR:
          console.log('网络错误，尝试备用操作...');
          if (fallbackOperation) {
            return await fallbackOperation();
          }
          break;
          
        case ErrorType.RATE_LIMIT_ERROR:
          console.log('限流错误，等待后重试...');
          await this.sleep(5000);
          return await operation();
          
        case ErrorType.PERMISSION_ERROR:
          console.log('权限错误，尝试降级操作...');
          return await this.performDegradedOperation();
          
        default:
          console.log('未知错误类型，执行默认恢复策略...');
      }
      
      // 4. 如果所有恢复策略都失败，抛出增强的错误信息
      throw new ToolError(
        errorInfo.type,
        `操作失败且无法恢复: ${errorInfo.message}`,
        {
          originalError: primaryError,
          recoveryAttempted: true,
          timestamp: new Date().toISOString()
        },
        false
      );
    }
  }

  /**
   * 示例 6: 性能监控和分析
   * 场景：实时监控工具性能并提供优化建议
   */
  async monitorPerformance(): Promise<PerformanceReport> {
    console.log('📊 开始性能监控分析...');

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      metrics: {},
      recommendations: [],
      healthScore: 0
    };

    try {
      // 1. 收集所有操作的性能指标
      for (const [operation, metrics] of this.metrics.entries()) {
        report.metrics[operation] = { ...metrics };
      }

      // 2. 分析性能趋势
      const performanceAnalysis = this.analyzePerformanceTrends();
      
      // 3. 生成优化建议
      report.recommendations = this.generateOptimizationRecommendations(performanceAnalysis);
      
      // 4. 计算健康度评分
      report.healthScore = this.calculateHealthScore(report.metrics);

      // 5. 检查是否需要告警
      if (report.healthScore < 70) {
        console.warn('性能健康度较低，建议优化:', report.recommendations);
      }

      return report;

    } catch (error) {
      throw this.handleError(error, 'monitorPerformance');
    }
  }

  // 私有辅助方法

  private async simulateSearch(query: string): Promise<SearchResult[]> {
    // 模拟网络延迟
    await this.sleep(Math.random() * 1000 + 500);
    
    // 模拟偶发错误
    if (Math.random() < 0.1) {
      throw new Error('模拟网络错误');
    }
    
    return [
      {
        filePath: `/mock/result/${query}.ts`,
        startLine: 1,
        endLine: 10,
        content: `Mock search result for: ${query}`
      }
    ];
  }

  private async groupFilesBySize(filePaths: string[]): Promise<string[][]> {
    // 简化实现：按文件路径长度分组（实际应该检查真实文件大小）
    const groups: string[][] = [];
    const groupSize = 3; // 每组最多3个文件
    
    for (let i = 0; i < filePaths.length; i += groupSize) {
      groups.push(filePaths.slice(i, i + groupSize));
    }
    
    return groups;
  }

  private async readFileWithCache(filePath: string): Promise<string> {
    // 检查缓存
    const cached = this.cache.get<string>(`file:${filePath}`);
    if (cached) {
      return cached;
    }
    
    // 模拟文件读取
    await this.sleep(100);
    const content = `Mock file content for: ${filePath}`;
    
    // 缓存结果
    this.cache.set(`file:${filePath}`, content, 600000); // 10分钟缓存
    
    return content;
  }

  private calculateCacheHitRate(items: string[]): number {
    const hits = items.filter(item => this.cache.get(`file:${item}`)).length;
    return hits / items.length;
  }

  private estimateMemoryUsage(): number {
    // 简化的内存使用估算
    return this.cache.size() * 1024; // 假设每个缓存项平均1KB
  }

  private async evictLeastUsedCache(): Promise<number> {
    // 简化的LRU缓存清理
    const sizeBefore = this.cache.size();
    // 实际实现中应该根据使用频率清理
    this.cache.clear();
    return sizeBefore;
  }

  private async preloadHotData(): Promise<void> {
    // 预加载热点数据的逻辑
    console.log('预加载热点数据...');
  }

  private calculateOverallCacheHitRate(): number {
    const allMetrics = Array.from(this.metrics.values());
    const totalHitRate = allMetrics.reduce((sum, metric) => sum + metric.cacheHitRate, 0);
    return allMetrics.length > 0 ? totalHitRate / allMetrics.length : 0;
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new ToolError(ErrorType.TIMEOUT_ERROR, `操作超时: ${timeout}ms`)), timeout)
      )
    ]);
  }

  private analyzeError(error: any): { type: ErrorType; message: string } {
    if (error instanceof ToolError) {
      return { type: error.type, message: error.message };
    }
    
    const message = error.message || '未知错误';
    
    if (message.includes('timeout')) {
      return { type: ErrorType.TIMEOUT_ERROR, message };
    }
    if (message.includes('network') || message.includes('fetch')) {
      return { type: ErrorType.NETWORK_ERROR, message };
    }
    if (message.includes('permission') || message.includes('access')) {
      return { type: ErrorType.PERMISSION_ERROR, message };
    }
    if (message.includes('not found') || message.includes('404')) {
      return { type: ErrorType.NOT_FOUND_ERROR, message };
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return { type: ErrorType.RATE_LIMIT_ERROR, message };
    }
    
    return { type: ErrorType.UNKNOWN_ERROR, message };
  }

  private async performDegradedOperation<T>(): Promise<T> {
    // 降级操作的实现
    throw new ToolError(ErrorType.PERMISSION_ERROR, '无法执行降级操作');
  }

  private analyzePerformanceTrends(): PerformanceTrend[] {
    return Array.from(this.metrics.entries()).map(([operation, metrics]) => ({
      operation,
      trend: metrics.executionTime > 5000 ? 'deteriorating' : 'stable',
      avgExecutionTime: metrics.executionTime,
      successRate: metrics.successRate
    }));
  }

  private generateOptimizationRecommendations(trends: PerformanceTrend[]): string[] {
    const recommendations: string[] = [];
    
    trends.forEach(trend => {
      if (trend.avgExecutionTime > 10000) {
        recommendations.push(`${trend.operation}: 执行时间过长，考虑增加缓存或优化算法`);
      }
      if (trend.successRate < 0.9) {
        recommendations.push(`${trend.operation}: 成功率较低，检查错误处理和重试机制`);
      }
    });
    
    return recommendations;
  }

  private calculateHealthScore(metrics: Record<string, PerformanceMetrics>): number {
    const scores = Object.values(metrics).map(metric => {
      let score = 100;
      
      // 执行时间评分
      if (metric.executionTime > 10000) score -= 30;
      else if (metric.executionTime > 5000) score -= 15;
      
      // 成功率评分
      if (metric.successRate < 0.8) score -= 40;
      else if (metric.successRate < 0.9) score -= 20;
      
      // 缓存命中率评分
      if (metric.cacheHitRate < 0.5) score -= 20;
      else if (metric.cacheHitRate < 0.7) score -= 10;
      
      return Math.max(0, score);
    });
    
    return scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 100;
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof ToolError) {
      return error.retryable;
    }
    
    const message = error.message || '';
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('500') ||
           message.includes('502') ||
           message.includes('503');
  }

  private handleError(error: any, context: string): Error {
    const errorInfo = this.analyzeError(error);
    
    // 记录错误指标
    const currentMetrics = this.metrics.get(context) || this.createDefaultMetrics();
    currentMetrics.errorCount++;
    this.metrics.set(context, currentMetrics);
    
    console.error(`[${context}] 操作失败:`, errorInfo);
    
    return new ToolError(
      errorInfo.type,
      `${context} 操作失败: ${errorInfo.message}`,
      { context, originalError: error },
      this.isRetryableError(error)
    );
  }

  private updateMetrics(operation: string, updates: Partial<PerformanceMetrics>): void {
    const current = this.metrics.get(operation) || this.createDefaultMetrics();
    this.metrics.set(operation, { ...current, ...updates });
  }

  private createDefaultMetrics(): PerformanceMetrics {
    return {
      executionTime: 0,
      memoryUsage: 0,
      successRate: 1,
      errorCount: 0,
      cacheHitRate: 0
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 内存缓存实现
class InMemoryCache implements CacheManager {
  private cache = new Map<string, { value: any; expiry: number }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set<T>(key: string, value: T, ttl: number = 300000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 配置接口
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface TimeoutConfig {
  search: number;
  fetch: number;
  fileRead: number;
  fileWrite: number;
}

// 报告接口
interface CacheStats {
  totalSize: number;
  hitRate: number;
  memoryUsage: number;
  evictedItems: number;
}

interface PerformanceReport {
  timestamp: string;
  metrics: Record<string, PerformanceMetrics>;
  recommendations: string[];
  healthScore: number;
}

interface PerformanceTrend {
  operation: string;
  trend: 'improving' | 'stable' | 'deteriorating';
  avgExecutionTime: number;
  successRate: number;
}

export { ToolError, ErrorType };
export default PerformanceErrorManager;