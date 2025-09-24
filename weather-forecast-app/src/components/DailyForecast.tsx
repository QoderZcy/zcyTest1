import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DailyWeatherData } from '../types';
import { useWeatherContext } from '../contexts';
import { TimeUtils, DataFormatter } from '../utils';
import { WeatherIcon } from './WeatherIcon';

interface DailyForecastProps {
  className?: string;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ className = '' }) => {
  const { dailyForecast, isLoading } = useWeatherContext();

  if (isLoading && dailyForecast.length === 0) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold mb-4">7日预报</h3>
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (dailyForecast.length === 0) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold mb-4">7日预报</h3>
        <div className="text-center text-gray-500 py-8">
          <p>暂无日预报数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">7日预报</h3>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-3">
        {dailyForecast.map((day, index) => (
          <DailyWeatherItem key={index} data={day} isToday={index === 0} />
        ))}
      </div>
    </div>
  );
};

// 日天气项组件
interface DailyWeatherItemProps {
  data: DailyWeatherData;
  isToday: boolean;
}

const DailyWeatherItem: React.FC<DailyWeatherItemProps> = ({ data, isToday }) => {
  const displayDay = isToday ? '今天' : TimeUtils.getWeekday(data.date);
  const displayDate = TimeUtils.formatDate(data.date);
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      {/* 日期 */}
      <div className="flex-1">
        <div className="text-sm font-medium">
          {displayDay}
        </div>
        <div className="text-xs text-gray-500">
          {displayDate}
        </div>
      </div>
      
      {/* 天气图标和描述 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <WeatherIcon condition={data.weather} size="small" />
          <div className="text-xs text-gray-600 mt-1 max-w-16 truncate">
            {data.description}
          </div>
        </div>
      </div>
      
      {/* 降水概率 */}
      {data.precipitationProbability > 0 && (
        <div className="flex-1 text-center">
          <div className="text-xs text-blue-500">
            💧 {data.precipitationProbability}%
          </div>
        </div>
      )}
      
      {/* 温度范围 */}
      <div className="flex-1 text-right">
        <div className="text-sm font-semibold">
          {data.tempMax}°
        </div>
        <div className="text-sm text-gray-500">
          {data.tempMin}°
        </div>
      </div>
      
      {/* 风速和湿度 */}
      <div className="flex-1 text-right ml-4">
        <div className="text-xs text-gray-500">
          {DataFormatter.formatWindSpeed(data.windSpeed, 'ms')}
        </div>
        <div className="text-xs text-gray-500">
          {data.humidity}%
        </div>
      </div>
    </div>
  );
};