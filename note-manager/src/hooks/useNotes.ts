import{ useState, useEffect }from 'react';
import { Note, NewNote, NoteFilter, NoteStats, MigrationStatus } from '../types/note';

// 模拟的便签数据
const mockNotes: Note[] = [
  {
    id: '1',
    title: '欢迎使用便签管理系统',
    content: '这是您的第一条便签！您可以创建、编辑和删除便签，使用标签来组织它们。',
    color: '#FFE5B4',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['欢迎', '教程'],
    userId: 'user-1',
  },
];

// 默认过滤器
const defaultFilter: NoteFilter = {
  searchTerm: '',
  selectedTags: [],
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

// useNotes 钩子
export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
 const [filter, setFilter] = useState<NoteFilter>(defaultFilter);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);

  // 计算统计信息
  const stats: NoteStats = {
    totalNotes: notes.length,
    recentNotes: notes.filter(note => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return new Date(note.updatedAt) > oneDayAgo;
    }).length,
    totalTags: Array.from(new Set(notes.flatMap(note => note.tags))).length,
syncedNotes: notes.filter(note => note.syncStatus === 'SYNCED').length,
    localOnlyNotes: notes.filter(note => note.syncStatus === 'LOCAL_ONLY').length,
    conflictNotes: notes.filter(note => note.syncStatus === 'CONFLICT').length,
  };

  // 获取所有标签
  constallTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  // 过滤便签
  const filteredNotes = notes.filter(note => {
    const matchesSearch = filter.searchTerm === '' || 
      note.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(filter.searchTerm.toLowerCase());
    
    const matchesTags = filter.selectedTags.length === 0 ||
      filter.selectedTags.some(tag => note.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  }).sort((a, b) => {
    const aValue = a[filter.sortBy];
    const bValue = b[filter.sortBy];
    
    if (filter.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
 });

  // 创建便签
  const createNote = (noteData: NewNote) => {
    const newNote: Note = {
      id: Date.now().toString(),
      ...noteData,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'LOCAL_ONLY',
    };
    
setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  // 更新便签
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note,...updates, updatedAt: new Date() }
        : note
    ));
  };

  // 删除便签
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  // 清除迁移状态
  const clearMigration = ()=> {
    setMigrationStatus(null);
  };

  // 重试迁移
  const retryMigration = () => {
    // 实现重试逻辑
    console.log('Retrying migration...');
  };

  return {
    notes: filteredNotes,
    allTags,
    filter,
    stats,
    migrationStatus,
    setFilter,
    createNote,
    updateNote,
    deleteNote,
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
      const timer = setTimeout(()=> {
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