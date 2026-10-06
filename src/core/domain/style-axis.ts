/**
 * VAEL STYLE AXIS SYSTEM
 *
 * 11 formal dimensions describing aesthetic expression.
 * The first 10 axes are normalized numeric scales from 1 to 5.
 * The 11th axis is a user-controlled gender-coding direction.
 */

export type GenderCodingDirection = 'masculine' | 'feminine' | 'androgynous' | 'unspecified';

export interface StyleVector {
  // 1. Formality (1: lounge/ultra-casual, 3: smart casual, 5: black tie/ultra formal)
  formality: number;

  // 2. Structure (1: fluid/draped/unstructured, 3: balanced soft tailoring, 5: sharply canvassed/architectural)
  structure: number;

  // 3. Volume (1: close/fitted, 3: balanced regular, 5: oversized/expansive drape)
  volume: number;

  // 4. Color Intensity (1: monochromatic/neutral, 3: balanced with subtle accents, 5: vibrant/saturated)
  colorIntensity: number;

  // 5. Contrast (1: low/monotone/tonal, 3: moderate contrast, 5: high contrast/stark dark-light)
  contrast: number;

  // 6. Pattern (1: solid/plain, 3: subtle micro-patterns/textured weaves, 5: bold/expressive prints)
  pattern: number;

  // 7. Texture (1: smooth/flat/matte, 3: moderate tactile interest, 5: heavy/richly tactile/rough)
  texture: number;

  // 8. Ornamentation (1: austere/stark/utilitarian, 3: tasteful minimal accents, 5: ornate/layered jewelry/embellished)
  ornamentation: number;

  // 9. Classic ↔ Trend-Forward (1: heritage/timeless classic, 3: contemporary modern, 5: avant-garde/experimental trend)
  classicTrend: number;

  // 10. Utility ↔ Polish (1: rugged workwear/technical utility, 3: balanced casual elegance, 5: immaculate sartorial polish)
  utilityPolish: number;

  // 11. User-Set Gender-Coding Direction
  genderCoding: GenderCodingDirection;
}

export type NumericStyleAxisKey =
  | 'formality'
  | 'structure'
  | 'volume'
  | 'colorIntensity'
  | 'contrast'
  | 'pattern'
  | 'texture'
  | 'ornamentation'
  | 'classicTrend'
  | 'utilityPolish';

export const NUMERIC_STYLE_AXES: NumericStyleAxisKey[] = [
  'formality',
  'structure',
  'volume',
  'colorIntensity',
  'contrast',
  'pattern',
  'texture',
  'ornamentation',
  'classicTrend',
  'utilityPolish',
];

export interface AxisDefinition {
  key: NumericStyleAxisKey;
  name: string;
  lowLabel: string; // 1
  midLabel: string; // 3
  highLabel: string; // 5
  lowDescription: string;
  midDescription: string;
  highDescription: string;
}

export const AXIS_DEFINITIONS: Record<NumericStyleAxisKey, AxisDefinition> = {
  formality: {
    key: 'formality',
    name: 'Formality',
    lowLabel: 'Lounge / Street Casual',
    midLabel: 'Smart Casual / Elevated Day',
    highLabel: 'Ceremonial / Black Tie',
    lowDescription: 'Raw casual comfort without structural ceremony or dress etiquette.',
    midDescription: 'Balanced polish capable of moving between office and evening dinner.',
    highDescription: 'Strict sartorial formality with heightened protocol and gala standards.',
  },
  structure: {
    key: 'structure',
    name: 'Structure',
    lowLabel: 'Fluid / Dropped / Draped',
    midLabel: 'Soft Tailored / Natural Shoulder',
    highLabel: 'Sharply Architectural / Canvassed',
    lowDescription: 'Unstructured garments falling freely against the body with zero padding.',
    midDescription: 'Gentle shape retention, clean lines, and soft inner canvassing.',
    highDescription: 'Rigid tailoring, padded roped shoulders, crisp pressed creases, and sculptural stiffness.',
  },
  volume: {
    key: 'volume',
    name: 'Volume',
    lowLabel: 'Close / Tailored-Fitted',
    midLabel: 'Balanced / Straight Cadence',
    highLabel: 'Oversized / Expansive Drape',
    lowDescription: 'Contouring close to the physical perimeter with zero excess fabric bulk.',
    midDescription: 'Natural clearance offering unconstrained mobility without billowing silhouette.',
    highDescription: 'Dropped shoulders, wide hems, cocoon coats, and volumetric presence in space.',
  },
  colorIntensity: {
    key: 'colorIntensity',
    name: 'Color Intensity',
    lowLabel: 'Monochrome / Neutral Base',
    midLabel: 'Earth Tones / Subdued Accents',
    highLabel: 'Vibrant / High Saturation',
    lowDescription: 'Restricted strictly to black, white, charcoal, ecru, grey, and raw navy.',
    midDescription: 'Muted olive, camel, terracotta, washed indigo, and calm tonal accents.',
    highDescription: 'Cobalt, scarlet, bright chartreuse, vivid pastels, and expressive focal hues.',
  },
  contrast: {
    key: 'contrast',
    name: 'Contrast',
    lowLabel: 'Tonal / Low Contrast',
    midLabel: 'Balanced Contrast',
    highLabel: 'Stark High Contrast',
    lowDescription: 'Close value pairing (e.g. charcoal on black, cream on ecru, navy on indigo).',
    midDescription: 'Distinct yet harmonious value transitions across layers.',
    highDescription: 'Stark black-on-white, vivid light-dark blocking, and crisp silhouette separation.',
  },
  pattern: {
    key: 'pattern',
    name: 'Pattern',
    lowLabel: 'Pure Solid',
    midLabel: 'Textured Weave / Micro-Pattern',
    highLabel: 'Bold Graphic / Statement Print',
    lowDescription: 'Complete absence of prints; depth is achieved purely through fabrication.',
    midDescription: 'Houndstooth, subtle pinstripes, herringbone, melange, and micro-checks.',
    highDescription: 'Oversized florals, bold geometric blocks, loud tartans, and graphic prints.',
  },
  texture: {
    key: 'texture',
    name: 'Texture',
    lowLabel: 'Smooth / Flat / Matte',
    midLabel: 'Moderate Tactile Interest',
    highLabel: 'Rich / Heavy / Raw Tactile',
    lowDescription: 'Fine combed poplin, smooth silk, fine-gauge jersey, flat gabardine.',
    midDescription: 'Oxford cloth, washed twill, brushed cotton, fine merino knitwear.',
    highDescription: 'Chunky cable knit, boiled wool, rough tweed, wide-wale corduroy, raw shearling, slub canvas.',
  },
  ornamentation: {
    key: 'ornamentation',
    name: 'Ornamentation',
    lowLabel: 'Austere / Pure Utilitarian',
    midLabel: 'Tasteful Minimal Accents',
    highLabel: 'Ornate / Statement Layered',
    lowDescription: 'Zero non-functional hardware, hidden plackets, clean unadorned surfaces.',
    midDescription: 'One signet ring, clean timepiece, quiet belt buckle, restrained leather goods.',
    highDescription: 'Stacked jewelry, visible zips and tactical webbing, brooches, chains, and decorative stitching.',
  },
  classicTrend: {
    key: 'classicTrend',
    name: 'Classic ↔ Trend-Forward',
    lowLabel: 'Heritage / Timeless Classic',
    midLabel: 'Contemporary Modern',
    highLabel: 'Avant-Garde / Trend-Forward',
    lowDescription: 'Historic proportions, generational staples, Savile Row and Ivy pedigrees.',
    midDescription: 'Clean modern cuts acknowledging current aesthetic sensibility without fleeting fads.',
    highDescription: 'Deconstructive silhouettes, viral proportions, directional runway references, subcultural edge.',
  },
  utilityPolish: {
    key: 'utilityPolish',
    name: 'Utility ↔ Polish',
    lowLabel: 'Rugged / Functional Utility',
    midLabel: 'Elevated Casual Balance',
    highLabel: 'Sartorial Polish / Immaculate',
    lowDescription: 'Heavy double-knees, chore jackets, technical membranes, lug soles, raw functional durability.',
    midDescription: 'Crisp casual trousers, neat knitwear, clean leather low-tops, effortless composure.',
    highDescription: 'Press creases, wholecut oxfords, silk neckwear, pocket squares, pristine tailoring.',
  },
};
