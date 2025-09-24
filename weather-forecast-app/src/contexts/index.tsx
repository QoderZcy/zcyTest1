import React, { ReactNode } from 'react';
import { WeatherProvider } from './WeatherContext';
import { SettingsProvider } from './SettingsContext';
import { NotificationProvider } from './NotificationContext';

// 组合所有Provider的根Provider组件
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <WeatherProvider>
          {children}
        </WeatherProvider>
      </NotificationProvider>
    </SettingsProvider>
  );
};

// 统一导出所有Context和Hooks
export * from './WeatherContext';
export * from './SettingsContext';
export * from './NotificationContext';