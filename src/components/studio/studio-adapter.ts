import { VaelStylingEngine } from '../../core/intelligence/engine';
import { knowledgeBase } from '../../core/knowledge';
import { ClimateFabricRules } from '../../core/knowledge/climate';
import { Garment, Outfit, OutfitItem } from '../../core/domain';
import { User } from '../../core/domain/user';
import { Context } from '../../core/domain/context';
import { StudioLookState, StudioPieceSlot, StudioSlotType, AvatarAppearance } from './types';

export class StudioAdapter {
  /**
   * Initializes a StudioLookState from an existing CompleteLook or top candidate
   */
  static fromOutfit(
    outfit: Outfit,
    user: User,
    context?: Context,
    alternativeIndex?: number,
    isCustom: boolean = false
  ): StudioLookState {
    const [evalResult] = VaelStylingEngine.getRankedCandidateLooks({
      user,
      context,
      candidateOutfits: [outfit],
    });

    const totalScore = evalResult ? evalResult.totalScore : 0.85;
    const reasons =
      evalResult?.reasons?.length ? evalResult.reasons : ['Curated balanced aesthetic pairing.'];
    const cautions = evalResult?.cautions || [];

    const confidenceState: 'STRONG' | 'GOOD' | 'EXPLORATORY' =
      totalScore >= 0.82 && cautions.length === 0
        ? 'STRONG'
        : totalScore >= 0.68
          ? 'GOOD'
          : 'EXPLORATORY';

    const confidence = {
      state: confidenceState,
      score: totalScore,
      explanation:
        confidenceState === 'STRONG'
          ? 'High architectural harmony and climate alignment.'
          : confidenceState === 'GOOD'
            ? 'Solid balance across formality and color.'
            : 'Exploratory look with creative contrast.',
    };

    const slots: Record<StudioSlotType, StudioPieceSlot | null> = {
      top: null,
      bottom: null,
      'one-piece': null,
      outerwear: null,
      footwear: null,
      accessory: null,
    };

    for (const item of outfit.items) {
      const g = item.garment;
      if (g.category === 'one-piece') {
        slots['one-piece'] = {
          slotType: 'one-piece',
          garment: g,
          layerPosition: item.layerPosition,
          stylingNote: item.stylingNote,
          isLocked: false,
        };
      } else if (g.category === 'top') {
        slots.top = {
          slotType: 'top',
          garment: g,
          layerPosition: item.layerPosition,
          stylingNote: item.stylingNote,
          isLocked: false,
        };
      } else if (g.category === 'bottom') {
        slots.bottom = {
          slotType: 'bottom',
          garment: g,
          layerPosition: item.layerPosition,
          stylingNote: item.stylingNote,
          isLocked: false,
        };
      } else if (g.category === 'outerwear') {
        slots.outerwear = {
          slotType: 'outerwear',
          garment: g,
          layerPosition: item.layerPosition,
          stylingNote: item.stylingNote,
          isLocked: false,
        };
      } else if (g.category === 'footwear') {
        slots.footwear = {
          slotType: 'footwear',
          garment: g,
          layerPosition: item.layerPosition,
          stylingNote: item.stylingNote,
          isLocked: false,
        };
      } else if (g.category === 'accessory' && !slots.accessory) {
        slots.accessory = {
          slotType: 'accessory',
          garment: g,
          layerPosition: item.layerPosition,
          stylingNote: item.stylingNote,
          isLocked: false,
        };
      }
    }

    return {
      id: outfit.id,
      title: outfit.title,
      isCustom,
      alternativeIndex,
      confidence: {
        state: confidence.state,
        score: confidence.score,
        explanation: confidence.explanation,
      },
      reasons: evalResult.reasons,
      cautions: evalResult.cautions,
      slots,
      outfit,
      totalScore: evalResult.totalScore,
    };
  }

  /**
   * Retrieves the full ranked candidate list (read-only) beyond the top 3
   */
  static getRankedPool(user: User, context?: Context): Outfit[] {
    let resolvedContext = context;
    if (context && (typeof (context as any).occasion === 'string' || !context.occasion?.allowableFormalityRange)) {
      const slug = typeof (context as any).occasion === 'string' ? (context as any).occasion : 'dinner';
      resolvedContext = {
        ...context,
        occasion: knowledgeBase.getOccasionBySlug(slug) || knowledgeBase.getAllOccasions()[0],
      };
    } else if (!context) {
      resolvedContext = {
        occasion: knowledgeBase.getOccasionBySlug('dinner') || knowledgeBase.getAllOccasions()[0],
      };
    }
    const evaluations = VaelStylingEngine.getRankedCandidateLooks({ user, context: resolvedContext });
    return evaluations.map((e) => e.outfit);
  }

  /**
   * Finds the next best look differing by >= 2 style axes or its foundation piece,
   * preserving all locked garments.
   */
  static getNextShuffleLook(
    currentLook: StudioLookState,
    rankedPool: Outfit[],
    user: User,
    context: Context | undefined,
    lockedSlugs: Set<string>,
    viewedLookIds: Set<string>,
    currentIndex: number
  ): StudioLookState | null {
    const lockedGarments = Array.from(lockedSlugs)
      .map((slug) => knowledgeBase.getGarmentBySlug(slug))
      .filter((g): g is Garment => g !== undefined);

    const currentGarments = currentLook.outfit.items.map((i) => i.garment);
    const currentFoundation = currentGarments.find((g) => g.category === 'top' || g.category === 'one-piece');

    // Search through ranked pool beyond top 3 for candidate matching criteria
    for (let i = 0; i < rankedPool.length; i++) {
      const candidateOutfit = rankedPool[i];
      if (candidateOutfit.id === currentLook.id) continue;
      if (viewedLookIds.has(candidateOutfit.id)) continue;

      const candidateGarments = candidateOutfit.items.map((it) => it.garment);

      // Check locked garments constraint: all locked garments must be present or compatible
      const hasAllLocked = lockedGarments.every((lg) =>
        candidateGarments.some((cg) => cg.slug === lg.slug || cg.id === lg.id)
      );

      // If candidate does not have locked pieces, inject locked pieces if compatible
      let finalOutfit: Outfit = candidateOutfit;
      if (!hasAllLocked && lockedGarments.length > 0) {
        const injected = this.injectLockedPieces(candidateOutfit, lockedGarments);
        if (!injected) continue;
        finalOutfit = injected;
      }

      // Check difference criteria: >= 2 style axes OR foundation piece difference
      const candFoundation = finalOutfit.items.map((it) => it.garment).find((g) => g.category === 'top' || g.category === 'one-piece');
      const isFoundationDifferent = !currentFoundation || !candFoundation || currentFoundation.id !== candFoundation.id;

      let axisDiffs = 0;
      if (finalOutfit.formality !== currentLook.outfit.formality) axisDiffs++;
      if (finalOutfit.primaryStyleSlug !== currentLook.outfit.primaryStyleSlug) axisDiffs++;

      const avgStructCand = finalOutfit.items.reduce((s, it) => s + it.garment.structure, 0) / finalOutfit.items.length;
      const avgStructCurr = currentGarments.reduce((s, g) => s + g.structure, 0) / currentGarments.length;
      if (Math.abs(avgStructCand - avgStructCurr) >= 0.5) axisDiffs++;

      const isSufficientlyDistinct = isFoundationDifferent || axisDiffs >= 2;
      if (!isSufficientlyDistinct) continue;

      // Found valid shuffle candidate
      const isCustom = lockedGarments.length > 0;
      return this.fromOutfit(finalOutfit, user, context, currentIndex + 1, isCustom);
    }

    return null;
  }

  /**
   * Injects locked garments into an outfit replacement slot if compatible
   */
  private static injectLockedPieces(outfit: Outfit, lockedGarments: Garment[]): Outfit | null {
    const items: OutfitItem[] = [];
    const usedCategories = new Set<string>();

    for (const lg of lockedGarments) {
      items.push({ garment: lg, layerPosition: lg.category === 'outerwear' ? 1 : 0 });
      usedCategories.add(lg.category);
    }

    for (const item of outfit.items) {
      if (!usedCategories.has(item.garment.category)) {
        items.push(item);
        usedCategories.add(item.garment.category);
      }
    }

    return {
      ...outfit,
      id: `custom_locked_${Date.now()}_${outfit.id}`,
      title: `${outfit.title} (Personalized)`,
      items,
    };
  }

  /**
   * Retrieves compatible alternatives for a specific slot, ranked by compatibility
   */
  static getCompatibleSlotAlternatives(
    slotType: StudioSlotType,
    currentLook: StudioLookState,
    user: User,
    context?: Context
  ): Array<{ garment: Garment; compatibilityScore: number; reason: string }> {
    const allGarments = knowledgeBase.getAllGarments();
    const currentGarment = currentLook.slots[slotType]?.garment;

    // Filter by matching category
    const candidates = allGarments.filter((g) => {
      if (g.slug === currentGarment?.slug) return false;
      if (slotType === 'one-piece') return g.category === 'one-piece';
      if (slotType === 'top') return g.category === 'top';
      if (slotType === 'bottom') return g.category === 'bottom';
      if (slotType === 'outerwear') return g.category === 'outerwear';
      if (slotType === 'footwear') return g.category === 'footwear';
      if (slotType === 'accessory') return g.category === 'accessory';
      return false;
    });

    const results = candidates.map((garment) => {
      let score = 0.7;
      let reason = 'Compatible silhouette';

      // Climate fit
      if (context) {
        const cFit = ClimateFabricRules.evaluateGarmentClimateFit(garment, context);
        if (cFit.isPermissible) {
          score += cFit.score * 0.15;
        } else {
          score -= 0.3;
          reason = cFit.vetoReason || 'Thermal mismatch';
        }
      }

      // Formality match with current look
      const fDiff = Math.abs(garment.formality - currentLook.outfit.formality);
      if (fDiff === 0) {
        score += 0.15;
        reason = `Direct formality match (Level ${garment.formality})`;
      } else if (fDiff === 1) {
        score += 0.05;
        reason = `Adjacent formality step (Level ${garment.formality})`;
      } else {
        score -= 0.2;
      }

      return {
        garment,
        compatibilityScore: Math.max(0.1, Math.min(1.0, score)),
        reason,
      };
    });

    // Sort descending by compatibility score
    results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return results.slice(0, 15);
  }

  /**
   * Performs manual piece swap, recomputes confidence and checks cautions
   */
  static swapPiece(
    currentLook: StudioLookState,
    slotType: StudioSlotType,
    newGarment: Garment,
    user: User,
    context?: Context
  ): StudioLookState {
    const newSlots = { ...currentLook.slots };
    newSlots[slotType] = {
      slotType,
      garment: newGarment,
      layerPosition: slotType === 'outerwear' ? 1 : 0,
      isLocked: true,
    };

    // If one-piece swapped in, clear top and bottom
    if (slotType === 'one-piece') {
      newSlots.top = null;
      newSlots.bottom = null;
    } else if (slotType === 'top' || slotType === 'bottom') {
      newSlots['one-piece'] = null;
    }

    const items: OutfitItem[] = Object.values(newSlots)
      .filter((s): s is StudioPieceSlot => s !== null)
      .map((s) => ({
        garment: s.garment,
        layerPosition: s.layerPosition,
      }));

    const newOutfit: Outfit = {
      ...currentLook.outfit,
      id: `custom_swap_${newGarment.slug}_${Date.now()}`,
      title: `${newGarment.name} Custom Combination`,
      items,
    };

    const [evalResult] = VaelStylingEngine.getRankedCandidateLooks({
      user,
      context,
      candidateOutfits: [newOutfit],
    });

    const totalScore = evalResult ? evalResult.totalScore : 0.82;
    const reasons =
      evalResult?.reasons?.length ? evalResult.reasons : ['Custom curated piece swap.'];
    const cautions = evalResult?.cautions || [];

    const confidenceState: 'STRONG' | 'GOOD' | 'EXPLORATORY' =
      totalScore >= 0.82 && cautions.length === 0
        ? 'STRONG'
        : totalScore >= 0.68
          ? 'GOOD'
          : 'EXPLORATORY';

    const confidence = {
      state: confidenceState,
      score: totalScore,
      explanation:
        cautions.length > 0
          ? `Custom combination with cautions: ${cautions[0]}`
          : confidenceState === 'STRONG'
            ? 'High architectural harmony and climate alignment.'
            : 'Custom look with balanced formality.',
    };

    return {
      id: newOutfit.id,
      title: newOutfit.title,
      isCustom: true,
      confidence,
      reasons,
      cautions,
      slots: newSlots,
      outfit: newOutfit,
      totalScore,
    };
  }

  /**
   * Derives initial avatar appearance from user styleProfile
   */
  static getAvatarAppearance(user: User): AvatarAppearance {
    const prefs = user.styleProfile.preferences;
    const skinDepth = (prefs.skinDepth as any) || 'medium';
    const undertone = (prefs.userConfirmedUndertone as any) || 'neutral';
    const isAssumedTone = !prefs.skinDepth && !prefs.userConfirmedUndertone;

    // Palette map for clay-editorial skin tones
    const toneMap: Record<string, Record<string, string>> = {
      fair: { cool: '#f6ede8', warm: '#f7eee3', neutral: '#f5eee6', olive: '#ebe5da' },
      light: { cool: '#eccfc3', warm: '#edd5be', neutral: '#ecd2c0', olive: '#dfd2ba' },
      medium: { cool: '#c69d89', warm: '#caa284', neutral: '#c79f86', olive: '#bba07e' },
      rich: { cool: '#8c5d49', warm: '#926144', neutral: '#8e5f46', olive: '#816040' },
      deep: { cool: '#4d3027', warm: '#523424', neutral: '#4f3225', olive: '#453322' },
    };

    const skinTone = toneMap[skinDepth]?.[undertone] || '#f0ede6';

    const visual = user.visualProfile;
    const hairTexture = (visual?.hair?.texture as any) || 'straight';
    const hairLength = (visual?.hair?.length as any) || 'short';
    const hasFacialHair = visual?.face?.hasFacialHair;

    return {
      skinTone,
      skinDepth,
      undertone,
      isAssumedTone,
      hairTexture,
      hairLength,
      hairColor: '#1c1b1a',
      facialHairStyle: hasFacialHair ? 'stubble' : undefined,
    };
  }
}
