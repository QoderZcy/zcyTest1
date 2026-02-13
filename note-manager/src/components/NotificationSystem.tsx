import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
  position = 'top-right',
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 添加通知
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ): string => {
    const id = uuidv4();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? defaultDuration,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      
      // 限制最大通知数量
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      
      return updated;
    });

    // 自动移除非持久化通知
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [defaultDuration, maxNotifications]);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.onClose) {
        notification.onClose();
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // 清除所有通知
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 更新通知
  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer position={position} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  position: string;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ position }) => {
  const { notifications } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-container ${position}`}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // 添加进入动画
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300); // 等待退出动画完成
  }, [notification.id, removeNotification]);

  const handleAction = useCallback(() => {
    if (notification.action) {
      notification.action.onClick();
      handleClose();
    }
  }, [notification.action, handleClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} className="notification-icon success" />;
      case 'error':
        return <AlertCircle size={20} className="notification-icon error" />;
      case 'warning':
        return <AlertTriangle size={20} className="notification-icon warning" />;
      case 'info':
        return <Info size={20} className="notification-icon info" />;
      case 'loading':
        return <Loader2 size={20} className="notification-icon loading animate-spin" />;
      default:
        return <Info size={20} className="notification-icon info" />;
    }
  };

  const getProgressBarDuration = () => {
    if (notification.persistent || !notification.duration) {
      return 0;
    }
    return notification.duration;
  };

  return (
    <div
      className={`notification-item ${notification.type} ${
        isVisible ? 'visible' : ''
      } ${isLeaving ? 'leaving' : ''}`}
    >
      <div className="notification-content">
        <div className="notification-header">
          {getIcon()}
          <div className="notification-text">
            <h4 className="notification-title">{notification.title}</h4>
            {notification.message && (
              <p className="notification-message">{notification.message}</p>
            )}
          </div>
          
          {!notification.persistent && (
            <button
              onClick={handleClose}
              className="notification-close"
              aria-label="关闭通知"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {notification.action && (
          <div className="notification-footer">
            <button
              onClick={handleAction}
              className="notification-action-btn"
            >
              {notification.action.label}
            </button>
          </div>
        )}
      </div>

      {/* 进度条 */}
      {getProgressBarDuration() > 0 && (
        <div
          className="notification-progress"
          style={{
            animationDuration: `${getProgressBarDuration()}ms`,
          }}
        />
      )}
    </div>
  );
};

// 便捷的通知钩子
export const useNotificationActions = () => {
  const { addNotification } = useNotifications();

  const showSuccess = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // 错误通知默认持久化
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000, // 警告通知显示更长时间
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showLoading = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'loading',
      title,
      message,
      persistent: true, // 加载通知默认持久化
      ...options,
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
};

// 全局通知实例（用于在React组件外部调用）
let globalNotificationContext: NotificationContextType | null = null;

export const setGlobalNotificationContext = (context: NotificationContextType) => {
  globalNotificationContext = context;
};

export const globalNotifications = {
  success: (title: string, message?: string, options?: Partial<Notification>) => {
    return globalNotificationContext?.addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  },
  
  error: (title: string, message?: string, options?: Partial<Notification>) => {
    return globalNotificationContext?.addNotification({
      type: 'error',
      title,
      message,
      persistent: true,
      ...options,
    });
  },
  
  warning: (title: string, message?: string, options?: Partial<Notification>) => {
    return globalNotificationContext?.addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000,
      ...options,
    });
  },
  
  info: (title: string, message?: string, options?: Partial<Notification>) => {
    return globalNotificationContext?.addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  },
  
  loading: (title: string, message?: string, options?: Partial<Notification>) => {
    return globalNotificationContext?.addNotification({
      type: 'loading',
      title,
      message,
      persistent: true,
      ...options,
    });
  },
};

export default NotificationProvider;