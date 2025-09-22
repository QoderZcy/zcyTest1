import React, { useState } from 'react';
import { Edit, Trash2, Tag, Calendar } from 'lucide-react';
import type { Note } from '../types/note';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onClick?: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条便签吗？')) {
      onDelete(note.id);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(note);
    }
  };

  return (
    <div
      className={`note-card ${isHovered ? 'hovered' : ''}`}
      style={{ backgroundColor: note.color }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="note-header">
        <h3 className="note-title">{note.title || '无标题'}</h3>
        <div className={`note-actions ${isHovered ? 'visible' : ''}`}>
          <button
            onClick={handleEdit}
            className="action-btn edit-btn"
            title="编辑"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="action-btn delete-btn"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="note-content">
        {note.content.length > 150 
          ? `${note.content.substring(0, 150)}...` 
          : note.content}
      </div>
      
      {note.tags.length > 0 && (
        <div className="note-tags">
          <Tag size={12} />
          <span className="tags-text">
            {note.tags.slice(0, 3).join(', ')}
            {note.tags.length > 3 && ` +${note.tags.length - 3}`}
          </span>
        </div>
      )}
      
      <div className="note-footer">
        <div className="note-date">
          <Calendar size={12} />
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};