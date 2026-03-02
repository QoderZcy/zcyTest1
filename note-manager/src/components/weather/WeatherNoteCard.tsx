// WeatherNoteCard Component
// Enhanced note card that displays weather information

import React from 'react';
import { Calendar, MapPin, Thermometer, Cloud, Droplets, Wind } from 'lucide-react';
import { useWeatherPreferences } from '../../hooks/useWeather';
import type { Note } from '../../types/note';
import type { WEATHER_ICON_MAP, WeatherCondition } from '../../types/weather';

interface WeatherNoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  showWeatherInfo?: boolean;
  className?: string;
}

// Get weather icon for condition
const getWeatherIcon = (condition: WeatherCondition): string => {
  const WEATHER_ICON_MAP: Record<WeatherCondition, string> = {
    'clear': '☀️',
    'partly-cloudy': '⛅',
    'cloudy': '☁️',
    'overcast': '☁️',
    'rain': '🌧️',
    'heavy-rain': '⛈️',
    'snow': '❄️',
    'heavy-snow': '🌨️',
    'thunderstorm': '⛈️',
    'fog': '🌫️',
    'mist': '🌫️',
    'hail': '🌨️',
    'sleet': '🌨️',
    'wind': '💨',
    'tornado': '🌪️',
    'hurricane': '🌀'
  };
  return WEATHER_ICON_MAP[condition] || '🌤️';
};

// Format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

export const WeatherNoteCard: React.FC<WeatherNoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  showWeatherInfo = true,
  className = ''
}) => {
  const { formatTemperature } = useWeatherPreferences();

  const handleEdit = () => {
    onEdit(note);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  // Check if note has weather information
  const hasWeather = note.weather && showWeatherInfo;
  const weatherTags = note.weatherTags || [];
  const regularTags = note.tags.filter(tag => !weatherTags.includes(tag));

  return (
    <div 
      className={`weather-note-card ${hasWeather ? 'weather-note-card--with-weather' : ''} ${className}`}
      style={{ backgroundColor: note.color }}
    >
      {/* Weather header */}
      {hasWeather && note.weather && (
        <div className="weather-note-card__weather-header">
          <div className="weather-note-card__weather-icon">
            {getWeatherIcon(note.weather.weather.condition)}
          </div>
          
          <div className="weather-note-card__weather-info">
            <div className="weather-note-card__weather-temp">
              {formatTemperature(note.weather.weather.temperature.current)}
            </div>
            <div className="weather-note-card__weather-condition">
              {note.weather.weather.conditionText}
            </div>
          </div>
          
          <div className="weather-note-card__weather-details">
            <div className="weather-detail">
              <Droplets size={12} />
              {note.weather.weather.humidity}%
            </div>
            <div className="weather-detail">
              <Wind size={12} />
              {Math.round(note.weather.weather.wind.speed)} km/h
            </div>
          </div>
        </div>
      )}

      {/* Note content */}
      <div className="weather-note-card__content" onClick={handleEdit}>
        <h3 className="weather-note-card__title">{note.title}</h3>
        
        {note.content && (
          <p className="weather-note-card__text">
            {note.content.length > 150 
              ? `${note.content.substring(0, 150)}...` 
              : note.content
            }
          </p>
        )}
      </div>

      {/* Tags */}
      {(regularTags.length > 0 || weatherTags.length > 0) && (
        <div className="weather-note-card__tags">
          {/* Weather tags */}
          {weatherTags.length > 0 && (
            <div className="weather-note-card__weather-tags">
              {weatherTags.slice(0, 3).map((tag) => (
                <span key={tag} className="weather-tag">
                  <Cloud size={10} />
                  {tag.replace('weather:', '').replace('location:', '')}
                </span>
              ))}
              {weatherTags.length > 3 && (
                <span className="weather-tag weather-tag--more">
                  +{weatherTags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Regular tags */}
          {regularTags.length > 0 && (
            <div className="weather-note-card__regular-tags">
              {regularTags.slice(0, 3).map((tag) => (
                <span key={tag} className="note-tag">
                  #{tag}
                </span>
              ))}
              {regularTags.length > 3 && (
                <span className="note-tag note-tag--more">
                  +{regularTags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="weather-note-card__footer">
        <div className="weather-note-card__meta">
          <div className="weather-note-card__date">
            <Calendar size={12} />
            {formatRelativeTime(new Date(note.createdAt))}
          </div>
          
          {hasWeather && note.weather && (
            <div className="weather-note-card__location">
              <MapPin size={12} />
              Weather captured
            </div>
          )}
        </div>

        <div className="weather-note-card__actions">
          <button
            className="weather-note-card__action"
            onClick={handleEdit}
            title="Edit note"
          >
            ✏️
          </button>
          
          <button
            className="weather-note-card__action weather-note-card__action--danger"
            onClick={handleDelete}
            title="Delete note"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};