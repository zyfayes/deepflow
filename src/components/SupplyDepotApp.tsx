import { useState } from 'react';
import { Camera, FileText, Mic, Package, Play, Check, Loader2, Sparkles, Brain, Moon, Coffee, Home, Library, Tag, Settings, List, Calendar, X, AlignLeft } from 'lucide-react';
import clsx from 'clsx';

export interface KnowledgeCard {
    id: string;
    title: string;
    content: string;
    tags: string[];
    timestamp: Date;
}

interface RawInput {
    id: string;
    type: string;
    time: string;
    timestamp: number;
}

interface FlowItem {
    id: string;
    title: string;
    duration: string;
    type: string;
    tldr: string;
    subtitles: { time: string; text: string }[];
    status: 'ready' | 'playing' | 'completed';
}

interface SupplyDepotAppProps {
  onStartFlow: () => void;
  onStopFlow: () => void;
  isFlowing: boolean;
  knowledgeCards: KnowledgeCard[];
  currentContext: 'deep_work' | 'casual';
  onContextChange: (context: 'deep_work' | 'casual') => void;
}

export function SupplyDepotApp({ onStartFlow, onStopFlow, isFlowing, knowledgeCards, currentContext, onContextChange }: SupplyDepotAppProps) {
  const [rawInputs, setRawInputs] = useState<RawInput[]>([]);
  const [archivedInputs, setArchivedInputs] = useState<RawInput[]>([]);
  const [flowItems, setFlowItems] = useState<FlowItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyToFlow, setReadyToFlow] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'garden' | 'scenes'>('home');
  const [gardenTab, setGardenTab] = useState<'cards' | 'files'>('cards');
  const [flowViewMode, setFlowViewMode] = useState<'list' | 'schedule'>('list');
  const [selectedItem, setSelectedItem] = useState<FlowItem | null>(null);

  const addRawInput = (type: string) => {
    const newItem: RawInput = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    setRawInputs(prev => [...prev, newItem]);
  };

  const generateFlowList = () => {
    if (rawInputs.length === 0) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing
    setTimeout(() => {
        // Archive raw inputs
        setArchivedInputs(prev => [...prev, ...rawInputs]);
        setRawInputs([]);

        // Generate Flow Items
        const newFlowItems: FlowItem[] = [
            {
                id: '1',
                title: '深度工作引导 - 专注力启动',
                duration: '05:00',
                type: 'guide',
                tldr: '通过呼吸调整和环境扫描，帮助快速进入心流状态。',
                subtitles: [
                    { time: '00:00', text: '欢迎开始今天的深度工作。' },
                    { time: '00:30', text: '请调整呼吸，深吸气...' },
                    { time: '01:00', text: '排除周围的干扰，专注于当下。' }
                ],
                status: 'ready'
            },
            {
                id: '2',
                title: '知识碎片整理 - 关于 AI 的思考',
                duration: '12:30',
                type: 'insight',
                tldr: '汇总了近期关于 LLM Agent 的最新进展与个人思考。',
                subtitles: [
                    { time: '00:00', text: '这是基于你刚才上传的文档生成的摘要。' },
                    { time: '02:15', text: 'Agent 的核心在于规划能力的提升。' },
                    { time: '05:40', text: '未来的交互模式将更加自然。' }
                ],
                status: 'ready'
            },
             {
                id: '3',
                title: '行业动态速递 - 科技前沿',
                duration: '08:45',
                type: 'news',
                tldr: '精选了过去 24 小时内最重要的 3 条科技新闻。',
                subtitles: [
                    { time: '00:00', text: '第一条新闻关于新的芯片架构。' },
                    { time: '03:20', text: 'OpenAI 发布了新的模型更新。' }
                ],
                status: 'ready'
            }
        ];
      
      setFlowItems(newFlowItems);
      setIsGenerating(false);
      setReadyToFlow(true);
    }, 2000);
  };

  if (isFlowing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-black opacity-80" />
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-8 animate-pulse">
                <Brain className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-light tracking-tight mb-2">DeepFlow</h2>
            <p className="text-white/50 text-sm mb-12">心流会话进行中...</p>
            
            <div className="flex gap-4 mb-12">
               <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-lg font-mono">24</span>
                  </div>
                  <span className="text-xs text-white/30">MIN</span>
               </div>
            </div>

            {/* Context Switcher in Flow Mode */}
            <div className="flex gap-3 mb-12 bg-white/5 p-1 rounded-full border border-white/10">
                <button 
                    onClick={() => onContextChange('deep_work')}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-300",
                        currentContext === 'deep_work' 
                            ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" 
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                >
                    <Brain size={14} /> 深度
                </button>
                <button 
                    onClick={() => onContextChange('casual')}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-300",
                        currentContext === 'casual' 
                            ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105" 
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                >
                    <Coffee size={14} /> 休闲
                </button>
            </div>

            <button 
                onClick={onStopFlow}
                className="px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium hover:bg-white/20 transition-colors"
            >
                结束会话
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] relative">
      
      {activeTab === 'home' ? (
          <>
            {/* Header */}
            <div className="px-6 pt-4 pb-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deep Flow</h1>
                <p className="text-slate-500 text-sm font-medium">准备你的专注素材</p>
            </div>

            {/* Main Card */}
            <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto no-scrollbar">
                
                {/* Input Methods */}
                <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">知识打包 (Pack My Bag)</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => addRawInput('图片')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Camera size={20} />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">拍照</span>
                        </button>
                        <button onClick={() => addRawInput('文档')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">导入</span>
                        </button>
                        <button onClick={() => addRawInput('录音')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95">
                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                <Mic size={20} />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">录音</span>
                        </button>
                    </div>

                    {/* Raw Input List */}
                    {rawInputs.length > 0 && (
                        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                            {rawInputs.map((input) => (
                                <div key={input.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                                    <span className="text-slate-600 flex items-center gap-2">
                                        {input.type === '图片' && <Camera size={12} />}
                                        {input.type === '文档' && <FileText size={12} />}
                                        {input.type === '录音' && <Mic size={12} />}
                                        {input.type}输入
                                    </span>
                                    <span className="text-slate-400 font-mono">{input.time}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Generate Button - Only show when there are inputs */}
                    {rawInputs.length > 0 && (
                        <button 
                            onClick={generateFlowList}
                            disabled={isGenerating}
                            className={clsx(
                                "w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all",
                                !isGenerating
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200" 
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</>
                            ) : (
                                <><Sparkles size={16} /> 生成 Flow List</>
                            )}
                        </button>
                    )}
                </div>

                {/* Flow List (Backpack) */}
                <div className="bg-white rounded-3xl p-5 shadow-sm min-h-[200px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flow List</h3>
                        {/* View Toggle */}
                        {flowItems.length > 0 && (
                            <div className="flex bg-slate-100 rounded-lg p-0.5">
                                <button 
                                    onClick={() => setFlowViewMode('list')}
                                    className={clsx(
                                        "p-1.5 rounded-md transition-all",
                                        flowViewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                                    )}
                                >
                                    <List size={14} />
                                </button>
                                <button 
                                    onClick={() => setFlowViewMode('schedule')}
                                    className={clsx(
                                        "p-1.5 rounded-md transition-all",
                                        flowViewMode === 'schedule' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                                    )}
                                >
                                    <Calendar size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {isGenerating ? (
                         <div className="h-24 flex flex-col items-center justify-center text-indigo-400 space-y-3">
                            <Loader2 size={24} className="animate-spin" />
                            <span className="text-xs text-indigo-400/60 animate-pulse">正在编排心流内容...</span>
                        </div>
                    ) : flowItems.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                            <Package size={24} className="mb-2 opacity-50" />
                            <span className="text-xs">等待生成清单</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {flowViewMode === 'list' ? (
                                /* List View */
                                flowItems.map((item) => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-indigo-100 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                <Play size={16} fill="currentColor" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm font-semibold text-slate-700 text-left line-clamp-1">{item.title}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">{item.duration}</span>
                                                    <span className="text-[10px] text-slate-400">AI 生成</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center">
                                            {/* Status indicator */}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                /* Schedule View */
                                <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                    {flowItems.map((item, i) => (
                                        <div key={item.id} className="relative flex gap-4">
                                            <div className="absolute left-[-19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-white" />
                                            <div className="text-[10px] font-mono text-slate-400 pt-1 w-8">
                                                {(9 + i).toString().padStart(2, '0')}:00
                                            </div>
                                            <button 
                                                onClick={() => setSelectedItem(item)}
                                                className="flex-1 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-left hover:bg-indigo-50 transition-colors"
                                            >
                                                <h4 className="text-xs font-bold text-indigo-900 mb-1">{item.title}</h4>
                                                <p className="text-[10px] text-indigo-700/70 line-clamp-2">{item.tldr}</p>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

             {/* Bottom Action - Only on Home */}
            <div className="px-6 pb-2 pt-2 bg-gradient-to-t from-[#F2F2F7] to-transparent">
                <button 
                    onClick={onStartFlow}
                    disabled={!readyToFlow}
                    className={clsx(
                        "w-full h-14 rounded-full flex items-center justify-center gap-2 font-bold text-lg shadow-lg transition-all duration-300 transform active:scale-95",
                        readyToFlow ? "bg-black text-white hover:bg-slate-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                >
                    <Play fill="currentColor" size={18} />
                    Go Flow
                </button>
            </div>
          </>
      ) : activeTab === 'garden' ? (
          /* Garden Tab */
          <>
             <div className="px-6 pt-4 pb-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">知识花园</h1>
                <p className="text-slate-500 text-sm font-medium">沉淀你的思考与灵感</p>
                
                {/* Garden Tabs */}
                <div className="flex mt-4 bg-slate-200/50 p-1 rounded-xl">
                    <button 
                        onClick={() => setGardenTab('cards')}
                        className={clsx(
                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                            gardenTab === 'cards' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
                        )}
                    >
                        知识小票
                    </button>
                    <button 
                        onClick={() => setGardenTab('files')}
                        className={clsx(
                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                            gardenTab === 'files' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
                        )}
                    >
                        原始文件库
                    </button>
                </div>
            </div>
            
            <div className="flex-1 px-4 py-4 overflow-y-auto no-scrollbar space-y-4">
                {gardenTab === 'cards' ? (
                    /* Knowledge Cards List */
                    knowledgeCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                            <Library size={48} className="opacity-20" />
                            <p className="text-sm">暂无知识小票</p>
                            <p className="text-xs max-w-[200px] text-center opacity-60">在 Flow 模式中，打印机会自动为你生成知识小票并归档于此。</p>
                        </div>
                    ) : (
                        knowledgeCards.map(card => (
                            <div key={card.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800">{card.title}</h3>
                                    <span className="text-[10px] text-slate-400 font-mono">{card.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                                    {card.content}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {card.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-medium">
                                            <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    /* Archived Files List */
                    archivedInputs.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                            <Package size={48} className="opacity-20" />
                            <p className="text-sm">暂无原始文件</p>
                            <p className="text-xs max-w-[200px] text-center opacity-60">打包生成 Flow List 后，原始文件将自动归档至此。</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                             {archivedInputs.map((input) => (
                                <div key={input.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", 
                                            input.type === '图片' ? "bg-blue-100 text-blue-600" :
                                            input.type === '文档' ? "bg-orange-100 text-orange-600" :
                                            "bg-red-100 text-red-600"
                                        )}>
                                            {input.type === '图片' && <Camera size={14} />}
                                            {input.type === '文档' && <FileText size={14} />}
                                            {input.type === '录音' && <Mic size={14} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">{input.type}输入 #{input.id.substr(0,4)}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{new Date(input.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">已归档</span>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
          </>
      ) : (
          /* Scenes Tab */
          <>
            <div className="px-6 pt-4 pb-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">场景配置</h1>
                <p className="text-slate-500 text-sm font-medium">设定你的心流环境</p>
            </div>
            
            <div className="flex-1 px-4 py-4 overflow-y-auto no-scrollbar space-y-4">
                 <button 
                    onClick={() => onContextChange('deep_work')}
                    className={clsx(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                        currentContext === 'deep_work' 
                            ? "bg-black text-white border-black shadow-lg scale-[1.02]" 
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                >
                    <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center", currentContext === 'deep_work' ? "bg-white/20" : "bg-slate-100 text-slate-500")}>
                        <Brain size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm">深度学习 (Deep Work)</h3>
                        <p className={clsx("text-xs mt-1", currentContext === 'deep_work' ? "text-white/60" : "text-slate-400")}>高强度专注，屏蔽干扰</p>
                    </div>
                    {currentContext === 'deep_work' && <Check size={20} className="text-green-400" />}
                </button>

                <button 
                    onClick={() => onContextChange('casual')}
                    className={clsx(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                        currentContext === 'casual' 
                            ? "bg-green-600 text-white border-green-600 shadow-lg scale-[1.02]" 
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                >
                    <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center", currentContext === 'casual' ? "bg-white/20" : "bg-slate-100 text-slate-500")}>
                        <Coffee size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm">休闲听书 (Casual)</h3>
                        <p className={clsx("text-xs mt-1", currentContext === 'casual' ? "text-white/80" : "text-slate-400")}>轻松氛围，享受阅读</p>
                    </div>
                    {currentContext === 'casual' && <Check size={20} className="text-white" />}
                </button>

                <button disabled className="w-full flex items-center gap-4 p-4 rounded-2xl border bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                        <Moon size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm text-slate-400">助眠模式 (Sleep)</h3>
                        <p className="text-xs mt-1 text-slate-400">开发中...</p>
                    </div>
                </button>
            </div>
          </>
      )}

      {/* Bottom Navigation */}
      <div className="h-16 bg-white border-t border-slate-200 grid grid-cols-3">
          <button 
            onClick={() => setActiveTab('home')}
            className={clsx(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                activeTab === 'home' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
              <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Deep Flow</span>
          </button>
          <button 
            onClick={() => setActiveTab('garden')}
            className={clsx(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                activeTab === 'garden' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
              <Library size={24} strokeWidth={activeTab === 'garden' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">花园</span>
          </button>
          <button 
            onClick={() => setActiveTab('scenes')}
            className={clsx(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                activeTab === 'scenes' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
              <Settings size={24} strokeWidth={activeTab === 'scenes' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">场景</span>
          </button>
      </div>

      {/* Detail View Modal / Overlay */}
      {selectedItem && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-slate-900">{selectedItem.title}</h2>
                      <span className="text-xs text-slate-400">AI Audio Gen • {selectedItem.duration}</span>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                      <X size={20} />
                  </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Player Placeholder */}
                  <div className="w-full aspect-video bg-indigo-900 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
                          {[...Array(20)].map((_,i) => (
                              <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s`}} />
                          ))}
                      </div>
                      <button className="w-16 h-16 rounded-full bg-white text-indigo-900 flex items-center justify-center z-20 hover:scale-105 transition-transform">
                          <Play fill="currentColor" className="ml-1" size={32} />
                      </button>
                  </div>

                  {/* TLDR Section */}
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 text-indigo-600">
                          <Sparkles size={16} />
                          <h3 className="text-xs font-bold uppercase tracking-wider">AI 提炼 (TL;DR)</h3>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-2xl text-sm text-indigo-900 leading-relaxed">
                          {selectedItem.tldr}
                      </div>
                  </div>

                   {/* Timeline Section */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400">
                          <AlignLeft size={16} />
                          <h3 className="text-xs font-bold uppercase tracking-wider">字幕时间线</h3>
                      </div>
                      <div className="space-y-4 relative pl-4 border-l-2 border-slate-100">
                          {selectedItem.subtitles.map((sub, i) => (
                              <div key={i} className="relative">
                                  <div className="absolute left-[-21px] top-1 w-3 h-3 rounded-full bg-slate-200 border-2 border-white" />
                                  <span className="text-xs font-mono text-slate-400 block mb-1">{sub.time}</span>
                                  <p className="text-sm text-slate-600">{sub.text}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
