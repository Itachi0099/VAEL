import {
  ID,
  FitType,
  FormalityLevel,
  MaintenanceLevel,
  ModestyLevel,
  UndertonePreference,
  ContrastLevel,
  HeightRange,
  TorsoLegPreference,
  ShoulderHipBalance,
  GenderIdentity,
  StyleExpression,
} from './types';
import { VisualProfile } from './visual';
import { Feedback } from './feedback';
import { StyleVector, GenderCodingDirection } from './style-axis';
import { EvidenceSignal } from './evidence';

export interface FitProportionProfile {
  preferredFits: FitType[];
  dislikedFits: FitType[];
  topVolume: number; // 1 (close/fitted) to 5 (oversized/voluminous)
  bottomVolume: number; // 1 (slim/fitted) to 5 (wide/draped)
  preferredSilhouettes: string[];
  dislikedSilhouettes: string[];
  layeringPreference: 'minimal' | 'moderate' | 'complex';
  garmentLengthPreferences: {
    top?: 'cropped' | 'regular' | 'extended';
    bottom?: 'ankle' | 'regular' | 'full-break';
  };
}

export interface PreferenceProfile {
  preferredStyleSlugs: string[];
  dislikedStyleSlugs: string[];
  preferredColors: string[];
  dislikedColors: string[];
  preferredFits: FitType[];
  dislikedFits: FitType[];
  preferredSilhouettes: string[];
  dislikedSilhouettes: string[];
  fitProportions: FitProportionProfile;
  modestyLevel: ModestyLevel;
  userConfirmedUndertone: UndertonePreference;
  contrastLevel?: ContrastLevel;
  traditionConstraint?: string; // Optional tradition layer constraint (e.g. 'unspecified', or specific heritage)
  genderIdentity?: GenderIdentity; // Optional gender context (ZERO scoring weight, does not filter garments)
  genderCodingDirection: GenderCodingDirection; // Backwards compatible with existing evaluation corpus
  styleExpression?: StyleExpression; // Stated style expression ('masculine' | 'feminine' | 'androgynous' | 'no-preference')
  heightRange?: HeightRange;
  torsoLegPreference?: TorsoLegPreference;
  shoulderHipBalance?: ShoulderHipBalance;
  preferredFormalityRange: [FormalityLevel, FormalityLevel];
  maxMaintenanceTolerance: MaintenanceLevel;
  budgetTier?: 'accessible' | 'elevated' | 'investment' | 'unspecified';
  accentColorTolerance?: 'monochromatic' | 'subtle-accents' | 'bold-accents';
  accessoryAffinities: string[];
}

export interface FeedbackProfile {
  history: Feedback[];
  learnedStyleAffinities: Record<string, number>; // slug -> score offset [-1.0, 1.0]
  learnedColorAffinities: Record<string, number>; // color -> score offset [-1.0, 1.0]
  learnedSilhouetteAffinities: Record<string, number>;
  learnedFitAffinities: Record<string, number>;
  repeatPassCount: {
    oversized?: number;
    brightColors?: number;
    tailored?: number;
    highMaintenance?: number;
    [key: string]: number | undefined;
  };
}

export interface StyleProfile {
  id: ID;
  userId: ID;
  dominantAestheticSlugs: string[];
  styleVector: StyleVector;
  preferences: PreferenceProfile;
  feedbackProfile: FeedbackProfile;
  evidenceSignals?: {
    hairTexture?: EvidenceSignal<string>;
    faceShape?: EvidenceSignal<string>;
    undertone?: EvidenceSignal<string>;
    styleVector?: EvidenceSignal<StyleVector>;
    modesty?: EvidenceSignal<ModestyLevel>;
  };
  updatedAt: string;
}

export interface User {
  id: ID;
  name: string;
  handle: string;
  createdAt: string;
  visualProfile?: VisualProfile;
  styleProfile: StyleProfile;
}
