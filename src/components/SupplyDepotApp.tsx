import { useState, type MouseEvent } from 'react';
import { Camera, FileText, Mic, Package, Play, Loader2, Sparkles, Brain, Coffee, Library, Tag, List, Calendar, X, AlignLeft, Users, Radio, MessageCircle, Plus, ChevronUp, Music, CheckCircle, Circle } from 'lucide-react';
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
    scenes: string[];
    subject: string;
    mode: 'single' | 'dual';
    contentType: 'output' | 'discussion';
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
  const [gardenTab, setGardenTab] = useState<'cards' | 'files'>('cards');
  const [flowViewMode, setFlowViewMode] = useState<'scenes' | 'list'>('scenes');
  const [selectedItem, setSelectedItem] = useState<FlowItem | null>(null);
  const [filters, setFilters] = useState({
    duration: 'all',
    subject: 'all',
    mode: 'all',
    type: 'all'
  });
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [isGardenOpen, setIsGardenOpen] = useState(false);
  const [playlistSelection, setPlaylistSelection] = useState<Set<string>>(new Set());
  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(false);

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
                status: 'ready',
                scenes: ['deep_work'],
                subject: 'mindfulness',
                mode: 'single',
                contentType: 'output'
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
                status: 'ready',
                scenes: ['deep_work', 'casual'],
                subject: 'tech',
                mode: 'single',
                contentType: 'output'
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
                status: 'ready',
                scenes: ['casual'],
                subject: 'tech',
                mode: 'dual',
                contentType: 'discussion'
            }
        ];
      
      setFlowItems(newFlowItems);
      setIsGenerating(false);
      setReadyToFlow(true);
      setShowInputPanel(false);
    }, 2000);
  };

  const toggleSelection = (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setPlaylistSelection(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    });
  };

  const clearPlaylistSelection = () => {
    setPlaylistSelection(new Set());
    setIsPlaylistExpanded(false);
  };

  const removeFromPlaylist = (id: string) => {
    setPlaylistSelection(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const selectedPlaylistItems = Array.from(playlistSelection)
    .map(id => flowItems.find(item => item.id === id))
    .filter((item): item is FlowItem => Boolean(item));

  const renderInputPanel = () => (
    <div className="space-y-4">
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
                    <><Sparkles size={16} /> AI 整理</>
                )}
            </button>
        )}
    </div>
  );

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
      <div className="px-4 pt-4 pb-2 flex items-start gap-3">
        <button
          onClick={() => setIsGardenOpen(true)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          aria-label="打开花园"
        >
          <Library size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deep Flow</h1>
          <p className="text-slate-500 text-sm font-medium truncate">准备你的专注素材</p>
        </div>
        {flowItems.length > 0 && (
          <button
            onClick={() => setShowInputPanel(true)}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            aria-label="添加素材"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {isGardenOpen && (
        <div className="absolute inset-0 z-50">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setIsGardenOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-sm bg-[#F2F2F7] shadow-2xl rounded-r-3xl overflow-hidden animate-in slide-in-from-left duration-200">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-900">花园</h2>
                <span className="text-xs text-slate-400">知识小票 & 原始文件</span>
              </div>
              <button
                onClick={() => setIsGardenOpen(false)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="关闭花园"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
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

            <div className="px-4 pb-5 overflow-y-auto no-scrollbar space-y-4" style={{ height: 'calc(100% - 126px)' }}>
              {gardenTab === 'cards' ? (
                knowledgeCards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                    <Library size={48} className="opacity-20" />
                    <p className="text-sm">暂无知识小票</p>
                    <p className="text-xs max-w-[220px] text-center opacity-60">在 Flow 模式中自动生成并归档。</p>
                  </div>
                ) : (
                  knowledgeCards.map(card => (
                    <div key={card.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{card.title}</h3>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{card.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                archivedInputs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                    <Package size={48} className="opacity-20" />
                    <p className="text-sm">暂无原始文件</p>
                    <p className="text-xs max-w-[220px] text-center opacity-60">打包生成后自动归档至此。</p>
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
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-slate-700 truncate">{input.type}输入 #{input.id.substr(0,4)}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">{new Date(input.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 shrink-0">已归档</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showInputPanel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInputPanel(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">添加素材</h3>
              <button onClick={() => setShowInputPanel(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
            </div>
            {renderInputPanel()}
          </div>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto no-scrollbar pb-28">
        {flowItems.length === 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            {renderInputPanel()}
          </div>
        )}

        <div className="bg-white rounded-3xl p-5 shadow-sm min-h-[200px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flow List</h3>
            {flowItems.length > 0 && (
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setFlowViewMode('scenes')}
                  className={clsx(
                    "p-1.5 rounded-md transition-all",
                    flowViewMode === 'scenes' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  <Calendar size={14} />
                </button>
                <button
                  onClick={() => setFlowViewMode('list')}
                  className={clsx(
                    "p-1.5 rounded-md transition-all",
                    flowViewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  <List size={14} />
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
              {flowViewMode === 'scenes' ? (
                <div className="space-y-4">
                  {[
                    { id: 'deep_work', label: '深度学习', icon: Brain, color: 'bg-black text-white', desc: '高强度专注' },
                    { id: 'casual', label: '休闲听书', icon: Coffee, color: 'bg-green-600 text-white', desc: '轻松氛围' }
                  ].map(scene => {
                    const sceneItems = flowItems.filter(item => item.scenes.includes(scene.id));
                    if (sceneItems.length === 0) return null;

                    const isActive = currentContext === scene.id;

                    return (
                      <div
                        key={scene.id}
                        className={clsx(
                          "bg-slate-50 rounded-2xl p-4 border transition-all duration-300",
                          isActive ? "border-indigo-500 shadow-md ring-1 ring-indigo-500 bg-white" : "border-slate-100 hover:border-slate-300"
                        )}
                        onClick={() => onContextChange(scene.id as 'deep_work' | 'casual')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isActive ? "bg-indigo-600 text-white" : scene.color)}>
                              <scene.icon size={16} />
                            </div>
                            <div>
                              <h4 className={clsx("text-sm font-bold", isActive ? "text-indigo-900" : "text-slate-800")}>{scene.label}</h4>
                              <p className="text-[10px] text-slate-400">{scene.desc}</p>
                            </div>
                          </div>
                          {isActive && <CheckCircle size={18} className="text-indigo-600" />}
                        </div>
                        <div className="space-y-2">
                          {sceneItems.map(item => (
                            <button
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="w-full flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 transition-all text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Play size={12} fill="currentColor" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-semibold text-slate-700 truncate">{item.title}</h5>
                                <p className="text-[10px] text-slate-400 truncate">{item.tldr}</p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{item.duration}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <select
                      className="bg-slate-50 text-[10px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                      value={filters.duration}
                      onChange={e => setFilters({...filters, duration: e.target.value})}
                    >
                      <option value="all">时长: 全部</option>
                      <option value="short">短 (5m)</option>
                      <option value="medium">中 (5-15m)</option>
                      <option value="long">长 (&gt;15m)</option>
                    </select>
                    <select
                      className="bg-slate-50 text-[10px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                      value={filters.subject}
                      onChange={e => setFilters({...filters, subject: e.target.value})}
                    >
                      <option value="all">科目: 全部</option>
                      <option value="tech">科技</option>
                      <option value="mindfulness">冥想</option>
                    </select>
                    <select
                      className="bg-slate-50 text-[10px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                      value={filters.mode}
                      onChange={e => setFilters({...filters, mode: e.target.value})}
                    >
                      <option value="all">模式: 全部</option>
                      <option value="single">单人</option>
                      <option value="dual">双人</option>
                    </select>
                    <select
                      className="bg-slate-50 text-[10px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                      value={filters.type}
                      onChange={e => setFilters({...filters, type: e.target.value})}
                    >
                      <option value="all">类型: 全部</option>
                      <option value="output">单向输出</option>
                      <option value="discussion">互动探讨</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    {flowItems.filter(item => {
                      if (filters.subject !== 'all' && item.subject !== filters.subject) return false;
                      if (filters.mode !== 'all' && item.mode !== filters.mode) return false;
                      if (filters.type !== 'all' && item.contentType !== filters.type) return false;
                      const mins = parseInt(item.duration.split(':')[0]);
                      if (filters.duration === 'short' && mins >= 5) return false;
                      if (filters.duration === 'medium' && (mins < 5 || mins > 15)) return false;
                      if (filters.duration === 'long' && mins <= 15) return false;
                      return true;
                    }).map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        role="button"
                        tabIndex={0}
                        className={clsx(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98]",
                          playlistSelection.has(item.id)
                            ? "bg-indigo-50 border-indigo-200 hover:border-indigo-300"
                            : "bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-indigo-100"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            {item.mode === 'dual' ? <Users size={16} /> : <Play size={16} fill="currentColor" />}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-semibold text-slate-700 text-left line-clamp-1">{item.title}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">{item.duration}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                {item.contentType === 'discussion' ? <MessageCircle size={10} /> : <Radio size={10} />}
                                {item.contentType === 'discussion' ? '探讨' : '输出'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleSelection(item.id, e)}
                          className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                            playlistSelection.has(item.id)
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white text-slate-400 border border-slate-200 hover:border-slate-300"
                          )}
                          aria-label={playlistSelection.has(item.id) ? "取消选择" : "选择加入播放列表"}
                        >
                          {playlistSelection.has(item.id) ? (
                            <CheckCircle size={18} className="text-white" />
                          ) : (
                            <Circle size={18} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {flowViewMode === 'list' && selectedPlaylistItems.length > 0 && (
        <div className="absolute left-0 right-0 bottom-0 z-40 px-3 pb-3">
          <div className="mx-auto w-full max-w-[420px] bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Music size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 truncate">
                    {selectedPlaylistItems.length === 1
                      ? selectedPlaylistItems[0]?.title
                      : `${selectedPlaylistItems[0]?.title} +${selectedPlaylistItems.length - 1}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={clearPlaylistSelection}
                  className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  清空
                </button>
                <button
                  onClick={() => setIsPlaylistExpanded(v => !v)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  aria-label={isPlaylistExpanded ? "收起播放列表" : "展开播放列表"}
                >
                  <ChevronUp
                    size={14}
                    className={clsx("transition-transform", isPlaylistExpanded ? "rotate-180" : "rotate-0")}
                  />
                </button>
                <button
                  onClick={onStartFlow}
                  className="h-8 px-3 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
                >
                  <Play size={14} fill="currentColor" /> go flow
                </button>
              </div>
            </div>

            {isPlaylistExpanded && (
              <div className="border-t border-slate-100 max-h-44 overflow-y-auto">
                {selectedPlaylistItems.map(item => (
                  <div
                    key={item.id}
                    className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="text-sm font-semibold text-slate-800 truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.duration}</div>
                    </button>
                    <button
                      onClick={() => removeFromPlaylist(item.id)}
                      className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
                      aria-label="从播放列表移除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!(flowViewMode === 'list' && selectedPlaylistItems.length > 0) && (
        <div className="absolute left-0 right-0 bottom-0 px-4 pb-4 pt-2">
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
      )}

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
                          {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="w-2 bg-white rounded-full animate-pulse"
                                style={{ height: `${(20 + Math.abs(Math.sin(i * 1.7)) * 80).toFixed(0)}%`, animationDelay: `${i * 0.1}s` }}
                              />
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
