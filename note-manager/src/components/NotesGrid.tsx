import React from 'react';
import { NoteCard } from './NoteCard';
import type { Note } from '../types/note';

interface NotesGridProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onNoteClick?: (note: Note) => void;
}

export const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
  onNoteClick,
}) => {
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