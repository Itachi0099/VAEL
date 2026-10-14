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

    const vetoReasons = new Set<string>();
    for (const outfit of candidates) {
      const vetoResult = this.applyHardFilters(outfit, user, context);
      if (vetoResult.vetoed) {
        vetoedCount++;
        if (vetoResult.reason) vetoReasons.add(vetoResult.reason);
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
      userVector,
      user.styleProfile.preferences
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
      looksCountExplanation = `No outfits satisfy constraints: ${Array.from(vetoReasons).join('; ') || 'strict criteria'}.`;
    } else if (looks.length < 3) {
      const reasonList = Array.from(vetoReasons).join('; ');
      looksCountExplanation = `Returned ${looks.length} viable look${looks.length === 1 ? '' : 's'}. Remaining candidates were constrained by: ${reasonList || 'climate, dress code, or modesty'}.`;
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

    // 8. Coordinated Top & Bottom Matching Rule (No accidental same-fabric/same-pattern without suit or co-ord tag)
    const isDesignatedCoordOrSuit = outfit.suitTag || outfit.coOrdTag || garments.some((g) => g.suitTag || g.coOrdTag);
    if (!isDesignatedCoordOrSuit) {
      const topGarment = garments.find((g) => g.category === 'top');
      const bottomGarment = garments.find((g) => g.category === 'bottom');
      if (topGarment && bottomGarment) {
        const topMat = topGarment.material.toLowerCase();
        const botMat = bottomGarment.material.toLowerCase();
        const topPat = topGarment.pattern;
        const botPat = bottomGarment.pattern;

        const distinctiveFabrics = ['seersucker', 'corduroy', 'velvet', 'tweed', 'flannel', 'terry', 'organza', 'tulle'];
        const matchesDistinctiveFabric = distinctiveFabrics.some((f) => topMat.includes(f) && botMat.includes(f));
        const matchesPattern = topPat !== 'solid' && topPat === botPat;

        if (matchesDistinctiveFabric || matchesPattern) {
          return {
            vetoed: true,
            reason: `Matching same-fabric (${topGarment.material}) or same-pattern (${topPat}) separates require designated suit or co-ord status.`,
          };
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
        reasons.push(`Aligned to ${context.occasion.name} formality.`);
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

    // 8. Metal Tone Accessory Coherence (Weight: tuned to 0.05 / 0.35 for exact 0.05 overall score delta)
    const metalTones = garments
      .map((g) => g.metalTone)
      .filter((m): m is 'silver' | 'gold' | 'brass' | 'blackened' | 'mixed' => !!m);
    if (metalTones.length > 1) {
      const uniqueMetals = Array.from(new Set(metalTones));
      const hasClash = uniqueMetals.includes('silver') && (uniqueMetals.includes('gold') || uniqueMetals.includes('brass'));
      factors.push({
        category: 'accessory_coherence',
        weight: 0.05 / 0.35,
        score: hasClash ? 0.6 : 0.95,
        reason: hasClash ? 'Mixed metal accents create visual tension.' : 'Harmonious metal hardware tones across accessories.',
      });
      if (hasClash) {
        cautions.push('Mixed silver and gold metal tones in accessories.');
      }
    }

    // 8b. Vintage Era Match Boost (Weight: 0.5)
    if (preferences.vintageEra && preferences.vintageEra !== 'unspecified') {
      const era = preferences.vintageEra;
      const hasMatchingVintage = garments.some(
        (g) => g.vintageEra === era || (g.name && g.name.includes(era)) || (g.slug && g.slug.includes(era))
      );
      if (hasMatchingVintage) {
        factors.push({
          category: 'preference_reinforcement',
          weight: 0.5,
          score: 0.95,
          reason: `Features curated ${era} vintage pieces matching your era preference.`,
        });
        reasons.push(`Features authentic ${era} vintage era silhouettes.`);
      }
    }

    // 9. Budget Tier Fit (Weight: 0.5, only when budget input is specified)
    if (preferences.budgetTier && preferences.budgetTier !== 'unspecified') {
      const targetBudget = preferences.budgetTier;
      const budgetGarments = garments.filter((g) => g.budgetTier !== undefined);
      if (budgetGarments.length > 0) {
        const matches = budgetGarments.filter((g) => g.budgetTier === targetBudget).length;
        const budgetRatio = matches / budgetGarments.length;
        factors.push({
          category: 'preference_reinforcement',
          weight: 0.5,
          score: 0.6 + budgetRatio * 0.35,
          reason: `Aligned to your stated ${targetBudget} investment tier.`,
        });
      }
    }

    // 10. Contrast Alignment (Weight: 0.5)
    // Contrast: prefer outfit value-contrast within one step of user's level (low/medium/high)
    if (preferences.contrastLevel && preferences.contrastLevel !== 'unspecified') {
      const userLevel = preferences.contrastLevel;
      const contrastStepMap: Record<'low' | 'medium' | 'high', number> = { low: 1, medium: 2, high: 3 };
      const userStep = contrastStepMap[userLevel];

      // Determine outfit value-contrast: check light vs deep colors
      const hasLight = garments.some((g) => g.color.name.includes('white') || g.color.name.includes('cream') || g.color.name.includes('ecru') || g.color.name.includes('natural'));
      const hasDeep = garments.some((g) => g.color.name.includes('black') || g.color.name.includes('charcoal') || g.color.name.includes('navy') || g.color.name.includes('dark'));
      const outfitContrastStep = (hasLight && hasDeep) ? 3 : (hasLight || hasDeep ? 2 : 1);
      const diff = Math.abs(userStep - outfitContrastStep);

      const contrastScore = diff <= 1 ? 0.95 : 0.65;
      factors.push({
        category: 'preference_reinforcement',
        weight: 0.5,
        score: contrastScore,
        reason: `Echoes your natural ${userLevel} contrast level across outfit tones.`,
      });
      if (diff <= 1) {
        reasons.push(`Echoes your ${userLevel} contrast range with balanced value separation.`);
      }
    }

    // 11. Skin Depth & Undertone Face-Adjacent Harmony (Weight: 0.5)
    // Warm -> warm neutrals/earths/olive/camel/cream; cool -> navy/charcoal/cool grey/true white/cool jewel tones; neutral/olive -> broad.
    // Garment nearest face avoids near-skin value unless user's contrast is low.
    if (
      (preferences.skinDepth && preferences.skinDepth !== 'unspecified') ||
      (preferences.userConfirmedUndertone && preferences.userConfirmedUndertone !== 'unspecified')
    ) {
      const undertone = preferences.userConfirmedUndertone;
      const skinDepth = preferences.skinDepth;
      const facePiece = garments.find((g) => g.category === 'top' || g.category === 'one-piece') || garments[0];

      let faceTonalScore = 0.85;
      if (undertone === 'warm') {
        const warmPalette = ['cream', 'ecru', 'camel', 'olive', 'tan', 'sand', 'terracotta', 'brown', 'earth'];
        const matchesWarm = garments.some((g) => warmPalette.some((w) => g.color.name.toLowerCase().includes(w) || g.color.tone === 'warm' || g.color.tone === 'earth'));
        if (matchesWarm) faceTonalScore = 0.95;
      } else if (undertone === 'cool') {
        const coolPalette = ['navy', 'charcoal', 'grey', 'gray', 'white', 'slate', 'blue', 'emerald'];
        const matchesCool = garments.some((g) => coolPalette.some((c) => g.color.name.toLowerCase().includes(c) || g.color.tone === 'cool'));
        if (matchesCool) faceTonalScore = 0.95;
      } else {
        faceTonalScore = 0.90;
      }

      factors.push({
        category: 'preference_reinforcement',
        weight: 0.5,
        score: faceTonalScore,
        reason: 'Echoes complexion undertone with balanced face-framing values.',
      });
      if (faceTonalScore >= 0.9) {
        reasons.push('Echoes your undertone through face-adjacent tonal harmony.');
      }
    }

    // 12. Torso & Leg Proportion Balance (Weight: 0.5)
    // Longer torso -> mid/high-rise bottoms, shorter or cropped outer layers, tucked tops;
    // Longer legs -> low/mid rise and longer outer layers fine.
    if (preferences.torsoLegPreference && preferences.torsoLegPreference !== 'unspecified') {
      const torsoLeg = preferences.torsoLegPreference;
      let torsoLegScore = 0.85;
      const bot = bottom || onePiece;

      if (torsoLeg === 'longer-torso') {
        const hasElevatedWaist = bot && (bot.silhouette.includes('high-rise') || bot.silhouette.includes('pleat') || bot.fit === 'tailored');
        const hasShorterOuter = outer ? (outer.length === 'cropped' || outer.length === 'regular') : true;
        if (hasElevatedWaist || hasShorterOuter) {
          torsoLegScore = 0.95;
        }
      } else if (torsoLeg === 'longer-legs') {
        const hasDrapedLine = (outer && outer.length === 'extended') || (bot && (bot.fit === 'relaxed' || bot.fit === 'oversized' || bot.length === 'regular'));
        if (hasDrapedLine) {
          torsoLegScore = 0.95;
        }
      } else {
        torsoLegScore = 0.90;
      }

      factors.push({
        category: 'silhouette_balance',
        weight: 0.5,
        score: torsoLegScore,
        reason: 'Balances vertical proportions across upper and lower layers.',
      });
      reasons.push('Balances torso and leg proportions with calibrated waist placement.');
    }

    // 13. Shoulder & Hip Balance (Weight: 0.5)
    // Broader shoulders -> interest or volume toward hem, soft shoulder line;
    // Broader hips -> structure or interest toward shoulder; balanced -> no adjustment.
    if (preferences.shoulderHipBalance && preferences.shoulderHipBalance !== 'unspecified') {
      const shBalance = preferences.shoulderHipBalance;
      let shScore = 0.88;

      if (shBalance === 'broad-shoulders') {
        const hasHemVolume = bottom && (bottom.fit === 'relaxed' || bottom.fit === 'oversized' || bottom.silhouette.includes('wide'));
        const softShoulder = outer ? (outer.silhouette.includes('unstructured') || outer.silhouette.includes('soft') || outer.fit === 'relaxed') : true;
        if (hasHemVolume || softShoulder) {
          shScore = 0.95;
        }
      } else if (shBalance === 'wider-hips') {
        const hasShoulderStructure = outer ? (outer.structure >= 3 || outer.silhouette.includes('padded') || outer.fit === 'tailored') : (top && top.structure >= 3);
        if (hasShoulderStructure) {
          shScore = 0.95;
        }
      } else {
        shScore = 0.90;
      }

      factors.push({
        category: 'silhouette_balance',
        weight: 0.5,
        score: shScore,
        reason: 'Balances shoulder and hip geometry through intentional line and drape.',
      });
      reasons.push('Balances shoulder and hip frame with proportional structural weight.');
    }

    // 14. Height Range Vertical Line (Weight: 0.5)
    // Shorter -> continuous vertical line (tonal or matched top and bottom), outer layer not past mid-thigh unless chosen;
    // Taller -> longer layers and breaks fine.
    if (preferences.heightRange && preferences.heightRange !== 'unspecified') {
      const height = preferences.heightRange;
      let heightScore = 0.88;

      if (height === 'compact') {
        const isTonal = top && bottom && (top.color.tone === bottom.color.tone || top.color.name === bottom.color.name);
        const outerNotPastKnee = outer ? (outer.length !== 'extended') : true;
        if (isTonal || outerNotPastKnee) {
          heightScore = 0.95;
        }
      } else if (height === 'tall') {
        heightScore = 0.95; // Taller frames carry extended layers and breaks effortlessly
      } else {
        heightScore = 0.90;
      }

      factors.push({
        category: 'silhouette_balance',
        weight: 0.5,
        score: heightScore,
        reason: 'Keeps the line continuous across layered proportions.',
      });
      reasons.push('Keeps the line continuous and proportional to your height range.');
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

      if (signalIds.length === 0) {
        signalIds.push('user.styleProfile.preferences.preferredStyleSlugs', 'context.occasion');
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
    userVector: StyleVector,
    userPreferences?: PreferenceProfile
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

    const expr = userPreferences?.styleExpression || userPreferences?.genderCodingDirection;
    const isExprSpecified = expr && expr !== 'no-preference' && expr !== 'unspecified';

    const hasMatchingItem = (c: CandidateEvaluation): boolean => {
      if (!isExprSpecified) return true;
      const foundation = c.outfit.items.map((i) => i.garment).filter((g) => g.category !== 'accessory');
      if (foundation.length === 0) return true;
      const sumCoding = foundation.reduce((acc, g) => acc + (g.garmentCoding !== undefined ? g.garmentCoding : (g.genderCoding === 'masculine' ? -1 : g.genderCoding === 'feminine' ? 1 : 0)), 0);
      const meanCoding = sumCoding / foundation.length;
      const hasCuratedFluid = foundation.some((g) => g.fluidTag === true);

      if (expr === 'masculine') {
        return meanCoding <= -0.25;
      } else if (expr === 'feminine') {
        return meanCoding >= 0.25;
      } else if (expr === 'androgynous') {
        return Math.abs(meanCoding) <= 0.25 && hasCuratedFluid;
      }
      return true;
    };

    // 1. BEST MATCH: The highest composite scoring candidate passing hard filters (Experimental never SAFE/BEST unless selected)
    const isExperimentalSelected = userPreferences?.preferredStyleSlugs?.includes('experimental');
    let bestMatchCandidate: CandidateEvaluation | undefined;
    if (isExprSpecified) {
      bestMatchCandidate = ranked.find((c) => hasMatchingItem(c) && (isExperimentalSelected || c.outfit.primaryStyleSlug !== 'experimental'));
    }
    if (!bestMatchCandidate) {
      bestMatchCandidate = ranked[0];
      if (bestMatchCandidate && bestMatchCandidate.outfit.primaryStyleSlug === 'experimental' && !isExperimentalSelected) {
        const nonExp = ranked.find((c) => c.outfit.primaryStyleSlug !== 'experimental');
        if (nonExp) bestMatchCandidate = nonExp;
      }
    }

    // If only 1 candidate exists total, return it honestly without fabricating looks
    if (ranked.length === 1) {
      return {
        bestMatchCandidate,
        relaxedSteps,
      };
    }

    // 2. SAFE: Highly familiar, high wardrobe alignment or timeless classic, lowest distance from core
    // When expression is specified, prioritize expression-aligned safe candidates first
    let safeCandidates = ranked.filter(
      (c) =>
        c.outfit.id !== bestMatchCandidate.outfit.id &&
        c.outfit.primaryStyleSlug !== 'experimental' &&
        (c.isOwnedWardrobeMatch || c.styleAffinity >= 0.75 || c.outfit.primaryStyleSlug === 'smart-casual')
    );

    let safeCandidate: CandidateEvaluation | undefined;
    if (isExprSpecified) {
      safeCandidate =
        safeCandidates.find((c) => hasMatchingItem(c)) ||
        ranked.filter((c) => c.outfit.id !== bestMatchCandidate.outfit.id).find((c) => hasMatchingItem(c)) ||
        safeCandidates[0];
    } else {
      safeCandidate = safeCandidates[0];
    }

    if (!safeCandidate && ranked.length > 1) {
      // Step 2 Relaxation: Relax secondary archetype affinity requirement
      relaxedSteps.push('Relaxed secondary archetype affinity requirement for Safe look candidate.');
      const remainingCandidates = ranked.filter((c) => c.outfit.id !== bestMatchCandidate.outfit.id);
      if (isExprSpecified) {
        safeCandidate = remainingCandidates.find((c) => hasMatchingItem(c)) || remainingCandidates[0];
      } else {
        safeCandidate = remainingCandidates[0];
      }
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

    let stretchCandidate: CandidateEvaluation | undefined;
    if (isExprSpecified) {
      stretchCandidate =
        stretchCandidates.find((c) => hasMatchingItem(c)) ||
        ranked.filter((c) => c.outfit.id !== bestMatchCandidate.outfit.id && (!safeCandidate || c.outfit.id !== safeCandidate.outfit.id)).find((c) => hasMatchingItem(c)) ||
        stretchCandidates[0];
    } else {
      stretchCandidate = stretchCandidates[0];
    }

    if (!stretchCandidate) {
      // Step 1 Relaxation: Relax stretch distance / distinct aesthetic requirement
      relaxedSteps.push('Relaxed stretch distance requirement: selected distinct volume/cut within available aesthetic pool.');
      const pool = ranked.filter(
        (c) => c.outfit.id !== bestMatchCandidate.outfit.id && (!safeCandidate || c.outfit.id !== safeCandidate.outfit.id)
      );
      if (isExprSpecified) {
        stretchCandidate = pool.find((c) => hasMatchingItem(c)) || pool[0];
      } else {
        stretchCandidate = pool[0];
      }
    }

    return {
      safeCandidate,
      bestMatchCandidate,
      stretchCandidate,
      relaxedSteps,
    };
  }

  /**
   * Confidence Level Calculator (B2 Confidence Caps)
   *
   * STRONG requires:
   * 1. Formality input is user-sourced (context.targetFormality explicitly provided).
   * 2. Climate input is user-sourced (context.temperatureLevel / temperatureCelsius and condition, with isWeatherConfirmed true).
   * 3. Style vector input is user-sourced (preferredStyleSlugs specified or userVector explicitly set).
   * 4. Hair/grooming input is user-sourced (user.visualProfile or evidenceSignals.hairTexture present).
   *
   * Degradation Caps:
   * - 1 DEFAULT among the four core inputs caps confidence at GOOD.
   * - 2 or more DEFAULTS cap confidence at EXPLORATORY.
   * - Missing context entirely or no preferences and no visual yields NEED_MORE_INFO.
   *
   * Every look returns one concrete prompt for: "what would raise confidence".
   */
  private static determineConfidence(
    user: User,
    context?: Context,
    evaluation?: CandidateEvaluation
  ): { state: ConfidenceState; explanation: string; toIncreaseConfidence: string } {
    const hasVisual = !!user.visualProfile;
    const hasPreferences = user.styleProfile.preferences.preferredStyleSlugs && user.styleProfile.preferences.preferredStyleSlugs.length > 0;

    // Missing basic context or style preferences -> NEED_MORE_INFO
    if (!context || (!hasPreferences && !hasVisual)) {
      return {
        state: 'NEED_MORE_INFO',
        explanation: 'Limited input signals available for context and personal taste.',
        toIncreaseConfidence: 'Specify your event formality and style preferences to build your looks.',
      };
    }

    // Special case: Cultural Ceremony without tradition pack (E5, G-13)
    if (context.occasion?.category === 'cultural' || context.occasion?.slug === 'cultural-traditional') {
      return {
        state: 'EXPLORATORY',
        explanation: 'Limited cultural ceremony coverage: no tradition pack installed. Directional proposal with general guidance.',
        toIncreaseConfidence: 'Install a regional tradition pack (R1.3) or verify specific ceremonial customs with hosts.',
      };
    }

    // Evaluate authority of the core inputs:
    // 1. Formality: User-entered if targetFormality or isFormalityOverridden is defined; otherwise DEFAULT (occasion default assumed)
    const isFormalityUserSourced = context.targetFormality !== undefined || context.isFormalityOverridden === true;

    // 2. Climate: User-sourced if weather is confirmed and (temperatureCelsius, temperatureLevel, or weather) is provided
    const isClimateUserSourced =
      context.isWeatherConfirmed !== false &&
      (context.temperatureCelsius !== undefined || context.temperatureLevel !== undefined || context.weather !== undefined);

    // 3. Style Vector: User-sourced if user has explicit preferred style slugs or custom style vector
    const isStyleVectorUserSourced = hasPreferences || (user.styleProfile.dominantAestheticSlugs && user.styleProfile.dominantAestheticSlugs.length > 0);

    // 4. Hair / Grooming: User-sourced if user has visual profile (user_input / visual_analysis) or explicit hairTexture signal
    const isGroomingUserSourced =
      (hasVisual && (user.visualProfile?.source === 'user_input' || user.visualProfile?.source === 'visual_analysis')) ||
      (user.styleProfile.evidenceSignals?.hairTexture?.authority === 'USER_ENTERED' || user.styleProfile.evidenceSignals?.hairTexture?.authority === 'USER_CONFIRMED');

    // Count defaults among foundational inputs
    let defaultCount = 0;
    const missingPrompts: string[] = [];

    // E6 & G-08: If occasion has sub-parameters and none was selected, prompt clarifying question
    if (context.occasion?.subParameters && (!context.subParameter || context.subParameter === 'unspecified')) {
      if (context.occasion.slug === 'job-interview') {
        missingPrompts.push('Confirm whether the interview setting is corporate, creative, or startup to refine tailoring sharpness.');
      } else if (context.occasion.slug === 'office') {
        missingPrompts.push('Confirm whether your workplace is corporate, creative, or startup to fine-tune formality.');
      } else if (context.occasion.slug === 'wedding-guest' || context.occasion.slug === 'wedding') {
        missingPrompts.push('Confirm whether the ceremony is day or evening to balance fabric sheen and color depth.');
      }
    }

    if (!isFormalityUserSourced) {
      defaultCount++;
      missingPrompts.push('Confirm your exact target formality to eliminate occasion dress-code assumptions.');
    }
    if (!isClimateUserSourced) {
      defaultCount++;
      missingPrompts.push('Confirm local temperature and weather conditions to fine-tune thermal weight and rain protection.');
    }
    if (!isStyleVectorUserSourced) {
      defaultCount++;
      missingPrompts.push('Select your primary style archetypes to anchor proportional balance.');
    }
    if (!isGroomingUserSourced) {
      missingPrompts.push('Confirm your hair texture or grooming routine to harmonize the complete silhouette.');
    }

    const toIncreaseConfidence = missingPrompts[0] || 'Confirm footwear heel preference to ground overall proportion.';

    // Cap at EXPLORATORY if 2 or more foundational defaults
    if (defaultCount >= 2) {
      return {
        state: 'EXPLORATORY',
        explanation: `Curated directional proposal (${defaultCount} foundational styling inputs relied on default assumptions).`,
        toIncreaseConfidence,
      };
    }

    // Cap at GOOD if 1 default
    if (defaultCount === 1) {
      return {
        state: 'GOOD',
        explanation: `Solid alignment with primary inputs (1 input relied on a baseline assumption).`,
        toIncreaseConfidence,
      };
    }

    // G-32: Undertone unknown caps confidence <= GOOD
    const undertone = user.styleProfile.preferences.userConfirmedUndertone;
    const isUndertoneKnown = undertone && undertone !== 'unspecified';
    if (!isUndertoneKnown) {
      return {
        state: 'GOOD',
        explanation: 'Solid alignment with primary inputs (neutral-safe palette curated without undertone assumption).',
        toIncreaseConfidence: 'Confirm your skin undertone to unlock precise warm or cool chromatic harmonization.',
      };
    }

    // STRONG requires ALL FOUR (formality, climate, style vector, and grooming) to be user-sourced
    if (isGroomingUserSourced && evaluation && evaluation.totalScore >= 0.82) {
      return {
        state: 'STRONG',
        explanation: 'Supported by verified user formality, confirmed climate, explicit style vector, and grooming inputs.',
        toIncreaseConfidence: 'Add specific footwear preferences to further personalize lower-leg grounding.',
      };
    }

    return {
      state: 'GOOD',
      explanation: 'All foundational inputs user-sourced with solid aesthetic alignment.',
      toIncreaseConfidence,
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

    // Outfit 13: R1.2 Thermal Waffle & Sherpa Fleece (Cold Casual / Modest)
    const top13 = knowledgeBase.getGarmentBySlug('waffle-thermal-cream') || knowledgeBase.getAllGarments()[0];
    const bot13 = knowledgeBase.getGarmentBySlug('thermal-waffle-lounge-pants-charcoal') || knowledgeBase.getAllGarments()[1];
    const outer13 = knowledgeBase.getGarmentBySlug('retro-sherpa-fleece-jacket');
    const shoes13 = knowledgeBase.getGarmentBySlug('waterproof-lug-sole-chelsea-boots-black') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_cold_casual_thermal_01',
      title: 'Heavy Thermal Waffle & Sherpa Fleece',
      description: 'Dense cream waffle thermal knit paired with charcoal waffle lounge pants, insulated sherpa fleece, and lug-sole waterproof chelseas.',
      items: [
        { garment: top13, layerPosition: 0 },
        ...(outer13 ? [{ garment: outer13, layerPosition: 1, stylingNote: 'High thermal zip barrier' }] : []),
        { garment: bot13, layerPosition: 0 },
        { garment: shoes13, layerPosition: 0 },
      ],
      primaryStyleSlug: 'casual',
      formality: 1,
      compatibleOccasions: ['casual', 'travel', 'university-college'],
      seasonality: ['fall', 'winter'],
      silhouetteBalance: 'Relaxed cuffed thermal drape with insulated outer barrier',
      colorStory: 'Natural cream, charcoal, and warm fleece neutrals',
    });

    // Outfit 14: R1.2 Airy Modal & Pure Linen (Extreme Heat Casual / Modest)
    const top14 = knowledgeBase.getGarmentBySlug('airy-modal-lounge-tee-black') || knowledgeBase.getAllGarments()[0];
    const bot14 = knowledgeBase.getGarmentBySlug('linen-trousers-ecru') || knowledgeBase.getAllGarments()[1];
    const shoes14 = knowledgeBase.getGarmentBySlug('minimal-leather-sneaker-white') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_hot_casual_modal_01',
      title: 'Airy Featherweight Modal & Pure Linen',
      description: 'Featherweight breathable TENCEL modal tee paired with fluid natural linen trousers and clean white leather cupsole sneakers.',
      items: [
        { garment: top14, layerPosition: 0 },
        { garment: bot14, layerPosition: 0 },
        { garment: shoes14, layerPosition: 0 },
      ],
      primaryStyleSlug: 'casual',
      formality: 1,
      compatibleOccasions: ['casual', 'travel', 'social'],
      seasonality: ['summer', 'all-season'],
      silhouetteBalance: 'Light fluid drop-shoulder drape over relaxed straight linen trousers',
      colorStory: 'Optic black modal focal against natural ecru flax and clean white footwear',
    });

    // Outfit 15: R1.2 Camp-Collar Terracotta & Pure Linen (Hot Casual / Modest Formality 1-2)
    const top15 = knowledgeBase.getGarmentBySlug('camp-collar-terracotta') || knowledgeBase.getAllGarments()[0];
    const bot15 = knowledgeBase.getGarmentBySlug('linen-trousers-ecru') || knowledgeBase.getAllGarments()[1];
    const shoes15 = knowledgeBase.getGarmentBySlug('retro-court-trainers') || knowledgeBase.getAllGarments()[2];
    outfits.push({
      id: 'outfit_hot_casual_terracotta_01',
      title: 'Tencel Camp-Collar & Washed Linen Cadence',
      description: 'Airy boxy terracotta tencel shirt over relaxed natural linen drawstring trousers and vintage court trainers.',
      items: [
        { garment: top15, layerPosition: 0 },
        { garment: bot15, layerPosition: 0 },
        { garment: shoes15, layerPosition: 0 },
      ],
      primaryStyleSlug: 'vintage',
      formality: 2,
      compatibleOccasions: ['casual', 'travel', 'social'],
      seasonality: ['summer', 'spring'],
      silhouetteBalance: 'Draped camp-collar fluid drop over relaxed straight linen trousers',
      colorStory: 'Warm terracotta earth focal balanced by natural ecru flax and clean gum-sole trainers',
    });


    // Outfit 16: Masculine English Chalkstripe Wool Tailoring (Office, Job Interview, Dinner, Wedding Guest)
    const top16 = knowledgeBase.getGarmentBySlug("poplin-point-collar-white") || knowledgeBase.getAllGarments()[0];
    const bot16 = knowledgeBase.getGarmentBySlug("chalkstripe-slacks-navy") || knowledgeBase.getAllGarments()[1];
    const outer16 = knowledgeBase.getGarmentBySlug("chalkstripe-suit-jacket-charcoal");
    const shoes16 = knowledgeBase.getGarmentBySlug("penny-loafer-burgundy") || knowledgeBase.getAllGarments()[2];
    const belt16 = knowledgeBase.getGarmentBySlug("bridle-leather-belt-brass");
    if (top16 && bot16 && shoes16) {
      outfits.push({
        id: "outfit_masculine_tailored_suit_01",
        title: "British Chalkstripe Flannel Tailoring",
        description: "Classic two-button chalkstripe flannel suit jacket over crisp white poplin and cordovan penny loafers.",
        items: [
          { garment: top16, layerPosition: 0 },
          ...(outer16 ? [{ garment: outer16, layerPosition: 1, stylingNote: "Button top button when standing" }] : []),
          { garment: bot16, layerPosition: 0, stylingNote: "Clean slight break over vamp" },
          { garment: shoes16, layerPosition: 0 },
          ...(belt16 ? [{ garment: belt16, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "old-money",
        formality: 4,
        compatibleOccasions: ["office", "job-interview", "dinner", "social", "wedding-guest", "custom"],
        seasonality: ["fall", "winter", "spring"],
        silhouetteBalance: "Traditional tailored structure with rich textural depth",
        colorStory: "Charcoal chalkstripe, crisp white, and cordovan leather",
      });
    }

    // Outfit 17: Masculine Commuter Storm Coat & Flannel Slacks (Cold/Rain/Workplace/Office/Transit)
    const top17 = knowledgeBase.getGarmentBySlug("classic-oxford-blue") || knowledgeBase.getAllGarments()[0];
    const bot17 = knowledgeBase.getGarmentBySlug("flannel-slacks-light-grey") || knowledgeBase.getAllGarments()[1];
    const outer17 = knowledgeBase.getGarmentBySlug("bonded-wool-storm-coat-navy");
    const shoes17 = knowledgeBase.getGarmentBySlug("chelsea-boots-suede-tobacco") || knowledgeBase.getAllGarments()[2];
    const gloves17 = knowledgeBase.getGarmentBySlug("deerskin-gloves-black");
    if (top17 && bot17 && shoes17) {
      outfits.push({
        id: "outfit_masculine_cold_rain_transit_01",
        title: "Bonded Wool Storm Coat & Flannel Slacks",
        description: "Waterproof technical wool storm coat over sky blue oxford and light grey wool flannel trousers.",
        items: [
          { garment: top17, layerPosition: 0 },
          ...(outer17 ? [{ garment: outer17, layerPosition: 1, stylingNote: "Fasten storm placket against weather" }] : []),
          { garment: bot17, layerPosition: 0 },
          { garment: shoes17, layerPosition: 0 },
          ...(gloves17 ? [{ garment: gloves17, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "smart-casual",
        formality: 3,
        compatibleOccasions: ["office", "travel", "casual", "dinner", "university-college", "custom", "job-interview"],
        seasonality: ["fall", "winter", "spring"],
        silhouetteBalance: "Streamlined architectural overcoat over linear flannel trousers",
        colorStory: "Deep navy, light heather grey, sky blue, and tobacco suede",
      });
    }

    // Outfit 18: Masculine Harris Tweed & Rollneck (Dinner, Date, Social, University-College)
    const top18 = knowledgeBase.getGarmentBySlug("rollneck-merino-camel") || knowledgeBase.getAllGarments()[0];
    const bot18 = knowledgeBase.getGarmentBySlug("herringbone-tweed-trousers-brown") || knowledgeBase.getAllGarments()[1];
    const outer18 = knowledgeBase.getGarmentBySlug("harris-tweed-blazer-brown");
    const shoes18 = knowledgeBase.getGarmentBySlug("horsebit-loafer-black") || knowledgeBase.getAllGarments()[2];
    if (top18 && bot18 && shoes18) {
      outfits.push({
        id: "outfit_masculine_tweed_country_01",
        title: "Harris Tweed & Camel Merino Poise",
        description: "Heather brown tweed blazer over camel merino rollneck and herringbone mocha trousers.",
        items: [
          { garment: top18, layerPosition: 0 },
          ...(outer18 ? [{ garment: outer18, layerPosition: 1 }] : []),
          { garment: bot18, layerPosition: 0 },
          { garment: shoes18, layerPosition: 0 },
        ],
        primaryStyleSlug: "old-money",
        formality: 3,
        compatibleOccasions: ["dinner", "date", "social", "university-college", "office", "custom", "night-out"],
        seasonality: ["fall", "winter", "spring"],
        silhouetteBalance: "Substantial tactile upper structure balanced with clean tailored line",
        colorStory: "Earthy camel, heather brown tweed, and black hardware",
      });
    }

    // Outfit 19: Masculine Country Waxed Field Jacket & Denim (Casual, Travel, College, Rain)
    const top19 = knowledgeBase.getGarmentBySlug("western-denim-shirt") || knowledgeBase.getAllGarments()[0];
    const bot19 = knowledgeBase.getGarmentBySlug("tapered-chinos-khaki") || knowledgeBase.getAllGarments()[1];
    const outer19 = knowledgeBase.getGarmentBySlug("waxed-field-jacket-olive");
    const shoes19 = knowledgeBase.getGarmentBySlug("service-boots-brown") || knowledgeBase.getAllGarments()[2];
    if (top19 && bot19 && shoes19) {
      outfits.push({
        id: "outfit_masculine_waxed_field_casual_01",
        title: "Waxed Cotton Country Field Jacket & Denim",
        description: "Weather-resistant waxed cotton jacket over washed western denim shirt and tapered British khaki chinos.",
        items: [
          { garment: top19, layerPosition: 0 },
          ...(outer19 ? [{ garment: outer19, layerPosition: 1 }] : []),
          { garment: bot19, layerPosition: 0 },
          { garment: shoes19, layerPosition: 0 },
        ],
        primaryStyleSlug: "workwear",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "university-college", "social", "custom"],
        seasonality: ["fall", "winter", "spring"],
        silhouetteBalance: "Straight utility cadence with durable oiled cotton barrier",
        colorStory: "Country olive, washed denim indigo, and British khaki",
      });
    }

    // Outfit 20: Masculine Seersucker Summer Trousers & Shirt (Hot/Warm/Casual/Party/Travel)
    const top20 = knowledgeBase.getGarmentBySlug("seersucker-shirt-navy") || knowledgeBase.getAllGarments()[0];
    const bot20 = knowledgeBase.getGarmentBySlug("seersucker-trousers-sky-blue") || knowledgeBase.getAllGarments()[1];
    const shoes20 = knowledgeBase.getGarmentBySlug("horsebit-loafer-black") || knowledgeBase.getAllGarments()[2];
    const hat20 = knowledgeBase.getGarmentBySlug("panama-hat-straw");
    if (top20 && bot20 && shoes20) {
      outfits.push({
        id: "outfit_masculine_summer_seersucker_01",
        title: "Breathable Seersucker Summer Set",
        description: "Lightweight puckered seersucker short-sleeve shirt paired with pleated sky blue trousers and straw panama hat.",
        items: [
          { garment: top20, layerPosition: 0 },
          { garment: bot20, layerPosition: 0 },
          { garment: shoes20, layerPosition: 0 },
          ...(hat20 ? [{ garment: hat20, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "smart-casual",
        formality: 2,
        compatibleOccasions: ["casual", "party", "dinner", "social", "travel", "university-college", "wedding-guest", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Airy fluid summer texture with high natural heat dissipation",
        colorStory: "Navy and sky blue seersucker with neutral toquilla straw accent",
        coOrdTag: true,
      });
    }

    // Outfit 21: Masculine Black Tie Tuxedo (Wedding Guest, Dinner, Cultural, Custom)
    const top21 = knowledgeBase.getGarmentBySlug("tuxedo-shirt-bib-front") || knowledgeBase.getAllGarments()[0];
    const bot21 = knowledgeBase.getGarmentBySlug("tuxedo-trousers-satin-stripe") || knowledgeBase.getAllGarments()[1];
    const outer21 = knowledgeBase.getGarmentBySlug("cashmere-car-coat-navy");
    const shoes21 = knowledgeBase.getGarmentBySlug("penny-loafer-burgundy") || knowledgeBase.getAllGarments()[2];
    if (top21 && bot21 && shoes21) {
      outfits.push({
        id: "outfit_masculine_evening_tuxedo_01",
        title: "Evening Barathea Tuxedo & Marcella Piqué",
        description: "Crisp piqué bib evening dress shirt anchored by satin-striped barathea trousers and cashmere car coat.",
        items: [
          { garment: top21, layerPosition: 0 },
          ...(outer21 ? [{ garment: outer21, layerPosition: 1 }] : []),
          { garment: bot21, layerPosition: 0 },
          { garment: shoes21, layerPosition: 0 },
        ],
        primaryStyleSlug: "old-money",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "cultural-traditional", "custom"],
        seasonality: ["all-season", "fall", "winter", "spring"],
        silhouetteBalance: "Rigorous ceremonial structure with clean satin side vertical stripe",
        colorStory: "Midnight black, optic white piqué, and deep navy wool",
      });
    }

    // Outfit 22: Masculine Raw Silk Bandhgala / Sherwani (Cultural Ceremony, Wedding Guest)
    const top22 = knowledgeBase.getGarmentBySlug("poplin-point-collar-white") || knowledgeBase.getAllGarments()[0];
    const bot22 = knowledgeBase.getGarmentBySlug("tailored-slacks-charcoal") || knowledgeBase.getAllGarments()[1];
    const outer22 = knowledgeBase.getGarmentBySlug("raw-silk-bandhgala-black");
    const shoes22 = knowledgeBase.getGarmentBySlug("horsebit-loafer-black") || knowledgeBase.getAllGarments()[2];
    if (outer22 && bot22 && shoes22) {
      outfits.push({
        id: "outfit_masculine_ceremonial_bandhgala_01",
        title: "Bespoke Raw Silk Bandhgala & Tailored Slacks",
        description: "Architectural mandarin collar raw silk bandhgala over charcoal wool slacks and horsebit loafers.",
        items: [
          { garment: top22, layerPosition: 0 },
          { garment: outer22, layerPosition: 1, stylingNote: "Fasten front buttons for clean column silhouette" },
          { garment: bot22, layerPosition: 0 },
          { garment: shoes22, layerPosition: 0 },
        ],
        primaryStyleSlug: "old-money",
        formality: 5,
        compatibleOccasions: ["cultural-traditional", "wedding-guest", "dinner", "custom"],
        seasonality: ["all-season"],
        silhouetteBalance: "Regal vertical column with high sculpted neckline",
        colorStory: "Obsidian raw silk texture against charcoal wool and gold hardware",
      });
    }

    // Outfit 23: Masculine Night Out Harrington & Gurkha (Night Out, Date, Party, Dinner)
    const top23 = knowledgeBase.getGarmentBySlug("ribbed-polo-cream") || knowledgeBase.getAllGarments()[0];
    const bot23 = knowledgeBase.getGarmentBySlug("gurkha-trousers-olive") || knowledgeBase.getAllGarments()[1];
    const outer23 = knowledgeBase.getGarmentBySlug("harrington-jacket-tan");
    const shoes23 = knowledgeBase.getGarmentBySlug("penny-loafer-burgundy") || knowledgeBase.getAllGarments()[2];
    const watch23 = knowledgeBase.getGarmentBySlug("vintage-dress-watch-gold");
    if (top23 && bot23 && shoes23) {
      outfits.push({
        id: "outfit_masculine_night_out_date_01",
        title: "Classic Harrington Jacket & Gurkha Trousers",
        description: "Tan Harrington blouson over ribbed Johnny collar polo, olive double-buckle Gurkha trousers, and cordovan penny loafers.",
        items: [
          { garment: top23, layerPosition: 0 },
          ...(outer23 ? [{ garment: outer23, layerPosition: 1 }] : []),
          { garment: bot23, layerPosition: 0 },
          { garment: shoes23, layerPosition: 0 },
          ...(watch23 ? [{ garment: watch23, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "vintage",
        formality: 3,
        compatibleOccasions: ["night-out", "date", "party", "dinner", "social", "custom"],
        seasonality: ["spring", "summer", "fall"],
        silhouetteBalance: "Cinched blouson hem balanced with high-rise Gurkha waistband geometry",
        colorStory: "Warm tan, cream knit, deep olive, and rich cordovan",
      });
    }

    // Outfit 24: Feminine Velvet Column Evening Gown (Cold/Evening/Formal/Wedding Guest)
    const dress24 = knowledgeBase.getGarmentBySlug("silk-velvet-column-gown-emerald");
    const coat24 = knowledgeBase.getGarmentBySlug("belted-wool-wrap-coat-camel");
    const shoes24 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    const clutch24 = knowledgeBase.getGarmentBySlug("silk-satin-evening-clutch-black");
    const pearl24 = knowledgeBase.getGarmentBySlug("baroque-pearl-drop-earrings");
    if (dress24 && shoes24) {
      outfits.push({
        id: "outfit_feminine_formal_velvet_cold_01",
        title: "Heavyweight Silk Velvet Column & Cashmere Wrap",
        description: "Floor-length emerald silk-velvet column gown paired with a longline camel cashmere wrap coat, kitten heels, and baroque pearl drops.",
        items: [
          { garment: dress24, layerPosition: 0, stylingNote: "Full-length vertical dignity" },
          ...(coat24 ? [{ garment: coat24, layerPosition: 1, stylingNote: "Drape loosely over shoulders" }] : []),
          { garment: shoes24, layerPosition: 0 },
          ...(clutch24 ? [{ garment: clutch24, layerPosition: 0 }] : []),
          ...(pearl24 ? [{ garment: pearl24, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "old-money",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "cultural-traditional", "custom", "night-out"],
        seasonality: ["fall", "winter"],
        silhouetteBalance: "Monolithic vertical evening column with soft-draped wool architectural frame",
        colorStory: "Deep emerald velvet, warm camel cashmere, and pearl luster",
      });
    }

    // Outfit 25: Feminine Tiered Silk Chiffon Maxi (Warm/Hot/Wedding Guest/Dinner)
    const dress25 = knowledgeBase.getGarmentBySlug("tiered-silk-chiffon-maxi-dress");
    const shoes25 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    const clutch25 = knowledgeBase.getGarmentBySlug("silk-satin-evening-clutch-black");
    const hoops25 = knowledgeBase.getGarmentBySlug("gold-vermeil-huggie-hoops");
    if (dress25 && shoes25) {
      outfits.push({
        id: "outfit_feminine_formal_wedding_chiffon_01",
        title: "Tiered Silk Chiffon Maxi & Minimalist Gold",
        description: "High-neck tiered floral silk chiffon maxi dress with long sleeves, grounded with sculpted kitten heels and satin clutch.",
        items: [
          { garment: dress25, layerPosition: 0 },
          { garment: shoes25, layerPosition: 0 },
          ...(clutch25 ? [{ garment: clutch25, layerPosition: 0 }] : []),
          ...(hoops25 ? [{ garment: hoops25, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "vintage",
        formality: 4,
        compatibleOccasions: ["wedding-guest", "dinner", "party", "cultural-traditional", "custom", "date"],
        seasonality: ["spring", "summer"],
        silhouetteBalance: "Fluid airy tiered volume floating over streamlined footwear",
        colorStory: "Muted dusty rose floral with obsidian satin and 18k gold vermeil",
      });
    }

    // Outfit 26: Feminine Waist-defined Wool Blazer & Wide-Leg Trousers (Workplace/Job Interview/Office)
    const top26 = knowledgeBase.getGarmentBySlug("asymmetric-draped-wrap-blouse-ecru") || knowledgeBase.getAllGarments()[0];
    const bot26 = knowledgeBase.getGarmentBySlug("high-rise-wool-trousers-black") || knowledgeBase.getAllGarments()[1];
    const outer26 = knowledgeBase.getGarmentBySlug("hourglass-wool-blazer-black");
    const shoes26 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    const bag26 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    if (top26 && bot26 && shoes26) {
      outfits.push({
        id: "outfit_feminine_tailored_suit_workplace_01",
        title: "Waist-defined Virgin Wool Tailoring & Box-Calf Tote",
        description: "Sculpted waist-defined wool blazer over high-rise wide-leg wool trousers, block-heel calfskin boots, and minimal tote.",
        items: [
          { garment: top26, layerPosition: 0 },
          ...(outer26 ? [{ garment: outer26, layerPosition: 1, stylingNote: "Cinch waistline architecture" }] : []),
          { garment: bot26, layerPosition: 0, stylingNote: "Fluid break over boots" },
          { garment: shoes26, layerPosition: 0 },
          ...(bag26 ? [{ garment: bag26, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "minimal",
        formality: 4,
        compatibleOccasions: ["office", "job-interview", "dinner", "social", "custom"],
        seasonality: ["all-season", "fall", "winter", "spring"],
        silhouetteBalance: "Sculpted architectural waist framing fluid wide-leg trouser movement",
        colorStory: "Deep obsidian black monochrome softened with ecru drape accent",
      });
    }

    // Outfit 27: Feminine Waterproof Gabardine Trench & Wool Trousers (Rain/Cold/Workplace/Office/Travel)
    const top27 = knowledgeBase.getGarmentBySlug("merino-crewneck-heather-grey") || knowledgeBase.getAllGarments()[0];
    const bot27 = knowledgeBase.getGarmentBySlug("high-rise-wool-trousers-black") || knowledgeBase.getAllGarments()[1];
    const outer27 = knowledgeBase.getGarmentBySlug("waterproof-gabardine-trench-khaki");
    const shoes27 = knowledgeBase.getGarmentBySlug("waterproof-tall-riding-boots-black") || knowledgeBase.getAllGarments()[2];
    const bag27 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    if (top27 && bot27 && shoes27) {
      outfits.push({
        id: "outfit_feminine_rain_trench_workplace_01",
        title: "Weatherproof Gabardine Trench & Tall Riding Boots",
        description: "Double-breasted storm-flap trench coat over fine merino knit, tailored trousers, and waterproof riding boots.",
        items: [
          { garment: top27, layerPosition: 0 },
          ...(outer27 ? [{ garment: outer27, layerPosition: 1, stylingNote: "Belt loosely at back or tie waist" }] : []),
          { garment: bot27, layerPosition: 0 },
          { garment: shoes27, layerPosition: 0 },
          ...(bag27 ? [{ garment: bag27, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "old-money",
        formality: 3,
        compatibleOccasions: ["office", "travel", "casual", "job-interview", "university-college", "custom"],
        seasonality: ["spring", "fall", "winter"],
        silhouetteBalance: "Longline weatherproof architectural outer layer protecting streamlined base",
        colorStory: "Honey khaki gabardine, heather grey knit, and pitch black leather",
      });
    }

    // Outfit 28: Feminine Wool Crepe A-Line Maxi Skirt & Wrap Blouse (Dinner/Date/Office/Cold/Mild)
    const top28 = knowledgeBase.getGarmentBySlug("asymmetric-draped-wrap-blouse-ecru") || knowledgeBase.getAllGarments()[0];
    const bot28 = knowledgeBase.getGarmentBySlug("wool-crepe-maxi-skirt-black") || knowledgeBase.getAllGarments()[1];
    const outer28 = knowledgeBase.getGarmentBySlug("belted-wool-wrap-coat-camel");
    const shoes28 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    const tights28 = knowledgeBase.getGarmentBySlug("thermal-wool-tights-black");
    if (top28 && bot28 && shoes28) {
      outfits.push({
        id: "outfit_feminine_cold_wool_crepe_maxi_01",
        title: "Wool Crepe Maxi Skirt & Camel Cashmere Wrap",
        description: "Double wool crepe A-line maxi skirt paired with fluid wrap blouse, block-heel ankle boots, and camel wrap coat.",
        items: [
          { garment: top28, layerPosition: 0 },
          ...(outer28 ? [{ garment: outer28, layerPosition: 1 }] : []),
          { garment: bot28, layerPosition: 0 },
          { garment: shoes28, layerPosition: 0 },
          ...(tights28 ? [{ garment: tights28, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "old-money",
        formality: 4,
        compatibleOccasions: ["dinner", "office", "date", "social", "wedding-guest", "custom"],
        seasonality: ["fall", "winter"],
        silhouetteBalance: "Sculpted longline A-frame cadence with thermal protective base",
        colorStory: "Warm camel cashmere, ecru fluid blouse, and obsidian black crepe",
      });
    }

    // Outfit 29: Feminine Fine-Rib Merino Maxi Dress (Casual/Travel/College/Mild/Cold)
    const dress29 = knowledgeBase.getGarmentBySlug("merino-rib-maxi-dress-black");
    const outer29 = knowledgeBase.getGarmentBySlug("waterproof-gabardine-trench-khaki");
    const shoes29 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    const bag29 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    if (dress29 && shoes29) {
      outfits.push({
        id: "outfit_feminine_casual_modest_knit_maxi_01",
        title: "Ribbed Merino Wool Maxi & Weatherproof Trench",
        description: "Extrafine merino wool ribbed maxi dress paired with gabardine trench coat and comfortable block-heel boots.",
        items: [
          { garment: dress29, layerPosition: 0 },
          ...(outer29 ? [{ garment: outer29, layerPosition: 1 }] : []),
          { garment: shoes29, layerPosition: 0 },
          ...(bag29 ? [{ garment: bag29, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "university-college", "social", "night-out", "custom", "date"],
        seasonality: ["fall", "winter", "spring"],
        silhouetteBalance: "Full continuous column line under structured mid-length weather barrier",
        colorStory: "Pitch black ribbed wool and honey khaki gabardine",
      });
    }

    // Outfit 30: Feminine French Linen Long-Sleeve Maxi Shirtdress (Hot/Warm/Casual/College/Travel)
    const dress30 = knowledgeBase.getGarmentBySlug("linen-maxi-shirtdress-navy");
    const shoes30 = knowledgeBase.getGarmentBySlug("unstructured-leather-ballet-flats-black") || knowledgeBase.getAllGarments()[2];
    const bag30 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    if (dress30 && shoes30) {
      outfits.push({
        id: "outfit_feminine_hot_modest_linen_maxi_01",
        title: "Washed French Linen Maxi & Glove Leather Flats",
        description: "Full-coverage breathable Normandy linen maxi shirt dress paired with supple ballet flats and calfskin tote.",
        items: [
          { garment: dress30, layerPosition: 0 },
          { garment: shoes30, layerPosition: 0 },
          ...(bag30 ? [{ garment: bag30, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "casual",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "university-college", "social", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Fluid relaxed column offering maximum thermal airflow and complete coverage",
        colorStory: "Deep navy washed flax anchored by pitch black glove leather",
      });
    }

    // Outfit 31: Feminine High-Neck Poplin Tiered Maxi Dress (Mild/Warm/Hot/Dinner/Date/Office)
    const dress31 = knowledgeBase.getGarmentBySlug("high-neck-poplin-maxi-dress-olive");
    const shoes31 = knowledgeBase.getGarmentBySlug("unstructured-leather-ballet-flats-black") || knowledgeBase.getAllGarments()[2];
    const bag31 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    if (dress31 && shoes31) {
      outfits.push({
        id: "outfit_feminine_hot_poplin_maxi_01",
        title: "High-Neck Tiered Poplin Maxi Dress (Olive)",
        description: "Crisp cotton poplin high-neck tiered maxi dress grounded with glove leather flats and structured tote.",
        items: [
          { garment: dress31, layerPosition: 0 },
          { garment: shoes31, layerPosition: 0 },
          ...(bag31 ? [{ garment: bag31, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "smart-casual",
        formality: 3,
        compatibleOccasions: ["dinner", "date", "office", "party", "social", "custom", "wedding-guest"],
        seasonality: ["spring", "summer", "fall"],
        silhouetteBalance: "High architectural collar line leading into fluid tiered volume",
        colorStory: "Deep olive poplin contrasted with black minimal leather accents",
      });
    }

    // Outfit 32: Feminine Tailored Wide-Leg Crepe Jumpsuit (Party/Night Out/Date/Dinner)
    const jumpsuit32 = knowledgeBase.getGarmentBySlug("tailored-crepe-jumpsuit-black");
    const shoes32 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    const clutch32 = knowledgeBase.getGarmentBySlug("silk-satin-evening-clutch-black");
    const hoops32 = knowledgeBase.getGarmentBySlug("gold-vermeil-huggie-hoops");
    if (jumpsuit32 && shoes32) {
      outfits.push({
        id: "outfit_feminine_party_crepe_jumpsuit_01",
        title: "Tailored Wide-Leg Crepe Jumpsuit & Gold Accents",
        description: "Architectural cinched-waist wide-leg fluid jumpsuit paired with sculpted kitten heels and satin evening clutch.",
        items: [
          { garment: jumpsuit32, layerPosition: 0 },
          { garment: shoes32, layerPosition: 0 },
          ...(clutch32 ? [{ garment: clutch32, layerPosition: 0 }] : []),
          ...(hoops32 ? [{ garment: hoops32, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "minimal",
        formality: 4,
        compatibleOccasions: ["party", "night-out", "date", "dinner", "social", "custom"],
        seasonality: ["all-season", "spring", "fall"],
        silhouetteBalance: "Cinched waist architecture transitioning into expansive fluid trouser drape",
        colorStory: "Monochrome obsidian crepe illuminated by 18k gold vermeil",
      });
    }

    // Outfit 33: Feminine Relaxed Utility Linen Jumpsuit (Casual/College/Travel)
    const jumpsuit33 = knowledgeBase.getGarmentBySlug("utility-linen-jumpsuit-olive");
    const shoes33 = knowledgeBase.getGarmentBySlug("waterproof-lug-sole-chelsea-boots-black") || knowledgeBase.getAllGarments()[2];
    const bag33 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    if (jumpsuit33 && shoes33) {
      outfits.push({
        id: "outfit_feminine_casual_utility_jumpsuit_01",
        title: "Washed Utility Linen Jumpsuit & Lug-Sole Boots",
        description: "Long-sleeve washed utility jumpsuit grounded with solid waterproof lug-sole chelseas and leather tote.",
        items: [
          { garment: jumpsuit33, layerPosition: 0 },
          { garment: shoes33, layerPosition: 0 },
          ...(bag33 ? [{ garment: bag33, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "workwear",
        formality: 2,
        compatibleOccasions: ["casual", "university-college", "travel", "custom"],
        seasonality: ["spring", "summer", "fall"],
        silhouetteBalance: "Straight relaxed functional column grounded by cleated traction sole",
        colorStory: "Washed olive twill and matte black waterproof leather",
      });
    }

    // Outfit 34: Feminine Silk Slip & Waist-defined Blazer (Night Out/Party/Date/Dinner)
    const slip34 = knowledgeBase.getGarmentBySlug("silk-slip-dress-black");
    const blazer34 = knowledgeBase.getGarmentBySlug("hourglass-wool-blazer-black");
    const shoes34 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    const hoops34 = knowledgeBase.getGarmentBySlug("gold-vermeil-huggie-hoops");
    if (slip34 && shoes34) {
      outfits.push({
        id: "outfit_feminine_night_out_slip_blazer_01",
        title: "Bias-Cut Silk Slip & Waist-defined Wool Blazer",
        description: "Liquid silk charmeuse slip dress enveloped by a sculpted hourglass wool blazer, kitten heels, and gold hoops.",
        items: [
          { garment: slip34, layerPosition: 0 },
          ...(blazer34 ? [{ garment: blazer34, layerPosition: 1 }] : []),
          { garment: shoes34, layerPosition: 0 },
          ...(hoops34 ? [{ garment: hoops34, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "minimal",
        formality: 4,
        compatibleOccasions: ["night-out", "date", "dinner", "party", "social", "custom"],
        seasonality: ["all-season", "spring", "fall", "summer"],
        silhouetteBalance: "High-contrast dynamic: structured tailored shoulder framing fluid liquid silk hem",
        colorStory: "Deep obsidian black silk and wool enriched with warm gold reflection",
      });
    }

    // Outfit 35: Fluid Unstructured DB Suit in Warm Taupe (Office/Job Interview/Dinner/Date)
    const top35 = knowledgeBase.getGarmentBySlug("heavyweight-boxy-tee-offwhite") || knowledgeBase.getAllGarments()[0];
    const bot35 = knowledgeBase.getGarmentBySlug("fluid-drape-trousers-taupe") || knowledgeBase.getAllGarments()[1];
    const outer35 = knowledgeBase.getGarmentBySlug("unstructured-db-jacket-taupe");
    const shoes35 = knowledgeBase.getGarmentBySlug("chunky-derbies-black") || knowledgeBase.getAllGarments()[2];
    const bag35 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    const watch35 = knowledgeBase.getGarmentBySlug("vintage-dress-watch-gold");
    if (top35 && bot35 && shoes35) {
      outfits.push({
        id: "outfit_fluid_db_suit_taupe_01",
        title: "Unstructured Double-Breasted Fluid Suit in Taupe",
        description: "Soft-shoulder fluid double-breasted jacket over wide double-pleat trousers, boxy tee, and chunky derbies.",
        items: [
          { garment: top35, layerPosition: 0 },
          ...(outer35 ? [{ garment: outer35, layerPosition: 1 }] : []),
          { garment: bot35, layerPosition: 0 },
          { garment: shoes35, layerPosition: 0 },
          ...(bag35 ? [{ garment: bag35, layerPosition: 0 }] : []),
          ...(watch35 ? [{ garment: watch35, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "korean-minimal",
        formality: 3,
        compatibleOccasions: ["office", "job-interview", "dinner", "date", "social", "custom"],
        seasonality: ["spring", "fall", "summer", "all-season"],
        silhouetteBalance: "Volumetric fluid box jacket over generous floor-break trouser cadence",
        colorStory: "Warm taupe fluid wool, optic off-white, and pitch black leather",
      });
    }

    // Outfit 36: Fluid Cocoon Wool Coat & Pleated Trousers (Cold/Workplace/Casual/Transit)
    const top36 = knowledgeBase.getGarmentBySlug("mockneck-black") || knowledgeBase.getAllGarments()[0];
    const bot36 = knowledgeBase.getGarmentBySlug("wide-pleated-trousers-black") || knowledgeBase.getAllGarments()[1];
    const outer36 = knowledgeBase.getGarmentBySlug("cocoon-wool-overcoat-grey");
    const shoes36 = knowledgeBase.getGarmentBySlug("waterproof-lug-sole-chelsea-boots-black") || knowledgeBase.getAllGarments()[2];
    const bag36 = knowledgeBase.getGarmentBySlug("box-calf-structured-tote-black");
    if (top36 && bot36 && shoes36) {
      outfits.push({
        id: "outfit_fluid_cold_cocoon_coat_01",
        title: "Cocoon Wool Overcoat & Double-Pleated Trousers",
        description: "Heavyweight boiled wool cocoon overcoat over compact ribbed mockneck, wide pleated trousers, and lug-sole chelseas.",
        items: [
          { garment: top36, layerPosition: 0 },
          ...(outer36 ? [{ garment: outer36, layerPosition: 1 }] : []),
          { garment: bot36, layerPosition: 0 },
          { garment: shoes36, layerPosition: 0 },
          ...(bag36 ? [{ garment: bag36, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "korean-minimal",
        formality: 3,
        compatibleOccasions: ["office", "casual", "travel", "university-college", "dinner", "custom"],
        seasonality: ["fall", "winter"],
        silhouetteBalance: "Expansive cocoon volume encasing streamlined linear column",
        colorStory: "Heather grey boiled wool over deep monochrome black foundation",
      });
    }

    // Outfit 37: Masculine Hot Casual Linen Guayabera & Linen Trousers (Casual, Travel)
    const top37 = knowledgeBase.getGarmentBySlug("linen-guayabera-white") || knowledgeBase.getAllGarments()[0];
    const bot37 = knowledgeBase.getGarmentBySlug("linen-trousers-ecru") || knowledgeBase.getAllGarments()[1];
    const shoes37 = knowledgeBase.getGarmentBySlug("minimal-leather-sneaker-white") || knowledgeBase.getAllGarments()[2];
    if (top37 && bot37 && shoes37) {
      outfits.push({
        id: "outfit_masculine_hot_casual_linen_01",
        title: "Fine Irish Linen Guayabera & Trousers",
        description: "High-breathability pleated linen guayabera shirt with relaxed linen drawstring trousers and clean sneakers.",
        items: [
          { garment: top37, layerPosition: 0 },
          { garment: bot37, layerPosition: 0 },
          { garment: shoes37, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "party", "social", "university-college", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Airy relaxed drape with authentic artisanal pleating cadence",
        colorStory: "Pure crisp white linen and soft natural ecru",
      });
    }

    // Outfit 38: Feminine Hot Casual Linen Maxi Skirt & Fitted Knit (Casual, Social, Travel)
    const top38 = knowledgeBase.getGarmentBySlug("slub-linen-tee-natural") || knowledgeBase.getAllGarments()[0];
    const bot38 = knowledgeBase.getGarmentBySlug("french-linen-wrap-dress-terracotta") ? undefined : knowledgeBase.getAllGarments()[1];
    const dress38 = knowledgeBase.getGarmentBySlug("french-linen-wrap-dress-terracotta");
    const shoes38 = knowledgeBase.getGarmentBySlug("minimal-leather-sneaker-white") || knowledgeBase.getAllGarments()[2];
    if (dress38 && shoes38) {
      outfits.push({
        id: "outfit_feminine_hot_casual_wrap_dress_01",
        title: "French Linen Wrap Dress & Minimal Sneakers",
        description: "Pre-washed French flax linen wrap dress with breathable airflow, natural waist cinch, and minimal white sneakers.",
        items: [
          { garment: dress38, layerPosition: 0 },
          { garment: shoes38, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "party", "social", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Fluid architectural wrap contour balancing clean flat grounding",
        colorStory: "Warm earthy terracotta flax linen and optic crisp white",
      });
    }

    // Outfit 39: Feminine Cold Casual Wool Wrap Coat & Knit (Casual, Travel)
    const top39 = knowledgeBase.getGarmentBySlug("mockneck-black") || knowledgeBase.getAllGarments()[0];
    const bot39 = knowledgeBase.getGarmentBySlug("wide-pleated-trousers-black") || knowledgeBase.getAllGarments()[1];
    const outer39 = knowledgeBase.getGarmentBySlug("belted-wool-wrap-coat-camel") || knowledgeBase.getGarmentBySlug("double-breasted-overcoat-camel");
    const shoes39 = knowledgeBase.getGarmentBySlug("waterproof-lug-sole-chelsea-boots-black") || knowledgeBase.getAllGarments()[2];
    if (top39 && bot39 && shoes39) {
      outfits.push({
        id: "outfit_feminine_cold_casual_wrap_01",
        title: "Wool Wrap Coat & Wide Trousers",
        description: "Belted camel wool wrap coat over fine knit mockneck, pleated black trousers, and lug-sole chelseas.",
        items: [
          { garment: top39, layerPosition: 0 },
          ...(outer39 ? [{ garment: outer39, layerPosition: 1 }] : []),
          { garment: bot39, layerPosition: 0 },
          { garment: shoes39, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "office", "social", "custom"],
        seasonality: ["fall", "winter"],
        silhouetteBalance: "Cinches at waist over wide floor-break trouser architecture",
        colorStory: "Warm camel wool framing monochrome deep obsidian black",
      });
    }

    // Outfit 40: Masculine Cold Casual Storm Coat & Chinos (Casual, Travel, Transit)
    const top40 = knowledgeBase.getGarmentBySlug("heavyweight-boxy-tee-black") || knowledgeBase.getAllGarments()[0];
    const bot40 = knowledgeBase.getGarmentBySlug("tapered-chinos-khaki") || knowledgeBase.getAllGarments()[1];
    const outer40 = knowledgeBase.getGarmentBySlug("bonded-wool-storm-coat-navy");
    const shoes40 = knowledgeBase.getGarmentBySlug("service-boots-brown") || knowledgeBase.getAllGarments()[2];
    if (top40 && bot40 && shoes40) {
      outfits.push({
        id: "outfit_masculine_cold_casual_storm_01",
        title: "Bonded Wool Storm Coat & Heavyweight Chinos",
        description: "Waterproof bonded wool storm coat over boxy heavyweight tee, British khaki chinos, and service boots.",
        items: [
          { garment: top40, layerPosition: 0 },
          ...(outer40 ? [{ garment: outer40, layerPosition: 1 }] : []),
          { garment: bot40, layerPosition: 0 },
          { garment: shoes40, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "university-college", "social", "custom"],
        seasonality: ["fall", "winter"],
        silhouetteBalance: "Protective storm outerwear over rugged utilitarian base",
        colorStory: "Navy technical wool, faded black tee, and earthy British khaki",
      });
    }


    // Outfit 41: Androgynous Fluid Satin & Shawl Tuxedo (Wedding Guest/Dinner/Gala Formality 5, Cold/Mild)
    const top41 = knowledgeBase.getGarmentBySlug("fluid-satin-evening-shirt-noir") || knowledgeBase.getAllGarments()[0];
    const bot41 = knowledgeBase.getGarmentBySlug("fluid-crepe-evening-trousers-black") || knowledgeBase.getAllGarments()[1];
    const outer41 = knowledgeBase.getGarmentBySlug("soft-shawl-tuxedo-jacket-black");
    const shoes41 = knowledgeBase.getGarmentBySlug("fluid-evening-venetian-slippers-black") || knowledgeBase.getAllGarments()[2];
    if (top41 && bot41 && shoes41) {
      outfits.push({
        id: "outfit_fluid_formal_tuxedo_evening_01",
        title: "Fluid Shawl Tuxedo & Liquid Satin Evening Shirt",
        description: "Soft-tailored shawl tuxedo jacket in fluid wool crepe over covered-placket silk satin shirt, wide evening trousers, and venetian slippers.",
        items: [
          { garment: top41, layerPosition: 0 },
          ...(outer41 ? [{ garment: outer41, layerPosition: 1 }] : []),
          { garment: bot41, layerPosition: 0 },
          { garment: shoes41, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "party", "cultural-traditional", "social", "custom"],
        seasonality: ["fall", "winter", "spring", "all-season"],
        silhouetteBalance: "Draped evening tailoring with expansive floor-skimming palazzo cadence",
        colorStory: "Monochrome obsidian satin and matte wool crepe",
      });
    }

    // Outfit 42: Androgynous Fluid Architectural Tunic Coat & Evening Trousers (Wedding Guest/Cultural/Dinner Formality 4-5, Cold)
    const top42 = knowledgeBase.getGarmentBySlug("fluid-satin-evening-shirt-noir") || knowledgeBase.getAllGarments()[0];
    const bot42 = knowledgeBase.getGarmentBySlug("fluid-crepe-evening-trousers-black") || knowledgeBase.getAllGarments()[1];
    const outer42 = knowledgeBase.getGarmentBySlug("fluid-tunic-overcoat-black");
    const shoes42 = knowledgeBase.getGarmentBySlug("fluid-weatherproof-chelsea-boots-black") || knowledgeBase.getAllGarments()[2];
    if (top42 && bot42 && shoes42) {
      outfits.push({
        id: "outfit_fluid_cold_formal_tunic_01",
        title: "Longline Architectural Fluid Tunic Coat & Evening Slacks",
        description: "Streamlined longline mandarin tunic coat over fluid satin shirt, wide pleated evening trousers, and weatherproof chelseas.",
        items: [
          { garment: top42, layerPosition: 0 },
          ...(outer42 ? [{ garment: outer42, layerPosition: 1 }] : []),
          { garment: bot42, layerPosition: 0 },
          { garment: shoes42, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "cultural-traditional", "dinner", "job-interview", "office", "custom"],
        seasonality: ["winter", "fall"],
        silhouetteBalance: "Architectural vertical monolith protecting fluid interior cadence",
        colorStory: "Deep noir monochrome black with refined textural contrast",
      });
    }

    // Outfit 43: Androgynous Hot Casual/Social Fluid Linen & Camp-Collar (Hot Weather Formality 2-3)
    const top43 = knowledgeBase.getGarmentBySlug("fluid-camp-shirt-ecru") || knowledgeBase.getAllGarments()[0];
    const bot43 = knowledgeBase.getGarmentBySlug("fluid-linen-wide-trousers-sand") || knowledgeBase.getAllGarments()[1];
    const shoes43 = knowledgeBase.getGarmentBySlug("fluid-leather-slide-mules-espresso") || knowledgeBase.getAllGarments()[2];
    if (top43 && bot43 && shoes43) {
      outfits.push({
        id: "outfit_fluid_hot_resort_linen_01",
        title: "Draped Silk-Tencel Camp Shirt & Wide Linen Trousers",
        description: "Airy fluid silk-tencel camp collar shirt paired with wide double-pleat flax trousers and asymmetric leather mules.",
        items: [
          { garment: top43, layerPosition: 0 },
          { garment: bot43, layerPosition: 0 },
          { garment: shoes43, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "social", "party", "university-college", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Expansive high-breathability drape allowing complete thermal airflow",
        colorStory: "Natural ecru silk twill, warm sand linen, and espresso calfskin",
      });
    }

    // Outfit 44: Androgynous Hot Workplace/Dinner/Interview Fluid Linen Suit (Hot Weather Formality 3-4)
    const top44 = knowledgeBase.getGarmentBySlug("fluid-open-weave-shirt-white") || knowledgeBase.getAllGarments()[0];
    const bot44 = knowledgeBase.getGarmentBySlug("fluid-linen-wide-trousers-sand") || knowledgeBase.getAllGarments()[1];
    const outer44 = knowledgeBase.getGarmentBySlug("unstructured-db-jacket-taupe");
    const shoes44 = knowledgeBase.getGarmentBySlug("fluid-woven-leather-loafers-black") || knowledgeBase.getAllGarments()[2];
    const watch44 = knowledgeBase.getGarmentBySlug("vintage-dress-watch-gold");
    if (top44 && bot44 && shoes44) {
      outfits.push({
        id: "outfit_fluid_hot_workplace_linen_01",
        title: "Unstructured DB Jacket & Woven Leather Loafers",
        description: "Breathable open-knit resort shirt under soft-shoulder DB jacket, pleated linen trousers, and woven calfskin loafers.",
        items: [
          { garment: top44, layerPosition: 0 },
          ...(outer44 ? [{ garment: outer44, layerPosition: 1 }] : []),
          { garment: bot44, layerPosition: 0 },
          { garment: shoes44, layerPosition: 0 },
          ...(watch44 ? [{ garment: watch44, layerPosition: 0 }] : []),
        ],
        primaryStyleSlug: "smart-casual",
        formality: 3,
        compatibleOccasions: ["office", "job-interview", "dinner", "date", "wedding-guest", "cultural-traditional", "social", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Relaxed tailored box envelope over fluid wide trouser break",
        colorStory: "Optic white mesh, natural sand flax, and warm taupe wool",
      });
    }

    // Outfit 45: Androgynous Cold Flannel Drape & Heavy Knit (Cold Weather Formality 3-4)
    const top45 = knowledgeBase.getGarmentBySlug("mockneck-black") || knowledgeBase.getAllGarments()[0];
    const bot45 = knowledgeBase.getGarmentBySlug("fluid-heavy-flannel-trousers-charcoal") || knowledgeBase.getAllGarments()[1];
    const outer45 = knowledgeBase.getGarmentBySlug("cocoon-wool-overcoat-grey");
    const shoes45 = knowledgeBase.getGarmentBySlug("fluid-weatherproof-chelsea-boots-black") || knowledgeBase.getAllGarments()[2];
    if (top45 && bot45 && shoes45) {
      outfits.push({
        id: "outfit_fluid_cold_flannel_drape_01",
        title: "Cocoon Wool Coat & Heavy Pleated Flannel Trousers",
        description: "Heavyweight boiled wool cocoon coat over fine rib mockneck, thermal-lined pleated charcoal flannel trousers, and all-weather boots.",
        items: [
          { garment: top45, layerPosition: 0 },
          ...(outer45 ? [{ garment: outer45, layerPosition: 1 }] : []),
          { garment: bot45, layerPosition: 0 },
          { garment: shoes45, layerPosition: 0 },
        ],
        primaryStyleSlug: "korean-minimal",
        formality: 3,
        compatibleOccasions: ["office", "job-interview", "dinner", "date", "wedding-guest", "cultural-traditional", "travel", "custom"],
        seasonality: ["winter", "fall"],
        silhouetteBalance: "Generous cocoon geometry encasing heavy draped flannel volume",
        colorStory: "Heather grey wool, deep charcoal melange, and pitch black leather",
      });
    }

    // Outfit 46: Feminine Silk Tie-Neck Blouse & Wool Maxi Skirt (Wedding Guest/Dinner/Ceremony Formality 4-5)
    const top46 = knowledgeBase.getGarmentBySlug("silk-georgette-tie-neck-blouse-ivory") || knowledgeBase.getAllGarments()[0];
    const bot46 = knowledgeBase.getGarmentBySlug("wool-crepe-maxi-skirt-black") || knowledgeBase.getAllGarments()[1];
    const outer46 = knowledgeBase.getGarmentBySlug("hourglass-wool-blazer-black");
    const shoes46 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    if (top46 && bot46 && shoes46) {
      outfits.push({
        id: "outfit_feminine_tie_neck_maxi_separates_01",
        title: "Silk Lavallière Blouse & Structured Wool Crepe Maxi Skirt",
        description: "Pure silk georgette tie-neck blouse paired with architectural wool crepe A-line maxi skirt, hourglass blazer, and kitten heels.",
        items: [
          { garment: top46, layerPosition: 0 },
          ...(outer46 ? [{ garment: outer46, layerPosition: 1 }] : []),
          { garment: bot46, layerPosition: 0 },
          { garment: shoes46, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 4,
        compatibleOccasions: ["wedding-guest", "dinner", "office", "job-interview", "cultural-traditional", "social", "custom"],
        seasonality: ["fall", "winter", "spring", "all-season"],
        silhouetteBalance: "Fluid tie-neck collar framing sculpted waistline over sweeping architectural maxi hem",
        colorStory: "Ivory silk georgette illuminated against pitch black virgin wool crepe",
      });
    }

    // Outfit 47: Feminine Cowl Camisole & Fluid Wide Trousers (Dinner/Party/Date/Night Out Formality 3-4)
    const top47 = knowledgeBase.getGarmentBySlug("draped-cowl-satin-camisole-champagne") || knowledgeBase.getAllGarments()[0];
    const bot47 = knowledgeBase.getGarmentBySlug("high-rise-wool-trousers-black") || knowledgeBase.getAllGarments()[1];
    const shoes47 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    if (top47 && bot47 && shoes47) {
      outfits.push({
        id: "outfit_feminine_cowl_trousers_separates_01",
        title: "Bias-Cut Cowl Satin Camisole & High-Rise Wide Trousers",
        description: "Liquid champagne silk charmeuse cowl camisole anchored inside high-rise fluid wide-leg wool trousers with kitten heels.",
        items: [
          { garment: top47, layerPosition: 0 },
          { garment: bot47, layerPosition: 0 },
          { garment: shoes47, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 3,
        compatibleOccasions: ["dinner", "date", "party", "night-out", "social", "wedding-guest", "custom"],
        seasonality: ["all-season", "spring", "summer", "fall"],
        silhouetteBalance: "Fluid draped neckline descending into elongated tailored floor-break trousers",
        colorStory: "Warm champagne silk charmeuse contrasted with obsidian black wool",
      });
    }

    // Outfit 48: Feminine Organza Overlay Blouse & High-Rise Trousers (Ceremony/Wedding/Gala Formality 5)
    const top48 = knowledgeBase.getGarmentBySlug("organza-overlay-formal-blouse-noir") || knowledgeBase.getAllGarments()[0];
    const bot48 = knowledgeBase.getGarmentBySlug("high-rise-wool-trousers-black") || knowledgeBase.getAllGarments()[1];
    const shoes48 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    if (top48 && bot48 && shoes48) {
      outfits.push({
        id: "outfit_feminine_organza_formal_separates_01",
        title: "Silk Organza Sheer Blouse & Tailored Wool Trousers",
        description: "Volumetric silk organza balloon-sleeve sheer blouse grounded by high-rise tailored fluid wool trousers and kitten heels.",
        items: [
          { garment: top48, layerPosition: 0 },
          { garment: bot48, layerPosition: 0 },
          { garment: shoes48, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "party", "cultural-traditional", "social", "custom"],
        seasonality: ["all-season", "fall", "spring"],
        silhouetteBalance: "Volumetric sheer sleeve architecture balanced by streamlined linear trouser column",
        colorStory: "Monochrome obsidian black with multi-dimensional sheer texture",
      });
    }

    // Outfit 49: Feminine Asymmetric Linen Wrap Top & Satin Midi Skirt (Hot Weather Formality 2-3)
    const top49 = knowledgeBase.getGarmentBySlug("asymmetric-wrap-linen-top-natural") || knowledgeBase.getAllGarments()[0];
    const bot49 = knowledgeBase.getGarmentBySlug("bias-cut-satin-skirt-champagne") || knowledgeBase.getAllGarments()[1];
    const shoes49 = knowledgeBase.getGarmentBySlug("unstructured-leather-ballet-flats-black") || knowledgeBase.getAllGarments()[2];
    if (top49 && bot49 && shoes49) {
      outfits.push({
        id: "outfit_feminine_hot_linen_satin_separates_01",
        title: "Asymmetric Linen Wrap Top & Bias-Cut Satin Midi Skirt",
        description: "Breathable natural flax wrap top defining the waist over a fluid bias-cut silk satin midi skirt and glove leather ballet flats.",
        items: [
          { garment: top49, layerPosition: 0 },
          { garment: bot49, layerPosition: 0 },
          { garment: shoes49, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "social", "party", "university-college", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Architectural wrap cinch transitioning into bias liquid drape",
        colorStory: "Natural flax earth tone and luminous champagne silk satin",
      });
    }

    // Outfit 50: Feminine Cashmere Mockneck & Knife-Pleated Wool Skirt (Cold Weather Formality 3-4)
    const top50 = knowledgeBase.getGarmentBySlug("cashmere-silk-mockneck-top-camel") || knowledgeBase.getAllGarments()[0];
    const bot50 = knowledgeBase.getGarmentBySlug("knife-pleated-midi-skirt-navy") || knowledgeBase.getAllGarments()[1];
    const outer50 = knowledgeBase.getGarmentBySlug("belted-wool-wrap-coat-camel");
    const shoes50 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    if (top50 && bot50 && shoes50) {
      outfits.push({
        id: "outfit_feminine_cold_cashmere_pleats_separates_01",
        title: "Cashmere-Silk Mockneck & Knife-Pleated Wool Skirt",
        description: "Fine cashmere mockneck in camel paired with knife-pleated wool midi skirt, belted wrap coat, and block-heel ankle boots.",
        items: [
          { garment: top50, layerPosition: 0 },
          ...(outer50 ? [{ garment: outer50, layerPosition: 1 }] : []),
          { garment: bot50, layerPosition: 0 },
          { garment: shoes50, layerPosition: 0 },
        ],
        primaryStyleSlug: "old-money",
        formality: 3,
        compatibleOccasions: ["office", "job-interview", "dinner", "social", "travel", "wedding-guest", "custom"],
        seasonality: ["fall", "winter"],
        silhouetteBalance: "Streamlined fine knit bodice balanced by rhythmic knife pleat flare",
        colorStory: "Warm camel cashmere and deep obsidian black wool",
      });
    }

    // Outfit 51: Feminine Peplum Blouse & Tailored Wool Trousers (Workplace/Interview Formality 3-4)
    const top51 = knowledgeBase.getGarmentBySlug("poplin-peplum-blouse-white") || knowledgeBase.getAllGarments()[0];
    const bot51 = knowledgeBase.getGarmentBySlug("high-rise-wool-trousers-black") || knowledgeBase.getAllGarments()[1];
    const shoes51 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    if (top51 && bot51 && shoes51) {
      outfits.push({
        id: "outfit_feminine_workplace_peplum_separates_01",
        title: "Fitted Poplin Peplum Blouse & Wide Wool Trousers",
        description: "Crisp white cotton poplin peplum blouse with sculpted waist contour over wide fluid black trousers and kitten heels.",
        items: [
          { garment: top51, layerPosition: 0 },
          { garment: bot51, layerPosition: 0 },
          { garment: shoes51, layerPosition: 0 },
        ],
        primaryStyleSlug: "smart-casual",
        formality: 3,
        compatibleOccasions: ["office", "job-interview", "dinner", "date", "social", "custom"],
        seasonality: ["spring", "summer", "fall", "all-season"],
        silhouetteBalance: "Cinched waist peplum architectural flare counterbalancing straight trouser leg",
        colorStory: "Crisp high-contrast monochrome: pure white poplin and black virgin wool",
      });
    }

    // Outfit 52: Feminine Ballet Wrap Cardigan & Fluid Wide-Leg Trousers (Mild/Cool Casual & Workplace Formality 2-3)
    const top52 = knowledgeBase.getGarmentBySlug("merino-ballet-wrap-top-oatmeal") || knowledgeBase.getAllGarments()[0];
    const bot52 = knowledgeBase.getGarmentBySlug("high-rise-fluid-trousers-camel") || knowledgeBase.getAllGarments()[1];
    const shoes52 = knowledgeBase.getGarmentBySlug("unstructured-leather-ballet-flats-black") || knowledgeBase.getAllGarments()[2];
    if (top52 && bot52 && shoes52) {
      outfits.push({
        id: "outfit_feminine_merino_wrap_trousers_separates_01",
        title: "Merino Ballet Wrap Top & Fluid Camel Trousers",
        description: "Fine merino surplice ballet wrap top tied at waist over high-rise pleated camel trousers and glove leather flats.",
        items: [
          { garment: top52, layerPosition: 0 },
          { garment: bot52, layerPosition: 0 },
          { garment: shoes52, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 2,
        compatibleOccasions: ["casual", "travel", "office", "university-college", "social", "custom"],
        seasonality: ["fall", "spring", "winter"],
        silhouetteBalance: "Fitted wrap bodice defining upper torso over expansive fluid trouser leg",
        colorStory: "Soft oatmeal melange merino knit and rich camel pleated wool",
      });
    }

    // Outfit 53: Masculine Tropical Hopsack Blazer & Fresco Trousers (Hot Weather Interview/Workplace Formality 4)
    const top53 = knowledgeBase.getGarmentBySlug("poplin-point-shirt-sky-blue") || knowledgeBase.getAllGarments()[0];
    const outer53 = knowledgeBase.getGarmentBySlug("unlined-tropical-hopsack-blazer-navy");
    const bot53 = knowledgeBase.getGarmentBySlug("tropical-wool-trousers-charcoal") || knowledgeBase.getAllGarments()[1];
    const shoes53 = knowledgeBase.getGarmentBySlug("cap-toe-oxfords-black") || knowledgeBase.getAllGarments()[2];
    if (top53 && bot53 && shoes53) {
      outfits.push({
        id: "outfit_masculine_tropical_wool_hopsack_interview_01",
        title: "Tropical Hopsack Blazer & Fresco Wool Trousers",
        description: "Unlined open-weave tropical hopsack blazer over sky blue 140s cotton poplin shirt, high-twist fresco wool trousers, and full-grain cap-toe oxfords.",
        items: [
          { garment: top53, layerPosition: 0 },
          ...(outer53 ? [{ garment: outer53, layerPosition: 1 }] : []),
          { garment: bot53, layerPosition: 0 },
          { garment: shoes53, layerPosition: 0 },
        ],
        primaryStyleSlug: "smart-casual",
        formality: 4,
        compatibleOccasions: ["job-interview", "office", "wedding-guest", "dinner", "social", "custom"],
        seasonality: ["summer", "spring", "all-season"],
        silhouetteBalance: "Clean linear tailored shoulder descending into crisp mid-rise crease drape",
        colorStory: "Sky blue poplin, deep navy hopsack, and charcoal fresco wool",
      });
    }

    // Outfit 54: Masculine Linen-Silk Blazer & Cotton-Linen Trousers (Hot Weather Workplace/Interview Formality 4)
    const top54 = knowledgeBase.getGarmentBySlug("poplin-point-shirt-sky-blue") || knowledgeBase.getAllGarments()[0];
    const outer54 = knowledgeBase.getGarmentBySlug("unlined-linen-silk-blazer-tobacco");
    const bot54 = knowledgeBase.getGarmentBySlug("tailored-cotton-linen-trousers-sand") || knowledgeBase.getAllGarments()[1];
    const shoes54 = knowledgeBase.getGarmentBySlug("plain-toe-derbies-espresso") || knowledgeBase.getAllGarments()[2];
    if (top54 && bot54 && shoes54) {
      outfits.push({
        id: "outfit_masculine_summer_linen_silk_interview_01",
        title: "Deconstructed Linen-Silk Blazer & Cotton-Linen Trousers",
        description: "Unlined tobacco linen-silk blazer paired with 140s poplin shirt, tailored sand cotton-linen trousers, and plain-toe burnished calf derbies.",
        items: [
          { garment: top54, layerPosition: 0 },
          ...(outer54 ? [{ garment: outer54, layerPosition: 1 }] : []),
          { garment: bot54, layerPosition: 0 },
          { garment: shoes54, layerPosition: 0 },
        ],
        primaryStyleSlug: "old-money",
        formality: 4,
        compatibleOccasions: ["job-interview", "office", "dinner", "social", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Soft natural shoulder ease balanced by side-adjusted tailored leg line",
        colorStory: "Tobacco linen-silk, sand flax weave, and burnished espresso calfskin",
      });
    }

    // Outfit 55: Masculine Silk-Merino Knit Polo & Fresco Trousers (Workplace/Interview Formality 4)
    const top55 = knowledgeBase.getGarmentBySlug("silk-merino-knit-polo-navy") || knowledgeBase.getAllGarments()[0];
    const outer55 = knowledgeBase.getGarmentBySlug("unlined-tropical-hopsack-blazer-navy");
    const bot55 = knowledgeBase.getGarmentBySlug("tropical-wool-trousers-charcoal") || knowledgeBase.getAllGarments()[1];
    const shoes55 = knowledgeBase.getGarmentBySlug("split-toe-derbies-black") || knowledgeBase.getAllGarments()[2];
    if (top55 && bot55 && shoes55) {
      outfits.push({
        id: "outfit_masculine_fine_knit_hopsack_separates_01",
        title: "Fine Silk-Merino Knit Polo & Fresco Wool Trousers",
        description: "Fine 20-gauge navy silk-merino knit polo paired under unlined hopsack blazer with high-twist fresco trousers and split-toe derbies.",
        items: [
          { garment: top55, layerPosition: 0 },
          ...(outer55 ? [{ garment: outer55, layerPosition: 1 }] : []),
          { garment: bot55, layerPosition: 0 },
          { garment: shoes55, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 4,
        compatibleOccasions: ["job-interview", "office", "dinner", "social", "custom"],
        seasonality: ["summer", "spring", "fall"],
        silhouetteBalance: "Streamlined fine gauge knit collar grounding unlined architectural jacket",
        colorStory: "Deep navy and charcoal monochrome with black leather anchor",
      });
    }

    // Outfit 56: Masculine Fine Marcella Bib Formal Look (Formality 5 Ceremony/Gala/Wedding)
    const top56 = knowledgeBase.getGarmentBySlug("pique-marcella-formal-shirt-white") || knowledgeBase.getAllGarments()[0];
    const bot56 = knowledgeBase.getGarmentBySlug("tropical-wool-trousers-charcoal") || knowledgeBase.getAllGarments()[1];
    const shoes56 = knowledgeBase.getGarmentBySlug("cap-toe-oxfords-black") || knowledgeBase.getAllGarments()[2];
    if (top56 && bot56 && shoes56) {
      outfits.push({
        id: "outfit_masculine_formal_white_tie_gala_01",
        title: "Fine Marcella Formal Shirt & Bespoke Tailored Slacks",
        description: "Structured marcella bib Sea Island cotton dress shirt paired with bespoke virgin wool trousers, French calf cap-toe oxfords, and silk bow tie.",
        items: [
          { garment: top56, layerPosition: 0 },
          { garment: bot56, layerPosition: 0 },
          { garment: shoes56, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "party", "cultural-traditional", "social", "custom"],
        seasonality: ["summer", "spring", "fall", "all-season"],
        silhouetteBalance: "Crisp marcella chest geometry framing sharp vertical trouser press line",
        colorStory: "Optic pure white marcella and deep charcoal worsted wool",
      });
    }

    // Outfit 57: Feminine Hot Lavallière Blouse & Linen Twill Column Maxi Skirt (Hot/Formal/Modest Formality 4)
    const top57 = knowledgeBase.getGarmentBySlug("silk-georgette-tie-neck-blouse-ivory") || knowledgeBase.getAllGarments()[0];
    const bot57 = knowledgeBase.getGarmentBySlug("linen-twill-maxi-skirt-natural") || knowledgeBase.getAllGarments()[1];
    const shoes57 = knowledgeBase.getGarmentBySlug("unstructured-leather-ballet-flats-black") || knowledgeBase.getAllGarments()[2];
    if (top57 && bot57 && shoes57) {
      outfits.push({
        id: "outfit_feminine_hot_linen_twill_separates_01",
        title: "Silk Lavallière Blouse & Linen Twill Column Maxi Skirt",
        description: "Silk georgette tie-neck blouse paired with tailored Normandy linen twill column maxi skirt and unstructured leather flats.",
        items: [
          { garment: top57, layerPosition: 0 },
          { garment: bot57, layerPosition: 0 },
          { garment: shoes57, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 4,
        compatibleOccasions: ["wedding-guest", "dinner", "office", "job-interview", "social", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Fluid tie collar framing streamlined high-rise column maxi skirt",
        colorStory: "Ivory silk georgette paired with natural flax linen twill",
      });
    }

    // Outfit 58: Feminine Hot Peplum Blouse & Heavy Silk Crepe Midi Skirt (Hot/Formal/Modest Formality 4)
    const top58 = knowledgeBase.getGarmentBySlug("poplin-peplum-blouse-white") || knowledgeBase.getAllGarments()[0];
    const bot58 = knowledgeBase.getGarmentBySlug("heavy-silk-crepe-midi-skirt-navy") || knowledgeBase.getAllGarments()[1];
    const shoes58 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    if (top58 && bot58 && shoes58) {
      outfits.push({
        id: "outfit_feminine_hot_crepe_midi_separates_01",
        title: "Poplin Peplum Blouse & Heavy Silk Crepe Fluted Midi Skirt",
        description: "Sculpted white cotton poplin peplum blouse paired with high-rise navy heavy silk crepe fluted midi skirt and pointed kitten heels.",
        items: [
          { garment: top58, layerPosition: 0 },
          { garment: bot58, layerPosition: 0 },
          { garment: shoes58, layerPosition: 0 },
        ],
        primaryStyleSlug: "smart-casual",
        formality: 4,
        compatibleOccasions: ["job-interview", "office", "dinner", "wedding-guest", "social", "custom"],
        seasonality: ["summer", "spring", "all-season"],
        silhouetteBalance: "Architectural cinched waist contour over fluid fluted midi hemline",
        colorStory: "Pure white cotton poplin and deep navy silk crepe de chine",
      });
    }

    // Outfit 59: Feminine High-Neck Silk Crepe Column Gown (Hot/Formal/Modest Formality 5)
    const dress59 = knowledgeBase.getGarmentBySlug("silk-crepe-column-gown-emerald") || knowledgeBase.getAllGarments()[0];
    const shoes59 = knowledgeBase.getGarmentBySlug("pointed-kitten-heels-black") || knowledgeBase.getAllGarments()[2];
    if (dress59 && shoes59) {
      outfits.push({
        id: "outfit_feminine_hot_formal_column_gown_01",
        title: "High-Neck Silk Crepe Column Gown",
        description: "Architectural floor-length emerald silk georgette column gown with high-neckline and pointed kitten heels.",
        items: [
          { garment: dress59, layerPosition: 0 },
          { garment: shoes59, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "party", "cultural-traditional", "social", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Monolithic high-neck column drape sweeping to floor length",
        colorStory: "Deep jewel emerald silk georgette grounded with noir calfskin",
      });
    }

    // Outfit 60: Feminine Cold Wool Flannel Maxi Skirt Separates (Cold/Formal/Modest Formality 5)
    const top60 = knowledgeBase.getGarmentBySlug("cashmere-silk-mockneck-top-camel") || knowledgeBase.getAllGarments()[0];
    const outer60 = knowledgeBase.getGarmentBySlug("belted-wool-wrap-coat-camel");
    const bot60 = knowledgeBase.getGarmentBySlug("wool-flannel-maxi-skirt-charcoal") || knowledgeBase.getAllGarments()[1];
    const shoes60 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    if (top60 && bot60 && shoes60) {
      outfits.push({
        id: "outfit_feminine_cold_wool_flannel_separates_01",
        title: "Cashmere Mockneck & Architectural Wool Flannel Maxi Skirt",
        description: "Camel cashmere-silk mockneck knit tucked into structured charcoal virgin wool flannel maxi skirt, belted wrap coat, and calfskin boots.",
        items: [
          { garment: top60, layerPosition: 0 },
          ...(outer60 ? [{ garment: outer60, layerPosition: 1 }] : []),
          { garment: bot60, layerPosition: 0 },
          { garment: shoes60, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "office", "job-interview", "social", "custom"],
        seasonality: ["winter", "fall"],
        silhouetteBalance: "Streamlined fine knit bodice grounded by heavy architectural inverted-pleat maxi flare",
        colorStory: "Warm camel cashmere and charcoal worsted wool flannel",
      });
    }

    // Outfit 61: Feminine Cold Virgin Wool Sheath Dress (Cold/Formal Formality 5)
    const dress61 = knowledgeBase.getGarmentBySlug("wool-crepe-sheath-dress-black") || knowledgeBase.getAllGarments()[0];
    const outer61 = knowledgeBase.getGarmentBySlug("double-breasted-wool-overcoat-black");
    const shoes61 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    if (dress61 && shoes61) {
      outfits.push({
        id: "outfit_feminine_cold_sheath_dress_01",
        title: "Virgin Wool Crepe Sheath Dress & Tailored Wool Coat",
        description: "Boat-neck long-sleeve virgin wool crepe sheath dress paired with double-breasted wool overcoat and block-heel calfskin boots.",
        items: [
          { garment: dress61, layerPosition: 0 },
          ...(outer61 ? [{ garment: outer61, layerPosition: 1 }] : []),
          { garment: shoes61, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 5,
        compatibleOccasions: ["job-interview", "office", "dinner", "wedding-guest", "cultural-traditional", "social", "custom"],
        seasonality: ["winter", "fall"],
        silhouetteBalance: "Sculpted boat-neck sheath silhouette protected by tailored structured overcoat",
        colorStory: "Monochrome pitch black virgin wool crepe and calfskin",
      });
    }

    // Outfit 62: Feminine Cold Silk Velvet Evening Gown (Cold/Formal Formality 5)
    const dress62 = knowledgeBase.getGarmentBySlug("silk-velvet-evening-gown-midnight") || knowledgeBase.getAllGarments()[0];
    const shoes62 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    if (dress62 && shoes62) {
      outfits.push({
        id: "outfit_feminine_cold_velvet_evening_gown_01",
        title: "Silk Velvet Evening Gown & Calfskin Boots",
        description: "Midnight blue draped long-sleeve silk velvet evening gown with structured shoulders and sleek block-heel calfskin boots.",
        items: [
          { garment: dress62, layerPosition: 0 },
          { garment: shoes62, layerPosition: 0 },
        ],
        primaryStyleSlug: "formal",
        formality: 5,
        compatibleOccasions: ["wedding-guest", "dinner", "party", "cultural-traditional", "custom"],
        seasonality: ["winter", "fall"],
        silhouetteBalance: "Structured shoulder pads giving way to liquid cascading velvet drape",
        colorStory: "Luminous midnight blue velvet with high light absorption and depth",
      });
    }

    // Outfit 63: Feminine Cold Accordion Pleated Skirt Separates (Cold/Workplace Formality 4)
    const top63 = knowledgeBase.getGarmentBySlug("cashmere-silk-mockneck-top-camel") || knowledgeBase.getAllGarments()[0];
    const bot63 = knowledgeBase.getGarmentBySlug("wool-accordion-pleated-skirt-burgundy") || knowledgeBase.getAllGarments()[1];
    const shoes63 = knowledgeBase.getGarmentBySlug("block-heel-calfskin-boots-black") || knowledgeBase.getAllGarments()[2];
    if (top63 && bot63 && shoes63) {
      outfits.push({
        id: "outfit_feminine_cold_accordion_pleat_separates_01",
        title: "Cashmere Mockneck & Accordion Pleated Wool Skirt",
        description: "Fine camel cashmere mockneck paired with deep burgundy accordion pleated fine wool crepe skirt and calfskin boots.",
        items: [
          { garment: top63, layerPosition: 0 },
          { garment: bot63, layerPosition: 0 },
          { garment: shoes63, layerPosition: 0 },
        ],
        primaryStyleSlug: "old-money",
        formality: 4,
        compatibleOccasions: ["dinner", "office", "job-interview", "wedding-guest", "social", "custom"],
        seasonality: ["winter", "fall"],
        silhouetteBalance: "Streamlined close-fitting mockneck above rhythmic kinetic accordion pleats",
        colorStory: "Warm camel cashmere contrasted against rich deep burgundy wool",
      });
    }

    // Outfit 64: Masculine Hot Casual Poplin & Tailored Cotton-Linen Trousers (Casual, College, Travel Formality 2)
    const top64 = knowledgeBase.getGarmentBySlug("poplin-point-shirt-sky-blue") || knowledgeBase.getAllGarments()[0];
    const bot64 = knowledgeBase.getGarmentBySlug("tailored-cotton-linen-trousers-sand") || knowledgeBase.getAllGarments()[1];
    const shoes64 = knowledgeBase.getGarmentBySlug("minimal-leather-sneaker-white") || knowledgeBase.getAllGarments()[2];
    if (top64 && bot64 && shoes64) {
      outfits.push({
        id: "outfit_masculine_summer_linen_chinos_casual_01",
        title: "Sky Blue Poplin Shirt & Tailored Cotton-Linen Trousers",
        description: "Breathable 140s sky blue cotton poplin shirt with sleeves rolled up, sand tailored cotton-linen trousers, and minimal white leather sneakers.",
        items: [
          { garment: top64, layerPosition: 0 },
          { garment: bot64, layerPosition: 0 },
          { garment: shoes64, layerPosition: 0 },
        ],
        primaryStyleSlug: "smart-casual",
        formality: 2,
        compatibleOccasions: ["casual", "university-college", "travel", "social", "party", "custom"],
        seasonality: ["summer", "spring"],
        silhouetteBalance: "Relaxed unbuttoned collar ease descending into crisp tailored sand trouser line",
        colorStory: "Sky blue poplin, sand cotton-linen weave, and clean white leather",
      });
    }

    // Outfit 65: Volumetric Boiled Wool Overshirt & Tailored Slacks (Dinner, Social Formality 3)
    const top65 = knowledgeBase.getGarmentBySlug("boiled-wool-overshirt-charcoal") || knowledgeBase.getAllGarments()[0];
    const bot65 = knowledgeBase.getGarmentBySlug("high-rise-wool-trousers-black") || knowledgeBase.getAllGarments()[1];
    const shoes65 = knowledgeBase.getGarmentBySlug("horsebit-loafer-black") || knowledgeBase.getAllGarments()[2];
    if (top65 && bot65 && shoes65) {
      outfits.push({
        id: "outfit_volumetric_overshirt_tailored_slacks_01",
        title: "Volumetric Boiled Wool Overshirt & Slim Wool Slacks",
        description: "Volumetric 420gsm boiled wool overshirt balanced over streamlined high-rise tailored wool trousers and horsebit loafers.",
        items: [
          { garment: top65, layerPosition: 0 },
          { garment: bot65, layerPosition: 0 },
          { garment: shoes65, layerPosition: 0 },
        ],
        primaryStyleSlug: "minimal",
        formality: 3,
        compatibleOccasions: ["dinner", "social", "party", "date", "casual", "custom"],
        seasonality: ["fall", "winter", "spring"],
        silhouetteBalance: "Volumetric upper architecture anchored by slim streamlined leg line",
        colorStory: "Charcoal boiled wool and pitch black tailoring",
      });
    }

    return outfits;
  }
}

