import { useState, useEffect, useRef } from 'react';
import { Headphones } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowPlaybackState } from './SupplyDepotApp';
import { type SceneTag, SCENE_CONFIGS } from '../config/scene-config';
import { SceneWheel } from './SceneWheel';

interface HeadsetDeviceProps {
  currentSceneTag: SceneTag;
  onSceneChange: (tag: SceneTag) => void;
  availableScenes: SceneTag[];
  isPlaying: boolean;
  playbackState: FlowPlaybackState | null;
  audioUrl: string | null;
}

export function HeadsetDevice({ currentSceneTag, onSceneChange, availableScenes, isPlaying, playbackState, audioUrl }: HeadsetDeviceProps) {
  // Mock waveform data
  const [bars, setBars] = useState<number[]>(new Array(12).fill(10));
  const [audioText, setAudioText] = useState<{type: 'input' | 'output', text: string} | null>(null);
  const isDeep = currentSceneTag === 'focus' || currentSceneTag === 'qa_memory';
  const CurrentIcon = SCENE_CONFIGS[currentSceneTag].icon;
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 逐字显示相关状态
  const [displayedText, setDisplayedText] = useState<string>('');
  const [fullText, setFullText] = useState<string>('');
  const displayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef<string>('');
  
  // 同步音频播放（仅用于单条播放模式）
  useEffect(() => {
    if (audioRef.current && playbackState?.playbackMode === 'audio' && audioUrl) {
      // 更新音频源
      if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
      }
      
      // 同步播放状态
      if (playbackState.isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(err => {
          console.error('Headset audio play failed:', err);
        });
      } else if (!playbackState.isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      
      // 同步播放进度（可选，避免双重播放时使用静音）
      // audioRef.current.volume = 0; // 静音，避免双重播放
    }
  }, [audioUrl, playbackState?.playbackMode, playbackState?.isPlaying]);
  
  // 清理定时器
  const clearDisplayTimer = () => {
    if (displayTimerRef.current) {
      clearInterval(displayTimerRef.current);
      displayTimerRef.current = null;
    }
  };

  // 自动滚动到底部
  const scrollToEnd = () => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTo({
        left: textContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  // 根据音频播放进度同步字幕显示（智能同步算法）
  useEffect(() => {
    if (!playbackState?.currentText) {
      previousTextRef.current = '';
      setAudioText(null);
      setDisplayedText('');
      setFullText('');
      return;
    }

    // 根据播放模式确定文本类型
    const textType = playbackState.playbackMode === 'live' 
      ? (playbackState.currentText.includes('用户') || playbackState.currentText.includes('User') ? 'input' : 'output')
      : 'output'; // 单条播放默认为输出
    
    const newFullText = playbackState.currentText;
    
    // 如果文本发生变化，更新完整文本
    if (newFullText !== previousTextRef.current) {
      previousTextRef.current = newFullText;
      setFullText(newFullText);
    }

    // 智能字幕同步算法
    let displayCharCount = 0;
    
    if (playbackState.subtitleStartTime !== undefined && playbackState.subtitleEndTime !== undefined && playbackState.currentTime !== undefined) {
      const startTime = playbackState.subtitleStartTime;
      const endTime = playbackState.subtitleEndTime;
      const currentTime = playbackState.currentTime;
      const timeRange = endTime - startTime;
      
      // 如果时间范围太小或无效，直接显示全部
      if (timeRange <= 0 || timeRange > 60) {
        displayCharCount = newFullText.length;
      } else {
        // 计算当前播放进度（0-1）
        const rawProgress = Math.min(1, Math.max(0, (currentTime - startTime) / timeRange));
        
        // 使用非线性进度曲线，让字幕显示更平滑
        // 前面稍慢，中间正常，后面稍快（避免最后等待）
        let adjustedProgress: number;
        if (rawProgress < 0.3) {
          // 前30%：使用平方根曲线，让开始更慢
          adjustedProgress = Math.sqrt(rawProgress / 0.3) * 0.25;
        } else if (rawProgress < 0.7) {
          // 中间40%：线性增长
          adjustedProgress = 0.25 + (rawProgress - 0.3) / 0.4 * 0.5;
        } else {
          // 后30%：使用平方曲线，让结束更快
          const remainingProgress = (rawProgress - 0.7) / 0.3;
          adjustedProgress = 0.75 + Math.pow(remainingProgress, 0.7) * 0.25;
        }
        
        // 确保进度在合理范围内
        adjustedProgress = Math.min(0.95, Math.max(0, adjustedProgress));
        
        // 根据调整后的进度计算字符数
        displayCharCount = Math.floor(adjustedProgress * newFullText.length);
        
        // 确保至少显示1个字符（如果进度>0且文本不为空）
        if (rawProgress > 0.05 && newFullText.length > 0 && displayCharCount === 0) {
          displayCharCount = 1;
        }
      }
    } else if (playbackState.currentTime !== undefined && playbackState.subtitleStartTime !== undefined) {
      // 有开始时间但没有结束时间，使用智能语速计算
      const startTime = playbackState.subtitleStartTime;
      const currentTime = playbackState.currentTime;
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime < 0) {
        displayCharCount = 0;
      } else {
        // 根据文本长度动态调整语速
        // 短文本（<20字符）：每秒4个字符
        // 中等文本（20-50字符）：每秒3.5个字符
        // 长文本（>50字符）：每秒3个字符
        const textLength = newFullText.length;
        let charsPerSecond: number;
        if (textLength < 20) {
          charsPerSecond = 4;
        } else if (textLength < 50) {
          charsPerSecond = 3.5;
        } else {
          charsPerSecond = 3;
        }
        
        displayCharCount = Math.min(newFullText.length, Math.floor(elapsedTime * charsPerSecond));
      }
    } else {
      // 没有时间信息，直接显示全部（fallback）
      displayCharCount = newFullText.length;
    }

    // 更新显示的文本
    const newDisplayedText = newFullText.slice(0, displayCharCount);
    setDisplayedText(newDisplayedText);
    
    // 更新 audioText 以触发重新渲染
    setAudioText({
      type: textType,
      text: newDisplayedText
    });
    
    // 自动滚动到底部
    setTimeout(scrollToEnd, 0);
  }, [playbackState?.currentText, playbackState?.currentTime, playbackState?.subtitleStartTime, playbackState?.subtitleEndTime, playbackState?.playbackMode]);

  useEffect(() => {
    // 使用 playbackState 的 isPlaying 或 fallback 到 isPlaying prop
    const actuallyPlaying = playbackState?.isPlaying ?? isPlaying;
    
    if (actuallyPlaying) {
      const interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.random() * 40 + 10));
      }, 100);
      return () => {
        clearInterval(interval);
        setBars(new Array(12).fill(10));
      };
    }
  }, [isPlaying, playbackState?.isPlaying]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearDisplayTimer();
    };
  }, []);

  // 模拟音频对话（仅在无 playbackState 时使用，作为 fallback）
  useEffect(() => {
    // 如果有 playbackState，使用真实数据，不再使用模拟数据
    if (playbackState) {
      return;
    }
    
    if (isPlaying) {
       const texts = [
           { type: 'input', text: '...我觉得这个语法点很难...' },
           { type: 'output', text: '正在为你生成相关例句...' },
           { type: 'input', text: '虚拟语气怎么用？' },
           { type: 'output', text: '已检索到相关知识卡片...' },
       ] as const;
       let index = 0;
       // Initial delay
       const timer1 = setTimeout(() => {
            setAudioText(texts[0]);
       }, 1000);

       const interval = setInterval(() => {
           index++;
           setAudioText(texts[index % texts.length]);
       }, 4000);

       return () => {
           clearTimeout(timer1);
           clearInterval(interval);
           setAudioText(null);
       };
    } else {
        setAudioText(null);
    }
  }, [isPlaying, playbackState]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 overflow-hidden">
       {/* 隐藏的音频元素，用于同步播放（仅单条播放模式） */}
       {playbackState?.playbackMode === 'audio' && audioUrl && (
         <audio
           ref={audioRef}
           className="hidden"
           src={audioUrl}
           // volume={0} // 静音，避免双重播放（HTMLAudioElement 没有 volume 属性，使用 muted）
           muted
         />
       )}
       
       {/* Headset Visual - Further Reduced */}
       <div className="relative w-44 h-44 bg-neutral-900 rounded-[2rem] shadow-2xl flex items-center justify-center border-4 border-neutral-800 ring-1 ring-white/10 shrink-0 mb-6">
          <div className="absolute top-0 w-20 h-2 bg-neutral-800 rounded-b-xl" /> {/* Band */}
          
          <Headphones size={90} className="text-neutral-700" strokeWidth={1} />
          
          {/* Ear Cups Glow */}
          <div className={clsx(
              "absolute left-4 w-2 h-16 rounded-full blur-lg transition-all duration-700 opacity-60",
              isDeep ? "bg-red-500" : "bg-green-500"
          )} />
          <div className={clsx(
              "absolute right-4 w-2 h-16 rounded-full blur-lg transition-all duration-700 opacity-60",
              isDeep ? "bg-red-500" : "bg-green-500"
          )} />

          {/* Status LED */}
          <div className={clsx(
              "absolute bottom-5 w-1.5 h-1.5 rounded-full transition-colors duration-300 shadow-[0_0_15px_currentColor]",
              isDeep ? "bg-red-400 text-red-400" : "bg-green-400 text-green-400"
          )} />
       </div>

       {/* Control Panel - Compact Mode */}
       <div className="w-full max-w-[280px] bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/40 flex flex-col gap-3">
           <div className="flex justify-between items-center">
               <h3 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">心流控制 (Flow Control)</h3>
           </div>

           {/* Audio Visualizer */}
           <div className="h-8 flex items-center justify-center gap-1">
                {bars.map((h, i) => (
                    <motion.div 
                        key={i}
                        animate={{ height: h * 0.6 }}
                        className={clsx("w-1 rounded-full", isDeep ? "bg-red-500" : "bg-green-300")}
                    />
                ))}
           </div>
           
           {/* Real-time Text */}
           <div className="h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {audioText && (
                        <motion.div
                            key={fullText || audioText.text}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className={clsx(
                                "text-[9px] font-mono px-3 py-1.5 rounded-lg border shadow-sm",
                                "max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap",
                                "scrollbar-hide", // 隐藏滚动条但保持功能
                                audioText.type === 'input' 
                                    ? "bg-white text-neutral-600 border-neutral-200"
                                    : "bg-indigo-50 text-indigo-600 border-indigo-100"
                            )}
                            ref={textContainerRef}
                            style={{
                                scrollBehavior: 'smooth'
                            }}
                        >
                            <span className="font-bold opacity-40 mr-2 text-[8px] uppercase tracking-wider shrink-0">{audioText.type === 'input' ? 'User' : 'AI'}</span>
                            <span>{displayedText || audioText.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
           </div>

           {/* Zone Switch - Compact Integrated */}
           <div className="bg-white p-3 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between gap-2">
               <div className="flex flex-col gap-1 w-full">
                   <div className="flex items-center gap-1.5 mb-1">
                       <CurrentIcon size={16} className={clsx("transition-colors", isDeep ? "text-red-500" : "text-green-500")} />
                       <span className="text-xs font-bold text-neutral-700">场景切换</span>
                   </div>
                   
                   <div className="w-full flex justify-center">
                        <SceneWheel 
                            currentSceneTag={currentSceneTag}
                            onSceneChange={onSceneChange}
                            availableScenes={availableScenes}
                            theme="light"
                        />
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
}
