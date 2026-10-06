import { ID, FitType, FormalityLevel, MaintenanceLevel } from './types';
import { VisualProfile } from './visual';
import { Feedback } from './feedback';

export interface PreferenceProfile {
  preferredStyleSlugs: string[];
  dislikedStyleSlugs: string[];
  preferredColors: string[];
  dislikedColors: string[];
  preferredFits: FitType[];
  dislikedFits: FitType[];
  preferredSilhouettes: string[];
  dislikedSilhouettes: string[];
  preferredFormalityRange: [FormalityLevel, FormalityLevel];
  maxMaintenanceTolerance: MaintenanceLevel;
  budgetTier?: 'accessible' | 'elevated' | 'investment';
  accentColorTolerance?: 'monochromatic' | 'subtle-accents' | 'bold-accents';
  accessoryAffinities: string[];
}

export interface FeedbackProfile {
  history: Feedback[];
  learnedStyleAffinities: Record<string, number>; // slug -> score offset [-1.0, 1.0]
  learnedColorAffinities: Record<string, number>; // color -> score offset [-1.0, 1.0]
  learnedSilhouetteAffinities: Record<string, number>;
  learnedFitAffinities: Record<string, number>;
}

export interface StyleProfile {
  id: ID;
  userId: ID;
  dominantAestheticSlugs: string[];
  preferences: PreferenceProfile;
  feedbackProfile: FeedbackProfile;
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
