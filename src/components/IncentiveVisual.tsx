import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IncentiveVisualProps {
  stage: number; // 0-5
  progress: number; // 0-1
}

/**
 * 激励体系视觉组件
 * 实现种子到森林的生长过程，包含复杂的SVG动画和视觉效果
 */
export const IncentiveVisual: React.FC<IncentiveVisualProps> = ({ stage, progress }) => {
  // 根据阶段计算缩放和视口
  // 种子(20%) -> 幼苗(40%) -> 小树(70%) -> 森林(100%)
  // Stage 0: Seed
  // Stage 1: Sprout
  // Stage 2-4: Tree (growing)
  // Stage 5: Forest
  
  const stageConfig = useMemo(() => {
    switch (stage) {
      case 0: return { scale: 0.8, viewBox: "0 0 200 200", name: "seed" };
      case 1: return { scale: 1.0, viewBox: "0 0 200 200", name: "sprout" };
      case 2: return { scale: 1.0, viewBox: "0 0 300 300", name: "sapling" };
      case 3: return { scale: 1.0, viewBox: "0 0 400 400", name: "tree" };
      case 4: return { scale: 1.0, viewBox: "0 0 500 500", name: "mature-tree" };
      case 5: return { scale: 1.0, viewBox: "0 0 600 400", name: "forest" }; // Wider view for forest
      default: return { scale: 1.0, viewBox: "0 0 400 400", name: "tree" };
    }
  }, [stage]);

  // CSS Keyframes defined as a style tag
  const styles = `
    @keyframes sway {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }
    @keyframes gentle-breeze {
      0%, 100% { transform: skewX(-1deg); }
      50% { transform: skewX(1deg); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    @keyframes bird-fly {
      0% { transform: translateX(-20px) translateY(10px) scale(0.5); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateX(120px) translateY(-20px) scale(0.8); opacity: 0; }
    }
    @keyframes sun-glow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    
    .leaf-sway { transform-origin: bottom center; animation: sway 4s ease-in-out infinite; }
    .tree-sway { transform-origin: bottom center; animation: gentle-breeze 6s ease-in-out infinite; }
    .bird-1 { animation: bird-fly 8s linear infinite; animation-delay: 0s; }
    .bird-2 { animation: bird-fly 9s linear infinite; animation-delay: 2s; }
    .bird-3 { animation: bird-fly 7s linear infinite; animation-delay: 4s; }
    .sun-pulse { transform-origin: center; animation: sun-glow 4s ease-in-out infinite; }
  `;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <style>{styles}</style>
      
      {/* 阳光光晕效果 - 始终存在但强度不同 */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
         <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="none">
           <defs>
             <radialGradient id="sunGradient" cx="80%" cy="20%" r="60%" fx="80%" fy="20%">
               <stop offset="0%" stopColor="#FFF7E6" stopOpacity="0.6" />
               <stop offset="100%" stopColor="#FFF7E6" stopOpacity="0" />
             </radialGradient>
           </defs>
           <circle cx="160" cy="40" r="100" fill="url(#sunGradient)" className="sun-pulse" />
         </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stageConfig.name}
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
          transition={{ 
            duration: 0.8,
            ease: "backOut" // 弹性缓动
          }}
          className="w-full h-full flex items-center justify-center"
        >
          {renderStageSVG(stage, progress)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const renderStageSVG = (stage: number, progress: number) => {
  // Common Definitions
  const defs = (
    <defs>
      {/* 种子金属质感 */}
      <radialGradient id="seedMetal" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#8B4513" />
        <stop offset="100%" stopColor="#3E1D0A" />
      </radialGradient>
      
      {/* 树叶渐变 */}
      <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7CFC00" />
        <stop offset="100%" stopColor="#228B22" />
      </linearGradient>
      
      {/* 树干纹理 */}
      <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8B4513" />
        <stop offset="20%" stopColor="#A0522D" />
        <stop offset="50%" stopColor="#8B4513" />
        <stop offset="80%" stopColor="#654321" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>

      {/* 阴影滤镜 */}
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="1" dy="1" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
    </defs>
  );

  // Stage 0: Seed (种子)
  if (stage === 0) {
    const seedScale = 1 + progress * 0.1; // Grow slightly within stage
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="mx-auto overflow-visible" preserveAspectRatio="xMidYMid meet">
        {defs}
        <g transform={`translate(50, 80) scale(${seedScale})`}>
          {/* 土壤颗粒 */}
          <g fill="#8B4513" opacity="0.6">
            <circle cx="-15" cy="5" r="2" />
            <circle cx="10" cy="8" r="1.5" />
            <circle cx="-8" cy="10" r="2.5" />
            <circle cx="18" cy="4" r="1" />
          </g>
          {/* 种子本体 - 放大显示 */}
          <ellipse 
            cx="0" cy="0" rx="10" ry="12" 
            fill="url(#seedMetal)" 
            filter="url(#dropShadow)"
            transform="rotate(-10)"
          >
            {/* 内发光动画 */}
            <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />
          </ellipse>
          {/* 萌芽微光 */}
          <circle cx="2" cy="-8" r="3" fill="#FFF" opacity="0.4" filter="blur(2px)">
             <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    );
  }

  // Stage 1: Sprout (幼苗)
  if (stage === 1) {
    const sproutScale = 1 + progress * 0.2; // Grow noticeably
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="mx-auto overflow-visible" preserveAspectRatio="xMidYMid meet">
        {defs}
        <g transform={`translate(50, 80) scale(${sproutScale})`}>
           {/* 土壤 */}
           <ellipse cx="0" cy="5" rx="20" ry="5" fill="#5D4037" opacity="0.5" />
           
           {/* 茎 */}
           <path d="M0,0 Q2,-15 5,-25" stroke="#4CAF50" strokeWidth="3" fill="none" className="leaf-sway" style={{ transformOrigin: 'bottom center' }} />
           
           {/* 叶片 */}
           <g className="leaf-sway" style={{ animationDelay: '0.2s' }}>
             <path d="M5,-25 Q15,-35 25,-25 Q15,-15 5,-25" fill="url(#leafGradient)" opacity="0.9" />
             <path d="M5,-25 Q-5,-35 -15,-25 Q-5,-15 5,-25" fill="url(#leafGradient)" opacity="0.8" />
           </g>
           
           {/* 露珠 */}
           <circle cx="18" cy="-25" r="1.5" fill="#E0F7FA" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
           </circle>
        </g>
      </svg>
    );
  }

  // Stage 2-4: Tree (小树 -> 大树)
  // Stage 2: Sapling (小树)
  // Stage 3: Young Tree (中树)
  // Stage 4: Mature Tree (大树)
  if (stage >= 2 && stage <= 4) {
    // 动态调整大小
    // Use progress to smooth the transition between stages
    const baseScale = stage === 2 ? 0.6 : stage === 3 ? 0.8 : 1.0;
    const sizeScale = baseScale + (progress * 0.15); 
    
    return (
      <svg width="100%" height="100%" viewBox="0 0 200 200" className="mx-auto overflow-visible" preserveAspectRatio="xMidYMid meet">
        {defs}
        <g transform={`translate(100, 180) scale(${sizeScale})`}>
           {/* 阴影 */}
           <ellipse cx="0" cy="10" rx="40" ry="8" fill="#000" opacity="0.1">
             <animate attributeName="rx" values="40;42;40" dur="6s" repeatCount="indefinite" />
           </ellipse>
           
           {/* 树干 */}
           <path d="M-10,10 L-5,-80 L5,-80 L10,10 Z" fill="url(#trunkGradient)" />
           
           {/* 年轮/纹理暗示 */}
           <path d="M-6,0 Q0,5 6,0" stroke="#3E1D0A" strokeWidth="0.5" opacity="0.3" fill="none" />
           <path d="M-5,-30 Q0,-25 5,-30" stroke="#3E1D0A" strokeWidth="0.5" opacity="0.3" fill="none" />
           
           {/* 树冠 Group */}
           <g transform="translate(0, -80)" className="tree-sway">
             {/* 递归生成树冠簇 */}
             <circle cx="0" cy="-20" r="40" fill="url(#leafGradient)" filter="url(#dropShadow)" />
             <circle cx="-25" cy="0" r="30" fill="#32CD32" opacity="0.8" />
             <circle cx="25" cy="0" r="30" fill="#32CD32" opacity="0.8" />
             
             {stage >= 3 && (
               <>
                <circle cx="-15" cy="-40" r="25" fill="#90EE90" opacity="0.9" />
                <circle cx="15" cy="-40" r="25" fill="#90EE90" opacity="0.9" />
               </>
             )}
             
             {stage >= 4 && (
               <>
                <circle cx="0" cy="-50" r="35" fill="#228B22" opacity="0.6" />
                <circle cx="-30" cy="-20" r="20" fill="#7CFC00" opacity="0.7" />
                <circle cx="30" cy="-20" r="20" fill="#7CFC00" opacity="0.7" />
               </>
             )}
           </g>
           
           {/* 掉落的叶子动画 (仅大树) */}
           {stage >= 4 && (
             <path d="M0,0 Q5,5 10,0" fill="#7CFC00" opacity="0">
               <animateMotion path="M10,-60 C20,-40 50,-20 60,100" dur="10s" repeatCount="indefinite" begin="2s" />
               <animate attributeName="opacity" values="0;1;0" dur="10s" repeatCount="indefinite" begin="2s" />
               <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite" />
             </path>
           )}
        </g>
      </svg>
    );
  }

  // Stage 5: Forest (森林)
  if (stage === 5) {
    // Subtle growth or breathing effect for the whole forest
    const forestScale = 1 + progress * 0.05;

    return (
      <svg width="100%" height="100%" viewBox="0 0 400 200" className="mx-auto overflow-visible" preserveAspectRatio="xMidYMid meet">
        {defs}
        <g transform={`scale(${forestScale})`} style={{ transformOrigin: 'bottom center' }}>
        
        {/* 远景树木 (模糊 + 淡色) */}
        <g transform="translate(50, 160) scale(0.6)" opacity="0.6" filter="blur(1px)">
           <rect x="-5" y="0" width="10" height="40" fill="#8B4513" />
           <circle cx="0" cy="0" r="25" fill="#228B22" />
        </g>
        <g transform="translate(350, 150) scale(0.7)" opacity="0.6" filter="blur(1px)">
           <rect x="-5" y="0" width="10" height="40" fill="#8B4513" />
           <circle cx="0" cy="0" r="30" fill="#228B22" />
        </g>

        {/* 中景树木 */}
        <g transform="translate(120, 180) scale(0.8)">
           <rect x="-8" y="0" width="16" height="50" fill="url(#trunkGradient)" />
           <g className="tree-sway" style={{ animationDuration: '7s' }}>
             <circle cx="0" cy="0" r="35" fill="url(#leafGradient)" />
             <circle cx="-20" cy="10" r="25" fill="#32CD32" />
             <circle cx="20" cy="10" r="25" fill="#32CD32" />
           </g>
        </g>
        
        <g transform="translate(280, 180) scale(0.9)">
           <rect x="-8" y="0" width="16" height="55" fill="url(#trunkGradient)" />
           <g className="tree-sway" style={{ animationDuration: '5s' }}>
             <circle cx="0" cy="-10" r="40" fill="url(#leafGradient)" />
             <circle cx="-25" cy="5" r="28" fill="#32CD32" />
           </g>
        </g>

        {/* 主树 (前景) */}
        <g transform="translate(200, 190) scale(1.1)">
           <filter id="mainGlow">
             <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FFD700" floodOpacity="0.3" />
           </filter>
           <rect x="-10" y="0" width="20" height="60" fill="url(#trunkGradient)" />
           <g className="tree-sway" filter="url(#mainGlow)">
             <circle cx="0" cy="-20" r="50" fill="url(#leafGradient)" />
             <circle cx="-30" cy="0" r="35" fill="#228B22" opacity="0.8" />
             <circle cx="30" cy="0" r="35" fill="#228B22" opacity="0.8" />
             <circle cx="0" cy="-50" r="30" fill="#7CFC00" opacity="0.6" />
           </g>
        </g>

        {/* 鸟群动画 */}
        <g className="bird-1" transform="translate(50, 50) scale(0.5)">
           <path d="M0,0 Q5,-5 10,0 Q5,5 0,0 M10,0 Q15,-5 20,0 Q15,5 10,0" fill="#333" />
        </g>
        <g className="bird-2" transform="translate(100, 80) scale(0.4)">
           <path d="M0,0 Q5,-5 10,0 Q5,5 0,0 M10,0 Q15,-5 20,0 Q15,5 10,0" fill="#333" />
        </g>
        <g className="bird-3" transform="translate(20, 100) scale(0.3)">
           <path d="M0,0 Q5,-5 10,0 Q5,5 0,0 M10,0 Q15,-5 20,0 Q15,5 10,0" fill="#333" />
        </g>
        </g>
      </svg>
    );
  }

  return null;
};
