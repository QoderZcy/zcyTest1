import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Note, NewNote, NoteFilter, NoteStats } from '../types/note';

// localStorage 的键名
const STORAGE_KEY = 'notes-app-data';

// 从 localStorage 读取便签数据
const loadNotesFromStorage = (): Note[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const notes = JSON.parse(data);
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading notes from storage:', error);
    return [];
  }
};

// 保存便签数据到 localStorage
const saveNotesToStorage = (notes: Note[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes to storage:', error);
  }
};

// 便签管理的主要 hook
export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>(() => loadNotesFromStorage());
  const [filter, setFilter] = useState<NoteFilter>({
    searchTerm: '',
    selectedTags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // 每次 notes 变化时保存到 localStorage
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // 创建新便签
  const createNote = (newNote: NewNote): Note => {
    const note: Note = {
      id: uuidv4(),
      ...newNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setNotes(prev => [note, ...prev]);
    return note;
  };

  // 更新便签
  const updateNote = (id: string, updates: Partial<Note>): boolean => {
    setNotes(prev => {
      const index = prev.findIndex(note => note.id === id);
      if (index === -1) return prev;
      
      const updatedNote = {
        ...prev[index],
        ...updates,
        updatedAt: new Date(),
      };
      
      const newNotes = [...prev];
      newNotes[index] = updatedNote;
      return newNotes;
    });
    return true;
  };

  // 删除便签
  const deleteNote = (id: string): boolean => {
    setNotes(prev => prev.filter(note => note.id !== id));
    return true;
  };

  // 批量删除便签
  const deleteNotes = (ids: string[]): void => {
    setNotes(prev => prev.filter(note => !ids.includes(note.id)));
  };

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // 过滤和排序便签
  const filteredNotes = useMemo(() => {
    let filtered = notes;

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
  }, [notes, filter]);

  // 便签统计信息
  const stats: NoteStats = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    return {
      totalNotes: notes.length,
      recentNotes: notes.filter(note => note.createdAt > threeDaysAgo).length,
      totalTags: allTags.length,
    };
  }, [notes, allTags]);

  return {
    notes: filteredNotes,
    allNotes: notes,
    allTags,
    filter,
    stats,
    setFilter,
    createNote,
    updateNote,
    deleteNote,
    deleteNotes,
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