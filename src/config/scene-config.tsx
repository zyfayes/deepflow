import { Car, Home, Focus, Moon, RefreshCw, Radio, MessageCircle } from 'lucide-react';

export type SceneTag = 'commute' | 'home_charge' | 'focus' | 'sleep_meditation' | 'qa_memory' | 'daily_review' | 'default';

export type BackgroundEffectType = 'night_quiet' | 'library' | 'snow_city' | null;

export const SCENE_CONFIGS: Record<SceneTag, { 
  tag: SceneTag; 
  label: string; 
  icon: any; 
  description: string;
  backgroundEffect: BackgroundEffectType;
  audioPrompt?: string;
}> = {
  commute: {
    tag: 'commute',
    label: '回家路上',
    icon: Car,
    description: '通勤、步行或驾驶途中',
    backgroundEffect: 'snow_city',
    audioPrompt: '/assets/audio/prompts/snow-commute.mp3'
  },
  home_charge: {
    tag: 'home_charge',
    label: '在家充电',
    icon: Home,
    description: '居家恢复',
    backgroundEffect: null
  },
  focus: {
    tag: 'focus',
    label: '静坐专注',
    icon: Focus,
    description: '专注学习',
    backgroundEffect: 'library',
    audioPrompt: '/assets/audio/prompts/library-study.mp3'
  },
  sleep_meditation: {
    tag: 'sleep_meditation',
    label: '睡前冥想',
    icon: Moon,
    description: '睡前放松',
    backgroundEffect: 'night_quiet',
    audioPrompt: '/assets/audio/prompts/night-quiet.mp3'
  },
  qa_memory: {
    tag: 'qa_memory',
    label: '问答式记忆',
    icon: MessageCircle,
    description: '记忆强化',
    backgroundEffect: 'library',
    audioPrompt: '/assets/audio/prompts/library-study.mp3'
  },
  daily_review: {
    tag: 'daily_review',
    label: '今日复盘',
    icon: RefreshCw,
    description: '今日学习复盘',
    backgroundEffect: 'library',
    audioPrompt: '/assets/audio/prompts/library-study.mp3'
  },
  default: {
    tag: 'default',
    label: '默认',
    icon: Radio,
    description: '通用场景',
    backgroundEffect: null
  }
};
