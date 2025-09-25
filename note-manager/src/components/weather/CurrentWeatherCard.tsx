// CurrentWeatherCard Component
// Display real-time weather conditions with icons and essential metrics

import React from 'react';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Eye, 
  Gauge, 
  Sun, 
  Moon, 
  RefreshCw,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { useWeatherPreferences } from '../../hooks/useWeather';
import type { 
  CurrentWeatherResponse, 
  WeatherCondition,
  WEATHER_ICON_MAP 
} from '../../types/weather';

interface CurrentWeatherCardProps {
  weather: CurrentWeatherResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
  showLocation?: boolean;
  showSunTimes?: boolean;
  compact?: boolean;
  className?: string;
}

// Weather condition to emoji mapping with fallback icons
const getWeatherIcon = (condition: WeatherCondition): string => {
  return WEATHER_ICON_MAP[condition] || '🌤️';
};

// UV Index level descriptions
const getUVIndexLevel = (uvIndex: number): { level: string; color: string } => {
  if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600' };
  if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600' };
  if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600' };
  if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-600' };
  return { level: 'Extreme', color: 'text-purple-600' };
};

// Pressure trend indicator
const getPressureTrend = (pressure: number): { trend: string; icon: string } => {
  if (pressure > 1020) return { trend: 'High', icon: '↗️' };
  if (pressure < 1000) return { trend: 'Low', icon: '↘️' };
  return { trend: 'Normal', icon: '→' };
};

// Time formatting utility
const formatTime = (date: Date, format24h: boolean = true): string => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !format24h
  });
};

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  weather,
  isLoading = false,
  onRefresh,
  showLocation = true,
  showSunTimes = true,
  compact = false,
  className = ''
}) => {
  const { preferences, formatTemperature, formatWindSpeed } = useWeatherPreferences();
  
  if (!weather) {
    return (
      <div className={`weather-card weather-card--loading ${className}`}>
        <div className="weather-card__content">
          <div className="weather-loading">
            <div className="weather-loading__icon">🌤️</div>
            <div className="weather-loading__text">Loading weather data...</div>
          </div>
        </div>
      </div>
    );
  }

  const { location, weather: weatherData, sunTimes, lastUpdated } = weather;
  const weatherIcon = getWeatherIcon(weatherData.condition);
  const uvInfo = getUVIndexLevel(weatherData.uvIndex);
  const pressureInfo = getPressureTrend(weatherData.pressure);
  const isDay = new Date() >= sunTimes.sunrise && new Date() <= sunTimes.sunset;

  if (compact) {
    return (
      <div className={`weather-card weather-card--compact ${className}`}>
        <div className="weather-card__content">
          <div className="weather-compact">
            <div className="weather-compact__icon">{weatherIcon}</div>
            <div className="weather-compact__temp">
              {formatTemperature(weatherData.temperature.current)}
            </div>
            <div className="weather-compact__condition">
              {weatherData.conditionText}
            </div>
            {showLocation && (
              <div className="weather-compact__location">
                <MapPin size={12} />
                {location.name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`weather-card ${isLoading ? 'weather-card--loading' : ''} ${className}`}>
      <div className="weather-card__header">
        {showLocation && (
          <div className="weather-location">
            <MapPin size={16} />
            <span className="weather-location__name">{location.name}</span>
            <span className="weather-location__country">{location.country}</span>
          </div>
        )}
        
        <div className="weather-actions">
          <div className="weather-updated">
            <Clock size={14} />
            <span>Updated {formatTime(lastUpdated, preferences.timeFormat === '24h')}</span>
          </div>
          {onRefresh && (
            <button
              className="weather-refresh"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh weather data"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      <div className="weather-card__content">
        {/* Main weather display */}
        <div className="weather-main">
          <div className="weather-main__icon">{weatherIcon}</div>
          <div className="weather-main__temp">
            <span className="weather-temp">{formatTemperature(weatherData.temperature.current)}</span>
            <span className="weather-feels-like">
              Feels like {formatTemperature(weatherData.temperature.feelsLike)}
            </span>
          </div>
          <div className="weather-main__condition">
            <span className="weather-condition">{weatherData.conditionText}</span>
            {weatherData.temperature.min !== undefined && weatherData.temperature.max !== undefined && (
              <span className="weather-range">
                {formatTemperature(weatherData.temperature.min)} / {formatTemperature(weatherData.temperature.max)}
              </span>
            )}
          </div>
        </div>

        {/* Weather metrics grid */}
        <div className="weather-metrics">
          <div className="weather-metric">
            <div className="weather-metric__icon">
              <Droplets size={20} />
            </div>
            <div className="weather-metric__content">
              <span className="weather-metric__label">Humidity</span>
              <span className="weather-metric__value">{weatherData.humidity}%</span>
            </div>
          </div>

          <div className="weather-metric">
            <div className="weather-metric__icon">
              <Wind size={20} />
            </div>
            <div className="weather-metric__content">
              <span className="weather-metric__label">Wind</span>
              <span className="weather-metric__value">
                {formatWindSpeed(weatherData.wind.speed)} {weatherData.wind.directionText}
              </span>
              {weatherData.wind.gust && (
                <span className="weather-metric__detail">
                  Gusts: {formatWindSpeed(weatherData.wind.gust)}
                </span>
              )}
            </div>
          </div>

          <div className="weather-metric">
            <div className="weather-metric__icon">
              <Gauge size={20} />
            </div>
            <div className="weather-metric__content">
              <span className="weather-metric__label">Pressure</span>
              <span className="weather-metric__value">
                {weatherData.pressure} {preferences.pressureUnit}
                <span className="weather-metric__trend">{pressureInfo.icon}</span>
              </span>
            </div>
          </div>

          <div className="weather-metric">
            <div className="weather-metric__icon">
              <Eye size={20} />
            </div>
            <div className="weather-metric__content">
              <span className="weather-metric__label">Visibility</span>
              <span className="weather-metric__value">
                {weatherData.visibility} {preferences.distanceUnit}
              </span>
            </div>
          </div>

          {weatherData.uvIndex > 0 && (
            <div className="weather-metric">
              <div className="weather-metric__icon">
                <Sun size={20} />
              </div>
              <div className="weather-metric__content">
                <span className="weather-metric__label">UV Index</span>
                <span className={`weather-metric__value ${uvInfo.color}`}>
                  {weatherData.uvIndex} ({uvInfo.level})
                </span>
              </div>
            </div>
          )}

          {weatherData.precipitation.probability > 0 && (
            <div className="weather-metric">
              <div className="weather-metric__icon">
                <Droplets size={20} />
              </div>
              <div className="weather-metric__content">
                <span className="weather-metric__label">Precipitation</span>
                <span className="weather-metric__value">
                  {weatherData.precipitation.probability}%
                </span>
                {weatherData.precipitation.amount && (
                  <span className="weather-metric__detail">
                    {weatherData.precipitation.amount}mm
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sun times */}
        {showSunTimes && (
          <div className="weather-sun-times">
            <div className="weather-sun-time">
              <Sun size={16} />
              <span className="weather-sun-time__label">Sunrise</span>
              <span className="weather-sun-time__value">
                {formatTime(sunTimes.sunrise, preferences.timeFormat === '24h')}
              </span>
            </div>
            <div className="weather-sun-time">
              <Moon size={16} />
              <span className="weather-sun-time__label">Sunset</span>
              <span className="weather-sun-time__value">
                {formatTime(sunTimes.sunset, preferences.timeFormat === '24h')}
              </span>
            </div>
            <div className="weather-sun-time">
              <Calendar size={16} />
              <span className="weather-sun-time__label">Day Length</span>
              <span className="weather-sun-time__value">
                {Math.round((sunTimes.sunset.getTime() - sunTimes.sunrise.getTime()) / (1000 * 60 * 60 * 10)) / 10}h
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="weather-loading-overlay">
          <div className="weather-loading-spinner">
            <RefreshCw size={24} className="animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};