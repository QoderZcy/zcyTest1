import React, { useState } from 'react';
import { Search, MapPin, Star, X, Loader } from 'lucide-react';
import { LocationData, CitySearchResult } from '../types';
import { useLocation } from '../hooks';
import { useWeatherContext } from '../contexts';

interface LocationSelectorProps {
  onClose?: () => void;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onClose, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const {
    currentLocation,
    savedLocations,
    searchResults,
    popularCities,
    isSearching,
    getCurrentLocation,
    searchCities,
    clearSearchResults,
    addFavoriteLocation,
    removeFavoriteLocation
  } = useLocation();
  
  const { setCurrentLocation } = useWeatherContext();

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchCities(query);
    } else {
      clearSearchResults();
    }
  };

  // 选择位置
  const handleSelectLocation = (location: LocationData | CitySearchResult) => {
    const locationData: LocationData = {
      id: location.id,
      name: location.name,
      nameEn: location.nameEn,
      country: location.country,
      province: location.province,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone || 'Asia/Shanghai',
      isCurrentLocation: false,
      isFavorite: savedLocations.some(loc => loc.id === location.id)
    };
    
    setCurrentLocation(locationData);
    onClose?.();
  };

  // 获取当前位置
  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      onClose?.();
    } catch (error) {
      console.error('获取当前位置失败:', error);
    }
  };

  // 切换收藏状态
  const handleToggleFavorite = (location: LocationData, event: React.MouseEvent) => {
    event.stopPropagation();
    if (location.isFavorite) {
      removeFavoriteLocation(location.id);
    } else {
      addFavoriteLocation(location);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">选择城市</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 搜索框 */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索城市..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onFocus={() => setShowSearch(true)}
          />
          {isSearching && (
            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {/* 当前位置选项 */}
        <div className="p-4 border-b">
          <button
            onClick={handleGetCurrentLocation}
            className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">使用当前位置</div>
              <div className="text-sm text-gray-500">自动定位</div>
            </div>
          </button>
        </div>

        {/* 搜索结果 */}
        {searchQuery && searchResults.length > 0 && (
          <div className="p-4 border-b">
            <h4 className="text-sm font-medium text-gray-700 mb-2">搜索结果</h4>
            <div className="space-y-1">
              {searchResults.map((city) => (
                <CityItem
                  key={city.id}
                  location={city}
                  isFavorite={savedLocations.some(loc => loc.id === city.id)}
                  onSelect={handleSelectLocation}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* 收藏城市 */}
        {savedLocations.length > 0 && (
          <div className="p-4 border-b">
            <h4 className="text-sm font-medium text-gray-700 mb-2">收藏城市</h4>
            <div className="space-y-1">
              {savedLocations.map((location) => (
                <CityItem
                  key={location.id}
                  location={location}
                  isFavorite={true}
                  isSelected={currentLocation?.id === location.id}
                  onSelect={handleSelectLocation}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* 热门城市 */}
        {!searchQuery && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">热门城市</h4>
            <div className="space-y-1">
              {popularCities.map((city) => (
                <CityItem
                  key={city.id}
                  location={city}
                  isFavorite={savedLocations.some(loc => loc.id === city.id)}
                  onSelect={handleSelectLocation}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 城市项组件
interface CityItemProps {
  location: LocationData | CitySearchResult;
  isFavorite?: boolean;
  isSelected?: boolean;
  onSelect: (location: LocationData | CitySearchResult) => void;
  onToggleFavorite: (location: LocationData, event: React.MouseEvent) => void;
}

const CityItem: React.FC<CityItemProps> = ({
  location,
  isFavorite = false,
  isSelected = false,
  onSelect,
  onToggleFavorite
}) => {
  return (
    <div
      onClick={() => onSelect(location)}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-50 border border-blue-200' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex-1">
        <div className="font-medium">{location.name}</div>
        <div className="text-sm text-gray-500">
          {location.province} · {location.country}
        </div>
      </div>
      
      <button
        onClick={(e) => onToggleFavorite(location as LocationData, e)}
        className={`p-1 rounded-full transition-colors ${
          isFavorite 
            ? 'text-yellow-500 hover:text-yellow-600' 
            : 'text-gray-300 hover:text-yellow-500'
        }`}
      >
        <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
};