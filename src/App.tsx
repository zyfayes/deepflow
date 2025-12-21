import { useState, useEffect } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { SupplyDepotApp, type KnowledgeCard } from './components/SupplyDepotApp';
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

  // Simulate Printer Action
  useEffect(() => {
    if (isFlowing && currentContext === 'deep_work') {
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
  }, [isFlowing, currentContext]);

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
                            isPlaying={isFlowing}
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
