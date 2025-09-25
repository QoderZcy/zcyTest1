// Weather API Service
// Comprehensive weather API integration with OpenWeatherMap, caching, and error handling

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  WeatherAPIConfig,
  WeatherAPIResponse,
  CurrentWeatherResponse,
  WeatherForecastResponse,
  LocationData,
  GeocodeResult,
  LocationSearchResponse,
  WeatherData,
  WeatherCondition,
  WeatherError,
  WeatherErrorCodes,
  WeatherCache,
  WeatherCacheConfig,
  Temperature,
  WindInfo,
  PrecipitationInfo
} from '../types/weather';

// OpenWeatherMap API response interfaces
interface OWMCurrentResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: { all: number };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface OWMForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: { all: number };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number;
    rain?: { '3h': number };
    snow?: { '3h': number };
    sys: { pod: string };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

interface OWMGeocodeResponse {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

class WeatherCache {
  private cache: Map<string, WeatherCache> = new Map();
  private config: WeatherCacheConfig;

  constructor(config: WeatherCacheConfig) {
    this.config = config;
    this.loadFromStorage();
  }

  private generateKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  get<T>(endpoint: string, params: Record<string, any>): T | null {
    const key = this.generateKey(endpoint, params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (cached.expiresAt < new Date()) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }
    
    return cached.data as T;
  }

  set<T>(endpoint: string, params: Record<string, any>, data: T, locationId?: string): void {
    const key = this.generateKey(endpoint, params);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxAge * 60 * 1000);
    
    this.cache.set(key, {
      key,
      data,
      timestamp: now,
      expiresAt,
      locationId
    });
    
    // Clean up old entries if cache is too large
    if (this.cache.size > this.config.maxEntries) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Remove oldest 25% of entries
      const toRemove = Math.floor(this.config.maxEntries * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }
    
    this.saveToStorage();
  }

  clearLocationCache(locationId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.locationId === locationId) {
        this.cache.delete(key);
      }
    }
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    if (!this.config.syncEnabled) return;
    
    try {
      const stored = localStorage.getItem('weather-cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.map((item: any) => [
          item.key,
          {
            ...item,
            timestamp: new Date(item.timestamp),
            expiresAt: new Date(item.expiresAt)
          }
        ]));
      }
    } catch (error) {
      console.error('Failed to load weather cache from storage:', error);
      this.cache.clear();
    }
  }

  private saveToStorage(): void {
    if (!this.config.syncEnabled) return;
    
    try {
      const data = Array.from(this.cache.values());
      localStorage.setItem('weather-cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save weather cache to storage:', error);
    }
  }
}

export class WeatherService {
  private api: AxiosInstance;
  private config: WeatherAPIConfig;
  private cache: WeatherCache;
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor(config: WeatherAPIConfig) {
    this.config = config;
    
    this.api = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.cache = new WeatherCache({
      maxAge: 15, // 15 minutes default cache
      maxEntries: 100,
      compression: false,
      syncEnabled: true
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add API key to all requests
        config.params = {
          ...config.params,
          appid: this.config.apiKey
        };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const weatherError = this.transformError(error);
        
        // Retry logic for retryable errors
        if (weatherError.retryable && error.config) {
          const retryCount = (error.config as any).__retryCount || 0;
          if (retryCount < this.config.retryAttempts) {
            (error.config as any).__retryCount = retryCount + 1;
            
            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.api.request(error.config);
          }
        }
        
        return Promise.reject(weatherError);
      }
    );
  }

  private transformError(error: AxiosError): WeatherError {
    let code: string;
    let message: string;
    let retryable = false;

    if (error.response) {
      switch (error.response.status) {
        case 401:
          code = WeatherErrorCodes.API_KEY_INVALID;
          message = 'Invalid API key';
          break;
        case 404:
          code = WeatherErrorCodes.LOCATION_NOT_FOUND;
          message = 'Location not found';
          break;
        case 429:
          code = WeatherErrorCodes.RATE_LIMIT_EXCEEDED;
          message = 'Rate limit exceeded';
          retryable = true;
          break;
        case 503:
          code = WeatherErrorCodes.SERVICE_UNAVAILABLE;
          message = 'Weather service temporarily unavailable';
          retryable = true;
          break;
        default:
          code = 'API_ERROR';
          message = `API error: ${error.response.status}`;
          retryable = error.response.status >= 500;
      }
    } else if (error.request) {
      code = WeatherErrorCodes.NETWORK_ERROR;
      message = 'Network connection failed';
      retryable = true;
    } else {
      code = 'UNKNOWN_ERROR';
      message = error.message || 'Unknown error occurred';
    }

    return {
      code,
      message,
      details: error.response?.data,
      retryable,
      timestamp: new Date()
    };
  }

  private checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${endpoint}_${minute}`;
    
    const requests = this.rateLimitTracker.get(key) || [];
    if (requests.length >= this.config.rateLimitPerMinute) {
      return false;
    }
    
    requests.push(now);
    this.rateLimitTracker.set(key, requests);
    
    // Cleanup old entries
    for (const [trackingKey, timestamps] of this.rateLimitTracker.entries()) {
      if (timestamps.every(ts => now - ts > 60000)) {
        this.rateLimitTracker.delete(trackingKey);
      }
    }
    
    return true;
  }

  private mapOWMConditionToEnum(owmCode: number, description: string): WeatherCondition {
    // OpenWeatherMap condition code mapping
    if (owmCode >= 200 && owmCode < 300) return WeatherCondition.THUNDERSTORM;
    if (owmCode >= 300 && owmCode < 400) return WeatherCondition.RAIN;
    if (owmCode >= 500 && owmCode < 600) {
      return owmCode >= 520 ? WeatherCondition.HEAVY_RAIN : WeatherCondition.RAIN;
    }
    if (owmCode >= 600 && owmCode < 700) {
      return owmCode >= 620 ? WeatherCondition.HEAVY_SNOW : WeatherCondition.SNOW;
    }
    if (owmCode >= 700 && owmCode < 800) {
      if (owmCode === 741) return WeatherCondition.FOG;
      return WeatherCondition.MIST;
    }
    if (owmCode === 800) return WeatherCondition.CLEAR;
    if (owmCode === 801 || owmCode === 802) return WeatherCondition.PARTLY_CLOUDY;
    if (owmCode === 803) return WeatherCondition.CLOUDY;
    if (owmCode === 804) return WeatherCondition.OVERCAST;
    
    return WeatherCondition.CLEAR; // Default fallback
  }

  private transformOWMToWeatherData(owm: any): WeatherData {
    const condition = this.mapOWMConditionToEnum(owm.weather[0].id, owm.weather[0].description);
    
    const temperature: Temperature = {
      current: Math.round(owm.main.temp),
      feelsLike: Math.round(owm.main.feels_like),
      min: owm.main.temp_min ? Math.round(owm.main.temp_min) : undefined,
      max: owm.main.temp_max ? Math.round(owm.main.temp_max) : undefined
    };

    const wind: WindInfo = {
      speed: Math.round(owm.wind.speed * 3.6), // Convert m/s to km/h
      direction: owm.wind.deg,
      gust: owm.wind.gust ? Math.round(owm.wind.gust * 3.6) : undefined,
      directionText: this.getWindDirection(owm.wind.deg)
    };

    const precipitation: PrecipitationInfo = {
      probability: Math.round((owm.pop || 0) * 100),
      amount: owm.rain ? owm.rain['1h'] || owm.rain['3h'] : owm.snow ? owm.snow['1h'] || owm.snow['3h'] : undefined,
      type: owm.rain ? 'rain' : owm.snow ? 'snow' : undefined
    };

    return {
      temperature,
      condition,
      conditionText: owm.weather[0].description,
      humidity: owm.main.humidity,
      pressure: owm.main.pressure,
      visibility: owm.visibility ? owm.visibility / 1000 : 10, // Convert m to km
      uvIndex: 0, // UV data requires separate API call
      wind,
      precipitation,
      cloudCover: owm.clouds.all,
      dewPoint: 0 // Calculate or fetch separately
    };
  }

  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  async getCurrentWeather(location: LocationData): Promise<WeatherAPIResponse<CurrentWeatherResponse>> {
    const endpoint = 'weather';
    const params = {
      lat: location.coordinates.latitude,
      lon: location.coordinates.longitude,
      units: 'metric'
    };

    try {
      // Check cache first
      const cached = this.cache.get<CurrentWeatherResponse>(endpoint, params);
      if (cached) {
        return {
          data: cached,
          success: true,
          timestamp: new Date(),
          source: 'cache'
        };
      }

      // Check rate limit
      if (!this.checkRateLimit(endpoint)) {
        throw new Error('Rate limit exceeded');
      }

      const response = await this.api.get<OWMCurrentResponse>(endpoint, { params });
      const owmData = response.data;

      const currentWeather: CurrentWeatherResponse = {
        location,
        weather: this.transformOWMToWeatherData(owmData),
        sunTimes: {
          sunrise: new Date(owmData.sys.sunrise * 1000),
          sunset: new Date(owmData.sys.sunset * 1000)
        },
        lastUpdated: new Date()
      };

      // Cache the result
      this.cache.set(endpoint, params, currentWeather, location.id);

      return {
        data: currentWeather,
        success: true,
        timestamp: new Date(),
        source: 'api'
      };
    } catch (error) {
      return {
        data: {} as CurrentWeatherResponse,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'api'
      };
    }
  }

  async getForecast(location: LocationData): Promise<WeatherAPIResponse<WeatherForecastResponse>> {
    const endpoint = 'forecast';
    const params = {
      lat: location.coordinates.latitude,
      lon: location.coordinates.longitude,
      units: 'metric'
    };

    try {
      // Check cache first
      const cached = this.cache.get<WeatherForecastResponse>(endpoint, params);
      if (cached) {
        return {
          data: cached,
          success: true,
          timestamp: new Date(),
          source: 'cache'
        };
      }

      // Check rate limit
      if (!this.checkRateLimit(endpoint)) {
        throw new Error('Rate limit exceeded');
      }

      const [forecastResponse, currentResponse] = await Promise.all([
        this.api.get<OWMForecastResponse>(endpoint, { params }),
        this.getCurrentWeather(location)
      ]);

      const forecastData = forecastResponse.data;
      
      // Group hourly forecasts by day
      const hourlyForecasts = forecastData.list.map(item => ({
        time: new Date(item.dt * 1000),
        weather: this.transformOWMToWeatherData(item)
      }));

      // Create daily forecasts (next 7 days)
      const dailyForecasts = [];
      const groupedByDay = new Map<string, any[]>();
      
      hourlyForecasts.forEach(forecast => {
        const dateKey = forecast.time.toDateString();
        if (!groupedByDay.has(dateKey)) {
          groupedByDay.set(dateKey, []);
        }
        groupedByDay.get(dateKey)!.push(forecast);
      });

      for (const [dateKey, dayForecasts] of groupedByDay.entries()) {
        if (dailyForecasts.length >= 7) break;
        
        const date = new Date(dateKey);
        const midDayForecast = dayForecasts.find(f => 
          f.time.getHours() >= 12 && f.time.getHours() <= 15
        ) || dayForecasts[0];

        dailyForecasts.push({
          date,
          weather: midDayForecast.weather,
          hourlyForecasts: dayForecasts
        });
      }

      const forecast: WeatherForecastResponse = {
        location,
        current: currentResponse.data,
        daily: dailyForecasts,
        hourly: hourlyForecasts.slice(0, 24), // Next 24 hours
        lastUpdated: new Date()
      };

      // Cache the result
      this.cache.set(endpoint, params, forecast, location.id);

      return {
        data: forecast,
        success: true,
        timestamp: new Date(),
        source: 'api'
      };
    } catch (error) {
      return {
        data: {} as WeatherForecastResponse,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'api'
      };
    }
  }

  async searchLocations(query: string): Promise<WeatherAPIResponse<LocationSearchResponse>> {
    const endpoint = 'geo/1.0/direct';
    const params = { q: query, limit: 5 };

    try {
      // Check cache first
      const cached = this.cache.get<LocationSearchResponse>(endpoint, params);
      if (cached) {
        return {
          data: cached,
          success: true,
          timestamp: new Date(),
          source: 'cache'
        };
      }

      const response = await this.api.get<OWMGeocodeResponse[]>(endpoint, { params });
      
      const results: GeocodeResult[] = response.data.map(item => ({
        name: item.name,
        displayName: `${item.name}, ${item.state || ''} ${item.country}`.trim(),
        coordinates: {
          latitude: item.lat,
          longitude: item.lon
        },
        country: item.country,
        region: item.state
      }));

      const searchResponse: LocationSearchResponse = {
        results,
        query,
        timestamp: new Date()
      };

      // Cache the result
      this.cache.set(endpoint, params, searchResponse);

      return {
        data: searchResponse,
        success: true,
        timestamp: new Date(),
        source: 'api'
      };
    } catch (error) {
      return {
        data: { results: [], query, timestamp: new Date() },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'api'
      };
    }
  }

  clearCache(locationId?: string): void {
    if (locationId) {
      this.cache.clearLocationCache(locationId);
    } else {
      this.cache.clear();
    }
  }

  updateConfig(newConfig: Partial<WeatherAPIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default weather service instance
export const weatherService = new WeatherService({
  apiKey: process.env.REACT_APP_OPENWEATHER_API_KEY || 'demo-key',
  baseUrl: 'https://api.openweathermap.org/data/2.5/',
  timeout: 10000,
  retryAttempts: 3,
  rateLimitPerMinute: 60
});