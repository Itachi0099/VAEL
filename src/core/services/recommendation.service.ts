import { HairStyle, BeardStyle } from '../domain/grooming';
import { Outfit, Garment } from '../domain/fashion';
import { Context } from '../domain/context';
import { VisualProfile } from '../domain/visual';
import { PreferenceProfile, FeedbackProfile } from '../domain/user';
import { RankedResults, Recommendation } from '../domain/recommendation';
import { knowledgeBase } from '../knowledge';
import { HairCompatibilityEvaluator } from '../intelligence/hair-compatibility';
import { GroomingCompatibilityEvaluator } from '../intelligence/grooming-compatibility';
import { OutfitCompatibilityEvaluator } from '../intelligence/outfit-compatibility';
import { StyleCompatibilityEngine, StyleMatchResult } from '../intelligence/style-compatibility';

export interface RecommendationQueryOptions {
  visual?: VisualProfile;
  context?: Context;
  preferences?: PreferenceProfile;
  feedback?: FeedbackProfile;
  limit?: number;
}

export interface OutfitElevationResult {
  originalOutfit: Outfit;
  elevatedOutfit: Outfit;
  elevationDeltaScore: number;
  elevationsApplied: string[];
  stylingDirectives: string[];
}

export interface OutfitAnalysisResult {
  outfit: Outfit;
  overallScore: number;
  harmonyFactors: {
    colorCohesion: string;
    silhouetteBalance: string;
    occasionCalibration: string;
    weatherFitness: string;
  };
  strengths: string[];
  refinementsSuggested: string[];
  stylingTips: string[];
}

export class RecommendationService {
  /**
   * 1. generateHairRecommendations
   */
  generateHairRecommendations(options: RecommendationQueryOptions = {}): RankedResults<HairStyle> {
    const allHairstyles = knowledgeBase.getAllHairstyles();

    const evaluated: Recommendation<HairStyle>[] = allHairstyles.map((hair) =>
      HairCompatibilityEvaluator.evaluate(hair, {
        visual: options.visual,
        context: options.context,
        preferences: options.preferences,
        feedback: options.feedback,
      })
    );

    // Sort descending by score
    evaluated.sort((a, b) => b.score - a.score);

    const limit = options.limit || 5;
    const topResults = evaluated.slice(0, limit);

    return {
      recommendations: topResults,
      totalEvaluated: allHairstyles.length,
      contextApplied: options.context?.occasion?.name || 'General discovery',
      topAttributesHighlighted: [
        options.visual?.face ? `Face: ${options.visual.face.shape}` : 'Universal face',
        options.visual?.hair ? `Texture: ${options.visual.hair.texture}` : 'Universal texture',
      ],
    };
  }

  /**
   * 2. generateGroomingRecommendations
   */
  generateGroomingRecommendations(options: RecommendationQueryOptions = {}): RankedResults<BeardStyle> {
    const allBeards = knowledgeBase.getAllBeards();

    const evaluated: Recommendation<BeardStyle>[] = allBeards.map((beard) =>
      GroomingCompatibilityEvaluator.evaluate(beard, {
        visual: options.visual,
        context: options.context,
        preferences: options.preferences,
        feedback: options.feedback,
      })
    );

    evaluated.sort((a, b) => b.score - a.score);

    const limit = options.limit || 5;
    const topResults = evaluated.slice(0, limit);

    return {
      recommendations: topResults,
      totalEvaluated: allBeards.length,
      contextApplied: options.context?.occasion?.name || 'General grooming',
      topAttributesHighlighted: [
        options.visual?.face ? `Face: ${options.visual.face.shape}` : 'Universal face',
        options.visual?.face?.beardCharacteristics
          ? `Density: ${options.visual.face.beardCharacteristics.observedDensity}`
          : 'Natural density',
      ],
    };
  }

  /**
   * 3. analyzeOutfit
   */
  analyzeOutfit(outfit: Outfit, options: RecommendationQueryOptions = {}): OutfitAnalysisResult {
    const rec = OutfitCompatibilityEvaluator.evaluate(outfit, {
      visual: options.visual,
      context: options.context,
      preferences: options.preferences,
      feedback: options.feedback,
    });

    const strengths: string[] = [...rec.reasons];
    const refinementsSuggested: string[] = rec.cautions ? [...rec.cautions] : [];

    const colorFactor = rec.factors.find((f) => f.category === 'color_harmony');
    const silhouetteFactor = rec.factors.find((f) => f.category === 'silhouette_balance');
    const occasionFactor = rec.factors.find((f) => f.category === 'occasion_fit');
    const weatherFactor = rec.factors.find((f) => f.category === 'weather_fit');

    return {
      outfit,
      overallScore: rec.score,
      harmonyFactors: {
        colorCohesion: colorFactor?.reason || 'Evaluated',
        silhouetteBalance: silhouetteFactor?.reason || 'Evaluated',
        occasionCalibration: occasionFactor?.reason || 'Evaluated',
        weatherFitness: weatherFactor?.reason || 'Evaluated',
      },
      strengths,
      refinementsSuggested,
      stylingTips: rec.stylingAdvice || [],
    };
  }

  /**
   * 4. elevateOutfit
   * Takes an outfit and elevates its silhouette, layering, and footwear grounding.
   */
  elevateOutfit(outfit: Outfit, options: RecommendationQueryOptions = {}): OutfitElevationResult {
    const initialRec = OutfitCompatibilityEvaluator.evaluate(outfit, options);
    const elevatedItems = [...outfit.items];
    const elevationsApplied: string[] = [];
    const stylingDirectives: string[] = [];

    const hasOuterwear = elevatedItems.some((i) => i.garment.category === 'outerwear');
    const footwearItem = elevatedItems.find((i) => i.garment.category === 'footwear');
    const topItem = elevatedItems.find((i) => i.garment.category === 'top');

    // Elevation Rule 1: Layering depth. If missing outerwear, add an architectural layer compatible with occasion
    if (!hasOuterwear) {
      const occasionFormality = options.context?.targetFormality || options.context?.occasion?.defaultFormality || 3;
      let candidateOuter: Garment | undefined;

      if (occasionFormality >= 3) {
        candidateOuter = knowledgeBase.getGarmentBySlug('deconstructed-blazer-charcoal');
      } else {
        candidateOuter = knowledgeBase.getGarmentBySlug('brushed-wool-overshirt-navy');
      }

      if (candidateOuter) {
        elevatedItems.push({
          garment: candidateOuter,
          layerPosition: 1,
          stylingNote: 'Drape open to reveal base proportion and establish vertical line',
        });
        elevationsApplied.push(`Added architectural layering: ${candidateOuter.name}`);
        stylingDirectives.push('Leave outerwear unbuttoned to create clean vertical visual frame.');
      }
    }

    // Elevation Rule 2: Footwear upgrade if formality mismatch
    if (footwearItem && options.context?.occasion) {
      const occasion = options.context.occasion;
      if (occasion.defaultFormality >= 3 && footwearItem.garment.formality < 3) {
        const replacementShoes = knowledgeBase.getGarmentBySlug('chunky-derbies-black');
        if (replacementShoes) {
          const shoeIndex = elevatedItems.indexOf(footwearItem);
          elevatedItems[shoeIndex] = {
            garment: replacementShoes,
            layerPosition: 0,
            stylingNote: 'Grounds relaxed proportions with substantial sole presence',
          };
          elevationsApplied.push(
            `Elevated footwear from ${footwearItem.garment.name} to ${replacementShoes.name} for occasion authority`
          );
        }
      }
    }

    // Elevation Rule 3: Add subtle silver accessory if absent
    const hasAccessory = elevatedItems.some((i) => i.garment.category === 'accessory');
    if (!hasAccessory) {
      const ring = knowledgeBase.getGarmentBySlug('silver-signet-ring');
      if (ring) {
        elevatedItems.push({
          garment: ring,
          layerPosition: 0,
          stylingNote: 'Subtle metallic point of interest',
        });
        elevationsApplied.push('Integrated silver signet ring for tactile editorial finish');
      }
    }

    const elevatedOutfit: Outfit = {
      ...outfit,
      id: `${outfit.id}_elevated`,
      title: `${outfit.title} (Elevated)`,
      items: elevatedItems,
    };

    const elevatedRec = OutfitCompatibilityEvaluator.evaluate(elevatedOutfit, options);
    const delta = Math.round((elevatedRec.score - initialRec.score) * 100) / 100;

    return {
      originalOutfit: outfit,
      elevatedOutfit,
      elevationDeltaScore: Math.max(0.05, delta),
      elevationsApplied,
      stylingDirectives,
    };
  }

  /**
   * 5. generateOutfit
   * Composes a complete outfit from available knowledge/wardrobe matching context and preferences.
   */
  generateOutfit(options: RecommendationQueryOptions = {}): Recommendation<Outfit> {
    const targetStyleSlug = options.preferences?.preferredStyleSlugs?.[0] || 'korean-minimal';
    const occasion = options.context?.occasion || knowledgeBase.getOccasionBySlug('dinner')!;

    // Select complementary garments
    const top =
      knowledgeBase.getGarmentBySlug('heavyweight-boxy-tee-offwhite') ||
      knowledgeBase.getGarmentsByCategory('top')[0];

    const bottom =
      knowledgeBase.getGarmentBySlug('wide-pleated-trousers-black') ||
      knowledgeBase.getGarmentsByCategory('bottom')[0];

    const outerwear =
      knowledgeBase.getGarmentBySlug('deconstructed-blazer-charcoal') ||
      knowledgeBase.getGarmentsByCategory('outerwear')[0];

    const footwear =
      knowledgeBase.getGarmentBySlug('chunky-derbies-black') ||
      knowledgeBase.getGarmentsByCategory('footwear')[0];

    const accessory = knowledgeBase.getGarmentBySlug('silver-signet-ring');

    const items = [
      { garment: top, layerPosition: 0, stylingNote: 'French tuck into waistband' },
      { garment: outerwear, layerPosition: 1, stylingNote: 'Shoulders draped naturally' },
      { garment: bottom, layerPosition: 0, stylingNote: 'Clean fluid drape over vamp' },
      { garment: footwear, layerPosition: 0 },
    ];

    if (accessory) {
      items.push({ garment: accessory, layerPosition: 0, stylingNote: 'Index or pinky finger' });
    }

    const outfit: Outfit = {
      id: `outfit_gen_${Date.now()}`,
      title: `${occasion.name} Editorial Composition`,
      description: `Curated ${targetStyleSlug} composition balancing boxy structure, wide trousers, and grounded footwear.`,
      items,
      primaryStyleSlug: targetStyleSlug,
      formality: occasion.defaultFormality,
      compatibleOccasions: [occasion.slug],
      seasonality: ['spring', 'fall', 'all-season'],
      silhouetteBalance: 'Boxy top frame offset by fluid pleats',
      colorStory: 'Monochromatic black, charcoal, and warm off-white',
    };

    return OutfitCompatibilityEvaluator.evaluate(outfit, options);
  }

  /**
   * 6. exploreStyle
   * Explores a specific style family with match score, gateway garments, and styling directions.
   */
  exploreStyle(styleSlug: string, preferences: PreferenceProfile): StyleMatchResult & { gatewayGarments: Garment[] } {
    const style = knowledgeBase.getStyleBySlug(styleSlug);
    if (!style) {
      throw new Error(`Style family '${styleSlug}' not found in fashion knowledge base`);
    }

    const match = StyleCompatibilityEngine.matchStyle(style, preferences);

    // Find core garments representing this style
    const gatewayGarments = knowledgeBase
      .getAllGarments()
      .filter((g) => g.compatibleStyleSlugs.includes(styleSlug))
      .slice(0, 4);

    return {
      ...match,
      gatewayGarments,
    };
  }
}

export const recommendationService = new RecommendationService();
