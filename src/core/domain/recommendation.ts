import { ID } from './types';
import { Outfit } from './fashion';
import { HairStyle, BeardStyle } from './grooming';

export type RecommendationTier = 'SAFE' | 'BEST_MATCH' | 'STRETCH';

export type ConfidenceState = 'STRONG' | 'GOOD' | 'EXPLORATORY' | 'NEED_MORE_INFO';

export interface RecommendationFactor {
  category:
    | 'visual_feature'
    | 'style_affinity'
    | 'occasion_fit'
    | 'weather_fit'
    | 'maintenance_match'
    | 'color_harmony'
    | 'silhouette_balance'
    | 'preference_reinforcement'
    | 'modesty_compliance'
    | 'wardrobe_priority';
  weight: number;
  score: number; // 0.0 - 1.0
  reason: string;
}

export interface Recommendation<T> {
  id: ID;
  item: T;
  score: number; // 0.00 - 1.00
  factors: RecommendationFactor[];
  reasons: string[]; // 2-3 primary honest explanations
  cautions?: string[]; // Edge cases or things to consider
  stylingAdvice?: string[];
  confidence: {
    state: ConfidenceState;
    explanation: string;
    toIncreaseConfidence?: string; // ONE concrete thing that would increase confidence
  };
  tier?: RecommendationTier;
  generatedAt: string;
}

export interface CompleteLook {
  id: ID;
  tier: RecommendationTier;
  tierRationale: string;
  outfit: Recommendation<Outfit>;
  hairStyle?: Recommendation<HairStyle>;
  groomingStyle?: Recommendation<BeardStyle>;
  confidence: {
    state: ConfidenceState;
    explanation: string;
    toIncreaseConfidence?: string;
  };
  overallHarmonyScore: number;
  reasons: string[];
  cautions: string[];
}

export interface TopThreeLooks {
  safe: CompleteLook;
  bestMatch: CompleteLook;
  stretch: CompleteLook;
  contextApplied: string;
  vetoedCandidateCount: number;
  evaluatedCandidateCount: number;
}

export interface RankedResults<T> {
  recommendations: Recommendation<T>[];
  totalEvaluated: number;
  contextApplied: string;
  topAttributesHighlighted: string[];
}
