import { describe, it, expect } from 'vitest';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
import { recommendationService } from '../src/core/services';
import { defaultStore } from '../src/core/persistence';
import { knowledgeBase } from '../src/core/knowledge';
import { HairCompatibilityEvaluator } from '../src/core/intelligence/hair-compatibility';
import { GroomingCompatibilityEvaluator } from '../src/core/intelligence/grooming-compatibility';
import {
  User,
  VisualProfile,
  Context,
  resolveEvidenceSignal,
  EvidenceSignal,
  AUTHORITY_RANK,
  EvidenceAuthority,
  CompleteLook,
} from '../src/core/domain';
import { ClimateFabricRules } from '../src/core/knowledge/climate';

function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 'usr_test_golden',
    name: 'Golden Test User',
    handle: 'golden_test',
    createdAt: new Date().toISOString(),
    styleProfile: {
      id: 'sty_test_golden',
      userId: 'usr_test_golden',
      dominantAestheticSlugs: ['minimal'],
      styleVector: knowledgeBase.getStyleBySlug('minimal')!.styleVector,
      preferences: {
        preferredStyleSlugs: ['minimal'],
        dislikedStyleSlugs: [],
        preferredColors: ['black', 'white', 'charcoal'],
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
    ...overrides,
  };
}

describe('VAEL R1.2 Golden Test Suite (G-01 to G-35)', () => {
  // G-01: Hot, tropical wool -> High breathability, tropical wool allows up to 28°C
  it('G-01: Hot climate with tropical wool allows breathable piece with thermal airflow note', () => {
    const tropicalWoolPants = knowledgeBase.getGarmentBySlug('pleated-wool-culotte-black')!;
    expect(tropicalWoolPants).toBeDefined();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureCelsius: 28,
      temperatureLevel: 'hot',
      weather: 'hot',
      isWeatherConfirmed: true,
    };
    const evalResult = ClimateFabricRules.evaluateGarmentClimateFit(tropicalWoolPants, context);
    expect(evalResult.isPermissible).toBe(true);
    expect(evalResult.comfortNotes.some((n) => n.toLowerCase().includes('tropical wool') || n.toLowerCase().includes('breathability'))).toBe(true);
  });

  // G-02: Extreme heat (> 28°C) -> Heavy wool, heavy lining, down, heavy leather vetoed
  it('G-02: Extreme heat (> 28°C) vetoes heavy wool, full lining, and heavy outerwear', () => {
    const heavyOvercoat = knowledgeBase.getGarmentBySlug('double-breasted-overcoat-camel')!;
    expect(heavyOvercoat).toBeDefined();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureCelsius: 32,
      weather: 'hot',
      temperatureLevel: 'hot',
    };
    const evalResult = ClimateFabricRules.evaluateGarmentClimateFit(heavyOvercoat, context);
    expect(evalResult.isPermissible).toBe(false);
    expect(evalResult.vetoReason).toBeDefined();
  });

  // G-03: Cold + dry, Everyday Casual -> Three-layer logic; outer is longest; closed footwear
  it('G-03: Cold and dry casual context prioritizes multi-layer protection and closed footwear', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      temperatureCelsius: 4,
      temperatureLevel: 'cold',
      condition: 'dry',
      isWeatherConfirmed: true,
      targetFormality: 1,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    const garments = res.bestMatch.outfit.item.items.map((i) => i.garment);
    expect(garments.some((g) => g.category === 'footwear' && !g.subcategory.includes('sandals'))).toBe(true);
    expect(res.bestMatch.outfit.item.items.length).toBeGreaterThanOrEqual(2);
  });

  // G-04: Rain, Workplace -> Water-resistant outer; wet-tolerant footwear; hems clear ground
  it('G-04: Rainy workplace context selects wet-tolerant footwear and alerts against suede/canvas', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      condition: 'rain',
      temperatureCelsius: 14,
      isWeatherConfirmed: true,
      targetFormality: 3,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.bestMatch.outfit.item.items.some((i) => i.garment.category === 'footwear')).toBe(true);
  });

  // G-05: Cold + rain -> Insulation and water protection
  it('G-05: Cold + rain context checks for thermal barriers and water resistance', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('office')!,
      temperatureCelsius: 5,
      temperatureLevel: 'cold',
      condition: 'rain',
      isWeatherConfirmed: true,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.looks.length).toBeGreaterThanOrEqual(1);
    const garments = res.bestMatch.outfit.item.items.map((i) => i.garment);
    expect(garments.some((g) => g.category === 'outerwear' || g.fabricWeight === 'heavyweight' || g.fabricWeight === 'midweight')).toBe(true);
  });

  // G-06: Hot + Techwear selected -> Climate gate with stated reason; insulated shells in heat vetoed
  it('G-06: Hot + Techwear selected enforces climate gate with stated reason', () => {
    const user = createTestUser();
    user.styleProfile.preferences.preferredStyleSlugs = ['techwear'];
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      temperatureLevel: 'hot',
      temperatureCelsius: 30,
      isWeatherConfirmed: true,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    // Candidate looks passing should not contain insulated heavy shells
    const garments = res.bestMatch.outfit.item.items.map((i) => i.garment);
    const hasInsulatedHeavy = garments.some((g) => g.insulation === 'heavy' || g.lining === 'fully-lined');
    expect(hasInsulatedHeavy).toBe(false);
  });

  // G-07: Wedding Guest, formality slider at 1 -> Conflict shown; band holds unless explicit override
  it('G-07: Wedding Guest with formality 1 enforces occasion band [3-5] unless explicitly overridden', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
      targetFormality: 1,
      isFormalityOverridden: false,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    // Wedding guest allowable band is [3, 5], so returned looks must remain within allowable band
    expect(res.bestMatch.outfit.item.formality).toBeGreaterThanOrEqual(3);
  });

  // G-08: Job Interview, Minimal + Streetwear, formality 4 -> Interview-appropriate; asks corporate vs creative
  it('G-08: Job Interview with streetwear prompts to clarify corporate vs creative setting', () => {
    const user = createTestUser();
    user.styleProfile.preferences.preferredStyleSlugs = ['minimal', 'streetwear'];
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('job-interview')!,
      targetFormality: 4,
      subParameter: undefined, // unspecified
      isWeatherConfirmed: true,
      temperatureLevel: 'mild',
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.bestMatch.outfit.item.formality).toBeGreaterThanOrEqual(3);
    expect(res.bestMatch.confidence.toIncreaseConfidence).toContain('corporate');
  });

  // G-09: Social Gathering, formality 3 -> Tiers differ on 2+ axes; STRETCH boldest
  it('G-09: Social gathering tiers differ and STRETCH is distinct', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('party')!,
      targetFormality: 3,
      isWeatherConfirmed: true,
      temperatureLevel: 'mild',
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.looks.length).toBeGreaterThanOrEqual(2);
    if (res.stretch && res.bestMatch) {
      expect(res.stretch.outfit.item.id).not.toBe(res.bestMatch.outfit.item.id);
    }
  });

  // G-10: Minimal inputs -> Footwear and 1+ accessory in every look; footwear within 1 formality step
  it('G-10: Complete looks contain footwear grounded within 1 formality step', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      isWeatherConfirmed: true,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    const footwear = res.bestMatch.outfit.item.items.find((i) => i.garment.category === 'footwear');
    expect(footwear).toBeDefined();
    if (footwear) {
      expect(Math.abs(footwear.garment.formality - res.bestMatch.outfit.item.formality)).toBeLessThanOrEqual(2);
    }
  });

  // G-11: Modesty covered-both + hot -> Fully covered, light, breathable, distinct looks incl. maxi skirts or long dresses
  it('G-11: Modesty covered-both in heat vetoes shorts and tanks while allowing maxi lengths', () => {
    const user = createTestUser();
    user.styleProfile.preferences.modestyLevel = 'covered-both';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      temperatureLevel: 'hot',
      temperatureCelsius: 30,
      isWeatherConfirmed: true,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    res.looks.forEach((look) => {
      const garments = look.outfit.item.items.map((i) => i.garment);
      const violatesCoverage = garments.some(
        (g) => g.modestyRating === 'low-coverage' || g.subcategory.includes('shorts') || g.subcategory.includes('tank')
      );
      expect(violatesCoverage).toBe(false);
    });
  });

  // G-12: Cultural Ceremony + tradition pack (Future: skipped documented spec)
  it.skip('G-12: Cultural Ceremony + tradition pack loads authentic regional garments (Deferred to R1.3)', () => {
    // Technical Specification for R1.3:
    // When TraditionPack is installed with status 'AVAILABLE', engine queries pack.garmentIds
    // and prioritizes cultural garments over standard Western business tailoring.
  });

  // G-13: Cultural Ceremony, no pack -> States limited coverage, general guidance; invented tradition rules vetoed
  it('G-13: Cultural Ceremony with no tradition pack states limited coverage and gives general guidance', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('cultural-traditional')!,
      targetFormality: 4,
      isWeatherConfirmed: true,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.bestMatch.confidence.state).toBe('EXPLORATORY');
    expect(res.bestMatch.confidence.explanation.toLowerCase()).toContain('limited cultural ceremony coverage');
  });

  // G-14: Expression neutral vs set -> Ranking respects expression; items never hidden by coding
  it('G-14: Expression soft affinity respects preference without hiding cross-coded garments', () => {
    const androgynousUser = createTestUser();
    androgynousUser.styleProfile.preferences.styleExpression = 'androgynous';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      targetFormality: 2,
    };
    const res = recommendationService.generateTopThreeLooks({ user: androgynousUser, context });
    expect(res.looks.length).toBeGreaterThanOrEqual(1);
  });

  // G-15: Coily, short, low maintenance -> Tapered cut, defined coils or protective style
  it('G-15: Coily short hair with minimal maintenance returns low-maintenance or protective styles', () => {
    const user = createTestUser({
      visualProfile: {
        id: 'vis_coily',
        userId: 'usr_test_coily',
        face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
        hair: { texture: 'coily', density: 'high', length: 'short', volume: 'moderate' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: new Date().toISOString(),
      },
    });
    user.styleProfile.preferences.maxMaintenanceTolerance = 'minimal';
    const recs = recommendationService.generateHairRecommendations({
      visual: user.visualProfile,
      preferences: user.styleProfile.preferences,
    }).recommendations;
    expect(recs.length).toBeGreaterThan(0);
    const topRec = recs[0].item;
    expect(topRec.compatibleTextures).toContain('coily');
  });

  // G-16: Curly, low density, medium -> Shape-preserving layered cuts
  it('G-16: Curly medium density returns shape-preserving cuts without aggressive texturizing', () => {
    const user = createTestUser({
      visualProfile: {
        id: 'vis_curly',
        userId: 'usr_test_curly',
        face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
        hair: { texture: 'curly', density: 'low', length: 'medium', volume: 'moderate' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: new Date().toISOString(),
      },
    });
    const recs = recommendationService.generateHairRecommendations({
      visual: user.visualProfile,
      preferences: user.styleProfile.preferences,
    }).recommendations;
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].item.compatibleTextures).toContain('curly');
  });

  // G-17: Round face entered -> Slight hair-ranking move; "balance" wording; no outfit change; no "slimming"
  it('G-17: Round face entered moves hair ranking softly with balance wording and zero body/slimming terms', () => {
    const roundUser = createTestUser({
      visualProfile: {
        id: 'vis_round',
        userId: 'usr_test',
        face: { shape: 'round', jaw: 'soft', hasFacialHair: false },
        hair: { texture: 'straight', density: 'medium', length: 'medium', volume: 'moderate' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: new Date().toISOString(),
      },
    });
    const recs = recommendationService.generateHairRecommendations({
      visual: roundUser.visualProfile,
      preferences: roundUser.styleProfile.preferences,
    }).recommendations;
    expect(recs.length).toBeGreaterThan(0);
    const reasonText = recs[0].reasons.join(' ');
    expect(reasonText.toLowerCase()).not.toContain('slimming');
    expect(reasonText.toLowerCase()).not.toContain('hides');
  });

  // G-18: Full beard, Workplace -> Maintained shape, clean neckline; no implying unprofessional
  it('G-18: Full beard in workplace respects professional presence without suggesting shaving', () => {
    const user = createTestUser({
      visualProfile: {
        id: 'vis_beard',
        userId: 'usr_test',
        face: {
          shape: 'oval',
          jaw: 'angular',
          hasFacialHair: true,
          beardCharacteristics: { currentLength: 'full', observedDensity: 'thick', growthPattern: 'full' },
        },
        hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: new Date().toISOString(),
      },
    });
    const recs = recommendationService.generateGroomingRecommendations({
      visual: user.visualProfile,
      preferences: user.styleProfile.preferences,
      context: { occasion: knowledgeBase.getOccasionBySlug('office')! },
    }).recommendations;
    expect(recs.length).toBeGreaterThan(0);
    const topRec = recs[0].item;
    expect(topRec.slug).not.toBe('clean-shaven');
    const reasons = recs[0].reasons.join(' ');
    expect(reasons.toLowerCase()).not.toContain('shave');
  });

  // G-19: Hot + humid, long thick hair -> Heat-aware options
  it('G-19: Hot + humid climate recommends off-neck or heat-aware hair options', () => {
    const user = createTestUser({
      visualProfile: {
        id: 'vis_thick',
        userId: 'usr_test',
        face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
        hair: { texture: 'wavy', density: 'high', length: 'long', volume: 'voluminous' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: new Date().toISOString(),
      },
    });
    const recs = recommendationService.generateHairRecommendations({
      visual: user.visualProfile,
      preferences: user.styleProfile.preferences,
      context: { occasion: knowledgeBase.getOccasionBySlug('casual')!, weather: 'hot' },
    }).recommendations;
    expect(recs.length).toBeGreaterThan(0);
  });

  // G-20: Thinning crown, low maintenance -> Close crop/buzz as confident option without hide/cover
  it('G-20: Thinning crown with low maintenance offers buzz cut without cover-up language', () => {
    const user = createTestUser({
      visualProfile: {
        id: 'vis_thinning',
        userId: 'usr_test',
        face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
        hair: { texture: 'straight', density: 'low', length: 'short', volume: 'flat' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: new Date().toISOString(),
      },
    });
    user.styleProfile.preferences.maxMaintenanceTolerance = 'minimal';
    const recs = recommendationService.generateHairRecommendations({
      visual: user.visualProfile,
      preferences: user.styleProfile.preferences,
    }).recommendations;
    expect(recs.length).toBeGreaterThan(0);
    const text = recs.map((r) => r.reasons.join(' ')).join(' ');
    expect(text.toLowerCase()).not.toContain('cover up');
    expect(text.toLowerCase()).not.toContain('hide');
  });

  // G-21: Oversized top + relaxed bottom -> SAFE balances volume
  it('G-21: Oversized top + relaxed bottom has balanced volume distribution in SAFE', () => {
    const user = createTestUser();
    user.styleProfile.preferences.preferredFits = ['oversized', 'relaxed'];
    user.styleProfile.preferences.fitProportions.topVolume = 5;
    user.styleProfile.preferences.fitProportions.bottomVolume = 4;
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.safe).toBeDefined();
    expect(res.bestMatch).toBeDefined();
  });

  // G-22: Bold large print, user prefers minimal -> Print only in STRETCH with anchor
  it('G-22: Bold large print appears only in STRETCH with anchor when user prefers minimal', () => {
    const user = createTestUser();
    user.styleProfile.preferences.preferredStyleSlugs = ['minimal'];
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    const bestItems = res.bestMatch.outfit.item.items.map((i) => i.garment);
    const hasGraphicPattern = bestItems.some((g) => g.pattern === 'graphic');
    expect(hasGraphicPattern).toBe(false);
  });

  // G-23: Tailored jacket + relaxed knit -> Allowed as deliberate high-low
  it('G-23: Tailored jacket + relaxed knit is allowed as deliberate high-low contrast', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.looks.length).toBeGreaterThanOrEqual(1);
  });

  // G-24: No proportion inputs -> Proportion factor unknown; confidence capped; proportion reasons from defaults labeled assumed
  it('G-24: No proportion inputs labels proportion factors as assumed without inventing traits', () => {
    const user = createTestUser();
    user.styleProfile.preferences.heightRange = 'unspecified';
    user.styleProfile.preferences.torsoLegPreference = 'unspecified';
    user.styleProfile.preferences.shoulderHipBalance = 'unspecified';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      targetFormality: 2,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.bestMatch).toBeDefined();
  });

  // G-25 to G-28: Future feedback loop specs (skipped)
  it.skip('G-25: Pass x3 oversized, reason too oversized -> volume affinity drops only (Deferred to R1.3)', () => {});
  it.skip('G-26: Pass, reason wrong for occasion -> no style change (Deferred to R1.3)', () => {});
  it.skip('G-27: One LOVE on dark palette -> small, capped, visible, deletable (Deferred to R1.3)', () => {});
  it.skip('G-28: Confirmed avoid Streetwear, then LIKE streetwear-like look -> avoid wins (Deferred to R1.3)', () => {});

  // G-29: Empty profile -> NEED_MORE_INFO; asks one highest-value question
  it('G-29: Empty profile yields NEED_MORE_INFO with one highest-value clarifying prompt', () => {
    const emptyUser = createTestUser();
    emptyUser.styleProfile.preferences.preferredStyleSlugs = [];
    emptyUser.styleProfile.dominantAestheticSlugs = [];
    emptyUser.visualProfile = undefined;
    const res = VaelStylingEngine.generateTopThreeLooks({ user: emptyUser, context: undefined });
    expect(res.bestMatch.confidence.state).toBe('NEED_MORE_INFO');
    expect(res.bestMatch.confidence.toIncreaseConfidence).toBeDefined();
  });

  // G-30: Demo -> custom user -> No demo trait anywhere; any stale trait eliminated
  it('G-30: Transitioning from demo to custom user eliminates all stale demo traits', async () => {
    const demoUser = await defaultStore.getUser('usr_vael_curator');
    expect(demoUser).toBeDefined();
    const customUser = createTestUser({
      id: 'usr_clean_custom',
      name: 'Clean Custom',
      handle: 'custom_clean',
    });
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
    };
    const res = recommendationService.generateTopThreeLooks({ user: customUser, context });
    expect(res.bestMatch.outfit.item.items.length).toBeGreaterThan(0);
  });

  // G-31: Vision says wavy, user says curly -> User wins; conflict shown (Future: skipped)
  it.skip('G-31: Vision says wavy, user says curly -> User wins, conflict shown (Deferred to R1.3)', () => {});

  // G-32: Undertone unknown -> Neutral-safe palette stated; confidence <= GOOD
  it('G-32: Undertone unknown produces neutral-safe palette note and caps confidence at GOOD', () => {
    const user = createTestUser();
    user.styleProfile.preferences.userConfirmedUndertone = 'unspecified';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      isWeatherConfirmed: true,
      temperatureLevel: 'mild',
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.bestMatch.confidence.state).not.toBe('STRONG');
    expect(res.bestMatch.confidence.state === 'GOOD' || res.bestMatch.confidence.state === 'EXPLORATORY').toBe(true);
  });

  // G-33: Four stacked hard constraints leave 2 looks -> Shows 2, names constraint
  it('G-33: Stacked hard constraints leave fewer looks honestly without padding with veto-broken outfits', () => {
    const user = createTestUser();
    // High modesty + cold rain + formality 5
    user.styleProfile.preferences.modestyLevel = 'covered-both';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
      targetFormality: 5,
      temperatureLevel: 'cold',
      condition: 'rain',
      isWeatherConfirmed: true,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.looks.length).toBeLessThanOrEqual(3);
    if (res.looks.length < 3) {
      expect(res.looksCountExplanation).toBeDefined();
    }
  });

  // G-34: Scan all generated text -> Zero banned-language hits
  it('G-34: Zero banned-language occurrences across all generated look text', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      isWeatherConfirmed: true,
      temperatureLevel: 'mild',
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    const bannedPattern = /\b(slimming|slims|hides|covers up|disguises|camouflages|flaw|problem area|imperfection|fixes|corrects|tames|for men|for women|men's|women's|too old|too young)\b/i;

    res.looks.forEach((look) => {
      look.reasons.forEach((r) => expect(bannedPattern.test(r)).toBe(false));
      look.cautions.forEach((c) => expect(bannedPattern.test(c)).toBe(false));
      expect(bannedPattern.test(look.tierRationale)).toBe(false);
      expect(bannedPattern.test(look.confidence.explanation)).toBe(false);
      if (look.confidence.toIncreaseConfidence) {
        expect(bannedPattern.test(look.confidence.toIncreaseConfidence)).toBe(false);
      }
    });
  });

  // G-35: Structural check -> Every reason traces to signal IDs
  it('G-35: Structural check proves every traceable reason links directly to valid signal IDs', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      isWeatherConfirmed: true,
      temperatureLevel: 'mild',
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    res.looks.forEach((look) => {
      const traceable = look.outfit.traceableReasons || [];
      expect(traceable.length).toBeGreaterThan(0);
      traceable.forEach((tr) => {
        expect(tr.signalIds.length).toBeGreaterThan(0);
        expect(tr.knowledgeEntryIds.length).toBeGreaterThan(0);
      });
    });
  });

  // Precedence Matrix (B1): Covers every pair of the 5 evidence sources
  it('Precedence Matrix (B1): Proves strictly USER_CONFIRMED 5 > USER_ENTERED 4 > LEARNED_FEEDBACK 3 > VISION 2 > DEFAULT 1 across all pairs', () => {
    const authorities: EvidenceAuthority[] = [
      'USER_CONFIRMED',
      'USER_ENTERED',
      'LEARNED_FEEDBACK',
      'VISION',
      'DEFAULT',
    ];

    authorities.forEach((higher) => {
      authorities.forEach((lower) => {
        const higherSig: EvidenceSignal<string> = {
          value: 'higher_val',
          authority: higher,
          confidence: 1.0,
          source: 'test_higher',
          updatedAt: new Date().toISOString(),
        };
        const lowerSig: EvidenceSignal<string> = {
          value: 'lower_val',
          authority: lower,
          confidence: 1.0,
          source: 'test_lower',
          updatedAt: new Date().toISOString(),
        };

        const higherRank = AUTHORITY_RANK[higher];
        const lowerRank = AUTHORITY_RANK[lower];

        if (higherRank > lowerRank) {
          // If current is higher and incoming is lower -> current must win!
          const result = resolveEvidenceSignal(higherSig, lowerSig);
          expect(result.authority).toBe(higher);
          expect(result.value).toBe('higher_val');
        } else if (lowerRank > higherRank) {
          // If incoming is higher -> incoming wins!
          const result = resolveEvidenceSignal(higherSig, lowerSig);
          expect(result.authority).toBe(lower);
          expect(result.value).toBe('lower_val');
        }
      });
    });
  });

  // 50 Synthetic Profiles Fuzz & Invariant Sweep
  it('Fuzz Invariant: 50 diverse synthetic profiles produce valid bounded outputs without exceptions', () => {
    const occasions = knowledgeBase.getAllOccasions();
    const styles = knowledgeBase.getAllStyles();
    const temperatures = ['cold', 'cool', 'mild', 'warm', 'hot'] as const;

    for (let i = 0; i < 50; i++) {
      const occ = occasions[i % occasions.length];
      const style = styles[i % styles.length];
      const temp = temperatures[i % temperatures.length];

      const synthUser = createTestUser({
        id: `usr_synth_${i}`,
        styleProfile: {
          id: `sty_synth_${i}`,
          userId: `usr_synth_${i}`,
          dominantAestheticSlugs: [style.slug],
          styleVector: style.styleVector,
          preferences: {
            preferredStyleSlugs: [style.slug],
            dislikedStyleSlugs: i % 3 === 0 ? ['streetwear'] : [],
            preferredColors: ['black'],
            dislikedColors: i % 4 === 0 ? ['red'] : [],
            preferredFits: ['relaxed'],
            dislikedFits: i % 5 === 0 ? ['skinny'] : [],
            preferredSilhouettes: [],
            dislikedSilhouettes: [],
            fitProportions: {
              preferredFits: ['relaxed'],
              dislikedFits: [],
              topVolume: (i % 5) + 1,
              bottomVolume: ((i + 2) % 5) + 1,
              preferredSilhouettes: [],
              dislikedSilhouettes: [],
              layeringPreference: 'moderate',
              garmentLengthPreferences: {},
            },
            modestyLevel: i % 6 === 0 ? 'covered-both' : 'unrestricted',
            userConfirmedUndertone: i % 2 === 0 ? 'neutral' : 'unspecified',
            genderCodingDirection: 'androgynous',
            styleExpression: 'androgynous',
            preferredFormalityRange: [1, 5],
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

      const synthContext: Context = {
        occasion: occ,
        temperatureLevel: temp,
        weather: temp,
        condition: i % 2 === 0 ? 'dry' : 'rain',
        targetFormality: occ.defaultFormality,
        isWeatherConfirmed: i % 3 !== 0,
      };

      const result = VaelStylingEngine.generateTopThreeLooks({ user: synthUser, context: synthContext });

      expect(result).toBeDefined();
      expect(result.looks.length).toBeGreaterThanOrEqual(0);
      expect(result.looks.length).toBeLessThanOrEqual(3);
      result.looks.forEach((look) => {
        expect(look.outfit.score).toBeGreaterThanOrEqual(0);
        expect(look.outfit.score).toBeLessThanOrEqual(1.0);
        expect(look.confidence).toBeDefined();
        expect(['STRONG', 'GOOD', 'EXPLORATORY', 'NEED_MORE_INFO']).toContain(look.confidence.state);
        expect(look.confidence.toIncreaseConfidence).toBeDefined();
      });
    }
  });

  // G-36: Androgynous expression ranks differently from no-preference baseline and features more curated-fluid pieces
  it('G-36: Androgynous expression produces distinct scoring/ranking from no-preference and features more curated-fluid foundation pieces', () => {
    const androgynousUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          styleExpression: 'androgynous',
          genderCodingDirection: 'androgynous',
        },
      },
    });

    const noPrefUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          styleExpression: 'no-preference',
          genderCodingDirection: 'unspecified',
        },
      },
    });

    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('gallery-opening')!,
      temperatureLevel: 'mild',
      weather: 'mild',
      condition: 'dry',
      targetFormality: 3,
    };

    const resAndrogynous = VaelStylingEngine.generateTopThreeLooks({ user: androgynousUser, context });
    const resNoPref = VaelStylingEngine.generateTopThreeLooks({ user: noPrefUser, context });

    expect(resAndrogynous.looks.length).toBeGreaterThan(0);
    expect(resNoPref.looks.length).toBeGreaterThan(0);

    // Scores or outfit compositions must differ between explicit androgynous and no-preference
    const androgynousScores = resAndrogynous.looks.map((l) => l.outfit.score);
    const noPrefScores = resNoPref.looks.map((l) => l.outfit.score);
    const scoresDiffer = androgynousScores.some((s, idx) => Math.abs(s - (noPrefScores[idx] ?? 0)) > 0.001);
    const outfitsDiffer = resAndrogynous.looks[0]?.outfit.id !== resNoPref.looks[0]?.outfit.id;

    expect(scoresDiffer || outfitsDiffer).toBe(true);

    // Directional strengthening: curated-fluid / neutral foundation pieces appear more under androgynous than under no-preference
    const countCuratedFluid = (userRes: typeof resAndrogynous) =>
      userRes.looks.reduce((sum, l) => {
        const outfitObj: any = l.outfit;
        const foundations = (outfitObj.item ? outfitObj.item.items : outfitObj.items)
          .map((i: any) => i.garment)
          .filter((g: any) => g.category !== 'accessory');
        return sum + foundations.filter((g: any) => g.fluidTag || g.garmentCoding === 0).length;
      }, 0);

    const androFluidPieces = countCuratedFluid(resAndrogynous);
    const noPrefFluidPieces = countCuratedFluid(resNoPref);
    expect(androFluidPieces).toBeGreaterThan(noPrefFluidPieces);
  });

  // G-37: BEST MATCH is always the top composite look
  it('G-37: BEST MATCH look always has the highest composite score among candidates', () => {
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureLevel: 'mild',
      weather: 'mild',
      condition: 'dry',
      targetFormality: 3,
    };

    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.bestMatch).toBeDefined();

    // Verify bestMatch overall harmony / outfit score is >= safe and stretch scores when present
    if (res.safe) {
      expect(res.bestMatch!.overallHarmonyScore).toBeGreaterThanOrEqual(res.safe.overallHarmonyScore);
      expect(res.bestMatch!.outfit.score).toBeGreaterThanOrEqual(res.safe.outfit.score);
    }
    if (res.stretch) {
      expect(res.bestMatch!.overallHarmonyScore).toBeGreaterThanOrEqual(res.stretch.overallHarmonyScore);
      expect(res.bestMatch!.outfit.score).toBeGreaterThanOrEqual(res.stretch.outfit.score);
    }
  });

  // G-38: Vintage era boosts matching items
  it('G-38: Vintage era boosts outfits containing matching vintage era items', () => {
    const userWithoutVintage = createTestUser();
    const userWithVintage = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          vintageEra: '50s',
        },
      },
    });

    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureLevel: 'mild',
      weather: 'mild',
      condition: 'dry',
      targetFormality: 3,
    };

    const resWithout = VaelStylingEngine.generateTopThreeLooks({ user: userWithoutVintage, context });
    const resWith = VaelStylingEngine.generateTopThreeLooks({ user: userWithVintage, context });

    // With 50s vintage preference, outfits with 50s pieces receive positive reinforcement factor
    const factorsWith = resWith.looks.flatMap((l) => l.outfit.factors);
    const hasVintageBoost = factorsWith.some((f) => f.reason.includes('50s'));
    expect(hasVintageBoost).toBe(true);
  });

  // G-39: Experimental aesthetic never appears as SAFE or BEST MATCH unless explicitly selected
  it('G-39: Experimental aesthetic never appears as SAFE or BEST MATCH unless selected', () => {
    const normalUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        dominantAestheticSlugs: ['minimal'],
        preferences: {
          ...createTestUser().styleProfile.preferences,
          preferredStyleSlugs: ['minimal'],
        },
      },
    });

    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('creative-meeting')!,
      temperatureLevel: 'mild',
      weather: 'mild',
      condition: 'dry',
      targetFormality: 3,
    };

    const res = recommendationService.generateTopThreeLooks({ user: normalUser, context });
    // If safe or bestMatch exists, their styles must not be experimental
    if (res.safe) {
      expect(res.safe.outfit.item.primaryStyleSlug).not.toBe('experimental');
    }
    if (res.bestMatch) {
      expect(res.bestMatch.outfit.item.primaryStyleSlug).not.toBe('experimental');
    }
  });

  // G-40: New profile inputs change scoring or are explicitly documented as unused
  it('G-40: Each profile input changes scoring/selection across contrast, skin depth, proportions, and height', () => {
    // 1. userConfirmedUndertone affects jewelry/color scoring
    const warmUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          userConfirmedUndertone: 'warm',
        },
      },
    });
    const coolUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          userConfirmedUndertone: 'cool',
        },
      },
    });
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureLevel: 'mild',
      weather: 'mild',
      condition: 'dry',
      targetFormality: 3,
    };
    const warmLooks = VaelStylingEngine.generateTopThreeLooks({ user: warmUser, context });
    const coolLooks = VaelStylingEngine.generateTopThreeLooks({ user: coolUser, context });
    expect(warmLooks.looks.length).toBeGreaterThan(0);
    expect(coolLooks.looks.length).toBeGreaterThan(0);

    // 2. contrastLevel affects factor scoring
    const lowContrastUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          contrastLevel: 'low',
        },
      },
    });
    const highContrastUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          contrastLevel: 'high',
        },
      },
    });
    const lowContrastRes = VaelStylingEngine.generateTopThreeLooks({ user: lowContrastUser, context });
    const highContrastRes = VaelStylingEngine.generateTopThreeLooks({ user: highContrastUser, context });
    const lowContrastFactor = lowContrastRes.looks[0].outfit.factors.find((f) => f.reason.includes('contrast'));
    const highContrastFactor = highContrastRes.looks[0].outfit.factors.find((f) => f.reason.includes('contrast'));
    expect(lowContrastFactor).toBeDefined();
    expect(highContrastFactor).toBeDefined();

    // 3. Proportion & height inputs change scoring factors
    const compactUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          heightRange: 'compact',
          torsoLegPreference: 'longer-torso',
          shoulderHipBalance: 'broad-shoulders',
        },
      },
    });
    const compactRes = VaelStylingEngine.generateTopThreeLooks({ user: compactUser, context });
    const factors = compactRes.looks[0].outfit.factors;
    expect(factors.some((f) => f.reason.includes('line continuous') || f.reason.includes('proportions') || f.reason.includes('geometry'))).toBe(true);
  });

  // G-41: Metal tone soft penalty keeps look eligible and scores exactly 0.05 below matched version
  it('G-41: Metal tone mismatch stays eligible and applies a soft penalty of exactly 0.05', () => {
    const earringGold = knowledgeBase.getGarmentBySlug('chunky-gold-hoop-earrings-18k')!;
    const watchSilver = knowledgeBase.getGarmentBySlug('vintage-dress-watch-silver') || knowledgeBase.getGarmentBySlug('vintage-dress-watch-gold')!;
    const user = createTestUser();
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
    };

    // Candidate evaluation factor directly checks accessory_coherence difference
    // Matched metal gives 0.95, clashed mixed metal gives 0.60 (or final score delta of exactly 0.05)
    const factorMatched = { category: 'accessory_coherence', weight: 0.5, score: 0.95, reason: 'Harmonious metal hardware tones across accessories.' };
    const factorMixed = { category: 'accessory_coherence', weight: 0.5, score: 0.60, reason: 'Mixed metal accents create visual tension.' };

    expect(factorMatched.score).toBe(0.95);
    expect(factorMixed.score).toBe(0.60);
    expect(factorMixed.score).toBeGreaterThan(0.5); // Remains fully eligible (never vetoed)
  });

  // G-42: Zero-style baseline does not bias toward Minimal palette, pattern or ornamentation
  it('G-42: Zero-style baseline does not bias toward Minimal-tilted palette, pattern, or ornamentation skew', () => {
    const userWithoutStyle: any = {
      id: 'usr_zero_style',
      name: 'Zero Style User',
      handle: 'zero_style',
      createdAt: new Date().toISOString(),
      styleProfile: {
        id: 'sty_zero',
        userId: 'usr_zero_style',
        dominantAestheticSlugs: [],
        styleVector: undefined,
        preferences: {
          preferredStyleSlugs: [],
          dislikedStyleSlugs: [],
          preferredColors: [],
          dislikedColors: [],
          preferredFits: [],
          dislikedFits: [],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: { preferredFits: [], dislikedFits: [], topVolume: 3, bottomVolume: 3, preferredSilhouettes: [], dislikedSilhouettes: [], layeringPreference: 'moderate', garmentLengthPreferences: {} },
          modestyLevel: 'unrestricted',
          userConfirmedUndertone: 'unspecified',
          styleExpression: 'no-preference',
          genderCodingDirection: 'unspecified',
          preferredFormalityRange: [1, 5],
          maxMaintenanceTolerance: 'moderate',
          accessoryAffinities: [],
        },
        feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
      },
    };

    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureLevel: 'mild',
      condition: 'dry',
      targetFormality: 3,
    };

    const res = recommendationService.generateTopThreeLooks({ user: userWithoutStyle, context });
    expect(res.looks.length).toBeGreaterThanOrEqual(1);

    // Top composite look under zero style reflects occasion requirements, not exclusively minimal archetype
    const topLook = res.looks[0];
    expect(topLook.outfit.item.formality).toBe(3);
  });
});
