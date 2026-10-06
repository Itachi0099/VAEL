import { describe, it, expect } from 'vitest';
import { recommendationService } from '../src/core/services';
import { knowledgeBase } from '../src/core/knowledge';
import { Context, VisualProfile } from '../src/core/domain';

describe('Context and Occasion Sensitivity', () => {
  const visual: VisualProfile = {
    id: 'vis_ctx_test',
    userId: 'user_ctx_test',
    face: { shape: 'oval', jaw: 'sharp', hasFacialHair: false },
    hair: { texture: 'straight', density: 'high', length: 'short', volume: 'moderate' },
    body: { silhouette: 'trapezoid' },
    source: 'visual_analysis',
    lastObservedAt: new Date().toISOString(),
  };

  it('3. Occasion formality shifts top hairstyle ranking', () => {
    const interviewOccasion = knowledgeBase.getOccasionBySlug('interview')!;
    const collegeOccasion = knowledgeBase.getOccasionBySlug('college')!;

    const interviewContext: Context = {
      occasion: interviewOccasion,
      targetFormality: 4,
    };

    const collegeContext: Context = {
      occasion: collegeOccasion,
      targetFormality: 2,
    };

    const interviewRecs = recommendationService.generateHairRecommendations({
      visual,
      context: interviewContext,
      limit: 20,
    });

    const collegeRecs = recommendationService.generateHairRecommendations({
      visual,
      context: collegeContext,
      limit: 20,
    });

    const sidePartInterview = interviewRecs.recommendations.find((r) => r.item.slug === 'classic-side-part');
    const sidePartCollege = collegeRecs.recommendations.find((r) => r.item.slug === 'classic-side-part');

    expect(sidePartInterview).toBeDefined();
    expect(sidePartCollege).toBeDefined();
    // Executive side part scores higher for high-formality interview
    expect(sidePartInterview!.score).toBeGreaterThan(sidePartCollege!.score);
  });

  it('7. Different contexts (weather & occasion) produce different outfit recommendations', () => {
    const weddingOccasion = knowledgeBase.getOccasionBySlug('wedding')!;
    const casualOccasion = knowledgeBase.getOccasionBySlug('casual-day')!;

    const weddingContext: Context = {
      occasion: weddingOccasion,
      weather: 'mild',
      targetFormality: 4,
    };

    const casualContext: Context = {
      occasion: casualOccasion,
      weather: 'cold',
      targetFormality: 1,
    };

    const weddingOutfit = recommendationService.generateOutfit({
      context: weddingContext,
    });

    const casualOutfit = recommendationService.generateOutfit({
      context: casualContext,
    });

    expect(weddingOutfit.item.formality).toBeGreaterThan(casualOutfit.item.formality);
    expect(weddingOutfit.item.compatibleOccasions).toContain('wedding');
  });
});
