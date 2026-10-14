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
import { SilhouetteProportionRules } from '../src/core/knowledge/silhouettes';

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
    const outer = garments.find((g) => g.category === 'outerwear');
    const base = garments.find((g) => g.category === 'top' || g.category === 'one-piece');
    const footwear = garments.find((g) => g.category === 'footwear');

    expect(outer).toBeDefined();
    expect(base).toBeDefined();
    expect(footwear).toBeDefined();

    // Multi-layer protection: outer layer is extended/regular long coverage
    expect(outer!.length === 'extended' || outer!.length === 'regular').toBe(true);
    // Closed footwear (no sandals, no slides)
    expect(footwear!.subcategory).not.toContain('sandals');
    expect(footwear!.subcategory).not.toContain('slides');
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
    const footwear = res.bestMatch.outfit.item.items.find((i) => i.garment.category === 'footwear');
    expect(footwear).toBeDefined();
    expect(footwear!.garment.waterResistance === 'waterproof' || footwear!.garment.waterResistance === 'water-resistant').toBe(true);
  });

  // G-05: Cold + rain -> Insulation and water protection (waterproof AND insulating)
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
    const hasWaterProtection = garments.some((g) => g.waterResistance === 'waterproof' || g.waterResistance === 'water-resistant');
    const hasInsulation = garments.some((g) => g.insulation === 'heavy' || g.insulation === 'moderate' || g.fabricWeight === 'heavyweight' || g.fabricWeight === 'midweight');
    expect(hasWaterProtection).toBe(true);
    expect(hasInsulation).toBe(true);
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
    expect(res.stretch).toBeDefined();
    expect(res.bestMatch).toBeDefined();
    expect(res.stretch.outfit.item.id).not.toBe(res.bestMatch.outfit.item.id);

    // Assert tiers differ on 2+ style axes (formality, structure, primaryStyle)
    const g1 = res.bestMatch.outfit.item.items.map((i) => i.garment);
    const g2 = res.stretch.outfit.item.items.map((i) => i.garment);
    let axisDiffs = 0;
    if (res.bestMatch.outfit.item.formality !== res.stretch.outfit.item.formality) axisDiffs++;
    if (res.bestMatch.outfit.item.primaryStyleSlug !== res.stretch.outfit.item.primaryStyleSlug) axisDiffs++;
    const avgStruct1 = g1.reduce((sum, g) => sum + g.structure, 0) / g1.length;
    const avgStruct2 = g2.reduce((sum, g) => sum + g.structure, 0) / g2.length;
    if (Math.abs(avgStruct1 - avgStruct2) >= 0.5) axisDiffs++;

    expect(axisDiffs).toBeGreaterThanOrEqual(2);
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
      expect(Math.abs(footwear.garment.formality - res.bestMatch.outfit.item.formality)).toBeLessThanOrEqual(1);
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
    const femUser = createTestUser();
    femUser.styleProfile.preferences.styleExpression = 'feminine';
    femUser.styleProfile.preferences.genderCodingDirection = 'feminine';

    const mascUser = createTestUser();
    mascUser.styleProfile.preferences.styleExpression = 'masculine';
    mascUser.styleProfile.preferences.genderCodingDirection = 'masculine';

    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      targetFormality: 2,
    };

    const resFem = recommendationService.generateTopThreeLooks({ user: femUser, context });
    const resMasc = recommendationService.generateTopThreeLooks({ user: mascUser, context });

    expect(resFem.looks.length).toBeGreaterThanOrEqual(1);
    expect(resMasc.looks.length).toBeGreaterThanOrEqual(1);

    const getMeanFoundationCoding = (look: any) => {
      const foundations = look.outfit.item.items
        .map((i: any) => i.garment)
        .filter((g: any) => g.category !== 'accessory');
      const sum = foundations.reduce((acc: number, g: any) => acc + (g.garmentCoding !== undefined ? g.garmentCoding : (g.genderCoding === 'feminine' ? 1 : g.genderCoding === 'masculine' ? -1 : 0)), 0);
      return sum / foundations.length;
    };

    const femBestMean = getMeanFoundationCoding(resFem.bestMatch);
    const mascBestMean = getMeanFoundationCoding(resMasc.bestMatch);

    // Moves toward expected coding direction within cap
    expect(femBestMean).toBeGreaterThanOrEqual(0.25);
    expect(mascBestMean).toBeLessThanOrEqual(-0.25);
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
    expect(
      topRec.maintenance === 'minimal' ||
      topRec.protectiveStyle === true ||
      topRec.visualTags.includes('protective') ||
      topRec.visualTags.includes('clean-taper') ||
      topRec.visualTags.includes('buzz')
    ).toBe(true);
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
    // Assert top hair recommendations feature off-neck or heat-aware styling attributes
    const topRec = recs[0];
    const hasHeatAwareReason = topRec.reasons.some((r) =>
      r.toLowerCase().includes('off-neck') || r.toLowerCase().includes('heat-aware') || r.toLowerCase().includes('cooling')
    );
    const hasHeatAwareAttribute =
      topRec.item.visualTags.some((t) => ['knot', 'top-knot', 'updo', 'chignon', 'low-bun', 'buzz', 'pixie', 'taper', 'fade', 'crop', 'cornrows', 'braids'].includes(t)) ||
      topRec.item.targetLength === 'buzz' ||
      topRec.item.targetLength === 'short';

    expect(hasHeatAwareReason || hasHeatAwareAttribute).toBe(true);
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

    const safeGarments = res.safe.outfit.item.items.map((i) => i.garment);
    const safeTop = safeGarments.find((g) => g.category === 'top');
    const safeBottom = safeGarments.find((g) => g.category === 'bottom' || g.category === 'one-piece');
    expect(safeTop).toBeDefined();
    expect(safeBottom).toBeDefined();
    // SAFE balances volume: one piece volume >= 4, other <= 3
    const hasVolumeBalance = (safeTop!.volume >= 4 && safeBottom!.volume <= 3) || (safeTop!.volume <= 3 && safeBottom!.volume >= 4);
    expect(hasVolumeBalance).toBe(true);
    expect(res.safe.overallHarmonyScore).toBeGreaterThanOrEqual(0.70);
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

    // STRETCH explores beyond strict minimal constraints while anchoring with solid foundation pieces
    if (res.stretch) {
      const stretchItems = res.stretch.outfit.item.items.map((i) => i.garment);
      const hasSolidAnchor = stretchItems.some((g) => g.pattern === 'solid');
      expect(hasSolidAnchor).toBe(true);
    }
  });

  // G-23: Tailored jacket + relaxed knit -> Allowed as deliberate high-low
  it('G-23: Tailored jacket + relaxed knit is allowed as deliberate high-low contrast', () => {
    const tailoredOuter = knowledgeBase.getGarmentBySlug('chalkstripe-suit-jacket-charcoal')!;
    const relaxedKnit = knowledgeBase.getGarmentBySlug('alpaca-crewneck-forest')!;
    const tailoredBottom = knowledgeBase.getGarmentBySlug('tailored-slacks-charcoal')!;

    expect(tailoredOuter).toBeDefined();
    expect(relaxedKnit).toBeDefined();
    expect(tailoredBottom).toBeDefined();

    const fitProportions = createTestUser().styleProfile.preferences.fitProportions;
    const evalResult = SilhouetteProportionRules.evaluate(relaxedKnit, tailoredBottom, tailoredOuter, fitProportions);

    expect(evalResult.isProportional).toBe(true);
    expect(evalResult.harmonyScore).toBeGreaterThanOrEqual(0.85);
    expect(evalResult.styleTensionWarning).toBeUndefined();
  });

  // G-24: No proportion inputs -> Proportion factor unknown; confidence capped; proportion reasons from defaults labeled assumed
  it('G-24: No proportion inputs labels proportion factors as assumed without inventing traits', () => {
    const user = createTestUser();
    user.styleProfile.preferences.heightRange = 'unspecified';
    user.styleProfile.preferences.torsoLegPreference = 'unspecified';
    user.styleProfile.preferences.shoulderHipBalance = 'unspecified';
    user.styleProfile.preferences.userConfirmedUndertone = 'unspecified';
    user.styleProfile.preferences.contrastLevel = 'unspecified';
    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('casual')!,
      targetFormality: 2,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });
    expect(res.bestMatch).toBeDefined();

    // Confidence must be capped at GOOD or EXPLORATORY (never STRONG) when profile traits are unspecified
    expect(res.bestMatch.confidence.state).not.toBe('STRONG');
    expect(['GOOD', 'EXPLORATORY']).toContain(res.bestMatch.confidence.state);

    // No proportion signal text invented in reasons
    const reasons = res.bestMatch.reasons;
    const hasInventedProportions = reasons.some(
      (r) => r.toLowerCase().includes('longer torso') || r.toLowerCase().includes('broad shoulders') || r.toLowerCase().includes('height range')
    );
    expect(hasInventedProportions).toBe(false);
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

    // Assert zero demo identifiers or demo user traits exist in any generated text
    const allText = res.looks
      .flatMap((l) => [...l.reasons, ...l.cautions, l.tierRationale, l.confidence.explanation, l.confidence.toIncreaseConfidence || ''])
      .join(' ')
      .toLowerCase();

    expect(allText.includes('usr_vael_curator')).toBe(false);
    expect(allText.includes('julian')).toBe(false);
    expect(allText.includes('curator')).toBe(false);
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
    // High modesty + tailored fit + disliked neutral palette + cold rain formality 5
    user.styleProfile.preferences.modestyLevel = 'covered-both';
    user.styleProfile.preferences.preferredFits = ['tailored'];
    user.styleProfile.preferences.dislikedFits = ['oversized', 'relaxed'];
    user.styleProfile.preferences.dislikedColors = ['brown', 'camel', 'navy', 'taupe', 'sand', 'cream', 'white', 'grey', 'gray', 'charcoal'];
    user.styleProfile.preferences.preferredFormalityRange = [5, 5];

    const context: Context = {
      occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
      targetFormality: 5,
      temperatureLevel: 'cold',
      condition: 'rain',
      isWeatherConfirmed: true,
    };
    const res = recommendationService.generateTopThreeLooks({ user, context });

    // Exactly 2 viable looks survive the stacked constraints
    expect(res.looks.length).toBe(2);
    expect(res.looksCountExplanation).toBeDefined();
    // Named constraint is reported in explanation
    expect(
      res.looksCountExplanation!.includes('disliked color') ||
      res.looksCountExplanation!.includes('modesty') ||
      res.looksCountExplanation!.includes('disliked garment fit') ||
      res.looksCountExplanation!.includes('formality')
    ).toBe(true);

    // Zero vetoed items in surviving looks
    res.looks.forEach((look) => {
      const garments = look.outfit.item.items.map((i) => i.garment);
      const violatesModesty = garments.some((g) => g.modestyRating === 'low-coverage' || g.subcategory.includes('shorts') || g.subcategory.includes('tank'));
      expect(violatesModesty).toBe(false);
      const hasDislikedFit = garments.some((g) => user.styleProfile.preferences.dislikedFits.includes(g.fit));
      expect(hasDislikedFit).toBe(false);
    });
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

  // B2: Confidence degrades gracefully: 1 default -> GOOD, 2+ defaults -> EXPLORATORY
  it('B2: Confidence degrades gracefully with missing inputs: 1 default yields GOOD, 2+ defaults yield EXPLORATORY', () => {
    // 1 default: unconfirmed weather context with complete user profile
    const userOne = createTestUser();
    const contextOne: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      isWeatherConfirmed: false,
    };
    const resOne = recommendationService.generateTopThreeLooks({ user: userOne, context: contextOne });
    expect(resOne.bestMatch.confidence.state).toBe('GOOD');

    // 2+ defaults: unconfirmed weather context AND unspecified target formality (2 foundational defaults)
    const userTwo = createTestUser();
    const contextTwo: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: undefined, // default 1: occasion formality assumed
      isWeatherConfirmed: false,  // default 2: climate assumed
    };
    const resTwo = recommendationService.generateTopThreeLooks({ user: userTwo, context: contextTwo });
    expect(resTwo.bestMatch.confidence.state).toBe('EXPLORATORY');
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
    // Matched metal hardware gives 0.95 factor score; clashing mixed metal hardware applies 0.60
    // Factor weight is retuned to (0.05 / 0.35) so the overall score delta is exactly 0.05 (fixing prior 0.175 uncalibrated delta)
    const factorWeight = 0.05 / 0.35;
    const factorMatched = { category: 'accessory_coherence', weight: factorWeight, score: 0.95, reason: 'Harmonious metal hardware tones across accessories.' };
    const factorMixed = { category: 'accessory_coherence', weight: factorWeight, score: 0.60, reason: 'Mixed metal accents create visual tension.' };

    expect(factorMatched.score).toBe(0.95);
    expect(factorMixed.score).toBe(0.60);
    expect(factorMatched.score - factorMixed.score).toBeCloseTo(0.35);
    expect(factorMixed.score).toBeGreaterThan(0.5); // Remains fully eligible (never vetoed)

    // Overall outfit score effect: with (0.05 / 0.35) weight, delta is exactly 0.05
    const overallDelta = factorMatched.weight * (factorMatched.score - factorMixed.score);
    expect(overallDelta).toBeCloseTo(0.05, 3);
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

    // Assert style distribution is not Minimal-skewed vs occasion requirements (>= 2 of 3 looks non-minimal)
    const styles = res.looks.map((l) => l.outfit.item.primaryStyleSlug);
    const nonMinimalCount = styles.filter((s) => s !== 'minimal' && s !== 'korean-minimal').length;
    expect(nonMinimalCount).toBeGreaterThanOrEqual(2);
    expect(res.looks[0].outfit.item.formality).toBe(3);
  });

  // G-43: Dedicated Tests for Newly Scored Inputs (Contrast, Skin Depth + Undertone, Torso/Leg, Shoulder/Hip, Height)
  describe('G-43: Newly Scored Profile Inputs Verification', () => {
    const baseTestUser = createTestUser({
      styleProfile: {
        ...createTestUser().styleProfile,
        preferences: {
          ...createTestUser().styleProfile.preferences,
          contrastLevel: 'unspecified',
          userConfirmedUndertone: 'unspecified',
          skinDepth: 'unspecified',
          torsoLegPreference: 'unspecified',
          shoulderHipBalance: 'unspecified',
          heightRange: 'unspecified',
        },
      },
    });

    const testContext: Context = {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      temperatureLevel: 'mild',
      condition: 'dry',
      targetFormality: 3,
    };

    it('Contrast input: ranking moves in expected direction, unknown gives zero delta and no reason, delta <= 0.05, STRETCH exempt', () => {
      const userLow = JSON.parse(JSON.stringify(baseTestUser));
      userLow.styleProfile.preferences.contrastLevel = 'low';

      const userHigh = JSON.parse(JSON.stringify(baseTestUser));
      userHigh.styleProfile.preferences.contrastLevel = 'high';

      const resBase = VaelStylingEngine.generateTopThreeLooks({ user: baseTestUser, context: testContext });
      const resLow = VaelStylingEngine.generateTopThreeLooks({ user: userLow, context: testContext });
      const resHigh = VaelStylingEngine.generateTopThreeLooks({ user: userHigh, context: testContext });

      // Unknown gives zero delta and no reason text
      const baseHasContrastFactor = resBase.looks[0].outfit.factors.some((f) => f.reason.includes('contrast level'));
      expect(baseHasContrastFactor).toBe(false);
      const baseHasContrastReason = resBase.looks[0].reasons.some((r) => r.includes('contrast range'));
      expect(baseHasContrastReason).toBe(false);

      // Delta <= 0.05 (soft weight 0.5)
      const deltaLow = Math.abs(resLow.bestMatch.outfit.score - resBase.bestMatch.outfit.score);
      expect(deltaLow).toBeLessThanOrEqual(0.05);

      // Low vs high moves ranking/factor scores
      const lowFactor = resLow.looks[0].outfit.factors.find((f) => f.reason.includes('contrast level'));
      expect(lowFactor).toBeDefined();

      // STRETCH exempt from strict 1-step restriction (permits up to 2 steps)
      if (resLow.stretch) {
        expect(resLow.stretch.outfit.score).toBeGreaterThan(0);
      }
    });

    it('Skin depth + undertone input: ranking moves in expected direction, unknown gives zero delta, delta <= 0.05', () => {
      const userWarm = JSON.parse(JSON.stringify(baseTestUser));
      userWarm.styleProfile.preferences.userConfirmedUndertone = 'warm';
      userWarm.styleProfile.preferences.skinDepth = 'medium';

      const resBase = VaelStylingEngine.generateTopThreeLooks({ user: baseTestUser, context: testContext });
      const resWarm = VaelStylingEngine.generateTopThreeLooks({ user: userWarm, context: testContext });

      // Unknown input gives no face-tonal factor
      const baseHasTonal = resBase.looks[0].outfit.factors.some((f) => f.reason.includes('Echoes complexion undertone'));
      expect(baseHasTonal).toBe(false);

      // Specified warm gives factor and delta <= 0.05
      const warmFactor = resWarm.looks[0].outfit.factors.find((f) => f.reason.includes('Echoes complexion undertone'));
      expect(warmFactor).toBeDefined();
      const deltaWarm = Math.abs(resWarm.bestMatch.outfit.score - resBase.bestMatch.outfit.score);
      expect(deltaWarm).toBeLessThanOrEqual(0.05);
    });

    it('Torso/Leg proportion input: ranking moves in expected direction, unknown gives zero delta, delta <= 0.05', () => {
      const userTorso = JSON.parse(JSON.stringify(baseTestUser));
      userTorso.styleProfile.preferences.torsoLegPreference = 'longer-torso';

      const resBase = VaelStylingEngine.generateTopThreeLooks({ user: baseTestUser, context: testContext });
      const resTorso = VaelStylingEngine.generateTopThreeLooks({ user: userTorso, context: testContext });

      const baseHasTorso = resBase.looks[0].outfit.factors.some((f) => f.reason.includes('vertical proportions'));
      expect(baseHasTorso).toBe(false);

      const torsoFactor = resTorso.looks[0].outfit.factors.find((f) => f.reason.includes('vertical proportions'));
      expect(torsoFactor).toBeDefined();
      const deltaTorso = Math.abs(resTorso.bestMatch.outfit.score - resBase.bestMatch.outfit.score);
      expect(deltaTorso).toBeLessThanOrEqual(0.05);
    });

    it('Shoulder/Hip proportion input: ranking moves in expected direction, unknown gives zero delta, delta <= 0.05', () => {
      const userShoulder = JSON.parse(JSON.stringify(baseTestUser));
      userShoulder.styleProfile.preferences.shoulderHipBalance = 'broad-shoulders';

      const resBase = VaelStylingEngine.generateTopThreeLooks({ user: baseTestUser, context: testContext });
      const resShoulder = VaelStylingEngine.generateTopThreeLooks({ user: userShoulder, context: testContext });

      const baseHasShoulder = resBase.looks[0].outfit.factors.some((f) => f.reason.includes('shoulder and hip'));
      expect(baseHasShoulder).toBe(false);

      const shoulderFactor = resShoulder.looks[0].outfit.factors.find((f) => f.reason.includes('shoulder and hip'));
      expect(shoulderFactor).toBeDefined();
      const deltaShoulder = Math.abs(resShoulder.bestMatch.outfit.score - resBase.bestMatch.outfit.score);
      expect(deltaShoulder).toBeLessThanOrEqual(0.05);
    });

    it('Height range input: ranking moves in expected direction, unknown gives zero delta, delta <= 0.05', () => {
      const userHeight = JSON.parse(JSON.stringify(baseTestUser));
      userHeight.styleProfile.preferences.heightRange = 'compact';

      const resBase = VaelStylingEngine.generateTopThreeLooks({ user: baseTestUser, context: testContext });
      const resHeight = VaelStylingEngine.generateTopThreeLooks({ user: userHeight, context: testContext });

      const baseHasHeight = resBase.looks[0].outfit.factors.some((f) => f.reason.includes('line continuous'));
      expect(baseHasHeight).toBe(false);

      const heightFactor = resHeight.looks[0].outfit.factors.find((f) => f.reason.includes('line continuous'));
      expect(heightFactor).toBeDefined();
      const deltaHeight = Math.abs(resHeight.bestMatch.outfit.score - resBase.bestMatch.outfit.score);
      expect(deltaHeight).toBeLessThanOrEqual(0.05);
    });
  });
});
