import React, { useState, useEffect, useMemo } from 'react';
import { NoteCard } from './NoteCard';
import { Grid, List, Check, X, Archive, Trash2, Download, Upload } from 'lucide-react';
import type { Note } from '../types/note';

interface NotesGridProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onNoteClick?: (note: Note) => void;
  onBatchDelete?: (ids: string[]) => void;
  onBatchArchive?: (ids: string[]) => void;
  onExport?: (notes: Note[]) => void;
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  enableSelection?: boolean;
  compactMode?: boolean;
}

export const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
  onNoteClick,
  onBatchDelete,
  onBatchArchive,
  onExport,
  loading = false,
  viewMode = 'grid',
  onViewModeChange,
  enableSelection = false,
  compactMode = false,
}) => {
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  // 清除选中状态当便签列表变化时
  useEffect(() => {
    setSelectedNoteIds(prev => prev.filter(id => notes.some(note => note.id === id)));
  }, [notes]);
  
  // 显示批量操作栏当有选中项时
  useEffect(() => {
    setShowBatchActions(selectedNoteIds.length > 0);
  }, [selectedNoteIds]);
  
  // 选中状态管理
  const handleSelectNote = (id: string, selected: boolean) => {
    setSelectedNoteIds(prev => {
      if (selected) {
        return [...prev, id];
      } else {
        return prev.filter(noteId => noteId !== id);
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedNoteIds.length === notes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(notes.map(note => note.id));
    }
  };
  
  const handleClearSelection = () => {
    setSelectedNoteIds([]);
  };
  
  // 批量操作
  const handleBatchDelete = () => {
    if (selectedNoteIds.length === 0) return;
    
    const confirmMessage = `确定要删除这 ${selectedNoteIds.length} 条便签吗？`;
    if (window.confirm(confirmMessage)) {
      if (onBatchDelete) {
        onBatchDelete(selectedNoteIds);
      } else {
        // 逐个删除
        selectedNoteIds.forEach(id => onDeleteNote(id));
      }
      setSelectedNoteIds([]);
    }
  };
  
  const handleBatchArchive = () => {
    if (selectedNoteIds.length === 0 || !onBatchArchive) return;
    
    onBatchArchive(selectedNoteIds);
    setSelectedNoteIds([]);
  };
  
  const handleExportSelected = () => {
    if (selectedNoteIds.length === 0 || !onExport) return;
    
    const selectedNotes = notes.filter(note => selectedNoteIds.includes(note.id));
    onExport(selectedNotes);
  };
  
  // 计算统计信息
  const stats = useMemo(() => {
    const total = notes.length;
    const selected = selectedNoteIds.length;
    const isAllSelected = selected === total && total > 0;
    const isPartialSelected = selected > 0 && selected < total;
    
    return {
      total,
      selected,
      isAllSelected,
      isPartialSelected,
    };
  }, [notes.length, selectedNoteIds.length]);
  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h3>还没有便签</h3>
        <p>点击"新建便签"按钮创建你的第一条便签吧！</p>
      </div>
    );
  }

  return (
    <div className="notes-grid">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
          onClick={onNoteClick}
        />
      ))}
    </div>
  );
};