import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '../types';
import { SettingsManager } from '../utils';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(SettingsManager.getDefaultSettings());
  const [isLoading, setIsLoading] = useState(true);

  // 加载设置
  const loadSettings = useCallback(() => {
    setIsLoading(true);
    try {
      const loadedSettings = SettingsManager.loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('加载设置失败:', error);
      // 使用默认设置
      setSettings(SettingsManager.getDefaultSettings());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新单个设置
  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      SettingsManager.saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  // 批量更新设置
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      SettingsManager.saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  // 重置设置
  const resetSettings = useCallback(() => {
    const defaultSettings = SettingsManager.getDefaultSettings();
    setSettings(defaultSettings);
    SettingsManager.saveSettings(defaultSettings);
  }, []);

  // 导出设置
  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'weather-app-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [settings]);

  // 导入设置
  const importSettings = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          
          // 验证设置格式（简单验证）
          if (typeof importedSettings === 'object' && importedSettings !== null) {
            const mergedSettings = { ...SettingsManager.getDefaultSettings(), ...importedSettings };
            setSettings(mergedSettings);
            SettingsManager.saveSettings(mergedSettings);
            resolve();
          } else {
            throw new Error('无效的设置文件格式');
          }
        } catch (error) {
          reject(new Error('解析设置文件失败'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      reader.readAsText(file);
    });
  }, []);

  // 初始化加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    reload: loadSettings
  };
};