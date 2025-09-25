import { Note, SyncStatus, MigrationStatus, MigrationOptions } from '../types/note';
import { User } from '../types/auth';
import { httpClient } from '../utils/httpClient';
import { errorHandler } from './errorHandler';
import { noteSyncService } from './noteSyncService';
import { v4 as uuidv4 } from 'uuid';

/**
 * 数据迁移服务
 * 负责本地便签数据向云端的迁移管理
 */
export class DataMigrationService {
  private static instance: DataMigrationService;
  private migrationInProgress = false;
  private migrationCallbacks: Map<string, (status: MigrationStatus) => void> = new Map();
  
  private constructor() {}

  static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  /**
   * 检查是否需要数据迁移
   */
  checkMigrationNeeded(localNotes: Note[], user: User): boolean {
    if (!user || localNotes.length === 0) {
      return false;
    }
    
    // 检查是否有本地便签没有关联用户ID
    const unlinkedNotes = localNotes.filter(note => 
      !note.userId || note.syncStatus === SyncStatus.LOCAL_ONLY
    );
    
    console.log(`[DataMigrationService] 发现 ${unlinkedNotes.length} 条需要迁移的便签`);
    return unlinkedNotes.length > 0;
  }

  /**
   * 开始数据迁移流程
   */
  async startMigration(
    localNotes: Note[], 
    user: User, 
    options: MigrationOptions = {
      strategy: 'merge',
      conflictResolution: 'newer',
      backupLocal: true
    }
  ): Promise<MigrationStatus> {
    if (this.migrationInProgress) {
      throw new Error('迁移正在进行中，请等待完成');
    }

    console.log('[DataMigrationService] 开始数据迁移流程');
    
    this.migrationInProgress = true;
    
    // 需要迁移的便签
    const notesToMigrate = localNotes.filter(note => 
      !note.userId || note.syncStatus === SyncStatus.LOCAL_ONLY
    );
    
    const migrationStatus: MigrationStatus = {
      isInProgress: true,
      totalNotes: notesToMigrate.length,
      processedNotes: 0,
      errors: [],
      conflicts: []
    };
    
    try {
      // 备份本地数据
      if (options.backupLocal) {
        await this.createLocalBackup(localNotes);
      }
      
      // 获取云端已有数据
      const remoteNotes = await this.fetchRemoteNotes();
      
      // 分析冲突
      const conflicts = this.analyzeConflicts(notesToMigrate, remoteNotes);
      migrationStatus.conflicts = conflicts;
      
      this.notifyMigrationUpdate(migrationStatus);
      
      // 如果有冲突且需要手动解决
      if (conflicts.length > 0 && options.conflictResolution === 'manual') {
        migrationStatus.isInProgress = false;
        return migrationStatus;
      }
      
      // 执行迁移
      await this.performMigration(notesToMigrate, remoteNotes, options, migrationStatus);
      
      migrationStatus.isInProgress = false;
      console.log('[DataMigrationService] 数据迁移完成');
      
      this.notifyMigrationUpdate(migrationStatus);
      return migrationStatus;
      
    } catch (error) {
      console.error('[DataMigrationService] 数据迁移失败:', error);
      migrationStatus.errors.push(`迁移失败: ${error.message}`);
      migrationStatus.isInProgress = false;
      
      this.notifyMigrationUpdate(migrationStatus);
      errorHandler.handleError(error, { action: 'data_migration' });
      throw error;
    } finally {
      this.migrationInProgress = false;
    }
  }

  /**
   * 分析迁移冲突
   */
  private analyzeConflicts(localNotes: Note[], remoteNotes: Note[]): Note[] {
    const conflicts: Note[] = [];
    
    localNotes.forEach(localNote => {
      const remoteNote = remoteNotes.find(remote => 
        remote.title === localNote.title &&
        remote.content === localNote.content
      );
      
      if (remoteNote) {
        // 检查时间冲突
        const localTime = new Date(localNote.updatedAt).getTime();
        const remoteTime = new Date(remoteNote.updatedAt).getTime();
        
        if (Math.abs(localTime - remoteTime) > 60000) { // 超过1分钟差异认为是冲突
          conflicts.push(localNote);
        }
      }
    });
    
    console.log(`[DataMigrationService] 发现 ${conflicts.length} 个冲突`);
    return conflicts;
  }

  /**
   * 执行数据迁移
   */
  private async performMigration(
    localNotes: Note[],
    remoteNotes: Note[],
    options: MigrationOptions,
    migrationStatus: MigrationStatus
  ): Promise<void> {
    console.log(`[DataMigrationService] 开始迁移 ${localNotes.length} 条便签`);
    
    for (let i = 0; i < localNotes.length; i++) {
      const localNote = localNotes[i];
      
      try {
        await this.migrateNote(localNote, remoteNotes, options);
        
        migrationStatus.processedNotes++;
        this.notifyMigrationUpdate(migrationStatus);
        
        // 添加延迟避免请求过于频繁
        await this.delay(200);
        
      } catch (error) {
        console.error(`[DataMigrationService] 迁移便签 ${localNote.id} 失败:`, error);
        migrationStatus.errors.push(`便签 "${localNote.title}" 迁移失败: ${error.message}`);
        this.notifyMigrationUpdate(migrationStatus);
      }
    }
  }

  /**
   * 迁移单个便签
   */
  private async migrateNote(
    localNote: Note,
    remoteNotes: Note[],
    options: MigrationOptions
  ): Promise<void> {
    // 检查是否已经存在相似的远程便签
    const similarRemoteNote = this.findSimilarNote(localNote, remoteNotes);
    
    if (similarRemoteNote) {
      // 处理冲突
      await this.handleNoteConflict(localNote, similarRemoteNote, options);
    } else {
      // 直接创建新便签
      await this.createRemoteNote(localNote);
    }
  }

  /**
   * 查找相似的便签
   */
  private findSimilarNote(localNote: Note, remoteNotes: Note[]): Note | null {
    // 精确匹配
    let similar = remoteNotes.find(remote => 
      remote.title === localNote.title && 
      remote.content === localNote.content
    );
    
    if (similar) return similar;
    
    // 标题匹配
    similar = remoteNotes.find(remote => 
      remote.title === localNote.title && 
      remote.title.trim() !== ''
    );
    
    if (similar) return similar;
    
    // 内容相似度匹配（简化版）
    similar = remoteNotes.find(remote => {
      const similarity = this.calculateSimilarity(localNote.content, remote.content);
      return similarity > 0.8; // 80%以上相似度
    });
    
    return similar || null;
  }

  /**
   * 计算文本相似度（简化版）
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1;
    if (text1.length === 0 || text2.length === 0) return 0;
    
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 处理便签冲突
   */
  private async handleNoteConflict(
    localNote: Note,
    remoteNote: Note,
    options: MigrationOptions
  ): Promise<void> {
    console.log(`[DataMigrationService] 处理便签冲突: ${localNote.title}`);
    
    switch (options.conflictResolution) {
      case 'newer':
        const localTime = new Date(localNote.updatedAt).getTime();
        const remoteTime = new Date(remoteNote.updatedAt).getTime();
        
        if (localTime > remoteTime) {
          await this.updateRemoteNote(localNote, remoteNote.id);
        }
        // 如果远程更新，则保留远程版本，不做操作
        break;
        
      case 'older':
        const localTimeOld = new Date(localNote.updatedAt).getTime();
        const remoteTimeOld = new Date(remoteNote.updatedAt).getTime();
        
        if (localTimeOld < remoteTimeOld) {
          await this.updateRemoteNote(localNote, remoteNote.id);
        }
        break;
        
      default:
        // 手动解决冲突的情况在上层处理
        break;
    }
  }

  /**
   * 创建远程便签
   */
  private async createRemoteNote(localNote: Note): Promise<void> {
    try {
      const response = await httpClient.post('/notes', {
        title: localNote.title,
        content: localNote.content,
        color: localNote.color,
        tags: localNote.tags,
        createdAt: localNote.createdAt,
        updatedAt: localNote.updatedAt,
      });
      
      console.log(`[DataMigrationService] 便签 ${localNote.title} 创建成功`);
      
      // 更新本地便签状态
      localNote.syncStatus = SyncStatus.SYNCED;
      localNote.lastSyncAt = new Date();
      
    } catch (error) {
      console.error(`[DataMigrationService] 创建远程便签失败:`, error);
      throw error;
    }
  }

  /**
   * 更新远程便签
   */
  private async updateRemoteNote(localNote: Note, remoteNoteId: string): Promise<void> {
    try {
      await httpClient.put(`/notes/${remoteNoteId}`, {
        title: localNote.title,
        content: localNote.content,
        color: localNote.color,
        tags: localNote.tags,
        updatedAt: localNote.updatedAt,
      });
      
      console.log(`[DataMigrationService] 便签 ${localNote.title} 更新成功`);
      
      // 更新本地便签状态
      localNote.syncStatus = SyncStatus.SYNCED;
      localNote.lastSyncAt = new Date();
      
    } catch (error) {
      console.error(`[DataMigrationService] 更新远程便签失败:`, error);
      throw error;
    }
  }

  /**
   * 获取远程便签
   */
  private async fetchRemoteNotes(): Promise<Note[]> {
    try {
      return await noteSyncService.fetchNotesFromServer();
    } catch (error) {
      console.error('[DataMigrationService] 获取远程便签失败:', error);
      // 如果获取失败，返回空数组，继续迁移流程
      return [];
    }
  }

  /**
   * 创建本地备份
   */
  private async createLocalBackup(notes: Note[]): Promise<void> {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        notes: notes,
      };
      
      const backupData = JSON.stringify(backup, null, 2);
      const backupKey = `notes_backup_${Date.now()}`;
      
      localStorage.setItem(backupKey, backupData);
      
      // 保存备份索引
      const backupIndex = this.getBackupIndex();
      backupIndex.push({
        key: backupKey,
        timestamp: backup.timestamp,
        notesCount: notes.length,
      });
      
      this.saveBackupIndex(backupIndex);
      
      console.log(`[DataMigrationService] 本地备份创建成功: ${backupKey}`);
      
    } catch (error) {
      console.error('[DataMigrationService] 创建本地备份失败:', error);
      throw error;
    }
  }

  /**
   * 获取备份索引
   */
  private getBackupIndex(): any[] {
    try {
      const stored = localStorage.getItem('notes_backup_index');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[DataMigrationService] 获取备份索引失败:', error);
      return [];
    }
  }

  /**
   * 保存备份索引
   */
  private saveBackupIndex(index: any[]): void {
    try {
      // 只保留最近10个备份的索引
      const recentIndex = index.slice(-10);
      localStorage.setItem('notes_backup_index', JSON.stringify(recentIndex));
    } catch (error) {
      console.error('[DataMigrationService] 保存备份索引失败:', error);
    }
  }

  /**
   * 手动解决冲突
   */
  async resolveConflict(
    conflictNoteId: string,
    resolution: 'keep_local' | 'keep_remote' | 'merge',
    mergedData?: Partial<Note>
  ): Promise<void> {
    console.log(`[DataMigrationService] 手动解决冲突: ${conflictNoteId}, 策略: ${resolution}`);
    
    // 这里需要根据具体的冲突解决策略来实现
    // 可以与NoteSyncService配合来处理冲突
    
    try {
      await noteSyncService.resolveConflict(conflictNoteId, resolution, mergedData);
      console.log(`[DataMigrationService] 冲突解决成功: ${conflictNoteId}`);
    } catch (error) {
      console.error(`[DataMigrationService] 冲突解决失败:`, error);
      throw error;
    }
  }

  /**
   * 获取迁移历史
   */
  getMigrationHistory(): any[] {
    try {
      const history = localStorage.getItem('migration_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('[DataMigrationService] 获取迁移历史失败:', error);
      return [];
    }
  }

  /**
   * 保存迁移记录
   */
  private saveMigrationRecord(status: MigrationStatus): void {
    try {
      const history = this.getMigrationHistory();
      const record = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        totalNotes: status.totalNotes,
        processedNotes: status.processedNotes,
        errors: status.errors,
        conflicts: status.conflicts.length,
        success: status.errors.length === 0,
      };
      
      history.push(record);
      
      // 只保留最近20条记录
      const recentHistory = history.slice(-20);
      localStorage.setItem('migration_history', JSON.stringify(recentHistory));
      
    } catch (error) {
      console.error('[DataMigrationService] 保存迁移记录失败:', error);
    }
  }

  /**
   * 注册迁移状态监听器
   */
  onMigrationUpdate(callback: (status: MigrationStatus) => void): string {
    const id = uuidv4();
    this.migrationCallbacks.set(id, callback);
    return id;
  }

  /**
   * 取消迁移状态监听器
   */
  offMigrationUpdate(id: string): void {
    this.migrationCallbacks.delete(id);
  }

  /**
   * 通知迁移状态更新
   */
  private notifyMigrationUpdate(status: MigrationStatus): void {
    this.migrationCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[DataMigrationService] 迁移状态回调执行失败:', error);
      }
    });
    
    // 保存迁移记录
    if (!status.isInProgress) {
      this.saveMigrationRecord(status);
    }
  }

  /**
   * 取消正在进行的迁移
   */
  cancelMigration(): void {
    if (this.migrationInProgress) {
      console.log('[DataMigrationService] 取消数据迁移');
      this.migrationInProgress = false;
      
      const cancelStatus: MigrationStatus = {
        isInProgress: false,
        totalNotes: 0,
        processedNotes: 0,
        errors: ['迁移已取消'],
        conflicts: [],
      };
      
      this.notifyMigrationUpdate(cancelStatus);
    }
  }

  /**
   * 获取迁移状态
   */
  getMigrationStatus(): { inProgress: boolean } {
    return {
      inProgress: this.migrationInProgress,
    };
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const dataMigrationService = DataMigrationService.getInstance();