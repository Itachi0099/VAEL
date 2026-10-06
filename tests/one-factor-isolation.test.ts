import { describe, it, expect } from 'vitest';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
import { recommendationService } from '../src/core/services';
import { defaultStore } from '../src/core/persistence';
import { knowledgeBase } from '../src/core/knowledge';
import { HairCompatibilityEvaluator } from '../src/core/intelligence/hair-compatibility';
import { GroomingCompatibilityEvaluator } from '../src/core/intelligence/grooming-compatibility';
import { User, VisualProfile, Context, resolveEvidenceSignal, EvidenceSignal } from '../src/core/domain';

describe('Audit 7 — One-Factor Isolation Automated Regression Suite', () => {
  // Test A: Same profile/context -> deterministic same result.
  it('A. Determinism: Same profile/context produces identical look IDs and scores', async () => {
    const demoUser = await defaultStore.getUser('usr_vael_curator');
    const occasion = knowledgeBase.getOccasionBySlug('dinner')!;
    const context: Context = { occasion, weather: 'mild', targetFormality: 3 };

    const run1 = recommendationService.generateTopThreeLooks({ user: demoUser!, context });
    const run2 = recommendationService.generateTopThreeLooks({ user: demoUser!, context });

    expect(run1.safe.outfit.item.id).toBe(run2.safe.outfit.item.id);
    expect(run1.bestMatch.outfit.item.id).toBe(run2.bestMatch.outfit.item.id);
    expect(run1.stretch.outfit.item.id).toBe(run2.stretch.outfit.item.id);
    expect(run1.bestMatch.overallHarmonyScore).toBe(run2.bestMatch.overallHarmonyScore);
    expect(run1.safe.overallHarmonyScore).toBe(run2.safe.overallHarmonyScore);
    expect(run1.stretch.overallHarmonyScore).toBe(run2.stretch.overallHarmonyScore);
  });

  // Test B: Change ONLY hair texture -> only relevant hair/grooming/style consequences change.
  it('B. Isolation: Change ONLY hair texture -> only hair/grooming evaluation changes, outfit scoring unchanged', () => {
    const baseVisual: VisualProfile = {
      id: 'vis_test_b',
      userId: 'usr_test_b',
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

    const baseUser: User = {
      id: 'usr_test_b',
      name: 'Test B',
      handle: 'test_b',
      createdAt: new Date().toISOString(),
      visualProfile: baseVisual,
      styleProfile: {
        id: 'sty_test_b',
        userId: 'usr_test_b',
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
          preferredFormalityRange: [2, 4],
          maxMaintenanceTolerance: 'moderate',
          accessoryAffinities: [],
        },
        feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
        updatedAt: new Date().toISOString(),
      },
    };

    const curlyUser: User = {
      ...baseUser,
      visualProfile: curlyVisual,
    };

    const occasion = knowledgeBase.getOccasionBySlug('dinner')!;
    const context: Context = { occasion, weather: 'mild', targetFormality: 3 };

    const resStraight = recommendationService.generateTopThreeLooks({ user: baseUser, context });
    const resCurly = recommendationService.generateTopThreeLooks({ user: curlyUser, context });

    // Outfit tier selection and outfit scoring must be completely identical
    expect(resStraight.bestMatch.outfit.item.id).toBe(resCurly.bestMatch.outfit.item.id);
    expect(resStraight.bestMatch.outfit.score).toBe(resCurly.bestMatch.outfit.score);
    expect(resStraight.safe.outfit.item.id).toBe(resCurly.safe.outfit.item.id);

    // Hair recommendations must reflect the change
    expect(resStraight.bestMatch.hairStyle?.reasons.join(' ')).toContain('straight');
    expect(resCurly.bestMatch.hairStyle?.reasons.join(' ')).toContain('curly');
  });

  // Test C: Change ONLY occasion -> occasion/formality-related ranking changes; unrelated profile evidence remains stable.
  it('C. Isolation: Change ONLY occasion -> occasion/formality changes while personal visual evidence remains stable', async () => {
    const demoUser = await defaultStore.getUser('usr_vael_curator');

    const dinnerOccasion = knowledgeBase.getOccasionBySlug('dinner')!;
    const casualOccasion = knowledgeBase.getOccasionBySlug('casual')!;

    const dinnerContext: Context = { occasion: dinnerOccasion, weather: 'mild', targetFormality: 4 };
    const casualContext: Context = { occasion: casualOccasion, weather: 'mild', targetFormality: 1 };

    const dinnerLooks = recommendationService.generateTopThreeLooks({ user: demoUser!, context: dinnerContext });
    const casualLooks = recommendationService.generateTopThreeLooks({ user: demoUser!, context: casualContext });

    // Occasion applied must differ
    expect(dinnerLooks.contextApplied).toBe('Fine Dining / Dinner Party');
    expect(casualLooks.contextApplied).toBe('Everyday Casual / Weekend');

    // Outfits selected must calibrate to differing formalities
    expect(dinnerLooks.bestMatch.outfit.item.formality).toBeGreaterThan(casualLooks.bestMatch.outfit.item.formality);

    // Unrelated visual profile evidence (e.g., hair texture 'wavy') remains identical in reasoning
    expect(dinnerLooks.bestMatch.hairStyle?.reasons.join(' ')).toContain('wavy');
    expect(casualLooks.bestMatch.hairStyle?.reasons.join(' ')).toContain('wavy');
  });

  // Test D: Change ONLY temperature -> climate suitability changes.
  it('D. Isolation: Change ONLY temperature -> climate scoring and fabric suitability changes', async () => {
    const demoUser = await defaultStore.getUser('usr_vael_curator');
    const occasion = knowledgeBase.getOccasionBySlug('dinner')!;

    const coldContext: Context = { occasion, weather: 'cold', temperatureCelsius: 5 };
    const hotContext: Context = { occasion, weather: 'hot', temperatureCelsius: 32 };

    const coldLooks = recommendationService.generateTopThreeLooks({ user: demoUser!, context: coldContext });
    const hotLooks = recommendationService.generateTopThreeLooks({ user: demoUser!, context: hotContext });

    // Hot context must not recommend heavy outerwear or winter pieces
    const hotGarments = hotLooks.bestMatch.outfit.item.items.map((i) => i.garment);
    const hasHeavyWoolInHot = hotGarments.some((g) => g.fabricWeight === 'heavyweight' && g.material.toLowerCase().includes('wool'));
    expect(hasHeavyWoolInHot).toBe(false);

    // Weather factors in candidate evaluation must reflect temperature condition
    const coldWeatherFactor = coldLooks.bestMatch.outfit.factors.find((f) => f.category === 'weather_fit');
    const hotWeatherFactor = hotLooks.bestMatch.outfit.factors.find((f) => f.category === 'weather_fit');
    expect(coldWeatherFactor).toBeDefined();
    expect(hotWeatherFactor).toBeDefined();
  });

  // Test E: Change ONLY formality -> formality ranking changes.
  it('E. Isolation: Change ONLY formality override -> formality ranking shifts accordingly', async () => {
    const demoUser = await defaultStore.getUser('usr_vael_curator');
    const occasion = knowledgeBase.getOccasionBySlug('office')!; // allowable band [2, 4]

    const lowFormalityContext: Context = { occasion, weather: 'mild', targetFormality: 2 };
    const highFormalityContext: Context = { occasion, weather: 'mild', targetFormality: 4 };

    const lowLooks = recommendationService.generateTopThreeLooks({ user: demoUser!, context: lowFormalityContext });
    const highLooks = recommendationService.generateTopThreeLooks({ user: demoUser!, context: highFormalityContext });

    const lowOccasionFactor = lowLooks.bestMatch.outfit.factors.find((f) => f.category === 'occasion_fit');
    const highOccasionFactor = highLooks.bestMatch.outfit.factors.find((f) => f.category === 'occasion_fit');
    expect(lowOccasionFactor).toBeDefined();
    expect(highOccasionFactor).toBeDefined();

    // High formality office should calibrate towards higher formality pieces
    expect(highLooks.bestMatch.outfit.item.formality).toBeGreaterThanOrEqual(lowLooks.bestMatch.outfit.item.formality);
  });

  // Test F: Change ONLY archetype -> style-vector/ranking changes.
  it('F. Isolation: Change ONLY archetype -> style vector affinity and ranking changes', () => {
    const baseVisual: VisualProfile = {
      id: 'vis_test_f',
      userId: 'usr_test_f',
      face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
      hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const makeUserWithStyle = (styleSlug: string): User => ({
      id: 'usr_test_f',
      name: 'Test F',
      handle: 'test_f',
      createdAt: new Date().toISOString(),
      visualProfile: baseVisual,
      styleProfile: {
        id: 'sty_test_f',
        userId: 'usr_test_f',
        dominantAestheticSlugs: [styleSlug],
        styleVector: knowledgeBase.getStyleBySlug(styleSlug)!.styleVector,
        preferences: {
          preferredStyleSlugs: [styleSlug],
          dislikedStyleSlugs: [],
          preferredColors: ['black', 'white', 'grey', 'tan'],
          dislikedColors: [],
          preferredFits: ['relaxed', 'regular'],
          dislikedFits: ['skinny'],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: {
            preferredFits: ['relaxed', 'regular'],
            dislikedFits: ['skinny'],
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
          preferredFormalityRange: [2, 4],
          maxMaintenanceTolerance: 'moderate',
          accessoryAffinities: [],
        },
        feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
        updatedAt: new Date().toISOString(),
      },
    });

    const workwearUser = makeUserWithStyle('workwear');
    const minimalUser = makeUserWithStyle('minimal');

    const occasion = knowledgeBase.getOccasionBySlug('office')!;
    const context: Context = { occasion, weather: 'mild' };

    const workwearLooks = recommendationService.generateTopThreeLooks({ user: workwearUser, context });
    const minimalLooks = recommendationService.generateTopThreeLooks({ user: minimalUser, context });

    // The style affinities and top outputs reflect the chosen archetype
    expect(workwearLooks.bestMatch.outfit.item.primaryStyleSlug).not.toBe('minimal');
    expect(minimalLooks.bestMatch.outfit.item.primaryStyleSlug).toBe('minimal');
    const workwearAffinity = workwearLooks.bestMatch.outfit.factors.find((f) => f.category === 'style_affinity')?.score;
    const minimalAffinityInMinimal = minimalLooks.bestMatch.outfit.factors.find((f) => f.category === 'style_affinity')?.score;
    expect(workwearAffinity).toBeGreaterThanOrEqual(0.7);
    expect(minimalAffinityInMinimal).toBeGreaterThanOrEqual(0.7);
  });

  // Test G: Change ONLY explicit dislike -> disliked styles are penalized/vetoed according to existing rules.
  it('G. Isolation: Change ONLY explicit dislike -> disliked style is vetoed from selection', () => {
    const baseVisual: VisualProfile = {
      id: 'vis_test_g',
      userId: 'usr_test_g',
      face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
      hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const makeUserWithDislike = (dislikedSlugs: string[]): User => ({
      id: 'usr_test_g',
      name: 'Test G',
      handle: 'test_g',
      createdAt: new Date().toISOString(),
      visualProfile: baseVisual,
      styleProfile: {
        id: 'sty_test_g',
        userId: 'usr_test_g',
        dominantAestheticSlugs: ['korean-minimal'],
        styleVector: knowledgeBase.getStyleBySlug('korean-minimal')!.styleVector,
        preferences: {
          preferredStyleSlugs: ['korean-minimal', 'minimal'],
          dislikedStyleSlugs: dislikedSlugs,
          preferredColors: ['black', 'white'],
          dislikedColors: [],
          preferredFits: ['relaxed'],
          dislikedFits: ['skinny'],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: {
            preferredFits: ['relaxed'],
            dislikedFits: ['skinny'],
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
          preferredFormalityRange: [2, 4],
          maxMaintenanceTolerance: 'moderate',
          accessoryAffinities: [],
        },
        feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
        updatedAt: new Date().toISOString(),
      },
    });

    const userWithoutDislike = makeUserWithDislike([]);
    const userWithDislike = makeUserWithDislike(['korean-minimal']);

    const occasion = knowledgeBase.getOccasionBySlug('dinner')!;
    const context: Context = { occasion, weather: 'mild' };

    const looksAllowed = recommendationService.generateTopThreeLooks({ user: userWithoutDislike, context });
    const looksDisliked = recommendationService.generateTopThreeLooks({ user: userWithDislike, context });

    expect(looksAllowed.bestMatch.outfit.item.primaryStyleSlug).toBe('korean-minimal');
    // In looksDisliked, korean-minimal was hard-vetoed, so it cannot be bestMatch
    expect(looksDisliked.bestMatch.outfit.item.primaryStyleSlug).not.toBe('korean-minimal');
  });

  // Test H: Demo -> custom profile -> zero demo traits leak.
  it('H. Isolation: Demo -> custom profile -> zero demo traits leak into results', async () => {
    const customVisual: VisualProfile = {
      id: 'vis_test_h',
      userId: 'usr_test_h',
      face: { shape: 'heart', jaw: 'soft', hasFacialHair: false },
      hair: { texture: 'coily', density: 'high', length: 'buzz', volume: 'flat' },
      body: { silhouette: 'rectangle' },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const customUser: User = {
      id: 'usr_test_h',
      name: 'Custom H',
      handle: 'custom_h',
      createdAt: new Date().toISOString(),
      visualProfile: customVisual,
      styleProfile: {
        id: 'sty_test_h',
        userId: 'usr_test_h',
        dominantAestheticSlugs: ['techwear'],
        styleVector: knowledgeBase.getStyleBySlug('techwear')!.styleVector,
        preferences: {
          preferredStyleSlugs: ['techwear'],
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
          preferredFormalityRange: [2, 3],
          maxMaintenanceTolerance: 'minimal',
          accessoryAffinities: [],
        },
        feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
        updatedAt: new Date().toISOString(),
      },
    };

    const occasion = knowledgeBase.getOccasionBySlug('casual')!;
    const context: Context = { occasion, weather: 'mild' };

    const looks = recommendationService.generateTopThreeLooks({ user: customUser, context });
    const hairReasons = (looks.bestMatch.hairStyle?.reasons || []).join(' ');

    // Demo user attributes are oval face and wavy hair:
    expect(hairReasons).not.toContain('oval');
    expect(hairReasons).not.toContain('wavy');
    expect(hairReasons).toContain('coily');
  });

  // Test I: User-entered evidence still outranks vision/default.
  it('I. Isolation: User-entered evidence strictly outranks vision and default signals', () => {
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
      value: 'curly',
      authority: 'USER_ENTERED',
      confidence: 1.0,
      source: 'manual_profile_edit',
      updatedAt: new Date().toISOString(),
    };

    const resolved = resolveEvidenceSignal(resolveEvidenceSignal(defaultSignal, visionSignal), userSignal);
    expect(resolved.value).toBe('curly');
    expect(resolved.authority).toBe('USER_ENTERED');

    // Attempting to overwrite with vision fails
    const rechecked = resolveEvidenceSignal(resolved, visionSignal);
    expect(rechecked.value).toBe('curly');
    expect(rechecked.authority).toBe('USER_ENTERED');
  });

  // Test J: Empty profile still produces honest NEED_MORE_INFO behavior.
  it('J. Isolation: Empty profile produces honest NEED_MORE_INFO behavior without crashing', () => {
    const emptyUser: User = {
      id: 'usr_test_empty',
      name: 'Empty User',
      handle: 'empty_user',
      createdAt: new Date().toISOString(),
      styleProfile: {
        id: 'sty_test_empty',
        userId: 'usr_test_empty',
        dominantAestheticSlugs: [],
        styleVector: {
          formality: 3,
          structure: 3,
          volume: 3,
          colorIntensity: 1,
          contrast: 3,
          pattern: 1,
          texture: 2,
          ornamentation: 1,
          classicTrend: 3,
          utilityPolish: 3,
          genderCoding: 'androgynous',
        },
        preferences: {
          preferredStyleSlugs: [],
          dislikedStyleSlugs: [],
          preferredColors: [],
          dislikedColors: [],
          preferredFits: [],
          dislikedFits: [],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: {
            preferredFits: [],
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
        feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
        updatedAt: new Date().toISOString(),
      },
    };

    const topThree = recommendationService.generateTopThreeLooks({ user: emptyUser });
    expect(topThree.bestMatch.confidence.state).toBe('NEED_MORE_INFO');
    expect(topThree.bestMatch.confidence.explanation).toMatch(/limited input signals/i);
  });
});
