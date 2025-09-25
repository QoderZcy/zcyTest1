// WeatherDashboard Component
// Integrate all weather components into main dashboard interface

import React, { useState } from 'react';
import { Cloud, MapPin, Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { CurrentWeatherCard } from './CurrentWeatherCard';
import { WeatherForecast } from './WeatherForecast';
import { LocationManager } from './LocationManager';
import { useWeather } from '../../hooks/useWeather';
import type { LocationData } from '../../types/weather';

interface WeatherDashboardProps {
  className?: string;
  compactMode?: boolean;
}

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  className = '',
  compactMode = false
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(!compactMode);
  const [activePanel, setActivePanel] = useState<'locations' | 'settings'>('locations');
  
  const {
    location,
    weather,
    forecast,
    isLoading,
    error,
    lastUpdated,
    refresh,
    clearError,
    preferences,
    updatePreferences
  } = useWeather();

  const handleRefreshAll = async () => {
    await refresh();
  };

  const handleLocationSelect = (selectedLocation: LocationData) => {
    console.log('Location selected:', selectedLocation);
  };

  return (
    <div className={`weather-dashboard ${compactMode ? 'weather-dashboard--compact' : ''} ${className}`}>
      {/* Header */}
      <div className="weather-dashboard__header">
        <div className="weather-dashboard__title">
          <Cloud size={24} />
          <h2>Weather Dashboard</h2>
          {location && (
            <div className="weather-dashboard__location">
              <MapPin size={16} />
              {location.name}
            </div>
          )}
        </div>

        <div className="weather-dashboard__actions">
          {lastUpdated && (
            <div className="weather-dashboard__last-updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          
          <button
            className="weather-dashboard__action"
            onClick={handleRefreshAll}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            className={`weather-dashboard__action ${activePanel === 'locations' ? 'weather-dashboard__action--active' : ''}`}
            onClick={() => setActivePanel('locations')}
          >
            <MapPin size={16} />
          </button>

          <button
            className={`weather-dashboard__action ${activePanel === 'settings' ? 'weather-dashboard__action--active' : ''}`}
            onClick={() => setActivePanel('settings')}
          >
            <Settings size={16} />
          </button>

          {!compactMode && (
            <button
              className="weather-dashboard__action"
              onClick={() => setSidebarVisible(!sidebarVisible)}
            >
              {sidebarVisible ? '→' : '←'}
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="weather-dashboard__error">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      <div className="weather-dashboard__content">
        {/* Main content */}
        <div className="weather-dashboard__main">
          {weather && (
            <CurrentWeatherCard
              weather={weather}
              isLoading={isLoading}
              onRefresh={refresh}
              showLocation={!compactMode}
              showSunTimes={!compactMode}
              compact={compactMode}
            />
          )}

          {forecast && !compactMode && (
            <WeatherForecast
              forecast={forecast}
              isLoading={isLoading}
              onRefresh={refresh}
            />
          )}

          {!location && !isLoading && (
            <div className="weather-dashboard__no-location">
              <Cloud size={48} />
              <h3>No Location Selected</h3>
              <p>Please select a location to view weather information.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarVisible && !compactMode && (
          <div className="weather-dashboard__sidebar">
            {activePanel === 'locations' && (
              <LocationManager
                onLocationSelect={handleLocationSelect}
                showCurrentLocationFirst={true}
                allowLocationDeletion={true}
              />
            )}

            {activePanel === 'settings' && (
              <div className="weather-settings-placeholder">
                <div className="weather-settings__header">
                  <Settings size={16} />
                  <span>Settings</span>
                </div>
                <div className="weather-settings__content">
                  <div className="weather-settings__item">
                    <label>Temperature Unit:</label>
                    <select 
                      value={preferences.temperatureUnit}
                      onChange={(e) => updatePreferences({ 
                        temperatureUnit: e.target.value as 'celsius' | 'fahrenheit' 
                      })}
                    >
                      <option value="celsius">Celsius (°C)</option>
                      <option value="fahrenheit">Fahrenheit (°F)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};