import { describe, it, expect } from 'vitest';
import { recommendationService } from '../src/core/services';
import { PreferenceProfile, FeedbackProfile, VisualProfile } from '../src/core/domain';
import { InMemoryStore } from '../src/core/persistence';

describe('Preference & Feedback Intelligence', () => {
  const baseVisual: VisualProfile = {
    id: 'vis_test',
    userId: 'user_pref_test',
    face: { shape: 'oval', jaw: 'sharp', hasFacialHair: false },
    hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
    body: { silhouette: 'trapezoid' },
    source: 'visual_analysis',
    lastObservedAt: new Date().toISOString(),
  };

  it('2. User preferences directly influence ranking order', () => {
    // Scenario A: User who loves Korean Minimal and hates Old Money
    const koreanPref: PreferenceProfile = {
      preferredStyleSlugs: ['korean-minimal'],
      dislikedStyleSlugs: ['old-money', 'formal'],
      preferredColors: ['ecru', 'black'],
      dislikedColors: ['burgundy'],
      preferredFits: ['oversized', 'relaxed'],
      dislikedFits: ['tailored'],
      preferredSilhouettes: ['dropped-shoulder-fluid'],
      dislikedSilhouettes: [],
      fitProportions: {
        preferredFits: ['oversized', 'relaxed'],
        dislikedFits: ['tailored'],
        topVolume: 4,
        bottomVolume: 4,
        preferredSilhouettes: ['dropped-shoulder-fluid'],
        dislikedSilhouettes: [],
        layeringPreference: 'moderate',
        garmentLengthPreferences: {},
      },
      modestyLevel: 'standard',
      userConfirmedUndertone: 'neutral',
      genderCodingDirection: 'androgynous',
      preferredFormalityRange: [2, 3],
      maxMaintenanceTolerance: 'moderate',
      accessoryAffinities: [],
    };

    // Scenario B: User who loves Old Money and hates Streetwear/Korean Minimal
    const oldMoneyPref: PreferenceProfile = {
      preferredStyleSlugs: ['old-money', 'formal'],
      dislikedStyleSlugs: ['korean-minimal', 'streetwear'],
      preferredColors: ['navy', 'camel'],
      dislikedColors: [],
      preferredFits: ['tailored', 'regular'],
      dislikedFits: ['oversized'],
      preferredSilhouettes: ['traditional-tailored'],
      dislikedSilhouettes: [],
      fitProportions: {
        preferredFits: ['tailored', 'regular'],
        dislikedFits: ['oversized'],
        topVolume: 2,
        bottomVolume: 2,
        preferredSilhouettes: ['traditional-tailored'],
        dislikedSilhouettes: [],
        layeringPreference: 'moderate',
        garmentLengthPreferences: {},
      },
      modestyLevel: 'standard',
      userConfirmedUndertone: 'warm',
      genderCodingDirection: 'masculine',
      preferredFormalityRange: [3, 5],
      maxMaintenanceTolerance: 'moderate',
      accessoryAffinities: [],
    };

    const recsA = recommendationService.generateHairRecommendations({
      visual: baseVisual,
      preferences: koreanPref,
      limit: 50,
    });

    const recsB = recommendationService.generateHairRecommendations({
      visual: baseVisual,
      preferences: oldMoneyPref,
      limit: 50,
    });

    const curtainsInA = recsA.recommendations.find((r) => r.item.slug === 'middle-part-curtains');
    const curtainsInB = recsB.recommendations.find((r) => r.item.slug === 'middle-part-curtains');

    const sidePartInA = recsA.recommendations.find((r) => r.item.slug === 'classic-side-part');
    const sidePartInB = recsB.recommendations.find((r) => r.item.slug === 'classic-side-part');

    // Middle part curtains (korean-minimal) should rank higher for koreanPref than oldMoneyPref
    expect(curtainsInA!.score).toBeGreaterThan(curtainsInB!.score);
    // Side part (old-money) should rank higher for oldMoneyPref than koreanPref
    expect(sidePartInB!.score).toBeGreaterThan(sidePartInA!.score);
  });

  it('6. Feedback history updates learned weights and adjusts recommendations', async () => {
    const store = new InMemoryStore();
    const testUser = await store.getUser('usr_vael_curator');
    expect(testUser).toBeDefined();

    const initialRecs = recommendationService.generateHairRecommendations({
      visual: testUser!.visualProfile,
      preferences: testUser!.styleProfile.preferences,
      feedback: testUser!.styleProfile.feedbackProfile,
    });

    const initialKoreanScore = initialRecs.recommendations.find(
      (r) => r.item.slug === 'middle-part-curtains'
    )?.score;

    // Record repeated NOT_FOR_ME feedback on korean-minimal
    await store.recordFeedback({
      id: 'fb_01',
      userId: testUser!.id,
      targetType: 'style_family',
      targetId: 'korean-minimal',
      feedbackType: 'NOT_FOR_ME',
      createdAt: new Date().toISOString(),
    });

    const updatedUser = await store.getUser('usr_vael_curator');
    expect(updatedUser!.styleProfile.feedbackProfile.learnedStyleAffinities['korean-minimal']).toBeLessThan(0);

    const postFeedbackRecs = recommendationService.generateHairRecommendations({
      visual: updatedUser!.visualProfile,
      preferences: updatedUser!.styleProfile.preferences,
      feedback: updatedUser!.styleProfile.feedbackProfile,
    });

    const updatedKoreanScore = postFeedbackRecs.recommendations.find(
      (r) => r.item.slug === 'middle-part-curtains'
    )?.score;

    if (initialKoreanScore && updatedKoreanScore) {
      expect(updatedKoreanScore).toBeLessThan(initialKoreanScore);
    }
  });
});
