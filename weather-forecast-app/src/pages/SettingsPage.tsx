import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Clock,
  Calendar,
  Save,
  RotateCcw
} from 'lucide-react';
import { useSettingsContext, useNotificationContext } from '../contexts';
import { NotificationType } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSetting, resetSettings } = useSettingsContext();
  const { 
    permission, 
    settings: notificationSettings, 
    updateSettings: updateNotificationSettings,
    requestPermission 
  } = useNotificationContext();
  
  const [hasChanges, setHasChanges] = useState(false);

  // 处理通知权限请求
  const handleRequestNotificationPermission = async () => {
    try {
      await requestPermission();
    } catch (error) {
      console.error('请求通知权限失败:', error);
    }
  };

  // 更新通知设置
  const handleNotificationChange = (enabled: boolean) => {
    updateNotificationSettings({ enabled });
    setHasChanges(true);
  };

  // 更新通知类型设置
  const handleNotificationTypeChange = (type: NotificationType, enabled: boolean) => {
    updateNotificationSettings({
      types: {
        ...notificationSettings.types,
        [type]: {
          ...notificationSettings.types[type],
          enabled
        }
      }
    });
    setHasChanges(true);
  };

  // 保存设置
  const handleSave = () => {
    setHasChanges(false);
    // 设置已自动保存，这里只是更新UI状态
  };

  // 重置设置
  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      resetSettings();
      setHasChanges(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">设置</h1>
        {hasChanges && (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              保存
            </button>
            <button
              onClick={handleReset}
              className="btn btn-danger btn-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </button>
          </div>
        )}
      </div>

      {/* 通知设置 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          通知设置
        </h2>

        {/* 通知权限状态 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">通知权限</div>
              <div className="text-sm text-gray-600">
                {permission === 'granted' && '已授权'}
                {permission === 'denied' && '已拒绝'}
                {permission === 'default' && '未设置'}
              </div>
            </div>
            {permission !== 'granted' && (
              <button
                onClick={handleRequestNotificationPermission}
                className="btn btn-primary btn-sm"
              >
                请求权限
              </button>
            )}
          </div>
        </div>

        {/* 总开关 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {notificationSettings.enabled ? (
              <Bell className="w-5 h-5 mr-3 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 mr-3 text-gray-400" />
            )}
            <div>
              <div className="font-medium">启用通知</div>
              <div className="text-sm text-gray-600">接收天气相关通知</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.enabled}
              onChange={(e) => handleNotificationChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 通知类型设置 */}
        {notificationSettings.enabled && (
          <div className="space-y-4 pl-8">
            <NotificationTypeToggle
              type={NotificationType.DAILY_WEATHER}
              label="每日天气预报"
              description="每天早上推送当日天气"
              icon={<Calendar className="w-4 h-4" />}
              enabled={notificationSettings.types[NotificationType.DAILY_WEATHER]?.enabled || false}
              onChange={(enabled) => handleNotificationTypeChange(NotificationType.DAILY_WEATHER, enabled)}
            />
            
            <NotificationTypeToggle
              type={NotificationType.WEATHER_CHANGE}
              label="天气变化提醒"
              description="天气发生显著变化时提醒"
              icon={<Clock className="w-4 h-4" />}
              enabled={notificationSettings.types[NotificationType.WEATHER_CHANGE]?.enabled || false}
              onChange={(enabled) => handleNotificationTypeChange(NotificationType.WEATHER_CHANGE, enabled)}
            />
            
            <NotificationTypeToggle
              type={NotificationType.SEVERE_WEATHER}
              label="恶劣天气预警"
              description="暴雨、大雪等恶劣天气预警"
              icon={<Bell className="w-4 h-4" />}
              enabled={notificationSettings.types[NotificationType.SEVERE_WEATHER]?.enabled || false}
              onChange={(enabled) => handleNotificationTypeChange(NotificationType.SEVERE_WEATHER, enabled)}
            />
            
            <NotificationTypeToggle
              type={NotificationType.CLOTHING_ADVICE}
              label="穿衣建议"
              description="根据天气推送穿衣建议"
              icon={<Smartphone className="w-4 h-4" />}
              enabled={notificationSettings.types[NotificationType.CLOTHING_ADVICE]?.enabled || false}
              onChange={(enabled) => handleNotificationTypeChange(NotificationType.CLOTHING_ADVICE, enabled)}
            />
          </div>
        )}

        {/* 声音和振动设置 */}
        {notificationSettings.enabled && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {notificationSettings.sound ? (
                  <Volume2 className="w-5 h-5 mr-3 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5 mr-3 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">通知声音</div>
                  <div className="text-sm text-gray-600">播放通知提示音</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.sound}
                  onChange={(e) => updateNotificationSettings({ sound: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 单位设置 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">单位设置</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">温度单位</div>
              <div className="text-sm text-gray-600">选择温度显示单位</div>
            </div>
            <select
              value={settings.temperatureUnit}
              onChange={(e) => updateSetting('temperatureUnit', e.target.value as 'celsius' | 'fahrenheit')}
              className="input w-32"
            >
              <option value="celsius">摄氏度 (°C)</option>
              <option value="fahrenheit">华氏度 (°F)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">风速单位</div>
              <div className="text-sm text-gray-600">选择风速显示单位</div>
            </div>
            <select
              value={settings.windSpeedUnit}
              onChange={(e) => updateSetting('windSpeedUnit', e.target.value as any)}
              className="input w-32"
            >
              <option value="kmh">公里/小时</option>
              <option value="mph">英里/小时</option>
              <option value="ms">米/秒</option>
            </select>
          </div>
        </div>
      </div>

      {/* 其他设置 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">其他设置</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">自动定位</div>
              <div className="text-sm text-gray-600">启动时自动获取当前位置</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoLocation}
                onChange={(e) => updateSetting('autoLocation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">24小时制</div>
              <div className="text-sm text-gray-600">使用24小时时间格式</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show24HourFormat}
                onChange={(e) => updateSetting('show24HourFormat', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// 通知类型开关组件
interface NotificationTypeToggleProps {
  type: NotificationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const NotificationTypeToggle: React.FC<NotificationTypeToggleProps> = ({
  label,
  description,
  icon,
  enabled,
  onChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="text-blue-600 mr-3">{icon}</div>
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
};