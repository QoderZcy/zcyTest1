import { UserSettings, CacheData, StorageKeys } from '../types';

// 本地存储管理类
export class StorageManager {
  // 保存数据到localStorage
  static save<T>(key: string, data: T): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error(`保存数据失败 [${key}]:`, error);
    }
  }

  // 从localStorage读取数据
  static load<T>(key: string): T | null {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return null;
      }
      return JSON.parse(serializedData) as T;
    } catch (error) {
      console.error(`读取数据失败 [${key}]:`, error);
      return null;
    }
  }

  // 删除localStorage中的数据
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`删除数据失败 [${key}]:`, error);
    }
  }

  // 清空所有数据
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('清空本地存储失败:', error);
    }
  }

  // 保存缓存数据
  static saveCache<T>(key: string, data: T, expiryMinutes: number = 30): void {
    const cacheData: CacheData<T> = {
      data,
      timestamp: new Date(),
      expiry: new Date(Date.now() + expiryMinutes * 60 * 1000)
    };
    this.save(key, cacheData);
  }

  // 读取缓存数据
  static loadCache<T>(key: string): T | null {
    const cacheData = this.load<CacheData<T>>(key);
    if (!cacheData) {
      return null;
    }

    // 检查是否过期
    if (new Date() > new Date(cacheData.expiry)) {
      this.remove(key);
      return null;
    }

    return cacheData.data;
  }

  // 获取存储大小
  static getStorageSize(): { used: number; total: number } {
    let used = 0;
    const total = 5 * 1024 * 1024; // 5MB (localStorage limit)

    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.error('获取存储大小失败:', error);
    }

    return { used, total };
  }

  // 清理过期缓存
  static cleanExpiredCache(): void {
    const now = new Date();
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const data = this.load<CacheData<any>>(key);
          if (data && data.expiry && new Date(data.expiry) <= now) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => this.remove(key));
      console.log(`清理了 ${keysToRemove.length} 个过期缓存`);
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }
}

// 用户设置管理
export class SettingsManager {
  private static readonly SETTINGS_KEY = StorageKeys.USER_SETTINGS;

  // 获取默认设置
  static getDefaultSettings(): UserSettings {
    return {
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      pressureUnit: 'hPa',
      visibilityUnit: 'km',
      autoLocation: true,
      savedLocations: [],
      notifications: {
        enabled: true,
        types: {
          'daily-weather': { enabled: true, time: '07:00' },
          'weather-change': { enabled: true },
          'severe-weather': { enabled: true },
          'clothing-advice': { enabled: true, time: '07:00' },
          'air-quality': { enabled: true, time: '06:00' }
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        },
        sound: true,
        vibration: true
      },
      theme: 'auto',
      language: 'zh-CN',
      showDetailedInfo: true,
      show24HourFormat: true,
      dataRefreshInterval: 30,
      cacheExpiry: 30,
      shareLocation: true,
      analytics: true
    };
  }

  // 加载用户设置
  static loadSettings(): UserSettings {
    const saved = StorageManager.load<UserSettings>(this.SETTINGS_KEY);
    if (saved) {
      // 合并默认设置，确保新增的配置项有默认值
      return { ...this.getDefaultSettings(), ...saved };
    }
    return this.getDefaultSettings();
  }

  // 保存用户设置
  static saveSettings(settings: UserSettings): void {
    StorageManager.save(this.SETTINGS_KEY, settings);
  }

  // 更新单个设置项
  static updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): void {
    const settings = this.loadSettings();
    settings[key] = value;
    this.saveSettings(settings);
  }

  // 重置设置
  static resetSettings(): void {
    const defaultSettings = this.getDefaultSettings();
    this.saveSettings(defaultSettings);
  }
}

// 数据格式化工具
export class DataFormatter {
  // 格式化温度
  static formatTemperature(temp: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
    if (unit === 'fahrenheit') {
      const fahrenheit = (temp * 9/5) + 32;
      return `${Math.round(fahrenheit)}°F`;
    }
    return `${Math.round(temp)}°C`;
  }

  // 格式化风速
  static formatWindSpeed(speed: number, unit: 'kmh' | 'mph' | 'ms' = 'kmh'): string {
    switch (unit) {
      case 'mph':
        return `${Math.round(speed * 0.621371)} mph`;
      case 'ms':
        return `${Math.round(speed / 3.6)} m/s`;
      default:
        return `${Math.round(speed)} km/h`;
    }
  }

  // 格式化气压
  static formatPressure(pressure: number, unit: 'hPa' | 'inHg' | 'mmHg' = 'hPa'): string {
    switch (unit) {
      case 'inHg':
        return `${(pressure * 0.02953).toFixed(2)} inHg`;
      case 'mmHg':
        return `${Math.round(pressure * 0.750062)} mmHg`;
      default:
        return `${pressure} hPa`;
    }
  }

  // 格式化能见度
  static formatVisibility(visibility: number, unit: 'km' | 'miles' = 'km'): string {
    if (unit === 'miles') {
      return `${(visibility * 0.621371).toFixed(1)} miles`;
    }
    return `${visibility.toFixed(1)} km`;
  }

  // 格式化湿度
  static formatHumidity(humidity: number): string {
    return `${humidity}%`;
  }

  // 格式化紫外线指数
  static formatUVIndex(uv: number): { value: string; level: string; color: string } {
    const levels = [
      { max: 2, level: '低', color: '#4CAF50' },
      { max: 5, level: '中等', color: '#FF9800' },
      { max: 7, level: '高', color: '#F44336' },
      { max: 10, level: '很高', color: '#9C27B0' },
      { max: Infinity, level: '极高', color: '#673AB7' }
    ];

    const levelInfo = levels.find(level => uv <= level.max) || levels[levels.length - 1];
    
    return {
      value: uv.toFixed(1),
      level: levelInfo.level,
      color: levelInfo.color
    };
  }

  // 格式化降水概率
  static formatPrecipitationProbability(probability: number): string {
    return `${probability}%`;
  }

  // 格式化降水量
  static formatPrecipitation(precipitation: number): string {
    if (precipitation < 0.1) return '无';
    return `${precipitation.toFixed(1)}mm`;
  }

  // 格式化空气质量
  static formatAQI(aqi: number): { level: string; color: string; description: string } {
    const levels = [
      { max: 50, level: '优', color: '#4CAF50', description: '空气质量令人满意' },
      { max: 100, level: '良', color: '#8BC34A', description: '空气质量可接受' },
      { max: 150, level: '轻度污染', color: '#FF9800', description: '敏感人群需注意' },
      { max: 200, level: '中度污染', color: '#F44336', description: '对健康有害' },
      { max: 300, level: '重度污染', color: '#9C27B0', description: '所有人应减少户外活动' },
      { max: Infinity, level: '严重污染', color: '#673AB7', description: '所有人应避免户外活动' }
    ];

    const levelInfo = levels.find(level => aqi <= level.max) || levels[levels.length - 1];
    
    return {
      level: levelInfo.level,
      color: levelInfo.color,
      description: levelInfo.description
    };
  }
}

// 时间工具
export class TimeUtils {
  // 格式化时间
  static formatTime(date: Date, is24Hour: boolean = true): string {
    return date.toLocaleTimeString('zh-CN', {
      hour12: !is24Hour,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 格式化日期
  static formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
    if (format === 'long') {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
    
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  }

  // 获取相对时间
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return this.formatDate(date, 'short');
  }

  // 检查是否是今天
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // 检查是否是明天
  static isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  // 获取星期几
  static getWeekday(date: Date, short: boolean = false): string {
    const weekdays = short 
      ? ['日', '一', '二', '三', '四', '五', '六']
      : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  }
}