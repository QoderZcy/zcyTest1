import React, { useState, useEffect } from 'react';

interface CurrentTimeProps {
  format?: 'full' | 'time' | 'date';
  updateInterval?: number; // 更新间隔，单位：毫秒
  className?: string;
}

/**
 * 当前时间显示组件
 * 实时显示当前日期和时间
 */
const CurrentTime: React.FC<CurrentTimeProps> = ({
  format = 'full',
  updateInterval = 1000,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 设置定时器更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    // 清理定时器
    return () => clearInterval(timer);
  }, [updateInterval]);

  /**
   * 格式化时间显示
   */
  const formatTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Shanghai',
    };

    switch (format) {
      case 'time':
        return date.toLocaleTimeString('zh-CN', {
          ...options,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      case 'date':
        return date.toLocaleDateString('zh-CN', {
          ...options,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        });
      case 'full':
      default:
        return date.toLocaleString('zh-CN', {
          ...options,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'short',
        });
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <svg 
        className="w-4 h-4 text-secondary-500" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      <span className="text-secondary-700 font-mono text-sm">
        {formatTime(currentTime)}
      </span>
    </div>
  );
};

export default CurrentTime;