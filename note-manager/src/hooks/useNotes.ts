import{ useState, useEffect, useCallback, useReducer }from 'react';
import { Note, NewNote, NoteFilter, NoteStats, MigrationStatus, SyncStatus } from '../types/note';
import { useAuth } from '../contexts/AuthContext';
import { errorHandler } from '../services/errorHandler';
import { dataMigrationService } from '../services/dataMigrationService';
import { noteSyncService } from '../services/noteSyncService';
import { v4 as uuidv4 } from 'uuid';

// 便签状态管理的Action类型
type NotesAction =
  | { type: 'NOTES_LOADING' }
  | { type: 'NOTES_LOADED'; payload: Note[] }
  | { type: 'NOTES_ERROR'; payload: string }
  | { type: 'NOTE_ADD'; payload: Note }
  | { type: 'NOTE_UPDATE'; payload: { id: string; updates: Partial<Note> } }
  | { type: 'NOTE_DELETE'; payload: string }
  | { type: 'NOTES_BATCH_UPDATE'; payload: Note[] }
  | { type: 'FILTER_UPDATE'; payload: Partial<NoteFilter> }
  | { type: 'MIGRATION_START'; payload: MigrationStatus }
  | { type: 'MIGRATION_UPDATE'; payload: Partial<MigrationStatus> }
  | { type: 'MIGRATION_COMPLETE' };

// 便签状态接口
interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  filter: NoteFilter;
  migrationStatus: MigrationStatus | null;
}

// 初始状态
const initialNotesState: NotesState = {
  notes: [],
  loading: false,
  error: null,
  filter: {
    searchTerm: '',
    selectedTags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  migrationStatus: null,
};

// 状态Reducer
function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case 'NOTES_LOADING':
      return { ...state, loading: true, error: null };
      
    case 'NOTES_LOADED':
      return { ...state, loading: false, notes: action.payload, error: null };
      
    case 'NOTES_ERROR':
      return { ...state, loading: false, error: action.payload };
      
    case 'NOTE_ADD':
      return { 
        ...state, 
        notes: [action.payload, ...state.notes] 
      };
      
    case 'NOTE_UPDATE':
      return {
        ...state,
        notes: state.notes.map(note => 
          note.id === action.payload.id 
            ? { ...note, ...action.payload.updates, updatedAt: new Date() }
            : note
        )
      };
      
    case 'NOTE_DELETE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload)
      };
      
    case 'NOTES_BATCH_UPDATE':
      return {
        ...state,
        notes: action.payload
      };
      
    case 'FILTER_UPDATE':
      return {
        ...state,
        filter: { ...state.filter, ...action.payload }
      };
      
    case 'MIGRATION_START':
      return {
        ...state,
        migrationStatus: action.payload
      };
      
    case 'MIGRATION_UPDATE':
      return {
        ...state,
        migrationStatus: state.migrationStatus 
          ? { ...state.migrationStatus, ...action.payload }
          : null
      };
      
    case 'MIGRATION_COMPLETE':
      return {
        ...state,
        migrationStatus: null
      };
      
    default:
      return state;
  }
}

// useNotes 钩子
export const useNotes = () => {
  const [state, dispatch] = useReducer(notesReducer, initialNotesState);
  const { user, isAuthenticated } = useAuth();
  
  // 初始化便签数据
  useEffect(() => {
    const loadInitialNotes = () => {
      try {
        dispatch({ type: 'NOTES_LOADING' });
        
        const storedNotes = NotesStorageManager.loadNotes();
        const migrationStatus = NotesStorageManager.loadMigrationStatus();
        
        dispatch({ type: 'NOTES_LOADED', payload: storedNotes });
        
        if (migrationStatus) {
          dispatch({ type: 'MIGRATION_START', payload: migrationStatus });
        }
        
        // 如果用户已认证且有本地数据，检查是否需要迁移
        if (isAuthenticated && storedNotes.length > 0) {
          checkMigrationNeeded(storedNotes);
        }
      } catch (error) {
        console.error('加载便签失败:', error);
        dispatch({ type: 'NOTES_ERROR', payload: '加载便签数据失败' });
        errorHandler.handleError(error, { action: 'load_initial_notes' });
      }
    };
    
    loadInitialNotes();
  }, [isAuthenticated]);
  
  // 检查是否需要数据迁移
  const checkMigrationNeeded = useCallback((notes: Note[]) => {
    if (!user || !isAuthenticated) return;
    
    const needsMigration = dataMigrationService.checkMigrationNeeded(notes, user);
    
    if (needsMigration) {
      console.log('[useNotes] 检测到需要数据迁移');
      
      // 自动开始迁移
      startDataMigration(notes);
    }
  }, [user, isAuthenticated]);
  
  // 开始数据迁移
  const startDataMigration = useCallback(async (notes: Note[]) => {
    if (!user) return;
    
    try {
      const migrationStatus: MigrationStatus = {
        isInProgress: true,
        totalNotes: notes.filter(note => !note.userId).length,
        processedNotes: 0,
        errors: [],
        conflicts: []
      };
      
      dispatch({ type: 'MIGRATION_START', payload: migrationStatus });
      NotesStorageManager.saveMigrationStatus(migrationStatus);
      
      // 注册迁移状态监听
      const listenerId = dataMigrationService.onMigrationUpdate((status) => {
        dispatch({ type: 'MIGRATION_UPDATE', payload: status });
        NotesStorageManager.saveMigrationStatus(status);
        
        if (!status.isInProgress) {
          // 迁移完成，重新加载便签
          const updatedNotes = NotesStorageManager.loadNotes();
          dispatch({ type: 'NOTES_LOADED', payload: updatedNotes });
          
          // 清理监听器
          dataMigrationService.offMigrationUpdate(listenerId);
          
          if (status.errors.length === 0) {
            // 迁移成功，初始化同步服务
            noteSyncService.init();
          }
        }
      });
      
      // 开始迁移
      await dataMigrationService.startMigration(notes, user, {
        strategy: 'merge',
        conflictResolution: 'newer',
        backupLocal: true
      });
      
    } catch (error) {
      console.error('[useNotes] 数据迁移失败:', error);
      errorHandler.handleError(error, { action: 'start_data_migration' });
      
      dispatch({ 
        type: 'MIGRATION_UPDATE', 
        payload: { 
          isInProgress: false,
          errors: [`迁移失败: ${error.message}`]
        } 
      });
    }
  }, [user]);
  
  // 保存便签到本地存储
  const saveToStorage = useCallback((notes: Note[]) => {
    NotesStorageManager.saveNotes(notes);
  }, []);
  
  // 监听便签变化并保存
  useEffect(() => {
    if (state.notes.length > 0) {
      saveToStorage(state.notes);
    }
  }, [state.notes, saveToStorage]);
  
  // 创建便签
  const createNote = useCallback((noteData: NewNote) => {
    try {
      const newNote = NotesOperationManager.createNote(noteData, user?.id);
      dispatch({ type: 'NOTE_ADD', payload: newNote });
      
      // 如果用户已认证且同步服务已初始化，添加到同步队列
      if (isAuthenticated && user && newNote.userId) {
        noteSyncService.addToSyncQueue(newNote);
      }
      
      console.log('便签创建成功:', newNote.id);
      return newNote;
    } catch (error) {
      console.error('创建便签失败:', error);
      errorHandler.handleError(error, { action: 'create_note' });
      throw error;
    }
  }, [user?.id, isAuthenticated]);
  
  // 更新便签
  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    try {
      dispatch({ type: 'NOTE_UPDATE', payload: { id, updates } });
      
      // 如果用户已认证，添加到同步队列
      if (isAuthenticated && user) {
        const updatedNote = state.notes.find(note => note.id === id);
        if (updatedNote) {
          const noteWithUpdates = { ...updatedNote, ...updates };
          noteSyncService.addToSyncQueue(noteWithUpdates);
        }
      }
      
      console.log('便签更新成功:', id);
    } catch (error) {
      console.error('更新便签失败:', error);
      errorHandler.handleError(error, { action: 'update_note' });
      throw error;
    }
  }, [isAuthenticated, user, state.notes]);
  
  // 删除便签（软删除）
  const deleteNote = useCallback((id: string) => {
    try {
      const noteToDelete = state.notes.find(note => note.id === id);
      
      dispatch({ 
        type: 'NOTE_UPDATE', 
        payload: { 
          id, 
          updates: { 
            isDeleted: true,
            syncStatus: SyncStatus.LOCAL_ONLY // 标记需要同步删除状态
          } 
        } 
      });
      
      // 如果用户已认证，同步删除操作
      if (isAuthenticated && user && noteToDelete) {
        const deletedNote = { ...noteToDelete, isDeleted: true, syncStatus: SyncStatus.LOCAL_ONLY };
        noteSyncService.addToSyncQueue(deletedNote);
      }
      
      console.log('便签删除成功:', id);
    } catch (error) {
      console.error('删除便签失败:', error);
      errorHandler.handleError(error, { action: 'delete_note' });
      throw error;
    }
  }, [isAuthenticated, user, state.notes]);
  
  // 彻底删除便签
  const permanentDeleteNote = useCallback((id: string) => {
    try {
      dispatch({ type: 'NOTE_DELETE', payload: id });
      console.log('便签永久删除成功:', id);
    } catch (error) {
      console.error('永久删除便签失败:', error);
      errorHandler.handleError(error, { action: 'permanent_delete_note' });
      throw error;
    }
  }, []);
  
  // 恢复删除的便签
  const restoreNote = useCallback((id: string) => {
    try {
      dispatch({ 
        type: 'NOTE_UPDATE', 
        payload: { 
          id, 
          updates: { 
            isDeleted: false,
            syncStatus: SyncStatus.LOCAL_ONLY
          } 
        } 
      });
      console.log('便签恢复成功:', id);
    } catch (error) {
      console.error('恢复便签失败:', error);
      errorHandler.handleError(error, { action: 'restore_note' });
      throw error;
    }
  }, []);
  
  // 更新过滤器
  const setFilter = useCallback((updates: Partial<NoteFilter>) => {
    dispatch({ type: 'FILTER_UPDATE', payload: updates });
  }, []);
  
  // 批量更新便签
  const batchUpdateNotes = useCallback((notes: Note[]) => {
    try {
      dispatch({ type: 'NOTES_BATCH_UPDATE', payload: notes });
      console.log('批量更新便签成功');
    } catch (error) {
      console.error('批量更新便签失败:', error);
      errorHandler.handleError(error, { action: 'batch_update_notes' });
      throw error;
    }
  }, []);
  
  // 重试迁移
  const retryMigration = useCallback(() => {
    if (!state.migrationStatus || !user) return;
    
    console.log('重试数据迁移...');
    startDataMigration(state.notes);
  }, [state.migrationStatus, user, state.notes, startDataMigration]);
  
  // 强制同步
  const forceSyncNotes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      throw new Error('用户未认证，无法同步');
    }
    
    try {
      console.log('[useNotes] 开始强制同步');
      
      // 获取需要同步的便签
      const notesToSync = state.notes.filter(note => 
        note.syncStatus === SyncStatus.LOCAL_ONLY && note.userId
      );
      
      if (notesToSync.length > 0) {
        noteSyncService.addBatchToSyncQueue(notesToSync);
        await noteSyncService.triggerSync();
      }
      
      // 从服务器获取最新数据
      const remoteNotes = await noteSyncService.fetchNotesFromServer();
      
      // 合并本地和远程数据
      const mergedNotes = this.mergeLocalAndRemoteNotes(state.notes, remoteNotes);
      dispatch({ type: 'NOTES_BATCH_UPDATE', payload: mergedNotes });
      
      console.log('[useNotes] 强制同步完成');
    } catch (error) {
      console.error('[useNotes] 强制同步失败:', error);
      errorHandler.handleError(error, { action: 'force_sync_notes' });
      throw error;
    }
  }, [isAuthenticated, user, state.notes]);
  
  // 合并本地和远程便签
  const mergeLocalAndRemoteNotes = useCallback((localNotes: Note[], remoteNotes: Note[]): Note[] => {
    const merged = [...localNotes];
    
    remoteNotes.forEach(remoteNote => {
      const localIndex = merged.findIndex(note => note.id === remoteNote.id);
      
      if (localIndex >= 0) {
        // 如果本地存在，比较版本决定保留哪个
        const localNote = merged[localIndex];
        
        if (!localNote.version || !remoteNote.version || remoteNote.version >= localNote.version) {
          merged[localIndex] = remoteNote;
        }
      } else {
        // 如果本地不存在，直接添加
        merged.push(remoteNote);
      }
    });
    
    return merged;
  }, []);
  
  // 清除迁移状态
  const clearMigration = useCallback(() => {
    dispatch({ type: 'MIGRATION_COMPLETE' });
    NotesStorageManager.clearMigrationStatus();
  }, []);
  
  // 计算派生状态
  const filteredNotes = NotesOperationManager.filterNotes(state.notes, state.filter);
  const allTags = NotesOperationManager.getAllTags(state.notes);
  const stats = NotesOperationManager.calculateStats(state.notes);
  
  return {
    // 状态
    notes: filteredNotes,
    allNotes: state.notes,
    loading: state.loading,
    error: state.error,
    allTags,
    filter: state.filter,
    stats,
    migrationStatus: state.migrationStatus,
    
    // 操作方法
    createNote,
    updateNote,
    deleteNote,
    permanentDeleteNote,
    restoreNote,
    setFilter,
    batchUpdateNotes,
    retryMigration,
    clearMigration,
    
    // 同步相关方法
    forceSyncNotes,
    startDataMigration,
  };
};

// 便签搜索Hook
export const useNoteSearch = (notes: Note[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  
  // 执行搜索
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = notes.filter(note => {
      const searchLower = term.toLowerCase();
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      ) && !note.isDeleted;
    });
    
    setSearchResults(results);
  }, [notes]);
  
  // 防抖搜索
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        performSearch(searchTerm);
        setIsSearching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchTerm, performSearch]);
  
  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    searchResults,
    hasResults: searchResults.length > 0,
    resultCount: searchResults.length,
  };
};

// 便签标签管理Hook
export const useNoteTags = (notes: Note[]) => {
  const [tagStats, setTagStats] = useState<Record<string, number>>({});
  
  // 计算标签统计
  useEffect(() => {
    const stats: Record<string, number> = {};
    const activeNotes = notes.filter(note => !note.isDeleted);
    
    activeNotes.forEach(note => {
      note.tags.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    
    setTagStats(stats);
  }, [notes]);
  
  const allTags = Object.keys(tagStats);
  const popularTags = allTags
    .sort((a, b) => tagStats[b] - tagStats[a])
    .slice(0, 10);
  
  const getTagUsageCount = useCallback((tag: string) => {
    return tagStats[tag] || 0;
  }, [tagStats]);
  
  const getRelatedTags = useCallback((tag: string) => {
    const relatedTags: Record<string, number> = {};
    const activeNotes = notes.filter(note => !note.isDeleted);
    
    activeNotes
      .filter(note => note.tags.includes(tag))
      .forEach(note => {
        note.tags
          .filter(t => t !== tag)
          .forEach(t => {
            relatedTags[t] = (relatedTags[t] || 0) + 1;
          });
      });
    
    return Object.entries(relatedTags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [notes]);
  
  return {
    allTags,
    popularTags,
    tagStats,
    getTagUsageCount,
    getRelatedTags,
  };
};