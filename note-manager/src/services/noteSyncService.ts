import { Note, SyncStatus, SyncConflict } from '../types/note';
import { httpClient } from '../utils/httpClient';
import { errorHandler } from './errorHandler';

/**
 * 便签同步服务
 * 负责本地便签与云端的同步管理
 */
export class NoteSyncService {
  private static instance: NoteSyncService;
  private syncQueue: Note[] = [];
  private issyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  
  // 同步配置
  private readonly config = {
    autoSync: true,
    syncInterval: 30000, // 30秒
    batchSize: 10,
    retryAttempts: 3,
    retryDelay: 2000,
  };

  private constructor() {}

  static getInstance(): NoteSyncService {
    if (!NoteSyncService.instance) {
      NoteSyncService.instance = new NoteSyncService();
    }
    return NoteSyncService.instance;
  }

  /**
   * 初始化同步服务
   */
  init(): void {
    console.log('[NoteSyncService] 初始化便签同步服务');
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * 销毁同步服务
   */
  destroy(): void {
    console.log('[NoteSyncService] 销毁便签同步服务');
    this.stopAutoSync();
    this.syncQueue = [];
  }

  /**
   * 开始自动同步
   */
  private startAutoSync(): void {
    this.stopAutoSync();
    
    this.syncTimer = setInterval(() => {
      if (!this.issyncing && this.syncQueue.length > 0) {
        this.performSync().catch(error => {
          console.error('[NoteSyncService] 自动同步失败:', error);
        });
      }
    }, this.config.syncInterval);
    
    console.log(`[NoteSyncService] 自动同步已启动，间隔: ${this.config.syncInterval}ms`);
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 添加便签到同步队列
   */
  addToSyncQueue(note: Note): void {
    // 检查是否已经在队列中
    const existingIndex = this.syncQueue.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      // 替换现有的便签
      this.syncQueue[existingIndex] = note;
    } else {
      // 添加新便签到队列
      this.syncQueue.push(note);
    }
    
    console.log(`[NoteSyncService] 便签 ${note.id} 已添加到同步队列`);
    
    // 如果启用自动同步且当前没有在同步，立即同步
    if (this.config.autoSync && !this.issyncing) {
      setTimeout(() => this.performSync(), 1000);
    }
  }

  /**
   * 批量添加便签到同步队列
   */
  addBatchToSyncQueue(notes: Note[]): void {
    notes.forEach(note => this.addToSyncQueue(note));
  }

  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<void> {
    if (this.issyncing) {
      console.log('[NoteSyncService] 同步正在进行中，忽略手动触发');
      return;
    }
    
    await this.performSync();
  }

  /**
   * 执行同步
   */
  private async performSync(): Promise<void> {
    if (this.issyncing || this.syncQueue.length === 0) {
      return;
    }

    this.issyncing = true;
    console.log(`[NoteSyncService] 开始同步 ${this.syncQueue.length} 个便签`);

    try {
      // 分批处理同步队列
      while (this.syncQueue.length > 0) {
        const batch = this.syncQueue.splice(0, this.config.batchSize);
        await this.syncBatch(batch);
      }
      
      console.log('[NoteSyncService] 同步完成');
    } catch (error) {
      console.error('[NoteSyncService] 同步失败:', error);
      errorHandler.handleError(error, { action: 'sync_notes' });
    } finally {
      this.issyncing = false;
    }
  }

  /**
   * 同步一批便签
   */
  private async syncBatch(notes: Note[]): Promise<void> {
    for (const note of notes) {
      await this.syncSingleNote(note);
    }
  }

  /**
   * 同步单个便签
   */
  private async syncSingleNote(note: Note): Promise<void> {
    let retryCount = 0;
    
    while (retryCount < this.config.retryAttempts) {
      try {
        if (note.isDeleted) {
          await this.deleteNoteOnServer(note);
        } else if (note.syncStatus === SyncStatus.LOCAL_ONLY) {
          await this.createNoteOnServer(note);
        } else {
          await this.updateNoteOnServer(note);
        }
        
        console.log(`[NoteSyncService] 便签 ${note.id} 同步成功`);
        return;
      } catch (error) {
        retryCount++;
        console.error(`[NoteSyncService] 便签 ${note.id} 同步失败 (${retryCount}/${this.config.retryAttempts}):`, error);
        
        if (retryCount < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * retryCount);
        } else {
          // 最终失败，将便签重新加入队列或标记为错误
          this.handleSyncFailure(note, error);
        }
      }
    }
  }

  /**
   * 在服务器上创建便签
   */
  private async createNoteOnServer(note: Note): Promise<void> {
    const response = await httpClient.post('/notes', {
      title: note.title,
      content: note.content,
      color: note.color,
      tags: note.tags,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
    
    const serverNote = response.data;
    
    // 更新本地便签的同步状态
    note.syncStatus = SyncStatus.SYNCED;
    note.lastSyncAt = new Date();
    
    // 如果服务器返回了不同的ID，需要处理
    if (serverNote.id !== note.id) {
      console.warn(`[NoteSyncService] 服务器返回了不同的便签ID: ${note.id} -> ${serverNote.id}`);
    }
  }

  /**
   * 在服务器上更新便签
   */
  private async updateNoteOnServer(note: Note): Promise<void> {
    try {
      const response = await httpClient.put(`/notes/${note.id}`, {
        title: note.title,
        content: note.content,
        color: note.color,
        tags: note.tags,
        updatedAt: note.updatedAt,
        version: note.version,
      });
      
      const serverNote = response.data;
      
      // 检查是否有冲突
      if (serverNote.version && note.version && serverNote.version > note.version) {
        console.warn(`[NoteSyncService] 检测到便签 ${note.id} 版本冲突`);
        await this.handleVersionConflict(note, serverNote);
        return;
      }
      
      // 更新同步状态
      note.syncStatus = SyncStatus.SYNCED;
      note.lastSyncAt = new Date();
      note.version = serverNote.version;
    } catch (error) {
      if (error.status === 409) {
        // 冲突错误
        console.warn(`[NoteSyncService] 便签 ${note.id} 发生冲突`);
        await this.handleSyncConflict(note, error.response.data);
      } else {
        throw error;
      }
    }
  }

  /**
   * 在服务器上删除便签
   */
  private async deleteNoteOnServer(note: Note): Promise<void> {
    await httpClient.delete(`/notes/${note.id}`);
    
    // 更新同步状态（已删除的便签保持删除状态）
    note.syncStatus = SyncStatus.SYNCED;
    note.lastSyncAt = new Date();
  }

  /**
   * 处理版本冲突
   */
  private async handleVersionConflict(localNote: Note, serverNote: Note): Promise<void> {
    console.log(`[NoteSyncService] 处理便签 ${localNote.id} 的版本冲突`);
    
    // 标记为冲突状态
    localNote.syncStatus = SyncStatus.CONFLICT;
    
    // 创建冲突记录
    const conflict: SyncConflict = {
      noteId: localNote.id,
      localNote: { ...localNote },
      remoteNote: serverNote,
      conflictType: 'content',
      timestamp: new Date(),
    };
    
    // 触发冲突解决事件
    window.dispatchEvent(new CustomEvent('note-sync-conflict', { 
      detail: conflict 
    }));
  }

  /**
   * 处理同步冲突
   */
  private async handleSyncConflict(note: Note, conflictData: any): Promise<void> {
    console.log(`[NoteSyncService] 处理便签 ${note.id} 的同步冲突`);
    
    note.syncStatus = SyncStatus.CONFLICT;
    
    const conflict: SyncConflict = {
      noteId: note.id,
      localNote: { ...note },
      remoteNote: conflictData.remoteNote,
      conflictType: conflictData.conflictType || 'content',
      timestamp: new Date(),
    };
    
    window.dispatchEvent(new CustomEvent('note-sync-conflict', { 
      detail: conflict 
    }));
  }

  /**
   * 处理同步失败
   */
  private handleSyncFailure(note: Note, error: any): void {
    console.error(`[NoteSyncService] 便签 ${note.id} 同步彻底失败:`, error);
    
    // 标记为同步错误
    note.syncStatus = SyncStatus.ERROR;
    
    // 可以将失败的便签保存到本地，稍后重试
    this.saveFailedNote(note, error);
    
    // 触发同步失败事件
    window.dispatchEvent(new CustomEvent('note-sync-failed', { 
      detail: { note, error } 
    }));
  }

  /**
   * 保存失败的便签
   */
  private saveFailedNote(note: Note, error: any): void {
    try {
      const failedNotes = this.getFailedNotes();
      failedNotes.push({
        note,
        error: {
          message: error.message,
          timestamp: new Date(),
        },
      });
      
      localStorage.setItem('failed_sync_notes', JSON.stringify(failedNotes));
    } catch (err) {
      console.error('[NoteSyncService] 保存失败便签时出错:', err);
    }
  }

  /**
   * 获取失败的便签
   */
  private getFailedNotes(): any[] {
    try {
      const stored = localStorage.getItem('failed_sync_notes');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[NoteSyncService] 获取失败便签时出错:', error);
      return [];
    }
  }

  /**
   * 从服务器获取便签
   */
  async fetchNotesFromServer(): Promise<Note[]> {
    try {
      console.log('[NoteSyncService] 从服务器获取便签');
      
      const response = await httpClient.get('/notes');
      const serverNotes = response.data;
      
      return serverNotes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        lastSyncAt: new Date(note.lastSyncAt || note.updatedAt),
        syncStatus: SyncStatus.SYNCED,
      }));
    } catch (error) {
      console.error('[NoteSyncService] 从服务器获取便签失败:', error);
      errorHandler.handleError(error, { action: 'fetch_notes_from_server' });
      throw error;
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflictId: string, 
    resolution: 'local' | 'remote' | 'merge', 
    mergedNote?: Partial<Note>
  ): Promise<void> {
    console.log(`[NoteSyncService] 解决冲突 ${conflictId}，策略: ${resolution}`);
    
    // 根据解决策略处理冲突
    // 这里需要具体实现冲突解决逻辑
    
    // 触发冲突解决完成事件
    window.dispatchEvent(new CustomEvent('note-conflict-resolved', { 
      detail: { conflictId, resolution } 
    }));
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      issyncing: this.issyncing,
      queueLength: this.syncQueue.length,
      autoSync: this.config.autoSync,
      lastSyncTime: new Date(), // 可以存储实际的最后同步时间
    };
  }

  /**
   * 更新同步配置
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
    console.log('[NoteSyncService] 同步配置已更新:', this.config);
    
    if (this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const noteSyncService = NoteSyncService.getInstance();