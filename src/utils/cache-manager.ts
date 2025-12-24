/**
 * 缓存管理器
 * 使用 IndexedDB 存储文件和音频，localStorage 存储元数据
 */

import { generateFileHash, generateScriptHash, generateFlowItemCacheKey, generateAudioCacheKey } from './file-utils';
import type { FlowItem } from '../components/SupplyDepotApp';
import type { KnowledgeCard } from '../components/SupplyDepotApp';

const DB_NAME = 'deepflow_cache';
const DB_VERSION = 1;
const CACHE_EXPIRY_DAYS = 30;
const MAX_CACHE_SIZE_MB = 500;

interface CachedFile {
  key: string;
  file: Blob;
  metadata: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  cachedAt: number;
}

interface CachedAudio {
  key: string;
  audioBlob: Blob;
  metadata: {
    duration?: number;
    scriptHash: string;
    preset: string;
    contentType: string;
  };
  cachedAt: number;
}

interface FlowItemCacheEntry {
  flowItem: FlowItem;
  cachedAt: number;
}

/**
 * 缓存管理器类
 */
export class CacheManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * 初始化 IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建文件存储
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'key' });
          fileStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // 创建音频存储
        if (!db.objectStoreNames.contains('audio')) {
          const audioStore = db.createObjectStore('audio', { keyPath: 'key' });
          audioStore.createIndex('cachedAt', 'cachedAt', { unique: false });
          audioStore.createIndex('scriptHash', 'metadata.scriptHash', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<IDBDatabase> {
    return await this.initDB();
  }

  // ==================== 文件缓存 ====================

  /**
   * 缓存文件
   */
  async cacheFile(file: File): Promise<string> {
    const fileHash = await generateFileHash(file);
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');

      const cachedFile: CachedFile = {
        key: fileHash,
        file: file,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        },
        cachedAt: Date.now()
      };

      const request = store.put(cachedFile);

      request.onsuccess = () => {
        console.log(`[Cache] 文件已缓存: ${file.name} (${fileHash})`);
        resolve(fileHash);
      };

      request.onerror = () => {
        console.error('[Cache] 文件缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取缓存的文件
   */
  async getCachedFile(fileHash: string): Promise<File | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(fileHash);

      request.onsuccess = () => {
        const result = request.result as CachedFile | undefined;
        if (result) {
          // 将 Blob 转换回 File
          const file = new File([result.file], result.metadata.name, {
            type: result.metadata.type,
            lastModified: result.metadata.lastModified
          });
          resolve(file);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 检查文件是否已缓存
   */
  async isFileCached(file: File): Promise<boolean> {
    const fileHash = await generateFileHash(file);
    const cached = await this.getCachedFile(fileHash);
    return cached !== null;
  }

  // ==================== FlowItem 缓存 ====================

  /**
   * 缓存 FlowItem（包含 script、knowledgeCards、tldr 等所有字段）
   */
  cacheFlowItem(fileHash: string, preset: string, flowItem: FlowItem): void {
    try {
      const cacheKey = generateFlowItemCacheKey(fileHash, preset);
      const cacheEntry: FlowItemCacheEntry = {
        flowItem: flowItem,
        cachedAt: Date.now()
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      console.log(`[Cache] FlowItem 已缓存: ${cacheKey}`);
    } catch (error) {
      console.error('[Cache] FlowItem 缓存失败:', error);
      // localStorage 可能已满，尝试清理旧缓存
      this.clearExpiredFlowItems();
    }
  }

  /**
   * 获取缓存的 FlowItem
   */
  getCachedFlowItem(fileHash: string, preset: string): FlowItem | null {
    try {
      const cacheKey = generateFlowItemCacheKey(fileHash, preset);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const entry: FlowItemCacheEntry = JSON.parse(cached);
        // 检查是否过期
        const age = Date.now() - entry.cachedAt;
        const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        if (age > maxAge) {
          localStorage.removeItem(cacheKey);
          return null;
        }
        console.log(`[Cache] 使用缓存的 FlowItem: ${cacheKey}`);
        return entry.flowItem;
      }

      return null;
    } catch (error) {
      console.error('[Cache] 读取 FlowItem 缓存失败:', error);
      return null;
    }
  }

  /**
   * 清理过期的 FlowItem 缓存
   */
  private clearExpiredFlowItems(): void {
    try {
      const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const now = Date.now();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('flowitem_')) {
          try {
            const entry: FlowItemCacheEntry = JSON.parse(localStorage.getItem(key) || '{}');
            if (now - entry.cachedAt > maxAge) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // 无效的缓存项，删除
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('[Cache] 清理过期 FlowItem 失败:', error);
    }
  }

  // ==================== 音频缓存 ====================

  /**
   * 缓存音频
   */
  async cacheAudio(scriptHash: string, preset: string, audioBlob: Blob, metadata: { duration?: number; contentType?: string }): Promise<string> {
    const cacheKey = generateAudioCacheKey(scriptHash, preset);
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['audio'], 'readwrite');
      const store = transaction.objectStore('audio');

      const cachedAudio: CachedAudio = {
        key: cacheKey,
        audioBlob: audioBlob,
        metadata: {
          duration: metadata.duration,
          scriptHash: scriptHash,
          preset: preset,
          contentType: metadata.contentType || 'audio/mpeg'
        },
        cachedAt: Date.now()
      };

      const request = store.put(cachedAudio);

      request.onsuccess = () => {
        console.log(`[Cache] 音频已缓存: ${cacheKey}`);
        resolve(cacheKey);
      };

      request.onerror = () => {
        console.error('[Cache] 音频缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取缓存的音频 Blob
   */
  async getCachedAudio(scriptHash: string, preset: string): Promise<Blob | null> {
    const cacheKey = generateAudioCacheKey(scriptHash, preset);
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['audio'], 'readonly');
      const store = transaction.objectStore('audio');
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result as CachedAudio | undefined;
        if (result) {
          // 检查是否过期
          const age = Date.now() - result.cachedAt;
          const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
          if (age > maxAge) {
            // 删除过期缓存
            this.deleteCachedAudio(cacheKey);
            resolve(null);
            return;
          }
          console.log(`[Cache] 使用缓存的音频: ${cacheKey}`);
          resolve(result.audioBlob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 获取缓存的音频 URL（object URL）
   */
  async getCachedAudioUrl(scriptHash: string, preset: string): Promise<string | null> {
    const blob = await this.getCachedAudio(scriptHash, preset);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  }

  /**
   * 删除缓存的音频
   */
  private async deleteCachedAudio(cacheKey: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['audio'], 'readwrite');
      const store = transaction.objectStore('audio');
      const request = store.delete(cacheKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 缓存清理 ====================

  /**
   * 清理过期缓存
   */
  async clearExpiredCache(maxAgeDays: number = CACHE_EXPIRY_DAYS): Promise<void> {
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const db = await this.getDB();

    // 清理 IndexedDB 中的过期文件
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const index = store.index('cachedAt');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value as CachedFile;
          if (now - item.cachedAt > maxAge) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    // 清理 IndexedDB 中的过期音频
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['audio'], 'readwrite');
      const store = transaction.objectStore('audio');
      const index = store.index('cachedAt');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value as CachedAudio;
          if (now - item.cachedAt > maxAge) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    // 清理 localStorage 中的过期 FlowItem
    this.clearExpiredFlowItems();

    console.log('[Cache] 过期缓存已清理');
  }

  /**
   * 清理所有缓存
   */
  async clearAllCache(): Promise<void> {
    const db = await this.getDB();

    // 清理 IndexedDB
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['files', 'audio'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      transaction.objectStore('files').clear();
      transaction.objectStore('audio').clear();
    });

    // 清理 localStorage 中的 FlowItem
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flowitem_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('[Cache] 所有缓存已清理');
  }

  /**
   * 获取缓存大小统计
   */
  async getCacheSize(): Promise<{ files: number; audio: number; metadata: number }> {
    const db = await this.getDB();

    // 统计文件数量
    const fileCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // 统计音频数量
    const audioCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(['audio'], 'readonly');
      const store = transaction.objectStore('audio');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // 统计 FlowItem 数量
    let metadataCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flowitem_')) {
        metadataCount++;
      }
    }

    return {
      files: fileCount,
      audio: audioCount,
      metadata: metadataCount
    };
  }
}

// 导出单例
export const cacheManager = new CacheManager();

