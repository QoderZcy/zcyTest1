import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  LocationData,
  CurrentWeatherData,
  HourlyWeatherData,
  DailyWeatherData,
  AirQualityData,
  AppError,
  ClothingRecommendation
} from '../types';
import { useLocation, useWeather, useClothingRecommendation } from '../hooks';

// WeatherContext 状态接口
interface WeatherState {
  // 位置数据
  currentLocation: LocationData | null;
  savedLocations: LocationData[];
  
  // 天气数据
  currentWeather: CurrentWeatherData | null;
  hourlyForecast: HourlyWeatherData[];
  dailyForecast: DailyWeatherData[];
  airQuality: AirQualityData | null;
  clothingRecommendation: ClothingRecommendation | null;
  
  // 应用状态
  isLoading: boolean;
  isRefreshing: boolean;
  error: AppError | null;
  lastUpdated: Date | null;
}

// WeatherContext Action 类型
type WeatherAction =
  | { type: 'SET_LOCATION'; payload: LocationData }
  | { type: 'SET_WEATHER_DATA'; payload: { 
      currentWeather: CurrentWeatherData;
      hourlyForecast: HourlyWeatherData[];
      dailyForecast: DailyWeatherData[];
      airQuality: AirQualityData | null;
    }}
  | { type: 'SET_CLOTHING_RECOMMENDATION'; payload: ClothingRecommendation }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'SET_SAVED_LOCATIONS'; payload: LocationData[] }
  | { type: 'UPDATE_LAST_UPDATED'; payload: Date };

// WeatherContext 接口
interface WeatherContextType extends WeatherState {
  // 位置相关方法
  setCurrentLocation: (location: LocationData) => void;
  addFavoriteLocation: (location: LocationData) => void;
  removeFavoriteLocation: (locationId: string) => void;
  
  // 天气数据方法
  refreshWeatherData: () => void;
  clearError: () => void;
}

// 初始状态
const initialState: WeatherState = {
  currentLocation: null,
  savedLocations: [],
  currentWeather: null,
  hourlyForecast: [],
  dailyForecast: [],
  airQuality: null,
  clothingRecommendation: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null
};

// Reducer
function weatherReducer(state: WeatherState, action: WeatherAction): WeatherState {
  switch (action.type) {
    case 'SET_LOCATION':
      return {
        ...state,
        currentLocation: action.payload
      };
      
    case 'SET_WEATHER_DATA':
      return {
        ...state,
        currentWeather: action.payload.currentWeather,
        hourlyForecast: action.payload.hourlyForecast,
        dailyForecast: action.payload.dailyForecast,
        airQuality: action.payload.airQuality,
        lastUpdated: new Date()
      };
      
    case 'SET_CLOTHING_RECOMMENDATION':
      return {
        ...state,
        clothingRecommendation: action.payload
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    case 'SET_REFRESHING':
      return {
        ...state,
        isRefreshing: action.payload
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
      
    case 'SET_SAVED_LOCATIONS':
      return {
        ...state,
        savedLocations: action.payload
      };
      
    case 'UPDATE_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: action.payload
      };
      
    default:
      return state;
  }
}

// 创建Context
const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

// WeatherProvider 组件
interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(weatherReducer, initialState);
  
  // 使用自定义 hooks
  const {
    currentLocation,
    savedLocations,
    getCurrentLocation,
    addFavoriteLocation: addFavorite,
    removeFavoriteLocation: removeFavorite,
    setCurrentLocation: setLocation
  } = useLocation();
  
  const {
    currentWeather,
    hourlyForecast,
    dailyForecast,
    airQuality,
    isLoading: weatherLoading,
    error: weatherError,
    refresh: refreshWeather,
    clearError: clearWeatherError
  } = useWeather(state.currentLocation);
  
  const {
    recommendation: clothingRecommendation
  } = useClothingRecommendation(currentWeather);

  // 同步位置状态
  useEffect(() => {
    if (currentLocation) {
      dispatch({ type: 'SET_LOCATION', payload: currentLocation });
    }
  }, [currentLocation]);

  // 同步保存的位置
  useEffect(() => {
    dispatch({ type: 'SET_SAVED_LOCATIONS', payload: savedLocations });
  }, [savedLocations]);

  // 同步天气数据
  useEffect(() => {
    if (currentWeather) {
      dispatch({
        type: 'SET_WEATHER_DATA',
        payload: {
          currentWeather,
          hourlyForecast,
          dailyForecast,
          airQuality
        }
      });
    }
  }, [currentWeather, hourlyForecast, dailyForecast, airQuality]);

  // 同步穿衣建议
  useEffect(() => {
    if (clothingRecommendation) {
      dispatch({ type: 'SET_CLOTHING_RECOMMENDATION', payload: clothingRecommendation });
    }
  }, [clothingRecommendation]);

  // 同步加载状态
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: weatherLoading });
  }, [weatherLoading]);

  // 同步错误状态
  useEffect(() => {
    dispatch({ type: 'SET_ERROR', payload: weatherError });
  }, [weatherError]);

  // Context 方法实现
  const setCurrentLocation = (location: LocationData) => {
    setLocation(location);
  };

  const addFavoriteLocation = (location: LocationData) => {
    addFavorite(location);
  };

  const removeFavoriteLocation = (locationId: string) => {
    removeFavorite(locationId);
  };

  const refreshWeatherData = () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    refreshWeather();
    setTimeout(() => {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }, 1000);
  };

  const clearError = () => {
    clearWeatherError();
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Context 值
  const contextValue: WeatherContextType = {
    ...state,
    setCurrentLocation,
    addFavoriteLocation,
    removeFavoriteLocation,
    refreshWeatherData,
    clearError
  };

  return (
    <WeatherContext.Provider value={contextValue}>
      {children}
    </WeatherContext.Provider>
  );
};

// useWeatherContext Hook
export const useWeatherContext = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeatherContext must be used within a WeatherProvider');
  }
  return context;
};