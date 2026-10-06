import { describe, it, expect } from 'vitest';
import { StyleCompatibilityEngine } from '../src/core/intelligence/style-compatibility';
import { knowledgeBase } from '../src/core/knowledge';
import { PreferenceProfile } from '../src/core/domain';

describe('Style Taxonomy & Attribute Compatibility', () => {
  it('4. Style attributes influence compatibility score and identify matches', () => {
    const minimalStyle = knowledgeBase.getStyleBySlug('minimal')!;
    const techwearStyle = knowledgeBase.getStyleBySlug('techwear')!;

    const preferences: PreferenceProfile = {
      preferredStyleSlugs: [],
      dislikedStyleSlugs: [],
      preferredColors: ['black', 'charcoal', 'slate'],
      dislikedColors: ['burgundy'],
      preferredFits: ['relaxed', 'tailored'],
      dislikedFits: ['skinny'],
      preferredSilhouettes: ['clean-linear'],
      dislikedSilhouettes: [],
      fitProportions: {
        preferredFits: ['relaxed', 'tailored'],
        dislikedFits: ['skinny'],
        topVolume: 3,
        bottomVolume: 3,
        preferredSilhouettes: ['clean-linear'],
        dislikedSilhouettes: [],
        layeringPreference: 'moderate',
        garmentLengthPreferences: {},
      },
      modestyLevel: 'standard',
      userConfirmedUndertone: 'neutral',
      genderCodingDirection: 'androgynous',
      preferredFormalityRange: [2, 4],
      maxMaintenanceTolerance: 'moderate',
      accessoryAffinities: [],
    };

    const minimalMatch = StyleCompatibilityEngine.matchStyle(minimalStyle, preferences);
    const techwearMatch = StyleCompatibilityEngine.matchStyle(techwearStyle, preferences);

    expect(minimalMatch.matchScore).toBeGreaterThan(0.6);
    expect(minimalMatch.matchingAttributes.length).toBeGreaterThan(0);
    // Minimal palette (charcoal, slate, black) directly matches preferred colors
    expect(
      minimalMatch.matchingAttributes.some((a) => a.includes('Shares preferred color palette'))
    ).toBe(true);
  });
});
