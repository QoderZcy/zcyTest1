import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services';
import { 
  CurrentWeatherData, 
  HourlyWeatherData, 
  DailyWeatherData, 
  AirQualityData,
  LocationData,
  AppError
} from '../types';

interface UseWeatherOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // 分钟
}

interface WeatherState {
  currentWeather: CurrentWeatherData | null;
  hourlyForecast: HourlyWeatherData[];
  dailyForecast: DailyWeatherData[];
  airQuality: AirQualityData | null;
  isLoading: boolean;
  error: AppError | null;
  lastUpdated: Date | null;
}

export const useWeather = (location: LocationData | null, options: UseWeatherOptions = {}) => {
  const { autoRefresh = true, refreshInterval = 30 } = options;
  
  const [state, setState] = useState<WeatherState>({
    currentWeather: null,
    hourlyForecast: [],
    dailyForecast: [],
    airQuality: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // 获取天气数据
  const fetchWeatherData = useCallback(async (loc: LocationData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 并行获取所有天气数据
      const [currentWeather, hourlyForecast, dailyForecast, airQuality] = await Promise.all([
        weatherService.getCurrentWeather(loc),
        weatherService.getHourlyForecast(loc),
        weatherService.getDailyForecast(loc),
        weatherService.getAirQuality(loc).catch(() => null) // 空气质量可选
      ]);

      setState(prev => ({
        ...prev,
        currentWeather,
        hourlyForecast,
        dailyForecast,
        airQuality,
        isLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('获取天气数据失败:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'WEATHER_FETCH_FAILED',
          message: error instanceof Error ? error.message : '获取天气数据失败',
          timestamp: new Date(),
          recoverable: true
        }
      }));
    }
  }, []);

  // 刷新数据
  const refresh = useCallback(() => {
    if (location) {
      fetchWeatherData(location);
    }
  }, [location, fetchWeatherData]);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 初始加载和位置变化时获取数据
  useEffect(() => {
    if (location) {
      fetchWeatherData(location);
    }
  }, [location, fetchWeatherData]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || !location) return;

    const interval = setInterval(() => {
      fetchWeatherData(location);
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, location, fetchWeatherData]);

  return {
    ...state,
    refresh,
    clearError
  };
};