import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotes } from '../hooks/useNotes';
import { SyncStatus } from '../types/note';
import { AuthProvider } from '../contexts/AuthContext';
import React from 'react';

// Mock 依赖
vi.mock('../services/errorHandler', () => ({
  errorHandler: {
    handleError: vi.fn(),
  },
}));

vi.mock('../services/dataMigrationService', () => ({
  dataMigrationService: {
    checkMigrationNeeded: vi.fn(() => false),
    onMigrationUpdate: vi.fn(() => 'mock-id'),
    offMigrationUpdate: vi.fn(),
    startMigration: vi.fn(),
  },
}));

vi.mock('../services/noteSyncService', () => ({
  noteSyncService: {
    init: vi.fn(),
    destroy: vi.fn(),
    addToSyncQueue: vi.fn(),
    addBatchToSyncQueue: vi.fn(),
    triggerSync: vi.fn(),
    fetchNotesFromServer: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  },
  isAuthenticated: true,
  isInitialized: true,
  token: 'mock-token',
  refreshToken: 'mock-refresh-token',
  tokenExpiryTime: Date.now() + 3600000,
  loading: false,
  error: null,
  rememberMe: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  clearError: vi.fn(),
  updateUser: vi.fn(),
  checkTokenExpiration: vi.fn(),
  initializeAuth: vi.fn(),
  isTokenExpiringSoon: vi.fn(() => false),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useNotes Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该初始化时加载默认便签', () => {
    const { result } = renderHook(() => useNotes());

    expect(result.current.notes).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('应该正确创建新便签', () => {
    const { result } = renderHook(() => useNotes());

    const noteData = {
      title: '测试便签',
      content: '这是一个测试便签的内容',
      color: '#FFE5B4',
      tags: ['测试', '单元测试'],
    };

    act(() => {
      const newNote = result.current.createNote(noteData);
      expect(newNote).toBeDefined();
      expect(newNote.title).toBe(noteData.title);
      expect(newNote.content).toBe(noteData.content);
      expect(newNote.syncStatus).toBe(SyncStatus.LOCAL_ONLY);
      expect(newNote.userId).toBe(mockAuthContext.user.id);
    });

    expect(result.current.notes.length).toBeGreaterThan(0);
  });

  it('应该正确更新便签', () => {
    const { result } = renderHook(() => useNotes());

    // 先创建一个便签
    let noteId: string;
    act(() => {
      const newNote = result.current.createNote({
        title: '原始标题',
        content: '原始内容',
        color: '#FFE5B4',
        tags: ['原始'],
      });
      noteId = newNote.id;
    });

    // 更新便签
    const updates = {
      title: '更新后的标题',
      content: '更新后的内容',
      tags: ['更新', '测试'],
    };

    act(() => {
      result.current.updateNote(noteId, updates);
    });

    const updatedNote = result.current.allNotes.find(note => note.id === noteId);
    expect(updatedNote).toBeDefined();
    expect(updatedNote?.title).toBe(updates.title);
    expect(updatedNote?.content).toBe(updates.content);
    expect(updatedNote?.tags).toEqual(updates.tags);
  });

  it('应该正确软删除便签', () => {
    const { result } = renderHook(() => useNotes());

    // 先创建一个便签
    let noteId: string;
    act(() => {
      const newNote = result.current.createNote({
        title: '要删除的便签',
        content: '这个便签将被删除',
        color: '#FFE5B4',
        tags: ['删除测试'],
      });
      noteId = newNote.id;
    });

    // 删除便签
    act(() => {
      result.current.deleteNote(noteId);
    });

    // 检查便签被标记为已删除
    const deletedNote = result.current.allNotes.find(note => note.id === noteId);
    expect(deletedNote).toBeDefined();
    expect(deletedNote?.isDeleted).toBe(true);
    
    // 检查便签不再出现在过滤后的列表中
    expect(result.current.notes.find(note => note.id === noteId)).toBeUndefined();
  });

  it('应该正确永久删除便签', () => {
    const { result } = renderHook(() => useNotes());

    // 先创建一个便签
    let noteId: string;
    act(() => {
      const newNote = result.current.createNote({
        title: '要永久删除的便签',
        content: '这个便签将被永久删除',
        color: '#FFE5B4',
        tags: ['永久删除测试'],
      });
      noteId = newNote.id;
    });

    // 永久删除便签
    act(() => {
      result.current.permanentDeleteNote(noteId);
    });

    // 检查便签完全不存在
    expect(result.current.allNotes.find(note => note.id === noteId)).toBeUndefined();
    expect(result.current.notes.find(note => note.id === noteId)).toBeUndefined();
  });

  it('应该正确过滤便签', () => {
    const { result } = renderHook(() => useNotes());

    // 创建多个便签用于测试过滤
    act(() => {
      result.current.createNote({
        title: 'JavaScript 学习笔记',
        content: '学习 React 和 TypeScript',
        color: '#FFE5B4',
        tags: ['编程', 'JavaScript'],
      });
      
      result.current.createNote({
        title: 'Python 教程',
        content: '学习 Python 基础语法',
        color: '#E5F3FF',
        tags: ['编程', 'Python'],
      });
      
      result.current.createNote({
        title: '购物清单',
        content: '买菜、买书、买衣服',
        color: '#E5FFE5',
        tags: ['生活', '购物'],
      });
    });

    // 测试按标题搜索
    act(() => {
      result.current.setFilter({ 
        searchTerm: 'JavaScript',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
    });

    expect(result.current.notes.length).toBe(1);
    expect(result.current.notes[0].title).toContain('JavaScript');

    // 测试按标签过滤
    act(() => {
      result.current.setFilter({ 
        searchTerm: '',
        selectedTags: ['编程'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
    });

    expect(result.current.notes.length).toBe(2);
    result.current.notes.forEach(note => {
      expect(note.tags).toContain('编程');
    });
  });

  it('应该正确计算统计信息', () => {
    const { result } = renderHook(() => useNotes());

    // 创建一些便签
    act(() => {
      result.current.createNote({
        title: '便签1',
        content: '内容1',
        color: '#FFE5B4',
        tags: ['标签1', '标签2'],
      });
      
      result.current.createNote({
        title: '便签2',
        content: '内容2',
        color: '#E5F3FF',
        tags: ['标签2', '标签3'],
      });
    });

    const stats = result.current.stats;
    
    expect(stats.totalNotes).toBeGreaterThanOrEqual(2);
    expect(stats.totalTags).toBeGreaterThanOrEqual(3);
    expect(stats.localOnlyNotes).toBeGreaterThanOrEqual(2);
  });

  it('应该正确获取所有标签', () => {
    const { result } = renderHook(() => useNotes());

    // 创建带有不同标签的便签
    act(() => {
      result.current.createNote({
        title: '便签1',
        content: '内容1',
        color: '#FFE5B4',
        tags: ['React', 'TypeScript'],
      });
      
      result.current.createNote({
        title: '便签2',
        content: '内容2',
        color: '#E5F3FF',
        tags: ['Vue', 'JavaScript'],
      });
      
      result.current.createNote({
        title: '便签3',
        content: '内容3',
        color: '#E5FFE5',
        tags: ['React', 'JavaScript'], // 重复标签
      });
    });

    const allTags = result.current.allTags;
    
    expect(allTags).toContain('React');
    expect(allTags).toContain('TypeScript');
    expect(allTags).toContain('Vue');
    expect(allTags).toContain('JavaScript');
    
    // 检查标签去重
    const reactCount = allTags.filter(tag => tag === 'React').length;
    expect(reactCount).toBe(1);
  });

  it('应该正确处理批量更新', () => {
    const { result } = renderHook(() => useNotes());

    const newNotes = [
      {
        id: 'batch-1',
        title: '批量便签1',
        content: '批量内容1',
        color: '#FFE5B4',
        tags: ['批量'],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: SyncStatus.SYNCED,
        userId: mockAuthContext.user.id,
      },
      {
        id: 'batch-2',
        title: '批量便签2',
        content: '批量内容2',
        color: '#E5F3FF',
        tags: ['批量'],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: SyncStatus.SYNCED,
        userId: mockAuthContext.user.id,
      },
    ];

    act(() => {
      result.current.batchUpdateNotes(newNotes);
    });

    expect(result.current.allNotes.find(note => note.id === 'batch-1')).toBeDefined();
    expect(result.current.allNotes.find(note => note.id === 'batch-2')).toBeDefined();
  });
});"