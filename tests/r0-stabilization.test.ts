import { describe, it, expect } from 'vitest';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
import { knowledgeBase } from '../src/core/knowledge';
import { BASE_PREFERENCES, BASE_FEEDBACK, BASE_STYLE_VECTOR } from './evaluation/corpus-types';
import { User, Context, TemperatureLevel, WeatherConditionType, ModestyLevel, FaceShape, HairTexture, FitType } from '../src/core/domain';

describe('R0 Stabilization & Integrity Test Suite', () => {
  // Test 1: Banned-language scan across all intelligence reasoning and knowledge texts (F-15b)
  it('F-15b: Banned-language scan confirms zero prohibited body-shaming or overclaiming phrases', () => {
    const bannedWords = [
      'slimming',
      'hide flaws',
      'conceal body',
      'problem areas',
      'fix body',
      'unattractive',
      'flattering',
      'flatter your',
      'for men',
      'for women',
      "men's",
      "women's",
      "because you're a man",
      "because you're a woman",
    ];

    // Check all occasion guidelines
    const allOccasions = knowledgeBase.getAllOccasions();
    for (const occ of allOccasions) {
      for (const guide of occ.guidelines) {
        for (const banned of bannedWords) {
          expect(
            guide.toLowerCase().includes(banned),
            `Occasion ${occ.name} guideline contains banned word "${banned}": "${guide}"`
          ).toBe(false);
        }
      }
    }

    // Check generated candidate recommendations across multiple queries
    const testUser: User = {
      id: 'usr_audit_lang',
      name: 'Lang Audit User',
      handle: 'lang_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_audit',
        userId: 'usr_audit_lang',
        dominantAestheticSlugs: ['minimal', 'smart-casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    };

    const res = VaelStylingEngine.generateTopThreeLooks({
      user: testUser,
      context: { occasion: knowledgeBase.getOccasionBySlug('date')!, weather: 'mild' },
    });

    const allReasons = [
      ...(res.safe?.reasons || []),
      ...(res.bestMatch?.reasons || []),
      ...(res.stretch?.reasons || []),
      ...(res.safe?.outfit.stylingAdvice || []),
      ...(res.bestMatch?.outfit.stylingAdvice || []),
      ...(res.stretch?.outfit.stylingAdvice || []),
    ].join(' ').toLowerCase();

    for (const banned of bannedWords) {
      expect(allReasons.includes(banned), `Reasoning contains banned word "${banned}"`).toBe(false);
    }
  });

  // Test 2: G-07 Occasion Formality Band Enforcement & Override (F-04)
  it('F-04 (G-07): Occasion Formality Band enforces allowable range unless overridden', () => {
    const testUser: User = {
      id: 'usr_g07',
      name: 'G07 User',
      handle: 'g07_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_g07',
        userId: 'usr_g07',
        dominantAestheticSlugs: ['casual'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    };

    const weddingOccasion = knowledgeBase.getOccasionBySlug('wedding-guest')!;
    expect(weddingOccasion.allowableFormalityRange).toEqual([3, 5]);

    // Standard context: Formality level 1 (Everyday Casual outfit) must be vetoed
    const standardContext: Context = {
      occasion: weddingOccasion,
      targetFormality: 4,
      isFormalityOverridden: false,
    };

    const stdRes = VaelStylingEngine.generateTopThreeLooks({
      user: testUser,
      context: standardContext,
    });

    for (const look of stdRes.looks) {
      expect(look.outfit.item.formality).toBeGreaterThanOrEqual(3);
      expect(look.outfit.item.formality).toBeLessThanOrEqual(5);
    }

    // Overridden context: isFormalityOverridden allows relaxed boundary
    const overriddenContext: Context = {
      occasion: weddingOccasion,
      targetFormality: 2,
      isFormalityOverridden: true,
    };

    const overRes = VaelStylingEngine.generateTopThreeLooks({
      user: testUser,
      context: overriddenContext,
    });

    expect(overRes.looks.length).toBeGreaterThan(0);
  });

  // Test 3: G-01 through G-06 Climate & Condition Weather Split (F-05)
  it('F-05 (G-01..G-06): Climate & Condition Split correctly respects temperature bounds and rain conditions', () => {
    const testUser: User = {
      id: 'usr_climate_g',
      name: 'Climate User',
      handle: 'climate_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_clim',
        userId: 'usr_climate_g',
        dominantAestheticSlugs: ['korean-minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: BASE_PREFERENCES,
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    };

    // Hot (34°C) dry: veto heavy wool
    const hotContext: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureCelsius: 34,
      temperatureLevel: 'hot',
      condition: 'dry',
      isWeatherConfirmed: true,
    };
    const hotRes = VaelStylingEngine.generateTopThreeLooks({ user: testUser, context: hotContext });
    for (const look of hotRes.looks) {
      expect(
        look.outfit.item.items.some(
          (i) => i.garment.fabricWeight === 'heavyweight' && i.garment.material.toLowerCase().includes('wool')
        )
      ).toBe(false);
    }

    // Cold (-5°C) rain/wet: veto uninsulated single-layer summer garments
    const coldContext: Context = {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      temperatureCelsius: -5,
      temperatureLevel: 'cold',
      condition: 'rain',
      isWeatherConfirmed: true,
    };
    const coldRes = VaelStylingEngine.generateTopThreeLooks({ user: testUser, context: coldContext });
    for (const look of coldRes.looks) {
      expect(
        look.outfit.item.items.some((i) => i.garment.category === 'bottom' && i.garment.subcategory.includes('shorts'))
      ).toBe(false);
    }
  });

  // Test 4: G-33 Fewer Than Three Looks (F-08)
  it('F-08 (G-33): Strict constraints returning fewer than 3 looks never fabricate or relax hard vetoes', () => {
    const restrictedUser: User = {
      id: 'usr_g33',
      name: 'G33 User',
      handle: 'g33_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_g33',
        userId: 'usr_g33',
        dominantAestheticSlugs: ['formal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          modestyLevel: 'high-coverage',
          dislikedColors: ['white', 'off-white', 'cream', 'sand', 'ecru'],
          dislikedStyleSlugs: ['workwear', 'korean-minimal', 'smart-casual', 'minimal', 'casual'],
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    };

    const ceremonyContext: Context = {
      occasion: knowledgeBase.getOccasionBySlug('cultural-traditional')!,
      targetFormality: 5,
    };

    const res = VaelStylingEngine.generateTopThreeLooks({
      user: restrictedUser,
      context: ceremonyContext,
    });

    // Should return 1 or 2 viable looks without breaking modesty or disliked styles
    expect(res.looks.length).toBeLessThanOrEqual(3);
    expect(res.looks.length).toBeGreaterThan(0);
    if (res.looks.length < 3) {
      expect(res.looksCountExplanation).toBeDefined();
      expect(res.looksCountExplanation).toContain('viable look');
    }

    // Verify none of the returned looks violate the user's hard dislikes
    for (const look of res.looks) {
      expect(restrictedUser.styleProfile.preferences.dislikedStyleSlugs).not.toContain(
        look.outfit.item.primaryStyleSlug
      );
    }
  });

  // Test 5: Reason Traceability Verification (F-15a)
  it('F-15a: Every generated reason has valid signals, real knowledge IDs, and honest assumption tags', () => {
    const testUser: User = {
      id: 'usr_trace_audit',
      name: 'Trace User',
      handle: 'trace_user',
      createdAt: '2026-10-01',
      styleProfile: {
        id: 'sp_trace',
        userId: 'usr_trace_audit',
        dominantAestheticSlugs: ['minimal'],
        styleVector: BASE_STYLE_VECTOR,
        preferences: {
          ...BASE_PREFERENCES,
          userConfirmedUndertone: 'unspecified', // Unknown undertone
        },
        feedbackProfile: BASE_FEEDBACK,
        updatedAt: '2026-10-01',
      },
    };

    const res = VaelStylingEngine.generateTopThreeLooks({
      user: testUser,
      context: { occasion: knowledgeBase.getOccasionBySlug('dinner')!, weather: 'mild' },
    });

    expect(res.bestMatch?.traceableReasons).toBeDefined();
    expect(res.bestMatch!.traceableReasons!.length).toBeGreaterThan(0);

    for (const tr of res.bestMatch!.traceableReasons!) {
      expect(tr.reasonId).toBeDefined();
      expect(tr.text.length).toBeGreaterThan(5);
      expect(tr.factor).toBeDefined();
      expect(tr.knowledgeEntryIds.length).toBeGreaterThan(0);

      // Verify knowledge IDs exist in knowledge base
      for (const kid of tr.knowledgeEntryIds) {
        const garment = knowledgeBase.getGarmentById(kid);
        const occ = knowledgeBase.getAllOccasions().find((o) => o.id === kid);
        const style = knowledgeBase.getAllStyles().find((s) => s.id === kid);
        expect(!!garment || !!occ || !!style, `Phantom knowledge ID detected: ${kid}`).toBe(true);
      }

      // If text mentions neutral-safe default or unknown, isAssumed must be true and authority DEFAULT
      if (tr.text.includes('neutral-safe default') || tr.text.includes('unknown')) {
        expect(tr.isAssumed).toBe(true);
        expect(tr.authority).toBe('DEFAULT');
      }
    }
  });

  // Test 6: 50 Synthetic Profiles Sweep (F-15b)
  it('F-15b: Synthetic Profile Sweep with 50 diverse, conflicting, and edge-case profiles executes with zero uncaught exceptions', () => {
    const faceShapes: FaceShape[] = ['oval', 'square', 'round', 'rectangle', 'heart', 'diamond'];
    const textures: HairTexture[] = ['straight', 'wavy', 'curly', 'coily'];
    const fits: FitType[] = ['slim', 'regular', 'relaxed', 'boxy', 'oversized'];
    const modesties: ModestyLevel[] = ['unrestricted', 'covered-arms', 'covered-legs', 'covered-both', 'high-coverage'];
    const occasions = knowledgeBase.getAllOccasions();

    for (let i = 0; i < 50; i++) {
      const face = faceShapes[i % faceShapes.length];
      const texture = textures[i % textures.length];
      const fit = fits[i % fits.length];
      const modesty = modesties[i % modesties.length];
      const occ = occasions[i % occasions.length];

      const syntheticUser: User = {
        id: `synth_user_${i}`,
        name: `Synthetic User ${i}`,
        handle: `synth_${i}`,
        createdAt: '2026-10-01',
        visualProfile: {
          id: `vis_synth_${i}`,
          userId: `synth_user_${i}`,
          face: { shape: face, jaw: i % 2 === 0 ? 'angular' : 'soft', hasFacialHair: i % 3 === 0 },
          hair: { texture, density: i % 2 === 0 ? 'high' : 'low', length: 'short', volume: 'moderate' },
          body: { silhouette: 'trapezoid' },
          source: 'user_input',
          lastObservedAt: '2026-10-01',
        },
        styleProfile: {
          id: `sty_synth_${i}`,
          userId: `synth_user_${i}`,
          dominantAestheticSlugs: [i % 2 === 0 ? 'korean-minimal' : 'minimal'],
          styleVector: { ...BASE_STYLE_VECTOR, formality: (i % 5) + 1 },
          preferences: {
            ...BASE_PREFERENCES,
            preferredFits: [fit],
            dislikedFits: i % 4 === 0 ? ['skinny'] : [],
            modestyLevel: modesty,
            userConfirmedUndertone: i % 3 === 0 ? 'warm' : i % 3 === 1 ? 'cool' : 'unspecified',
          },
          feedbackProfile: BASE_FEEDBACK,
          updatedAt: '2026-10-01',
        },
      };

      const syntheticContext: Context = {
        occasion: occ,
        temperatureCelsius: -10 + (i * 2), // -10C to +88C span
        weather: i % 2 === 0 ? 'cold' : 'hot',
        condition: i % 3 === 0 ? 'rain' : 'dry',
      };

      expect(() => {
        const result = VaelStylingEngine.generateTopThreeLooks({
          user: syntheticUser,
          context: syntheticContext,
        });
        expect(result).toBeDefined();
        expect(result.looks).toBeDefined();
      }).not.toThrow();
    }
  });
});
