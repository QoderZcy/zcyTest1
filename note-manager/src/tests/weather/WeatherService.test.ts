// Weather Service Unit Tests
// Comprehensive tests for weather API service functionality

import { weatherService, WeatherService } from '../../services/weatherService';
import { weatherNotificationService } from '../../services/weatherNotificationService';
import type { LocationData, WeatherAPIConfig } from '../../types/weather';

// Mock axios
jest.mock('axios');
const mockAxios = require('axios');

// Test data
const mockLocation: LocationData = {
  id: 'test-location',
  name: 'Test City',
  coordinates: { latitude: 40.7128, longitude: -74.0060 },
  timezone: 'America/New_York',
  country: 'US',
  isFavorite: false,
  isDefault: true,
  isCurrentLocation: false
};

const mockOWMResponse = {
  coord: { lon: -74.0060, lat: 40.7128 },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  main: {
    temp: 22,
    feels_like: 25,
    temp_min: 20,
    temp_max: 24,
    pressure: 1013,
    humidity: 65
  },
  visibility: 10000,
  wind: { speed: 4.5, deg: 180 },
  clouds: { all: 10 },
  dt: Date.now() / 1000,
  sys: {
    country: 'US',
    sunrise: Date.now() / 1000 - 3600,
    sunset: Date.now() / 1000 + 3600
  },
  timezone: -18000,
  id: 5128581,
  name: 'New York',
  cod: 200
};

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.create.mockReturnValue(mockAxios);
    mockAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    };
  });

  describe('Constructor and Configuration', () => {
    test('creates service with default config', () => {
      const config: WeatherAPIConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.openweathermap.org/data/2.5/',
        timeout: 10000,
        retryAttempts: 3,
        rateLimitPerMinute: 60
      };

      const service = new WeatherService(config);
      expect(service).toBeInstanceOf(WeatherService);
    });

    test('updates configuration correctly', () => {
      const newConfig = { apiKey: 'new-key', timeout: 5000 };
      weatherService.updateConfig(newConfig);
      // Configuration should be updated internally
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      mockAxios.get.mockResolvedValue({ data: mockOWMResponse });
    });

    test('fetches current weather successfully', async () => {
      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.success).toBe(true);
      expect(result.data.location.name).toBe(mockLocation.name);
      expect(result.data.weather.temperature.current).toBe(22);
      expect(mockAxios.get).toHaveBeenCalledWith('weather', {
        params: {
          lat: mockLocation.coordinates.latitude,
          lon: mockLocation.coordinates.longitude,
          units: 'metric'
        }
      });
    });

    test('handles API errors gracefully', async () => {
      const error = new Error('Network error');
      mockAxios.get.mockRejectedValue(error);

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('retries on network failure', async () => {
      mockAxios.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockOWMResponse });

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.success).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Transformation', () => {
    test('transforms OpenWeatherMap data correctly', async () => {
      mockAxios.get.mockResolvedValue({ data: mockOWMResponse });

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.data.weather.condition).toBe('clear');
      expect(result.data.weather.temperature.current).toBe(22);
      expect(result.data.weather.temperature.feelsLike).toBe(25);
      expect(result.data.weather.humidity).toBe(65);
      expect(result.data.weather.pressure).toBe(1013);
    });

    test('handles missing optional data', async () => {
      const incompleteResponse = {
        ...mockOWMResponse,
        wind: { speed: 4.5, deg: 180 }, // Missing gust
        main: { ...mockOWMResponse.main, temp_min: undefined }
      };

      mockAxios.get.mockResolvedValue({ data: incompleteResponse });

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.success).toBe(true);
      expect(result.data.weather.wind.gust).toBeUndefined();
      expect(result.data.weather.temperature.min).toBeUndefined();
    });
  });

  describe('Caching', () => {
    test('returns cached data on subsequent calls', async () => {
      mockAxios.get.mockResolvedValue({ data: mockOWMResponse });

      // First call should hit API
      const result1 = await weatherService.getCurrentWeather(mockLocation);
      expect(result1.source).toBe('api');

      // Second call should return cache
      const result2 = await weatherService.getCurrentWeather(mockLocation);
      
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    test('clears cache for specific location', () => {
      weatherService.clearCache(mockLocation.id);
      // Cache should be cleared for the location
    });

    test('clears all cache', () => {
      weatherService.clearCache();
      // All cache should be cleared
    });
  });

  describe('Rate Limiting', () => {
    test('respects rate limits', async () => {
      mockAxios.get.mockResolvedValue({ data: mockOWMResponse });

      // Make multiple rapid requests
      const promises = Array(65).fill(null).map(() => 
        weatherService.getCurrentWeather(mockLocation)
      );

      const results = await Promise.allSettled(promises);
      
      // Some requests should be rate limited
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      expect(rejectedCount).toBeGreaterThan(0);
    });
  });

  describe('Location Search', () => {
    const mockGeocodeResponse = [{
      name: 'Test City',
      lat: 40.7128,
      lon: -74.0060,
      country: 'US',
      state: 'NY'
    }];

    test('searches locations successfully', async () => {
      mockAxios.get.mockResolvedValue({ data: mockGeocodeResponse });

      const result = await weatherService.searchLocations('test city');

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].name).toBe('Test City');
    });

    test('handles empty search results', async () => {
      mockAxios.get.mockResolvedValue({ data: [] });

      const result = await weatherService.searchLocations('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('handles 401 API key errors', async () => {
      const error = { response: { status: 401, data: 'Invalid API key' } };
      mockAxios.get.mockRejectedValue(error);

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    test('handles 404 location not found', async () => {
      const error = { response: { status: 404, data: 'Location not found' } };
      mockAxios.get.mockRejectedValue(error);

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Location not found');
    });

    test('handles 429 rate limit errors', async () => {
      const error = { response: { status: 429, data: 'Too many requests' } };
      mockAxios.get.mockRejectedValue(error);

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });
});

describe('WeatherNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock Notification API
    global.Notification = jest.fn() as any;
    Object.defineProperty(global.Notification, 'permission', {
      value: 'granted',
      writable: true
    });
    Object.defineProperty(global.Notification, 'requestPermission', {
      value: jest.fn().mockResolvedValue('granted'),
      writable: true
    });
  });

  describe('Notification Creation', () => {
    test('creates weather alert notification', () => {
      const alert = {
        id: 'alert-1',
        title: 'Severe Thunderstorm Warning',
        description: 'Severe thunderstorms expected',
        severity: 'severe' as const,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        areas: ['test-location'],
        isActive: true
      };

      const preferences = {
        notifications: { severeWeather: true },
        temperatureUnit: 'celsius' as const
      };

      const notification = weatherNotificationService.createWeatherAlert(
        alert,
        mockLocation,
        preferences as any
      );

      expect(notification.type).toBe('alert');
      expect(notification.title).toContain('Weather Alert');
      expect(notification.severity).toBe('error');
    });

    test('creates daily summary notification', () => {
      const weather = {
        temperature: { current: 22 },
        conditionText: 'Clear sky',
        precipitation: { probability: 20 }
      };

      const preferences = {
        notifications: { dailySummary: true },
        temperatureUnit: 'celsius' as const
      };

      const notification = weatherNotificationService.createDailySummary(
        weather as any,
        mockLocation,
        preferences as any
      );

      expect(notification.type).toBe('summary');
      expect(notification.message).toContain('22°C');
      expect(notification.message).toContain('Clear sky');
    });

    test('creates temperature threshold notification', () => {
      const weather = {
        temperature: { current: 35 }
      };

      const preferences = {
        notifications: {
          temperatureThresholds: { high: 30, low: 0 }
        },
        temperatureUnit: 'celsius' as const
      };

      const notification = weatherNotificationService.createTemperatureThreshold(
        weather as any,
        mockLocation,
        preferences as any,
        'high'
      );

      expect(notification.type).toBe('threshold');
      expect(notification.severity).toBe('warning');
      expect(notification.message).toContain('exceeds');
    });
  });

  describe('Notification Management', () => {
    test('marks notification as read', () => {
      const notification = weatherNotificationService.createDailySummary(
        { temperature: { current: 20 }, conditionText: 'Clear' } as any,
        mockLocation,
        { notifications: { dailySummary: true }, temperatureUnit: 'celsius' } as any
      );

      expect(notification.isRead).toBe(false);

      weatherNotificationService.markAsRead(notification.id);
      const notifications = weatherNotificationService.getNotifications();
      const updatedNotification = notifications.find(n => n.id === notification.id);

      expect(updatedNotification?.isRead).toBe(true);
    });

    test('dismisses notification', () => {
      const notification = weatherNotificationService.createDailySummary(
        { temperature: { current: 20 }, conditionText: 'Clear' } as any,
        mockLocation,
        { notifications: { dailySummary: true }, temperatureUnit: 'celsius' } as any
      );

      weatherNotificationService.dismissNotification(notification.id);
      const notifications = weatherNotificationService.getNotifications();

      expect(notifications.find(n => n.id === notification.id)).toBeUndefined();
    });

    test('clears old notifications', () => {
      // Create old notification by mocking Date
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      jest.spyOn(Date.prototype, 'getTime').mockReturnValue(oldDate.getTime());

      const oldNotification = weatherNotificationService.createDailySummary(
        { temperature: { current: 20 }, conditionText: 'Clear' } as any,
        mockLocation,
        { notifications: { dailySummary: true }, temperatureUnit: 'celsius' } as any
      );

      jest.restoreAllMocks();

      weatherNotificationService.clearOldNotifications();
      const notifications = weatherNotificationService.getNotifications();

      expect(notifications.find(n => n.id === oldNotification.id)).toBeUndefined();
    });
  });

  describe('Browser Notifications', () => {
    test('requests notification permission', async () => {
      const hasPermission = await weatherNotificationService.requestNotificationPermission();
      
      expect(hasPermission).toBe(true);
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    test('handles permission denied', async () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'denied'
      });

      const hasPermission = await weatherNotificationService.requestNotificationPermission();
      
      expect(hasPermission).toBe(false);
    });
  });

  describe('Data Persistence', () => {
    test('saves notifications to localStorage', () => {
      weatherNotificationService.createDailySummary(
        { temperature: { current: 20 }, conditionText: 'Clear' } as any,
        mockLocation,
        { notifications: { dailySummary: true }, temperatureUnit: 'celsius' } as any
      );

      const stored = localStorage.getItem('weather_notifications');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    test('loads notifications from localStorage', () => {
      const testNotification = {
        id: 'test-1',
        type: 'summary',
        title: 'Test',
        message: 'Test message',
        severity: 'info',
        timestamp: new Date().toISOString(),
        locationId: 'test',
        isRead: false
      };

      localStorage.setItem('weather_notifications', JSON.stringify([[testNotification.id, testNotification]]));

      // Create new service instance to trigger loading
      const newService = new (weatherNotificationService.constructor as any)();
      const notifications = newService.getNotifications();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('test-1');
    });
  });
});