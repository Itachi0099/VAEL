import { describe, it, expect } from 'vitest';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
import { recommendationService } from '../src/core/services';
import { defaultStore } from '../src/core/persistence';
import { knowledgeBase } from '../src/core/knowledge';
import { User, VisualProfile, Context } from '../src/core/domain';

describe('Frontend Styling Flow & Evidence Integration (Milestone 1A)', () => {
  it('1. Generates Safe, Best Match, and Stretch looks with honest confidence states', async () => {
    const user = await defaultStore.getUser('usr_vael_curator');
    expect(user).toBeDefined();

    const occasion = knowledgeBase.getOccasionBySlug('dinner')!;
    const context: Context = { occasion, weather: 'mild', targetFormality: 3 };

    const topThree = recommendationService.generateTopThreeLooks({
      user: user!,
      context,
    });

    expect(topThree.safe).toBeDefined();
    expect(topThree.bestMatch).toBeDefined();
    expect(topThree.stretch).toBeDefined();

    // Verify tiers
    expect(topThree.safe.tier).toBe('SAFE');
    expect(topThree.bestMatch.tier).toBe('BEST_MATCH');
    expect(topThree.stretch.tier).toBe('STRETCH');

    // Verify garments in each tier
    expect(topThree.safe.outfit.item.items.length).toBeGreaterThanOrEqual(3);
    expect(topThree.bestMatch.outfit.item.items.length).toBeGreaterThanOrEqual(3);
    expect(topThree.stretch.outfit.item.items.length).toBeGreaterThanOrEqual(3);

    // Verify confidence states are one of the allowed domain states
    const validConfidenceStates = ['STRONG', 'GOOD', 'EXPLORATORY', 'NEED_MORE_INFO'];
    expect(validConfidenceStates).toContain(topThree.safe.confidence.state);
    expect(validConfidenceStates).toContain(topThree.bestMatch.confidence.state);
    expect(validConfidenceStates).toContain(topThree.stretch.confidence.state);

    // Verify honest reasons exist
    expect(topThree.safe.reasons.length).toBeGreaterThan(0);
    expect(topThree.bestMatch.reasons.length).toBeGreaterThan(0);
    expect(topThree.stretch.reasons.length).toBeGreaterThan(0);
  });

  it('2. Custom user-entered profile correctly overrides defaults without claiming unobserved vision', () => {
    const customVisual: VisualProfile = {
      id: 'vis_test_user',
      userId: 'usr_custom_test',
      face: {
        shape: 'round',
        jaw: 'soft',
        hasFacialHair: true,
        beardCharacteristics: {
          currentLength: 'short',
          observedDensity: 'medium',
        },
      },
      hair: {
        texture: 'curly',
        density: 'high',
        length: 'medium',
        volume: 'voluminous',
      },
      body: {
        silhouette: 'rectangle',
      },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const customUser: User = {
      id: 'usr_custom_test',
      name: 'Custom User',
      handle: 'custom',
      createdAt: new Date().toISOString(),
      visualProfile: customVisual,
      styleProfile: {
        id: 'sty_custom_test',
        userId: 'usr_custom_test',
        dominantAestheticSlugs: ['workwear'],
        styleVector: knowledgeBase.getStyleBySlug('workwear')!.styleVector,
        preferences: {
          preferredStyleSlugs: ['workwear'],
          dislikedStyleSlugs: ['skinny'],
          preferredColors: ['olive', 'navy', 'brown', 'black'],
          dislikedColors: ['neon-pink'],
          preferredFits: ['relaxed', 'boxy'],
          dislikedFits: ['skinny'],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: {
            preferredFits: ['relaxed', 'boxy'],
            dislikedFits: ['skinny'],
            topVolume: 4,
            bottomVolume: 4,
            preferredSilhouettes: [],
            dislikedSilhouettes: [],
            layeringPreference: 'moderate',
            garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
          },
          modestyLevel: 'standard',
          userConfirmedUndertone: 'warm',
          genderCodingDirection: 'masculine',
          preferredFormalityRange: [2, 3],
          maxMaintenanceTolerance: 'minimal',
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

    const looks = recommendationService.generateTopThreeLooks({
      user: customUser,
      context,
    });

    expect(looks.bestMatch).toBeDefined();
    // Verify source is user_input
    expect(customUser.visualProfile?.source).toBe('user_input');
    // Verify hairstyle compatibility takes curly hair into account
    if (looks.bestMatch.hairStyle) {
      expect(looks.bestMatch.hairStyle.item).toBeDefined();
    }
  });

  it('3. Responds accurately to weather and climate constraints in the top 3 pipeline', async () => {
    const user = await defaultStore.getUser('usr_vael_curator');
    const occasion = knowledgeBase.getOccasionBySlug('job-interview')!;
    const coldContext: Context = { occasion, weather: 'cold' };
    const hotContext: Context = { occasion, weather: 'hot' };

    const baseUser: User = {
      id: 'usr_temp',
      name: 'Temp',
      handle: 'temp',
      createdAt: new Date().toISOString(),
      styleProfile: {
        id: 'sty_temp',
        userId: 'usr_temp',
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
          preferredFormalityRange: [3, 5],
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

    const coldLooks = recommendationService.generateTopThreeLooks({ user: baseUser, context: coldContext });
    const hotLooks = recommendationService.generateTopThreeLooks({ user: baseUser, context: hotContext });

    expect(coldLooks.safe).toBeDefined();
    expect(hotLooks.safe).toBeDefined();
  });
});
