import { describe, it, expect } from 'vitest';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
import { recommendationService } from '../src/core/services';
import { defaultStore } from '../src/core/persistence';
import { knowledgeBase } from '../src/core/knowledge';
import { HairCompatibilityEvaluator } from '../src/core/intelligence/hair-compatibility';
import { GroomingCompatibilityEvaluator } from '../src/core/intelligence/grooming-compatibility';
import { User, VisualProfile, Context, resolveEvidenceSignal, EvidenceSignal } from '../src/core/domain';

describe('Personalization Integrity Regression Suite (Phase 2)', () => {
  // Test A: Demo profile generates demo-specific reasoning
  it('A. Demo profile generates demo-specific reasoning (oval face, wavy texture, stubble)', async () => {
    const demoUser = await defaultStore.getUser('usr_vael_curator');
    expect(demoUser).toBeDefined();

    const occasion = knowledgeBase.getOccasionBySlug('dinner')!;
    const context: Context = { occasion, weather: 'mild', targetFormality: 3 };

    const topThree = recommendationService.generateTopThreeLooks({
      user: demoUser!,
      context,
    });

    expect(topThree.bestMatch.hairStyle).toBeDefined();
    const hairReasons = topThree.bestMatch.hairStyle?.reasons || [];
    const reasonsJoined = hairReasons.join(' ');
    // Demo user has wavy hair, oval face
    expect(reasonsJoined).toMatch(/wavy|oval/i);
  });

  // Test B: User profile generates user-specific reasoning
  it('B. User profile generates user-specific reasoning matching entered values', () => {
    const customUser: User = {
      id: 'usr_custom_b',
      name: 'Custom B',
      handle: 'custom_b',
      createdAt: new Date().toISOString(),
      visualProfile: {
        id: 'vis_b',
        userId: 'usr_custom_b',
        face: {
          shape: 'round',
          jaw: 'soft',
          hasFacialHair: true,
          beardCharacteristics: {
            currentLength: 'full',
            observedDensity: 'thick',
          },
        },
        hair: {
          texture: 'curly',
          density: 'low',
          length: 'medium',
          volume: 'moderate',
        },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: new Date().toISOString(),
      },
      styleProfile: {
        id: 'sty_b',
        userId: 'usr_custom_b',
        dominantAestheticSlugs: ['minimal'],
        styleVector: knowledgeBase.getStyleBySlug('minimal')!.styleVector,
        preferences: {
          preferredStyleSlugs: ['minimal'],
          dislikedStyleSlugs: [],
          preferredColors: ['black'],
          dislikedColors: [],
          preferredFits: ['regular'],
          dislikedFits: [],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: {
            preferredFits: ['regular'],
            dislikedFits: [],
            topVolume: 3,
            bottomVolume: 3,
            preferredSilhouettes: [],
            dislikedSilhouettes: [],
            layeringPreference: 'minimal',
            garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
          },
          modestyLevel: 'standard',
          userConfirmedUndertone: 'unspecified',
          genderCodingDirection: 'androgynous',
          preferredFormalityRange: [2, 4],
          maxMaintenanceTolerance: 'moderate',
          accessoryAffinities: [],
        },
        feedbackProfile: {
          history: [],
          learnedStyleAffinities: {},
          learnedColorAffinities: {},
          learnedSilhouetteAffinities: {},
          learnedFitAffinities: {},
          repeatPassCount: {},
        },
        updatedAt: new Date().toISOString(),
      },
    };

    const occasion = knowledgeBase.getOccasionBySlug('casual')!;
    const context: Context = { occasion, weather: 'mild' };

    const topThree = recommendationService.generateTopThreeLooks({
      user: customUser,
      context,
    });

    const hairRec = topThree.bestMatch.hairStyle;
    const groomingRec = topThree.bestMatch.groomingStyle;

    expect(hairRec).toBeDefined();
    const hairReasons = (hairRec?.reasons || []).join(' ');
    // Must acknowledge entered curly / round geometry
    expect(hairReasons).toMatch(/curly|round/i);
    // Must NOT mention oval
    expect(hairReasons).not.toContain('oval');

    expect(groomingRec).toBeDefined();
    const groomingReasons = (groomingRec?.reasons || []).join(' ');
    expect(groomingReasons).toMatch(/round/i);
    expect(groomingReasons).not.toContain('oval');
  });

  // Test C: Switching demo -> user removes all demo attributes
  it('C. Switching demo -> user removes all demo attributes cleanly', async () => {
    const demoUser = await defaultStore.getUser('usr_vael_curator');
    const customVisual: VisualProfile = {
      id: 'vis_c',
      userId: 'usr_c',
      face: {
        shape: 'square',
        jaw: 'sharp',
        hasFacialHair: false,
      },
      hair: {
        texture: 'coily',
        density: 'high',
        length: 'short',
        volume: 'voluminous',
      },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const customUser: User = {
      ...demoUser!,
      id: 'usr_c',
      visualProfile: customVisual,
    };

    const occasion = knowledgeBase.getOccasionBySlug('dinner')!;
    const context: Context = { occasion, weather: 'mild' };

    const looks = recommendationService.generateTopThreeLooks({ user: customUser, context });
    const hairReasons = (looks.bestMatch.hairStyle?.reasons || []).join(' ');
    expect(hairReasons).not.toContain('wavy');
    expect(hairReasons).not.toContain('oval');
    expect(hairReasons).toContain('square');
    expect(hairReasons).toContain('coily');
  });

  // Test D: ROUND face must never produce an "oval face" reason
  it('D. ROUND face must never produce an "oval face" reason anywhere', () => {
    const roundVisual: VisualProfile = {
      id: 'vis_round',
      userId: 'usr_round',
      face: { shape: 'round', jaw: 'soft', hasFacialHair: false },
      hair: { texture: 'straight', density: 'medium', length: 'medium', volume: 'moderate' },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const hairRecs = knowledgeBase.getAllHairstyles().map((h) =>
      HairCompatibilityEvaluator.evaluate(h, { visual: roundVisual })
    );

    hairRecs.forEach((r) => {
      const allReasons = (r.reasons || []).concat(r.cautions || []).join(' ');
      expect(allReasons).not.toMatch(/\boval\b/i);
    });

    const beardRecs = knowledgeBase.getAllBeards().map((b) =>
      GroomingCompatibilityEvaluator.evaluate(b, { visual: roundVisual })
    );

    beardRecs.forEach((r) => {
      const allReasons = (r.reasons || []).concat(r.cautions || []).join(' ');
      expect(allReasons).not.toMatch(/\boval\b/i);
    });
  });

  // Test E: CURLY/LOW density must never produce "wavy/high density" as observed user evidence
  it('E. CURLY/LOW density must never produce "wavy/high density" as user evidence', () => {
    const curlyLowVisual: VisualProfile = {
      id: 'vis_curly_low',
      userId: 'usr_curly_low',
      face: { shape: 'square', jaw: 'angular', hasFacialHair: false },
      hair: { texture: 'curly', density: 'low', length: 'medium', volume: 'moderate' },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const hairRecs = knowledgeBase.getAllHairstyles().map((h) =>
      HairCompatibilityEvaluator.evaluate(h, { visual: curlyLowVisual })
    );

    hairRecs.forEach((r) => {
      const reasonText = (r.reasons || []).join(' ');
      expect(reasonText).not.toContain('wavy');
      expect(reasonText).not.toContain('high density');
    });
  });

  // Test F: FULL facial hair must not be described as medium density unless separately established
  it('F. FULL facial hair must not be described as medium density unless separately established', () => {
    const fullThickVisual: VisualProfile = {
      id: 'vis_thick',
      userId: 'usr_thick',
      face: {
        shape: 'oval',
        jaw: 'sharp',
        hasFacialHair: true,
        beardCharacteristics: {
          currentLength: 'full',
          observedDensity: 'thick',
        },
      },
      hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const beardRecs = knowledgeBase.getAllBeards().map((b) =>
      GroomingCompatibilityEvaluator.evaluate(b, { visual: fullThickVisual })
    );

    beardRecs.forEach((r) => {
      const reasons = (r.reasons || []).join(' ');
      expect(reasons).not.toContain('medium facial hair density');
      if (reasons.includes('facial hair density')) {
        expect(reasons).toContain('thick');
      }
    });
  });

  // Test G: Changing one profile attribute changes only relevant recommendation factors
  it('G. Changing one profile attribute (hair texture) changes hair factors without corrupting occasion', () => {
    const baseVisual: VisualProfile = {
      id: 'vis_base',
      userId: 'usr_base',
      face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
      hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const curlyVisual: VisualProfile = {
      ...baseVisual,
      hair: { ...baseVisual.hair, texture: 'curly' },
    };

    const occasion = knowledgeBase.getOccasionBySlug('wedding')!;
    const context: Context = { occasion, weather: 'mild' };

    const cropStyle = knowledgeBase.getHairstyleBySlug('textured-crop')!;

    const recStraight = HairCompatibilityEvaluator.evaluate(cropStyle, { visual: baseVisual, context });
    const recCurly = HairCompatibilityEvaluator.evaluate(cropStyle, { visual: curlyVisual, context });

    // Occasion factor should be completely identical
    const occStraight = recStraight.factors.find((f) => f.category === 'occasion_fit');
    const occCurly = recCurly.factors.find((f) => f.category === 'occasion_fit');
    expect(occStraight?.score).toBe(occCurly?.score);

    // Visual texture factor reasons should reflect the change
    expect(recStraight.reasons.join(' ')).toContain('straight');
    expect(recCurly.reasons.join(' ')).toContain('curly');
  });

  // Test H: User-entered evidence outranks vision/default evidence
  it('H. User-entered evidence strictly outranks vision and default evidence', () => {
    const defaultSignal: EvidenceSignal<string> = {
      value: 'straight',
      authority: 'DEFAULT',
      confidence: 0.5,
      source: 'default_baseline',
      updatedAt: new Date().toISOString(),
    };

    const visionSignal: EvidenceSignal<string> = {
      value: 'straight',
      authority: 'VISION',
      confidence: 0.75,
      source: 'camera_analysis',
      updatedAt: new Date().toISOString(),
    };

    const userSignal: EvidenceSignal<string> = {
      value: 'wavy',
      authority: 'USER_ENTERED',
      confidence: 1.0,
      source: 'manual_profile_edit',
      updatedAt: new Date().toISOString(),
    };

    // Vision overwrites default
    const resolved1 = resolveEvidenceSignal(defaultSignal, visionSignal);
    expect(resolved1.value).toBe('straight');
    expect(resolved1.authority).toBe('VISION');

    // User-entered overwrites vision
    const resolved2 = resolveEvidenceSignal(resolved1, userSignal);
    expect(resolved2.value).toBe('wavy');
    expect(resolved2.authority).toBe('USER_ENTERED');

    // Incoming vision CANNOT overwrite user-entered
    const resolved3 = resolveEvidenceSignal(resolved2, visionSignal);
    expect(resolved3.value).toBe('wavy');
    expect(resolved3.authority).toBe('USER_ENTERED');
  });

  // Test I: Empty profile state never claims personalized recommendations are being generated
  it('I. Empty profile state handles absence of visual signals without crashing or false claims', () => {
    const emptyUser: User = {
      id: 'usr_empty',
      name: 'Unset Profile',
      handle: 'empty',
      createdAt: new Date().toISOString(),
      styleProfile: {
        id: 'sty_empty',
        userId: 'usr_empty',
        dominantAestheticSlugs: ['minimal'],
        styleVector: knowledgeBase.getStyleBySlug('minimal')!.styleVector,
        preferences: {
          preferredStyleSlugs: ['minimal'],
          dislikedStyleSlugs: [],
          preferredColors: ['black'],
          dislikedColors: [],
          preferredFits: ['regular'],
          dislikedFits: [],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: {
            preferredFits: ['regular'],
            dislikedFits: [],
            topVolume: 3,
            bottomVolume: 3,
            preferredSilhouettes: [],
            dislikedSilhouettes: [],
            layeringPreference: 'moderate',
            garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
          },
          modestyLevel: 'standard',
          userConfirmedUndertone: 'unspecified',
          genderCodingDirection: 'androgynous',
          preferredFormalityRange: [1, 5],
          maxMaintenanceTolerance: 'moderate',
          accessoryAffinities: [],
        },
        feedbackProfile: {
          history: [],
          learnedStyleAffinities: {},
          learnedColorAffinities: {},
          learnedSilhouetteAffinities: {},
          learnedFitAffinities: {},
          repeatPassCount: {},
        },
        updatedAt: new Date().toISOString(),
      },
    };

    const occasion = knowledgeBase.getOccasionBySlug('casual')!;
    const context: Context = { occasion, weather: 'mild' };

    const topThree = recommendationService.generateTopThreeLooks({ user: emptyUser, context });
    // Without visual profile, hair/grooming should not claim observed features
    if (topThree.bestMatch.hairStyle) {
      const reasons = topThree.bestMatch.hairStyle.reasons.join(' ');
      expect(reasons).not.toContain('observed');
    }
  });
});
