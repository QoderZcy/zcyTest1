// 日期和时间格式化工具函数

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  // 小于 1 分钟
  if (diffInSeconds < 60) {
    return '刚刚';
  }
  
  // 小于 1 小时
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} 分钟前`;
  }
  
  // 小于 24 小时
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} 小时前`;
  }
  
  // 小于 7 天
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} 天前`;
  }
  
  // 超过 7 天，显示具体日期
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * 格式化完整日期时间
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 格式化阅读时间
 */
export const formatReadTime = (minutes: number): string => {
  if (minutes < 1) {
    return '不到 1 分钟';
  }
  
  if (minutes < 60) {
    return `${Math.round(minutes)} 分钟阅读`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} 小时阅读`;
  }
  
  return `${hours} 小时 ${Math.round(remainingMinutes)} 分钟阅读`;
};

/**
 * 计算阅读时间（基于字数）
 */
export const calculateReadTime = (content: string, wordsPerMinute: number = 200): number => {
  // 移除 Markdown 语法
  const plainText = content
    .replace(/[#*`_~\[\]()]/g, '') // 移除常见 Markdown 符号
    .replace(/\!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`.*?`/g, '') // 移除行内代码
    .trim();
  
  // 计算中文字符数和英文单词数
  const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = plainText
    .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
  
  // 中文按字符计算，英文按单词计算
  // 假设中文阅读速度为每分钟 300 字，英文为每分钟 200 词
  const totalWords = chineseChars * 0.67 + englishWords; // 中文字符转换为等效英文单词数
  
  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化数字（如浏览量、点赞数）
 */
export const formatNumber = (num: number): string => {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 10000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  if (num < 1000000) {
    return Math.round(num / 1000) + 'K';
  }
  
  return (num / 1000000).toFixed(1) + 'M';
};

/**
 * 获取相对时间描述
 */
export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 0) {
    return '未来时间';
  }
  
  const intervals = [
    { label: '年', seconds: 31536000 },
    { label: '个月', seconds: 2592000 },
    { label: '天', seconds: 86400 },
    { label: '小时', seconds: 3600 },
    { label: '分钟', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}前`;
    }
  }
  
  return '刚刚';
};

/**
 * 检查日期是否为今天
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

/**
 * 检查日期是否为昨天
 */
export const isYesterday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
};

/**
 * 格式化时间范围
 */
export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const startStr = start.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
  
  const endStr = end.toLocaleDateString('zh-CN', {
    month: 'short', 
    day: 'numeric'
  });
  
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.getFullYear()}年${startStr} - ${end.getFullYear()}年${endStr}`;
  }
  
  return `${startStr} - ${endStr}`;
};