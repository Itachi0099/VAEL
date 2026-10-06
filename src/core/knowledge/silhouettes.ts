import { FitType } from '../domain/types';
import { Garment } from '../domain/fashion';

export interface SilhouetteEvaluation {
  harmonyScore: number; // 0.0 - 1.0
  isProportional: boolean;
  structureDescription: string;
  advice: string[];
}

/**
 * Silhouette proportion rule evaluation
 * Checks classic and editorial proportion formulas:
 * 1. Fitted top + Wide/Relaxed bottom (A-frame, high aesthetic appeal)
 * 2. Oversized/Boxy top + Straight/Tapered bottom (Inverted triangle, strong streetwear/modern tailoring)
 * 3. Boxy top + Wide bottom (Voluminous drape, avant-garde / relaxed editorial)
 * 4. Skinny top + Skinny bottom (often outdated without intentional layering)
 */
export function evaluateSilhouette(top?: Garment, bottom?: Garment, outer?: Garment): SilhouetteEvaluation {
  if (!top || !bottom) {
    return {
      harmonyScore: 0.7,
      isProportional: true,
      structureDescription: 'Partial silhouette specification',
      advice: ['Combine both top and lower foundation to evaluate full proportion balance.'],
    };
  }

  const topFit = top.fit;
  const bottomFit = bottom.fit;

  const isBottomWide = bottomFit === 'relaxed' || bottomFit === 'oversized' || bottom.silhouette.includes('wide');

  // Rule 1: Boxy / Oversized top + Relaxed / Wide bottom
  if ((topFit === 'boxy' || topFit === 'oversized') && isBottomWide) {
    return {
      harmonyScore: 0.93,
      isProportional: true,
      structureDescription: 'Contemporary relaxed drape with intentional volumetric presence',
      advice: ['Keep footwear structured (e.g. chunky derbies or solid boots) to ground the drape.'],
    };
  }

  // Rule 2: Slim / Tailored top + Wide / Relaxed bottom
  if ((topFit === 'slim' || topFit === 'regular') && isBottomWide) {
    return {
      harmonyScore: 0.95,
      isProportional: true,
      structureDescription: 'Classic high-waist / wide-leg balance (architectural lower volume)',
      advice: ['Tuck in the top to accentuate waistline geometry and elongate leg line.'],
    };
  }

  // Rule 3: Oversized / Boxy top + Slim / Tailored bottom
  if ((topFit === 'oversized' || topFit === 'boxy') && (bottomFit === 'slim' || bottomFit === 'tailored')) {
    return {
      harmonyScore: 0.88,
      isProportional: true,
      structureDescription: 'Upper volumetric emphasis with streamlined lower anchor',
      advice: ['Ideal for layering; consider ankle crop or clean break on trousers.'],
    };
  }

  // Rule 4: Regular + Regular or Tailored + Tailored
  if ((topFit === 'regular' || topFit === 'tailored') && (bottomFit === 'regular' || bottomFit === 'tailored')) {
    return {
      harmonyScore: 0.9,
      isProportional: true,
      structureDescription: 'Balanced timeless silhouette with clean linear cadence',
      advice: ['Elevate with textured fabrication and deliberate footwear choice.'],
    };
  }

  // Caution case: Skinny + Skinny
  if (topFit === 'skinny' && bottomFit === 'skinny') {
    return {
      harmonyScore: 0.62,
      isProportional: false,
      structureDescription: 'Uniformly compressed silhouette lacking spatial dynamic',
      advice: ['Introduce volume via an unbuttoned relaxed overshirt or boxy jacket.'],
    };
  }

  return {
    harmonyScore: 0.82,
    isProportional: true,
    structureDescription: 'Versatile relaxed-fit configuration',
    advice: ['Maintain consistent hem draping around footwear.'],
  };
}
