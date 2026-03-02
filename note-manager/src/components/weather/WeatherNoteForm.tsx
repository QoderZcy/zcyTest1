// WeatherNoteForm Component
// Enhanced note form with weather integration

import React, { useState, useEffect } from 'react';
import { Cloud, MapPin, Calendar, Thermometer, Droplets, Wind } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import type { Note, NewNote } from '../../types/note';
import type { WeatherMetadata } from '../../types/weather';

interface WeatherNoteFormProps {
  note?: Note | null;
  onSave: (note: NewNote & { weather?: WeatherMetadata }) => void;
  onCancel: () => void;
  autoAttachWeather?: boolean;
  className?: string;
}

export const WeatherNoteForm: React.FC<WeatherNoteFormProps> = ({
  note,
  onSave,
  onCancel,
  autoAttachWeather = true,
  className = ''
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || '#FFE5B4');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [attachWeather, setAttachWeather] = useState(autoAttachWeather);
  const [tagInput, setTagInput] = useState('');

  const { location, weather, formatTemperature } = useWeather();

  // Create weather metadata when weather is attached
  const createWeatherMetadata = (): WeatherMetadata | undefined => {
    if (!attachWeather || !location || !weather) return undefined;

    return {
      locationId: location.id,
      weather: weather.weather,
      timestamp: new Date(),
      isAutoTagged: true
    };
  };

  // Generate weather-based tags
  const generateWeatherTags = (): string[] => {
    if (!attachWeather || !weather || !location) return [];

    const weatherTags: string[] = [];
    
    // Location tag
    weatherTags.push(`location:${location.name.toLowerCase()}`);
    
    // Weather condition tag
    weatherTags.push(`weather:${weather.weather.condition}`);
    
    // Temperature range tag
    const temp = weather.weather.temperature.current;
    if (temp < 0) weatherTags.push('weather:freezing');
    else if (temp < 10) weatherTags.push('weather:cold');
    else if (temp < 20) weatherTags.push('weather:mild');
    else if (temp < 30) weatherTags.push('weather:warm');
    else weatherTags.push('weather:hot');
    
    // Precipitation tag
    if (weather.weather.precipitation.probability > 50) {
      weatherTags.push('weather:rainy');
    }
    
    return weatherTags;
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weatherMetadata = createWeatherMetadata();
    const weatherTags = generateWeatherTags();
    const allTags = [...new Set([...tags, ...weatherTags])];

    const noteData: NewNote & { weather?: WeatherMetadata } = {
      title: title.trim() || 'Untitled Note',
      content,
      color,
      tags: allTags,
      weather: weatherMetadata
    };

    onSave(noteData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.activeElement && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className={`weather-note-form ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="weather-note-form__header">
          <h3>{note ? 'Edit Note' : 'Create New Note'}</h3>
          
          {/* Weather toggle */}
          <div className="weather-note-form__weather-toggle">
            <label className="weather-toggle">
              <input
                type="checkbox"
                checked={attachWeather}
                onChange={(e) => setAttachWeather(e.target.checked)}
              />
              <span className="weather-toggle__label">
                <Cloud size={16} />
                Attach Weather
              </span>
            </label>
          </div>
        </div>

        {/* Weather preview */}
        {attachWeather && weather && location && (
          <div className="weather-note-form__weather-preview">
            <div className="weather-preview">
              <div className="weather-preview__header">
                <Cloud size={16} />
                <span>Current Weather</span>
              </div>
              
              <div className="weather-preview__content">
                <div className="weather-preview__location">
                  <MapPin size={14} />
                  {location.name}
                </div>
                
                <div className="weather-preview__conditions">
                  <div className="weather-preview__temp">
                    <Thermometer size={14} />
                    {formatTemperature(weather.weather.temperature.current)}
                  </div>
                  
                  <div className="weather-preview__condition">
                    {weather.weather.conditionText}
                  </div>
                </div>
                
                <div className="weather-preview__details">
                  <div className="weather-preview__detail">
                    <Droplets size={12} />
                    {weather.weather.humidity}%
                  </div>
                  
                  <div className="weather-preview__detail">
                    <Wind size={12} />
                    {Math.round(weather.weather.wind.speed)} km/h
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Title input */}
        <div className="weather-note-form__field">
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="weather-note-form__title"
          />
        </div>

        {/* Content textarea */}
        <div className="weather-note-form__field">
          <textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="weather-note-form__content"
            rows={8}
          />
        </div>

        {/* Color selector */}
        <div className="weather-note-form__field">
          <label className="weather-note-form__label">Color:</label>
          <div className="color-selector">
            {['#FFE5B4', '#E5F3FF', '#E5FFE5', '#FFE5E5', '#F0E5FF', '#FFE5F0'].map((noteColor) => (
              <button
                key={noteColor}
                type="button"
                className={`color-option ${color === noteColor ? 'color-option--selected' : ''}`}
                style={{ backgroundColor: noteColor }}
                onClick={() => setColor(noteColor)}
              />
            ))}
          </div>
        </div>

        {/* Tags input */}
        <div className="weather-note-form__field">
          <label className="weather-note-form__label">Tags:</label>
          <div className="tags-input">
            <input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="tags-input__field"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="tags-input__add"
            >
              Add
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="tags-list">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag__remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form actions */}
        <div className="weather-note-form__actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
          >
            {note ? 'Update Note' : 'Create Note'}
          </button>
        </div>
      </form>
    </div>
  );
};