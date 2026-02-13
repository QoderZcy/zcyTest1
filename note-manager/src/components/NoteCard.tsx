import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, Tag, Calendar, MoreVertical, Copy, Share, Pin, Archive, Eye } from 'lucide-react';
import type { Note, SyncStatus } from '../types/note';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onClick?: (note: Note) => void;
  onCopy?: (note: Note) => void;
  onShare?: (note: Note) => void;
  onPin?: (id: string) => void;
  onArchive?: (id: string) => void;
  selectedNoteIds?: string[];
  onSelect?: (id: string, selected: boolean) => void;
  compact?: boolean;
  showSyncStatus?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onClick,
  onCopy,
  onShare,
  onPin,
  onArchive,
  selectedNoteIds = [],
  onSelect,
  compact = false,
  showSyncStatus = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 检查是否被选中
  useEffect(() => {
    setIsSelected(selectedNoteIds.includes(note.id));
  }, [selectedNoteIds, note.id]);
  
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // 日期格式化
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 0 ? '刚刚' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
  };
  
  // 获取同步状态信息
  const getSyncStatusInfo = () => {
    switch (note.syncStatus) {
      case SyncStatus.SYNCED:
        return { text: '已同步', className: 'synced', icon: '✓' };
      case SyncStatus.SYNCING:
        return { text: '同步中', className: 'syncing', icon: '⟳' };
      case SyncStatus.LOCAL_ONLY:
        return { text: '本地', className: 'local-only', icon: '○' };
      case SyncStatus.CONFLICT:
        return { text: '冲突', className: 'conflict', icon: '⚠' };
      case SyncStatus.ERROR:
        return { text: '错误', className: 'error', icon: '✗' };
      default:
        return { text: '未知', className: 'unknown', icon: '?' };
    }
  };
  
  const syncInfo = getSyncStatusInfo();

  // 事件处理函数
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm('确定要删除这条便签吗？')) {
      onDelete(note.id);
    }
  };
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onCopy) {
      onCopy(note);
    } else {
      // 默认复制功能
      const content = `${note.title}\n\n${note.content}`;
      navigator.clipboard.writeText(content).then(() => {
        console.log('便签内容已复制到剪贴板');
      });
    }
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onShare) {
      onShare(note);
    }
  };
  
  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onPin) {
      onPin(note.id);
    }
  };
  
  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onArchive) {
      onArchive(note.id);
    }
  };
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(note.id, !isSelected);
    }
  };
  
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(note);
    }
  };
  
  // 获取便签预览文本
  const getPreviewText = () => {
    const maxLength = compact ? 80 : 150;
    return note.content.length > maxLength 
      ? `${note.content.substring(0, maxLength)}...` 
      : note.content;
  };

  return (
    <div
      ref={cardRef}
      className={`note-card ${
        isHovered ? 'hovered' : ''
      } ${
        isSelected ? 'selected' : ''
      } ${
        compact ? 'compact' : ''
      }`}
      style={{ backgroundColor: note.color }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* 选择框 */}
      {onSelect && (
        <div className="note-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {/* 便签头部 */}
      <div className="note-header">
        <h3 className="note-title" title={note.title}>
          {note.title || '无标题'}
        </h3>
        
        <div className={`note-actions ${isHovered || showMenu ? 'visible' : ''}`}>
          {/* 快速操作按钮 */}
          <button
            onClick={handleEdit}
            className="action-btn edit-btn"
            title="编辑"
          >
            <Edit size={16} />
          </button>
          
          {/* 更多操作菜单 */}
          <div className="more-actions" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className="action-btn more-btn"
              title="更多操作"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="action-menu">
                <button onClick={handleCopy} className="menu-item">
                  <Copy size={16} />
                  复制
                </button>
                
                {onShare && (
                  <button onClick={handleShare} className="menu-item">
                    <Share size={16} />
                    分享
                  </button>
                )}
                
                {onPin && (
                  <button onClick={handlePin} className="menu-item">
                    <Pin size={16} />
                    置顶
                  </button>
                )}
                
                {onArchive && (
                  <button onClick={handleArchive} className="menu-item">
                    <Archive size={16} />
                    归档
                  </button>
                )}
                
                <div className="menu-divider" />
                
                <button onClick={handleDelete} className="menu-item delete">
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 便签内容 */}
      <div className="note-content">
        <p className="note-text">{getPreviewText()}</p>
        
        {note.content.length > (compact ? 80 : 150) && (
          <button className="read-more-btn" onClick={handleCardClick}>
            <Eye size={14} />
            查看全部
          </button>
        )}
      </div>
      
      {/* 标签区域 */}
      {note.tags.length > 0 && (
        <div className="note-tags">
          <Tag size={12} className="tag-icon" />
          <div className="tags-container">
            {note.tags.slice(0, compact ? 2 : 3).map(tag => (
              <span key={tag} className="tag-chip" title={tag}>
                {tag}
              </span>
            ))}
            {note.tags.length > (compact ? 2 : 3) && (
              <span className="tag-more" title={note.tags.slice(compact ? 2 : 3).join(', ')}>
                +{note.tags.length - (compact ? 2 : 3)}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* 便签底部 */}
      <div className="note-footer">
        <div className="note-date" title={`创建于: ${formatDate(note.createdAt)}`}>
          <Calendar size={12} />
          <span>{formatDate(note.updatedAt)}</span>
        </div>
        
        {/* 同步状态 */}
        {showSyncStatus && note.syncStatus && (
          <div className={`sync-status ${syncInfo.className}`} title={syncInfo.text}>
            <span className="sync-icon">{syncInfo.icon}</span>
            {!compact && <span className="sync-text">{syncInfo.text}</span>}
          </div>
        )}
      </div>
      
      {/* 加载指示器 */}
      {note.syncStatus === SyncStatus.SYNCING && (
        <div className="sync-loading-indicator">
          <div className="sync-spinner"></div>
        </div>
      )}
    </div>
  );
};