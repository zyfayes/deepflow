import { Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrinterDeviceProps {
  printedContents: Array<{ id: string; content: string; timestamp: number }>;
  transcription?: { source: 'input' | 'output'; text: string } | null;
  onPrintClick?: () => void;
}

// 纸张堆叠计算工具函数
// 使用伪随机算法生成稳定的、自然的堆叠效果
function calculatePaperPosition(
  index: number, 
  total: number, 
  baseOffset: number = 20,
  spacing: number = 140
) {
  // 反转索引：让最新的（数组末尾的）在更靠上的位置
  // 索引 0（最旧的）在最下面，索引越大（越新的）越靠上
  const reversedIndex = total - 1 - index;
  
  // 垂直偏移：反转后的索引越小，位置越靠下（verticalOffset 越大）
  // 轻微压缩间距（模拟重力挤压）
  const compressionFactor = Math.min(1 + reversedIndex * 0.02, 1.1); // 最多压缩10%
  const verticalOffset = baseOffset + reversedIndex * spacing * compressionFactor;
  
  // 改进的伪随机水平偏移：生成更均匀分布在中心附近的值
  // 范围在 -5px 到 +5px，使用更强的中心集中策略
  const seed1 = index * 137.5; // 使用黄金角度近似值作为种子
  const seed2 = index * 89.3; // 另一个角度值用于增加随机性
  // 使用两个不同的三角函数，生成基础随机值（加权平均确保更均匀）
  const sinValue = Math.sin(seed1);
  const cosValue = Math.cos(seed2);
  const baseRandom = (sinValue + cosValue) / 2; // -1 到 1 之间，平均分布
  
  // 应用更强的非线性映射（立方函数），使值更集中在中心
  // 立方函数比平方函数更能压缩远离中心的值
  const sign = baseRandom >= 0 ? 1 : -1;
  const absValue = Math.abs(baseRandom);
  // 使用立方根的反函数（立方）来压缩，让值更集中在 0 附近
  const concentratedValue = sign * (absValue * absValue * absValue); // 立方后值更强烈集中在中心
  // 减小最大偏移范围，从 10px 改为 5px，让整体更居中
  const horizontalOffset = concentratedValue * 5; // -5px 到 +5px，强烈集中在中心附近
  
  // 伪随机旋转角度：-2.5° 到 +2.5°
  const rotation = Math.cos(seed1 * 1.3) * 2.5;
  
  // z-index: 最新的（索引大的）在上层，使用较大的基数确保层级清晰
  const zIndex = index + 100; // 索引越大，z-index 越大，越在上层
  
  // 阴影深度：随着层数（反转后的索引）增加而加深，但有上限
  const shadowDepth = Math.min(reversedIndex * 0.12 + 0.3, 1.4);
  
  return {
    verticalOffset,
    horizontalOffset,
    rotation,
    zIndex,
    shadowDepth
  };
}

export function PrinterDevice({ 
  printedContents, 
  transcription,
  onPrintClick
}: PrinterDeviceProps) {
  return (
    <div className="flex flex-col items-center w-full h-full">
        {/* Printer Visual */}
        <div className="relative w-72 h-48 bg-white rounded-[2rem] shadow-2xl border border-neutral-100 flex flex-col items-center justify-end pb-6 z-10 ring-1 ring-black/5 mb-6 shrink-0">
            
            {/* Paper Animation - 优化后的叠放效果 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ perspective: '1000px' }}>
              <AnimatePresence>
                {printedContents.map((item, index) => {
                  const { verticalOffset, horizontalOffset, rotation, zIndex, shadowDepth } = 
                    calculatePaperPosition(index, printedContents.length);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ 
                        y: -60,
                        opacity: 0,
                        rotateX: -20,
                        rotateZ: 0,
                        scale: 0.9,
                        x: 0
                      }}
                      animate={{ 
                        y: verticalOffset,
                        opacity: 1,
                        rotateX: 0,
                        rotateZ: rotation,
                        scale: 1,
                        x: horizontalOffset
                      }}
                      exit={{ 
                        y: verticalOffset + 100,
                        opacity: 0,
                        rotateZ: rotation + 5,
                        scale: 0.95
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 70,
                        damping: 18,
                        mass: 0.9,
                        // 添加轻微的弹跳效果
                        bounce: 0.2
                      }}
                      className="absolute w-48 border border-neutral-200/80 p-4 text-[10px] font-mono text-neutral-700 origin-top"
                      style={{
                        bottom: -140,
                        left: '50%',
                        marginLeft: '-96px', // w-48 = 192px, 所以 marginLeft 应该是 -96px 来居中
                        zIndex: zIndex,
                        transformStyle: 'preserve-3d',
                        backgroundColor: '#fffdf0',
                        // 纸张纹理：点状纹理模拟纸张质感
                        backgroundImage: `
                          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.015) 1px, transparent 0),
                          linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 30%, rgba(0,0,0,0.015) 100%)
                        `,
                        backgroundSize: '8px 8px, 100% 100%',
                        // 多层阴影：模拟纸张堆叠的深度和自然光照
                        boxShadow: `
                          ${horizontalOffset * 0.4}px ${verticalOffset * 0.25}px ${shadowDepth * 10}px rgba(0, 0, 0, ${0.12 + shadowDepth * 0.08}),
                          0 1px 3px rgba(0, 0, 0, 0.08),
                          inset 0 1px 0 rgba(255, 255, 255, 0.95),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.02)
                        `,
                      }}
                    >
                      {/* 纸张内容 */}
                      <div className="relative z-10">
                        <div className="border-b border-neutral-300 pb-2 mb-2 text-center font-bold tracking-widest text-neutral-800">
                          DEEPFLOW NOTE
                        </div>
                        <div className="leading-relaxed whitespace-pre-wrap text-neutral-700">
                          {item.content}
                        </div>
                        <div className="mt-4 text-center opacity-30 text-[8px]">-- END --</div>
                      </div>
                      
                      {/* 纸张边缘高光（模拟纸张厚度和反光） */}
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-sm"
                        style={{
                          border: '1px solid rgba(255, 255, 255, 0.7)',
                          boxShadow: `
                            inset 0 1px 1px rgba(255, 255, 255, 0.8),
                            inset 0 -1px 1px rgba(0, 0, 0, 0.03),
                            inset 1px 0 1px rgba(255, 255, 255, 0.6),
                            inset -1px 0 1px rgba(0, 0, 0, 0.02)
                          `
                        }}
                      />
                      {/* 纸张顶部边缘的反光效果 */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 pointer-events-none rounded-t-sm"
                        style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)'
                        }}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bottom Slot Overlay - 打印机出口的视觉效果 */}
            <div className="absolute -bottom-2 w-56 h-4 bg-gradient-to-b from-gray-200/60 to-gray-100/40 rounded-b-2xl blur-sm -z-20" />
            <div className="absolute bottom-0 w-48 h-2 bg-neutral-300/50 rounded-full mb-1 blur-[2px]" />


            {/* Screen - LCD Display with Transcription */}
            <div className="w-32 h-20 bg-neutral-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden border-4 border-neutral-800 relative shadow-inner">
                <div className="absolute inset-0 bg-green-500/5" />
                <div className="text-green-500 font-mono text-xs p-2 z-10 w-full h-full flex flex-col justify-center items-center">
                    {transcription ? (
                        <div className="w-full h-full flex flex-col justify-center items-start px-1">
                            <div className="text-[8px] opacity-60 mb-0.5">
                                {transcription.source === 'input' ? '> 用户' : '> AI'}
                            </div>
                            <div className="text-[9px] leading-tight line-clamp-3 overflow-hidden">
                                {transcription.text.length > 30 
                                    ? transcription.text.substring(0, 30) + '...' 
                                    : transcription.text}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {printedContents.length > 0 ? `> 打印中... (${printedContents.length})` : "> 就绪_"}
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center">
                 <div 
                   onClick={onPrintClick}
                   className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95 transition-transform cursor-pointer border-2 border-orange-400 hover:bg-orange-600"
                 >
                    <Printer size={20} className="text-white" />
                </div>
            </div>
            
            {/* Paper Slot Visual (Bottom) */}
            <div className="absolute bottom-0 w-48 h-1 bg-neutral-300 rounded-full mb-2" />
        </div>

    </div>
  );
}
