import { User, PreferenceProfile, FeedbackProfile } from '../../src/core/domain/user';
import { VisualProfile } from '../../src/core/domain/visual';
import { Context } from '../../src/core/domain/context';
import { TopThreeLooks } from '../../src/core/domain/recommendation';
import { StyleVector } from '../../src/core/domain/style-axis';

export interface EvaluationScenario {
  id: string;
  name: string;
  category:
    | 'physics_climate'
    | 'taste_feedback'
    | 'silhouette_proportions'
    | 'evidence_authority'
    | 'color_undertone'
    | 'modesty_cultural'
    | 'grooming_hair'
    | 'wardrobe_priority'
    | 'uncertainty_confidence'
    | 'occasion_formality';
  description: string;
  user: User;
  context?: Context;
  assertions: (result: TopThreeLooks) => { passed: boolean; message: string }[];
}

export const BASE_STYLE_VECTOR: StyleVector = {
  formality: 3,
  structure: 3,
  volume: 3,
  colorIntensity: 2,
  contrast: 3,
  pattern: 1,
  texture: 3,
  ornamentation: 1,
  classicTrend: 3,
  utilityPolish: 3,
  genderCoding: 'androgynous',
};

export const BASE_PREFERENCES: PreferenceProfile = {
  preferredStyleSlugs: ['minimal', 'smart-casual'],
  dislikedStyleSlugs: [],
  preferredColors: ['black', 'charcoal', 'off-white'],
  dislikedColors: [],
  preferredFits: ['relaxed', 'regular'],
  dislikedFits: [],
  preferredSilhouettes: ['clean-drape'],
  dislikedSilhouettes: [],
  fitProportions: {
    preferredFits: ['relaxed', 'regular'],
    dislikedFits: [],
    topVolume: 3,
    bottomVolume: 3,
    preferredSilhouettes: ['clean-drape'],
    dislikedSilhouettes: [],
    layeringPreference: 'moderate',
    garmentLengthPreferences: {},
  },
  modestyLevel: 'standard',
  userConfirmedUndertone: 'neutral',
  genderCodingDirection: 'androgynous',
  preferredFormalityRange: [2, 4],
  maxMaintenanceTolerance: 'moderate',
  accessoryAffinities: [],
};

export const BASE_FEEDBACK: FeedbackProfile = {
  history: [],
  learnedStyleAffinities: {},
  learnedColorAffinities: {},
  learnedSilhouetteAffinities: {},
  learnedFitAffinities: {},
  repeatPassCount: {},
};
