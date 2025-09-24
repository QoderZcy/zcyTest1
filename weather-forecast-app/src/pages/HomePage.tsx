import React from 'react';
import { 
  CurrentWeatherCard, 
  HourlyForecast, 
  DailyForecast, 
  ClothingRecommendation 
} from '../components';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* 当前天气 */}
      <CurrentWeatherCard />
      
      {/* 小时预报 */}
      <HourlyForecast />
      
      {/* 穿衣建议 */}
      <ClothingRecommendation />
      
      {/* 日预报 */}
      <DailyForecast />
    </div>
  );
};