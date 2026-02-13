import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { errorHandler } from '../services/errorHandler';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoHide?: boolean;
  onStatusChange?: (status: NetworkStatus) => void;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  position = 'top-right',
  autoHide = true,
  onStatusChange,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // 获取网络连接信息
  const getNetworkInfo = (): Partial<NetworkStatus> => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }
    
    return {};
  };

  // 更新网络状态
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    const networkInfo = getNetworkInfo();
    
    const newStatus: NetworkStatus = {
      isOnline,
      ...networkInfo,
      connectionType: networkInfo.connectionType || 'unknown',
      effectiveType: networkInfo.effectiveType || 'unknown',
      downlink: networkInfo.downlink || 0,
      rtt: networkInfo.rtt || 0,
    };
    
    setNetworkStatus(newStatus);
    
    // 触发状态变化回调
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    
    // 处理离线状态
    if (!isOnline) {
      setLastOfflineTime(new Date());
      setIsVisible(true);
      
      // 记录网络断开事件
      errorHandler.handleError(new Error('网络连接断开'), {
        action: 'network_offline',
        networkInfo: newStatus,
      });
    } else {
      // 网络恢复
      if (lastOfflineTime) {
        const offlineDuration = Date.now() - lastOfflineTime.getTime();
        console.log(`[NetworkStatus] 网络恢复，离线时长: ${offlineDuration}ms`);
        
        setLastOfflineTime(null);
        setReconnectAttempts(0);
        
        // 记录网络恢复事件
        console.log('[NetworkStatus] 网络连接已恢复');
      }
      
      // 自动隐藏指示器
      if (autoHide) {
        setTimeout(() => setIsVisible(false), 3000);
      }
    }
  };

  // 初始化网络状态监听
  useEffect(() => {
    updateNetworkStatus();
    
    const handleOnline = () => {
      console.log('[NetworkStatus] 网络已连接');
      updateNetworkStatus();
    };
    
    const handleOffline = () => {
      console.log('[NetworkStatus] 网络已断开');
      updateNetworkStatus();
    };
    
    const handleConnectionChange = () => {
      console.log('[NetworkStatus] 网络连接状态变化');
      updateNetworkStatus();
    };
    
    // 添加事件监听器
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 监听网络连接变化（如果支持）
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    // 定期检查网络状态
    const intervalId = setInterval(updateNetworkStatus, 30000); // 每30秒检查一次
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      clearInterval(intervalId);
    };
  }, [onStatusChange, autoHide, lastOfflineTime]);

  // 手动重连
  const handleReconnect = async () => {
    setReconnectAttempts(prev => prev + 1);
    
    try {
      // 尝试发送ping请求检查连接
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      
      if (response.ok || response.type === 'opaque') {
        console.log('[NetworkStatus] 手动重连成功');
        updateNetworkStatus();
      }
    } catch (error) {
      console.error('[NetworkStatus] 手动重连失败:', error);
      
      errorHandler.handleError(error, {
        action: 'manual_reconnect_failed',
        attempts: reconnectAttempts,
      });
    }
  };

  // 获取网络质量描述
  const getConnectionQuality = (): { label: string; color: string } => {
    if (!networkStatus.isOnline) {
      return { label: '离线', color: '#ef4444' };
    }
    
    const rtt = networkStatus.rtt;
    const downlink = networkStatus.downlink;
    
    if (rtt < 50 && downlink > 10) {
      return { label: '优秀', color: '#10b981' };
    } else if (rtt < 100 && downlink > 5) {
      return { label: '良好', color: '#f59e0b' };
    } else if (rtt < 300 && downlink > 1) {
      return { label: '一般', color: '#f59e0b' };
    } else {
      return { label: '较差', color: '#ef4444' };
    }
  };

  // 获取连接类型图标
  const getConnectionIcon = () => {
    if (!networkStatus.isOnline) {
      return <WifiOff size={20} color="#ef4444" />;
    }
    
    const quality = getConnectionQuality();
    return <Wifi size={20} color={quality.color} />;
  };

  // 格式化离线时长
  const formatOfflineDuration = (): string => {
    if (!lastOfflineTime) return '';
    
    const duration = Date.now() - lastOfflineTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 如果设置了自动隐藏且网络正常，不显示指示器
  if (autoHide && networkStatus.isOnline && !isVisible) {
    return null;
  }

  return (
    <div className={`network-status-indicator ${position} ${networkStatus.isOnline ? 'online' : 'offline'}`}>
      <div className="network-status-content">
        <div className="network-status-header">
          {getConnectionIcon()}
          <span className="network-status-text">
            {networkStatus.isOnline ? '已连接' : '离线'}
          </span>
          
          {networkStatus.isOnline && (
            <span className="network-quality" style={{ color: getConnectionQuality().color }}>
              {getConnectionQuality().label}
            </span>
          )}
        </div>
        
        {showDetails && (
          <div className="network-status-details">
            {networkStatus.isOnline ? (
              <>
                <div className="network-detail-item">
                  <span className="detail-label">连接类型:</span>
                  <span className="detail-value">{networkStatus.connectionType}</span>
                </div>
                
                <div className="network-detail-item">
                  <span className="detail-label">网络速度:</span>
                  <span className="detail-value">{networkStatus.effectiveType}</span>
                </div>
                
                {networkStatus.downlink > 0 && (
                  <div className="network-detail-item">
                    <span className="detail-label">下行带宽:</span>
                    <span className="detail-value">{networkStatus.downlink} Mbps</span>
                  </div>
                )}
                
                {networkStatus.rtt > 0 && (
                  <div className="network-detail-item">
                    <span className="detail-label">延迟:</span>
                    <span className="detail-value">{networkStatus.rtt} ms</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="offline-info">
                  <AlertCircle size={16} color="#ef4444" />
                  <span>网络连接已断开</span>
                </div>
                
                {lastOfflineTime && (
                  <div className="offline-duration">
                    <Clock size={16} />
                    <span>离线时长: {formatOfflineDuration()}</span>
                  </div>
                )}
                
                <button
                  onClick={handleReconnect}
                  className="reconnect-btn"
                  disabled={reconnectAttempts >= 3}
                >
                  {reconnectAttempts >= 3 ? '重连失败' : `重新连接 ${reconnectAttempts > 0 ? `(${reconnectAttempts})` : ''}`}
                </button>
              </>
            )}
          </div>
        )}
        
        {!networkStatus.isOnline && (
          <div className="network-status-warning">
            <p>当前处于离线状态，某些功能可能无法使用。</p>
            <p>您的更改将在网络恢复后自动同步。</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hook: 使用网络状态
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  });
  
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  
  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection;
      const isOnline = navigator.onLine;
      
      const newStatus: NetworkStatus = {
        isOnline,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
      };
      
      setNetworkStatus(newStatus);
      
      // 判断是否为慢速连接
      setIsSlowConnection(
        newStatus.isOnline && 
        (newStatus.rtt > 300 || newStatus.downlink < 1 || newStatus.effectiveType === 'slow-2g')
      );
    };
    
    updateStatus();
    
    const handleOnline = updateStatus;
    const handleOffline = updateStatus;
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);
  
  return {
    ...networkStatus,
    isSlowConnection,
    isEffectivelyOffline: !networkStatus.isOnline || isSlowConnection,
  };
}

export default NetworkStatusIndicator;