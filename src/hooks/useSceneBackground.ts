import { useState, useEffect, useCallback } from 'react';
import { type SceneTag, type BackgroundEffectType, SCENE_CONFIGS } from '../config/scene-config';

export function useSceneBackground(sceneTag: SceneTag) {
  const [isActive, setIsActive] = useState(false);
  const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffectType>(null);

  useEffect(() => {
    const config = SCENE_CONFIGS[sceneTag];
    setBackgroundEffect(config.backgroundEffect);
    // 当场景切换时，如果新场景没有背景效果，自动关闭
    if (!config.backgroundEffect) {
      setIsActive(false);
    }
  }, [sceneTag]);

  const activate = useCallback(() => {
    const config = SCENE_CONFIGS[sceneTag];
    if (config.backgroundEffect) {
      setIsActive(true);
    }
  }, [sceneTag]);

  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  const toggle = useCallback(() => {
    setIsActive(prev => {
      if (prev) {
        return false;
      } else {
        const config = SCENE_CONFIGS[sceneTag];
        return config.backgroundEffect !== null;
      }
    });
  }, [sceneTag]);

  return {
    isActive,
    backgroundEffect,
    activate,
    deactivate,
    toggle
  };
}

