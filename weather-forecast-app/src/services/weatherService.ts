import { HttpClient, createHttpClient } from './httpClient';
import { 
  CurrentWeatherData, 
  HourlyWeatherData, 
  DailyWeatherData, 
  AirQualityData,
  WeatherCondition,
  LocationData,
  CacheData
} from '../types';

// OpenWeatherMap API响应接口
interface OpenWeatherResponse {
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  };
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
    rain?: { '1h': number };
    snow?: { '1h': number };
  }>;
  daily: Array<{
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: number;
    pop: number;
    rain?: number;
    snow?: number;
    uvi: number;
  }>;
}

// 空气质量API响应
interface AirQualityResponse {
  list: Array<{
    dt: number;
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
  }>;
}

export class WeatherService {
  private httpClient: HttpClient;
  private cache: Map<string, CacheData<any>> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分钟

  constructor() {
    this.httpClient = createHttpClient({
      baseURL: 'https://api.openweathermap.org/data/3.0',
      timeout: 10000,
      retries: 3
    });
  }

  // 获取当前天气
  async getCurrentWeather(location: LocationData): Promise<CurrentWeatherData> {
    const cacheKey = `current-${location.id}`;
    const cached = this.getFromCache<CurrentWeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = {
        lat: location.latitude,
        lon: location.longitude,
        appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_cn'
      };

      const response = await this.httpClient.get<OpenWeatherResponse>('/onecall', params);
      const currentData = this.transformCurrentWeather(response.current, location.id);
      
      this.setCache(cacheKey, currentData);
      return currentData;
    } catch (error) {
      console.error('获取当前天气失败:', error);
      throw new Error('获取当前天气数据失败');
    }
  }

  // 获取小时预报
  async getHourlyForecast(location: LocationData): Promise<HourlyWeatherData[]> {
    const cacheKey = `hourly-${location.id}`;
    const cached = this.getFromCache<HourlyWeatherData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = {
        lat: location.latitude,
        lon: location.longitude,
        appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_cn'
      };

      const response = await this.httpClient.get<OpenWeatherResponse>('/onecall', params);
      const hourlyData = response.hourly.slice(0, 24).map(hour => 
        this.transformHourlyWeather(hour)
      );
      
      this.setCache(cacheKey, hourlyData);
      return hourlyData;
    } catch (error) {
      console.error('获取小时预报失败:', error);
      throw new Error('获取小时预报数据失败');
    }
  }

  // 获取日预报
  async getDailyForecast(location: LocationData): Promise<DailyWeatherData[]> {
    const cacheKey = `daily-${location.id}`;
    const cached = this.getFromCache<DailyWeatherData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = {
        lat: location.latitude,
        lon: location.longitude,
        appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_cn'
      };

      const response = await this.httpClient.get<OpenWeatherResponse>('/onecall', params);
      const dailyData = response.daily.slice(0, 7).map(day => 
        this.transformDailyWeather(day)
      );
      
      this.setCache(cacheKey, dailyData);
      return dailyData;
    } catch (error) {
      console.error('获取日预报失败:', error);
      throw new Error('获取日预报数据失败');
    }
  }

  // 获取空气质量
  async getAirQuality(location: LocationData): Promise<AirQualityData> {
    const cacheKey = `air-quality-${location.id}`;
    const cached = this.getFromCache<AirQualityData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = {
        lat: location.latitude,
        lon: location.longitude,
        appid: import.meta.env.VITE_OPENWEATHER_API_KEY
      };

      const response = await this.httpClient.get<AirQualityResponse>('/air_pollution', params);
      const airQualityData = this.transformAirQuality(response.list[0]);
      
      this.setCache(cacheKey, airQualityData);
      return airQualityData;
    } catch (error) {
      console.error('获取空气质量失败:', error);
      throw new Error('获取空气质量数据失败');
    }
  }

  // 数据转换方法
  private transformCurrentWeather(data: any, locationId: string): CurrentWeatherData {
    return {
      locationId,
      updateTime: new Date(data.dt * 1000),
      weather: this.mapWeatherCondition(data.weather[0].id, data.weather[0].icon),
      description: data.weather[0].description,
      temperature: Math.round(data.temp),
      feelsLike: Math.round(data.feels_like),
      tempMin: Math.round(data.temp_min || data.temp),
      tempMax: Math.round(data.temp_max || data.temp),
      dewPoint: Math.round(data.dew_point),
      humidity: data.humidity,
      pressure: data.pressure,
      visibility: data.visibility / 1000, // 转换为km
      uvIndex: data.uvi,
      windSpeed: Math.round(data.wind_speed * 3.6), // 转换为km/h
      windDirection: data.wind_deg,
      windGust: data.wind_gust ? Math.round(data.wind_gust * 3.6) : undefined,
      precipitation: (data.rain?.['1h'] || data.snow?.['1h'] || 0),
      precipitationProbability: 0, // OpenWeather current不提供，需要从hourly获取
      cloudCover: data.clouds,
      sunrise: new Date(data.sunrise * 1000),
      sunset: new Date(data.sunset * 1000)
    };
  }

  private transformHourlyWeather(data: any): HourlyWeatherData {
    return {
      time: new Date(data.dt * 1000),
      temperature: Math.round(data.temp),
      feelsLike: Math.round(data.feels_like),
      weather: this.mapWeatherCondition(data.weather[0].id, data.weather[0].icon),
      description: data.weather[0].description,
      precipitationProbability: Math.round(data.pop * 100),
      precipitation: (data.rain?.['1h'] || data.snow?.['1h'] || 0),
      windSpeed: Math.round(data.wind_speed * 3.6),
      windDirection: data.wind_deg,
      humidity: data.humidity,
      pressure: data.pressure,
      cloudCover: data.clouds,
      uvIndex: data.uvi
    };
  }

  private transformDailyWeather(data: any): DailyWeatherData {
    return {
      date: new Date(data.dt * 1000),
      weather: this.mapWeatherCondition(data.weather[0].id, data.weather[0].icon),
      description: data.weather[0].description,
      tempMin: Math.round(data.temp.min),
      tempMax: Math.round(data.temp.max),
      precipitationProbability: Math.round(data.pop * 100),
      precipitation: (data.rain || data.snow || 0),
      windSpeed: Math.round(data.wind_speed * 3.6),
      windDirection: data.wind_deg,
      humidity: data.humidity,
      pressure: data.pressure,
      uvIndex: data.uvi,
      sunrise: new Date(data.sunrise * 1000),
      sunset: new Date(data.sunset * 1000)
    };
  }

  private transformAirQuality(data: any): AirQualityData {
    const aqiLevels = ['优', '良', '轻度污染', '中度污染', '重度污染', '严重污染'];
    const pollutants = ['CO', 'NO2', 'O3', 'SO2', 'PM2.5', 'PM10'];
    
    return {
      aqi: data.main.aqi,
      level: aqiLevels[data.main.aqi - 1] || '未知',
      primaryPollutant: this.getPrimaryPollutant(data.components),
      pm25: data.components.pm2_5,
      pm10: data.components.pm10,
      so2: data.components.so2,
      no2: data.components.no2,
      co: data.components.co,
      o3: data.components.o3,
      updateTime: new Date()
    };
  }

  // 天气状况映射
  private mapWeatherCondition(id: number, icon: string): WeatherCondition {
    const isNight = icon.endsWith('n');
    
    if (id >= 200 && id < 300) return WeatherCondition.THUNDERSTORM;
    if (id >= 300 && id < 400) return WeatherCondition.LIGHT_RAIN;
    if (id >= 500 && id < 600) {
      if (id <= 502) return WeatherCondition.LIGHT_RAIN;
      if (id <= 504) return WeatherCondition.MODERATE_RAIN;
      return WeatherCondition.HEAVY_RAIN;
    }
    if (id >= 600 && id < 700) {
      if (id <= 602) return WeatherCondition.LIGHT_SNOW;
      if (id <= 612) return WeatherCondition.MODERATE_SNOW;
      return WeatherCondition.HEAVY_SNOW;
    }
    if (id >= 700 && id < 800) {
      if (id === 741) return WeatherCondition.FOG;
      if (id === 761 || id === 762) return WeatherCondition.DUST;
      return WeatherCondition.HAZE;
    }
    if (id === 800) return isNight ? WeatherCondition.CLEAR_NIGHT : WeatherCondition.CLEAR_DAY;
    if (id === 801 || id === 802) return isNight ? WeatherCondition.PARTLY_CLOUDY_NIGHT : WeatherCondition.PARTLY_CLOUDY_DAY;
    if (id === 803 || id === 804) return WeatherCondition.CLOUDY;
    
    return WeatherCondition.CLEAR_DAY;
  }

  // 获取主要污染物
  private getPrimaryPollutant(components: any): string {
    const thresholds = {
      pm2_5: [35, 75, 115, 150, 250],
      pm10: [50, 150, 250, 350, 420],
      so2: [150, 500, 650, 800, 1000],
      no2: [100, 200, 700, 1200, 2340],
      o3: [160, 200, 300, 400, 800],
      co: [10, 35, 60, 90, 120]
    };

    let maxIndex = 0;
    let primaryPollutant = 'PM2.5';

    Object.entries(components).forEach(([key, value]) => {
      if (thresholds[key as keyof typeof thresholds]) {
        const levels = thresholds[key as keyof typeof thresholds];
        const index = levels.findIndex(threshold => (value as number) <= threshold);
        if (index > maxIndex) {
          maxIndex = index;
          primaryPollutant = key.toUpperCase().replace('_', '.');
        }
      }
    });

    return primaryPollutant;
  }

  // 缓存管理
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    const expiry = new Date(Date.now() + this.CACHE_DURATION);
    this.cache.set(key, { data, timestamp: new Date(), expiry });
  }

  // 清理过期缓存
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }

  // 清理所有缓存
  clearAllCache(): void {
    this.cache.clear();
  }
}

// 导出单例实例
export const weatherService = new WeatherService();