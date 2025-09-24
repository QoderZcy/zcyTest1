import React from 'react';
import { RefreshCw, Thermometer, Droplets, Wind, Eye, Gauge } from 'lucide-react';
import { CurrentWeatherData } from '../types';
import { useWeatherContext } from '../contexts';
import { DataFormatter, TimeUtils } from '../utils';
import { WeatherIcon } from './WeatherIcon';

interface CurrentWeatherCardProps {
  className?: string;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ className = '' }) => {
  const { currentWeather, isLoading, isRefreshing, lastUpdated, refreshWeatherData } = useWeatherContext();

  if (isLoading && !currentWeather) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentWeather) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <div className="text-center text-gray-500">
          <Thermometer className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无天气数据</p>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    if (!isRefreshing) {
      refreshWeatherData();
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg ${className}`}>
      {/* 头部 - 刷新按钮和更新时间 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm opacity-80">
          {lastUpdated && `更新于 ${TimeUtils.formatTime(lastUpdated)}`}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          title="刷新天气数据"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 主要天气信息 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-5xl font-light mb-2">
            {currentWeather.temperature}°
          </div>
          <div className="text-xl opacity-90 mb-1">
            {currentWeather.description}
          </div>
          <div className="text-sm opacity-80">
            体感 {currentWeather.feelsLike}°
          </div>
        </div>
        <div className="text-right">
          <WeatherIcon condition={currentWeather.weather} size="large" />
          <div className="text-sm mt-2 opacity-80">
            {currentWeather.tempMin}° / {currentWeather.tempMax}°
          </div>
        </div>
      </div>

      {/* 详细信息网格 */}
      <div className="grid grid-cols-2 gap-4">
        <WeatherDetail
          icon={<Droplets className="w-4 h-4" />}
          label="湿度"
          value={DataFormatter.formatHumidity(currentWeather.humidity)}
        />
        <WeatherDetail
          icon={<Wind className="w-4 h-4" />}
          label="风速"
          value={DataFormatter.formatWindSpeed(currentWeather.windSpeed)}
        />
        <WeatherDetail
          icon={<Gauge className="w-4 h-4" />}
          label="气压"
          value={DataFormatter.formatPressure(currentWeather.pressure)}
        />
        <WeatherDetail
          icon={<Eye className="w-4 h-4" />}
          label="能见度"
          value={DataFormatter.formatVisibility(currentWeather.visibility)}
        />
      </div>

      {/* 紫外线指数 */}
      <div className="mt-4 p-3 bg-white/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm">紫外线指数</span>
          <div className="text-right">
            <span className="font-medium">{currentWeather.uvIndex}</span>
            <span className="text-xs ml-2 opacity-80">
              {DataFormatter.formatUVIndex(currentWeather.uvIndex).level}
            </span>
          </div>
        </div>
      </div>

      {/* 日出日落 */}
      <div className="mt-4 flex justify-between text-sm opacity-80">
        <span>日出 {TimeUtils.formatTime(currentWeather.sunrise)}</span>
        <span>日落 {TimeUtils.formatTime(currentWeather.sunset)}</span>
      </div>
    </div>
  );
};

// 天气详情组件
interface WeatherDetailProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const WeatherDetail: React.FC<WeatherDetailProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
      <div className="opacity-80">{icon}</div>
      <div>
        <div className="text-xs opacity-80">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
};