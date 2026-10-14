import { Garment, Outfit, OutfitItem } from '../domain/fashion';
import { User } from '../domain/user';
import { Context } from '../domain/context';
import { knowledgeBase } from '../knowledge';
import { ClimateFabricRules } from '../knowledge/climate';

export interface GeneratedCompositionPool {
  outfits: Outfit[];
  utilization: {
    totalCatalogGarments: number;
    usedInOutfits: number;
    utilizationPercentage: number;
  };
}

export class CompositionGenerator {
  /**
   * Generates a deterministic, constrained combinatorial candidate pool for a given user and context.
   */
  static generateCandidates(user: User, context?: Context, authoredTemplates: Outfit[] = []): Outfit[] {
    const allGarments = knowledgeBase.getAllGarments();
    const preferences = user.styleProfile.preferences;
    const expr = preferences.styleExpression || preferences.genderCodingDirection || 'no-preference';

    // 1. Partition garments by slot
    const tops: Garment[] = [];
    const bottoms: Garment[] = [];
    const onePieces: Garment[] = [];
    const outerwear: Garment[] = [];
    const footwear: Garment[] = [];
    const accessories: Garment[] = [];

    for (const g of allGarments) {
      if (this.passesSlotHardFilters(g, user, context)) {
        if (g.category === 'top') tops.push(g);
        else if (g.category === 'bottom') bottoms.push(g);
        else if (g.category === 'one-piece') onePieces.push(g);
        else if (g.category === 'outerwear') outerwear.push(g);
        else if (g.category === 'footwear') footwear.push(g);
        else if (g.category === 'accessory') accessories.push(g);
      }
    }

    // 2. Prune each slot to top-K by compatibility to avoid combinatorial explosion
    const prunedTops = this.pruneSlot(tops, user, context, 12);
    const prunedBottoms = this.pruneSlot(bottoms, user, context, 12);
    const prunedOnePieces = this.pruneSlot(onePieces, user, context, 12);
    const prunedOuterwear = this.pruneSlot(outerwear, user, context, 8);
    const prunedFootwear = this.pruneSlot(footwear, user, context, 10);

    const generatedOutfits: Outfit[] = [];
    const outfitKeySet = new Set<string>();

    const tempCelsius = context?.temperatureCelsius;
    const tempLevel = context?.temperatureLevel;
    const isColdOrCool =
      (tempCelsius !== undefined && tempCelsius <= 16) ||
      tempLevel === 'cold' ||
      tempLevel === 'cool';
    const isRain = context?.condition === 'rain' || context?.weather === 'rainy';
    const outerwearRequired = isColdOrCool || isRain;

    // Helper to evaluate and register an outfit
    const tryAddOutfit = (
      foundationItems: Garment[],
      outerGarment: Garment | null,
      shoeGarment: Garment,
      isOnePiece: boolean
    ) => {
      const allOutfitGarments = [...foundationItems];
      if (outerGarment) allOutfitGarments.push(outerGarment);
      allOutfitGarments.push(shoeGarment);

      // Coherence check: formality spread <= 1 (except deliberate high-low)
      const formalities = allOutfitGarments.map((g) => g.formality);
      const minF = Math.min(...formalities);
      const maxF = Math.max(...formalities);
      const isHighLow =
        allOutfitGarments.some((g) => g.category === 'outerwear' && g.formality >= 4) &&
        allOutfitGarments.some((g) => g.category === 'top' && g.formality <= 2);
      if (maxF - minF > 1 && !isHighLow) return;

      // Footwear formality within 1 step of foundation
      const foundationFormality = Math.round(
        foundationItems.reduce((acc, g) => acc + g.formality, 0) / foundationItems.length
      );
      if (Math.abs(shoeGarment.formality - foundationFormality) > 1) return;

      // Coherence: structure spread <= 2
      const structures = allOutfitGarments.map((g) => g.structure);
      const minS = Math.min(...structures);
      const maxS = Math.max(...structures);
      if (maxS - minS > 2) return;

      // Coherence: <= 3 main non-neutral colors plus neutrals
      const nonNeutralColors = new Set(
        allOutfitGarments
          .filter((g) => g.color.tone !== 'neutral')
          .map((g) => g.color.name.toLowerCase())
      );
      if (nonNeutralColors.size > 3) return;

      // Expression alignment
      if (!this.matchesExpressionCriteria(foundationItems, shoeGarment, outerGarment, expr)) {
        return;
      }

      // Compose Outfit Items
      const items: OutfitItem[] = [];
      let layer = 0;
      for (const f of foundationItems) {
        items.push({ garment: f, layerPosition: layer });
      }
      if (outerGarment) {
        items.push({ garment: outerGarment, layerPosition: 1 });
      }
      items.push({ garment: shoeGarment, layerPosition: 0 });

      // Unique deterministic signature
      const garmentIds = allOutfitGarments.map((g) => g.id).sort().join('_');
      if (outfitKeySet.has(garmentIds)) return;
      outfitKeySet.add(garmentIds);

      // Determine Primary Style and Formality
      const dominantStyle =
        foundationItems[0].compatibleStyleSlugs[0] ||
        shoeGarment.compatibleStyleSlugs[0] ||
        'minimal';
      const calculatedFormality = Math.round(
        allOutfitGarments.reduce((acc, g) => acc + g.formality, 0) / allOutfitGarments.length
      ) as any;

      if (context?.targetFormality !== undefined) {
        if (Math.abs(calculatedFormality - context.targetFormality) > 1) return;
      }
      if (preferences.preferredFormalityRange) {
        const [prefMin, prefMax] = preferences.preferredFormalityRange;
        if (calculatedFormality < prefMin || calculatedFormality > prefMax) return;
      }

      const outfitId = `gen_${isOnePiece ? 'onepiece' : 'separates'}_${foundationItems[0].slug}_${shoeGarment.slug}${outerGarment ? `_${outerGarment.slug}` : ''}`;

      generatedOutfits.push({
        id: outfitId,
        title: `${foundationItems[0].name} & ${shoeGarment.name}`,
        description: `Combinatorial composition anchoring ${foundationItems.map((g) => g.name).join(' with ')} alongside ${shoeGarment.name}${outerGarment ? ` under ${outerGarment.name}` : ''}.`,
        items,
        primaryStyleSlug: dominantStyle,
        formality: calculatedFormality,
        compatibleOccasions: context?.occasion ? [context.occasion.slug] : ['custom', 'social', 'casual'],
        seasonality: ['all-season'],
        silhouetteBalance: 'Parametrically balanced proportion and drape',
        colorStory:
          preferences.accentColorTolerance === 'monochromatic' ||
          allOutfitGarments.every((g) => g.color.tone === 'neutral' || g.color.name.toLowerCase().includes('black'))
            ? `Monochromatic tonal progression in ${allOutfitGarments.map((g) => g.color.name).join(', ')}`
            : `${allOutfitGarments.map((g) => g.color.name).join(', ')} chromatic progression`,
        suitTag: foundationItems.every((g) => g.suitTag),
        coOrdTag: foundationItems.every((g) => g.coOrdTag),
      });
    };

    // 3. Compose Separates (Top + Bottom)
    for (const top of prunedTops) {
      for (const bot of prunedBottoms) {
        // Disallow matching same-fabric/same-pattern without suit/coord tag
        const isCoordOrSuit = top.suitTag || bot.suitTag || top.coOrdTag || bot.coOrdTag;
        if (!isCoordOrSuit) {
          const topMat = top.material.toLowerCase();
          const botMat = bot.material.toLowerCase();
          const distinctive = ['seersucker', 'corduroy', 'velvet', 'tweed', 'flannel', 'terry', 'organza', 'tulle'];
          const matchesDistinctive = distinctive.some((f) => topMat.includes(f) && botMat.includes(f));
          const matchesPattern = top.pattern !== 'solid' && top.pattern === bot.pattern;
          if (matchesDistinctive || matchesPattern) continue;
        }

        // Formality spread between separates <= 1 (or deliberate high-low)
        if (Math.abs(top.formality - bot.formality) > 1) continue;

        // Pair with footwear
        for (const shoes of prunedFootwear) {
          if (outerwearRequired) {
            for (const outer of prunedOuterwear) {
              tryAddOutfit([top, bot], outer, shoes, false);
            }
          } else {
            // Optional outerwear
            tryAddOutfit([top, bot], null, shoes, false);
            for (const outer of prunedOuterwear) {
              tryAddOutfit([top, bot], outer, shoes, false);
            }
          }
        }
      }
    }

    // 4. Compose One-Piece (Dresses / Gowns / Jumpsuits)
    for (const onePiece of prunedOnePieces) {
      for (const shoes of prunedFootwear) {
        if (outerwearRequired) {
          for (const outer of prunedOuterwear) {
            tryAddOutfit([onePiece], outer, shoes, true);
          }
        } else {
          tryAddOutfit([onePiece], null, shoes, true);
          for (const outer of prunedOuterwear) {
            tryAddOutfit([onePiece], outer, shoes, true);
          }
        }
      }
    }

    // 5. Combine with Authored Templates (curated anchors)
    const combined: Outfit[] = [];
    const authoredIdSet = new Set<string>();

    for (const t of authoredTemplates) {
      combined.push(t);
      authoredIdSet.add(t.id);
    }

    for (const gen of generatedOutfits) {
      if (!authoredIdSet.has(gen.id)) {
        combined.push(gen);
      }
    }

    return combined;
  }

  /**
   * Slot-level hard filters for garment feasibility
   */
  private static passesSlotHardFilters(garment: Garment, user: User, context?: Context): boolean {
    const preferences = user.styleProfile.preferences;

    // Modesty check
    const modesty = preferences.modestyLevel;
    if (modesty === 'high-coverage' || modesty === 'covered-both') {
      if (
        garment.modestyRating === 'low-coverage' ||
        garment.subcategory.includes('shorts') ||
        garment.subcategory.includes('tank') ||
        (garment.category === 'bottom' && garment.length === 'cropped')
      ) {
        return false;
      }
    } else if (modesty === 'covered-arms') {
      if (garment.category === 'top' && (garment.subcategory.includes('tank') || garment.modestyRating === 'low-coverage')) {
        return false;
      }
    } else if (modesty === 'covered-legs') {
      if (garment.category === 'bottom' && (garment.subcategory.includes('shorts') || garment.modestyRating === 'low-coverage')) {
        return false;
      }
    }

    // Disliked colors
    if (preferences.dislikedColors && preferences.dislikedColors.length > 0) {
      const dislikes = preferences.dislikedColors.map((c) => c.toLowerCase());
      if (dislikes.some((d) => garment.color.name.toLowerCase().includes(d))) {
        return false;
      }
    }

    // Disliked fits
    if (preferences.dislikedFits && preferences.dislikedFits.includes(garment.fit)) {
      return false;
    }

    // Climate fit
    if (context) {
      const climateFit = ClimateFabricRules.evaluateGarmentClimateFit(garment, context);
      if (!climateFit.isPermissible) {
        return false;
      }
      // Rain footwear and outerwear requirements
      const isRain = context.condition === 'rain' || context.weather === 'rainy';
      if (isRain) {
        if (garment.category === 'footwear' && garment.waterResistance === 'none') {
          return false;
        }
        if (garment.category === 'outerwear' && garment.waterResistance === 'none') {
          return false;
        }
      }
    }

    // Occasion dress code restrictions
    if (context?.occasion && Array.isArray(context.occasion.restrictedGarmentCategories)) {
      const restrictions = context.occasion.restrictedGarmentCategories;
      const violates = restrictions.some(
        (r) => garment.subcategory.includes(r) || garment.slug.includes(r) || garment.name.toLowerCase().includes(r)
      );
      if (violates) return false;
    }

    // Occasion formality range and target formality discipline
    if (context?.occasion && Array.isArray(context.occasion.allowableFormalityRange) && !context.isFormalityOverridden) {
      const [minF, maxF] = context.occasion.allowableFormalityRange;
      if (garment.formality < minF - 1 || garment.formality > maxF + 1) {
        return false;
      }
    }

    if (context?.targetFormality !== undefined) {
      if (Math.abs(garment.formality - context.targetFormality) > 1) {
        return false;
      }
    }

    if (preferences.preferredFormalityRange) {
      const [prefMin, prefMax] = preferences.preferredFormalityRange;
      if (garment.formality < prefMin - 1 || garment.formality > prefMax + 1) {
        return false;
      }
    }

    // Ceremonial evening piece isolation
    const isCeremonial =
      garment.subcategory.includes('gown') ||
      garment.subcategory.includes('tuxedo') ||
      garment.slug.includes('tuxedo') ||
      garment.slug.includes('marcella') ||
      garment.slug.includes('white-tie') ||
      garment.slug.includes('patent-evening');

    if (isCeremonial && context?.occasion) {
      const occSlug = context.occasion.slug;
      const isEveningWedding =
        occSlug === 'wedding-guest' &&
        (context.subParameter === 'evening' ||
          context.timeOfDay === 'evening' ||
          context.timeOfDay === 'night' ||
          context.targetFormality === 5);
      const isCultural = occSlug === 'cultural-traditional';
      const isFineDining = occSlug === 'dinner' && (context.targetFormality === 5 || garment.formality === 5);
      const isCustomCeremonial = occSlug === 'custom' && (context.targetFormality === 5 || garment.formality === 5);

      if (!isEveningWedding && !isCultural && !isFineDining && !isCustomCeremonial) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluates slot candidates and selects top K by affinity
   */
  private static pruneSlot(items: Garment[], user: User, context: Context | undefined, k: number): Garment[] {
    if (items.length <= k) return items;

    const scored = items.map((g) => {
      let score = 0;
      // Formality affinity
      const targetF = context?.targetFormality || context?.occasion?.defaultFormality || 3;
      score += 1.0 - Math.abs(g.formality - targetF) * 0.2;

      // Style affinity
      const preferredStyles = user.styleProfile.preferences.preferredStyleSlugs || [];
      const hasStyleMatch = preferredStyles.some((s) => g.compatibleStyleSlugs.includes(s));
      if (hasStyleMatch) score += 0.3;

      // Vintage era affinity
      if (user.styleProfile.preferences.vintageEra && g.vintageEra === user.styleProfile.preferences.vintageEra) {
        score += 1.0;
      }

      // Climate bonus
      if (context) {
        const cFit = ClimateFabricRules.evaluateGarmentClimateFit(g, context);
        score += cFit.score * 0.4;
      }

      return { garment: g, score };
    });

    // Deterministic sort: score descending, then slug ascending
    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.garment.slug.localeCompare(b.garment.slug)));

    return scored.slice(0, k).map((s) => s.garment);
  }

  /**
   * Verifies expression alignment for foundation and outerwear
   */
  private static matchesExpressionCriteria(
    foundation: Garment[],
    footwear: Garment,
    outer: Garment | null,
    expression: string
  ): boolean {
    if (expression === 'no-preference' || expression === 'unspecified') return true;

    const evalPieces = [...foundation];
    if (outer) evalPieces.push(outer);

    const sum = evalPieces.reduce((acc, g) => {
      const coding =
        g.garmentCoding !== undefined
          ? g.garmentCoding
          : g.genderCoding === 'feminine'
            ? 1.0
            : g.genderCoding === 'masculine'
              ? -1.0
              : 0;
      return acc + coding;
    }, 0);
    const mean = sum / evalPieces.length;

    if (expression === 'feminine') {
      return mean >= 0.25;
    } else if (expression === 'masculine') {
      return mean <= -0.25;
    } else if (expression === 'androgynous') {
      const hasFluidNonFootwear = evalPieces.some((g) => g.fluidTag === true);
      const allFoundations = [...evalPieces, footwear];
      const fluidFoundationCount = allFoundations.filter((g) => g.fluidTag === true).length;
      return Math.abs(mean) <= 0.25 && (hasFluidNonFootwear || fluidFoundationCount >= 2);
    }
    return true;
  }
}
