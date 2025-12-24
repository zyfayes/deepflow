import { useState, useEffect } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { SupplyDepotApp, type KnowledgeCard, type FlowPlaybackState } from './components/SupplyDepotApp';
import { HeadsetDevice } from './components/HeadsetDevice';
import { PrinterDevice } from './components/PrinterDevice';
import { Headphones, Printer } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const [isFlowing, setIsFlowing] = useState(false);
  const [currentContext, setCurrentContext] = useState<'deep_work' | 'casual'>('deep_work');
  const [activeHardware, setActiveHardware] = useState<'headset' | 'printer'>('headset');
  const [printedContent, setPrintedContent] = useState<string | null>(null);
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([]);
  const [playbackState, setPlaybackState] = useState<FlowPlaybackState | null>(null);
  const [printedCardIds, setPrintedCardIds] = useState<Set<string>>(new Set()); // 记录已打印的卡片ID

  const startFlow = () => {
    setIsFlowing(true);
  };

  const stopFlow = () => {
    setIsFlowing(false);
    setPrintedContent(null);
  };

  const toggleContext = () => {
    setCurrentContext(prev => prev === 'deep_work' ? 'casual' : 'deep_work');
  };

  // Simulate Printer Action (GoFlow 模式的旧逻辑，保留作为 fallback)
  useEffect(() => {
    if (isFlowing && currentContext === 'deep_work' && playbackState?.playbackMode !== 'audio') {
        const timer = setTimeout(() => {
            const content = "语法提示:\n虚拟语气\n\n正确: If I were you...\n错误: If I was you...";
            setPrintedContent(content);
            setActiveHardware('printer'); // Auto switch view to printer
            
            // Add to knowledge garden
            setKnowledgeCards(prev => [{
                id: Date.now().toString(),
                title: "虚拟语气解析",
                content: content,
                tags: ["英语", "语法", "错题"],
                timestamp: new Date()
            }, ...prev]);

        }, 8000);
        return () => clearTimeout(timer);
    }
  }, [isFlowing, currentContext, playbackState?.playbackMode]);

  // 场景1：播放时自动打印知识卡片
  useEffect(() => {
    if (!playbackState || playbackState.playbackMode !== 'audio' || !playbackState.currentItem) {
      return;
    }

    const { currentItem, currentTime } = playbackState;
    const cardsToPrint = currentItem.knowledgeCards || [];

    // 检查是否有知识卡片需要在此时间点打印
    for (const card of cardsToPrint) {
      // 如果卡片已经有触发时间点
      if (card.triggerTime !== undefined) {
        // 检查是否到达触发时间点（允许 ±1 秒的误差）
        if (
          Math.abs(currentTime - card.triggerTime) <= 1 &&
          !printedCardIds.has(card.id)
        ) {
          // 打印知识卡片
          setPrintedContent(card.content);
          setActiveHardware('printer');
          
          // 标记为已打印
          setPrintedCardIds(prev => new Set(prev).add(card.id));
          
          // 添加到知识库（如果还没有）
          setKnowledgeCards(prev => {
            const exists = prev.some(c => c.id === card.id);
            if (!exists) {
              return [card, ...prev];
            }
            return prev;
          });

          // 短暂显示打印机视图后，可以切回耳机视图（可选）
          setTimeout(() => {
            // 可以选择保持打印机视图或切回耳机视图
            // setActiveHardware('headset');
          }, 3000);
          
          break; // 一次只打印一张卡片
        }
      }
    }
  }, [playbackState?.currentTime, playbackState?.currentItem, playbackState?.playbackMode, printedCardIds]);

  // 当切换播放项时，重置已打印卡片记录
  useEffect(() => {
    if (playbackState?.currentItem) {
      setPrintedCardIds(new Set());
    }
  }, [playbackState?.currentItem?.id]);

  // 场景2：实时练习中动态打印知识卡片
  // 当知识库更新时，检查是否有新卡片需要打印
  useEffect(() => {
    if (playbackState?.playbackMode === 'live' && knowledgeCards.length > 0) {
      // 获取最新的知识卡片（假设最后添加的是最新的）
      const latestCard = knowledgeCards[0];
      
      // 如果这张卡片还没有打印过，且是在实时练习模式下添加的
      if (!printedCardIds.has(latestCard.id)) {
        // 打印知识卡片
        setPrintedContent(latestCard.content);
        setActiveHardware('printer');
        
        // 标记为已打印
        setPrintedCardIds(prev => new Set(prev).add(latestCard.id));
        
        // 短暂显示打印机视图后，可以切回耳机视图（可选）
        setTimeout(() => {
          // 可以选择保持打印机视图或切回耳机视图
          // setActiveHardware('headset');
        }, 3000);
      }
    }
  }, [knowledgeCards, playbackState?.playbackMode, printedCardIds]);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-8 font-sans">
      <div className="flex gap-8 items-center flex-wrap justify-center transition-all duration-500 flex-row">
        
        {/* Device View */}
        <div className="flex flex-col items-center gap-4 relative">
            <PhoneFrame>
                <SupplyDepotApp 
                    onStartFlow={startFlow} 
                    onStopFlow={stopFlow}
                    isFlowing={isFlowing}
                    knowledgeCards={knowledgeCards}
                    onUpdateKnowledgeCards={setKnowledgeCards}
                    currentContext={currentContext}
                    onContextChange={setCurrentContext}
                    onPlaybackStateChange={setPlaybackState}
                />
            </PhoneFrame>
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-neutral-400 tracking-widest uppercase">移动终端 (Mobile Terminal)</span>
            </div>
        </div>

        {/* Hardware Simulator */}
        <div className="flex flex-col items-center gap-4 transition-all duration-500 w-[500px]">
            <div className="bg-white rounded-[40px] shadow-2xl border border-white/50 flex flex-col overflow-hidden relative ring-1 ring-black/5 transition-all duration-500 w-[500px] h-[600px]">
                
                {/* Hardware Tabs */}
                <div className="flex bg-neutral-50/50 backdrop-blur-md z-20 flex-row w-full border-b border-neutral-100 p-2 gap-2">
                    <button 
                        onClick={() => setActiveHardware('headset')}
                        className={clsx(
                            "rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 flex-1 py-3 flex-row",
                            activeHardware === 'headset' ? "bg-white shadow-md text-neutral-800" : "text-neutral-400 hover:bg-white/50"
                        )}
                    >
                        <Headphones size={18} />
                        耳机 (Headset)
                    </button>
                    <button 
                        onClick={() => setActiveHardware('printer')}
                        className={clsx(
                            "rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 flex-1 py-3 flex-row",
                            activeHardware === 'printer' ? "bg-white shadow-md text-neutral-800" : "text-neutral-400 hover:bg-white/50"
                        )}
                    >
                        <Printer size={18} />
                        打印机 (Printer)
                    </button>
                </div>

                {/* Hardware View */}
                <div className="flex-1 relative bg-gradient-to-br from-neutral-50 to-white overflow-hidden">
                    <div className={clsx("absolute inset-0 transition-opacity duration-500", activeHardware === 'headset' ? "opacity-100 z-10" : "opacity-0 z-0")}>
                        <HeadsetDevice 
                            currentContext={currentContext} 
                            onToggleContext={toggleContext}
                            isPlaying={playbackState?.isPlaying || isFlowing}
                            playbackState={playbackState}
                            audioUrl={playbackState?.audioUrl || null}
                        />
                    </div>
                    <div className={clsx("absolute inset-0 transition-opacity duration-500", activeHardware === 'printer' ? "opacity-100 z-10" : "opacity-0 z-0")}>
                        <PrinterDevice printedContent={printedContent} />
                    </div>
                </div>
                
                {/* Simulation Overlay/Label */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-neutral-900/5 rounded-full text-[10px] font-mono text-neutral-400 pointer-events-none z-30">
                    SIMULATION_MODE: {isFlowing ? "ACTIVE" : "IDLE"}
                </div>
            </div>
            <span className="text-xs font-bold text-neutral-400 tracking-widest uppercase">硬件模拟器 (Hardware Simulator)</span>
        </div>
      </div>
    </div>
  );
}

export default App;
