/**
 * 性能监控工具
 * 用于监控和优化应用性能
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'timing' | 'memory' | 'network' | 'user-experience';
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  recommendations: string[];
  score: number; // 0-100 性能分数
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('[PerformanceMonitor] 开始性能监控');

    // 监控Web Vitals
    this.observeWebVitals();
    
    // 监控资源加载
    this.observeResourceTiming();
    
    // 监控长任务
    this.observeLongTasks();
    
    // 监控内存使用
    this.observeMemoryUsage();
    
    // 监控页面生命周期
    this.observePageLifecycle();
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    console.log('[PerformanceMonitor] 停止性能监控');

    // 断开所有观察者
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
  }

  /**
   * 监控Web Vitals (LCP, FID, CLS)
   */
  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.addMetric({
            name: 'Largest Contentful Paint',
            value: lastEntry.startTime,
            unit: 'ms',
            category: 'user-experience',
          });
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] LCP 观察失败:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.addMetric({
              name: 'First Input Delay',
              value: entry.processingStart - entry.startTime,
              unit: 'ms',
              category: 'user-experience',
            });
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] FID 观察失败:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsScore = 0;
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              clsScore += (entry as any).value;
            }
          });
          
          this.addMetric({
            name: 'Cumulative Layout Shift',
            value: clsScore,
            unit: 'score',
            category: 'user-experience',
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] CLS 观察失败:', error);
      }
    }
  }

  /**
   * 监控资源加载时间
   */
  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            const resource = entry as PerformanceResourceTiming;
            
            // 记录资源加载时间
            this.addMetric({
              name: `Resource Load Time: ${resource.name.split('/').pop()}`,
              value: resource.responseEnd - resource.requestStart,
              unit: 'ms',
              category: 'network',
            });
            
            // 检查大资源
            if (resource.transferSize > 500000) { // 大于500KB
              console.warn(`[PerformanceMonitor] 大资源检测: ${resource.name} (${(resource.transferSize / 1024).toFixed(2)}KB)`);
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] 资源监控失败:', error);
      }
    }
  }

  /**
   * 监控长任务
   */
  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            this.addMetric({
              name: 'Long Task',
              value: entry.duration,
              unit: 'ms',
              category: 'timing',
            });
            
            console.warn(`[PerformanceMonitor] 长任务检测: ${entry.duration.toFixed(2)}ms`);
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] 长任务监控失败:', error);
      }
    }
  }

  /**
   * 监控内存使用
   */
  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        
        this.addMetric({
          name: 'JS Heap Used',
          value: memory.usedJSHeapSize / 1024 / 1024,
          unit: 'MB',
          category: 'memory',
        });
        
        this.addMetric({
          name: 'JS Heap Total',
          value: memory.totalJSHeapSize / 1024 / 1024,
          unit: 'MB',
          category: 'memory',
        });
        
        this.addMetric({
          name: 'JS Heap Limit',
          value: memory.jsHeapSizeLimit / 1024 / 1024,
          unit: 'MB',
          category: 'memory',
        });
        
        // 检查内存泄漏
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usageRatio > 0.9) {
          console.warn(`[PerformanceMonitor] 内存使用过高: ${(usageRatio * 100).toFixed(2)}%`);
        }
      };
      
      // 每30秒检查一次内存
      setInterval(checkMemory, 30000);
      checkMemory(); // 立即检查一次
    }
  }

  /**
   * 监控页面生命周期
   */
  private observePageLifecycle(): void {
    // 页面加载完成时间
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.addMetric({
        name: 'Page Load Time',
        value: navigation.loadEventEnd - navigation.navigationStart,
        unit: 'ms',
        category: 'timing',
      });
      
      this.addMetric({
        name: 'DOM Content Loaded',
        value: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        unit: 'ms',
        category: 'timing',
      });
      
      this.addMetric({
        name: 'Time to Interactive',
        value: navigation.domInteractive - navigation.navigationStart,
        unit: 'ms',
        category: 'timing',
      });
    });

    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[PerformanceMonitor] 页面隐藏');
      } else {
        console.log('[PerformanceMonitor] 页面可见');
      }
    });
  }

  /**
   * 添加性能指标
   */
  private addMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };
    
    this.metrics.push(fullMetric);
    
    // 限制指标数量，避免内存泄漏
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * 手动记录性能指标
   */
  public recordMetric(name: string, value: number, unit: string, category: PerformanceMetric['category']): void {
    this.addMetric({ name, value, unit, category });
  }

  /**
   * 测量函数执行时间
   */
  public measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.addMetric({
      name: `Function: ${name}`,
      value: duration,
      unit: 'ms',
      category: 'timing',
    });
    
    return result;
  }

  /**
   * 测量异步函数执行时间
   */
  public async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.addMetric({
      name: `Async Function: ${name}`,
      value: duration,
      unit: 'ms',
      category: 'timing',
    });
    
    return result;
  }

  /**
   * 获取性能报告
   */
  public getPerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {
      metrics: [...this.metrics],
      recommendations: [],
      score: 100,
    };

    // 分析指标并生成建议
    this.analyzeMetrics(report);
    
    return report;
  }

  /**
   * 分析性能指标
   */
  private analyzeMetrics(report: PerformanceReport): void {
    let score = 100;
    
    // 分析LCP
    const lcp = this.getLatestMetric('Largest Contentful Paint');
    if (lcp) {
      if (lcp.value > 4000) {
        score -= 20;
        report.recommendations.push('LCP过高 (>4s)，建议优化图片大小和服务器响应时间');
      } else if (lcp.value > 2500) {
        score -= 10;
        report.recommendations.push('LCP较高 (>2.5s)，可以进一步优化');
      }
    }

    // 分析FID
    const fid = this.getLatestMetric('First Input Delay');
    if (fid) {
      if (fid.value > 300) {
        score -= 15;
        report.recommendations.push('FID过高 (>300ms)，建议减少JavaScript执行时间');
      } else if (fid.value > 100) {
        score -= 5;
        report.recommendations.push('FID较高 (>100ms)，可以优化JavaScript性能');
      }
    }

    // 分析CLS
    const cls = this.getLatestMetric('Cumulative Layout Shift');
    if (cls) {
      if (cls.value > 0.25) {
        score -= 15;
        report.recommendations.push('CLS过高 (>0.25)，建议预设元素尺寸避免布局偏移');
      } else if (cls.value > 0.1) {
        score -= 5;
        report.recommendations.push('CLS较高 (>0.1)，可以进一步减少布局偏移');
      }
    }

    // 分析长任务
    const longTasks = this.metrics.filter(m => m.name === 'Long Task');
    if (longTasks.length > 0) {
      score -= Math.min(20, longTasks.length * 2);
      report.recommendations.push(`检测到${longTasks.length}个长任务，建议将长任务分解为小任务`);
    }

    // 分析内存使用
    const memoryUsed = this.getLatestMetric('JS Heap Used');
    if (memoryUsed && memoryUsed.value > 100) {
      score -= 10;
      report.recommendations.push(`内存使用较高 (${memoryUsed.value.toFixed(2)}MB)，建议检查内存泄漏`);
    }

    report.score = Math.max(0, score);
  }

  /**
   * 获取最新的指标
   */
  private getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.metrics.filter(m => m.name === name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  /**
   * 清除性能指标
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 导出性能数据
   */
  public exportData(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      report: this.getPerformanceReport(),
    }, null, 2);
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// React性能监控Hook
export function usePerformanceMonitor() {
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  
  React.useEffect(() => {
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
    
    return () => {
      performanceMonitor.stopMonitoring();
      setIsMonitoring(false);
    };
  }, []);
  
  const measureRender = React.useCallback((componentName: string) => {
    return {
      start: () => {
        const startTime = performance.now();
        return () => {
          const duration = performance.now() - startTime;
          performanceMonitor.recordMetric(
            `React Render: ${componentName}`,
            duration,
            'ms',
            'timing'
          );
        };
      },
    };
  }, []);
  
  return {
    isMonitoring,
    measureRender,
    getReport: () => performanceMonitor.getPerformanceReport(),
    exportData: () => performanceMonitor.exportData(),
  };
}

export default performanceMonitor;