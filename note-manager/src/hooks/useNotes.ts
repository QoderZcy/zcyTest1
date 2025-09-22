import { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import type { 
  Note, 
  NewNote, 
  NoteFilter, 
  NoteStats, 
  SyncStatus,
  MigrationOptions,
  MigrationStatus 
} from '../types/note';

// localStorage 的键名
const STORAGE_KEY = 'notes-app-data';
const USER_NOTES_KEY_PREFIX = 'user-notes-';
const MIGRATION_STATUS_KEY = 'migration-status';

// 从 localStorage 读取便签数据（传统方式，兼容旧数据）
const loadNotesFromStorage = (): Note[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const notes = JSON.parse(data);
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      syncStatus: SyncStatus.LOCAL_ONLY, // 标记为本地数据
      version: note.version || 1,
    }));
  } catch (error) {
    console.error('Error loading notes from storage:', error);
    return [];
  }
};

// 从用户专属存储读取便签数据
const loadUserNotesFromStorage = (userId: string): Note[] => {
  try {
    const userKey = `${USER_NOTES_KEY_PREFIX}${userId}`;
    const data = localStorage.getItem(userKey);
    if (!data) return [];
    
    const notes = JSON.parse(data);
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      userId: userId,
      syncStatus: note.syncStatus || SyncStatus.LOCAL_ONLY,
      version: note.version || 1,
    }));
  } catch (error) {
    console.error('Error loading user notes from storage:', error);
    return [];
  }
};

// 保存便签数据到用户专属存储
const saveUserNotesToStorage = (notes: Note[], userId: string): void => {
  try {
    const userKey = `${USER_NOTES_KEY_PREFIX}${userId}`;
    const userNotes = notes.filter(note => note.userId === userId);
    localStorage.setItem(userKey, JSON.stringify(userNotes));
  } catch (error) {
    console.error('Error saving user notes to storage:', error);
  }
};

// 检查是否有旧的本地数据需要迁移
const checkForLegacyData = (): Note[] => {
  const legacyData = loadNotesFromStorage();
  return legacyData.filter(note => !note.userId); // 没有用户ID的便签
};

// 获取迁移状态
const getMigrationStatus = (): MigrationStatus | null => {
  try {
    const data = localStorage.getItem(MIGRATION_STATUS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

// 保存迁移状态
const saveMigrationStatus = (status: MigrationStatus): void => {
  try {
    localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error saving migration status:', error);
  }
};

// 清除迁移状态
const clearMigrationStatus = (): void => {
  localStorage.removeItem(MIGRATION_STATUS_KEY);
};

// 便签管理的主要 hook
export const useNotes = () => {
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<NoteFilter>({
    searchTerm: '',
    selectedTags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化用户数据
  useEffect(() => {
    if (isAuthenticated && user && !isInitialized) {
      initializeUserData();
    } else if (!isAuthenticated) {
      // 用户未登录，清空数据
      setNotes([]);
      setIsInitialized(false);
    }
  }, [isAuthenticated, user, isInitialized]);

  // 保存用户数据
  useEffect(() => {
    if (isAuthenticated && user && isInitialized) {
      saveUserNotesToStorage(notes, user.id);
    }
  }, [notes, user, isAuthenticated, isInitialized]);

  /**
   * 初始化用户数据
   */
  const initializeUserData = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      // 加载用户便签
      const userNotes = loadUserNotesFromStorage(user.id);
      
      // 检查是否有需要迁移的旧数据
      const legacyNotes = checkForLegacyData();
      
      if (legacyNotes.length > 0 && userNotes.length === 0) {
        // 有旧数据且用户还没有便签，启动迁移流程
        await startDataMigration(legacyNotes);
      } else {
        setNotes(userNotes);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize user data:', error);
      setNotes([]);
      setIsInitialized(true);
    }
  }, [user]);

  /**
   * 启动数据迁移
   */
  const startDataMigration = useCallback(async (legacyNotes: Note[]): Promise<void> => {
    if (!user) return;

    const migrationOptions: MigrationOptions = {
      strategy: 'merge', // 默认合并策略
      conflictResolution: 'newer',
      backupLocal: true,
    };

    const migration: MigrationStatus = {
      isInProgress: true,
      totalNotes: legacyNotes.length,
      processedNotes: 0,
      errors: [],
      conflicts: [],
    };

    setMigrationStatus(migration);
    saveMigrationStatus(migration);

    try {
      const migratedNotes: Note[] = [];
      
      for (let i = 0; i < legacyNotes.length; i++) {
        const note = legacyNotes[i];
        
        // 为旧便签添加用户ID和同步状态
        const migratedNote: Note = {
          ...note,
          userId: user.id,
          syncStatus: SyncStatus.LOCAL_ONLY,
          version: 1,
          lastSyncAt: undefined,
        };
        
        migratedNotes.push(migratedNote);
        
        // 更新迁移进度
        migration.processedNotes = i + 1;
        setMigrationStatus({ ...migration });
        
        // 模拟延迟，让用户看到进度
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 迁移完成
      setNotes(migratedNotes);
      saveUserNotesToStorage(migratedNotes, user.id);
      
      // 如果需要备份，保留原数据
      if (migrationOptions.backupLocal) {
        const backupKey = `${STORAGE_KEY}-backup-${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(legacyNotes));
      }
      
      // 清除旧数据
      localStorage.removeItem(STORAGE_KEY);
      
      // 清除迁移状态
      clearMigrationStatus();
      setMigrationStatus(null);
      
    } catch (error) {
      console.error('Data migration failed:', error);
      migration.errors.push('Migration failed: ' + error);
      migration.isInProgress = false;
      setMigrationStatus({ ...migration });
      saveMigrationStatus(migration);
    }
  }, [user]);

  // 创建新便签
  const createNote = useCallback((newNote: NewNote): Note => {
    if (!user) {
      throw new Error('User must be authenticated to create notes');
    }

    const note: Note = {
      id: uuidv4(),
      ...newNote,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: SyncStatus.LOCAL_ONLY,
      version: 1,
    };
    
    setNotes(prev => [note, ...prev]);
    return note;
  }, [user]);

  // 更新便签
  const updateNote = useCallback((id: string, updates: Partial<Note>): boolean => {
    if (!user) {
      throw new Error('User must be authenticated to update notes');
    }

    setNotes(prev => {
      const index = prev.findIndex(note => note.id === id && note.userId === user.id);
      if (index === -1) return prev;
      
      const currentNote = prev[index];
      const updatedNote = {
        ...currentNote,
        ...updates,
        updatedAt: new Date(),
        syncStatus: SyncStatus.LOCAL_ONLY, // 标记为未同步
        version: (currentNote.version || 1) + 1,
      };
      
      const newNotes = [...prev];
      newNotes[index] = updatedNote;
      return newNotes;
    });
    return true;
  }, [user]);

  // 删除便签
  const deleteNote = useCallback((id: string): boolean => {
    if (!user) {
      throw new Error('User must be authenticated to delete notes');
    }

    setNotes(prev => prev.filter(note => !(note.id === id && note.userId === user.id)));
    return true;
  }, [user]);

  // 批量删除便签
  const deleteNotes = useCallback((ids: string[]): void => {
    if (!user) {
      throw new Error('User must be authenticated to delete notes');
    }

    setNotes(prev => prev.filter(note => 
      !(ids.includes(note.id) && note.userId === user.id)
    ));
  }, [user]);

  // 清除迁移状态
  const clearMigration = useCallback((): void => {
    clearMigrationStatus();
    setMigrationStatus(null);
  }, []);

  // 重试迁移
  const retryMigration = useCallback(async (): Promise<void> => {
    const legacyNotes = checkForLegacyData();
    if (legacyNotes.length > 0) {
      await startDataMigration(legacyNotes);
    }
  }, [startDataMigration]);

  // 获取所有标签（仅当前用户的）
  const allTags = useMemo(() => {
    const userNotes = notes.filter(note => !user || note.userId === user?.id);
    const tagSet = new Set<string>();
    userNotes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes, user]);

  // 过滤和排序便签（仅当前用户的）
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => !user || note.userId === user?.id);

    // 按搜索词过滤
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 按标签过滤
    if (filter.selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        filter.selectedTags.some(tag => note.tags.includes(tag))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filter.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
      }

      if (filter.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [notes, filter, user]);

  // 便签统计信息（仅当前用户的）
  const stats: NoteStats = useMemo(() => {
    const userNotes = notes.filter(note => !user || note.userId === user?.id);
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const recentNotes = userNotes.filter(note => note.createdAt > threeDaysAgo);
    const syncedNotes = userNotes.filter(note => note.syncStatus === SyncStatus.SYNCED);
    const localOnlyNotes = userNotes.filter(note => note.syncStatus === SyncStatus.LOCAL_ONLY);
    const conflictNotes = userNotes.filter(note => note.syncStatus === SyncStatus.CONFLICT);
    
    return {
      totalNotes: userNotes.length,
      recentNotes: recentNotes.length,
      totalTags: allTags.length,
      syncedNotes: syncedNotes.length,
      localOnlyNotes: localOnlyNotes.length,
      conflictNotes: conflictNotes.length,
    };
  }, [notes, allTags, user]);

  return {
    notes: filteredNotes,
    allNotes: notes.filter(note => !user || note.userId === user?.id),
    allTags,
    filter,
    stats,
    migrationStatus,
    isInitialized,
    setFilter,
    createNote,
    updateNote,
    deleteNote,
    deleteNotes,
    clearMigration,
    retryMigration,
  };
};

// 搜索便签的 hook
export const useNoteSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
  };
};