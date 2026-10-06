import { ID } from './types';

export interface RecommendationFactor {
  category:
    | 'visual_feature'
    | 'style_affinity'
    | 'occasion_fit'
    | 'weather_fit'
    | 'maintenance_match'
    | 'color_harmony'
    | 'silhouette_balance'
    | 'preference_reinforcement';
  weight: number;
  score: number; // 0.0 - 1.0
  reason: string;
}

export interface Recommendation<T> {
  id: ID;
  item: T;
  score: number; // 0.00 - 1.00
  factors: RecommendationFactor[];
  reasons: string[]; // Primary human-readable explanations
  cautions?: string[]; // Edge cases or things to consider, e.g. "Requires product for texture hold"
  stylingAdvice?: string[];
  generatedAt: string;
}

export interface RankedResults<T> {
  recommendations: Recommendation<T>[];
  totalEvaluated: number;
  contextApplied: string;
  topAttributesHighlighted: string[];
}
