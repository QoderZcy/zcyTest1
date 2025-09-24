import { useState, useEffect, useCallback } from 'react';
import { 
  NotificationData, 
  NotificationSettings, 
  NotificationPermission,
  NotificationType,
  NotificationPriority,
  CurrentWeatherData
} from '../types';
import { StorageManager, SettingsManager } from '../utils';

interface UseNotificationState {
  permission: NotificationPermission;
  settings: NotificationSettings;
  notifications: NotificationData[];
  isSupported: boolean;
}

export const useNotification = () => {
  const [state, setState] = useState<UseNotificationState>({
    permission: 'default',
    settings: SettingsManager.getDefaultSettings().notifications,
    notifications: [],
    isSupported: false
  });

  // 检查通知支持
  const checkNotificationSupport = useCallback(() => {
    const isSupported = 'Notification' in window;
    setState(prev => ({ ...prev, isSupported }));
    return isSupported;
  }, []);

  // 请求通知权限
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      throw new Error('浏览器不支持通知功能');
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      throw error;
    }
  }, [state.isSupported]);

  // 发送通知
  const sendNotification = useCallback(async (
    title: string,
    options: {
      body?: string;
      icon?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
      silent?: boolean;
    } = {}
  ) => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.warn('通知权限未授予或不支持');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/weather-icon.svg',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      // 添加点击事件处理
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 自动关闭（除非requireInteraction为true）
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('发送通知失败:', error);
      return null;
    }
  }, [state.isSupported, state.permission]);

  // 发送天气通知
  const sendWeatherNotification = useCallback(async (
    type: NotificationType,
    weatherData: CurrentWeatherData,
    customMessage?: string
  ) => {
    if (!state.settings.enabled || !state.settings.types[type]?.enabled) {
      return null;
    }

    const { temperature, description, weather } = weatherData;
    let title = '';
    let body = '';
    let icon = '☀️';

    switch (type) {
      case NotificationType.DAILY_WEATHER:
        title = '今日天气预报';
        body = customMessage || `${temperature}°C，${description}`;
        break;
        
      case NotificationType.WEATHER_CHANGE:
        title = '天气变化提醒';
        body = customMessage || `天气即将变化，当前${temperature}°C，${description}`;
        icon = '🌤️';
        break;
        
      case NotificationType.SEVERE_WEATHER:
        title = '恶劣天气预警';
        body = customMessage || `${description}，请注意安全`;
        icon = '⚠️';
        break;
        
      case NotificationType.CLOTHING_ADVICE:
        title = '穿衣建议';
        body = customMessage || `今日${temperature}°C，建议穿着适当衣物`;
        icon = '👕';
        break;
        
      case NotificationType.AIR_QUALITY:
        title = '空气质量提醒';
        body = customMessage || '当前空气质量状况';
        icon = '💨';
        break;
    }

    return await sendNotification(title, {
      body,
      icon,
      tag: type,
      data: { type, weatherData }
    });
  }, [state.settings, sendNotification]);

  // 更新通知设置
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setState(prev => {
      const updatedSettings = { ...prev.settings, ...newSettings };
      
      // 保存到用户设置
      SettingsManager.updateSetting('notifications', updatedSettings);
      
      return {
        ...prev,
        settings: updatedSettings
      };
    });
  }, []);

  // 更新单个通知类型设置
  const updateNotificationType = useCallback((
    type: NotificationType,
    settings: Partial<NotificationSettings['types'][NotificationType]>
  ) => {
    setState(prev => {
      const updatedSettings = {
        ...prev.settings,
        types: {
          ...prev.settings.types,
          [type]: {
            ...prev.settings.types[type],
            ...settings
          }
        }
      };
      
      // 保存到用户设置
      SettingsManager.updateSetting('notifications', updatedSettings);
      
      return {
        ...prev,
        settings: updatedSettings
      };
    });
  }, []);

  // 添加通知记录
  const addNotificationRecord = useCallback((notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      isRead: false
    };

    setState(prev => {
      const notifications = [newNotification, ...prev.notifications].slice(0, 50); // 最多保留50条
      
      // 保存到本地存储
      StorageManager.save('notifications', notifications);
      
      return {
        ...prev,
        notifications
      };
    });

    return newNotification;
  }, []);

  // 标记通知为已读
  const markAsRead = useCallback((notificationId: string) => {
    setState(prev => {
      const notifications = prev.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      
      // 保存到本地存储
      StorageManager.save('notifications', notifications);
      
      return {
        ...prev,
        notifications
      };
    });
  }, []);

  // 清除所有通知记录
  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
    StorageManager.remove('notifications');
  }, []);

  // 检查是否在勿扰时段
  const isQuietHours = useCallback((): boolean => {
    if (!state.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = state.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = state.settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // 同一天内的时间段
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 跨天的时间段
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [state.settings.quietHours]);

  // 初始化
  useEffect(() => {
    // 检查通知支持
    const isSupported = checkNotificationSupport();
    
    if (isSupported) {
      // 获取当前权限状态
      setState(prev => ({
        ...prev,
        permission: Notification.permission
      }));
    }

    // 加载通知设置
    const userSettings = SettingsManager.loadSettings();
    setState(prev => ({
      ...prev,
      settings: userSettings.notifications
    }));

    // 加载通知记录
    const notifications = StorageManager.load<NotificationData[]>('notifications') || [];
    setState(prev => ({
      ...prev,
      notifications
    }));
  }, [checkNotificationSupport]);

  return {
    ...state,
    requestPermission,
    sendNotification,
    sendWeatherNotification,
    updateSettings,
    updateNotificationType,
    addNotificationRecord,
    markAsRead,
    clearNotifications,
    isQuietHours
  };
};