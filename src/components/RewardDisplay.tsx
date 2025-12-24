import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useRewardSystem } from '../hooks/useRewardSystem';

interface RewardDisplayProps {
  sessionStartTime: number | null;
  isInterrupted: boolean;
}

/**
 * 格式化时长显示（秒转换为 mm:ss 或 HH:mm:ss）
 */
function formatSessionDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化总时长显示
 */
function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function RewardDisplay({ sessionStartTime, isInterrupted }: RewardDisplayProps) {
  const { stats } = useRewardSystem();
  const [currentDuration, setCurrentDuration] = useState(0);

  // 实时更新本次学习时长
  useEffect(() => {
    if (!sessionStartTime) {
      setCurrentDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const duration = (now - sessionStartTime) / 1000;
      setCurrentDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  if (!sessionStartTime) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
      {/* 本次学习时长 */}
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-white/70" />
        <span className="text-sm font-medium text-white/90">
          本次：{formatSessionDuration(currentDuration)}
        </span>
        {isInterrupted && (
          <AlertCircle size={14} className="text-amber-400" />
        )}
      </div>
      
      {/* 历史累计时长 */}
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-white/50" />
        <span className="text-xs text-white/60">
          累计：{formatTotalDuration(stats.totalDuration)}
        </span>
      </div>
    </div>
  );
}

