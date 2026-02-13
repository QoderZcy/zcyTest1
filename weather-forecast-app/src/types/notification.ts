// 通知类型
export enum NotificationType {
  DAILY_WEATHER = 'daily-weather',
  WEATHER_CHANGE = 'weather-change',
  SEVERE_WEATHER = 'severe-weather',
  CLOTHING_ADVICE = 'clothing-advice',
  AIR_QUALITY = 'air-quality'
}

// 通知优先级
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 通知数据
export interface NotificationData {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    url: string;
  };
  scheduledTime?: Date;
  createdAt: Date;
  isRead: boolean;
}

// 通知设置
export interface NotificationSettings {
  enabled: boolean;
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      time?: string; // HH:mm 格式
      daysOfWeek?: number[]; // 0-6, 0为周日
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  sound: boolean;
  vibration: boolean;
}

// 通知权限状态
export type NotificationPermission = 'default' | 'granted' | 'denied';

// 推送消息模板
export interface NotificationTemplate {
  type: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  icon: string;
  variables: string[];
}