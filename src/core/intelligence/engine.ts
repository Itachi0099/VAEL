import { Outfit, Garment } from '../domain/fashion';
import { HairStyle, BeardStyle } from '../domain/grooming';
import { Context } from '../domain/context';
import { VisualProfile } from '../domain/visual';
import { User, PreferenceProfile, FeedbackProfile } from '../domain/user';
import { StyleVector } from '../domain/style-axis';
import {
  Recommendation,
  CompleteLook,
  TopThreeLooks,
  ConfidenceState,
  RecommendationTier,
  RecommendationFactor,
  TraceableReason,
} from '../domain/recommendation';
import { knowledgeBase } from '../knowledge';
import { ClimateFabricRules } from '../knowledge/climate';
import { SilhouetteProportionRules } from '../knowledge/silhouettes';
import { evaluateColorHarmony } from '../knowledge/color-theory';
import { StyleVectorMath } from './style-vector';
import { HairCompatibilityEvaluator } from './hair-compatibility';
import { GroomingCompatibilityEvaluator } from './grooming-compatibility';
import { computeWeightedScore } from './scoring';

export interface LookEngineQuery {
  user: User;
  context?: Context;
  candidateOutfits?: Outfit[];
  limitCandidates?: number;
}

export interface CandidateEvaluation {
  outfit: Outfit;
  totalScore: number;
  factors: RecommendationFactor[];
  reasons: string[];
  traceableReasons?: TraceableReason[];
  cautions: string[];
  stylingAdvice: string[];
  styleVector: StyleVector;
  styleAffinity: number;
  isOwnedWardrobeMatch: boolean;
}

export class VaelStylingEngine {
  /**
   * Generates the Top 3 diverse looks according to the 3-Step Pipeline:
   * STEP 1: Hard Filters / Veto
   * STEP 2: Soft Scoring
   * STEP 3: Diversity Selection (Safe, Best Match, Stretch)
   */
  static generateTopThreeLooks(query: LookEngineQuery): TopThreeLooks {
    const user = query.user;
    const context = query.context;
    const userVector = user.styleProfile.styleVector || StyleVectorMath.createBalancedVector();

    // 1. Gather Candidate Outfits
    const candidates = query.candidateOutfits || this.buildCandidateOutfits(user);
    const totalCandidates = candidates.length;

    // STEP 1: HARD FILTERS / VETO (PHYSICS, DRESS CODES, HARD VETOES ARE NEVER RELAXED)
    const survivingCandidates: Outfit[] = [];
    let vetoedCount = 0;

    for (const outfit of candidates) {
      const vetoResult = this.applyHardFilters(outfit, user, context);
      if (vetoResult.vetoed) {
        vetoedCount++;
      } else {
        survivingCandidates.push(outfit);
      }
    }

    const relaxationLog: string[] = [];
    let looksCountExplanation: string | undefined;

    // STEP 2: SOFT SCORING
    const evaluatedList: CandidateEvaluation[] = survivingCandidates.map((outfit) =>
      this.evaluateCandidateOutfit(outfit, user, context)
    );

    // Sort by total score descending
    evaluatedList.sort((a, b) => b.totalScore - a.totalScore);

    // STEP 3: DIVERSITY SELECTION & RELAXATION ORDER (F-08)
    // Relaxation order if fewer than 3 looks can be diversified:
    // 1. Relax stretch distance / style diversity requirement
    // 2. Relax secondary archetype affinity
    // 3. Relax soft color preference
    // 4. Relax trend preference
    // HARD VETOES ARE NEVER RELAXED. If fewer than 3 viable looks pass hard filters, return fewer looks honestly.
    const { safeCandidate, bestMatchCandidate, stretchCandidate, relaxedSteps } = this.selectDiverseTopThree(
      evaluatedList,
      userVector
    );
    relaxationLog.push(...relaxedSteps);

    // Complement with Best Matching Hair & Beard
    const primarySlug = bestMatchCandidate?.outfit.primaryStyleSlug || safeCandidate?.outfit.primaryStyleSlug;
    const hairRec = this.getBestHair(user, context, primarySlug);
    const beardRec = this.getBestGrooming(user, context, primarySlug);

    const looks: CompleteLook[] = [];
    let safeLook: CompleteLook | undefined;
    let bestMatchLook: CompleteLook | undefined;
    let stretchLook: CompleteLook | undefined;

    if (bestMatchCandidate) {
      bestMatchLook = this.buildCompleteLook('BEST_MATCH', bestMatchCandidate, user, context, hairRec, beardRec);
      looks.push(bestMatchLook);
    }

    if (safeCandidate && safeCandidate !== bestMatchCandidate) {
      safeLook = this.buildCompleteLook('SAFE', safeCandidate, user, context, hairRec, beardRec);
      looks.push(safeLook);
    } else if (safeCandidate && !bestMatchCandidate) {
      safeLook = this.buildCompleteLook('SAFE', safeCandidate, user, context, hairRec, beardRec);
      looks.push(safeLook);
    }

    if (stretchCandidate && stretchCandidate !== bestMatchCandidate && stretchCandidate !== safeCandidate) {
      stretchLook = this.buildCompleteLook('STRETCH', stretchCandidate, user, context, hairRec, beardRec);
      looks.push(stretchLook);
    }

    // Set honest looks count explanation when fewer than 3 looks remain
    if (looks.length === 0) {
      looksCountExplanation = 'No outfits satisfy current hard climate, dress code, or modesty constraints. Relaxing soft preferences did not yield viable candidates.';
    } else if (looks.length < 3) {
      looksCountExplanation = `Returned ${looks.length} viable look${looks.length === 1 ? '' : 's'}. Additional candidate looks were vetoed by strict constraints (climate limits, occasion dress code, or modesty). VAEL does not relax hard vetoes to force 3 options.`;
    }

    // Retain legacy tier look fallbacks for backwards compatibility while canonical looks list holds exact viable count
    const fallbackCandidate = evaluatedList[0] || this.evaluateCandidateOutfit(candidates[0], user, context);
    const fallbackLook = this.buildCompleteLook('BEST_MATCH', fallbackCandidate, user, context, hairRec, beardRec);

    const safeFinal = safeLook || bestMatchLook || fallbackLook;
    const bestMatchFinal = bestMatchLook || safeLook || fallbackLook;
    const stretchFinal = stretchLook || bestMatchLook || fallbackLook;

    return {
      safe: safeFinal,
      bestMatch: bestMatchFinal,
      stretch: stretchFinal,
      looks,
      looksCountExplanation,
      relaxationLog: relaxationLog.length > 0 ? relaxationLog : undefined,
      contextApplied: context?.occasion?.name || 'General Stylist Curation',
      vetoedCandidateCount: vetoedCount,
      evaluatedCandidateCount: totalCandidates,
    };
  }

  /**
   * STEP 1: Hard Filters / Veto (NEVER RELAXED)
   */
  private static applyHardFilters(
    outfit: Outfit,
    user: User,
    context?: Context
  ): { vetoed: boolean; reason?: string } {
    const preferences = user.styleProfile.preferences;
    const garments = outfit.items.map((i) => i.garment);

    // 1. Modesty Filter:
    // Support 'high-coverage', 'covered-arms', 'covered-legs', 'covered-both'
    const modesty = preferences.modestyLevel;
    if (modesty === 'high-coverage' || modesty === 'covered-both') {
      const hasRevealing = garments.some(
        (g) => g.modestyRating === 'low-coverage' || g.subcategory.includes('shorts') || g.subcategory.includes('tank')
      );
      if (hasRevealing) {
        return { vetoed: true, reason: 'Violates user-stated high-coverage modesty preference.' };
      }
    } else if (modesty === 'covered-arms') {
      const hasShortSleevesOrTank = garments.some(
        (g) => g.category === 'top' && (g.subcategory.includes('tank') || g.modestyRating === 'low-coverage')
      );
      if (hasShortSleevesOrTank) {
        return { vetoed: true, reason: 'Violates user-stated covered-arms modesty preference.' };
      }
    } else if (modesty === 'covered-legs') {
      const hasShorts = garments.some(
        (g) => g.category === 'bottom' && (g.subcategory.includes('shorts') || g.modestyRating === 'low-coverage')
      );
      if (hasShorts) {
        return { vetoed: true, reason: 'Violates user-stated covered-legs modesty preference.' };
      }
    }

    // 2. Climate Filter: Property-based thermal thresholds & rain tolerance
    if (context) {
      const climateEval = ClimateFabricRules.evaluateOutfitClimateFit(garments, context);
      if (!climateEval.isPermissible) {
        return { vetoed: true, reason: climateEval.vetoReason || 'Violates ambient climate thresholds.' };
      }
    }

    // 3. Stated Color Dislikes Filter
    if (preferences.dislikedColors && preferences.dislikedColors.length > 0) {
      const disliked = preferences.dislikedColors.map((c) => c.toLowerCase());
      const hasDislikedColor = garments.some((g) =>
        disliked.some((dc) => g.color.name.toLowerCase().includes(dc))
      );
      if (hasDislikedColor) {
        return { vetoed: true, reason: 'Contains stated disliked color tone.' };
      }
    }

    // 4. Stated Fit Dislikes Filter
    if (preferences.dislikedFits && preferences.dislikedFits.length > 0) {
      const hasDislikedFit = garments.some((g) => preferences.dislikedFits.includes(g.fit));
      if (hasDislikedFit) {
        return { vetoed: true, reason: 'Contains stated disliked garment fit.' };
      }
    }

    // 5. Stated Style Dislikes Filter
    if (preferences.dislikedStyleSlugs?.includes(outfit.primaryStyleSlug)) {
      return { vetoed: true, reason: `Primary style (${outfit.primaryStyleSlug}) is in user dislike list.` };
    }

    // 6. Occasion Dress Code Restrictions Filter
    if (context?.occasion?.restrictedGarmentCategories) {
      const restrictions = context.occasion.restrictedGarmentCategories;
      const violatesDressCode = garments.some((g) =>
        restrictions.some((r) => g.subcategory.includes(r) || g.slug.includes(r) || g.name.toLowerCase().includes(r))
      );
      if (violatesDressCode) {
        return { vetoed: true, reason: `Contains pieces restricted for ${context.occasion.name}.` };
      }
    }

    // 7. Occasion Formality Band Check (F-04)
    // If user explicitly confirmed isFormalityOverridden, do not veto
    if (context?.occasion) {
      const targetFormality = context.targetFormality || context.occasion.defaultFormality;
      const allowableRange = context.occasion.allowableFormalityRange;

      if (!context.isFormalityOverridden) {
        // Enforce allowable formality band of the occasion
        if (outfit.formality < allowableRange[0] || outfit.formality > allowableRange[1]) {
          return {
            vetoed: true,
            reason: `Outfit formality (${outfit.formality}) is outside allowable range [${allowableRange[0]}-${allowableRange[1]}] for ${context.occasion.name}.`,
          };
        }
      } else {
        // When overridden, only veto on radical deviation (>= 3 levels from target)
        if (Math.abs(outfit.formality - targetFormality) >= 3) {
          return { vetoed: true, reason: 'Formality deviates radically from overridden target formality.' };
        }
      }
    }

    return { vetoed: false };
  }

  /**
   * STEP 2: Soft Scoring
   */
  private static evaluateCandidateOutfit(
    outfit: Outfit,
    user: User,
    context?: Context
  ): CandidateEvaluation {
    const factors: RecommendationFactor[] = [];
    const reasons: string[] = [];
    const cautions: string[] = [];
    const stylingAdvice: string[] = [];

    const preferences = user.styleProfile.preferences;
    const garments = outfit.items.map((i) => i.garment);
    const top = garments.find((g) => g.category === 'top');
    const bottom = garments.find((g) => g.category === 'bottom');
    const outer = garments.find((g) => g.category === 'outerwear');
    const onePiece = garments.find((g) => g.category === 'one-piece');

    // 1. Style Vector Affinity (Weight: 3.5)
    const styleFamily = knowledgeBase.getStyleBySlug(outfit.primaryStyleSlug);
    const outfitVector = styleFamily?.styleVector || StyleVectorMath.createBalancedVector();
    const userVector = user.styleProfile.styleVector || StyleVectorMath.createBalancedVector();
    const styleAffinity = StyleVectorMath.calculateAffinity(userVector, outfitVector);

    factors.push({
      category: 'style_affinity',
      weight: 3.5,
      score: styleAffinity,
      reason: `Coordinate affinity (${Math.round(styleAffinity * 100)}%) with your 10D style vector.`,
    });
    if (styleAffinity >= 0.8) {
      reasons.push(`Directly mirrors your personal style axis coordinates.`);
    }

    // 2. Silhouette & Proportion Harmony (Weight: 3.0)
    const silEval = SilhouetteProportionRules.evaluate(top, bottom, outer, preferences.fitProportions, onePiece);
    factors.push({
      category: 'silhouette_balance',
      weight: 3.0,
      score: silEval.harmonyScore,
      reason: silEval.structureDescription,
    });
    reasons.push(silEval.structureDescription);
    stylingAdvice.push(...silEval.advice);
    if (silEval.styleTensionWarning) {
      cautions.push(silEval.styleTensionWarning);
    }

    // 3. Color Harmony (Weight: 3.0)
    const colors = garments.map((g) => g.color);
    const colorHarmony = evaluateColorHarmony(colors, {
      userConfirmedUndertone: preferences.userConfirmedUndertone,
      dislikedColors: preferences.dislikedColors,
      preferredColors: preferences.preferredColors,
    });
    factors.push({
      category: 'color_harmony',
      weight: 3.0,
      score: colorHarmony.score,
      reason: `Color story: ${colorHarmony.harmonyType}`,
    });
    reasons.push(...colorHarmony.notes);
    if (colorHarmony.undertoneCompatibilityNote) {
      reasons.push(colorHarmony.undertoneCompatibilityNote);
    }

    // 4. Occasion Calibration (Weight: 2.5)
    if (context?.occasion) {
      const targetFormality = context.targetFormality || context.occasion.defaultFormality;
      const diff = Math.abs(outfit.formality - targetFormality);
      const occasionScore = Math.max(0.2, 1.0 - diff * 0.25);

      factors.push({
        category: 'occasion_fit',
        weight: 2.5,
        score: occasionScore,
        reason: `Formality fit for ${context.occasion.name} (Level ${outfit.formality})`,
      });
      if (diff === 0) {
        reasons.push(`Precisely calibrated to ${context.occasion.name} formality.`);
      }
    }

    // 5. Climate Fit (Weight: 2.0)
    if (context) {
      const climateEval = ClimateFabricRules.evaluateOutfitClimateFit(garments, context);
      factors.push({
        category: 'weather_fit',
        weight: 2.0,
        score: climateEval.score,
        reason: 'Ambient temperature and breathability calibration',
      });
      reasons.push(...climateEval.comfortNotes);
      cautions.push(...climateEval.cautions);
    }

    // 6. Wardrobe Prioritization (Weight: 1.5)
    // Check if any garments are owned in user wardrobe
    const isOwnedWardrobeMatch = outfit.items.some((i) => i.stylingNote?.includes('owned'));
    if (isOwnedWardrobeMatch) {
      factors.push({
        category: 'wardrobe_priority',
        weight: 1.5,
        score: 0.95,
        reason: 'Utilizes garments already owned in your wardrobe.',
      });
      reasons.push('Features signature pieces from your existing wardrobe.');
    }

    // 7. Style Expression Soft Affinity (Weight: 1.0, Soft Cap: <= 0.15 effective impact)
    // Expression must NEVER outweigh climate, occasion, or explicit dislikes.
    // Gender identity has strictly ZERO weight and is never read here.
    const expr = preferences.styleExpression || preferences.genderCodingDirection;
    if (expr && expr !== 'no-preference' && expr !== 'unspecified') {
      const garmentsWithCoding = outfit.items.map((it) => it.garment);
      let matchCount = 0;
      for (const g of garmentsWithCoding) {
        if (expr === 'androgynous' && (g.genderCoding === 'androgynous' || g.fluidTag || g.garmentCoding === 0)) {
          matchCount++;
        } else if (expr === 'masculine' && (g.genderCoding === 'masculine' || (g.garmentCoding !== undefined && g.garmentCoding < 0))) {
          matchCount++;
        } else if (expr === 'feminine' && (g.genderCoding === 'feminine' || (g.garmentCoding !== undefined && g.garmentCoding > 0))) {
          matchCount++;
        }
      }
      const matchRatio = garmentsWithCoding.length > 0 ? matchCount / garmentsWithCoding.length : 0.5;
      // Soft affinity between 0.5 and 0.8 (bounded soft influence, capped <= 0.15 net score difference)
      const exprAffinityScore = 0.5 + Math.min(0.3, matchRatio * 0.3);
      factors.push({
        category: 'expression_affinity',
        weight: 1.0,
        score: exprAffinityScore,
        reason: `Soft expression alignment with ${expr} presentation preference.`,
      });
    }

    const { finalScore } = computeWeightedScore(factors);

    // Build traceable reasons connecting directly to real signals and knowledge IDs
    const traceableReasons: TraceableReason[] = [];
    const uniqueReasons = Array.from(new Set(reasons)).slice(0, 3);

    for (let i = 0; i < uniqueReasons.length; i++) {
      const reasonText = uniqueReasons[i];
      let factorName = 'general';
      const signalIds: string[] = [];
      const knowledgeEntryIds: string[] = outfit.items.map((it) => it.garment.id);

      if (reasonText.includes('style axis') || reasonText.includes('coordinates')) {
        factorName = 'style_affinity';
        signalIds.push('user.styleProfile.styleVector', 'user.styleProfile.preferences.preferredStyleSlugs');
        if (styleFamily) knowledgeEntryIds.push(styleFamily.id);
      } else if (reasonText.includes('silhouette') || reasonText.includes('proportions') || reasonText.includes('structure') || reasonText.includes('balance') || reasonText.includes('drape') || reasonText.includes('frame')) {
        factorName = 'silhouette_balance';
        signalIds.push('user.styleProfile.preferences.fitProportions', 'user.styleProfile.preferences.preferredFits');
      } else if (reasonText.includes('color') || reasonText.includes('monochrome') || reasonText.includes('undertone')) {
        factorName = 'color_harmony';
        signalIds.push('user.styleProfile.preferences.userConfirmedUndertone', 'user.styleProfile.preferences.preferredColors');
      } else if (reasonText.includes('formality') || reasonText.includes('occasion') || (context?.occasion && reasonText.includes(context.occasion.name))) {
        factorName = 'occasion_fit';
        signalIds.push('context.occasion', 'context.targetFormality');
        if (context?.occasion) knowledgeEntryIds.push(context.occasion.id);
      } else if (reasonText.includes('temperature') || reasonText.includes('climate') || reasonText.includes('breathability') || reasonText.includes('heat') || reasonText.includes('cold')) {
        factorName = 'weather_fit';
        signalIds.push('context.temperatureLevel', 'context.condition', 'context.weather');
      } else if (reasonText.includes('wardrobe')) {
        factorName = 'wardrobe_priority';
        signalIds.push('user.wardrobe');
      }

      const isAssumed = reasonText.includes('neutral-safe default') || reasonText.includes('unknown');

      traceableReasons.push({
        reasonId: `rea_${outfit.id}_${i}_${Date.now()}`,
        text: reasonText,
        signalIds,
        knowledgeEntryIds,
        factor: factorName,
        authority: isAssumed ? 'DEFAULT' : 'USER_ENTERED',
        isAssumed,
      });
    }

    return {
      outfit,
      totalScore: finalScore,
      factors,
      reasons: uniqueReasons,
      traceableReasons,
      cautions: Array.from(new Set(cautions)),
      stylingAdvice: Array.from(new Set(stylingAdvice)),
      styleVector: outfitVector,
      styleAffinity,
      isOwnedWardrobeMatch,
    };
  }

  /**
   * STEP 3: Diversity Selection for Top 3 (SAFE, BEST MATCH, STRETCH)
   * With soft relaxation tracking (F-08)
   */
  private static selectDiverseTopThree(
    ranked: CandidateEvaluation[],
    userVector: StyleVector
  ): {
    safeCandidate?: CandidateEvaluation;
    bestMatchCandidate?: CandidateEvaluation;
    stretchCandidate?: CandidateEvaluation;
    relaxedSteps: string[];
  } {
    const relaxedSteps: string[] = [];
    if (ranked.length === 0) {
      return { relaxedSteps };
    }

    // 1. BEST MATCH: The highest composite scoring candidate passing hard filters
    const bestMatchCandidate = ranked[0];

    // If only 1 candidate exists total, return it honestly without fabricating looks
    if (ranked.length === 1) {
      return {
        bestMatchCandidate,
        relaxedSteps,
      };
    }

    // 2. SAFE: Highly familiar, high wardrobe alignment or timeless classic, lowest distance from core
    let safeCandidates = ranked.filter(
      (c) =>
        c.outfit.id !== bestMatchCandidate.outfit.id &&
        (c.isOwnedWardrobeMatch || c.styleAffinity >= 0.75 || c.outfit.primaryStyleSlug === 'minimal' || c.outfit.primaryStyleSlug === 'smart-casual')
    );

    let safeCandidate: CandidateEvaluation | undefined = safeCandidates[0];
    if (!safeCandidate && ranked.length > 1) {
      // Step 2 Relaxation: Relax secondary archetype affinity requirement
      relaxedSteps.push('Relaxed secondary archetype affinity requirement for Safe look candidate.');
      safeCandidate = ranked.find((c) => c.outfit.id !== bestMatchCandidate.outfit.id);
    }

    // If only 2 candidates exist total, return them honestly
    if (ranked.length === 2) {
      return {
        safeCandidate,
        bestMatchCandidate,
        relaxedSteps,
      };
    }

    // 3. STRETCH: Meaningfully distinct! Shifts on volume/structure or adjacent aesthetic
    let stretchCandidates = ranked.filter(
      (c) =>
        c.outfit.id !== bestMatchCandidate.outfit.id &&
        (!safeCandidate || c.outfit.id !== safeCandidate.outfit.id) &&
        c.outfit.primaryStyleSlug !== bestMatchCandidate.outfit.primaryStyleSlug
    );

    let stretchCandidate: CandidateEvaluation | undefined = stretchCandidates[0];
    if (!stretchCandidate) {
      // Step 1 Relaxation: Relax stretch distance / distinct aesthetic requirement
      relaxedSteps.push('Relaxed stretch distance requirement: selected distinct volume/cut within available aesthetic pool.');
      stretchCandidate = ranked.find(
        (c) => c.outfit.id !== bestMatchCandidate.outfit.id && (!safeCandidate || c.outfit.id !== safeCandidate.outfit.id)
      );
    }

    return {
      safeCandidate,
      bestMatchCandidate,
      stretchCandidate,
      relaxedSteps,
    };
  }

  /**
   * Confidence Level Calculator
   */
  private static determineConfidence(
    user: User,
    context?: Context,
    evaluation?: CandidateEvaluation
  ): { state: ConfidenceState; explanation: string; toIncreaseConfidence?: string } {
    const hasVisual = !!user.visualProfile;
    const hasPreferences = user.styleProfile.preferences.preferredStyleSlugs.length > 0;
    const hasWeather = !!context?.weather || !!context?.temperatureCelsius;
    const isWeatherConfirmed = context?.isWeatherConfirmed ?? false;

    // Condition 1: Missing basic context or style preferences -> NEED_MORE_INFO
    if (!context || (!hasPreferences && !hasVisual)) {
      return {
        state: 'NEED_MORE_INFO',
        explanation: 'Limited input signals available for context and personal taste.',
        toIncreaseConfidence: 'Complete the taste quiz or specify your preferred fits to unlock tailored accuracy.',
      };
    }

    // Condition 2: High evidence (confirmed weather, preferences, visual scan) -> STRONG
    if (hasPreferences && hasVisual && isWeatherConfirmed && evaluation && evaluation.totalScore >= 0.82) {
      return {
        state: 'STRONG',
        explanation: 'Supported by verified user preferences, observed physical features, and confirmed climate.',
      };
    }

    // Condition 3: Good evidence, minor unknowns -> GOOD
    if (hasPreferences && context) {
      const prompt = !isWeatherConfirmed
        ? 'Confirm local temperature to fine-tune fabric breathability and layering weight.'
        : 'Specify whether you prefer structured or relaxed shirts to refine top volumes.';
      return {
        state: 'GOOD',
        explanation: 'Solid alignment with occasion guidelines and stated aesthetic direction.',
        toIncreaseConfidence: prompt,
      };
    }

    // Default to EXPLORATORY
    return {
      state: 'EXPLORATORY',
      explanation: 'Curated directional proposal based on baseline styling principles.',
      toIncreaseConfidence: 'Tell VAEL your footwear preferences to ground the silhouette.',
    };
  }

  /**
   * Builds CompleteLook bundle
   */
  private static buildCompleteLook(
    tier: RecommendationTier,
    evaluation: CandidateEvaluation,
    user: User,
    context?: Context,
    hair?: Recommendation<HairStyle>,
    grooming?: Recommendation<BeardStyle>
  ): CompleteLook {
    const confidence = this.determineConfidence(user, context, evaluation);

    let tierRationale = '';
    if (tier === 'SAFE') {
      tierRationale = 'High familiarity and effortless ease. Relies on proven proportions and classic foundational tones.';
    } else if (tier === 'BEST_MATCH') {
      tierRationale = 'Optimal convergence of your 10D style vector, event formality, and physical proportions.';
    } else {
      tierRationale = 'Curated directional exploration. Pushes volume and textural depth while strictly respecting dress codes.';
    }

    const outfitRec: Recommendation<Outfit> = {
      id: `rec_outfit_${evaluation.outfit.id}_${Date.now()}`,
      item: evaluation.outfit,
      score: evaluation.totalScore,
      factors: evaluation.factors,
      reasons: evaluation.reasons,
      traceableReasons: evaluation.traceableReasons,
      cautions: evaluation.cautions.length > 0 ? evaluation.cautions : undefined,
      stylingAdvice: evaluation.stylingAdvice,
      confidence,
      tier,
      generatedAt: new Date().toISOString(),
    };

    return {
      id: `look_${tier.toLowerCase()}_${Date.now()}`,
      tier,
      tierRationale,
      outfit: outfitRec,
      hairStyle: hair,
      groomingStyle: grooming,
      confidence,
      overallHarmonyScore: evaluation.totalScore,
      reasons: evaluation.reasons,
      traceableReasons: evaluation.traceableReasons,
      cautions: evaluation.cautions,
    };
  }

  /**
   * Helper: Hair matching
   */
  private static getBestHair(user: User, context?: Context, styleSlug?: string): Recommendation<HairStyle> | undefined {
    const allHair = knowledgeBase.getAllHairstyles();
    const ranked = allHair.map((h) =>
      HairCompatibilityEvaluator.evaluate(h, {
        visual: user.visualProfile,
        context,
        preferences: user.styleProfile.preferences,
        feedback: user.styleProfile.feedbackProfile,
      })
    );
    ranked.sort((a, b) => b.score - a.score);
    return ranked[0];
  }

  /**
   * Helper: Grooming matching
   */
  private static getBestGrooming(user: User, context?: Context, styleSlug?: string): Recommendation<BeardStyle> | undefined {
    const allBeards = knowledgeBase.getAllBeards();
    const ranked = allBeards.map((b) =>
      GroomingCompatibilityEvaluator.evaluate(b, {
        visual: user.visualProfile,
        context,
        preferences: user.styleProfile.preferences,
        feedback: user.styleProfile.feedbackProfile,
      })
    );
    ranked.sort((a, b) => b.score - a.score);
    return ranked[0];
  }

  /**
   * Dynamic candidate outfit generator from fashion knowledge base
   */
  private static buildCandidateOutfits(user: User): Outfit[] {
    const outfits: Outfit[] = [];

    // Outfit 1: Korean Minimal - Fluid Double Pleat
    const top1 = knowledgeBase.getGarmentBySlug('heavyweight-boxy-tee-offwhite') || knowledgeBase.getAllGarments()[0];
    const bot1 = knowledgeBase.getGarmentBySlug('wide-pleated-trousers-black') || knowledgeBase.getAllGarments()[1];
    const outer1 = knowledgeBase.getGarmentBySlug('deconstructed-blazer-charcoal');
    const shoes1 = knowledgeBase.getGarmentBySlug('chunky-derbies-black') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_korean_minimal_01',
      title: 'Monochrome Fluid Tailoring',
      description: 'Dropped-shoulder boxy tee anchored inside double-pleated wool trousers and chunky derbies.',
      items: [
        { garment: top1, layerPosition: 0, stylingNote: 'Tuck loosely into high-rise waistband' },
        ...(outer1 ? [{ garment: outer1, layerPosition: 1, stylingNote: 'Leave unbuttoned for architectural drape' }] : []),
        { garment: bot1, layerPosition: 0, stylingNote: 'Allow soft break over vamp' },
        { garment: shoes1, layerPosition: 0 },
      ],
      primaryStyleSlug: 'korean-minimal',
      formality: 3,
      compatibleOccasions: ['dinner', 'office', 'date', 'social'],
      seasonality: ['spring', 'fall', 'all-season'],
      silhouetteBalance: 'Oversized top drape balanced with wide structured floor break',
      colorStory: 'High-contrast monochrome: off-white focal against deep charcoal and pitch-black',
    });

    // Outfit 2: Smart Casual - Knit Polo & Tailored Slacks
    const top2 = knowledgeBase.getGarmentBySlug('knit-polo-olive') || knowledgeBase.getAllGarments()[3];
    const bot2 = knowledgeBase.getGarmentBySlug('tailored-slacks-charcoal') || knowledgeBase.getAllGarments()[4];
    const shoes2 = knowledgeBase.getGarmentBySlug('penny-loafer-burgundy') || knowledgeBase.getAllGarments()[5];
    outfits.push({
      id: 'outfit_smart_casual_01',
      title: 'Textured Knit & Tailored Line',
      description: 'Silk-cotton open-collar knit polo paired with crisp flat-front charcoal wool slacks and cordovan loafers.',
      items: [
        { garment: top2, layerPosition: 0, stylingNote: 'Clean un-tucked drape at beltline' },
        { garment: bot2, layerPosition: 0, stylingNote: 'No-break clean ankle line' },
        { garment: shoes2, layerPosition: 0 },
      ],
      primaryStyleSlug: 'smart-casual',
      formality: 3,
      compatibleOccasions: ['office', 'date', 'dinner'],
      seasonality: ['spring', 'summer', 'fall'],
      silhouetteBalance: 'Balanced regular top with streamlined tailored lower foundation',
      colorStory: 'Earth tone olive anchored by deep charcoal and burgundy foot accent',
    });

    // Outfit 3: Workwear - Heavy Canvas & Selvedge Denim
    const top3 = knowledgeBase.getGarmentBySlug('waffle-thermal-cream') || knowledgeBase.getAllGarments()[0];
    const bot3 = knowledgeBase.getGarmentBySlug('selvedge-denim-raw-indigo') || knowledgeBase.getAllGarments()[1];
    const outer3 = knowledgeBase.getGarmentBySlug('chore-coat-duck-tan');
    const shoes3 = knowledgeBase.getGarmentBySlug('service-boots-brown') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_workwear_01',
      title: 'Heritage Duck Canvas & Indigo',
      description: '12oz ringspun duck chore coat over waffle thermal, raw Japanese selvedge denim, and service boots.',
      items: [
        { garment: top3, layerPosition: 0 },
        ...(outer3 ? [{ garment: outer3, layerPosition: 1, stylingNote: 'Button center buttons only' }] : []),
        { garment: bot3, layerPosition: 0, stylingNote: 'Cuff hem 1.5 inches to reveal selvedge ID' },
        { garment: shoes3, layerPosition: 0 },
      ],
      primaryStyleSlug: 'workwear',
      formality: 2,
      compatibleOccasions: ['casual', 'university-college', 'travel'],
      seasonality: ['spring', 'fall', 'winter'],
      silhouetteBalance: 'Straight-rugged cadence with heavy tactile structure',
      colorStory: 'Tonal canvas tan, cream, and deep indigo',
    });

    // Outfit 4: Minimal - All-Black Architectural
    const top4 = knowledgeBase.getGarmentBySlug('mockneck-black') || knowledgeBase.getAllGarments()[0];
    const bot4 = knowledgeBase.getGarmentBySlug('cropped-ankle-trousers-black') || knowledgeBase.getAllGarments()[1];
    const shoes4 = knowledgeBase.getGarmentBySlug('minimal-leather-sneaker-white') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_minimal_01',
      title: 'All-Black Architectural Column',
      description: 'Compact modal-wool ribbed mock neck tucked into ankle-cropped wool slacks with white cupsole sneaker contrast.',
      items: [
        { garment: top4, layerPosition: 0, stylingNote: 'Tuck tightly into trousers' },
        { garment: bot4, layerPosition: 0, stylingNote: 'Clean ankle crop' },
        { garment: shoes4, layerPosition: 0, stylingNote: 'Stark white geometric accent' },
      ],
      primaryStyleSlug: 'minimal',
      formality: 3,
      compatibleOccasions: ['office', 'dinner', 'social'],
      seasonality: ['all-season'],
      silhouetteBalance: 'Linear column with ankle crop',
      colorStory: 'Stark black-and-white polarity',
    });

    // Outfit 5: Old Money - Cashmere & Pleats
    const top5 = knowledgeBase.getGarmentBySlug('rollneck-merino-camel') || knowledgeBase.getAllGarments()[0];
    const bot5 = knowledgeBase.getGarmentBySlug('flannel-slacks-light-grey') || knowledgeBase.getAllGarments()[1];
    const outer5 = knowledgeBase.getGarmentBySlug('harris-tweed-blazer-brown');
    const shoes5 = knowledgeBase.getGarmentBySlug('horsebit-loafer-black') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_old_money_01',
      title: 'Harris Tweed & Cashmere Poise',
      description: 'Heather brown tweed blazer over camel merino rollneck with light grey flannel trousers.',
      items: [
        { garment: top5, layerPosition: 0 },
        ...(outer5 ? [{ garment: outer5, layerPosition: 1 }] : []),
        { garment: bot5, layerPosition: 0 },
        { garment: shoes5, layerPosition: 0 },
      ],
      primaryStyleSlug: 'old-money',
      formality: 4,
      compatibleOccasions: ['dinner', 'wedding-guest', 'job-interview'],
      seasonality: ['fall', 'winter'],
      silhouetteBalance: 'Traditional tailored structure with rich textural depth',
      colorStory: 'Harmonious warm camel, heather brown, and light grey flannel',
    });

    // Outfit 6: High Summer Linen - Extreme Heat Compatible
    const top6 = knowledgeBase.getGarmentBySlug('slub-linen-tee-natural') || knowledgeBase.getAllGarments()[0];
    const bot6 = knowledgeBase.getGarmentBySlug('linen-trousers-ecru') || knowledgeBase.getAllGarments()[1];
    const shoes6 = knowledgeBase.getGarmentBySlug('suede-espadrilles-sand') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_summer_linen_01',
      title: 'Breezy Natural Linen Flow',
      description: 'Belgian slub linen tee paired with airy drawstring linen trousers and jute-sole espadrilles.',
      items: [
        { garment: top6, layerPosition: 0 },
        { garment: bot6, layerPosition: 0, stylingNote: 'Loose airy hang over ankles' },
        { garment: shoes6, layerPosition: 0 },
      ],
      primaryStyleSlug: 'korean-minimal',
      formality: 2,
      compatibleOccasions: ['casual', 'travel', 'social'],
      seasonality: ['summer'],
      silhouetteBalance: 'Fluid drape with high natural breathability',
      colorStory: 'Tonal neutrals: natural flax, ecru, and sand',
    });

    // Outfit 7: Formal Ceremony / Gala
    const top7 = knowledgeBase.getGarmentBySlug('marcella-bib-tuxedo-shirt') || knowledgeBase.getAllGarments()[0];
    const bot7 = knowledgeBase.getGarmentBySlug('barathea-tuxedo-trousers') || knowledgeBase.getAllGarments()[1];
    const outer7 = knowledgeBase.getGarmentBySlug('dinner-jacket-midnight-navy');
    const shoes7 = knowledgeBase.getGarmentBySlug('patent-evening-slippers-black') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_formal_ceremony_01',
      title: 'Midnight Navy Dinner Tuxedo',
      description: 'Canvassed Barathea wool dinner jacket with grosgrain lapels, marcella bib shirt, and patent evening slippers.',
      items: [
        { garment: top7, layerPosition: 0 },
        ...(outer7 ? [{ garment: outer7, layerPosition: 1 }] : []),
        { garment: bot7, layerPosition: 0 },
        { garment: shoes7, layerPosition: 0 },
      ],
      primaryStyleSlug: 'formal',
      formality: 5,
      compatibleOccasions: ['wedding-guest', 'job-interview'],
      seasonality: ['all-season'],
      silhouetteBalance: 'Impeccable architectural tailoring with sculpted waistline',
      colorStory: 'Midnight navy and pure white with high-gloss patent black',
    });

    // Outfit 8: Cultural / Traditional Event
    const top8 = knowledgeBase.getGarmentBySlug('linen-kurta-tunic-ecru') || knowledgeBase.getAllGarments()[0];
    const bot8 = knowledgeBase.getGarmentBySlug('khadi-cotton-trousers-white') || knowledgeBase.getAllGarments()[1];
    const outer8 = knowledgeBase.getGarmentBySlug('raw-silk-bandhgala-black');
    const shoes8 = knowledgeBase.getGarmentBySlug('penny-loafer-burgundy') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_cultural_traditional_01',
      title: 'Heritage Raw Silk & Linen Ceremony Look',
      description: 'Bespoke Matka raw silk bandhgala jacket layered over handloom linen tunic and clean khadi trousers.',
      items: [
        { garment: top8, layerPosition: 0 },
        ...(outer8 ? [{ garment: outer8, layerPosition: 1 }] : []),
        { garment: bot8, layerPosition: 0 },
        { garment: shoes8, layerPosition: 0 },
      ],
      primaryStyleSlug: 'formal',
      formality: 5,
      compatibleOccasions: ['cultural-traditional', 'wedding-guest'],
      seasonality: ['all-season'],
      silhouetteBalance: 'Longline vertical dignity with clean structured collar line',
      colorStory: 'Raw silk black outer framing ivory and ecru organic layers',
    });

    // Outfit 9: R1 Feminine Minimal Tailored Evening Look
    const dress9 = knowledgeBase.getGarmentBySlug('bias-cut-silk-slip-dress-black');
    const outer9 = knowledgeBase.getGarmentBySlug('hourglass-tailored-blazer-black');
    const shoes9 = knowledgeBase.getGarmentBySlug('pointed-slingback-pumps-black');
    const bag9 = knowledgeBase.getGarmentBySlug('sculpted-leather-shoulder-bag-black');
    const earrings9 = knowledgeBase.getGarmentBySlug('chunky-gold-hoop-earrings-18k');
    if (dress9 && shoes9) {
      outfits.push({
        id: 'outfit_feminine_slip_evening_01',
        title: 'Sculpted Hourglass & Silk Slip Monolith',
        description: 'Fluid bias-cut silk charmeuse column balanced by razor-sharp hourglass tailoring, pointed slingbacks, and warm gold accents.',
        items: [
          { garment: dress9, layerPosition: 0, stylingNote: 'Continuous fluid column beneath tailored frame' },
          ...(outer9 ? [{ garment: outer9, layerPosition: 1, stylingNote: 'Sculpted waist definition with open front' }] : []),
          { garment: shoes9, layerPosition: 0, stylingNote: 'Elongated toe line' },
          ...(bag9 ? [{ garment: bag9, layerPosition: 0, stylingNote: 'Underarm architectural carry' }] : []),
          ...(earrings9 ? [{ garment: earrings9, layerPosition: 0, stylingNote: 'Subtle warm gold illumination' }] : []),
        ],
        primaryStyleSlug: 'minimal',
        formality: 4,
        compatibleOccasions: ['dinner', 'date', 'social', 'wedding-guest'],
        seasonality: ['all-season', 'spring', 'fall'],
        silhouetteBalance: 'Cinched architectural waist framing a liquid bias-cut silk column',
        colorStory: 'Monochromatic obsidian black enriched with 18k gold vermeil hardware',
      });
    }

    // Outfit 10: R1 Smart Casual / Workplace Shirt Dress
    const dress10 = knowledgeBase.getGarmentBySlug('architectural-poplin-shirt-dress-white');
    const shoes10 = knowledgeBase.getGarmentBySlug('unstructured-leather-ballet-flats-black');
    const belt10 = knowledgeBase.getGarmentBySlug('fine-calfskin-belt-gold-buckle-black');
    const sunglasses10 = knowledgeBase.getGarmentBySlug('cat-eye-acetate-sunglasses-black');
    if (dress10 && shoes10) {
      outfits.push({
        id: 'outfit_poplin_shirt_dress_01',
        title: 'Architectural Poplin & Glove Leather Cadence',
        description: 'High-density crisp cotton poplin midi shirt dress cinched with fine calfskin, grounded with minimalist glove-leather ballet flats.',
        items: [
          { garment: dress10, layerPosition: 0, stylingNote: 'Sharp collar spread, rolled sleeves' },
          { garment: shoes10, layerPosition: 0, stylingNote: 'Unstructured flat grounding' },
          ...(belt10 ? [{ garment: belt10, layerPosition: 0, stylingNote: 'Define waistline architecture' }] : []),
          ...(sunglasses10 ? [{ garment: sunglasses10, layerPosition: 0, stylingNote: 'Beveled geometric uplift' }] : []),
        ],
        primaryStyleSlug: 'smart-casual',
        formality: 3,
        compatibleOccasions: ['office', 'casual', 'social', 'travel'],
        seasonality: ['spring', 'summer', 'fall'],
        silhouetteBalance: 'Volumetric crisp pleated shirt skirt grounded with sleek ballet flats',
        colorStory: 'Stark optic white anchored by fine black calfskin and brass hardware',
      });
    }

    // Outfit 11: R1 Pleated Midi Skirt & Draped Blouse (Classic / Dark Academia / Smart Casual)
    const top11 = knowledgeBase.getGarmentBySlug('asymmetric-draped-wrap-blouse-ecru');
    const skirt11 = knowledgeBase.getGarmentBySlug('knife-pleated-midi-skirt-navy');
    const boots11 = knowledgeBase.getGarmentBySlug('straight-shaft-riding-boots-brown');
    const scarf11 = knowledgeBase.getGarmentBySlug('printed-silk-twill-scarf-70cm');
    if (top11 && skirt11 && boots11) {
      outfits.push({
        id: 'outfit_pleated_skirt_riding_boot_01',
        title: 'Pleated Wool Gabardine & Tuscan Leather',
        description: 'Fluid ecru wrap blouse tucked into knife-pleated midnight navy wool gabardine, grounded by tall straight-shaft riding boots.',
        items: [
          { garment: top11, layerPosition: 0, stylingNote: 'Tucked cleanly into waistband' },
          { garment: skirt11, layerPosition: 0, stylingNote: 'Sharp knife pleats breaking over boot tops' },
          { garment: boots11, layerPosition: 0, stylingNote: 'Seamless vertical lower leg line' },
          ...(scarf11 ? [{ garment: scarf11, layerPosition: 0, stylingNote: 'Tied close at neck for heritage poise' }] : []),
        ],
        primaryStyleSlug: 'old-money',
        formality: 3,
        compatibleOccasions: ['office', 'dinner', 'job-interview', 'social'],
        seasonality: ['fall', 'winter', 'spring'],
        silhouetteBalance: 'Draped surplice blouse anchored by structured pleated A-line and tall boots',
        colorStory: 'Ecru and midnight navy grounded by cognac Tuscan leather and silk twill',
      });
    }

    // Outfit 12: R1 All-Weather Wet/Cold Transit Ensemble
    const top12 = knowledgeBase.getGarmentBySlug('merino-crewneck-heather-grey') || knowledgeBase.getAllGarments()[0];
    const bot12 = knowledgeBase.getGarmentBySlug('selvedge-denim-raw-indigo') || knowledgeBase.getAllGarments()[1];
    const shoes12 = knowledgeBase.getGarmentBySlug('waterproof-lug-sole-chelsea-boots-black');
    const outer12 = knowledgeBase.getGarmentBySlug('waterproof-commuter-parka-black');
    if (shoes12) {
      outfits.push({
        id: 'outfit_waterproof_cold_transit_01',
        title: 'Lug-Sole Waterproof Urban Transit',
        description: 'Dense merino knit and heavy selvedge denim shielded by a waterproof commuter parka and Vibram lug-sole chelseas.',
        items: [
          { garment: top12, layerPosition: 0 },
          ...(outer12 ? [{ garment: outer12, layerPosition: 1, stylingNote: 'Fully zipped for moisture barrier' }] : []),
          { garment: bot12, layerPosition: 0, stylingNote: 'Slight roll above boot collar' },
          { garment: shoes12, layerPosition: 0, stylingNote: 'Waterproof cleated traction' },
        ],
        primaryStyleSlug: 'techwear',
        formality: 2,
        compatibleOccasions: ['casual', 'travel', 'office'],
        seasonality: ['fall', 'winter', 'spring'],
        silhouetteBalance: 'Shielded straight utility with solid high-traction base',
        colorStory: 'Matte black, heather grey, and deep raw indigo',
      });
    }

    return outfits;
  }
}
