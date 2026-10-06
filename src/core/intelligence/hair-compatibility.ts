import { HairStyle } from '../domain/grooming';
import { VisualProfile } from '../domain/visual';
import { Context } from '../domain/context';
import { PreferenceProfile, FeedbackProfile } from '../domain/user';
import { Recommendation, RecommendationFactor } from '../domain/recommendation';
import { computeWeightedScore } from './scoring';
import { PreferenceWeightingEngine } from './preference-weighting';

export interface HairEvaluationOptions {
  visual?: VisualProfile;
  context?: Context;
  preferences?: PreferenceProfile;
  feedback?: FeedbackProfile;
}

export class HairCompatibilityEvaluator {
  static evaluate(style: HairStyle, options: HairEvaluationOptions): Recommendation<HairStyle> {
    const factors: RecommendationFactor[] = [];
    const reasons: string[] = [];
    const cautions: string[] = [];
    const stylingAdvice = [...style.stylingTips];

    // 1. Face Shape Compatibility (Weight: 3.5)
    if (options.visual?.face) {
      const faceShape = options.visual.face.shape;
      const isDirectlyCompatible = style.compatibleFaceShapes.includes(faceShape);
      const isExplicitlyIncompatible = style.incompatibleFaceShapes?.includes(faceShape);

      let faceScore = 0.5;
      if (isDirectlyCompatible) {
        faceScore = 0.95;
        reasons.push(`Complements your ${faceShape} face geometry by balancing facial thirds.`);
      } else if (isExplicitlyIncompatible) {
        faceScore = 0.15;
        cautions.push(`May visually exaggerate the proportions of a ${faceShape} face shape.`);
      } else {
        faceScore = 0.65;
        reasons.push(`Neutral balance with ${faceShape} face outline.`);
      }

      factors.push({
        category: 'visual_feature',
        weight: 3.5,
        score: faceScore,
        reason: `Face geometry (${faceShape}) compatibility`,
      });
    } else {
      factors.push({
        category: 'visual_feature',
        weight: 1.0,
        score: 0.7,
        reason: 'Universal face geometry baseline (no visual scan provided)',
      });
    }

    // 2. Hair Texture & Density Compatibility (Weight: 3.0)
    if (options.visual?.hair) {
      const texture = options.visual.hair.texture;
      const density = options.visual.hair.density;

      const textureMatches = style.compatibleTextures.includes(texture);
      const densityMatches = style.compatibleDensities.includes(density);

      let textureScore = 0.3;
      const sourceDesc = options.visual.source === 'user_input' ? 'entered' : 'observed';
      if (textureMatches && densityMatches) {
        textureScore = 0.95;
        reasons.push(`Optimized for your ${sourceDesc} ${texture} texture and ${density} density.`);
      } else if (textureMatches) {
        textureScore = 0.75;
        reasons.push(`Natural fit for your ${sourceDesc} ${texture} hair texture.`);
      } else if (densityMatches) {
        textureScore = 0.65;
        cautions.push(`Designed primarily for ${style.compatibleTextures.join('/')} hair; may require heat or texturizing product.`);
      } else {
        textureScore = 0.3;
        cautions.push(`Does not naturally fall in line with ${texture} hair.`);
      }

      factors.push({
        category: 'visual_feature',
        weight: 3.0,
        score: textureScore,
        reason: `Hair texture (${texture}) and density (${density}) match`,
      });
    }

    // 3. Maintenance Tolerance (Weight: 2.0)
    if (options.preferences?.maxMaintenanceTolerance) {
      const userMax = options.preferences.maxMaintenanceTolerance;
      const maintenanceRank = { minimal: 1, moderate: 2, high: 3 };

      const isWithinTolerance = maintenanceRank[style.maintenance] <= maintenanceRank[userMax];
      const maintenanceScore = isWithinTolerance ? 0.9 : 0.4;

      if (isWithinTolerance) {
        reasons.push(`Fits within your preferred ${userMax} maintenance threshold.`);
      } else {
        cautions.push(`Demands ${style.maintenance} maintenance which exceeds your preferred routine.`);
      }

      factors.push({
        category: 'maintenance_match',
        weight: 2.0,
        score: maintenanceScore,
        reason: `Styling maintenance commitment (${style.maintenance})`,
      });
    }

    // 4. Occasion & Formality Context (Weight: 2.0)
    if (options.context?.occasion) {
      const occasion = options.context.occasion;
      const targetFormality = options.context.targetFormality || occasion.defaultFormality;
      const [minFormality, maxFormality] = style.formalityRange;

      const isFormalityAppropriate = targetFormality >= minFormality && targetFormality <= maxFormality;
      const occasionScore = isFormalityAppropriate ? 0.9 : 0.45;

      if (isFormalityAppropriate) {
        reasons.push(`Appropriate formality for ${occasion.name}.`);
      } else {
        cautions.push(`Formality profile may lean outside standard expectations for ${occasion.name}.`);
      }

      factors.push({
        category: 'occasion_fit',
        weight: 2.0,
        score: occasionScore,
        reason: `Formality fit for ${occasion.name}`,
      });
    }

    // 5. User Preferences & Feedback History (Weight: 2.5)
    const preferenceAffinity = PreferenceWeightingEngine.evaluateStyleAffinity(
      style.compatibleStyleSlugs,
      options.preferences,
      options.feedback
    );

    const basePreferenceScore = 0.65;
    const finalPrefScore = Math.max(0.1, Math.min(1.0, basePreferenceScore + preferenceAffinity.scoreDelta));
    if (preferenceAffinity.reasons.length > 0) {
      reasons.push(...preferenceAffinity.reasons);
    }

    factors.push({
      category: 'preference_reinforcement',
      weight: 2.5,
      score: finalPrefScore,
      reason: 'Aesthetic affinity with your personal style direction',
    });

    const { finalScore } = computeWeightedScore(factors);

    const hasVisual = !!options.visual?.hair;
    const hasPreferences = (options.preferences?.preferredStyleSlugs?.length ?? 0) > 0;

    return {
      id: `rec_hair_${style.id}_${Date.now()}`,
      item: style,
      score: finalScore,
      factors,
      reasons: Array.from(new Set(reasons)),
      cautions: cautions.length > 0 ? Array.from(new Set(cautions)) : undefined,
      stylingAdvice,
      confidence: {
        state: hasVisual && hasPreferences ? 'STRONG' : hasVisual ? 'GOOD' : 'EXPLORATORY',
        explanation: hasVisual
          ? 'Calibrated directly against observed hair texture, density, and maintenance comfort.'
          : 'Based on baseline hair geometry without verified visual texture analysis.',
        toIncreaseConfidence: hasVisual ? undefined : 'Confirm natural hair texture and density in your profile to refine cut precision.',
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
