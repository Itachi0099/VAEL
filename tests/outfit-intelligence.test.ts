import { describe, it, expect } from 'vitest';
import { recommendationService } from '../src/core/services';
import { defaultStore } from '../src/core/persistence';
import { knowledgeBase } from '../src/core/knowledge';
import { Context } from '../src/core/domain';

describe('Outfit Intelligence & Elevation', () => {
  it('analyzes an outfit and provides structured harmony metrics', async () => {
    const outfit = (await defaultStore.getOutfits())[0];
    const analysis = recommendationService.analyzeOutfit(outfit);

    expect(analysis.overallScore).toBeGreaterThan(0.7);
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.harmonyFactors.colorCohesion).toBeDefined();
    expect(analysis.harmonyFactors.silhouetteBalance).toBeDefined();
  });

  it('elevates an outfit by applying architectural layering and improving score', async () => {
    const baseOutfit = (await defaultStore.getOutfits())[0];

    // Create a plain, unlayered casual outfit
    const unlayeredOutfit = {
      ...baseOutfit,
      id: 'outfit_casual_raw',
      items: [
        {
          garment: knowledgeBase.getGarmentBySlug('heavyweight-boxy-tee-offwhite')!,
          layerPosition: 0,
        },
        {
          garment: knowledgeBase.getGarmentBySlug('wide-pleated-trousers-black')!,
          layerPosition: 0,
        },
      ],
    };

    const dinnerContext: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 4,
    };

    const elevation = recommendationService.elevateOutfit(unlayeredOutfit, {
      context: dinnerContext,
    });

    expect(elevation.elevatedOutfit.items.length).toBeGreaterThan(unlayeredOutfit.items.length);
    expect(elevation.elevationsApplied.length).toBeGreaterThan(0);
    expect(elevation.elevationDeltaScore).toBeGreaterThan(0);
    expect(
      elevation.elevationsApplied.some((e) => e.includes('Added architectural layering'))
    ).toBe(true);
  });
});
