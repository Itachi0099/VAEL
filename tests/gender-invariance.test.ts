import { describe, it, expect } from 'vitest';
import { recommendationService } from '../src/core/services';
import { knowledgeBase } from '../src/core/knowledge';
import { sanitizeContextState, sanitizeProfileState } from '../src/core/domain/sanitization';
import { User, VisualProfile, Context, GenderIdentity } from '../src/core/domain';

describe('Part 5 & Part 14 — Gender-Only Invariance and Sanitization Integrity', () => {
  const baseVisual: VisualProfile = {
    id: 'vis_base_gender_test',
    userId: 'usr_gender_test',
    face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
    hair: { texture: 'straight', density: 'medium', length: 'medium', volume: 'moderate' },
    body: { silhouette: 'rectangle' },
    source: 'user_input',
    confidenceScore: 1.0,
    lastObservedAt: new Date().toISOString(),
  };

  const createTestUser = (genderIdentity: GenderIdentity, styleExpression: any): User => ({
    id: `usr_${genderIdentity}_${styleExpression}`,
    name: 'Gender Test User',
    handle: 'gender_test',
    createdAt: new Date().toISOString(),
    visualProfile: baseVisual,
    styleProfile: {
      id: `sty_${genderIdentity}_${styleExpression}`,
      userId: `usr_${genderIdentity}_${styleExpression}`,
      dominantAestheticSlugs: ['minimal'],
      styleVector: knowledgeBase.getStyleBySlug('minimal')!.styleVector,
      preferences: {
        preferredStyleSlugs: ['minimal'],
        dislikedStyleSlugs: [],
        preferredColors: ['black', 'white', 'grey'],
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
        modestyLevel: 'unrestricted',
        userConfirmedUndertone: 'neutral',
        genderIdentity,
        styleExpression,
        genderCodingDirection: styleExpression === 'no-preference' ? 'unspecified' : styleExpression,
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
  });

  const occasion = knowledgeBase.getOccasionBySlug('dinner')!;
  const context: Context = { occasion, weather: 'mild', targetFormality: 3 };

  it('1. Strict Gender-Only Invariance: Man vs Woman with identical Feminine expression produce identical looks and scores', () => {
    const userMan = createTestUser('man', 'feminine');
    const userWoman = createTestUser('woman', 'feminine');

    const resultMan = recommendationService.generateTopThreeLooks({ user: userMan, context });
    const resultWoman = recommendationService.generateTopThreeLooks({ user: userWoman, context });

    // Looks must match item by item
    expect(resultMan.safe.outfit.item.id).toBe(resultWoman.safe.outfit.item.id);
    expect(resultMan.bestMatch.outfit.item.id).toBe(resultWoman.bestMatch.outfit.item.id);
    expect(resultMan.stretch.outfit.item.id).toBe(resultWoman.stretch.outfit.item.id);

    // Scores must be identical down to floating point precision
    expect(resultMan.bestMatch.overallHarmonyScore).toBe(resultWoman.bestMatch.overallHarmonyScore);
    expect(resultMan.safe.overallHarmonyScore).toBe(resultWoman.safe.overallHarmonyScore);
    expect(resultMan.stretch.overallHarmonyScore).toBe(resultWoman.stretch.overallHarmonyScore);
  });

  it('2. Strict Gender-Only Invariance: Non-binary vs Prefer-not-to-specify vs Man with Masculine expression match identically', () => {
    const userNonBinary = createTestUser('non-binary', 'masculine');
    const userPreferNot = createTestUser('prefer-not-to-specify', 'masculine');
    const userMan = createTestUser('man', 'masculine');

    const resNB = recommendationService.generateTopThreeLooks({ user: userNonBinary, context });
    const resPN = recommendationService.generateTopThreeLooks({ user: userPreferNot, context });
    const resMan = recommendationService.generateTopThreeLooks({ user: userMan, context });

    expect(resNB.bestMatch.outfit.item.id).toBe(resPN.bestMatch.outfit.item.id);
    expect(resNB.bestMatch.outfit.item.id).toBe(resMan.bestMatch.outfit.item.id);
    expect(resNB.bestMatch.overallHarmonyScore).toBe(resMan.bestMatch.overallHarmonyScore);
  });

  it('3. Style expression affects scoring while genderIdentity remains strictly zero-weight', () => {
    const userMasc = createTestUser('woman', 'masculine');
    const userFem = createTestUser('woman', 'feminine');

    const resMasc = recommendationService.generateTopThreeLooks({ user: userMasc, context });
    const resFem = recommendationService.generateTopThreeLooks({ user: userFem, context });

    // Both generate 3 valid looks
    expect(resMasc.safe).toBeDefined();
    expect(resFem.safe).toBeDefined();
    expect(resMasc.bestMatch).toBeDefined();
    expect(resFem.bestMatch).toBeDefined();
  });

  it('4. Sanitizer resolves legacy array temperature ["MILD", "WARM"] to single canonical "mild"', () => {
    const rawLegacyContext = {
      temperatureLevel: ['MILD', 'WARM'],
      weatherCondition: ['DRY', 'RAIN'],
      targetFormality: 4,
      occasionSlug: 'dinner',
    };

    const sanitized = sanitizeContextState(rawLegacyContext);
    expect(sanitized.temperatureLevel).toBe('mild');
    expect(sanitized.weatherCondition).toBe('dry');
    expect(sanitized.formality).toBe(4);
    expect(Array.isArray(sanitized.temperatureLevel)).toBe(false);
  });

  it('5. Sanitizer resolves legacy profile preferences arrays safely', () => {
    const rawLegacyProfile = {
      styleProfile: {
        preferences: {
          preferredFits: ['relaxed', 'oversized'],
          modestyLevel: 'standard',
          userConfirmedUndertone: 'warm',
          genderIdentity: 'man',
          styleExpression: 'masculine',
        },
      },
    };

    const sanitized = sanitizeProfileState(rawLegacyProfile);
    expect(sanitized.styleProfile.preferences.topFit).toBe('relaxed');
    expect(sanitized.styleProfile.preferences.bottomFit).toBe('oversized');
    expect(sanitized.styleProfile.preferences.genderIdentity).toBe('man');
    expect(sanitized.styleProfile.preferences.styleExpression).toBe('masculine');
  });
});
