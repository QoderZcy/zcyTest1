// WeatherSettings Component
// Build preferences interface for units, notifications, and permissions

import React, { useState } from 'react';
import {
  Settings,
  Thermometer,
  Wind,
  Gauge,
  Globe,
  Bell,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  MapPin,
  Shield,
  Save,
  RotateCcw
} from 'lucide-react';
import { useWeatherPreferences, useGeolocation } from '../../hooks/useWeather';
import type { WeatherPreferences } from '../../types/weather';

interface WeatherSettingsProps {
  onClose?: () => void;
  className?: string;
}

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, children }) => (
  <div className="weather-settings__section">
    <div className="weather-settings__section-header">
      {icon}
      <h3>{title}</h3>
    </div>
    <div className="weather-settings__section-content">
      {children}
    </div>
  </div>
);

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, description, children }) => (
  <div className="weather-settings__item">
    <div className="weather-settings__item-info">
      <label className="weather-settings__item-label">{label}</label>
      {description && (
        <p className="weather-settings__item-description">{description}</p>
      )}
    </div>
    <div className="weather-settings__item-control">
      {children}
    </div>
  </div>
);

export const WeatherSettings: React.FC<WeatherSettingsProps> = ({
  onClose,
  className = ''
}) => {
  const { preferences, updatePreferences, resetPreferences } = useWeatherPreferences();
  const { hasPermission, requestPermission } = useGeolocation();
  
  const [tempPreferences, setTempPreferences] = useState<WeatherPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const handlePreferenceChange = (key: keyof WeatherPreferences, value: any) => {
    const newPreferences = { ...tempPreferences, [key]: value };
    setTempPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleNestedPreferenceChange = (
    parentKey: keyof WeatherPreferences,
    key: string,
    value: any
  ) => {
    const newPreferences = {
      ...tempPreferences,
      [parentKey]: {
        ...tempPreferences[parentKey] as any,
        [key]: value
      }
    };
    setTempPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferences(tempPreferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultPrefs = resetPreferences();
    setTempPreferences(defaultPrefs);
    setHasChanges(true);
  };

  const handleCancel = () => {
    setTempPreferences(preferences);
    setHasChanges(false);
    onClose?.();
  };

  const handleLocationPermission = async () => {
    setIsRequestingLocation(true);
    try {
      await requestPermission();
    } catch (error) {
      console.error('Failed to request location permission:', error);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  return (
    <div className={`weather-settings ${className}`}>
      <div className="weather-settings__header">
        <div className="weather-settings__title">
          <Settings size={20} />
          <h2>Weather Settings</h2>
        </div>
        {onClose && (
          <button className="weather-settings__close" onClick={handleCancel}>
            ×
          </button>
        )}
      </div>

      <div className="weather-settings__content">
        {/* Units & Display */}
        <SettingsSection
          title="Units & Display"
          icon={<Thermometer size={18} />}
        >
          <SettingItem
            label="Temperature Unit"
            description="Choose how temperatures are displayed"
          >
            <select
              value={tempPreferences.temperatureUnit}
              onChange={(e) => handlePreferenceChange('temperatureUnit', e.target.value)}
              className="weather-settings__select"
            >
              <option value="celsius">Celsius (°C)</option>
              <option value="fahrenheit">Fahrenheit (°F)</option>
            </select>
          </SettingItem>

          <SettingItem
            label="Wind Speed Unit"
            description="Unit for displaying wind speeds"
          >
            <select
              value={tempPreferences.windSpeedUnit}
              onChange={(e) => handlePreferenceChange('windSpeedUnit', e.target.value)}
              className="weather-settings__select"
            >
              <option value="kmh">Kilometers per hour (km/h)</option>
              <option value="mph">Miles per hour (mph)</option>
              <option value="ms">Meters per second (m/s)</option>
            </select>
          </SettingItem>

          <SettingItem
            label="Pressure Unit"
            description="Unit for atmospheric pressure"
          >
            <select
              value={tempPreferences.pressureUnit}
              onChange={(e) => handlePreferenceChange('pressureUnit', e.target.value)}
              className="weather-settings__select"
            >
              <option value="hpa">Hectopascals (hPa)</option>
              <option value="inhg">Inches of mercury (inHg)</option>
              <option value="mmhg">Millimeters of mercury (mmHg)</option>
            </select>
          </SettingItem>

          <SettingItem
            label="Distance Unit"
            description="Unit for visibility and distances"
          >
            <select
              value={tempPreferences.distanceUnit}
              onChange={(e) => handlePreferenceChange('distanceUnit', e.target.value)}
              className="weather-settings__select"
            >
              <option value="km">Kilometers (km)</option>
              <option value="miles">Miles (mi)</option>
            </select>
          </SettingItem>

          <SettingItem
            label="Time Format"
            description="12-hour or 24-hour time display"
          >
            <select
              value={tempPreferences.timeFormat}
              onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
              className="weather-settings__select"
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </SettingItem>
        </SettingsSection>

        {/* Location & Privacy */}
        <SettingsSection
          title="Location & Privacy"
          icon={<MapPin size={18} />}
        >
          <SettingItem
            label="Auto Location"
            description="Automatically detect your current location"
          >
            <label className="weather-settings__toggle">
              <input
                type="checkbox"
                checked={tempPreferences.autoLocation}
                onChange={(e) => handlePreferenceChange('autoLocation', e.target.checked)}
              />
              <span className="weather-settings__toggle-slider"></span>
            </label>
          </SettingItem>

          <SettingItem
            label="Location Permission"
            description={`Browser location access is ${hasPermission ? 'granted' : 'denied'}`}
          >
            <button
              className={`weather-settings__btn ${hasPermission ? 'weather-settings__btn--success' : 'weather-settings__btn--primary'}`}
              onClick={handleLocationPermission}
              disabled={isRequestingLocation}
            >
              {isRequestingLocation ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : hasPermission ? (
                <Shield size={16} />
              ) : (
                <MapPin size={16} />
              )}
              {hasPermission ? 'Granted' : 'Request Access'}
            </button>
          </SettingItem>
        </SettingsSection>

        {/* Data & Updates */}
        <SettingsSection
          title="Data & Updates"
          icon={<RefreshCw size={18} />}
        >
          <SettingItem
            label="Refresh Interval"
            description="How often to update weather data (minutes)"
          >
            <select
              value={tempPreferences.refreshInterval}
              onChange={(e) => handlePreferenceChange('refreshInterval', parseInt(e.target.value))}
              className="weather-settings__select"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </SettingItem>

          <SettingItem
            label="Cache Data"
            description="Store weather data locally for faster loading"
          >
            <label className="weather-settings__toggle">
              <input
                type="checkbox"
                checked={tempPreferences.cacheEnabled}
                onChange={(e) => handlePreferenceChange('cacheEnabled', e.target.checked)}
              />
              <span className="weather-settings__toggle-slider"></span>
            </label>
          </SettingItem>

          <SettingItem
            label="Offline Mode"
            description="Use cached data when network is unavailable"
          >
            <label className="weather-settings__toggle">
              <input
                type="checkbox"
                checked={tempPreferences.offlineMode}
                onChange={(e) => handlePreferenceChange('offlineMode', e.target.checked)}
              />
              <span className="weather-settings__toggle-slider"></span>
            </label>
          </SettingItem>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          icon={<Bell size={18} />}
        >
          <SettingItem
            label="Daily Summary"
            description="Receive daily weather summaries"
          >
            <label className="weather-settings__toggle">
              <input
                type="checkbox"
                checked={tempPreferences.notifications.dailySummary}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'dailySummary', e.target.checked)}
              />
              <span className="weather-settings__toggle-slider"></span>
            </label>
          </SettingItem>

          <SettingItem
            label="Severe Weather Alerts"
            description="Get notified about severe weather conditions"
          >
            <label className="weather-settings__toggle">
              <input
                type="checkbox"
                checked={tempPreferences.notifications.severeWeather}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'severeWeather', e.target.checked)}
              />
              <span className="weather-settings__toggle-slider"></span>
            </label>
          </SettingItem>

          <SettingItem
            label="Precipitation Alerts"
            description="Notifications for rain and snow forecasts"
          >
            <label className="weather-settings__toggle">
              <input
                type="checkbox"
                checked={tempPreferences.notifications.precipitationAlerts}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'precipitationAlerts', e.target.checked)}
              />
              <span className="weather-settings__toggle-slider"></span>
            </label>
          </SettingItem>

          <SettingItem
            label="Temperature Alerts"
            description="Notifications for extreme temperatures"
          >
            <label className="weather-settings__toggle">
              <input
                type="checkbox"
                checked={tempPreferences.notifications.temperatureThresholds.enabled}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'temperatureThresholds', {
                  ...tempPreferences.notifications.temperatureThresholds,
                  enabled: e.target.checked
                })}
              />
              <span className="weather-settings__toggle-slider"></span>
            </label>
          </SettingItem>

          {tempPreferences.notifications.temperatureThresholds.enabled && (
            <>
              <SettingItem
                label="High Temperature Alert"
                description="Alert when temperature exceeds this value"
              >
                <div className="weather-settings__input-group">
                  <input
                    type="number"
                    value={tempPreferences.notifications.temperatureThresholds.high}
                    onChange={(e) => handleNestedPreferenceChange('notifications', 'temperatureThresholds', {
                      ...tempPreferences.notifications.temperatureThresholds,
                      high: parseInt(e.target.value)
                    })}
                    className="weather-settings__input"
                    min="-50"
                    max="60"
                  />
                  <span className="weather-settings__input-unit">
                    {tempPreferences.temperatureUnit === 'fahrenheit' ? '°F' : '°C'}
                  </span>
                </div>
              </SettingItem>

              <SettingItem
                label="Low Temperature Alert"
                description="Alert when temperature drops below this value"
              >
                <div className="weather-settings__input-group">
                  <input
                    type="number"
                    value={tempPreferences.notifications.temperatureThresholds.low}
                    onChange={(e) => handleNestedPreferenceChange('notifications', 'temperatureThresholds', {
                      ...tempPreferences.notifications.temperatureThresholds,
                      low: parseInt(e.target.value)
                    })}
                    className="weather-settings__input"
                    min="-50"
                    max="60"
                  />
                  <span className="weather-settings__input-unit">
                    {tempPreferences.temperatureUnit === 'fahrenheit' ? '°F' : '°C'}
                  </span>
                </div>
              </SettingItem>
            </>
          )}
        </SettingsSection>
      </div>

      {/* Actions */}
      <div className="weather-settings__actions">
        <button
          className="weather-settings__btn weather-settings__btn--secondary"
          onClick={handleReset}
        >
          <RotateCcw size={16} />
          Reset to Defaults
        </button>

        <div className="weather-settings__actions-right">
          {onClose && (
            <button
              className="weather-settings__btn weather-settings__btn--secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
          
          <button
            className="weather-settings__btn weather-settings__btn--primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};