import React, { createContext, useContext, ReactNode } from 'react';
import { 
  NotificationData, 
  NotificationSettings, 
  NotificationPermission,
  NotificationType,
  CurrentWeatherData
} from '../types';
import { useNotification } from '../hooks';

// NotificationContext 接口
interface NotificationContextType {
  permission: NotificationPermission;
  settings: NotificationSettings;
  notifications: NotificationData[];
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    silent?: boolean;
  }) => Promise<Notification | null>;
  sendWeatherNotification: (
    type: NotificationType,
    weatherData: CurrentWeatherData,
    customMessage?: string
  ) => Promise<Notification | null>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  updateNotificationType: (
    type: NotificationType,
    settings: Partial<NotificationSettings['types'][NotificationType]>
  ) => void;
  addNotificationRecord: (notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>) => NotificationData;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  isQuietHours: () => boolean;
}

// 创建Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// NotificationProvider 组件
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationHook = useNotification();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
};

// useNotificationContext Hook
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};