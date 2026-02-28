/**
 * 性能优化工具和监控
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// React Hook: 使用防抖
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// React Hook: 使用节流
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const throttledFuncRef = useRef<T>();

  if (!throttledFuncRef.current) {
    throttledFuncRef.current = throttle(func, delay) as T;
  }

  return throttledFuncRef.current;
}

// 性能监控类
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // 只保留最近100条记录
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift();
    }
  }

  /**
   * 获取性能指标统计
   */
  getMetricStats(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  /**
   * 监控导航性能
   */
  monitorNavigationPerformance(): void {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric('dom-load-time', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        this.recordMetric('page-load-time', navigation.loadEventEnd - navigation.loadEventStart);
        this.recordMetric('first-byte-time', navigation.responseStart - navigation.requestStart);
      }
    }
  }

  /**
   * 监控长任务
   */
  monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('long-task-duration', entry.duration);
          console.warn(`Long task detected: ${entry.duration}ms`);
        });
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Long task monitoring not supported');
      }
    }
  }

  /**
   * 监控内存使用
   */
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('used-heap-size', memory.usedJSHeapSize);
      this.recordMetric('total-heap-size', memory.totalJSHeapSize);
      this.recordMetric('heap-size-limit', memory.jsHeapSizeLimit);
    }
  }

  /**
   * 清理观察者
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React Hook: 性能监控
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    monitor.monitorNavigationPerformance();
    monitor.monitorLongTasks();
    
    const memoryInterval = setInterval(() => {
      monitor.monitorMemoryUsage();
    }, 5000);

    return () => {
      clearInterval(memoryInterval);
      monitor.cleanup();
    };
  }, [monitor]);

  return {
    recordMetric: monitor.recordMetric.bind(monitor),
    getMetricStats: monitor.getMetricStats.bind(monitor),
  };
}

// 缓存管理类
export class CacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

  /**
   * 设置缓存
   */
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// React Hook: 缓存
export function useCache() {
  const cacheRef = useRef(new CacheManager());

  useEffect(() => {
    const interval = setInterval(() => {
      cacheRef.current.cleanup();
    }, 60000); // 每分钟清理一次

    return () => clearInterval(interval);
  }, []);

  return cacheRef.current;
}

// 虚拟化列表 Hook
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = 0; // 简化版本，实际需要根据滚动位置计算
    const endIndex = Math.min(startIndex + visibleCount, items.length);
    
    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight]);
}

// 懒加载 Hook
export function useLazyLoading<T>(
  loadMore: () => Promise<T[]>,
  hasMore: boolean,
  threshold: number = 100
) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<T[]>([]);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await loadMore();
      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLoading(false);
    }
  }, [loadMore, loading, hasMore]);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = throttle(() => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        handleLoadMore();
      }
    }, 200);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore, threshold]);

  return { items, loading, loadMore: handleLoadMore };
}

// 图片懒加载 Hook
export function useImageLazyLoading() {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());

  const loadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (loadedImages.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [loadedImages]);

  return { loadImage, isLoaded: (src: string) => loadedImages.has(src) };
}

// 错误边界工具
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return class ErrorBoundaryWrapper extends React.Component<P, { hasError: boolean }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
      console.error('Component error:', error, errorInfo);
      PerformanceMonitor.getInstance().recordMetric('component-error', 1);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="error-fallback">
            <h2>Something went wrong.</h2>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}

// 组件性能分析 Hook
export function useComponentPerformance(componentName: string) {
  const renderStartTime = useRef<number>();

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      PerformanceMonitor.getInstance().recordMetric(
        `component-render-time-${componentName}`,
        renderTime
      );
    }
  });
}

export default {
  debounce,
  throttle,
  useDebounce,
  useThrottle,
  PerformanceMonitor,
  usePerformanceMonitor,
  CacheManager,
  useCache,
  useVirtualization,
  useLazyLoading,
  useImageLazyLoading,
  withErrorBoundary,
  useComponentPerformance,
};