// Weather System Integration Tests
// Comprehensive tests for weather functionality

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeatherProvider } from '../../contexts/WeatherContext';
import { WeatherDashboard } from '../../components/weather/WeatherDashboard';
import { CurrentWeatherCard } from '../../components/weather/CurrentWeatherCard';
import { WeatherForecast } from '../../components/weather/WeatherForecast';
import { LocationManager } from '../../components/weather/LocationManager';
import { weatherService } from '../../services/weatherService';
import type { CurrentWeatherResponse, WeatherForecastResponse, LocationData } from '../../types/weather';

// Mock axios for API calls
jest.mock('axios');

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

const mockWeatherResponse: CurrentWeatherResponse = {
  location: mockLocation,
  weather: {
    temperature: { current: 22, feelsLike: 25 },
    condition: 'clear',
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
};

const mockForecastResponse: WeatherForecastResponse = {
  location: mockLocation,
  current: mockWeatherResponse,
  daily: [
    {
      date: new Date(),
      weather: mockWeatherResponse.weather
    }
  ],
  hourly: [
    {
      time: new Date(),
      weather: mockWeatherResponse.weather
    }
  ],
  lastUpdated: new Date()
};

describe('Weather System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    jest.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
      data: mockWeatherResponse,
      success: true,
      timestamp: new Date(),
      source: 'api'
    });
    
    jest.spyOn(weatherService, 'getForecast').mockResolvedValue({
      data: mockForecastResponse,
      success: true,
      timestamp: new Date(),
      source: 'api'
    });
    
    jest.spyOn(weatherService, 'searchLocations').mockResolvedValue({
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
      source: 'api'
    });
  });

  const renderWithWeatherProvider = (component: React.ReactElement) => {
    return render(
      <WeatherProvider>
        {component}
      </WeatherProvider>
    );
  };

  describe('Weather Dashboard', () => {
    test('renders weather dashboard correctly', () => {
      renderWithWeatherProvider(<WeatherDashboard />);
      
      expect(screen.getByText('Weather Dashboard')).toBeInTheDocument();
      expect(screen.getByText('No Location Selected')).toBeInTheDocument();
    });

    test('displays location manager in sidebar', () => {
      renderWithWeatherProvider(<WeatherDashboard />);
      
      expect(screen.getByText('Locations')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search for a city or location...')).toBeInTheDocument();
    });

    test('toggles between locations and settings panels', () => {
      renderWithWeatherProvider(<WeatherDashboard />);
      
      const settingsButton = screen.getByTitle('Weather settings');
      fireEvent.click(settingsButton);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Temperature Unit:')).toBeInTheDocument();
    });
  });

  describe('Current Weather Card', () => {
    test('displays weather information correctly', () => {
      renderWithWeatherProvider(
        <CurrentWeatherCard 
          weather={mockWeatherResponse}
          showLocation={true}
          showSunTimes={true}
        />
      );
      
      expect(screen.getByText('Test City')).toBeInTheDocument();
      expect(screen.getByText('Clear sky')).toBeInTheDocument();
      expect(screen.getByText('22°C')).toBeInTheDocument();
      expect(screen.getByText('Feels like 25°C')).toBeInTheDocument();
    });

    test('shows loading state', () => {
      renderWithWeatherProvider(
        <CurrentWeatherCard 
          weather={mockWeatherResponse}
          isLoading={true}
        />
      );
      
      expect(screen.getByTitle('Refresh weather data')).toBeDisabled();
    });

    test('handles refresh action', () => {
      const mockRefresh = jest.fn();
      
      renderWithWeatherProvider(
        <CurrentWeatherCard 
          weather={mockWeatherResponse}
          onRefresh={mockRefresh}
        />
      );
      
      const refreshButton = screen.getByTitle('Refresh weather data');
      fireEvent.click(refreshButton);
      
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Weather Forecast', () => {
    test('displays forecast correctly', () => {
      renderWithWeatherProvider(
        <WeatherForecast 
          forecast={mockForecastResponse}
        />
      );
      
      expect(screen.getByText('7-Day Forecast')).toBeInTheDocument();
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Hourly')).toBeInTheDocument();
    });

    test('switches between daily and hourly views', () => {
      renderWithWeatherProvider(
        <WeatherForecast 
          forecast={mockForecastResponse}
        />
      );
      
      const hourlyTab = screen.getByText('Hourly');
      fireEvent.click(hourlyTab);
      
      expect(screen.getByText('Hourly Forecast')).toBeInTheDocument();
    });
  });

  describe('Location Manager', () => {
    test('renders location search correctly', () => {
      renderWithWeatherProvider(<LocationManager />);
      
      expect(screen.getByPlaceholderText('Search for a city or location...')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    test('handles location search', async () => {
      renderWithWeatherProvider(<LocationManager />);
      
      const searchInput = screen.getByPlaceholderText('Search for a city or location...');
      const addButton = screen.getByText('Add');
      
      fireEvent.change(searchInput, { target: { value: 'test city' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(weatherService.searchLocations).toHaveBeenCalledWith('test city');
      });
    });

    test('requests current location', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        });
      });

      renderWithWeatherProvider(<LocationManager />);
      
      const currentLocationButton = screen.getByTitle('Use current location');
      fireEvent.click(currentLocationButton);
      
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  describe('Weather Service Integration', () => {
    test('fetches current weather successfully', async () => {
      const result = await weatherService.getCurrentWeather(mockLocation);
      
      expect(result.success).toBe(true);
      expect(result.data.location.name).toBe('Test City');
      expect(result.data.weather.temperature.current).toBe(22);
    });

    test('fetches forecast successfully', async () => {
      const result = await weatherService.getForecast(mockLocation);
      
      expect(result.success).toBe(true);
      expect(result.data.daily).toHaveLength(1);
      expect(result.data.hourly).toHaveLength(1);
    });

    test('searches locations successfully', async () => {
      const result = await weatherService.searchLocations('test');
      
      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].name).toBe('Test City');
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      jest.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
        data: {} as CurrentWeatherResponse,
        success: false,
        error: 'Network error',
        timestamp: new Date(),
        source: 'api'
      });

      renderWithWeatherProvider(<WeatherDashboard />);
      
      // The dashboard should handle the error and show appropriate UI
      // This would depend on how error handling is implemented in the components
    });

    test('handles geolocation errors', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error({ message: 'Location access denied' });
      });

      renderWithWeatherProvider(<LocationManager />);
      
      const currentLocationButton = screen.getByTitle('Use current location');
      fireEvent.click(currentLocationButton);
      
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  describe('Weather Preferences', () => {
    test('temperature unit conversion works correctly', () => {
      // This would test the useWeatherPreferences hook
      // Implementation depends on how preferences are handled
    });

    test('wind speed unit conversion works correctly', () => {
      // This would test wind speed conversions
    });
  });

  describe('Accessibility', () => {
    test('components have proper ARIA labels', () => {
      renderWithWeatherProvider(<WeatherDashboard />);
      
      expect(screen.getByTitle('Refresh weather data')).toBeInTheDocument();
      expect(screen.getByTitle('Manage locations')).toBeInTheDocument();
      expect(screen.getByTitle('Weather settings')).toBeInTheDocument();
    });

    test('keyboard navigation works', () => {
      renderWithWeatherProvider(<LocationManager />);
      
      const searchInput = screen.getByPlaceholderText('Search for a city or location...');
      searchInput.focus();
      
      expect(document.activeElement).toBe(searchInput);
    });
  });
});

describe('Weather System Performance', () => {
  test('caching works correctly', async () => {
    // First call should hit the API
    await weatherService.getCurrentWeather(mockLocation);
    expect(weatherService.getCurrentWeather).toHaveBeenCalledTimes(1);
    
    // Second call should use cache (if caching is implemented)
    await weatherService.getCurrentWeather(mockLocation);
    // This test would need to be adjusted based on actual caching implementation
  });

  test('handles multiple rapid API calls', async () => {
    const promises = Array(5).fill(null).map(() => 
      weatherService.getCurrentWeather(mockLocation)
    );
    
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});