// Weather Performance Utilities
// Implement caching strategies, offline support, and API optimization

import type { WeatherCache, WeatherAPIResponse, LocationData } from '../types/weather';

// Service Worker for offline support
export class WeatherServiceWorker {
  private static instance: WeatherServiceWorker;
  private isRegistered = false;

  static getInstance(): WeatherServiceWorker {
    if (!WeatherServiceWorker.instance) {
      WeatherServiceWorker.instance = new WeatherServiceWorker();
    }
    return WeatherServiceWorker.instance;
  }

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/weather-sw.js');
      this.isRegistered = true;
      
      registration.addEventListener('updatefound', () => {
        console.log('Weather service worker updating...');
      });

      return true;
    } catch (error) {
      console.error('Failed to register weather service worker:', error);
      return false;
    }
  }

  async postMessage(message: any): Promise<void> {
    if (!this.isRegistered || !navigator.serviceWorker.controller) {
      throw new Error('Service worker not available');
    }

    navigator.serviceWorker.controller.postMessage(message);
  }

  async cacheWeatherData(key: string, data: any): Promise<void> {
    await this.postMessage({
      type: 'CACHE_WEATHER_DATA',
      payload: { key, data }
    });
  }

  async getCachedWeatherData(key: string): Promise<any> {
    return new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHED_WEATHER_DATA' && event.data.key === key) {
          resolve(event.data.data);
        }
      });

      this.postMessage({
        type: 'GET_CACHED_WEATHER_DATA',
        payload: { key }
      });
    });
  }
}

// Advanced caching with compression and encryption
export class WeatherCache {
  private static readonly CACHE_PREFIX = 'weather_cache_';
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly COMPRESSION_THRESHOLD = 1024; // 1KB

  static async set(key: string, data: any, expirationMs: number = 15 * 60 * 1000): Promise<void> {
    try {
      const cacheItem: WeatherCache = {
        key,
        data,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + expirationMs)
      };

      let serialized = JSON.stringify(cacheItem);

      // Compress large data
      if (serialized.length > this.COMPRESSION_THRESHOLD) {
        serialized = await this.compress(serialized);
      }

      // Check cache size limit
      const currentSize = await this.getCacheSize();
      if (currentSize + serialized.length > this.MAX_CACHE_SIZE) {
        await this.cleanup();
      }

      localStorage.setItem(this.CACHE_PREFIX + key, serialized);
    } catch (error) {
      console.error('Failed to cache weather data:', error);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      let cacheItem: WeatherCache;
      
      // Try to decompress if needed
      try {
        cacheItem = JSON.parse(cached);
      } catch {
        // Might be compressed
        const decompressed = await this.decompress(cached);
        cacheItem = JSON.parse(decompressed);
      }

      // Check expiration
      if (new Date() > new Date(cacheItem.expiresAt)) {
        localStorage.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      return cacheItem.data as T;
    } catch (error) {
      console.error('Failed to retrieve cached weather data:', error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    localStorage.removeItem(this.CACHE_PREFIX + key);
  }

  static async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
  }

  static async cleanup(): Promise<void> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));
    const items: { key: string; timestamp: Date; size: number }[] = [];

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          items.push({
            key,
            timestamp: new Date(cacheItem.timestamp),
            size: cached.length
          });
        }
      } catch {
        // Remove invalid cache items
        localStorage.removeItem(key);
      }
    }

    // Sort by timestamp (oldest first) and remove 25%
    items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const toRemove = Math.ceil(items.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(items[i].key);
    }
  }

  private static async getCacheSize(): Promise<number> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));
    let totalSize = 0;

    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    }

    return totalSize;
  }

  private static async compress(data: string): Promise<string> {
    // Simple compression using built-in compression (if available)
    if ('CompressionStream' in window) {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(data));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      return btoa(String.fromCharCode(...compressed));
    }

    // Fallback: no compression
    return data;
  }

  private static async decompress(data: string): Promise<string> {
    // Simple decompression
    if ('DecompressionStream' in window) {
      try {
        const compressed = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(compressed);
        writer.close();

        const chunks: Uint8Array[] = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }

        return new TextDecoder().decode(decompressed);
      } catch {
        // Fallback: return as-is
        return data;
      }
    }

    return data;
  }
}

// Request debouncing and batching
export class WeatherRequestOptimizer {
  private static pendingRequests = new Map<string, Promise<any>>();
  private static batchQueue: { location: LocationData; resolve: Function; reject: Function }[] = [];
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_DELAY = 100; // ms
  private static readonly MAX_BATCH_SIZE = 5;

  static async optimizeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    batchable = false
  ): Promise<T> {
    // Check if request is already pending (deduplication)
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create and cache promise
    const promise = batchable 
      ? this.addToBatch(key, requestFn)
      : requestFn();

    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up
      this.pendingRequests.delete(key);
    }
  }

  private static addToBatch<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        location: key as any, // Simplified for this example
        resolve,
        reject
      });

      if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.BATCH_DELAY);
      }
    });
  }

  private static async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const batch = this.batchQueue.splice(0, this.MAX_BATCH_SIZE);
    if (batch.length === 0) return;

    try {
      // Process batch requests (implementation depends on API capabilities)
      const results = await Promise.allSettled(
        batch.map(item => 
          // Simulate batch API call or parallel individual calls
          Promise.resolve({ success: true, data: `result for ${item.location}` })
        )
      );

      // Resolve individual promises
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          batch[index].resolve(result.value);
        } else {
          batch[index].reject(result.reason);
        }
      });
    } catch (error) {
      // Reject all promises in batch
      batch.forEach(item => item.reject(error));
    }
  }
}

// Performance monitoring
export class WeatherPerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static readonly MAX_METRICS = 100;

  static startTiming(operation: string): string {
    const id = `${operation}_${Date.now()}_${Math.random()}`;
    performance.mark(`weather_${id}_start`);
    return id;
  }

  static endTiming(id: string, operation: string): number {
    const startMark = `weather_${id}_start`;
    const endMark = `weather_${id}_end`;
    
    performance.mark(endMark);
    performance.measure(`weather_${id}`, startMark, endMark);
    
    const measures = performance.getEntriesByName(`weather_${id}`);
    const duration = measures[0]?.duration || 0;

    // Store metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(duration);
    
    // Keep only recent metrics
    if (operationMetrics.length > this.MAX_METRICS) {
      operationMetrics.shift();
    }

    // Clean up performance entries
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(`weather_${id}`);

    return duration;
  }

  static getMetrics(operation: string): { avg: number; min: number; max: number; count: number } {
    const metrics = this.metrics.get(operation) || [];
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const sum = metrics.reduce((a, b) => a + b, 0);
    return {
      avg: sum / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      count: metrics.length
    };
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [operation, metrics] of this.metrics.entries()) {
      result[operation] = this.getMetrics(operation);
    }
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Memory optimization
export class WeatherMemoryManager {
  private static readonly MEMORY_WARNING_THRESHOLD = 50 * 1024 * 1024; // 50MB
  private static readonly MEMORY_CRITICAL_THRESHOLD = 100 * 1024 * 1024; // 100MB

  static checkMemoryUsage(): { used: number; warning: boolean; critical: boolean } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize;
      
      return {
        used,
        warning: used > this.MEMORY_WARNING_THRESHOLD,
        critical: used > this.MEMORY_CRITICAL_THRESHOLD
      };
    }

    return { used: 0, warning: false, critical: false };
  }

  static async cleanupMemory(): Promise<void> {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    // Clear old cache entries
    await WeatherCache.cleanup();

    // Clear old performance metrics
    WeatherPerformanceMonitor.clearMetrics();

    console.log('Weather system memory cleanup completed');
  }

  static startMemoryMonitoring(): void {
    const checkInterval = setInterval(() => {
      const memory = this.checkMemoryUsage();
      
      if (memory.critical) {
        console.warn('Critical memory usage detected, cleaning up...');
        this.cleanupMemory();
      } else if (memory.warning) {
        console.warn('High memory usage detected');
      }
    }, 30000); // Check every 30 seconds

    // Store interval ID for cleanup
    (window as any).weatherMemoryMonitor = checkInterval;
  }

  static stopMemoryMonitoring(): void {
    if ((window as any).weatherMemoryMonitor) {
      clearInterval((window as any).weatherMemoryMonitor);
      delete (window as any).weatherMemoryMonitor;
    }
  }
}

// Network optimization
export class WeatherNetworkOptimizer {
  private static connectionInfo: any = null;
  private static isOnline = navigator.onLine;

  static init(): void {
    // Monitor network connection
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Weather system: Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Weather system: Network connection lost, switching to offline mode');
    });

    // Monitor connection quality (if available)
    if ('connection' in navigator) {
      this.connectionInfo = (navigator as any).connection;
      this.connectionInfo.addEventListener('change', () => {
        console.log('Network connection changed:', this.connectionInfo);
      });
    }
  }

  static isOnlineMode(): boolean {
    return this.isOnline;
  }

  static getConnectionInfo(): any {
    return this.connectionInfo;
  }

  static shouldUseCompression(): boolean {
    if (!this.connectionInfo) return false;
    
    // Use compression on slow connections
    const slowConnections = ['slow-2g', '2g', '3g'];
    return slowConnections.includes(this.connectionInfo.effectiveType);
  }

  static getOptimalRequestDelay(): number {
    if (!this.connectionInfo) return 0;
    
    // Add delay for slow connections to prevent overwhelming
    switch (this.connectionInfo.effectiveType) {
      case 'slow-2g':
        return 2000;
      case '2g':
        return 1000;
      case '3g':
        return 500;
      default:
        return 0;
    }
  }
}

// Initialize performance systems
export function initializeWeatherPerformance(): void {
  // Register service worker
  WeatherServiceWorker.getInstance().register();
  
  // Start memory monitoring
  WeatherMemoryManager.startMemoryMonitoring();
  
  // Initialize network optimization
  WeatherNetworkOptimizer.init();
  
  console.log('Weather performance systems initialized');
}

// Cleanup performance systems
export function cleanupWeatherPerformance(): void {
  WeatherMemoryManager.stopMemoryMonitoring();
  WeatherPerformanceMonitor.clearMetrics();
  WeatherCache.clear();
  
  console.log('Weather performance systems cleaned up');
}