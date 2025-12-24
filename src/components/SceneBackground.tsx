import { AnimatePresence, motion } from 'framer-motion';
import { type BackgroundEffectType } from '../config/scene-config';
import { NightQuietEffect } from './SceneBackground/NightQuietEffect';
import { LibraryEffect } from './SceneBackground/LibraryEffect';
import { SnowCityEffect } from './SceneBackground/SnowCityEffect';

interface SceneBackgroundProps {
  backgroundEffect: BackgroundEffectType;
  isActive: boolean;
}

export function SceneBackground({ backgroundEffect, isActive }: SceneBackgroundProps) {
  const renderEffect = () => {
    switch (backgroundEffect) {
      case 'night_quiet':
        return <NightQuietEffect />;
      case 'library':
        return <LibraryEffect />;
      case 'snow_city':
        return <SnowCityEffect />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isActive && backgroundEffect && (
        <motion.div
          key={`${backgroundEffect}-${isActive}`} // 添加 isActive 到 key，确保切换时能正确重新渲染
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {renderEffect()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

