import { describe, it, expect } from 'vitest';
import { CompositionGenerator } from '../src/core/intelligence/composition-generator';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
import { knowledgeBase } from '../src/core/knowledge';
import { User, Context } from '../src/core/domain';

function createBaseTestUser(): User {
  return {
    id: 'usr_gen_test',
    name: 'Generator Test User',
    handle: 'gen_tester',
    createdAt: new Date().toISOString(),
    styleProfile: {
      id: 'sty_gen_test',
      userId: 'usr_gen_test',
      dominantAestheticSlugs: ['minimal'],
      styleVector: knowledgeBase.getStyleBySlug('minimal')!.styleVector,
      preferences: {
        preferredStyleSlugs: ['minimal'],
        dislikedStyleSlugs: [],
        preferredColors: ['black', 'white', 'grey'],
        dislikedColors: [],
        preferredFits: ['relaxed', 'regular'],
        dislikedFits: [],
        preferredSilhouettes: [],
        dislikedSilhouettes: [],
        fitProportions: {
          preferredFits: ['relaxed', 'regular'],
          dislikedFits: [],
          topVolume: 3,
          bottomVolume: 3,
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          layeringPreference: 'moderate',
          garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
        },
        modestyLevel: 'unrestricted',
        userConfirmedUndertone: 'neutral',
        genderCodingDirection: 'androgynous',
        styleExpression: 'androgynous',
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
}

describe('CompositionGenerator Constrained Combinatorial Suite (A2 & A7)', () => {
  it('Determinism: Identical user and context generate bitwise identical candidate lists across repeated runs', () => {
    const user = createBaseTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'dry',
      isWeatherConfirmed: true,
    };

    const run1 = CompositionGenerator.generateCandidates(user, context);
    const run2 = CompositionGenerator.generateCandidates(user, context);

    expect(run1.length).toBeGreaterThan(0);
    expect(run1.length).toBe(run2.length);
    for (let i = 0; i < run1.length; i++) {
      expect(run1[i].id).toBe(run2[i].id);
      expect(run1[i].title).toBe(run2[i].title);
      expect(run1[i].items.length).toBe(run2[i].items.length);
      for (let j = 0; j < run1[i].items.length; j++) {
        expect(run1[i].items[j].garment.id).toBe(run2[i].items[j].garment.id);
      }
    }
  });

  it('Hard Filters: Generated candidates never violate stated modesty, disliked colors, or climate thresholds', () => {
    const user = createBaseTestUser();
    user.styleProfile.preferences.modestyLevel = 'covered-both';
    user.styleProfile.preferences.dislikedColors = ['brown', 'camel'];
    user.styleProfile.preferences.dislikedFits = ['oversized'];

    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      targetFormality: 3,
      temperatureLevel: 'cold',
      condition: 'rain',
      isWeatherConfirmed: true,
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);

    for (const c of candidates) {
      const garments = c.items.map((i) => i.garment);
      // Modesty: zero revealing items
      const hasLowCoverage = garments.some(
        (g) => g.modestyRating === 'low-coverage' || g.subcategory.includes('shorts') || g.subcategory.includes('tank')
      );
      expect(hasLowCoverage).toBe(false);

      // Disliked colors
      const hasDislikedColor = garments.some((g) =>
        ['brown', 'camel'].some((d) => g.color.name.toLowerCase().includes(d))
      );
      expect(hasDislikedColor).toBe(false);

      // Disliked fits
      const hasOversized = garments.some((g) => g.fit === 'oversized');
      expect(hasOversized).toBe(false);

      // Rain footwear: no waterResistance none
      const footwear = garments.find((g) => g.category === 'footwear');
      if (footwear) {
        expect(footwear.waterResistance).not.toBe('none');
      }
    }
  });

  it('Coherence Rules: Enforces formality spread <= 1 (except high-low), structure spread <= 2, and footwear grounding', () => {
    const user = createBaseTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('social')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);

    for (const c of candidates) {
      const garments = c.items.map((i) => i.garment);
      const formalities = garments.map((g) => g.formality);
      const minF = Math.min(...formalities);
      const maxF = Math.max(...formalities);

      const isHighLow =
        garments.some((g) => g.category === 'outerwear' && g.formality >= 4) &&
        garments.some((g) => g.category === 'top' && g.formality <= 2);

      if (!isHighLow) {
        expect(maxF - minF).toBeLessThanOrEqual(1);
      }

      // Structure spread <= 2
      const structures = garments.map((g) => g.structure);
      const minS = Math.min(...structures);
      const maxS = Math.max(...structures);
      expect(maxS - minS).toBeLessThanOrEqual(2);

      // Footwear formality within 1 step of foundation
      const foundation = garments.filter((g) => g.category !== 'footwear' && g.category !== 'accessory');
      const footwear = garments.find((g) => g.category === 'footwear');
      if (foundation.length > 0 && footwear) {
        const meanF = Math.round(foundation.reduce((acc, g) => acc + g.formality, 0) / foundation.length);
        expect(Math.abs(footwear.formality - meanF)).toBeLessThanOrEqual(1);
      }

      // No matching same-fabric or same-pattern separates unless designated suit/co-ord
      const top = garments.find((g) => g.category === 'top');
      const bot = garments.find((g) => g.category === 'bottom');
      if (top && bot && !c.suitTag && !c.coOrdTag && !top.suitTag && !bot.suitTag) {
        const distinctiveFabrics = ['seersucker', 'corduroy', 'velvet', 'tweed', 'flannel', 'terry'];
        const bothDistinctive = distinctiveFabrics.some(
          (f) => top.material.toLowerCase().includes(f) && bot.material.toLowerCase().includes(f)
        );
        expect(bothDistinctive).toBe(false);
      }
    }
  });

  it('Hard Filters - Modesty: covered-both strictly excludes shorts, tank tops, and low-coverage items across all candidates', () => {
    const user = createBaseTestUser();
    user.styleProfile.preferences.modestyLevel = 'covered-both';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('weekend')!,
      targetFormality: 1,
      temperatureLevel: 'hot',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      for (const item of c.items) {
        expect(item.garment.modestyRating).not.toBe('low-coverage');
        expect(item.garment.subcategory).not.toContain('shorts');
        expect(item.garment.subcategory).not.toContain('tank');
        if (item.garment.category === 'bottom') {
          expect(item.garment.length).not.toBe('cropped');
        }
      }
    }
  });

  it('Hard Filters - Climate Rain: strictly requires water-resistant footwear and outerwear during precipitation', () => {
    const user = createBaseTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'rain',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      const footwear = c.items.find((i) => i.garment.category === 'footwear');
      expect(footwear).toBeDefined();
      expect(footwear?.garment.waterResistance).not.toBe('none');

      const outerwear = c.items.find((i) => i.garment.category === 'outerwear');
      if (outerwear) {
        expect(outerwear.garment.waterResistance).not.toBe('none');
      }
    }
  });

  it('Hard Filters - Preferred Formality Range: generated candidate outfits fall strictly within bounds', () => {
    const user = createBaseTestUser();
    user.styleProfile.preferences.preferredFormalityRange = [2, 3];
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      expect(c.formality).toBeGreaterThanOrEqual(2);
      expect(c.formality).toBeLessThanOrEqual(3);
    }
  });

  it('Occasion Vetoes - Restricted Garment Categories: restricted pieces are never generated for formal occasions', () => {
    const user = createBaseTestUser();
    const jobInterviewOccasion = knowledgeBase.getOccasionBySlug('job-interview')!;
    const context: Context = {
      occasion: jobInterviewOccasion,
      targetFormality: 4,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    const restrictions = jobInterviewOccasion.restrictedGarmentCategories || [];

    for (const c of candidates) {
      for (const item of c.items) {
        for (const r of restrictions) {
          expect(item.garment.subcategory.toLowerCase()).not.toContain(r.toLowerCase());
          expect(item.garment.slug.toLowerCase()).not.toContain(r.toLowerCase());
        }
      }
    }
  });

  it('Occasion Vetoes - Ceremonial Evening Isolation: gowns, tuxedos, and marcella shirts are vetoed outside ceremonial contexts', () => {
    const user = createBaseTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      for (const item of c.items) {
        expect(item.garment.subcategory).not.toContain('gown');
        expect(item.garment.slug).not.toContain('tuxedo');
        expect(item.garment.slug).not.toContain('marcella');
        expect(item.garment.slug).not.toContain('patent-evening');
      }
    }
  });

  it('Occasion Formality Range Discipline: candidate garments respect occasion allowable formality range', () => {
    const user = createBaseTestUser();
    const casualOccasion = knowledgeBase.getOccasionBySlug('casual')!;
    const [minF, maxF] = casualOccasion.allowableFormalityRange;
    const context: Context = {
      occasion: casualOccasion,
      targetFormality: 1,
      temperatureLevel: 'warm',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      for (const item of c.items) {
        expect(item.garment.formality).toBeGreaterThanOrEqual(minF - 1);
        expect(item.garment.formality).toBeLessThanOrEqual(maxF + 1);
      }
    }
  });

  it('Coherence Rules - Color Palette Limit: outfits have <= 3 non-neutral colors', () => {
    const user = createBaseTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      targetFormality: 2,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      const nonNeutralColors = new Set(
        c.items
          .map((i) => i.garment)
          .filter((g) => g.color.tone !== 'neutral')
          .map((g) => g.color.name.toLowerCase())
      );
      expect(nonNeutralColors.size).toBeLessThanOrEqual(3);
    }
  });

  it('Expression Invariance: Feminine expression candidates have mean garment coding >= 0.25', () => {
    const user = createBaseTestUser();
    user.styleProfile.preferences.styleExpression = 'feminine';
    user.styleProfile.preferences.genderCodingDirection = 'feminine';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      const foundation = c.items
        .map((i) => i.garment)
        .filter((g) => g.category !== 'accessory' && g.category !== 'footwear');
      const meanCoding =
        foundation.reduce((acc, g) => {
          const coding =
            g.garmentCoding !== undefined
              ? g.garmentCoding
              : g.genderCoding === 'feminine'
                ? 1.0
                : g.genderCoding === 'masculine'
                  ? -1.0
                  : 0;
          return acc + coding;
        }, 0) / foundation.length;
      expect(meanCoding).toBeGreaterThanOrEqual(0.25);
    }
  });

  it('Expression Invariance: Masculine expression candidates have mean garment coding <= -0.25', () => {
    const user = createBaseTestUser();
    user.styleProfile.preferences.styleExpression = 'masculine';
    user.styleProfile.preferences.genderCodingDirection = 'masculine';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const candidates = CompositionGenerator.generateCandidates(user, context);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      const foundation = c.items
        .map((i) => i.garment)
        .filter((g) => g.category !== 'accessory' && g.category !== 'footwear');
      const meanCoding =
        foundation.reduce((acc, g) => {
          const coding =
            g.garmentCoding !== undefined
              ? g.garmentCoding
              : g.genderCoding === 'feminine'
                ? 1.0
                : g.genderCoding === 'masculine'
                  ? -1.0
                  : 0;
          return acc + coding;
        }, 0) / foundation.length;
      expect(meanCoding).toBeLessThanOrEqual(-0.25);
    }
  });

  it('Ranked list API: getRankedCandidateLooks exposes full ranked candidates with stable ordering and non-empty scores', () => {
    const user = createBaseTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      condition: 'dry',
    };

    const ranked = VaelStylingEngine.getRankedCandidateLooks({ user, context });
    expect(ranked.length).toBeGreaterThan(10);

    // Stable ordering: scores are sorted descending
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].totalScore).toBeGreaterThanOrEqual(ranked[i + 1].totalScore);
    }

    // Every candidate has valid bounded scores and factors
    for (const cand of ranked) {
      expect(cand.totalScore).toBeGreaterThanOrEqual(0.0);
      expect(cand.totalScore).toBeLessThanOrEqual(1.0);
      expect(cand.factors.length).toBeGreaterThan(0);
      expect(cand.outfit.items.length).toBeGreaterThanOrEqual(2);
    }
  });
});
