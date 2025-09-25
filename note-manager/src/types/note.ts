// 便签相关的 TypeScript 类型定义

import type { WeatherMetadata } from './weather';

// 同步状态枚举
export enum SyncStatus {
  LOCAL_ONLY = 'LOCAL_ONLY',   // 仅存在于本地
  SYNCED = 'SYNCED',           // 已同步到云端
  SYNCING = 'SYNCING',         // 正在同步中
  CONFLICT = 'CONFLICT',       // 存在冲突需要解决
  ERROR = 'ERROR',             // 同步失败
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  // 新增用户关联字段
  userId?: string;             // 便签所属用户ID
  syncStatus?: SyncStatus;     // 同步状态
  version?: number;            // 版本号，用于冲突解决
  lastSyncAt?: Date;          // 最后同步时间
  isDeleted?: boolean;        // 软删除标记
  // 天气集成字段
  weather?: WeatherMetadata;   // 天气信息
  weatherTags?: string[];      // 天气相关标签
  isWeatherTagged?: boolean;   // 是否包含天气信息
}

export interface NewNote {
  title: string;
  content: string;
  color: string;
  tags: string[];
  // 新增可选字段
  userId?: string;
}

export interface NoteFilter {
  searchTerm: string;
  selectedTags: string[];
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface NoteStats {
  totalNotes: number;
  recentNotes: number;
  totalTags: number;
  // 新增统计字段
  syncedNotes?: number;       // 已同步的便签数量
  localOnlyNotes?: number;    // 仅本地的便签数量
  conflictNotes?: number;     // 有冲突的便签数量
}

// 数据迁移相关类型
export interface MigrationOptions {
  strategy: 'merge' | 'overwrite' | 'keep_local' | 'selective';
  conflictResolution: 'newer' | 'older' | 'manual';
  backupLocal: boolean;
}

export interface MigrationStatus {
  isInProgress: boolean;
  totalNotes: number;
  processedNotes: number;
  errors: string[];
  conflicts: Note[];
}

// 便签同步相关类型
export interface NoteSyncOptions {
  autoSync: boolean;
  syncInterval: number; // 毫秒
  retryAttempts: number;
  batchSize: number;
}

export interface SyncConflict {
  noteId: string;
  localNote: Note;
  remoteNote: Note;
  conflictType: 'content' | 'metadata' | 'deletion';
  timestamp: Date;
}

// 预定义的便签颜色
export const NOTE_COLORS = [
  '#FFE5B4', // 淡黄色
  '#E5F3FF', // 淡蓝色
  '#E5FFE5', // 淡绿色
  '#FFE5E5', // 淡红色
  '#F0E5FF', // 淡紫色
  '#FFE5F0', // 淡粉色
  '#E5F0FF', // 淡青色
  '#F5F5F5', // 淡灰色
] as const;

export type NoteColor = typeof NOTE_COLORS[number];