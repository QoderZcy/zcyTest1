import { LocationData } from './location';
import { NotificationSettings } from './notification';

// 用户设置
export interface UserSettings {
  // 基础设置
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'mph' | 'ms';
  pressureUnit: 'hPa' | 'inHg' | 'mmHg';
  visibilityUnit: 'km' | 'miles';
  
  // 位置设置
  defaultLocation?: LocationData;
  autoLocation: boolean;
  savedLocations: LocationData[];
  
  // 通知设置
  notifications: NotificationSettings;
  
  // 界面设置
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  showDetailedInfo: boolean;
  show24HourFormat: boolean;
  
  // 数据设置
  dataRefreshInterval: number; // 分钟
  cacheExpiry: number; // 分钟
  
  // 隐私设置
  shareLocation: boolean;
  analytics: boolean;
}

// 应用状态
export interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  lastUpdated: Date | null;
  error: AppError | null;
  
  // 数据状态
  currentWeather: any | null;
  hourlyForecast: any[];
  dailyForecast: any[];
  airQuality: any | null;
  
  // UI状态
  activeTab: string;
  isRefreshing: boolean;
  showSettings: boolean;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
}

// 存储键名
export enum StorageKeys {
  USER_SETTINGS = 'weather-app-user-settings',
  WEATHER_CACHE = 'weather-app-weather-cache',
  LOCATION_CACHE = 'weather-app-location-cache',
  NOTIFICATION_CACHE = 'weather-app-notification-cache'
}

// 缓存数据结构
export interface CacheData<T> {
  data: T;
  timestamp: Date;
  expiry: Date;
}

// API配置
export interface ApiConfig {
  openWeatherMap: {
    apiKey: string;
    baseUrl: string;
  };
  qweather: {
    apiKey: string;
    baseUrl: string;
  };
  amap: {
    apiKey: string;
    baseUrl: string;
  };
}