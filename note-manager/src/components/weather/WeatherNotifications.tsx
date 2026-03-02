// WeatherNotifications Component
// Display and manage weather notifications in the UI

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  X,
  Check,
  AlertTriangle,
  Info,
  Cloud,
  Calendar,
  MapPin,
  Trash2,
  MarkAsRead
} from 'lucide-react';
import { weatherNotificationService } from '../../services/weatherNotificationService';
import type { WeatherNotification } from '../../types/weather';

interface WeatherNotificationsProps {
  className?: string;
  compact?: boolean;
  maxVisible?: number;
}

interface NotificationItemProps {
  notification: WeatherNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  compact?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  compact = false
}) => {
  const getSeverityIcon = () => {
    switch (notification.severity) {
      case 'error':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-orange-600" />;
      default:
        return <Info size={16} className="text-blue-600" />;
    }
  };

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'alert':
        return <AlertTriangle size={14} />;
      case 'summary':
        return <Calendar size={14} />;
      case 'forecast':
        return <Cloud size={14} />;
      case 'threshold':
        return <Info size={14} />;
      default:
        return <Bell size={14} />;
    }
  };

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div
      className={`weather-notification ${
        notification.isRead ? 'weather-notification--read' : 'weather-notification--unread'
      } weather-notification--${notification.severity} ${
        compact ? 'weather-notification--compact' : ''
      }`}
    >
      <div className="weather-notification__icon">
        {getSeverityIcon()}
      </div>

      <div className="weather-notification__content">
        <div className="weather-notification__header">
          <div className="weather-notification__type">
            {getTypeIcon()}
            <span className="weather-notification__type-text">
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </span>
          </div>
          <div className="weather-notification__time">
            {formatTimeAgo(notification.timestamp)}
          </div>
        </div>

        <div className="weather-notification__title">
          {notification.title}
        </div>

        {!compact && (
          <div className="weather-notification__message">
            {notification.message}
          </div>
        )}

        <div className="weather-notification__footer">
          <div className="weather-notification__location">
            <MapPin size={12} />
            Location ID: {notification.locationId}
          </div>

          {notification.action && (
            <button
              className="weather-notification__action-btn"
              onClick={notification.action.callback}
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>

      <div className="weather-notification__actions">
        {!notification.isRead && (
          <button
            className="weather-notification__action"
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            <Check size={16} />
          </button>
        )}

        <button
          className="weather-notification__action weather-notification__action--danger"
          onClick={() => onDismiss(notification.id)}
          title="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const WeatherNotifications: React.FC<WeatherNotificationsProps> = ({
  className = '',
  compact = false,
  maxVisible = 10
}) => {
  const [notifications, setNotifications] = useState<WeatherNotification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');

  // Load notifications
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = weatherNotificationService.getNotifications();
      setNotifications(allNotifications);
    };

    loadNotifications();

    // Set up periodic refresh
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    weatherNotificationService.markAsRead(notificationId);
    setNotifications(weatherNotificationService.getNotifications());
  };

  const handleDismiss = (notificationId: string) => {
    weatherNotificationService.dismissNotification(notificationId);
    setNotifications(weatherNotificationService.getNotifications());
  };

  const handleMarkAllAsRead = () => {
    weatherNotificationService.markAllAsRead();
    setNotifications(weatherNotificationService.getNotifications());
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      weatherNotificationService.clearAll();
      setNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'alerts':
        return notification.type === 'alert' || notification.severity === 'error';
      default:
        return true;
    }
  });

  const visibleNotifications = showAll 
    ? filteredNotifications 
    : filteredNotifications.slice(0, maxVisible);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`weather-notifications ${className}`}>
      <div className="weather-notifications__header">
        <div className="weather-notifications__title">
          <Bell size={16} />
          <span>Weather Notifications</span>
          {unreadCount > 0 && (
            <span className="weather-notifications__badge">{unreadCount}</span>
          )}
        </div>

        <div className="weather-notifications__actions">
          <div className="weather-notifications__filter">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'alerts')}
              className="weather-notifications__filter-select"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="alerts">Alerts</option>
            </select>
          </div>

          {unreadCount > 0 && (
            <button
              className="weather-notifications__header-action"
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              <Check size={16} />
            </button>
          )}

          <button
            className="weather-notifications__header-action"
            onClick={handleClearAll}
            title="Clear all notifications"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="weather-notifications__content">
        {filteredNotifications.length === 0 ? (
          <div className="weather-notifications__empty">
            <BellOff size={32} />
            <p>No notifications</p>
            {filter !== 'all' && (
              <button
                className="weather-notifications__empty-action"
                onClick={() => setFilter('all')}
              >
                Show all notifications
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="weather-notifications__list">
              {visibleNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDismiss={handleDismiss}
                  compact={compact}
                />
              ))}
            </div>

            {filteredNotifications.length > maxVisible && !showAll && (
              <div className="weather-notifications__show-more">
                <button
                  className="weather-notifications__show-more-btn"
                  onClick={() => setShowAll(true)}
                >
                  Show {filteredNotifications.length - maxVisible} more notifications
                </button>
              </div>
            )}

            {showAll && filteredNotifications.length > maxVisible && (
              <div className="weather-notifications__show-less">
                <button
                  className="weather-notifications__show-more-btn"
                  onClick={() => setShowAll(false)}
                >
                  Show less
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};