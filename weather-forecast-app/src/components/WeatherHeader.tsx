import React, { useState } from 'react';
import { MapPin, ChevronDown, Settings, Menu } from 'lucide-react';
import { useWeatherContext } from '../contexts';
import { LocationSelector } from '../components';

interface WeatherHeaderProps {
  onOpenSettings?: () => void;
  onOpenMenu?: () => void;
}

export const WeatherHeader: React.FC<WeatherHeaderProps> = ({
  onOpenSettings,
  onOpenMenu
}) => {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const { currentLocation } = useWeatherContext();

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧 - 菜单按钮 */}
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* 中心 - 位置选择器 */}
          <button
            onClick={() => setShowLocationSelector(true)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1 lg:flex-none justify-center lg:justify-start"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">
              {currentLocation?.name || '选择城市'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* 右侧 - 设置按钮 */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 位置选择器模态框 */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <LocationSelector
            onClose={() => setShowLocationSelector(false)}
            className="w-full max-w-md"
          />
        </div>
      )}
    </>
  );
};