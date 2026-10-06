import { Outfit, Garment } from '../domain/fashion';
import { VisualProfile } from '../domain/visual';
import { Context } from '../domain/context';
import { PreferenceProfile, FeedbackProfile } from '../domain/user';
import { Recommendation, RecommendationFactor } from '../domain/recommendation';
import { evaluateColorHarmony } from '../knowledge/color-theory';
import { evaluateSilhouette } from '../knowledge/silhouettes';
import { computeWeightedScore } from './scoring';
import { PreferenceWeightingEngine } from './preference-weighting';

export interface OutfitEvaluationOptions {
  visual?: VisualProfile;
  context?: Context;
  preferences?: PreferenceProfile;
  feedback?: FeedbackProfile;
}

export class OutfitCompatibilityEvaluator {
  static evaluate(outfit: Outfit, options: OutfitEvaluationOptions): Recommendation<Outfit> {
    const factors: RecommendationFactor[] = [];
    const reasons: string[] = [];
    const cautions: string[] = [];
    const stylingAdvice: string[] = [];

    const top = outfit.items.find((i) => i.garment.category === 'top')?.garment;
    const bottom = outfit.items.find((i) => i.garment.category === 'bottom')?.garment;
    const outer = outfit.items.find((i) => i.garment.category === 'outerwear')?.garment;
    const shoes = outfit.items.find((i) => i.garment.category === 'footwear')?.garment;
    const allGarments = outfit.items.map((i) => i.garment);

    // 1. Silhouette & Proportion Balance (Weight: 3.5)
    const silhouetteEval = evaluateSilhouette(top, bottom, outer);
    factors.push({
      category: 'silhouette_balance',
      weight: 3.5,
      score: silhouetteEval.harmonyScore,
      reason: `Proportional architecture: ${silhouetteEval.structureDescription}`,
    });
    if (silhouetteEval.isProportional) {
      reasons.push(`Silhouette dynamic: ${silhouetteEval.structureDescription}.`);
    } else {
      cautions.push(`Proportion alert: ${silhouetteEval.structureDescription}.`);
    }
    stylingAdvice.push(...silhouetteEval.advice);

    // 2. Color Harmony (Weight: 3.0)
    const colors = allGarments.map((g) => g.color);
    const colorHarmony = evaluateColorHarmony(colors);
    factors.push({
      category: 'color_harmony',
      weight: 3.0,
      score: colorHarmony.score,
      reason: `Color story (${colorHarmony.harmonyType})`,
    });
    if (colorHarmony.isBalanced) {
      reasons.push(...colorHarmony.notes);
    } else {
      cautions.push(...colorHarmony.notes);
    }

    // 3. Occasion Appropriateness (Weight: 3.0)
    if (options.context?.occasion) {
      const occasion = options.context.occasion;
      const targetFormality = options.context.targetFormality || occasion.defaultFormality;
      const formalityDiff = Math.abs(outfit.formality - targetFormality);

      let occasionScore = 1.0 - formalityDiff * 0.25;
      occasionScore = Math.max(0.2, Math.min(1.0, occasionScore));

      // Check restricted categories
      const hasRestricted = allGarments.some((g) =>
        occasion.restrictedGarmentCategories?.some((r) => g.subcategory.includes(r) || g.slug.includes(r))
      );

      if (hasRestricted) {
        occasionScore = 0.2;
        cautions.push(`Contains elements discouraged for ${occasion.name}.`);
      } else if (formalityDiff === 0) {
        reasons.push(`Precisely calibrated for ${occasion.name} formality (Level ${outfit.formality}).`);
      } else if (formalityDiff <= 1) {
        reasons.push(`Appropriately flexible for ${occasion.name}.`);
      } else {
        cautions.push(`Formality deviates from recommended level for ${occasion.name}.`);
      }

      factors.push({
        category: 'occasion_fit',
        weight: 3.0,
        score: occasionScore,
        reason: `Occasion context (${occasion.name}) alignment`,
      });
    }

    // 4. Weather & Season Compatibility (Weight: 2.0)
    if (options.context?.weather || options.context?.season) {
      let weatherMatches = 0;
      let totalChecked = 0;

      if (options.context.weather) {
        const w = options.context.weather;
        allGarments.forEach((g) => {
          totalChecked++;
          if (g.compatibleWeather.includes(w) || (g.compatibleWeather as any).includes('all-weather')) {
            weatherMatches++;
          }
        });
      }

      const weatherScore = totalChecked > 0 ? weatherMatches / totalChecked : 0.8;
      if (weatherScore >= 0.8) {
        reasons.push(`Well adapted to current climate (${options.context.weather || 'season'}).`);
      } else if (weatherScore < 0.5) {
        cautions.push(`Fabric choices may not offer optimal protection for ${options.context.weather} conditions.`);
      }

      factors.push({
        category: 'weather_fit',
        weight: 2.0,
        score: Math.max(0.3, Math.min(1.0, weatherScore)),
        reason: `Weather suitability (${options.context.weather || options.context.season})`,
      });
    }

    // 5. User Preferences & Feedback History (Weight: 2.5)
    const preferenceAffinity = PreferenceWeightingEngine.evaluateStyleAffinity(
      [outfit.primaryStyleSlug],
      options.preferences,
      options.feedback
    );

    const basePreferenceScore = 0.7;
    const finalPrefScore = Math.max(0.1, Math.min(1.0, basePreferenceScore + preferenceAffinity.scoreDelta));
    if (preferenceAffinity.reasons.length > 0) {
      reasons.push(...preferenceAffinity.reasons);
    }

    factors.push({
      category: 'preference_reinforcement',
      weight: 2.5,
      score: finalPrefScore,
      reason: `Personal style affinity (${outfit.primaryStyleSlug})`,
    });

    // Outfit item styling notes
    outfit.items.forEach((item) => {
      if (item.stylingNote) {
        stylingAdvice.push(`${item.garment.name}: ${item.stylingNote}`);
      }
    });

    const { finalScore } = computeWeightedScore(factors);

    return {
      id: `rec_outfit_${outfit.id}_${Date.now()}`,
      item: outfit,
      score: finalScore,
      factors,
      reasons: Array.from(new Set(reasons)),
      cautions: cautions.length > 0 ? Array.from(new Set(cautions)) : undefined,
      stylingAdvice: Array.from(new Set(stylingAdvice)),
      generatedAt: new Date().toISOString(),
    };
  }
}
