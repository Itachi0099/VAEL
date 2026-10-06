import {
  FaceShape,
  JawCharacteristic,
  HairTexture,
  HairDensity,
  HairLength,
  HairVolume,
  BeardLength,
  BeardDensity,
  BodySilhouette,
} from './types';

/**
 * Observed Face Proportions (stylistic geometry signals, purely non-judgmental)
 */
export interface FaceProportions {
  foreheadRatio?: 'compact' | 'balanced' | 'elongated';
  cheekboneProminence?: 'subtle' | 'moderate' | 'high';
  facialThirdsBalance?: 'balanced' | 'longer-lower' | 'longer-upper';
}

/**
 * Observed Face Profile derived from visual analysis or user specification
 */
export interface FaceProfile {
  shape: FaceShape;
  jaw: JawCharacteristic;
  proportions?: FaceProportions;
  hasFacialHair: boolean;
  beardCharacteristics?: {
    currentLength: BeardLength;
    observedDensity: BeardDensity;
    growthPattern?: 'full' | 'goatee-dominant' | 'jawline-only' | 'patchy';
  };
}

/**
 * Observed Hair Profile
 */
export interface HairProfile {
  texture: HairTexture;
  density: HairDensity;
  length: HairLength;
  volume: HairVolume;
  currentStyleDescription?: string;
  hairline?: 'straight' | 'rounded' | 'widows-peak' | 'receding' | 'mature';
  colorTone?: 'dark' | 'medium' | 'light' | 'silver' | 'custom';
}

/**
 * Observed Body Profile (focusing strictly on silhouette balance and fit geometry)
 */
export interface BodyProfile {
  silhouette: BodySilhouette;
  shoulderToHipRatio?: 'broad-shoulders' | 'balanced' | 'wider-hips';
  torsoToLegRatio?: 'balanced' | 'longer-torso' | 'longer-legs';
  heightImpression?: 'compact' | 'average' | 'tall';
}

/**
 * Complete Observed Visual Profile of a person.
 * STRICT PRINCIPLE: Represents ONLY objective styling signals detected/input,
 * never subjective attractiveness judgments or unchangeable identity assumptions.
 */
export interface VisualProfile {
  id: string;
  userId: string;
  face: FaceProfile;
  hair: HairProfile;
  body: BodyProfile;
  source: 'visual_analysis' | 'user_input' | 'hybrid';
  confidenceScore?: number; // 0.0 - 1.0 confidence from visual analyzer
  lastObservedAt: string;
}
