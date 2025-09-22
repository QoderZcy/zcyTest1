// 便签相关的 TypeScript 类型定义

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface NewNote {
  title: string;
  content: string;
  color: string;
  tags: string[];
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