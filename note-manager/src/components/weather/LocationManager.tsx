// LocationManager Component
// Implement location selection, search, and favorites management

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin,
  Search,
  Star,
  StarOff,
  Navigation,
  Trash2,
  Plus,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useLocationSearch, useGeolocation } from '../../hooks/useWeather';
import type { LocationData, GeocodeResult } from '../../types/weather';

interface LocationManagerProps {
  onLocationSelect?: (location: LocationData) => void;
  showCurrentLocationFirst?: boolean;
  allowLocationDeletion?: boolean;
  className?: string;
}

interface LocationSearchProps {
  onLocationAdd: (location: LocationData) => void;
  isSearching: boolean;
  searchResults: GeocodeResult[];
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  searchError: string | null;
}

interface LocationItemProps {
  location: LocationData;
  isCurrent: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete?: () => void;
  allowDeletion: boolean;
}

// Location search sub-component
const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationAdd,
  isSearching,
  searchResults,
  onSearch,
  onClearSearch,
  searchError
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowResults(true);
    }
  };

  const handleResultSelect = (result: GeocodeResult) => {
    const location: LocationData = {
      id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: result.name,
      coordinates: result.coordinates,
      timezone: result.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: result.country,
      region: result.region,
      isFavorite: false,
      isDefault: false,
      isCurrentLocation: false
    };

    onLocationAdd(location);
    setSearchQuery('');
    setShowResults(false);
    onClearSearch();
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowResults(false);
    onClearSearch();
  };

  return (
    <div className="location-search">
      <form onSubmit={handleSearchSubmit} className="location-search__form">
        <div className="location-search__input-container">
          <Search size={16} className="location-search__icon" />
          <input
            type="text"
            className="location-search__input"
            placeholder="Search for a city or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {(searchQuery || showResults) && (
            <button
              type="button"
              className="location-search__clear"
              onClick={handleClear}
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          className="location-search__submit"
          disabled={!searchQuery.trim() || isSearching}
        >
          {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
          {isSearching ? 'Searching...' : 'Add'}
        </button>
      </form>

      {searchError && (
        <div className="location-search__error">
          <AlertCircle size={16} />
          {searchError}
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="location-search__results">
          {searchResults.map((result, index) => (
            <button
              key={index}
              className="location-search__result"
              onClick={() => handleResultSelect(result)}
            >
              <MapPin size={16} />
              <div className="location-search__result-info">
                <div className="location-search__result-name">{result.displayName}</div>
                <div className="location-search__result-details">
                  {result.region && `${result.region}, `}{result.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && !isSearching && searchQuery && (
        <div className="location-search__no-results">
          <AlertCircle size={16} />
          No locations found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

// Location item sub-component
const LocationItem: React.FC<LocationItemProps> = ({
  location,
  isCurrent,
  onSelect,
  onToggleFavorite,
  onDelete,
  allowDeletion
}) => {
  const getLocationIcon = () => {
    if (location.isCurrentLocation) return <Navigation size={20} />;
    if (location.isFavorite) return <Star size={20} />;
    return <MapPin size={20} />;
  };

  const getLocationTypeLabel = () => {
    if (location.isCurrentLocation) return 'Current Location';
    if (location.isDefault) return 'Default';
    if (location.isFavorite) return 'Favorite';
    return '';
  };

  return (
    <div className={`location-item ${isCurrent ? 'location-item--current' : ''}`}>
      <div className="location-item__icon">
        {getLocationIcon()}
      </div>

      <div className="location-item__info" onClick={onSelect}>
        <div className="location-item__name">{location.name}</div>
        <div className="location-item__details">
          {location.region && `${location.region}, `}{location.country}
          {getLocationTypeLabel() && (
            <span className="location-item__label"> • {getLocationTypeLabel()}</span>
          )}
        </div>
        <div className="location-item__coordinates">
          {location.coordinates.latitude.toFixed(2)}°, {location.coordinates.longitude.toFixed(2)}°
        </div>
      </div>

      <div className="location-item__actions">
        <button
          className="location-item__action"
          onClick={onToggleFavorite}
          title={location.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {location.isFavorite ? <Star size={16} /> : <StarOff size={16} />}
        </button>

        {allowDeletion && onDelete && !location.isCurrentLocation && (
          <button
            className="location-item__action location-item__action--danger"
            onClick={onDelete}
            title="Remove location"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export const LocationManager: React.FC<LocationManagerProps> = ({
  onLocationSelect,
  showCurrentLocationFirst = true,
  allowLocationDeletion = true,
  className = ''
}) => {
  const {
    searchResults,
    isSearching,
    searchError,
    searchLocations,
    addLocationFromResult,
    clearSearch,
    locations,
    currentLocation,
    addLocation,
    removeLocation,
    updateLocation,
    setCurrentLocation
  } = useLocationSearch();

  const {
    position,
    isLoading: isGeoLoading,
    error: geoError,
    hasPermission,
    requestPermission,
    getCurrentPosition,
    clearError: clearGeoError
  } = useGeolocation();

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Sorted locations with current location first if enabled
  const sortedLocations = useMemo(() => {
    const allLocations = [...locations];
    
    if (showCurrentLocationFirst && currentLocation) {
      // Remove current location from list if it exists, then add it at the beginning
      const filteredLocations = allLocations.filter(loc => loc.id !== currentLocation.id);
      return [currentLocation, ...filteredLocations];
    }
    
    // Sort by favorites, then by name
    return allLocations.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [locations, currentLocation, showCurrentLocationFirst]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationData) => {
    setCurrentLocation(location);
    onLocationSelect?.(location);
  }, [setCurrentLocation, onLocationSelect]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback((location: LocationData) => {
    updateLocation(location.id, { isFavorite: !location.isFavorite });
  }, [updateLocation]);

  // Handle location deletion
  const handleLocationDelete = useCallback((location: LocationData) => {
    if (window.confirm(`Are you sure you want to remove ${location.name}?`)) {
      removeLocation(location.id);
    }
  }, [removeLocation]);

  // Handle geolocation request
  const handleRequestLocation = useCallback(async () => {
    try {
      clearGeoError();
      setShowPermissionPrompt(false);
      
      const hasPermissionNow = await requestPermission();
      if (!hasPermissionNow) {
        setShowPermissionPrompt(true);
        return;
      }

      const position = await getCurrentPosition();
      
      // Create location from coordinates
      const location: LocationData = {
        id: 'current_location',
        name: 'Current Location',
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        country: '',
        isFavorite: false,
        isDefault: true,
        isCurrentLocation: true
      };

      addLocation(location);
      handleLocationSelect(location);
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  }, [requestPermission, getCurrentPosition, clearGeoError, addLocation, handleLocationSelect]);

  // Handle adding location from search
  const handleAddLocation = useCallback((location: LocationData) => {
    addLocation(location);
    handleLocationSelect(location);
  }, [addLocation, handleLocationSelect]);

  return (
    <div className={`location-manager ${className}`}>
      <div className="location-manager__header">
        <h3 className="location-manager__title">
          <MapPin size={20} />
          Locations
        </h3>
        
        <div className="location-manager__actions">
          <button
            className="location-manager__current-location"
            onClick={handleRequestLocation}
            disabled={isGeoLoading}
            title="Use current location"
          >
            {isGeoLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Navigation size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Permission prompt */}
      {showPermissionPrompt && (
        <div className="location-manager__permission-prompt">
          <AlertCircle size={16} />
          <div>
            <div className="permission-prompt__title">Location Access Required</div>
            <div className="permission-prompt__text">
              Please enable location access in your browser to use current location.
            </div>
          </div>
          <button
            className="permission-prompt__close"
            onClick={() => setShowPermissionPrompt(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* Geolocation error */}
      {geoError && (
        <div className="location-manager__error">
          <AlertCircle size={16} />
          {geoError}
          <button onClick={clearGeoError}>×</button>
        </div>
      )}

      {/* Location search */}
      <LocationSearch
        onLocationAdd={handleAddLocation}
        isSearching={isSearching}
        searchResults={searchResults}
        onSearch={searchLocations}
        onClearSearch={clearSearch}
        searchError={searchError}
      />

      {/* Locations list */}
      <div className="location-manager__list">
        {sortedLocations.length === 0 ? (
          <div className="location-manager__empty">
            <MapPin size={32} />
            <div className="empty-state__title">No locations yet</div>
            <div className="empty-state__text">
              Search for a city or use your current location to get started.
            </div>
          </div>
        ) : (
          <div className="locations-list">
            {sortedLocations.map((location) => (
              <LocationItem
                key={location.id}
                location={location}
                isCurrent={currentLocation?.id === location.id}
                onSelect={() => handleLocationSelect(location)}
                onToggleFavorite={() => handleToggleFavorite(location)}
                onDelete={allowLocationDeletion ? () => handleLocationDelete(location) : undefined}
                allowDeletion={allowLocationDeletion}
              />
            ))}
          </div>
        )}
      </div>

      {/* Location count */}
      {sortedLocations.length > 0 && (
        <div className="location-manager__footer">
          <div className="location-count">
            {sortedLocations.length} location{sortedLocations.length !== 1 ? 's' : ''}
            {sortedLocations.filter(l => l.isFavorite).length > 0 && (
              <span> • {sortedLocations.filter(l => l.isFavorite).length} favorite{sortedLocations.filter(l => l.isFavorite).length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};