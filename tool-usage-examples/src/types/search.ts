/**
 * 搜索工具相关类型定义
 */

// 代码搜索选项
export interface SearchCodebaseOptions {
  keyWords: string[];
  query: string;
  searchScope?: string;
}

// 文件搜索选项
export interface SearchFileOptions {
  pattern: string;
  recursive?: boolean;
  includeHidden?: boolean;
}

// 代码内容搜索选项
export interface GrepCodeOptions {
  includePattern: string;
  regex: string;
  excludePattern?: string;
  maxResults?: number;
}

// 搜索结果接口
export interface SearchResult {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  matches?: Match[];
}

// 匹配结果接口
export interface Match {
  line: number;
  column: number;
  text: string;
  context?: string;
}

// 网络搜索选项
export interface WebSearchOptions {
  query: string;
  timeRange?: 'OneDay' | 'OneWeek' | 'OneMonth' | 'OneYear' | 'NoLimit';
  maxResults?: number;
  language?: string;
}

// 网络搜索结果
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishDate?: string;
  relevanceScore?: number;
}

// 内容获取选项
export interface FetchContentOptions {
  url: string;
  query?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// 获取的内容结果
export interface FetchContentResult {
  content: string;
  title?: string;
  metadata?: {
    lastModified?: string;
    contentType?: string;
    size?: number;
  };
}

// 文件操作结果
export interface FileOperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

// 目录列表项
export interface DirectoryItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  permissions?: string;
}

// 搜索统计信息
export interface SearchStats {
  totalResults: number;
  searchTime: number;
  filesScanned: number;
  matchesFound: number;
}

// 搜索配置
export interface SearchConfig {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  maxFileSize: number;
  excludePatterns: string[];
  includePatterns: string[];
}

export default {};