// Weather Custom Hooks
// Specialized React hooks for weather data management and location services

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWeatherContext } from '../contexts/WeatherContext';
import { weatherService } from '../services/weatherService';
import type {
  LocationData,
  CurrentWeatherResponse,
  WeatherForecastResponse,
  WeatherPreferences,
  GeocodeResult,
  LocationSearchResponse,
  WeatherAPIResponse,
  WeatherData,
  WeatherAlert,
  WeatherNotification,
  WeatherHistoryEntry
} from '../types/weather';

// Main weather data hook
export const useWeatherData = (locationId?: string) => {
  const { state, actions } = useWeatherContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine target location
  const targetLocation = useMemo(() => {
    if (locationId) {
      return state.locations.find(loc => loc.id === locationId) || state.currentLocation;
    }
    return state.currentLocation;
  }, [locationId, state.locations, state.currentLocation]);

  // Get weather data for target location
  const weatherData = useMemo(() => {
    if (!targetLocation) return null;
    
    // Return current weather if it matches the target location
    if (state.currentWeather?.location.id === targetLocation.id) {
      return state.currentWeather;
    }
    
    return null;
  }, [state.currentWeather, targetLocation]);

  // Refresh weather data
  const refresh = useCallback(async () => {
    if (!targetLocation || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await actions.refreshWeather(targetLocation.id);
    } finally {
      setIsRefreshing(false);
    }
  }, [targetLocation, isRefreshing, actions]);

  // Auto-refresh on location change
  useEffect(() => {
    if (targetLocation && !weatherData && !state.isLoading) {
      refresh();
    }
  }, [targetLocation, weatherData, state.isLoading, refresh]);

  return {
    location: targetLocation,
    weather: weatherData,
    isLoading: state.isLoading || isRefreshing,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refresh,
    clearError: actions.clearError
  };
};

// Location-specific weather hook
export const useLocationWeather = (location: LocationData) => {
  const [weatherData, setWeatherData] = useState<CurrentWeatherResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!location || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await weatherService.getCurrentWeather(location);
      
      if (response.success) {
        setWeatherData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch weather data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [location, isLoading]);

  // Auto-fetch on location change
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return {
    weather: weatherData,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchWeather,
    clearError: () => setError(null)
  };
};

// Weather preferences hook
export const useWeatherPreferences = () => {
  const { state, actions } = useWeatherContext();

  const updatePreferences = useCallback((updates: Partial<WeatherPreferences>) => {
    actions.updatePreferences(updates);
  }, [actions]);

  const resetPreferences = useCallback(() => {
    const { DEFAULT_WEATHER_PREFERENCES } = require('../types/weather');
    actions.updatePreferences(DEFAULT_WEATHER_PREFERENCES);
  }, [actions]);

  // Temperature conversion utilities
  const convertTemperature = useCallback((celsius: number, toUnit?: 'celsius' | 'fahrenheit') => {
    const unit = toUnit || state.preferences.temperatureUnit;
    if (unit === 'fahrenheit') {
      return (celsius * 9/5) + 32;
    }
    return celsius;
  }, [state.preferences.temperatureUnit]);

  const formatTemperature = useCallback((celsius: number, showUnit = true) => {
    const converted = convertTemperature(celsius);
    const rounded = Math.round(converted);
    const unit = state.preferences.temperatureUnit === 'fahrenheit' ? '°F' : '°C';
    return showUnit ? `${rounded}${unit}` : rounded.toString();
  }, [convertTemperature, state.preferences.temperatureUnit]);

  // Wind speed conversion
  const convertWindSpeed = useCallback((kmh: number, toUnit?: string) => {
    const unit = toUnit || state.preferences.windSpeedUnit;
    switch (unit) {
      case 'mph':
        return kmh * 0.621371;
      case 'ms':
        return kmh / 3.6;
      default:
        return kmh;
    }
  }, [state.preferences.windSpeedUnit]);

  const formatWindSpeed = useCallback((kmh: number, showUnit = true) => {
    const converted = convertWindSpeed(kmh);
    const rounded = Math.round(converted * 10) / 10;
    const unit = state.preferences.windSpeedUnit;
    return showUnit ? `${rounded} ${unit}` : rounded.toString();
  }, [convertWindSpeed, state.preferences.windSpeedUnit]);

  return {
    preferences: state.preferences,
    updatePreferences,
    resetPreferences,
    convertTemperature,
    formatTemperature,
    convertWindSpeed,
    formatWindSpeed
  };
};

// Location search and management hook
export const useLocationSearch = () => {
  const { state, actions } = useWeatherContext();
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await weatherService.searchLocations(query);
      
      if (response.success) {
        setSearchResults(response.data.results);
      } else {
        setSearchError(response.error || 'Failed to search locations');
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [isSearching]);

  const addLocationFromResult = useCallback((result: GeocodeResult) => {
    const location: LocationData = {
      id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: result.name,
      coordinates: result.coordinates,
      timezone: result.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: result.country,
      region: result.region,
      isFavorite: false,
      isDefault: false,
      isCurrentLocation: false
    };

    actions.addLocation(location);
    return location;
  }, [actions]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    searchLocations,
    addLocationFromResult,
    clearSearch,
    locations: state.locations,
    currentLocation: state.currentLocation,
    addLocation: actions.addLocation,
    removeLocation: actions.removeLocation,
    updateLocation: actions.updateLocation,
    setCurrentLocation: actions.setCurrentLocation
  };
};

// Weather forecast hook
export const useWeatherForecast = (locationId?: string) => {
  const { state, actions } = useWeatherContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine target location
  const targetLocation = useMemo(() => {
    if (locationId) {
      return state.locations.find(loc => loc.id === locationId) || state.currentLocation;
    }
    return state.currentLocation;
  }, [locationId, state.locations, state.currentLocation]);

  // Get forecast data for target location
  const forecastData = useMemo(() => {
    if (!targetLocation) return null;
    
    if (state.forecast?.location.id === targetLocation.id) {
      return state.forecast;
    }
    
    return null;
  }, [state.forecast, targetLocation]);

  const refreshForecast = useCallback(async () => {
    if (!targetLocation || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await actions.refreshForecast(targetLocation.id);
    } finally {
      setIsRefreshing(false);
    }
  }, [targetLocation, isRefreshing, actions]);

  // Auto-refresh on location change
  useEffect(() => {
    if (targetLocation && !forecastData && !state.isLoading) {
      refreshForecast();
    }
  }, [targetLocation, forecastData, state.isLoading, refreshForecast]);

  return {
    location: targetLocation,
    forecast: forecastData,
    isLoading: state.isLoading || isRefreshing,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refresh: refreshForecast,
    clearError: actions.clearError
  };
};

// Geolocation hook
export const useGeolocation = () => {
  const { actions } = useWeatherContext();
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permission = await actions.requestLocationPermission();
      setHasPermission(permission);
      return permission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission request failed';
      setError(errorMessage);
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [actions]);

  const getCurrentPosition = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pos = await actions.getCurrentPosition();
      setPosition(pos);
      setHasPermission(true);
      return pos;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get position';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [actions]);

  const watchPosition = useCallback((options?: PositionOptions) => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options
      }
    );

    return watchId;
  }, []);

  const clearWatch = useCallback((watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  }, []);

  return {
    position,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    clearError: () => setError(null)
  };
};

// Weather alerts hook
export const useWeatherAlerts = (locationId?: string) => {
  const { state } = useWeatherContext();
  const [notifications, setNotifications] = useState<WeatherNotification[]>([]);

  // Filter alerts for specific location
  const filteredAlerts = useMemo(() => {
    if (!locationId) return state.alerts;
    
    // Filter alerts that affect the specified location
    return state.alerts.filter(alert => 
      alert.areas.includes(locationId) || 
      alert.areas.includes('all') ||
      alert.areas.length === 0
    );
  }, [state.alerts, locationId]);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  }, []);

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return {
    alerts: filteredAlerts,
    notifications,
    unreadCount,
    dismissNotification,
    markAsRead
  };
};

// Weather history hook
export const useWeatherHistory = (locationId?: string, days = 7) => {
  const [history, setHistory] = useState<WeatherHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!locationId) return;

    setIsLoading(true);
    setError(null);

    try {
      // This would typically fetch from a history API or local storage
      // For now, we'll simulate with current data
      const stored = localStorage.getItem(`weather_history_${locationId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setHistory(data.slice(-days)); // Get last N days
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [locationId, days]);

  const addHistoryEntry = useCallback((location: LocationData, weather: WeatherData) => {
    const entry: WeatherHistoryEntry = {
      date: new Date(),
      location,
      weather
    };

    // Add to current state
    setHistory(prev => [...prev.slice(-(days - 1)), entry]);

    // Persist to storage
    try {
      const key = `weather_history_${location.id}`;
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : [];
      data.push(entry);
      
      // Keep only last 30 days
      const recent = data.slice(-30);
      localStorage.setItem(key, JSON.stringify(recent));
    } catch (error) {
      console.warn('Failed to save weather history:', error);
    }
  }, [days]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (locationId) {
      localStorage.removeItem(`weather_history_${locationId}`);
    }
  }, [locationId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    addHistoryEntry,
    clearHistory,
    refresh: loadHistory
  };
};

// Combined weather hook for convenience
export const useWeather = (locationId?: string) => {
  const weatherData = useWeatherData(locationId);
  const forecast = useWeatherForecast(locationId);
  const preferences = useWeatherPreferences();
  const alerts = useWeatherAlerts(locationId);

  return {
    ...weatherData,
    forecast: forecast.forecast,
    preferences: preferences.preferences,
    alerts: alerts.alerts,
    formatTemperature: preferences.formatTemperature,
    formatWindSpeed: preferences.formatWindSpeed,
    updatePreferences: preferences.updatePreferences
  };
};