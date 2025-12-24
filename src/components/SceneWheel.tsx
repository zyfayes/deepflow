import { motion } from 'framer-motion';
import clsx from 'clsx';
import { SCENE_CONFIGS, type SceneTag } from '../config/scene-config';

interface SceneWheelProps {
  currentSceneTag: SceneTag;
  onSceneChange: (tag: SceneTag) => void;
  availableScenes: SceneTag[];
  theme?: 'dark' | 'light';
}

export function SceneWheel({ 
  currentSceneTag, 
  onSceneChange, 
  availableScenes, 
  theme = 'dark' 
}: SceneWheelProps) {
  
  // Show even if only 1 scene, but hide arrows
  if (availableScenes.length === 0) return null;

  const currentSceneIndex = availableScenes.indexOf(currentSceneTag);
  const isSingleScene = availableScenes.length <= 1;

  const prevIndex = (currentSceneIndex - 1 + availableScenes.length) % availableScenes.length;
  const nextIndex = (currentSceneIndex + 1) % availableScenes.length;
  
  // Safety check for empty array handled above, but indices need care if length is 1
  const prevScene = availableScenes.length > 0 ? SCENE_CONFIGS[availableScenes[prevIndex]] : SCENE_CONFIGS['default'];
  const currentScene = SCENE_CONFIGS[currentSceneTag] || SCENE_CONFIGS['default'];
  const nextScene = availableScenes.length > 0 ? SCENE_CONFIGS[availableScenes[nextIndex]] : SCENE_CONFIGS['default'];

  const handlePrev = () => {
    if (availableScenes.length > 0) {
        onSceneChange(availableScenes[prevIndex]);
    }
  };

  const handleNext = () => {
    if (availableScenes.length > 0) {
        onSceneChange(availableScenes[nextIndex]);
    }
  };

  // Theme styles
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-neutral-800';
  const textSecondary = theme === 'dark' ? 'text-white/50' : 'text-neutral-500';
  const textTertiary = theme === 'dark' ? 'text-white/30' : 'text-neutral-400';
  const iconPrimary = theme === 'dark' ? 'text-white' : 'text-indigo-600';
  const iconSecondary = theme === 'dark' ? 'text-white/40' : 'text-neutral-400';
  const bgCirclePrimary = theme === 'dark' 
    ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-white/20 shadow-indigo-500/20' 
    : 'bg-white border-indigo-100 shadow-indigo-100';
  const bgCircleSecondary = theme === 'dark'
    ? 'bg-white/5 border-white/10 hover:bg-white/10'
    : 'bg-neutral-50 border-neutral-100 hover:bg-neutral-100';
  const indicatorActive = theme === 'dark' ? 'bg-white' : 'bg-indigo-600';
  const indicatorInactive = theme === 'dark' ? 'bg-white/30' : 'bg-neutral-200';

  return (
    <div className="flex flex-col items-center gap-2 mb-2 w-full">
      {/* Horizontal Scene Switcher */}
      <div className="flex items-center justify-center gap-2 w-full px-1">
        {/* Previous Scene (Left) - Only show if multiple scenes */}
        {!isSingleScene && (
          <motion.div
              layout
              initial={{ opacity: 0.3, scale: 0.8, x: 20 }}
              animate={{ opacity: 0.4, scale: 0.85, x: 0 }}
              className="flex flex-col items-center gap-1 cursor-pointer z-0 active:scale-95 transition-transform w-12"
              onClick={handlePrev}
          >
              <div className={clsx("w-8 h-8 rounded-full border flex items-center justify-center transition-colors", bgCircleSecondary)}>
                <prevScene.icon size={14} className={iconSecondary} />
              </div>
              <span className={clsx("text-[8px] font-medium truncate w-full text-center", textTertiary)}>{prevScene.label}</span>
          </motion.div>
        )}

        {/* Current Scene (Center) */}
        <motion.div
          layout
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-1 z-10 mx-1 w-20"
        >
          <motion.div
            layout
            className={clsx("w-14 h-14 rounded-full border flex items-center justify-center shadow-md", bgCirclePrimary)}
            whileHover={{ scale: 1.05 }}
          >
            <currentScene.icon size={24} className={iconPrimary} />
          </motion.div>
          <div className="flex flex-col items-center gap-0.5 w-full">
            <span className={clsx("text-xs font-bold truncate w-full text-center", textPrimary)}>{currentScene.label}</span>
            <span className={clsx("text-[9px] truncate w-full text-center", textSecondary)}>{currentScene.description}</span>
          </div>
        </motion.div>

        {/* Next Scene (Right) - Only show if multiple scenes */}
        {!isSingleScene && (
          <motion.div
              layout
              initial={{ opacity: 0.3, scale: 0.8, x: -20 }}
              animate={{ opacity: 0.4, scale: 0.85, x: 0 }}
              className="flex flex-col items-center gap-1 cursor-pointer z-0 active:scale-95 transition-transform w-12"
              onClick={handleNext}
          >
              <div className={clsx("w-8 h-8 rounded-full border flex items-center justify-center transition-colors", bgCircleSecondary)}>
                <nextScene.icon size={14} className={iconSecondary} />
              </div>
              <span className={clsx("text-[8px] font-medium truncate w-full text-center", textTertiary)}>{nextScene.label}</span>
          </motion.div>
        )}
      </div>

      {/* Scene Indicators - Only show if multiple scenes */}
      {!isSingleScene && (
          <div className="flex gap-1.5">
          {availableScenes.map((tag, index) => (
              <div
              key={tag}
              className={clsx(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentSceneIndex ? clsx(indicatorActive, "w-6") : indicatorInactive
              )}
              />
          ))}
          </div>
      )}
    </div>
  );
}
