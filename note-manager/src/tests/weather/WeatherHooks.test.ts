// Weather Hooks Unit Tests
// Test weather custom hooks functionality

import { renderHook, act } from '@testing-library/react';
import { useWeatherData, useWeatherPreferences, useLocationSearch, useGeolocation } from '../../hooks/useWeather';
import { WeatherProvider } from '../../contexts/WeatherContext';
import { weatherService } from '../../services/weatherService';
import type { LocationData } from '../../types/weather';

// Mock services
jest.mock('../../services/weatherService');
const mockWeatherService = weatherService as jest.Mocked<typeof weatherService>;

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WeatherProvider>{children}</WeatherProvider>
);

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

const mockWeatherResponse = {
  data: {
    location: mockLocation,
    weather: {
      temperature: { current: 22, feelsLike: 25 },
      condition: 'clear' as const,
      conditionText: 'Clear sky',
      humidity: 65,
      pressure: 1013,
      visibility: 10,
      uvIndex: 5,
      wind: { speed: 15, direction: 180, directionText: 'S' },
      precipitation: { probability: 0 },
      cloudCover: 10,
      dewPoint: 15
    },
    sunTimes: {
      sunrise: new Date('2023-12-01T06:30:00Z'),
      sunset: new Date('2023-12-01T17:30:00Z')
    },
    lastUpdated: new Date()
  },
  success: true,
  timestamp: new Date(),
  source: 'api' as const
};

describe('useWeatherData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWeatherService.getCurrentWeather.mockResolvedValue(mockWeatherResponse);
  });

  test('returns initial state', () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });

    expect(result.current.location).toBeNull();
    expect(result.current.weather).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('fetches weather data for location', async () => {
    mockWeatherService.getCurrentWeather.mockResolvedValue(mockWeatherResponse);

    const { result } = renderHook(() => useWeatherData(mockLocation.id), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledWith(mockLocation);
  });

  test('handles loading state', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockWeatherService.getCurrentWeather.mockReturnValue(promise as any);

    const { result } = renderHook(() => useWeatherData(), { wrapper });

    act(() => {
      result.current.refresh();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!(mockWeatherResponse);
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test('handles error state', async () => {
    const errorResponse = {
      ...mockWeatherResponse,
      success: false,
      error: 'Network error'
    };
    mockWeatherService.getCurrentWeather.mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useWeatherData(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe('Network error');
  });

  test('clears error', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });

    await act(async () => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useWeatherPreferences', () => {
  test('returns default preferences', () => {
    const { result } = renderHook(() => useWeatherPreferences(), { wrapper });

    expect(result.current.preferences.temperatureUnit).toBe('celsius');
    expect(result.current.preferences.windSpeedUnit).toBe('kmh');
    expect(result.current.preferences.pressureUnit).toBe('hpa');
  });

  test('updates preferences', () => {
    const { result } = renderHook(() => useWeatherPreferences(), { wrapper });

    act(() => {
      result.current.updatePreferences({
        temperatureUnit: 'fahrenheit'
      });
    });

    expect(result.current.preferences.temperatureUnit).toBe('fahrenheit');
  });

  test('formats temperature correctly', () => {
    const { result } = renderHook(() => useWeatherPreferences(), { wrapper });

    // Celsius
    expect(result.current.formatTemperature(22)).toBe('22°C');

    // Update to Fahrenheit
    act(() => {
      result.current.updatePreferences({
        temperatureUnit: 'fahrenheit'
      });
    });

    expect(result.current.formatTemperature(22)).toBe('72°F');
  });

  test('converts temperature units', () => {
    const { result } = renderHook(() => useWeatherPreferences(), { wrapper });

    // Celsius to Fahrenheit
    expect(result.current.convertTemperature(0, 'fahrenheit')).toBe(32);
    expect(result.current.convertTemperature(100, 'fahrenheit')).toBe(212);

    // Celsius to Celsius (no conversion)
    expect(result.current.convertTemperature(22, 'celsius')).toBe(22);
  });

  test('formats wind speed correctly', () => {
    const { result } = renderHook(() => useWeatherPreferences(), { wrapper });

    // km/h (default)
    expect(result.current.formatWindSpeed(36)).toBe('36 kmh');

    // Update to mph
    act(() => {
      result.current.updatePreferences({
        windSpeedUnit: 'mph'
      });
    });

    expect(result.current.formatWindSpeed(36)).toBe('22.4 mph');

    // Update to m/s
    act(() => {
      result.current.updatePreferences({
        windSpeedUnit: 'ms'
      });
    });

    expect(result.current.formatWindSpeed(36)).toBe('10 ms');
  });

  test('resets preferences to defaults', () => {
    const { result } = renderHook(() => useWeatherPreferences(), { wrapper });

    // Change preferences
    act(() => {
      result.current.updatePreferences({
        temperatureUnit: 'fahrenheit',
        windSpeedUnit: 'mph'
      });
    });

    // Reset
    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.preferences.temperatureUnit).toBe('celsius');
    expect(result.current.preferences.windSpeedUnit).toBe('kmh');
  });
});

describe('useLocationSearch', () => {
  const mockSearchResponse = {
    data: {
      results: [{
        name: 'Test City',
        displayName: 'Test City, US',
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        country: 'US'
      }],
      query: 'test',
      timestamp: new Date()
    },
    success: true,
    timestamp: new Date(),
    source: 'api' as const
  };

  beforeEach(() => {
    mockWeatherService.searchLocations.mockResolvedValue(mockSearchResponse);
  });

  test('searches locations', async () => {
    const { result } = renderHook(() => useLocationSearch(), { wrapper });

    await act(async () => {
      await result.current.searchLocations('test city');
    });

    expect(mockWeatherService.searchLocations).toHaveBeenCalledWith('test city');
    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].name).toBe('Test City');
  });

  test('handles search loading state', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockWeatherService.searchLocations.mockReturnValue(promise as any);

    const { result } = renderHook(() => useLocationSearch(), { wrapper });

    act(() => {
      result.current.searchLocations('test');
    });

    expect(result.current.isSearching).toBe(true);

    await act(async () => {
      resolvePromise!(mockSearchResponse);
      await promise;
    });

    expect(result.current.isSearching).toBe(false);
  });

  test('handles search errors', async () => {
    const errorResponse = {
      ...mockSearchResponse,
      success: false,
      error: 'Search failed'
    };
    mockWeatherService.searchLocations.mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useLocationSearch(), { wrapper });

    await act(async () => {
      await result.current.searchLocations('test');
    });

    expect(result.current.searchError).toBe('Search failed');
  });

  test('adds location from search result', () => {
    const { result } = renderHook(() => useLocationSearch(), { wrapper });

    const searchResult = mockSearchResponse.data.results[0];

    act(() => {
      const location = result.current.addLocationFromResult(searchResult);
      expect(location.name).toBe('Test City');
      expect(location.coordinates).toEqual(searchResult.coordinates);
    });
  });

  test('clears search results', async () => {
    const { result } = renderHook(() => useLocationSearch(), { wrapper });

    // First perform a search
    await act(async () => {
      await result.current.searchLocations('test');
    });

    expect(result.current.searchResults).toHaveLength(1);

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchResults).toHaveLength(0);
    expect(result.current.searchError).toBeNull();
  });
});

describe('useGeolocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requests location permission', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });
    });

    const { result } = renderHook(() => useGeolocation(), { wrapper });

    await act(async () => {
      const hasPermission = await result.current.requestPermission();
      expect(hasPermission).toBe(true);
    });
  });

  test('gets current position', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation(), { wrapper });

    await act(async () => {
      const position = await result.current.getCurrentPosition();
      expect(position).toEqual(mockPosition);
    });

    expect(result.current.position).toEqual(mockPosition);
  });

  test('handles geolocation errors', async () => {
    const mockError = {
      code: 1,
      message: 'User denied the request for Geolocation.'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error!(mockError);
    });

    const { result } = renderHook(() => useGeolocation(), { wrapper });

    await act(async () => {
      try {
        await result.current.getCurrentPosition();
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });

    expect(result.current.error).toBe(mockError.message);
  });

  test('watches position changes', () => {
    const mockWatchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(mockWatchId);

    const { result } = renderHook(() => useGeolocation(), { wrapper });

    act(() => {
      const watchId = result.current.watchPosition();
      expect(watchId).toBe(mockWatchId);
    });

    expect(mockGeolocation.watchPosition).toHaveBeenCalled();
  });

  test('clears position watch', () => {
    const { result } = renderHook(() => useGeolocation(), { wrapper });

    act(() => {
      result.current.clearWatch(123);
    });

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
  });

  test('clears error', () => {
    const { result } = renderHook(() => useGeolocation(), { wrapper });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});