import { BeardStyle } from '../domain/grooming';
import { VisualProfile } from '../domain/visual';
import { Context } from '../domain/context';
import { PreferenceProfile, FeedbackProfile } from '../domain/user';
import { Recommendation, RecommendationFactor } from '../domain/recommendation';
import { computeWeightedScore } from './scoring';
import { PreferenceWeightingEngine } from './preference-weighting';

export interface GroomingEvaluationOptions {
  visual?: VisualProfile;
  context?: Context;
  preferences?: PreferenceProfile;
  feedback?: FeedbackProfile;
}

export class GroomingCompatibilityEvaluator {
  static evaluate(style: BeardStyle, options: GroomingEvaluationOptions): Recommendation<BeardStyle> {
    const factors: RecommendationFactor[] = [];
    const reasons: string[] = [];
    const cautions: string[] = [];
    const stylingAdvice = [...style.groomingTips];

    // 1. Face Shape & Jawline Compatibility (Weight: 3.5)
    if (options.visual?.face) {
      const faceShape = options.visual.face.shape;
      const jaw = options.visual.face.jaw;
      const isFaceMatch = style.compatibleFaceShapes.includes(faceShape);

      let faceScore = 0.5;
      if (isFaceMatch) {
        faceScore = 0.95;
        reasons.push(`Accentuates and sculpts your ${faceShape} face shape and ${jaw} jawline.`);
      } else {
        faceScore = 0.6;
        reasons.push(`Moderate structural balance for ${faceShape} face shape.`);
      }

      factors.push({
        category: 'visual_feature',
        weight: 3.5,
        score: faceScore,
        reason: `Jawline and facial geometry (${faceShape}) compatibility`,
      });
    } else {
      factors.push({
        category: 'visual_feature',
        weight: 1.0,
        score: 0.7,
        reason: 'Universal grooming geometry baseline',
      });
    }

    // 2. Growth Density Feasibility (Weight: 3.0)
    if (options.visual?.face?.beardCharacteristics) {
      const observedDensity = options.visual.face.beardCharacteristics.observedDensity;
      const densityRank = { none: 0, patchy: 1, medium: 2, thick: 3 };

      const meetsDensity = densityRank[observedDensity] >= densityRank[style.minimumDensity];
      const densityScore = meetsDensity ? 0.95 : 0.25;

      if (meetsDensity) {
        reasons.push(`Easily achievable with your observed ${observedDensity} facial hair density.`);
      } else {
        cautions.push(`Requires ${style.minimumDensity} density to look full; current growth pattern may appear sparse.`);
      }

      factors.push({
        category: 'visual_feature',
        weight: 3.0,
        score: densityScore,
        reason: `Observed hair density feasibility (${observedDensity})`,
      });
    }

    // 3. Maintenance Profile (Weight: 2.0)
    if (options.preferences?.maxMaintenanceTolerance) {
      const userMax = options.preferences.maxMaintenanceTolerance;
      const maintenanceRank = { minimal: 1, moderate: 2, high: 3 };

      const isWithinTolerance = maintenanceRank[style.maintenance] <= maintenanceRank[userMax];
      const maintenanceScore = isWithinTolerance ? 0.9 : 0.45;

      if (isWithinTolerance) {
        reasons.push(`Conforms with your ${userMax} grooming maintenance routine.`);
      } else {
        cautions.push(`Requires ${style.maintenance} upkeep (frequent razor edge trimming).`);
      }

      factors.push({
        category: 'maintenance_match',
        weight: 2.0,
        score: maintenanceScore,
        reason: `Grooming commitment (${style.maintenance})`,
      });
    }

    // 4. Occasion Fit (Weight: 2.0)
    if (options.context?.occasion) {
      const occasion = options.context.occasion;
      const targetFormality = options.context.targetFormality || occasion.defaultFormality;
      const [minFormality, maxFormality] = style.formalityRange;

      const isAppropriate = targetFormality >= minFormality && targetFormality <= maxFormality;
      const occasionScore = isAppropriate ? 0.9 : 0.5;

      if (isAppropriate) {
        reasons.push(`Appropriate grooming polish for ${occasion.name}.`);
      }

      factors.push({
        category: 'occasion_fit',
        weight: 2.0,
        score: occasionScore,
        reason: `Formality fit for ${occasion.name}`,
      });
    }

    // 5. Aesthetic Preferences (Weight: 2.0)
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
      weight: 2.0,
      score: finalPrefScore,
      reason: 'Synergy with overall personal style aesthetic',
    });

    const { finalScore } = computeWeightedScore(factors);

    const hasVisual = !!options.visual?.face;
    const hasPreferences = (options.preferences?.preferredStyleSlugs?.length ?? 0) > 0;

    return {
      id: `rec_beard_${style.id}_${Date.now()}`,
      item: style,
      score: finalScore,
      factors,
      reasons: Array.from(new Set(reasons)),
      cautions: cautions.length > 0 ? Array.from(new Set(cautions)) : undefined,
      stylingAdvice,
      confidence: {
        state: hasVisual && hasPreferences ? 'STRONG' : hasVisual ? 'GOOD' : 'EXPLORATORY',
        explanation: hasVisual
          ? 'Calibrated directly against observed facial architecture and grooming density.'
          : 'Based on baseline geometry without verified visual facial scan.',
        toIncreaseConfidence: hasVisual ? undefined : 'Confirm face shape and facial hair density to lock in grooming geometry.',
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
