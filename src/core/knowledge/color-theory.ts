import { GarmentColor } from '../domain/fashion';
import { UndertonePreference } from '../domain/types';

export type HarmonyType =
  | 'monochromatic'
  | 'tonal-neutral'
  | 'complementary-accent'
  | 'analogous'
  | 'strong-contrast'
  | 'accent-led'
  | 'potentially-clashing';

export interface ColorHarmonyResult {
  harmonyType: HarmonyType;
  score: number; // 0.0 - 1.0
  isBalanced: boolean;
  notes: string[];
  undertoneCompatibilityNote?: string;
  dislikedColorFound?: string;
}

export interface ColorEvaluationOptions {
  userConfirmedUndertone?: UndertonePreference;
  dislikedColors?: string[];
  preferredColors?: string[];
}

/**
 * Deterministic color coordination logic
 * Analyzes combinations of garments for color temperature, contrast, saturation, and balance.
 * NEVER infers skin undertone automatically; only incorporates undertone when explicitly user-confirmed.
 */
export function evaluateColorHarmony(
  colors: GarmentColor[],
  options?: ColorEvaluationOptions
): ColorHarmonyResult {
  if (colors.length === 0) {
    return {
      harmonyType: 'tonal-neutral',
      score: 0.5,
      isBalanced: true,
      notes: ['No colors specified for evaluation.'],
    };
  }

  // 1. Check for user-disliked colors (hard veto or major penalty)
  if (options?.dislikedColors && options.dislikedColors.length > 0) {
    const dislikedNormalized = options.dislikedColors.map((c) => c.toLowerCase());
    for (const c of colors) {
      const colorName = c.name.toLowerCase();
      if (dislikedNormalized.some((dc) => colorName.includes(dc) || dc.includes(colorName))) {
        return {
          harmonyType: 'potentially-clashing',
          score: 0.2,
          isBalanced: false,
          notes: [`Contains ${c.name}, which conflicts with your stated color dislikes.`],
          dislikedColorFound: c.name,
        };
      }
    }
  }

  const baseCount = colors.filter((c) => c.isBaseColor || c.tone === 'neutral').length;
  const vibrantCount = colors.filter((c) => c.tone === 'vibrant').length;
  const uniqueNames = new Set(colors.map((c) => c.name.toLowerCase()));

  // Monochromatic check
  if (uniqueNames.size === 1) {
    return {
      harmonyType: 'monochromatic',
      score: 0.95,
      isBalanced: true,
      notes: ['Cohesive monochromatic configuration creates clean architectural purity.'],
    };
  }

  // Tonal neutrals (all neutral or earth tones)
  const allNeutralOrEarth = colors.every((c) => c.tone === 'neutral' || c.tone === 'earth');
  if (allNeutralOrEarth) {
    // Check contrast level
    const hasWhiteOrCream = colors.some((c) => c.name.includes('white') || c.name.includes('cream') || c.name.includes('ecru'));
    const hasBlackOrCharcoal = colors.some((c) => c.name.includes('black') || c.name.includes('charcoal') || c.name.includes('navy'));

    if (hasWhiteOrCream && hasBlackOrCharcoal) {
      return {
        harmonyType: 'strong-contrast',
        score: 0.94,
        isBalanced: true,
        notes: ['Strong contrast between light and deep neutral values establishes crisp visual separation.'],
      };
    }

    return {
      harmonyType: 'tonal-neutral',
      score: 0.92,
      isBalanced: true,
      notes: ['Tonal neutral palette ensures high versatility and effortless visual cohesion.'],
    };
  }

  // Single focal vibrant accent supported by neutrals
  if (vibrantCount === 1 && baseCount >= colors.length - 1) {
    return {
      harmonyType: 'accent-led',
      score: 0.9,
      isBalanced: true,
      notes: ['Accent-led composition: single vibrant piece anchored cleanly by neutral foundation.'],
    };
  }

  // Potentially clashing check: Multiple vibrant colors with no neutral grounding
  if (vibrantCount >= 2 && baseCount === 0) {
    return {
      harmonyType: 'potentially-clashing',
      score: 0.42,
      isBalanced: false,
      notes: ['Multiple high-saturation tones competing for visual hierarchy without neutral grounding.'],
    };
  }

  // Undertone reflection (if confirmed)
  let undertoneCompatibilityNote: string | undefined;
  if (options?.userConfirmedUndertone && options.userConfirmedUndertone !== 'unspecified') {
    const undertone = options.userConfirmedUndertone;
    const warmCount = colors.filter((c) => c.tone === 'warm' || c.tone === 'earth').length;
    const coolCount = colors.filter((c) => c.tone === 'cool').length;

    if (undertone === 'warm' && warmCount > coolCount) {
      undertoneCompatibilityNote = 'Harmonizes with user-confirmed warm undertone.';
    } else if (undertone === 'cool' && coolCount > warmCount) {
      undertoneCompatibilityNote = 'Harmonizes with user-confirmed cool undertone.';
    } else {
      undertoneCompatibilityNote = 'Neutral tonal temperature balance relative to undertone.';
    }
  }

  // Analogous / balanced multi-tone
  return {
    harmonyType: 'analogous',
    score: 0.82,
    isBalanced: true,
    notes: ['Harmonious balance across complementary tonal depths.'],
    undertoneCompatibilityNote,
  };
}
