import { useState, useEffect } from 'react';
import { X, Clock, Target, AlertCircle, Award, History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForestGarden } from './ForestGarden';
import { useRewardSystem } from '../hooks/useRewardSystem';
import type { LearningSession } from '../utils/reward-manager';

interface RewardSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 格式化时长显示
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }
  return `${minutes} 分钟`;
}

/**
 * 格式化日期时间
 */
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function RewardSystem({ isOpen, onClose }: RewardSystemProps) {
  const { stats, totalHours, updateStats } = useRewardSystem();
  const [showHistory, setShowHistory] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // 刷新统计数据（当组件打开时）
  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen, updateStats]);

  const completionRate = stats.totalSessions > 0
    ? ((stats.totalSessions - stats.interruptedSessions) / stats.totalSessions * 100).toFixed(0)
    : '0';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/35 backdrop-blur-sm z-[60]"
          />
          
          {/* 内容面板 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-[90%] max-w-md bg-[#F2F2F7] shadow-2xl z-[70] overflow-y-auto"
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-[#F2F2F7] z-10 border-b border-slate-200">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-500" />
                  激励体系
                </h2>
                <span className="text-xs text-slate-400">学习成长记录</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* 森林养成游戏区域 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <ForestGarden totalHours={totalHours} debugMode={debugMode} />
                
                {/* 调试模式开关 */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={debugMode}
                      onChange={(e) => setDebugMode(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>调试模式（预览各阶段）</span>
                  </label>
                </div>
              </div>

              {/* 统计数据卡片 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 总时长 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-indigo-500" />
                    <span className="text-xs font-medium text-slate-600">累计时长</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {formatDuration(stats.totalDuration)}
                  </div>
                </div>

                {/* 总积分 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={16} className="text-amber-500" />
                    <span className="text-xs font-medium text-slate-600">总积分</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {stats.totalPoints}
                  </div>
                </div>

                {/* 完成率 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-green-500" />
                    <span className="text-xs font-medium text-slate-600">完成率</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {completionRate}%
                  </div>
                </div>

                {/* 总次数 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <History size={16} className="text-blue-500" />
                    <span className="text-xs font-medium text-slate-600">学习次数</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {stats.totalSessions}
                  </div>
                </div>
              </div>

              {/* 详细统计 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">详细数据</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">中断次数</span>
                    <span className="font-semibold text-slate-900">{stats.interruptedSessions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">分心次数</span>
                    <span className="font-semibold text-slate-900">{stats.totalDistractions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">平均时长</span>
                    <span className="font-semibold text-slate-900">
                      {stats.totalSessions > 0 
                        ? formatDuration(Math.floor(stats.totalDuration / stats.totalSessions))
                        : '0 分钟'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* 历史记录 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between text-sm font-bold text-slate-800"
                >
                  <span>历史记录</span>
                  <span className="text-xs font-normal text-slate-400">
                    {stats.sessions.length} 条
                  </span>
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                        {stats.sessions.length === 0 ? (
                          <div className="text-center text-sm text-slate-400 py-4">
                            暂无历史记录
                          </div>
                        ) : (
                          stats.sessions.slice(0, 20).map((session: LearningSession) => (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-slate-800">
                                    {formatDateTime(session.startTime)}
                                  </span>
                                  {session.isInterrupted && (
                                    <AlertCircle size={12} className="text-amber-500" />
                                  )}
                                </div>
                                <div className="text-slate-500">
                                  {formatDuration(session.duration)}
                                  {session.distractionCount > 0 && (
                                    <span className="ml-2">
                                      · {session.distractionCount} 次分心
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-indigo-600">
                                  +{session.points}
                                </div>
                                <div className="text-slate-400">分</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
