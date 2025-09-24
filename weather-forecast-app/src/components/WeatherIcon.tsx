import React from 'react';
import { WeatherCondition } from '../types';

interface WeatherIconProps {
  condition: WeatherCondition;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const weatherIconMap: Record<WeatherCondition, string> = {
  [WeatherCondition.CLEAR_DAY]: '☀️',
  [WeatherCondition.CLEAR_NIGHT]: '🌙',
  [WeatherCondition.PARTLY_CLOUDY_DAY]: '⛅',
  [WeatherCondition.PARTLY_CLOUDY_NIGHT]: '☁️',
  [WeatherCondition.CLOUDY]: '☁️',
  [WeatherCondition.OVERCAST]: '☁️',
  [WeatherCondition.LIGHT_RAIN]: '🌦️',
  [WeatherCondition.MODERATE_RAIN]: '🌧️',
  [WeatherCondition.HEAVY_RAIN]: '⛈️',
  [WeatherCondition.THUNDERSTORM]: '⛈️',
  [WeatherCondition.LIGHT_SNOW]: '🌨️',
  [WeatherCondition.MODERATE_SNOW]: '❄️',
  [WeatherCondition.HEAVY_SNOW]: '❄️',
  [WeatherCondition.FOG]: '🌫️',
  [WeatherCondition.HAZE]: '🌫️',
  [WeatherCondition.SAND]: '🌪️',
  [WeatherCondition.DUST]: '🌪️',
  [WeatherCondition.WIND]: '💨'
};

const sizeClasses = {
  small: 'text-2xl',
  medium: 'text-4xl',
  large: 'text-6xl'
};

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  condition,
  size = 'medium',
  className = ''
}) => {
  const icon = weatherIconMap[condition] || '❓';
  const sizeClass = sizeClasses[size];

  return (
    <span className={`${sizeClass} ${className}`} role="img" aria-label={condition}>
      {icon}
    </span>
  );
};