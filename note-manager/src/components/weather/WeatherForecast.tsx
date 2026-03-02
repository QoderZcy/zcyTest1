// WeatherForecast Component
// Create 7-day forecast with daily and hourly views

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Droplets, 
  Wind, 
  Thermometer,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useWeatherPreferences } from '../../hooks/useWeather';
import type { 
  WeatherForecastResponse,
  DailyForecast,
  HourlyForecast,
  WeatherCondition,
  WEATHER_ICON_MAP 
} from '../../types/weather';

interface WeatherForecastProps {
  forecast: WeatherForecastResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

interface DailyForecastItemProps {
  forecast: DailyForecast;
  isToday?: boolean;
  onClick?: () => void;
  preferences: any;
  formatTemperature: (temp: number) => string;
}

interface HourlyForecastItemProps {
  forecast: HourlyForecast;
  isCurrent?: boolean;
  preferences: any;
  formatTemperature: (temp: number) => string;
}

// Get weather icon for condition
const getWeatherIcon = (condition: WeatherCondition): string => {
  return WEATHER_ICON_MAP[condition] || '🌤️';
};

// Format date utilities
const formatDayName = (date: Date, isToday = false): string => {
  if (isToday) return 'Today';
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString([], { weekday: 'long' });
};

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatHour = (date: Date, format24h = true): string => {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    hour12: !format24h
  });
};

// Daily forecast item component
const DailyForecastItem: React.FC<DailyForecastItemProps> = ({
  forecast,
  isToday = false,
  onClick,
  preferences,
  formatTemperature
}) => {
  const weatherIcon = getWeatherIcon(forecast.weather.condition);
  const dayName = formatDayName(forecast.date, isToday);
  const dateShort = formatDateShort(forecast.date);

  return (
    <div 
      className={`daily-forecast-item ${onClick ? 'daily-forecast-item--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="daily-forecast-item__date">
        <div className="daily-forecast-item__day">{dayName}</div>
        <div className="daily-forecast-item__date-text">{dateShort}</div>
      </div>

      <div className="daily-forecast-item__icon">{weatherIcon}</div>

      <div className="daily-forecast-item__condition">
        <div className="daily-forecast-item__condition-text">
          {forecast.weather.conditionText}
        </div>
        {forecast.weather.precipitation.probability > 0 && (
          <div className="daily-forecast-item__precipitation">
            <Droplets size={12} />
            {forecast.weather.precipitation.probability}%
            {forecast.weather.precipitation.amount && (
              <span> • {forecast.weather.precipitation.amount}mm</span>
            )}
          </div>
        )}
      </div>

      <div className="daily-forecast-item__temps">
        <span className="daily-forecast-item__temp-high">
          {formatTemperature(forecast.weather.temperature.max || forecast.weather.temperature.current)}
        </span>
        <span className="daily-forecast-item__temp-low">
          {formatTemperature(forecast.weather.temperature.min || forecast.weather.temperature.current - 5)}
        </span>
      </div>
    </div>
  );
};

// Hourly forecast item component
const HourlyForecastItem: React.FC<HourlyForecastItemProps> = ({
  forecast,
  isCurrent = false,
  preferences,
  formatTemperature
}) => {
  const weatherIcon = getWeatherIcon(forecast.weather.condition);
  const hour = formatHour(forecast.time, preferences.timeFormat === '24h');

  return (
    <div className={`hourly-forecast-item ${isCurrent ? 'hourly-forecast-item--current' : ''}`}>
      <div className="hourly-forecast-item__time">{hour}</div>
      <div className="hourly-forecast-item__icon">{weatherIcon}</div>
      <div className="hourly-forecast-item__temp">
        {formatTemperature(forecast.weather.temperature.current)}
      </div>
      {forecast.weather.precipitation.probability > 0 && (
        <div className="hourly-forecast-item__precipitation">
          <Droplets size={10} />
          {forecast.weather.precipitation.probability}%
        </div>
      )}
    </div>
  );
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  forecast,
  isLoading = false,
  onRefresh,
  className = ''
}) => {
  const { preferences, formatTemperature } = useWeatherPreferences();
  const [activeTab, setActiveTab] = useState<'daily' | 'hourly'>('daily');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Get current time for highlighting current hour
  const currentTime = useMemo(() => new Date(), []);

  // Process daily forecasts
  const dailyForecasts = useMemo(() => {
    return forecast.daily.slice(0, 7); // Ensure we only show 7 days
  }, [forecast.daily]);

  // Process hourly forecasts
  const hourlyForecasts = useMemo(() => {
    if (activeTab === 'hourly') {
      const selectedDay = dailyForecasts[selectedDayIndex];
      if (selectedDay?.hourlyForecasts) {
        return selectedDay.hourlyForecasts;
      }
      
      // Fallback to main hourly forecast for next 24 hours
      return forecast.hourly.slice(0, 24);
    }
    return [];
  }, [activeTab, selectedDayIndex, dailyForecasts, forecast.hourly]);

  // Navigation for hourly view
  const canNavigatePrev = selectedDayIndex > 0;
  const canNavigateNext = selectedDayIndex < dailyForecasts.length - 1;

  const handlePrevDay = () => {
    if (canNavigatePrev) {
      setSelectedDayIndex(prev => prev - 1);
    }
  };

  const handleNextDay = () => {
    if (canNavigateNext) {
      setSelectedDayIndex(prev => prev + 1);
    }
  };

  if (!forecast) {
    return (
      <div className={`weather-forecast weather-forecast--loading ${className}`}>
        <div className="weather-loading">
          <div className="weather-loading__icon">📅</div>
          <div className="weather-loading__text">Loading forecast...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`weather-forecast ${className}`}>
      <div className="weather-forecast__header">
        <h3 className="weather-forecast__title">
          {activeTab === 'daily' ? '7-Day Forecast' : 'Hourly Forecast'}
        </h3>
        
        <div className="weather-forecast__controls">
          <div className="weather-forecast__tabs">
            <button
              className={`weather-forecast__tab ${activeTab === 'daily' ? 'weather-forecast__tab--active' : ''}`}
              onClick={() => setActiveTab('daily')}
            >
              <Calendar size={16} />
              Daily
            </button>
            <button
              className={`weather-forecast__tab ${activeTab === 'hourly' ? 'weather-forecast__tab--active' : ''}`}
              onClick={() => setActiveTab('hourly')}
            >
              <Clock size={16} />
              Hourly
            </button>
          </div>

          {onRefresh && (
            <button
              className="weather-refresh"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh forecast"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Hourly navigation */}
      {activeTab === 'hourly' && (
        <div className="weather-forecast__hourly-nav">
          <button
            className="weather-forecast__nav-btn"
            onClick={handlePrevDay}
            disabled={!canNavigatePrev}
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="weather-forecast__nav-title">
            {formatDayName(dailyForecasts[selectedDayIndex]?.date, selectedDayIndex === 0)}
            {' '}
            {formatDateShort(dailyForecasts[selectedDayIndex]?.date)}
          </span>
          
          <button
            className="weather-forecast__nav-btn"
            onClick={handleNextDay}
            disabled={!canNavigateNext}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="weather-forecast__content">
        {activeTab === 'daily' ? (
          <div className="daily-forecast">
            {dailyForecasts.map((dayForecast, index) => (
              <DailyForecastItem
                key={dayForecast.date.toISOString()}
                forecast={dayForecast}
                isToday={index === 0}
                onClick={() => {
                  setSelectedDayIndex(index);
                  setActiveTab('hourly');
                }}
                preferences={preferences}
                formatTemperature={formatTemperature}
              />
            ))}
          </div>
        ) : (
          <div className="hourly-forecast">
            {hourlyForecasts.map((hourForecast, index) => {
              const isCurrent = Math.abs(hourForecast.time.getTime() - currentTime.getTime()) < 30 * 60 * 1000; // Within 30 minutes
              
              return (
                <HourlyForecastItem
                  key={hourForecast.time.toISOString()}
                  forecast={hourForecast}
                  isCurrent={isCurrent}
                  preferences={preferences}
                  formatTemperature={formatTemperature}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Summary statistics */}
      <div className="weather-forecast__summary">
        <div className="weather-summary-stat">
          <Thermometer size={16} />
          <span className="weather-summary-stat__label">Avg Temp</span>
          <span className="weather-summary-stat__value">
            {formatTemperature(
              dailyForecasts.reduce((acc, day) => acc + day.weather.temperature.current, 0) / dailyForecasts.length
            )}
          </span>
        </div>

        <div className="weather-summary-stat">
          <Droplets size={16} />
          <span className="weather-summary-stat__label">Rain Days</span>
          <span className="weather-summary-stat__value">
            {dailyForecasts.filter(day => day.weather.precipitation.probability > 30).length} / {dailyForecasts.length}
          </span>
        </div>

        <div className="weather-summary-stat">
          <Wind size={16} />
          <span className="weather-summary-stat__label">Avg Wind</span>
          <span className="weather-summary-stat__value">
            {Math.round(
              dailyForecasts.reduce((acc, day) => acc + day.weather.wind.speed, 0) / dailyForecasts.length
            )} {preferences.windSpeedUnit}
          </span>
        </div>
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