// 天气状况枚举
export enum WeatherCondition {
  CLEAR_DAY = 'clear-day',
  CLEAR_NIGHT = 'clear-night',
  PARTLY_CLOUDY_DAY = 'partly-cloudy-day',
  PARTLY_CLOUDY_NIGHT = 'partly-cloudy-night',
  CLOUDY = 'cloudy',
  OVERCAST = 'overcast',
  LIGHT_RAIN = 'light-rain',
  MODERATE_RAIN = 'moderate-rain',
  HEAVY_RAIN = 'heavy-rain',
  THUNDERSTORM = 'thunderstorm',
  LIGHT_SNOW = 'light-snow',
  MODERATE_SNOW = 'moderate-snow',
  HEAVY_SNOW = 'heavy-snow',
  FOG = 'fog',
  HAZE = 'haze',
  SAND = 'sand',
  DUST = 'dust',
  WIND = 'wind'
}

// 当前天气数据
export interface CurrentWeatherData {
  locationId: string;
  updateTime: Date;
  weather: WeatherCondition;
  description: string;
  
  // 温度数据
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  dewPoint?: number;
  
  // 大气数据
  humidity: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  
  // 风力数据
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  
  // 降水数据
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  
  // 日照信息
  sunrise: Date;
  sunset: Date;
}

// 小时天气数据
export interface HourlyWeatherData {
  time: Date;
  temperature: number;
  feelsLike: number;
  weather: WeatherCondition;
  description: string;
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  pressure: number;
  cloudCover: number;
  uvIndex: number;
}

// 日天气数据
export interface DailyWeatherData {
  date: Date;
  weather: WeatherCondition;
  description: string;
  tempMin: number;
  tempMax: number;
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  pressure: number;
  uvIndex: number;
  sunrise: Date;
  sunset: Date;
}

// 空气质量数据
export interface AirQualityData {
  aqi: number;
  level: string;
  primaryPollutant: string;
  pm25: number;
  pm10: number;
  so2: number;
  no2: number;
  co: number;
  o3: number;
  updateTime: Date;
}

// 天气预警
export interface WeatherAlert {
  id: string;
  type: string;
  level: 'yellow' | 'orange' | 'red';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  regions: string[];
}

// API响应基础类型
export interface WeatherApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}