// 常量定义
export const CONSTANTS = {
  // API相关
  API: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    TIMEOUT: 10000,
  },
  
  // 分页相关
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
  },
  
  // 文件上传相关
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  },
  
  // 密码相关
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  
  // 文章相关
  ARTICLE: {
    TITLE_MAX_LENGTH: 100,
    SUMMARY_MAX_LENGTH: 200,
    CONTENT_MAX_LENGTH: 50000,
    TAGS_MAX_COUNT: 10,
  },
  
  // 评论相关
  COMMENT: {
    CONTENT_MAX_LENGTH: 1000,
    MAX_DEPTH: 3,
  },
  
  // 用户相关
  USER: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 20,
    BIO_MAX_LENGTH: 500,
  },
  
  // 本地存储键名
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_DATA: 'userData',
    THEME: 'theme',
    LANGUAGE: 'language',
    DRAFT_PREFIX: 'draft_',
  },
  
  // 主题相关
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  },
  
  // 语言相关
  LANGUAGES: {
    ZH_CN: 'zh-CN',
    EN_US: 'en-US',
  },
  
  // 错误代码
  ERROR_CODES: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    SERVER_ERROR: 500,
  },
  
  // 成功状态码
  SUCCESS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
  },
  
  // 正则表达式
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    PHONE: /^1[3-9]\d{9}$/,
    URL: /^https?:\/\/.+/,
    HEX_COLOR: /^#[0-9A-F]{6}$/i,
  },
  
  // 动画持续时间（毫秒）
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // 防抖延迟时间（毫秒）
  DEBOUNCE_DELAY: {
    SEARCH: 300,
    SAVE: 1000,
    RESIZE: 250,
  },
  
  // 缓存时间（毫秒）
  CACHE_TIME: {
    SHORT: 5 * 60 * 1000,      // 5分钟
    MEDIUM: 30 * 60 * 1000,    // 30分钟
    LONG: 24 * 60 * 60 * 1000, // 24小时
  },
  
  // 时间格式
  DATE_FORMATS: {
    FULL: 'YYYY年MM月DD日 HH:mm:ss',
    DATE: 'YYYY年MM月DD日',
    TIME: 'HH:mm:ss',
    SHORT: 'MM-DD HH:mm',
  },
  
  // 社交媒体链接
  SOCIAL_LINKS: {
    GITHUB: 'https://github.com',
    TWITTER: 'https://twitter.com',
    LINKEDIN: 'https://linkedin.com',
    WEIBO: 'https://weibo.com',
  },
  
  // 默认配置
  DEFAULTS: {
    AVATAR: '/default-avatar.png',
    COVER: '/default-cover.jpg',
    LOCALE: 'zh-CN',
    TIMEZONE: 'Asia/Shanghai',
  },
} as const;

// 导出类型
export type Theme = typeof CONSTANTS.THEMES[keyof typeof CONSTANTS.THEMES];
export type Language = typeof CONSTANTS.LANGUAGES[keyof typeof CONSTANTS.LANGUAGES];
export type ErrorCode = typeof CONSTANTS.ERROR_CODES[keyof typeof CONSTANTS.ERROR_CODES];
export type SuccessCode = typeof CONSTANTS.SUCCESS_CODES[keyof typeof CONSTANTS.SUCCESS_CODES];