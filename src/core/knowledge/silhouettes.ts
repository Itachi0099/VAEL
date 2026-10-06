import { FitType } from '../domain/types';
import { Garment } from '../domain/fashion';
import { FitProportionProfile } from '../domain/user';

export interface SilhouetteEvaluation {
  harmonyScore: number; // 0.0 - 1.0
  isProportional: boolean;
  structureDescription: string;
  advice: string[];
  styleTensionWarning?: string;
}

/**
 * Silhouette & Proportion Evaluation Matrix
 *
 * Evaluates the geometric interplay of volumes, hem lengths, and structural weights.
 * Follows strict VAEL language guardrails:
 * - NO body flaw framing (no "slimming", "problem areas", "hide flaws", "fix body").
 * - Purely neutral styling principles: balance, emphasis, proportion, structure, volume, contrast.
 */
export class SilhouetteProportionRules {
  static evaluate(
    top?: Garment,
    bottom?: Garment,
    outer?: Garment,
    userFitPrefs?: FitProportionProfile,
    onePiece?: Garment
  ): SilhouetteEvaluation {
    // If a one-piece (dress/jumpsuit) is present, evaluate its standalone or layered proportion
    if (onePiece) {
      const isOuterLong = outer && (outer.length === 'extended' || outer.silhouette.includes('longline'));
      const isOuterCropped = outer && (outer.length === 'cropped' || outer.silhouette.includes('cropped'));
      const advice: string[] = [];
      let harmonyScore = 0.92;
      let structureDescription = `Unified ${onePiece.silhouette.replace(/-/g, ' ')} column`;

      if (outer) {
        if (isOuterLong) {
          harmonyScore = 0.95;
          structureDescription = 'Monolithic vertical cadence: longline outer architectural frame over full-length dress';
          advice.push('Leaves outer front unfastened to maintain visual vertical movement.');
        } else if (isOuterCropped) {
          harmonyScore = 0.94;
          structureDescription = 'High waistline definition: cropped jacket breaks and elevates continuous one-piece line';
          advice.push('Accentuates natural high waist break against fluid dress line.');
        } else {
          structureDescription = 'Cohesive layered silhouette with balanced mid-length outer structure';
        }
      }

      return {
        harmonyScore,
        isProportional: true,
        structureDescription,
        advice,
      };
    }

    if (!top || !bottom) {
      return {
        harmonyScore: 0.7,
        isProportional: true,
        structureDescription: 'Partial silhouette specification',
        advice: ['Combine both upper and lower foundation to evaluate complete proportion balance.'],
      };
    }

    const topFit = top.fit;
    const bottomFit = bottom.fit;
    const topLength = top.length || 'regular';
    const isBottomWide = bottomFit === 'relaxed' || bottomFit === 'oversized' || bottom.silhouette.includes('wide');
    const isBottomSlim = bottomFit === 'slim' || bottomFit === 'skinny';
    const isTopCropped = topLength === 'cropped' || top.silhouette.includes('cropped');
    const isOuterLong = outer && (outer.length === 'extended' || outer.silhouette.includes('longline'));

    const advice: string[] = [];
    let harmonyScore = 0.85;
    let structureDescription = 'Balanced regular configuration';
    let styleTensionWarning: string | undefined;

    // Check for extreme structural tension: Sharp formal tailoring (structure 5) + slouchy lounge item (structure 1)
    if (outer && outer.structure >= 4 && (top.structure === 1 || bottom.structure === 1)) {
      if (bottom.subcategory.includes('sweat') || bottom.subcategory.includes('jogger')) {
        styleTensionWarning =
          'High structural tension: sharply tailored outerwear paired directly with unstructured lounge bottoms without an editorial bridge.';
        harmonyScore -= 0.15;
      }
    }

    // Formula 1: Cropped top + High-rise / Wide-leg bottom
    if (isTopCropped && isBottomWide) {
      harmonyScore = 0.96;
      structureDescription = 'Cropped upper proportion offset by expansive lower volume';
      advice.push('Accentuates waistline geometry and creates an elongated vertical lower line.');
    }
    // Formula 2: Long outer layer + Narrow / Straight base (Monolithic column)
    else if (isOuterLong && (bottomFit === 'regular' || bottomFit === 'slim' || bottomFit === 'tailored')) {
      harmonyScore = 0.94;
      structureDescription = 'Longline architectural outerwear framing a streamlined linear base';
      advice.push('Creates a continuous vertical frame; leave outer layer unbuttoned during motion.');
    }
    // Formula 3: Fitted / Tailored top + Wide / Relaxed bottom (A-Frame dynamic)
    else if ((topFit === 'slim' || topFit === 'tailored' || topFit === 'regular') && isBottomWide) {
      harmonyScore = 0.95;
      structureDescription = 'Structured upper anchor balanced with fluid wide-leg lower volume';
      advice.push('Tucking the top defines the waistline and emphasizes the architectural drape of trousers.');
    }
    // Formula 4: Boxy / Oversized top + Relaxed / Wide bottom (Volumetric drape)
    else if ((topFit === 'boxy' || topFit === 'oversized') && isBottomWide) {
      harmonyScore = 0.92;
      structureDescription = 'Contemporary dual-volume drape with intentional spatial presence';
      advice.push('Ground with substantial footwear (chunky derbies, solid boots) to anchor the fluid hemline.');
    }
    // Formula 5: Oversized / Boxy top + Slim / Tailored bottom (Inverted triangle)
    else if ((topFit === 'oversized' || topFit === 'boxy') && isBottomSlim) {
      harmonyScore = 0.88;
      structureDescription = 'Upper volumetric emphasis with streamlined lower anchor';
      advice.push('Emphasizes upper shoulder line while maintaining a clean, tapered ankle silhouette.');
    }
    // Formula 6: Regular + Regular / Tailored + Tailored (Classic cadence)
    else if ((topFit === 'regular' || topFit === 'tailored') && (bottomFit === 'regular' || bottomFit === 'tailored')) {
      harmonyScore = 0.9;
      structureDescription = 'Harmonious classic proportion with uniform clean linear cadence';
      advice.push('Elevate with subtle texture contrast between top and lower fabrication.');
    }
    // Formula 7: Uniform Skinny (Skinny top + Skinny bottom)
    else if (topFit === 'skinny' && bottomFit === 'skinny') {
      harmonyScore = 0.65;
      structureDescription = 'Uniformly compressed silhouette with low spatial dimensionality';
      advice.push('Introduce dimension by layering an unbuttoned relaxed overshirt or boxy jacket over the base.');
    }

    // User preference modulation
    if (userFitPrefs) {
      if (userFitPrefs.dislikedFits.includes(topFit) || userFitPrefs.dislikedFits.includes(bottomFit)) {
        harmonyScore = Math.max(0.2, harmonyScore - 0.25);
        advice.push('Deviates from your stated fit preferences.');
      }
      if (userFitPrefs.preferredFits.includes(topFit) && userFitPrefs.preferredFits.includes(bottomFit)) {
        harmonyScore = Math.min(1.0, harmonyScore + 0.08);
        advice.push('Aligns with your preferred fit geometry.');
      }
    }

    return {
      harmonyScore: Math.round(harmonyScore * 100) / 100,
      isProportional: harmonyScore >= 0.75,
      structureDescription,
      advice,
      styleTensionWarning,
    };
  }
}

export function evaluateSilhouette(top?: Garment, bottom?: Garment, outer?: Garment): SilhouetteEvaluation {
  return SilhouetteProportionRules.evaluate(top, bottom, outer);
}
