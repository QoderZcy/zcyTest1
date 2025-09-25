// Weather Notification Service
// Create alert system for severe weather and daily summaries

import type {
  WeatherNotification,
  WeatherAlert,
  WeatherData,
  LocationData,
  WeatherPreferences,
  WeatherAlertSeverity
} from '../types/weather';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class WeatherNotificationService {
  private notifications: Map<string, WeatherNotification> = new Map();
  private notificationQueue: WeatherNotification[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.loadStoredNotifications();
    this.requestNotificationPermission();
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Create weather alert notification
  createWeatherAlert(
    alert: WeatherAlert,
    location: LocationData,
    preferences: WeatherPreferences
  ): WeatherNotification {
    const notification: WeatherNotification = {
      id: `alert_${alert.id}_${Date.now()}`,
      type: 'alert',
      title: `Weather Alert: ${alert.title}`,
      message: `${alert.description} in ${location.name}`,
      severity: this.mapAlertSeverityToNotification(alert.severity),
      timestamp: new Date(),
      locationId: location.id,
      isRead: false,
      action: {
        label: 'View Details',
        callback: () => this.handleAlertAction(alert, location)
      }
    };

    this.addNotification(notification);
    
    if (preferences.notifications.severeWeather) {
      this.showBrowserNotification(notification);
    }

    return notification;
  }

  // Create daily weather summary notification
  createDailySummary(
    weather: WeatherData,
    location: LocationData,
    preferences: WeatherPreferences
  ): WeatherNotification {
    const temp = this.formatTemperature(weather.temperature.current, preferences.temperatureUnit);
    const condition = weather.conditionText;
    const precipitation = weather.precipitation.probability > 30 
      ? ` ${weather.precipitation.probability}% chance of ${weather.precipitation.type || 'precipitation'}.`
      : '';

    const notification: WeatherNotification = {
      id: `summary_${location.id}_${new Date().toDateString()}`,
      type: 'summary',
      title: `Daily Weather: ${location.name}`,
      message: `${temp}, ${condition}.${precipitation}`,
      severity: 'info',
      timestamp: new Date(),
      locationId: location.id,
      isRead: false
    };

    this.addNotification(notification);
    
    if (preferences.notifications.dailySummary) {
      this.showBrowserNotification(notification);
    }

    return notification;
  }

  // Create temperature threshold notification
  createTemperatureThreshold(
    weather: WeatherData,
    location: LocationData,
    preferences: WeatherPreferences,
    thresholdType: 'high' | 'low'
  ): WeatherNotification {
    const temp = weather.temperature.current;
    const formattedTemp = this.formatTemperature(temp, preferences.temperatureUnit);
    const thresholdTemp = this.formatTemperature(
      thresholdType === 'high' 
        ? preferences.notifications.temperatureThresholds.high
        : preferences.notifications.temperatureThresholds.low,
      preferences.temperatureUnit
    );

    const notification: WeatherNotification = {
      id: `temp_${thresholdType}_${location.id}_${Date.now()}`,
      type: 'threshold',
      title: `Temperature ${thresholdType === 'high' ? 'Alert' : 'Warning'}`,
      message: `Temperature ${thresholdType === 'high' ? 'exceeds' : 'dropped below'} ${thresholdTemp} in ${location.name}. Current: ${formattedTemp}`,
      severity: thresholdType === 'high' ? 'warning' : 'info',
      timestamp: new Date(),
      locationId: location.id,
      isRead: false
    };

    this.addNotification(notification);
    this.showBrowserNotification(notification);

    return notification;
  }

  // Create precipitation notification
  createPrecipitationAlert(
    weather: WeatherData,
    location: LocationData,
    preferences: WeatherPreferences
  ): WeatherNotification {
    const precipType = weather.precipitation.type || 'precipitation';
    const probability = weather.precipitation.probability;
    const amount = weather.precipitation.amount;

    let message = `${probability}% chance of ${precipType} in ${location.name}`;
    if (amount) {
      message += `. Expected amount: ${amount}mm`;
    }

    const notification: WeatherNotification = {
      id: `precip_${location.id}_${Date.now()}`,
      type: 'forecast',
      title: `Precipitation Alert`,
      message,
      severity: probability > 70 ? 'warning' : 'info',
      timestamp: new Date(),
      locationId: location.id,
      isRead: false
    };

    this.addNotification(notification);
    
    if (preferences.notifications.precipitationAlerts) {
      this.showBrowserNotification(notification);
    }

    return notification;
  }

  // Process weather data for notifications
  processWeatherData(
    weather: WeatherData,
    location: LocationData,
    preferences: WeatherPreferences
  ): WeatherNotification[] {
    const notifications: WeatherNotification[] = [];

    // Check temperature thresholds
    if (preferences.notifications.temperatureThresholds.enabled) {
      const temp = weather.temperature.current;
      const highThreshold = preferences.notifications.temperatureThresholds.high;
      const lowThreshold = preferences.notifications.temperatureThresholds.low;

      if (temp >= highThreshold) {
        notifications.push(this.createTemperatureThreshold(weather, location, preferences, 'high'));
      } else if (temp <= lowThreshold) {
        notifications.push(this.createTemperatureThreshold(weather, location, preferences, 'low'));
      }
    }

    // Check precipitation
    if (preferences.notifications.precipitationAlerts && weather.precipitation.probability > 30) {
      // Avoid duplicate notifications for the same day
      const existingPrecipNotification = Array.from(this.notifications.values())
        .find(n => 
          n.type === 'forecast' && 
          n.locationId === location.id &&
          this.isSameDay(n.timestamp, new Date())
        );

      if (!existingPrecipNotification) {
        notifications.push(this.createPrecipitationAlert(weather, location, preferences));
      }
    }

    return notifications;
  }

  // Show browser notification
  private async showBrowserNotification(notification: WeatherNotification): Promise<void> {
    const hasPermission = await this.requestNotificationPermission();
    if (!hasPermission) return;

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: this.getNotificationIcon(notification.severity),
        tag: notification.id,
        requireInteraction: notification.severity === 'error',
        timestamp: notification.timestamp.getTime()
      });

      browserNotification.onclick = () => {
        notification.action?.callback?.();
        browserNotification.close();
        this.markAsRead(notification.id);
      };

      // Auto-close after 5 seconds for non-critical notifications
      if (notification.severity !== 'error') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  // Add notification to the system
  private addNotification(notification: WeatherNotification): void {
    this.notifications.set(notification.id, notification);
    this.saveToStorage();
  }

  // Get all notifications
  getNotifications(): WeatherNotification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get notifications for specific location
  getLocationNotifications(locationId: string): WeatherNotification[] {
    return this.getNotifications().filter(n => n.locationId === locationId);
  }

  // Get unread notifications count
  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.isRead).length;
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(notificationId, notification);
      this.saveToStorage();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    for (const [id, notification] of this.notifications.entries()) {
      notification.isRead = true;
      this.notifications.set(id, notification);
    }
    this.saveToStorage();
  }

  // Dismiss notification
  dismissNotification(notificationId: string): void {
    this.notifications.delete(notificationId);
    this.saveToStorage();
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications.clear();
    this.saveToStorage();
  }

  // Clear old notifications (older than 7 days)
  clearOldNotifications(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.timestamp < cutoffDate) {
        this.notifications.delete(id);
      }
    }
    this.saveToStorage();
  }

  // Utility methods
  private mapAlertSeverityToNotification(severity: WeatherAlertSeverity): 'info' | 'warning' | 'error' {
    switch (severity) {
      case 'extreme':
      case 'severe':
        return 'error';
      case 'moderate':
        return 'warning';
      default:
        return 'info';
    }
  }

  private formatTemperature(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
    if (unit === 'fahrenheit') {
      const fahrenheit = (celsius * 9/5) + 32;
      return `${Math.round(fahrenheit)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  private getNotificationIcon(severity: 'info' | 'warning' | 'error'): string {
    switch (severity) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '🌧️';
      default:
        return '🌤️';
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private handleAlertAction(alert: WeatherAlert, location: LocationData): void {
    // This could open a detailed alert view or take other actions
    console.log('Weather alert action:', alert, location);
  }

  // Storage methods
  private saveToStorage(): void {
    try {
      const notificationsArray = Array.from(this.notifications.entries());
      localStorage.setItem('weather_notifications', JSON.stringify(notificationsArray));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  private loadStoredNotifications(): void {
    try {
      const stored = localStorage.getItem('weather_notifications');
      if (stored) {
        const notificationsArray = JSON.parse(stored);
        this.notifications = new Map(notificationsArray.map(([id, notification]: [string, any]) => [
          id,
          {
            ...notification,
            timestamp: new Date(notification.timestamp)
          }
        ]));
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
      this.notifications.clear();
    }
  }
}

export const weatherNotificationService = new WeatherNotificationService();