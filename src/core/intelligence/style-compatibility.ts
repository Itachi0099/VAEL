import { StyleFamily } from '../domain/style';
import { PreferenceProfile } from '../domain/user';

export interface StyleMatchResult {
  style: StyleFamily;
  matchScore: number; // 0.0 - 1.0
  matchingAttributes: string[];
  divergentAttributes: string[];
}

export class StyleCompatibilityEngine {
  /**
   * Discovers how well a style family matches a user's latent or explicit preferences
   */
  static matchStyle(style: StyleFamily, preferences: PreferenceProfile): StyleMatchResult {
    let score = 0.5;
    const matchingAttributes: string[] = [];
    const divergentAttributes: string[] = [];

    // 1. Fits
    const commonFits = style.attributes.dominantFits.filter((f) => preferences.preferredFits.includes(f));
    const dislikedFits = style.attributes.dominantFits.filter((f) => preferences.dislikedFits.includes(f));

    if (commonFits.length > 0) {
      score += 0.15;
      matchingAttributes.push(`Shares preferred fit geometry: ${commonFits.join(', ')}`);
    }
    if (dislikedFits.length > 0) {
      score -= 0.2;
      divergentAttributes.push(`Features disliked fit styles: ${dislikedFits.join(', ')}`);
    }

    // 2. Palette
    const commonColors = style.attributes.colorPalette.primaryTones.filter((c) =>
      preferences.preferredColors.includes(c)
    );
    const dislikedColors = style.attributes.colorPalette.primaryTones.filter((c) =>
      preferences.dislikedColors.includes(c)
    );

    if (commonColors.length > 0) {
      score += 0.15;
      matchingAttributes.push(`Shares preferred color palette: ${commonColors.join(', ')}`);
    }
    if (dislikedColors.length > 0) {
      score -= 0.15;
      divergentAttributes.push(`Contains avoided color tones: ${dislikedColors.join(', ')}`);
    }

    // 3. Formality range overlap
    const [styleMin, styleMax] = style.attributes.formalityRange;
    const [prefMin, prefMax] = preferences.preferredFormalityRange;

    const overlap = Math.max(0, Math.min(styleMax, prefMax) - Math.max(styleMin, prefMin));
    if (overlap > 0) {
      score += 0.1;
      matchingAttributes.push(`Compatible formality spectrum (${styleMin}-${styleMax})`);
    } else {
      score -= 0.15;
      divergentAttributes.push(`Formality deviates from preferred range`);
    }

    const clampedScore = Math.max(0.0, Math.min(1.0, Math.round(score * 100) / 100));

    return {
      style,
      matchScore: clampedScore,
      matchingAttributes,
      divergentAttributes,
    };
  }
}
