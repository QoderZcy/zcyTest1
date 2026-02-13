import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services';
import { LocationData, CityData, CitySearchResult, AppError } from '../types';
import { StorageManager } from '../utils';

interface UseLocationState {
  currentLocation: LocationData | null;
  savedLocations: LocationData[];
  searchResults: CitySearchResult[];
  popularCities: CityData[];
  isLoading: boolean;
  isSearching: boolean;
  error: AppError | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
}

export const useLocation = () => {
  const [state, setState] = useState<UseLocationState>({
    currentLocation: null,
    savedLocations: [],
    searchResults: [],
    popularCities: [],
    isLoading: false,
    isSearching: false,
    error: null,
    permissionStatus: 'prompt'
  });

  // 获取当前位置
  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 检查地理位置API支持
      if (!navigator.geolocation) {
        throw new Error('浏览器不支持地理定位');
      }

      const location = await locationService.getCurrentLocation();
      
      setState(prev => ({
        ...prev,
        currentLocation: location,
        isLoading: false,
        permissionStatus: 'granted'
      }));

      // 保存当前位置到本地存储
      StorageManager.save('current-location', location);
      
      return location;
    } catch (error) {
      console.error('获取当前位置失败:', error);
      
      let permissionStatus: 'denied' | 'unavailable' = 'denied';
      if (error instanceof Error && error.message.includes('不支持')) {
        permissionStatus = 'unavailable';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        permissionStatus,
        error: {
          code: 'LOCATION_ACCESS_FAILED',
          message: error instanceof Error ? error.message : '获取位置失败',
          timestamp: new Date(),
          recoverable: permissionStatus === 'denied'
        }
      }));
      
      throw error;
    }
  }, []);

  // 搜索城市
  const searchCities = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, searchResults: [] }));
      return;
    }

    setState(prev => ({ ...prev, isSearching: true }));

    try {
      const results = await locationService.searchCities(query.trim());
      setState(prev => ({
        ...prev,
        searchResults: results,
        isSearching: false
      }));
    } catch (error) {
      console.error('搜索城市失败:', error);
      setState(prev => ({
        ...prev,
        searchResults: [],
        isSearching: false,
        error: {
          code: 'CITY_SEARCH_FAILED',
          message: '搜索城市失败',
          timestamp: new Date(),
          recoverable: true
        }
      }));
    }
  }, []);

  // 清除搜索结果
  const clearSearchResults = useCallback(() => {
    setState(prev => ({ ...prev, searchResults: [] }));
  }, []);

  // 添加收藏城市
  const addFavoriteLocation = useCallback((location: LocationData) => {
    setState(prev => {
      const updatedLocation = { ...location, isFavorite: true };
      const existingIndex = prev.savedLocations.findIndex(loc => loc.id === location.id);
      
      let newSavedLocations;
      if (existingIndex >= 0) {
        // 更新existing location
        newSavedLocations = [...prev.savedLocations];
        newSavedLocations[existingIndex] = updatedLocation;
      } else {
        // 添加新location
        newSavedLocations = [...prev.savedLocations, updatedLocation];
      }

      // 保存到本地存储
      StorageManager.save('saved-locations', newSavedLocations);

      return {
        ...prev,
        savedLocations: newSavedLocations
      };
    });
  }, []);

  // 移除收藏城市
  const removeFavoriteLocation = useCallback((locationId: string) => {
    setState(prev => {
      const newSavedLocations = prev.savedLocations.filter(loc => loc.id !== locationId);
      
      // 保存到本地存储
      StorageManager.save('saved-locations', newSavedLocations);

      return {
        ...prev,
        savedLocations: newSavedLocations
      };
    });
  }, []);

  // 设置当前位置
  const setCurrentLocation = useCallback((location: LocationData) => {
    const updatedLocation = { ...location, isCurrentLocation: true };
    
    setState(prev => ({
      ...prev,
      currentLocation: updatedLocation
    }));

    // 保存到本地存储
    StorageManager.save('current-location', updatedLocation);
  }, []);

  // 获取热门城市
  const loadPopularCities = useCallback(async () => {
    try {
      const cities = await locationService.getPopularCities();
      setState(prev => ({
        ...prev,
        popularCities: cities
      }));
    } catch (error) {
      console.error('获取热门城市失败:', error);
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 初始化 - 从本地存储加载数据
  useEffect(() => {
    // 加载保存的位置
    const savedLocations = StorageManager.load<LocationData[]>('saved-locations') || [];
    const currentLocation = StorageManager.load<LocationData>('current-location');

    setState(prev => ({
      ...prev,
      savedLocations,
      currentLocation
    }));

    // 加载热门城市
    loadPopularCities();

    // 检查地理位置权限状态
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setState(prev => ({
          ...prev,
          permissionStatus: result.state as any
        }));
      }).catch(() => {
        // 权限API不支持时保持默认状态
      });
    }
  }, [loadPopularCities]);

  return {
    ...state,
    getCurrentLocation,
    searchCities,
    clearSearchResults,
    addFavoriteLocation,
    removeFavoriteLocation,
    setCurrentLocation,
    loadPopularCities,
    clearError
  };
};