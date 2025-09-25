// Weather System Type Definitions
// Comprehensive TypeScript interfaces for weather data, location data, preferences, and API responses

// Weather condition codes and descriptions
export enum WeatherCondition {
  CLEAR = 'clear',
  PARTLY_CLOUDY = 'partly-cloudy', 
  CLOUDY = 'cloudy',
  OVERCAST = 'overcast',
  RAIN = 'rain',
  HEAVY_RAIN = 'heavy-rain',
  SNOW = 'snow',
  HEAVY_SNOW = 'heavy-snow',
  THUNDERSTORM = 'thunderstorm',
  FOG = 'fog',
  MIST = 'mist',
  HAIL = 'hail',
  SLEET = 'sleet',
  WIND = 'wind',
  TORNADO = 'tornado',
  HURRICANE = 'hurricane'
}

// Weather alert severity levels
export enum WeatherAlertSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate', 
  SEVERE = 'severe',
  EXTREME = 'extreme'
}

// Temperature and measurement units
export interface Temperature {
  current: number;
  feelsLike: number;
  min?: number;
  max?: number;
}

export interface WindInfo {
  speed: number;
  direction: number;
  gust?: number;
  directionText?: string; // N, NE, E, SE, S, SW, W, NW
}

export interface PrecipitationInfo {
  probability: number; // 0-100 percentage
  amount?: number; // mm
  type?: 'rain' | 'snow' | 'sleet' | 'hail';
}

// Core weather data structure
export interface WeatherData {
  temperature: Temperature;
  condition: WeatherCondition;
  conditionText: string;
  humidity: number; // 0-100 percentage
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number; // 0-11+ UV index
  wind: WindInfo;
  precipitation: PrecipitationInfo;
  cloudCover: number; // 0-100 percentage
  dewPoint: number; // celsius
}

// Location data structure
export interface LocationData {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  country: string;
  region?: string;
  isFavorite: boolean;
  isDefault: boolean;
  isCurrentLocation?: boolean;
}

// Current weather response
export interface CurrentWeatherResponse {
  location: LocationData;
  weather: WeatherData;
  sunTimes: {
    sunrise: Date;
    sunset: Date;
  };
  lastUpdated: Date;
}

// Forecast data structures
export interface HourlyForecast {
  time: Date;
  weather: WeatherData;
}

export interface DailyForecast {
  date: Date;
  weather: WeatherData;
  hourlyForecasts?: HourlyForecast[];
}

export interface WeatherForecastResponse {
  location: LocationData;
  current: CurrentWeatherResponse;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  lastUpdated: Date;
}

// Weather alerts
export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: WeatherAlertSeverity;
  startTime: Date;
  endTime: Date;
  areas: string[];
  instruction?: string;
  isActive: boolean;
}

// Weather preferences
export interface WeatherPreferences {
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'mph' | 'ms';
  pressureUnit: 'hpa' | 'inhg' | 'mmhg';
  distanceUnit: 'km' | 'miles';
  timeFormat: '12h' | '24h';
  autoLocation: boolean;
  notifications: {
    dailySummary: boolean;
    severeWeather: boolean;
    precipitationAlerts: boolean;
    temperatureThresholds: {
      enabled: boolean;
      high: number;
      low: number;
    };
  };
  refreshInterval: number; // minutes
  cacheEnabled: boolean;
  offlineMode: boolean;
}

// Weather API service interfaces
export interface WeatherAPIConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
}

export interface WeatherAPIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
  source: 'api' | 'cache' | 'offline';
}

// Geocoding and location services
export interface GeocodeResult {
  name: string;
  displayName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  country: string;
  region?: string;
  timezone?: string;
}

export interface LocationSearchResponse {
  results: GeocodeResult[];
  query: string;
  timestamp: Date;
}

// Weather history and analytics
export interface WeatherHistoryEntry {
  date: Date;
  location: LocationData;
  weather: WeatherData;
  noteIds?: string[]; // Associated note IDs
}

export interface WeatherStats {
  averageTemperature: number;
  temperatureRange: { min: number; max: number };
  mostCommonCondition: WeatherCondition;
  precipitationDays: number;
  totalPrecipitation: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

// Weather-enhanced note integration
export interface WeatherMetadata {
  locationId: string;
  weather: WeatherData;
  timestamp: Date;
  isAutoTagged: boolean;
}

// Note extension for weather integration
export interface WeatherEnhancedNote {
  id: string;
  title: string;
  content: string;
  weather?: WeatherMetadata;
  weatherTags?: string[];
  isWeatherTagged?: boolean;
}

// Weather context state
export interface WeatherContextState {
  currentLocation: LocationData | null;
  locations: LocationData[];
  currentWeather: CurrentWeatherResponse | null;
  forecast: WeatherForecastResponse | null;
  alerts: WeatherAlert[];
  preferences: WeatherPreferences;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Weather actions for context
export interface WeatherActions {
  setCurrentLocation: (location: LocationData) => void;
  addLocation: (location: LocationData) => void;
  removeLocation: (locationId: string) => void;
  updateLocation: (locationId: string, updates: Partial<LocationData>) => void;
  refreshWeather: (locationId?: string) => Promise<void>;
  refreshForecast: (locationId?: string) => Promise<void>;
  updatePreferences: (preferences: Partial<WeatherPreferences>) => void;
  clearError: () => void;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentPosition: () => Promise<GeolocationPosition>;
}

// Weather notification types
export interface WeatherNotification {
  id: string;
  type: 'alert' | 'summary' | 'threshold' | 'forecast';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  locationId: string;
  isRead: boolean;
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
}

// Cache management
export interface WeatherCache {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
  locationId?: string;
}

export interface WeatherCacheConfig {
  maxAge: number; // minutes
  maxEntries: number;
  compression: boolean;
  syncEnabled: boolean;
}

// Error handling
export interface WeatherError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export enum WeatherErrorCodes {
  API_KEY_INVALID = 'API_KEY_INVALID',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  CACHE_ERROR = 'CACHE_ERROR'
}

// Weather widget configuration
export interface WeatherWidgetConfig {
  showCurrent: boolean;
  showForecast: boolean;
  showAlerts: boolean;
  compactMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  locationIds: string[];
}

// Default values and constants
export const DEFAULT_WEATHER_PREFERENCES: WeatherPreferences = {
  temperatureUnit: 'celsius',
  windSpeedUnit: 'kmh',
  pressureUnit: 'hpa',
  distanceUnit: 'km',
  timeFormat: '24h',
  autoLocation: true,
  notifications: {
    dailySummary: true,
    severeWeather: true,
    precipitationAlerts: true,
    temperatureThresholds: {
      enabled: false,
      high: 30,
      low: 0
    }
  },
  refreshInterval: 15,
  cacheEnabled: true,
  offlineMode: false
};

export const WEATHER_ICON_MAP: Record<WeatherCondition, string> = {
  [WeatherCondition.CLEAR]: '☀️',
  [WeatherCondition.PARTLY_CLOUDY]: '⛅',
  [WeatherCondition.CLOUDY]: '☁️',
  [WeatherCondition.OVERCAST]: '☁️',
  [WeatherCondition.RAIN]: '🌧️',
  [WeatherCondition.HEAVY_RAIN]: '⛈️',
  [WeatherCondition.SNOW]: '❄️',
  [WeatherCondition.HEAVY_SNOW]: '🌨️',
  [WeatherCondition.THUNDERSTORM]: '⛈️',
  [WeatherCondition.FOG]: '🌫️',
  [WeatherCondition.MIST]: '🌫️',
  [WeatherCondition.HAIL]: '🌨️',
  [WeatherCondition.SLEET]: '🌨️',
  [WeatherCondition.WIND]: '💨',
  [WeatherCondition.TORNADO]: '🌪️',
  [WeatherCondition.HURRICANE]: '🌀'
};