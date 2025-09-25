// Weather Context Provider
// Global weather state management with React Context for comprehensive weather functionality

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService';
import type {
  WeatherContextState,
  WeatherActions,
  LocationData,
  CurrentWeatherResponse,
  WeatherForecastResponse,
  WeatherAlert,
  WeatherPreferences,
  WeatherError,
  WeatherErrorCodes,
  DEFAULT_WEATHER_PREFERENCES
} from '../types/weather';

// Weather Context Actions
type WeatherContextAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_LOCATION'; payload: LocationData | null }
  | { type: 'SET_LOCATIONS'; payload: LocationData[] }
  | { type: 'ADD_LOCATION'; payload: LocationData }
  | { type: 'REMOVE_LOCATION'; payload: string }
  | { type: 'UPDATE_LOCATION'; payload: { id: string; updates: Partial<LocationData> } }
  | { type: 'SET_CURRENT_WEATHER'; payload: CurrentWeatherResponse | null }
  | { type: 'SET_FORECAST'; payload: WeatherForecastResponse | null }
  | { type: 'SET_ALERTS'; payload: WeatherAlert[] }
  | { type: 'SET_PREFERENCES'; payload: WeatherPreferences }
  | { type: 'SET_LAST_UPDATED'; payload: Date | null }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: WeatherContextState = {
  currentLocation: null,
  locations: [],
  currentWeather: null,
  forecast: null,
  alerts: [],
  preferences: DEFAULT_WEATHER_PREFERENCES,
  isLoading: false,
  error: null,
  lastUpdated: null
};

// Weather reducer
function weatherReducer(state: WeatherContextState, action: WeatherContextAction): WeatherContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_CURRENT_LOCATION':
      return { ...state, currentLocation: action.payload };

    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };

    case 'ADD_LOCATION':
      return {
        ...state,
        locations: [...state.locations.filter(loc => loc.id !== action.payload.id), action.payload]
      };

    case 'REMOVE_LOCATION':
      return {
        ...state,
        locations: state.locations.filter(loc => loc.id !== action.payload),
        currentLocation: state.currentLocation?.id === action.payload ? null : state.currentLocation
      };

    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map(loc =>
          loc.id === action.payload.id ? { ...loc, ...action.payload.updates } : loc
        ),
        currentLocation: state.currentLocation?.id === action.payload.id
          ? { ...state.currentLocation, ...action.payload.updates }
          : state.currentLocation
      };

    case 'SET_CURRENT_WEATHER':
      return { ...state, currentWeather: action.payload };

    case 'SET_FORECAST':
      return { ...state, forecast: action.payload };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };

    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };

    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };

    case 'CLEAR_CACHE':
      return { ...state, currentWeather: null, forecast: null, lastUpdated: null };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Weather Context
const WeatherContext = createContext<{
  state: WeatherContextState;
  actions: WeatherActions;
} | null>(null);

// Local storage keys
const STORAGE_KEYS = {
  LOCATIONS: 'weather_locations',
  CURRENT_LOCATION: 'weather_current_location',
  PREFERENCES: 'weather_preferences',
  ALERTS: 'weather_alerts'
};

// Geolocation utilities
class LocationService {
  static async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  static async requestPermission(): Promise<boolean> {
    try {
      if (!navigator.permissions) {
        // Try to get position directly if permissions API is not available
        await this.getCurrentPosition();
        return true;
      }

      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('Failed to request geolocation permission:', error);
      return false;
    }
  }

  static createLocationFromCoordinates(
    coords: GeolocationCoordinates,
    name: string = 'Current Location'
  ): LocationData {
    return {
      id: 'current_location',
      name,
      coordinates: {
        latitude: coords.latitude,
        longitude: coords.longitude
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: '',
      isFavorite: false,
      isDefault: true,
      isCurrentLocation: true
    };
  }
}

// Weather Provider Component
export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(weatherReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save data to localStorage when state changes
  useEffect(() => {
    saveToStorage();
  }, [state.locations, state.currentLocation, state.preferences, state.alerts]);

  // Auto-refresh weather data
  useEffect(() => {
    if (state.preferences.autoLocation && state.currentLocation) {
      const interval = setInterval(() => {
        refreshWeather(state.currentLocation!.id);
      }, state.preferences.refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [state.currentLocation, state.preferences]);

  const loadStoredData = () => {
    try {
      // Load locations
      const storedLocations = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
      if (storedLocations) {
        const locations: LocationData[] = JSON.parse(storedLocations);
        dispatch({ type: 'SET_LOCATIONS', payload: locations });
      }

      // Load current location
      const storedCurrentLocation = localStorage.getItem(STORAGE_KEYS.CURRENT_LOCATION);
      if (storedCurrentLocation) {
        const currentLocation: LocationData = JSON.parse(storedCurrentLocation);
        dispatch({ type: 'SET_CURRENT_LOCATION', payload: currentLocation });
      }

      // Load preferences
      const storedPreferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (storedPreferences) {
        const preferences: WeatherPreferences = {
          ...DEFAULT_WEATHER_PREFERENCES,
          ...JSON.parse(storedPreferences)
        };
        dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      }

      // Load alerts
      const storedAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (storedAlerts) {
        const alerts: WeatherAlert[] = JSON.parse(storedAlerts);
        dispatch({ type: 'SET_ALERTS', payload: alerts });
      }
    } catch (error) {
      console.error('Failed to load weather data from storage:', error);
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(state.locations));
      if (state.currentLocation) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify(state.currentLocation));
      }
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(state.preferences));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(state.alerts));
    } catch (error) {
      console.error('Failed to save weather data to storage:', error);
    }
  };

  const setCurrentLocation = useCallback((location: LocationData) => {
    dispatch({ type: 'SET_CURRENT_LOCATION', payload: location });
    
    // Add to locations if not already present
    const existingLocation = state.locations.find(loc => loc.id === location.id);
    if (!existingLocation) {
      dispatch({ type: 'ADD_LOCATION', payload: location });
    }

    // Auto-refresh weather for new location
    refreshWeather(location.id);
  }, [state.locations]);

  const addLocation = useCallback((location: LocationData) => {
    dispatch({ type: 'ADD_LOCATION', payload: location });
  }, []);

  const removeLocation = useCallback((locationId: string) => {
    dispatch({ type: 'REMOVE_LOCATION', payload: locationId });
    weatherService.clearCache(locationId);
  }, []);

  const updateLocation = useCallback((locationId: string, updates: Partial<LocationData>) => {
    dispatch({ type: 'UPDATE_LOCATION', payload: { id: locationId, updates } });
  }, []);

  const refreshWeather = useCallback(async (locationId?: string) => {
    const targetLocation = locationId 
      ? state.locations.find(loc => loc.id === locationId) || state.currentLocation
      : state.currentLocation;

    if (!targetLocation) {
      dispatch({ type: 'SET_ERROR', payload: 'No location selected for weather update' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const weatherResponse = await weatherService.getCurrentWeather(targetLocation);
      
      if (weatherResponse.success) {
        dispatch({ type: 'SET_CURRENT_WEATHER', payload: weatherResponse.data });
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
      } else {
        dispatch({ type: 'SET_ERROR', payload: weatherResponse.error || 'Failed to fetch weather data' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentLocation, state.locations]);

  const refreshForecast = useCallback(async (locationId?: string) => {
    const targetLocation = locationId 
      ? state.locations.find(loc => loc.id === locationId) || state.currentLocation
      : state.currentLocation;

    if (!targetLocation) {
      dispatch({ type: 'SET_ERROR', payload: 'No location selected for forecast update' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const forecastResponse = await weatherService.getForecast(targetLocation);
      
      if (forecastResponse.success) {
        dispatch({ type: 'SET_FORECAST', payload: forecastResponse.data });
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
      } else {
        dispatch({ type: 'SET_ERROR', payload: forecastResponse.error || 'Failed to fetch forecast data' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentLocation, state.locations]);

  const updatePreferences = useCallback((preferences: Partial<WeatherPreferences>) => {
    const newPreferences = { ...state.preferences, ...preferences };
    dispatch({ type: 'SET_PREFERENCES', payload: newPreferences });
  }, [state.preferences]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const hasPermission = await LocationService.requestPermission();
      
      if (hasPermission && state.preferences.autoLocation) {
        const position = await LocationService.getCurrentPosition();
        const location = LocationService.createLocationFromCoordinates(position.coords);
        setCurrentLocation(location);
      }
      
      return hasPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location permission';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.preferences.autoLocation, setCurrentLocation]);

  const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const position = await LocationService.getCurrentPosition();
      
      // Optionally update current location
      if (state.preferences.autoLocation) {
        const location = LocationService.createLocationFromCoordinates(position.coords);
        setCurrentLocation(location);
      }
      
      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current position';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.preferences.autoLocation, setCurrentLocation]);

  // Initialize weather data on first load
  useEffect(() => {
    const initializeWeather = async () => {
      if (state.preferences.autoLocation && !state.currentLocation) {
        try {
          const hasPermission = await requestLocationPermission();
          if (!hasPermission) {
            console.warn('Location permission denied. Weather will use manual location selection.');
          }
        } catch (error) {
          console.warn('Failed to initialize location:', error);
        }
      }
    };

    initializeWeather();
  }, []); // Run only once on mount

  const actions: WeatherActions = {
    setCurrentLocation,
    addLocation,
    removeLocation,
    updateLocation,
    refreshWeather,
    refreshForecast,
    updatePreferences,
    clearError,
    requestLocationPermission,
    getCurrentPosition
  };

  return (
    <WeatherContext.Provider value={{ state, actions }}>
      {children}
    </WeatherContext.Provider>
  );
};

// Custom hook to use weather context
export const useWeatherContext = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeatherContext must be used within a WeatherProvider');
  }
  return context;
};

// Export for external usage
export default WeatherContext;