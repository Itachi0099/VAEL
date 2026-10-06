import { describe, it, expect } from 'vitest';
import { recommendationService } from '../src/core/services';
import { VisualProfile } from '../src/core/domain';

describe('Hair Recommendation Intelligence', () => {
  it('1. Compatible hairstyles score higher than incompatible ones', () => {
    // Subject with round face and curly hair
    const roundCurlyVisual: VisualProfile = {
      id: 'vis_round_curly',
      userId: 'test_user',
      face: {
        shape: 'round',
        jaw: 'soft',
        hasFacialHair: false,
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
      source: 'visual_analysis',
      lastObservedAt: new Date().toISOString(),
    };

    const results = recommendationService.generateHairRecommendations({
      visual: roundCurlyVisual,
      limit: 10,
    });

    expect(results.recommendations.length).toBeGreaterThan(0);

    const curlyTaper = results.recommendations.find((r) => r.item.slug === 'curly-taper');
    const bluntCrop = results.recommendations.find((r) => r.item.slug === 'blunt-crop');

    // Curly Taper is explicitly compatible with round face & curly hair
    // Blunt crop is explicitly incompatible with round face and straight-oriented
    expect(curlyTaper).toBeDefined();
    if (curlyTaper && bluntCrop) {
      expect(curlyTaper.score).toBeGreaterThan(bluntCrop.score);
    }
  });

  it('5. Transparent, human-readable recommendation reasons are generated', () => {
    const ovalVisual: VisualProfile = {
      id: 'vis_oval',
      userId: 'test_user',
      face: {
        shape: 'oval',
        jaw: 'sharp',
        hasFacialHair: true,
      },
      hair: {
        texture: 'wavy',
        density: 'high',
        length: 'short',
        volume: 'moderate',
      },
      body: {
        silhouette: 'trapezoid',
      },
      source: 'visual_analysis',
      lastObservedAt: new Date().toISOString(),
    };

    const results = recommendationService.generateHairRecommendations({
      visual: ovalVisual,
      limit: 3,
    });

    const topRec = results.recommendations[0];
    expect(topRec.reasons.length).toBeGreaterThan(0);
    expect(topRec.factors.length).toBeGreaterThan(0);

    // Verify factor breakdown integrity
    const visualFactor = topRec.factors.find((f) => f.category === 'visual_feature');
    expect(visualFactor).toBeDefined();
    expect(typeof visualFactor?.score).toBe('number');
    expect(topRec.score).toBeGreaterThan(0.5);
  });
});
