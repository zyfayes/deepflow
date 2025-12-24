import { Car, Home, Focus, Moon, RefreshCw, Radio, MessageCircle } from 'lucide-react';

export type SceneTag = 'commute' | 'home_charge' | 'focus' | 'sleep_meditation' | 'qa_memory' | 'daily_review' | 'default';

export const SCENE_CONFIGS: Record<SceneTag, { tag: SceneTag; label: string; icon: any; description: string }> = {
  commute: {
    tag: 'commute',
    label: '回家路上',
    icon: Car,
    description: '通勤、步行或驾驶途中'
  },
  home_charge: {
    tag: 'home_charge',
    label: '在家充电',
    icon: Home,
    description: '居家恢复'
  },
  focus: {
    tag: 'focus',
    label: '静坐专注',
    icon: Focus,
    description: '专注学习'
  },
  sleep_meditation: {
    tag: 'sleep_meditation',
    label: '睡前冥想',
    icon: Moon,
    description: '睡前放松'
  },
  qa_memory: {
    tag: 'qa_memory',
    label: '问答式记忆',
    icon: MessageCircle,
    description: '记忆强化'
  },
  daily_review: {
    tag: 'daily_review',
    label: '今日复盘',
    icon: RefreshCw,
    description: '今日学习复盘'
  },
  default: {
    tag: 'default',
    label: '默认',
    icon: Radio,
    description: '通用场景'
  }
};
