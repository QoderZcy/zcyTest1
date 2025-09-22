import React from 'react';
import { FileText, Clock, Tag } from 'lucide-react';
import type { NoteStats } from '../types/note';

interface StatsPanelProps {
  stats: NoteStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="stats-panel">
      <div className="stat-item">
        <div className="stat-icon">
          <FileText size={20} />
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalNotes}</div>
          <div className="stat-label">总便签</div>
        </div>
      </div>
      
      <div className="stat-item">
        <div className="stat-icon">
          <Clock size={20} />
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.recentNotes}</div>
          <div className="stat-label">最近3天</div>
        </div>
      </div>
      
      <div className="stat-item">
        <div className="stat-icon">
          <Tag size={20} />
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalTags}</div>
          <div className="stat-label">标签数</div>
        </div>
      </div>
    </div>
  );
};