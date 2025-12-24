/**
 * 激励体系管理器
 * 使用 localStorage 存储学习会话数据和统计数据
 */

const STORAGE_KEY = 'deepflow_reward_data';
const MAX_SESSIONS = 100; // 保留最近100条会话记录

export interface LearningSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number; // 秒
  isInterrupted: boolean; // 是否被中断
  distractionCount: number; // 分心次数
  points: number; // 本次获得的积分
}

export interface RewardData {
  totalDuration: number; // 总学习时长（秒）
  totalSessions: number; // 总次数
  interruptedSessions: number; // 中断次数
  totalDistractions: number; // 总分心次数
  totalPoints: number; // 总积分
  sessions: LearningSession[]; // 历史会话记录（保留最近N条）
}

/**
 * 激励体系管理器类
 */
export class RewardManager {
  private isSupported: boolean | null = null;

  /**
   * 检查浏览器环境是否支持
   */
  private isBrowserEnvironment(): boolean {
    if (this.isSupported !== null) {
      return this.isSupported;
    }
    
    this.isSupported = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    
    if (!this.isSupported) {
      console.warn('[Reward] 浏览器环境不支持 localStorage');
    }
    
    return this.isSupported;
  }

  /**
   * 初始化数据
   */
  private getInitialData(): RewardData {
    return {
      totalDuration: 0,
      totalSessions: 0,
      interruptedSessions: 0,
      totalDistractions: 0,
      totalPoints: 0,
      sessions: []
    };
  }

  /**
   * 获取存储的数据
   */
  private getStoredData(): RewardData {
    if (!this.isBrowserEnvironment()) {
      return this.getInitialData();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as RewardData;
        // 验证数据结构
        if (data && typeof data.totalDuration === 'number') {
          return data;
        }
      }
    } catch (error) {
      console.error('[Reward] 读取数据失败:', error);
    }

    return this.getInitialData();
  }

  /**
   * 保存数据
   */
  private saveData(data: RewardData): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    try {
      // 限制会话记录数量
      if (data.sessions.length > MAX_SESSIONS) {
        data.sessions = data.sessions
          .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
          .slice(0, MAX_SESSIONS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[Reward] 保存数据失败:', error);
    }
  }

  /**
   * 计算积分
   * 规则：前30分钟每分钟1分，30-60分钟每分钟2分，60分钟以上每分钟3分
   * 如果中断，最终积分扣减50%
   */
  private calculatePoints(durationSeconds: number, isInterrupted: boolean): number {
    const minutes = Math.floor(durationSeconds / 60);
    
    let points = 0;
    if (minutes <= 30) {
      points = minutes * 1;
    } else if (minutes <= 60) {
      points = 30 * 1 + (minutes - 30) * 2;
    } else {
      points = 30 * 1 + 30 * 2 + (minutes - 60) * 3;
    }

    // 如果中断，扣减50%
    if (isInterrupted) {
      points = Math.floor(points * 0.5);
    }

    return points;
  }

  /**
   * 开始一个学习会话
   */
  startSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    return sessionId;
  }

  /**
   * 结束一个学习会话并保存数据
   */
  endSession(
    sessionId: string,
    startTime: number,
    endTime: number,
    isInterrupted: boolean,
    distractionCount: number = 0
  ): LearningSession {
    const duration = Math.max(0, endTime - startTime);
    const points = this.calculatePoints(duration, isInterrupted);

    const session: LearningSession = {
      id: sessionId,
      startTime,
      endTime,
      duration,
      isInterrupted,
      distractionCount,
      points
    };

    const data = this.getStoredData();
    
    // 更新统计数据
    data.totalDuration += duration;
    data.totalSessions += 1;
    if (isInterrupted) {
      data.interruptedSessions += 1;
    }
    data.totalDistractions += distractionCount;
    data.totalPoints += points;

    // 添加会话记录
    data.sessions.unshift(session);

    // 保存数据
    this.saveData(data);

    return session;
  }

  /**
   * 获取统计数据
   */
  getStats(): RewardData {
    return this.getStoredData();
  }

  /**
   * 获取总学习时长（小时）
   */
  getTotalHours(): number {
    const data = this.getStoredData();
    return data.totalDuration / 3600;
  }

  /**
   * 清除所有数据
   */
  clearAll(): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[Reward] 清除数据失败:', error);
    }
  }

  /**
   * 获取最近N条会话记录
   */
  getRecentSessions(limit: number = 20): LearningSession[] {
    const data = this.getStoredData();
    return data.sessions.slice(0, limit);
  }
}

// 导出单例
export const rewardManager = new RewardManager();

