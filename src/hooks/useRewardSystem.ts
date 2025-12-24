import { useState, useEffect, useCallback, useRef } from 'react';
import { rewardManager, type RewardData } from '../utils/reward-manager';

interface UseRewardSystemReturn {
  // 当前会话状态
  currentSessionId: string | null;
  sessionStartTime: number | null;
  isSessionActive: boolean;
  
  // 统计数据
  stats: RewardData;
  totalHours: number;
  
  // 方法
  startSession: () => void;
  endSession: (isInterrupted: boolean, distractionCount?: number) => void;
  updateStats: () => void;
  
  // 分心检测
  distractionCount: number;
  incrementDistraction: () => void;
  resetDistraction: () => void;
  checkDistraction: (isPlaying: boolean) => void;
}

const DISTRACTION_THRESHOLD = 120000; // 2分钟（毫秒）

export function useRewardSystem(): UseRewardSystemReturn {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState<RewardData>(rewardManager.getStats());
  const [distractionCount, setDistractionCount] = useState<number>(0);
  
  // 分心检测相关
  const lastActiveTimeRef = useRef<number | null>(null);
  const distractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 更新统计数据
   */
  const updateStats = useCallback(() => {
    setStats(rewardManager.getStats());
  }, []);

  /**
   * 开始学习会话
   */
  const startSession = useCallback(() => {
    const sessionId = rewardManager.startSession();
    const startTime = Date.now();
    
    setCurrentSessionId(sessionId);
    setSessionStartTime(startTime);
    setDistractionCount(0);
    lastActiveTimeRef.current = startTime;
    
    // 清除之前的分心检测定时器
    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }
  }, []);

  /**
   * 结束学习会话
   */
  const endSession = useCallback((isInterrupted: boolean, distractionCount: number = 0) => {
    if (!currentSessionId || !sessionStartTime) {
      console.warn('[Reward] 没有活跃的会话');
      return;
    }

    const endTime = Date.now();
    rewardManager.endSession(
      currentSessionId,
      sessionStartTime,
      endTime,
      isInterrupted,
      distractionCount
    );

    // 重置状态
    setCurrentSessionId(null);
    setSessionStartTime(null);
    setDistractionCount(0);
    lastActiveTimeRef.current = null;
    
    // 清除分心检测定时器
    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }

    // 更新统计数据
    updateStats();
  }, [currentSessionId, sessionStartTime, updateStats]);

  /**
   * 记录分心
   */
  const incrementDistraction = useCallback(() => {
    setDistractionCount(prev => prev + 1);
  }, []);

  /**
   * 重置分心计数
   */
  const resetDistraction = useCallback(() => {
    setDistractionCount(0);
  }, []);

  /**
   * 检测分心（当音频暂停时）
   */
  const checkDistraction = useCallback((isPlaying: boolean) => {
    const now = Date.now();
    
    if (isPlaying) {
      // 音频正在播放，更新最后活跃时间
      lastActiveTimeRef.current = now;
      
      // 清除分心检测定时器
      if (distractionTimerRef.current) {
        clearTimeout(distractionTimerRef.current);
        distractionTimerRef.current = null;
      }
    } else {
      // 音频暂停，检查是否超过阈值
      if (lastActiveTimeRef.current === null) {
        lastActiveTimeRef.current = now;
        return;
      }

      const pausedDuration = now - lastActiveTimeRef.current;
      
      if (pausedDuration >= DISTRACTION_THRESHOLD) {
        // 清除之前的定时器
        if (distractionTimerRef.current) {
          clearTimeout(distractionTimerRef.current);
        }
        
        // 延迟一点再记录，避免重复记录
        distractionTimerRef.current = setTimeout(() => {
          incrementDistraction();
          lastActiveTimeRef.current = now; // 更新最后活跃时间，避免连续记录
        }, 1000);
      }
    }
  }, [incrementDistraction]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (distractionTimerRef.current) {
        clearTimeout(distractionTimerRef.current);
      }
    };
  }, []);

  return {
    currentSessionId,
    sessionStartTime,
    isSessionActive: currentSessionId !== null,
    stats,
    totalHours: rewardManager.getTotalHours(),
    startSession,
    endSession,
    updateStats,
    distractionCount,
    incrementDistraction,
    resetDistraction,
    checkDistraction
  };
}

