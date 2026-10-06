import { RecommendationFactor } from '../domain/recommendation';

export interface ScoreBreakdown {
  finalScore: number; // 0.00 to 1.00
  factors: RecommendationFactor[];
}

/**
 * Calculates a normalized weighted score from individual evaluation factors.
 * Ensures total weight is normalized and bounds are strictly [0.0, 1.0].
 */
export function computeWeightedScore(factors: RecommendationFactor[]): ScoreBreakdown {
  if (factors.length === 0) {
    return { finalScore: 0.5, factors: [] };
  }

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight <= 0) {
    return { finalScore: 0.5, factors };
  }

  const rawWeightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const normalizedScore = rawWeightedSum / totalWeight;

  // Round to 2 decimal places for clean, transparent reporting
  const clampedScore = Math.max(0.0, Math.min(1.0, Math.round(normalizedScore * 100) / 100));

  return {
    finalScore: clampedScore,
    factors,
  };
}
