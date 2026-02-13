import React from 'react';
import { ChevronRight } from 'lucide-react';
import { HourlyWeatherData } from '../types';
import { useWeatherContext } from '../contexts';
import { TimeUtils, DataFormatter } from '../utils';
import { WeatherIcon } from './WeatherIcon';

interface HourlyForecastProps {
  className?: string;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ className = '' }) => {
  const { hourlyForecast, isLoading } = useWeatherContext();

  if (isLoading && hourlyForecast.length === 0) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold mb-4">24小时预报</h3>
        <div className="flex space-x-4 overflow-x-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-8 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-10"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hourlyForecast.length === 0) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold mb-4">24小时预报</h3>
        <div className="text-center text-gray-500 py-8">
          <p>暂无小时预报数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">24小时预报</h3>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {hourlyForecast.slice(0, 24).map((hour, index) => (
          <HourlyWeatherItem key={index} data={hour} isFirst={index === 0} />
        ))}
      </div>
    </div>
  );
};

// 小时天气项组件
interface HourlyWeatherItemProps {
  data: HourlyWeatherData;
  isFirst: boolean;
}

const HourlyWeatherItem: React.FC<HourlyWeatherItemProps> = ({ data, isFirst }) => {
  const displayTime = isFirst ? '现在' : TimeUtils.formatTime(data.time);
  
  return (
    <div className="flex-shrink-0 text-center min-w-[60px]">
      {/* 时间 */}
      <div className="text-sm text-gray-600 mb-2 font-medium">
        {displayTime}
      </div>
      
      {/* 天气图标 */}
      <div className="mb-2">
        <WeatherIcon condition={data.weather} size="small" />
      </div>
      
      {/* 降水概率 */}
      {data.precipitationProbability > 0 && (
        <div className="text-xs text-blue-500 mb-1">
          {data.precipitationProbability}%
        </div>
      )}
      
      {/* 温度 */}
      <div className="text-sm font-semibold">
        {data.temperature}°
      </div>
      
      {/* 风速 */}
      <div className="text-xs text-gray-500 mt-1">
        {DataFormatter.formatWindSpeed(data.windSpeed, 'ms')}
      </div>
    </div>
  );
};