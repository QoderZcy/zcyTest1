import React, { createContext, useContext, ReactNode } from 'react';
import { UserSettings } from '../types';
import { useSettings } from '../hooks';

// SettingsContext 接口
interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<void>;
  reload: () => void;
}

// 创建Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// SettingsProvider 组件
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const settingsHook = useSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
};

// useSettingsContext Hook
export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};