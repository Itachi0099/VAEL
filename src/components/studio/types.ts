import { Garment, Outfit, CompleteLook, RecommendationFactor } from '../../core/domain';
import { User } from '../../core/domain/user';
import { Context } from '../../core/domain/context';

export type StudioSlotType = 'top' | 'bottom' | 'one-piece' | 'outerwear' | 'footwear' | 'accessory';

export interface StudioPieceSlot {
  slotType: StudioSlotType;
  garment: Garment;
  layerPosition: number;
  stylingNote?: string;
  isLocked: boolean;
}

export interface StudioLookState {
  id: string;
  title: string;
  isCustom: boolean;
  alternativeIndex?: number;
  confidence: {
    state: 'STRONG' | 'GOOD' | 'EXPLORATORY' | 'NEED_MORE_INFO';
    score: number;
    explanation: string;
  };
  reasons: string[];
  cautions: string[];
  slots: Record<StudioSlotType, StudioPieceSlot | null>;
  outfit: Outfit;
  totalScore: number;
}

export interface AvatarAppearance {
  skinTone: string;
  skinDepth: 'fair' | 'light' | 'medium' | 'rich' | 'deep';
  undertone: 'cool' | 'warm' | 'neutral' | 'olive';
  isAssumedTone: boolean;
  hairTexture: 'straight' | 'wavy' | 'curly' | 'coily' | 'locs' | 'braids' | 'twists';
  hairLength: 'buzz' | 'short' | 'medium' | 'shoulder' | 'long';
  hairColor: string;
  facialHairStyle?: string;
}

export interface StudioSession {
  currentLook: StudioLookState;
  history: StudioLookState[];
  historyIndex: number;
  lockedGarmentSlugs: Set<string>;
  appearance: AvatarAppearance;
  selectedSlot: StudioSlotType | null;
  activeTab: '3d' | '2d';
}
