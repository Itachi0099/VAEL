import { GarmentColor } from '../domain/fashion';

export type HarmonyType =
  | 'monochromatic'
  | 'tonal-neutral'
  | 'complementary-accent'
  | 'analogous'
  | 'triadic'
  | 'uncoordinated';

export interface ColorHarmonyResult {
  harmonyType: HarmonyType;
  score: number; // 0.0 - 1.0
  isBalanced: boolean;
  notes: string[];
}

/**
 * Deterministic color coordination logic
 * Analyzes combinations of garments for color temperature, contrast, and balance.
 */
export function evaluateColorHarmony(colors: GarmentColor[]): ColorHarmonyResult {
  if (colors.length === 0) {
    return { harmonyType: 'neutral-grounded' as HarmonyType, score: 0.5, isBalanced: true, notes: ['No colors to evaluate'] };
  }

  if (colors.length === 1) {
    return {
      harmonyType: 'monochromatic',
      score: 0.9,
      isBalanced: true,
      notes: ['Clean uniform color focus'],
    };
  }

  const baseCount = colors.filter((c) => c.isBaseColor || c.tone === 'neutral').length;
  const vibrantCount = colors.filter((c) => c.tone === 'vibrant').length;
  const uniqueTones = new Set(colors.map((c) => c.tone));

  // Check all monochromatic
  const uniqueNames = new Set(colors.map((c) => c.name.toLowerCase()));
  if (uniqueNames.size === 1) {
    return {
      harmonyType: 'monochromatic',
      score: 0.95,
      isBalanced: true,
      notes: ['Refined monochromatic palette creates architectural cohesion.'],
    };
  }

  // Tonal neutrals (black, white, cream, grey, navy, charcoal, olive)
  const allNeutralOrEarth = colors.every((c) => c.tone === 'neutral' || c.tone === 'earth');
  if (allNeutralOrEarth) {
    return {
      harmonyType: 'tonal-neutral',
      score: 0.92,
      isBalanced: true,
      notes: ['Tonal neutral palette ensures high versatility and effortless elegance.'],
    };
  }

  // Grounded accent: 1 vibrant accent supported by neutral base garments
  if (vibrantCount === 1 && baseCount >= colors.length - 1) {
    return {
      harmonyType: 'complementary-accent',
      score: 0.88,
      isBalanced: true,
      notes: ['Single focal accent piece anchored by subdued neutral foundations.'],
    };
  }

  // More than 2 competing vibrant colors without neutrals can clash
  if (vibrantCount >= 2 && baseCount === 0) {
    return {
      harmonyType: 'uncoordinated',
      score: 0.45,
      isBalanced: false,
      notes: ['Multiple high-saturation tones competing for visual hierarchy.'],
    };
  }

  // Analogous / balanced multi-tone
  return {
    harmonyType: 'analogous',
    score: 0.78,
    isBalanced: true,
    notes: ['Harmonious balance across complementary tonal depths.'],
  };
}
