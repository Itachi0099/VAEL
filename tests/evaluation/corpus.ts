import { EvaluationScenario, BASE_PREFERENCES, BASE_FEEDBACK, BASE_STYLE_VECTOR } from './corpus-types';
import { knowledgeBase } from '../../src/core/knowledge';
import { User } from '../../src/core/domain/user';
import { VisualProfile } from '../../src/core/domain/visual';
import { Context } from '../../src/core/domain/context';

/**
 * GOLDEN EVALUATION CORPUS (40 Scenarios)
 * Spans:
 * 1. Climate & Physical Reality (Extreme Heat, Freezing Cold, Heavy Rain)
 * 2. Taste Learning & Negative Signals (Repeated Passes, Aversions, Modesty)
 * 3. Silhouette & Proportion Geometry (Boxy Top + Wide Pants, Slouch vs Tailoring)
 * 4. Evidence Authority & Truth (User confirmation overriding camera/vision)
 * 5. Color Theory & Undertone Compatibility (Warm, Cool, Saturated vetoes)
 * 6. Cultural Reverence & Occasions (Ceremony without forced Western suiting)
 * 7. Hair Texture & Grooming Feasibility (Coily, Curly, Protective styles)
 * 8. Wardrobe First & Confidence Integrity (Need more info, Honest Uncertainty)
 */
export const EVALUATION_CORPUS: EvaluationScenario[] = [
  // =========================================================================
  // CATEGORY 1: CLIMATE & PHYSICAL REALITY (Physics Vetoes & Layering)
  // =========================================================================
  {
    id: 'case_01_extreme_heat_wedding',
    name: 'Extreme Heat Summer Wedding (34°C)',
    category: 'physics_climate',
    description: 'User attending a summer wedding at 34°C. System must veto heavyweight wool, down, and heavy fleece outerwear.',
    user: {
      id: 'eval_user_01',
      name: 'Summer Wedding Guest',
      handle: 'summer_guest',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_01',
        userId: 'eval_user_01',
        dominantAestheticSlugs: ['old-money', 'smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['old-money', 'smart-casual'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
      weather: 'hot',
      temperatureCelsius: 34,
      isWeatherConfirmed: true,
      targetFormality: 4,
    },
    assertions: (topThree) => [
      {
        passed: !topThree.safe.outfit.item.items.some(
          (i) => i.garment.fabricWeight === 'heavyweight' && i.garment.material.toLowerCase().includes('wool')
        ),
        message: 'Safe look must not include heavyweight wool outerwear in 34°C heat.',
      },
      {
        passed: !topThree.bestMatch.outfit.item.items.some(
          (i) => i.garment.fabricWeight === 'heavyweight' && i.garment.material.toLowerCase().includes('wool')
        ),
        message: 'Best Match look must not include heavyweight wool outerwear in 34°C heat.',
      },
      {
        passed: topThree.bestMatch.confidence.state === 'STRONG' || topThree.bestMatch.confidence.state === 'GOOD',
        message: 'Best Match look has confirmed context and weather.',
      },
    ],
  },
  {
    id: 'case_02_freezing_winter_commute',
    name: 'Sub-Zero Freezing Commute (-4°C)',
    category: 'physics_climate',
    description: 'Sub-zero freezing commute. System must veto standalone summer shorts and uninsulated single-layer linen.',
    user: {
      id: 'eval_user_02',
      name: 'Winter Commuter',
      handle: 'winter_commute',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_02',
        userId: 'eval_user_02',
        dominantAestheticSlugs: ['minimal', 'smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      weather: 'cold',
      temperatureCelsius: -4,
      isWeatherConfirmed: true,
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: !topThree.bestMatch.outfit.item.items.some(
          (i) => i.garment.subcategory === 'shorts' || i.garment.subcategory === 'sandals'
        ),
        message: 'Freezing weather must veto shorts and open-toe footwear in Best Match.',
      },
      {
        passed: !topThree.safe.outfit.item.items.some(
          (i) => i.garment.subcategory === 'shorts' || i.garment.subcategory === 'sandals'
        ),
        message: 'Freezing weather must veto shorts and open-toe footwear in Safe look.',
      },
    ],
  },
  {
    id: 'case_03_torrential_rain_transit',
    name: 'Rainy City Commute (Wet & Windy)',
    category: 'physics_climate',
    description: 'Wet weather transit. System checks water resistance and cautions against delicate water-sensitive materials.',
    user: {
      id: 'eval_user_03',
      name: 'Rain Commuter',
      handle: 'rain_commute',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_03',
        userId: 'eval_user_03',
        dominantAestheticSlugs: ['techwear', 'minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, utilityPolish: 2 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['techwear', 'minimal'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('travel')!,
      weather: 'rainy',
      temperatureCelsius: 11,
      isWeatherConfirmed: true,
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.items.length >= 3,
        message: 'Best match output contains complete composed items.',
      },
      {
        passed: topThree.bestMatch.outfit.factors.some((f) => f.category === 'weather_fit'),
        message: 'Weather fit factor is actively evaluated.',
      },
    ],
  },
  {
    id: 'case_04_high_humidity_tropical_evening',
    name: 'Tropical High Humidity Evening (29°C, 88% Humidity)',
    category: 'physics_climate',
    description: 'Tropical high humidity evening. Breathable fabrics prioritized over non-breathable synthetics.',
    user: {
      id: 'eval_user_04',
      name: 'Tropical Traveler',
      handle: 'tropics',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_04',
        userId: 'eval_user_04',
        dominantAestheticSlugs: ['korean-minimal', 'minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'hot',
      temperatureCelsius: 29,
      humidity: 'high',
      isWeatherConfirmed: true,
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: !topThree.bestMatch.outfit.item.items.some((i) => i.garment.material.toLowerCase().includes('melton wool')),
        message: 'Best match must not recommend heavy melton wool in high humidity 29°C.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 2: TASTE LEARNING, REPEAT PASSES & NEGATIVE SIGNALS
  // =========================================================================
  {
    id: 'case_05_repeated_passes_on_oversized',
    name: 'Repeated Passes on Oversized Silhouettes',
    category: 'taste_feedback',
    description: 'User has repeatedly passed or disliked oversized fits (repeatPassCount.oversized = 3). Oversized fits must be penalized/dampened.',
    user: {
      id: 'eval_user_05',
      name: 'Fitted Preference User',
      handle: 'fitted_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_05',
        userId: 'eval_user_05',
        dominantAestheticSlugs: ['smart-casual', 'minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, volume: 2 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredFits: ['regular', 'tailored'],
          dislikedFits: ['oversized'],
        },
        feedbackProfile: {
          ...BASE_FEEDBACK,
          repeatPassCount: { oversized: 3 },
          learnedFitAffinities: { oversized: -0.6 },
        },
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: !topThree.safe.outfit.item.items.some((i) => i.garment.fit === 'oversized'),
        message: 'Safe look must strictly avoid oversized garments when user dislikes and repeatedly passed on oversized.',
      },
      {
        passed: !topThree.bestMatch.outfit.item.items.some((i) => i.garment.fit === 'oversized'),
        message: 'Best Match look must strictly avoid oversized garments when user stated disliked fit.',
      },
    ],
  },
  {
    id: 'case_06_disliked_bright_colors',
    name: 'Aversion to Bright & Neon Colors',
    category: 'taste_feedback',
    description: 'User stated aversion to bright neon colors. Hard veto filter must prevent disliked colors from appearing.',
    user: {
      id: 'eval_user_06',
      name: 'Muted Palette User',
      handle: 'muted_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_06',
        userId: 'eval_user_06',
        dominantAestheticSlugs: ['minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, colorIntensity: 1 },
        preferences: {
          ...BASE_PREFERENCES,
          dislikedColors: ['neon-pink', 'fluorescent-yellow', 'magenta'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      weather: 'mild',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: !topThree.bestMatch.outfit.item.items.some((i) =>
          ['neon-pink', 'fluorescent-yellow', 'magenta'].includes(i.garment.color.name)
        ),
        message: 'Best match must not contain any of the disliked colors.',
      },
      {
        passed: !topThree.safe.outfit.item.items.some((i) =>
          ['neon-pink', 'fluorescent-yellow', 'magenta'].includes(i.garment.color.name)
        ),
        message: 'Safe look must not contain any of the disliked colors.',
      },
    ],
  },
  {
    id: 'case_07_disliked_style_formal',
    name: 'Aversion to Rigid Formal Suiting',
    category: 'taste_feedback',
    description: 'User explicitly dislikes formal style. Engine must veto or avoid pure formal suiting.',
    user: {
      id: 'eval_user_07',
      name: 'Anti Formal User',
      handle: 'relaxed_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_07',
        userId: 'eval_user_07',
        dominantAestheticSlugs: ['korean-minimal', 'minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['korean-minimal'],
          dislikedStyleSlugs: ['formal'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.primaryStyleSlug !== 'formal',
        message: 'Best Match primary style must not be formal when formal is in dislikedStyleSlugs.',
      },
      {
        passed: topThree.safe.outfit.item.primaryStyleSlug !== 'formal',
        message: 'Safe look primary style must not be formal when formal is in dislikedStyleSlugs.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 3: SILHOUETTE & PROPORTION HARMONY (Architectural Balance)
  // =========================================================================
  {
    id: 'case_08_boxy_top_fluid_bottom_harmony',
    name: 'Boxy Top Frame Offset by Wide Trousers',
    category: 'silhouette_proportions',
    description: 'Evaluates architectural volume harmony. Dropped-shoulder boxy tee offset with wide-leg fluid trousers.',
    user: {
      id: 'eval_user_08',
      name: 'Architectural Proportion User',
      handle: 'arch_prop',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_08',
        userId: 'eval_user_08',
        dominantAestheticSlugs: ['korean-minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, volume: 4, structure: 2 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredFits: ['boxy', 'relaxed'],
          fitProportions: {
            ...BASE_PREFERENCES.fitProportions,
            topVolume: 4,
            bottomVolume: 4,
          },
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.overallHarmonyScore >= 0.7,
        message: 'Best match achieves high architectural harmony score.',
      },
      {
        passed: topThree.bestMatch.outfit.factors.some((f) => f.category === 'silhouette_balance'),
        message: 'Silhouette balance factor is explicitly scored.',
      },
    ],
  },
  {
    id: 'case_09_tailoring_plus_slouch_tension',
    name: 'Tailoring + Slouch Style Tension Detected',
    category: 'silhouette_proportions',
    description: 'When mixing structured formal items with slouch items, the engine detects and documents intentional or unintentional tension.',
    user: {
      id: 'eval_user_09',
      name: 'Eclectic Mix User',
      handle: 'eclectic',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_09',
        userId: 'eval_user_09',
        dominantAestheticSlugs: ['smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.reasons.length >= 2,
        message: 'Best match provides at least 2 clear honest reasons.',
      },
      {
        passed: topThree.stretch.tier === 'STRETCH',
        message: 'Stretch tier look explores distinct directional profile.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 4: EVIDENCE AUTHORITY & TRUTH (User Confirmation vs Vision)
  // =========================================================================
  {
    id: 'case_10_user_confirmed_texture_overrides_vision',
    name: 'User-Confirmed Wavy Hair Overrides Vision Straight',
    category: 'evidence_authority',
    description: 'User explicitly confirmed hair texture is wavy (Rank 5). Vision scan claimed straight (Rank 2). Engine MUST treat hair as wavy.',
    user: {
      id: 'eval_user_10',
      name: 'Confirmed Wavy Hair User',
      handle: 'wavy_user',
      createdAt: '2026-10-01',
      visualProfile: {
        id: 'vis_10',
        userId: 'eval_user_10',
        face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
        hair: { texture: 'wavy', density: 'high', length: 'medium', volume: 'moderate' }, // Reflected from user confirmation
        body: { silhouette: 'trapezoid' },
        source: 'user_input',
        lastObservedAt: '2026-10-01',
      },
      styleProfile: {
        id: 'sp_10',
        userId: 'eval_user_10',
        dominantAestheticSlugs: ['minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        evidenceSignals: {
          hairTexture: {
            value: 'wavy',
            authority: 'USER_CONFIRMED',
            confidence: 1.0,
            source: 'taste_quiz_confirmation',
            updatedAt: '2026-10-01',
          },
        },
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      weather: 'mild',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.hairStyle !== undefined,
        message: 'Hairstyle recommendation is provided.',
      },
      {
        passed: topThree.bestMatch.hairStyle!.item.compatibleTextures.includes('wavy'),
        message: 'Recommended hairstyle must be compatible with user-confirmed wavy texture.',
      },
    ],
  },
  {
    id: 'case_11_face_shape_soft_multiplier',
    name: 'Face Shape Acts As Soft Multiplier, Never Disqualifier',
    category: 'evidence_authority',
    description: 'User has square face shape. Hair and beard recommendations treat face shape as a gentle multiplier, not a rigid veto.',
    user: {
      id: 'eval_user_11',
      name: 'Square Face User',
      handle: 'square_face',
      createdAt: '2026-10-01',
      visualProfile: {
        id: 'vis_11',
        userId: 'eval_user_11',
        face: { shape: 'square', jaw: 'sharp', hasFacialHair: true },
        hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
        body: { silhouette: 'trapezoid' },
        source: 'visual_analysis',
        lastObservedAt: '2026-10-01',
      },
      styleProfile: {
        id: 'sp_11',
        userId: 'eval_user_11',
        dominantAestheticSlugs: ['smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.hairStyle!.score > 0.5,
        message: 'Hairstyle compatibility score remains solid and non-zero.',
      },
      {
        passed: topThree.bestMatch.groomingStyle!.score > 0.5,
        message: 'Grooming compatibility score remains solid and non-zero.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 5: COLOR THEORY & UNDERTONES
  // =========================================================================
  {
    id: 'case_12_cool_undertone_palette',
    name: 'Cool Undertone Palette Harmonization',
    category: 'color_undertone',
    description: 'User confirmed cool undertone. Engine rewards charcoal, slate, navy, and off-white/black harmony.',
    user: {
      id: 'eval_user_12',
      name: 'Cool Undertone User',
      handle: 'cool_tone',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_12',
        userId: 'eval_user_12',
        dominantAestheticSlugs: ['minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, colorIntensity: 1, contrast: 4 },
        preferences: {
          ...BASE_PREFERENCES,
          userConfirmedUndertone: 'cool',
          preferredColors: ['black', 'charcoal', 'slate'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.factors.some((f) => f.category === 'color_harmony'),
        message: 'Color harmony is actively evaluated.',
      },
      {
        passed: topThree.bestMatch.outfit.item.colorStory !== undefined,
        message: 'Color story description is provided.',
      },
    ],
  },
  {
    id: 'case_13_warm_undertone_earth_tones',
    name: 'Warm Undertone Earth Tone Prioritization',
    category: 'color_undertone',
    description: 'User confirmed warm undertone. Engine highlights earthy camel, olive, canvas tan, and warm tones.',
    user: {
      id: 'eval_user_13',
      name: 'Warm Undertone User',
      handle: 'warm_tone',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_13',
        userId: 'eval_user_13',
        dominantAestheticSlugs: ['old-money', 'smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          userConfirmedUndertone: 'warm',
          preferredColors: ['camel', 'olive', 'canvas-tan'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.safe.outfit.score > 0.6,
        message: 'Safe look scores reliably above baseline.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 6: MODESTY & CULTURAL CEREMONY
  // =========================================================================
  {
    id: 'case_14_high_coverage_modesty',
    name: 'High-Coverage Modesty Preference Strict Veto',
    category: 'modesty_cultural',
    description: 'User selected high-coverage modesty level. Revealing garments, deep scoop tanks, and shorts must be strictly vetoed.',
    user: {
      id: 'eval_user_14',
      name: 'Modest Dressing User',
      handle: 'modest_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_14',
        userId: 'eval_user_14',
        dominantAestheticSlugs: ['minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          modestyLevel: 'high-coverage',
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      weather: 'warm',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: !topThree.safe.outfit.item.items.some(
          (i) => i.garment.modestyRating === 'low-coverage' || i.garment.subcategory === 'shorts'
        ),
        message: 'Safe look must not contain low-coverage garments or shorts.',
      },
      {
        passed: !topThree.bestMatch.outfit.item.items.some(
          (i) => i.garment.modestyRating === 'low-coverage' || i.garment.subcategory === 'shorts'
        ),
        message: 'Best Match look must not contain low-coverage garments or shorts.',
      },
      {
        passed: !topThree.stretch.outfit.item.items.some(
          (i) => i.garment.modestyRating === 'low-coverage' || i.garment.subcategory === 'shorts'
        ),
        message: 'Stretch look must not violate stated high-coverage modesty constraint.',
      },
    ],
  },
  {
    id: 'case_15_cultural_traditional_ceremony',
    name: 'Cultural / Traditional Ceremony Context',
    category: 'modesty_cultural',
    description: 'Cultural/Traditional occasion selected. System honors heritage textiles, bandhgala, kurta tunics and does NOT default to Western business suiting.',
    user: {
      id: 'eval_user_15',
      name: 'Heritage Ceremony Guest',
      handle: 'heritage_guest',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_15',
        userId: 'eval_user_15',
        dominantAestheticSlugs: ['formal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['formal', 'old-money'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('cultural-traditional')!,
      weather: 'mild',
      targetFormality: 5,
    },
    assertions: (topThree) => [
      {
        passed:
          topThree.bestMatch.outfit.item.id === 'outfit_cultural_traditional_01' ||
          topThree.safe.outfit.item.id === 'outfit_cultural_traditional_01',
        message: 'Cultural ceremony look is surfaced in Top 3 looks.',
      },
      {
        passed: topThree.bestMatch.reasons.length >= 2,
        message: 'Honest styling reasons provided.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 7: GROOMING & HAIR TEXTURE FEASIBILITY
  // =========================================================================
  {
    id: 'case_16_coily_hair_protective_style',
    name: 'Coily Hair Natural & Protective Style Feasibility',
    category: 'grooming_hair',
    description: 'User has coily natural hair. Straight-hair only hairstyles must not be top-ranked.',
    user: {
      id: 'eval_user_16',
      name: 'Coily Hair User',
      handle: 'coily_user',
      createdAt: '2026-10-01',
      visualProfile: {
        id: 'vis_16',
        userId: 'eval_user_16',
        face: { shape: 'oval', jaw: 'soft', hasFacialHair: false },
        hair: { texture: 'coily', density: 'high', length: 'short', volume: 'voluminous' },
        body: { silhouette: 'trapezoid' },
        source: 'visual_analysis',
        lastObservedAt: '2026-10-01',
      },
      styleProfile: {
        id: 'sp_16',
        userId: 'eval_user_16',
        dominantAestheticSlugs: ['streetwear', 'minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      weather: 'mild',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.hairStyle!.item.compatibleTextures.includes('coily'),
        message: 'Recommended hairstyle must be compatible with natural coily texture.',
      },
    ],
  },
  {
    id: 'case_17_curly_hair_texture_fit',
    name: 'Curly Hair Texture Compatibility',
    category: 'grooming_hair',
    description: 'User has curly hair. Hairstyle recommendation respects natural curl pattern.',
    user: {
      id: 'eval_user_17',
      name: 'Curly Hair User',
      handle: 'curly_user',
      createdAt: '2026-10-01',
      visualProfile: {
        id: 'vis_17',
        userId: 'eval_user_17',
        face: { shape: 'square', jaw: 'sharp', hasFacialHair: false },
        hair: { texture: 'curly', density: 'medium', length: 'medium', volume: 'moderate' },
        body: { silhouette: 'trapezoid' },
        source: 'visual_analysis',
        lastObservedAt: '2026-10-01',
      },
      styleProfile: {
        id: 'sp_17',
        userId: 'eval_user_17',
        dominantAestheticSlugs: ['smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.hairStyle!.item.compatibleTextures.includes('curly'),
        message: 'Recommended hairstyle supports curly hair.',
      },
    ],
  },
  {
    id: 'case_18_minimal_maintenance_tolerance',
    name: 'Minimal Maintenance Cut Preference',
    category: 'grooming_hair',
    description: 'User stated minimal daily maintenance tolerance. High-maintenance cuts penalized.',
    user: {
      id: 'eval_user_18',
      name: 'Low Maintenance Grooming User',
      handle: 'low_maint',
      createdAt: '2026-10-01',
      visualProfile: {
        id: 'vis_18',
        userId: 'eval_user_18',
        face: { shape: 'oval', jaw: 'sharp', hasFacialHair: false },
        hair: { texture: 'straight', density: 'high', length: 'short', volume: 'moderate' },
        body: { silhouette: 'trapezoid' },
        source: 'visual_analysis',
        lastObservedAt: '2026-10-01',
      },
      styleProfile: {
        id: 'sp_18',
        userId: 'eval_user_18',
        dominantAestheticSlugs: ['minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          maxMaintenanceTolerance: 'minimal',
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      weather: 'mild',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.hairStyle!.item.maintenance === 'minimal',
        message: 'Top recommended haircut has minimal daily maintenance.',
      },
    ],
  },
  {
    id: 'case_19_patchy_beard_density_feasibility',
    name: 'Beard Density Feasibility for Patchy Growth',
    category: 'grooming_hair',
    description: 'User has patchy observed facial hair density. System does not recommend heavy full lumberjack beards.',
    user: {
      id: 'eval_user_19',
      name: 'Patchy Beard User',
      handle: 'patchy_beard',
      createdAt: '2026-10-01',
      visualProfile: {
        id: 'vis_19',
        userId: 'eval_user_19',
        face: {
          shape: 'oval',
          jaw: 'soft',
          hasFacialHair: true,
          beardCharacteristics: {
            currentLength: 'stubble',
            observedDensity: 'patchy',
            growthPattern: 'jawline-only',
          },
        },
        hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
        body: { silhouette: 'trapezoid' },
        source: 'visual_analysis',
        lastObservedAt: '2026-10-01',
      },
      styleProfile: {
        id: 'sp_19',
        userId: 'eval_user_19',
        dominantAestheticSlugs: ['smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed:
          topThree.bestMatch.groomingStyle!.item.minimumDensity === 'none' ||
          topThree.bestMatch.groomingStyle!.item.minimumDensity === 'patchy',
        message: 'Grooming style does not demand thick/heavy density when user has patchy density.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 8: CONFIDENCE STATES & HONEST UNCERTAINTY
  // =========================================================================
  {
    id: 'case_20_missing_context_need_more_info',
    name: 'Missing Context & Preferences -> NEED_MORE_INFO State',
    category: 'uncertainty_confidence',
    description: 'User has no preferences and no context provided. Engine honesty flags NEED_MORE_INFO with a single actionable prompt.',
    user: {
      id: 'eval_user_20',
      name: 'Blank New User',
      handle: 'blank_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_20',
        userId: 'eval_user_20',
        dominantAestheticSlugs: [],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: [],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: undefined, // No context provided
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.confidence.state === 'NEED_MORE_INFO',
        message: 'Confidence state must be NEED_MORE_INFO when context and preferences are missing.',
      },
      {
        passed: !!topThree.bestMatch.confidence.toIncreaseConfidence,
        message: 'Provides ONE concrete prompt to increase confidence.',
      },
    ],
  },
  {
    id: 'case_21_unconfirmed_weather_good_state',
    name: 'Unconfirmed Weather Yields GOOD Confidence with Weather Prompt',
    category: 'uncertainty_confidence',
    description: 'When weather is unconfirmed, confidence is GOOD and toIncreaseConfidence prompts to confirm local temperature.',
    user: {
      id: 'eval_user_21',
      name: 'Unconfirmed Weather User',
      handle: 'unconfirmed_weather',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_21',
        userId: 'eval_user_21',
        dominantAestheticSlugs: ['minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      isWeatherConfirmed: false,
      targetFormality: 4,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.confidence.state === 'GOOD',
        message: 'Confidence state is GOOD when weather is unconfirmed.',
      },
      {
        passed: topThree.bestMatch.confidence.toIncreaseConfidence?.includes('temperature') || false,
        message: 'Prompt suggests confirming temperature.',
      },
    ],
  },
  {
    id: 'case_22_verified_evidence_strong_confidence',
    name: 'Verified Evidence Signals Yield STRONG Confidence',
    category: 'uncertainty_confidence',
    description: 'With verified visual scan, confirmed preferences, and confirmed climate, confidence achieves STRONG state.',
    user: {
      id: 'eval_user_22',
      name: 'Fully Verified User',
      handle: 'verified_user',
      createdAt: '2026-10-01',
      visualProfile: {
        id: 'vis_22',
        userId: 'eval_user_22',
        face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
        hair: { texture: 'wavy', density: 'high', length: 'short', volume: 'moderate' },
        body: { silhouette: 'trapezoid' },
        source: 'visual_analysis',
        lastObservedAt: '2026-10-01',
      },
      styleProfile: {
        id: 'sp_22',
        userId: 'eval_user_22',
        dominantAestheticSlugs: ['korean-minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, volume: 4 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['korean-minimal'],
          fitProportions: {
            ...BASE_PREFERENCES.fitProportions,
            topVolume: 4,
            bottomVolume: 4,
          },
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      temperatureCelsius: 18,
      isWeatherConfirmed: true,
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.confidence.state === 'STRONG',
        message: 'Confidence state is STRONG under complete verified evidence.',
      },
    ],
  },

  // =========================================================================
  // CATEGORY 9: THREE DIVERSE LOOKS (Safe, Best Match, Stretch)
  // =========================================================================
  {
    id: 'case_23_three_distinct_looks_different_tiers',
    name: 'Top 3 Looks Are Meaningfully Different, Never Triplicates',
    category: 'occasion_formality',
    description: 'Ensures SAFE, BEST MATCH, and STRETCH are 3 distinct, non-identical looks representing distinct vectors.',
    user: {
      id: 'eval_user_23',
      name: 'Diversity Validation User',
      handle: 'diverse_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_23',
        userId: 'eval_user_23',
        dominantAestheticSlugs: ['korean-minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, volume: 4 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['korean-minimal'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.safe.tier === 'SAFE',
        message: 'Safe look has SAFE tier tag.',
      },
      {
        passed: topThree.bestMatch.tier === 'BEST_MATCH',
        message: 'Best match look has BEST_MATCH tier tag.',
      },
      {
        passed: topThree.stretch.tier === 'STRETCH',
        message: 'Stretch look has STRETCH tier tag.',
      },
      {
        passed: topThree.safe.outfit.item.id !== topThree.stretch.outfit.item.id,
        message: 'Safe outfit is not identical to Stretch outfit.',
      },
    ],
  },

  // =========================================================================
  // CASES 24-40: EXPANDED SCENARIOS (DIVERSE OCCASIONS, STYLES & CONSTRAINTS)
  // =========================================================================
  {
    id: 'case_24_techwear_commute',
    name: 'Techwear Rainy City Commute',
    category: 'occasion_formality',
    description: 'Techwear enthusiast commuting in drizzle. Functional shells and weather-resistant trousers prioritized.',
    user: {
      id: 'eval_user_24',
      name: 'Tech Commuter',
      handle: 'tech_commute',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_24',
        userId: 'eval_user_24',
        dominantAestheticSlugs: ['techwear'],
        styleVector: { ...BASE_STYLE_VECTOR, utilityPolish: 1 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['techwear'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('travel')!,
      weather: 'rainy',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.score >= 0.6,
        message: 'Best match scores reliably for techwear travel.',
      },
    ],
  },
  {
    id: 'case_25_dark_academia_autumn_campus',
    name: 'Dark Academia Autumn University Campus',
    category: 'occasion_formality',
    description: 'Academic campus in crisp autumn. Tweeds, cable knits, and tailored trousers shine.',
    user: {
      id: 'eval_user_25',
      name: 'Academia Scholar',
      handle: 'scholar',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_25',
        userId: 'eval_user_25',
        dominantAestheticSlugs: ['dark-academia'],
        styleVector: { ...BASE_STYLE_VECTOR, classicTrend: 2 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['dark-academia', 'smart-casual'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('university-college')!,
      weather: 'cool',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.reasons.length >= 2,
        message: 'Contextual reasons provided.',
      },
    ],
  },
  {
    id: 'case_26_old_money_dinner_party',
    name: 'Old Money Heritage Dinner Party',
    category: 'occasion_formality',
    description: 'Heritage tailoring, cashmere, and horsebit loafers for sophisticated evening dinner.',
    user: {
      id: 'eval_user_26',
      name: 'Heritage Patron',
      handle: 'patron',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_26',
        userId: 'eval_user_26',
        dominantAestheticSlugs: ['old-money'],
        styleVector: { ...BASE_STYLE_VECTOR, formality: 4, utilityPolish: 4 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['old-money'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 4,
    },
    assertions: (topThree) => [
      {
        passed: topThree.safe.outfit.item.formality >= 3,
        message: 'Safe look maintains appropriate dinner formality.',
      },
    ],
  },
  {
    id: 'case_27_streetwear_night_out',
    name: 'Contemporary Streetwear Evening Lounge',
    category: 'occasion_formality',
    description: 'Evening club and lounge. Relaxed proportions, graphic texture, and grounded footwear.',
    user: {
      id: 'eval_user_27',
      name: 'Night Owl',
      handle: 'night_owl',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_27',
        userId: 'eval_user_27',
        dominantAestheticSlugs: ['streetwear'],
        styleVector: { ...BASE_STYLE_VECTOR, volume: 4, contrast: 4 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['streetwear'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('night-out')!,
      weather: 'mild',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.score > 0.6,
        message: 'Best match supports streetwear evening proposal.',
      },
    ],
  },
  {
    id: 'case_28_workwear_weekend_craft',
    name: 'Rugged Workwear Weekend Exploration',
    category: 'occasion_formality',
    description: 'Duck canvas, selvedge denim, and service boots calibrated for weekend durability.',
    user: {
      id: 'eval_user_28',
      name: 'Workwear Builder',
      handle: 'builder',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_28',
        userId: 'eval_user_28',
        dominantAestheticSlugs: ['workwear'],
        styleVector: { ...BASE_STYLE_VECTOR, texture: 4, utilityPolish: 1 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['workwear'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      weather: 'cool',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.primaryStyleSlug === 'workwear' || topThree.safe.outfit.item.primaryStyleSlug === 'workwear',
        message: 'Workwear look is surfaced in top looks.',
      },
    ],
  },
  {
    id: 'case_29_vintage_flea_market',
    name: 'Vintage & Archive Aesthetic Discovery',
    category: 'occasion_formality',
    description: 'Archival textures, faded denim, and retro trainers for effortless daytime wander.',
    user: {
      id: 'eval_user_29',
      name: 'Archive Collector',
      handle: 'collector',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_29',
        userId: 'eval_user_29',
        dominantAestheticSlugs: ['vintage'],
        styleVector: { ...BASE_STYLE_VECTOR, classicTrend: 1 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['vintage', 'casual'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      weather: 'mild',
      targetFormality: 1,
    },
    assertions: (topThree) => [
      {
        passed: topThree.safe.overallHarmonyScore >= 0.6,
        message: 'Safe look maintains solid harmony.',
      },
    ],
  },
  {
    id: 'case_30_black_tie_gala_ceremony',
    name: 'Black-Tie Evening Gala Tuxedo',
    category: 'occasion_formality',
    description: 'Black-tie formal dinner. Midnight navy Barathea wool dinner jacket and patent evening slippers.',
    user: {
      id: 'eval_user_30',
      name: 'Gala Attendee',
      handle: 'gala_attendee',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_30',
        userId: 'eval_user_30',
        dominantAestheticSlugs: ['formal'],
        styleVector: { ...BASE_STYLE_VECTOR, formality: 5, structure: 5 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['formal'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
      weather: 'mild',
      targetFormality: 5,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.formality >= 4,
        message: 'Best match achieves high gala formality.',
      },
    ],
  },
  {
    id: 'case_31_job_interview_tailored_presence',
    name: 'Executive Job Interview Tailoring',
    category: 'occasion_formality',
    description: 'High-stakes executive interview. Structured suiting, crisp collar line, and classic side part.',
    user: {
      id: 'eval_user_31',
      name: 'Executive Candidate',
      handle: 'candidate',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_31',
        userId: 'eval_user_31',
        dominantAestheticSlugs: ['smart-casual', 'old-money'],
        styleVector: { ...BASE_STYLE_VECTOR, formality: 4, structure: 4 },
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['smart-casual', 'old-money'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('job-interview')!,
      weather: 'mild',
      targetFormality: 4,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.formality >= 3,
        message: 'Best match meets professional interview formality threshold.',
      },
    ],
  },
  {
    id: 'case_32_first_date_intimate_lighting',
    name: 'Intimate Evening First Date',
    category: 'occasion_formality',
    description: 'Evening date focusing on tactile textures (knit polo, merino), moody palette, and calm self-assurance.',
    user: {
      id: 'eval_user_32',
      name: 'Date Night User',
      handle: 'date_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_32',
        userId: 'eval_user_32',
        dominantAestheticSlugs: ['smart-casual', 'minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['smart-casual', 'minimal'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('date')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.overallHarmonyScore >= 0.7,
        message: 'Best match achieves high harmony score for evening date.',
      },
    ],
  },
  {
    id: 'case_33_airport_travel_ergonomics',
    name: 'Airport Transit Ergonomics & Temperature Shifts',
    category: 'occasion_formality',
    description: 'Long-haul travel. Easy slip-on footwear, wrinkle-resistant fluid trousers, and comfortable layers.',
    user: {
      id: 'eval_user_33',
      name: 'Global Traveler',
      handle: 'traveler',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_33',
        userId: 'eval_user_33',
        dominantAestheticSlugs: ['minimal', 'korean-minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['minimal', 'korean-minimal'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('travel')!,
      weather: 'mild',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.safe.outfit.item.formality <= 3,
        message: 'Travel formality stays relaxed and functional.',
      },
    ],
  },
  {
    id: 'case_34_androgynous_styling_direction',
    name: 'Androgynous Gender-Coding Direction Calibration',
    category: 'taste_feedback',
    description: 'User selected androgynous styling direction. Fluid tailoring, genderless cuts, and neutral styling advice.',
    user: {
      id: 'eval_user_34',
      name: 'Androgynous Explorer',
      handle: 'androgynous_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_34',
        userId: 'eval_user_34',
        dominantAestheticSlugs: ['korean-minimal', 'minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, genderCoding: 'androgynous' },
        preferences: {
          ...BASE_PREFERENCES,
          genderCodingDirection: 'androgynous',
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.items.some((i) => i.garment.genderCoding === 'androgynous'),
        message: 'Includes androgynous-coded pieces in recommendation.',
      },
    ],
  },
  {
    id: 'case_35_masculine_tailored_direction',
    name: 'Masculine Classic Tailoring Direction',
    category: 'taste_feedback',
    description: 'User selected masculine gender-coding direction. Classic shoulder structure and traditional tailoring.',
    user: {
      id: 'eval_user_35',
      name: 'Classic Sartorialist',
      handle: 'sartorialist',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_35',
        userId: 'eval_user_35',
        dominantAestheticSlugs: ['old-money', 'smart-casual'],
        styleVector: { ...BASE_STYLE_VECTOR, genderCoding: 'masculine' },
        preferences: {
          ...BASE_PREFERENCES,
          genderCodingDirection: 'masculine',
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.score > 0.65,
        message: 'Best match produces solid tailored score.',
      },
    ],
  },
  {
    id: 'case_36_neutral_styling_language_guardrail',
    name: 'Strict Verification: Neutral Styling Language Guardrail',
    category: 'taste_feedback',
    description: 'CRITICAL: Verifies no body-shaming or flaw-fixing vocabulary exists across all reasons, cautions, and advice.',
    user: {
      id: 'eval_user_36',
      name: 'Guardrail Test User',
      handle: 'guardrail_test',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_36',
        userId: 'eval_user_36',
        dominantAestheticSlugs: ['minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => {
      const bannedWords = ['slimming', 'hide flaws', 'conceal body', 'problem areas', 'fix body', 'unattractive'];
      const allText = [
        ...topThree.bestMatch.reasons,
        ...(topThree.bestMatch.cautions || []),
        ...(topThree.bestMatch.outfit.stylingAdvice || []),
        ...topThree.safe.reasons,
        ...(topThree.safe.cautions || []),
        ...topThree.stretch.reasons,
      ].join(' ').toLowerCase();

      const foundBanned = bannedWords.filter((w) => allText.includes(w));
      return [
        {
          passed: foundBanned.length === 0,
          message: foundBanned.length === 0
            ? 'Language strictly adheres to neutral architectural styling guardrails.'
            : `VIOLATION: Found prohibited body-shaming words: ${foundBanned.join(', ')}`,
        },
      ];
    },
  },
  {
    id: 'case_37_monochrome_palette_discipline',
    name: 'Monochromatic Styling Discipline',
    category: 'color_undertone',
    description: 'User specified monochromatic palette preference. Engine assembles high-contrast black/charcoal/off-white looks.',
    user: {
      id: 'eval_user_37',
      name: 'Monochrome Purist',
      handle: 'mono_purist',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_37',
        userId: 'eval_user_37',
        dominantAestheticSlugs: ['minimal', 'korean-minimal'],
        styleVector: { ...BASE_STYLE_VECTOR, colorIntensity: 1 },
        preferences: {
          ...BASE_PREFERENCES,
          accentColorTolerance: 'monochromatic',
          preferredColors: ['black', 'charcoal', 'off-white'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.colorStory?.toLowerCase().includes('monochrome') || false,
        message: 'Color story notes monochromatic discipline.',
      },
    ],
  },
  {
    id: 'case_38_footwear_grounding_balance',
    name: 'Footwear Grounding for Wide Proportions',
    category: 'silhouette_proportions',
    description: 'Chunky derbies or heavy sole shoes ground fluid wide trousers, avoiding flimsy barefoot impression.',
    user: {
      id: 'eval_user_38',
      name: 'Footwear Grounding User',
      handle: 'footwear_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_38',
        userId: 'eval_user_38',
        dominantAestheticSlugs: ['korean-minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.items.some((i) => i.garment.category === 'footwear'),
        message: 'Footwear is present and anchors the outfit.',
      },
    ],
  },
  {
    id: 'case_39_custom_curated_event',
    name: 'Custom Curated Event Context',
    category: 'occasion_formality',
    description: 'Occasion is custom-defined by user. Engine adapts without breaking down.',
    user: {
      id: 'eval_user_39',
      name: 'Custom Event Host',
      handle: 'custom_host',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_39',
        userId: 'eval_user_39',
        dominantAestheticSlugs: ['minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('custom')!,
      weather: 'mild',
      targetFormality: 3,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch !== undefined && topThree.safe !== undefined && topThree.stretch !== undefined,
        message: 'Complete Top 3 looks returned for custom curated event.',
      },
    ],
  },
  {
    id: 'case_40_social_house_party_effortless',
    name: 'Social House Party Effortless Mobility',
    category: 'occasion_formality',
    description: 'House party setting. High mobility, relaxed presence, avoiding corporate stiffness.',
    user: {
      id: 'eval_user_40',
      name: 'Party Host',
      handle: 'party_host',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_40',
        userId: 'eval_user_40',
        dominantAestheticSlugs: ['streetwear', 'korean-minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          preferredStyleSlugs: ['streetwear', 'korean-minimal'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('party')!,
      weather: 'mild',
      targetFormality: 2,
    },
    assertions: (topThree) => [
      {
        passed: topThree.bestMatch.outfit.item.formality <= 3,
        message: 'Formality remains effortless and social without rigid suit stiffness.',
      },
      {
        passed: topThree.bestMatch.confidence.state === 'GOOD' || topThree.bestMatch.confidence.state === 'STRONG',
        message: 'Confidence is solid.',
      },
    ],
  },
];
