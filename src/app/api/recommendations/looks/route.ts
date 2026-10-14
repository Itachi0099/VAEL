import { NextResponse } from 'next/server';
import { recommendationService } from '@/core/services';
import { defaultStore } from '@/core/persistence';
import { knowledgeBase } from '@/core/knowledge';
import { Context, User } from '@/core/domain';
import { StyleVectorMath } from '@/core/intelligence/style-vector';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      userId,
      customUser,
      occasionSlug = 'dinner',
      weather = 'mild',
      temperature,
      temperatureLevel,
      condition,
      targetFormality,
      activeStyles,
      fitProportions,
      subParameter,
    } = body;

    const occasion =
      knowledgeBase.getOccasionBySlug(occasionSlug) ||
      knowledgeBase.getAllOccasions().find((o) => o.slug === 'casual') ||
      knowledgeBase.getAllOccasions()[0];

    const actualTempLevel = (temperatureLevel || (weather !== 'rainy' ? weather : 'mild')) as any;
    const actualCondition = (condition || (weather === 'rainy' ? 'rain' : 'dry')) as any;

    const context: Context = {
      occasion,
      weather: (actualCondition === 'rain' ? 'rainy' : actualTempLevel) as any,
      temperatureLevel: actualTempLevel,
      condition: actualCondition,
      temperatureCelsius:
        temperature !== undefined
          ? Number(temperature)
          : actualTempLevel === 'cold'
            ? 2
            : actualTempLevel === 'cool'
              ? 12
              : actualTempLevel === 'warm'
                ? 24
                : actualTempLevel === 'hot'
                  ? 30
                  : 18,
      targetFormality: targetFormality || occasion.defaultFormality,
      subParameter: subParameter || undefined,
      isWeatherConfirmed: true,
    };

    let userToEvaluate: User | null = null;

    if (customUser) {
      // Build an ad-hoc User object with evidence tracking
      const preferredStyles = activeStyles && activeStyles.length > 0
        ? activeStyles
        : customUser.styleProfile?.preferences?.preferredStyleSlugs || ['minimal'];

      const styleFamily = knowledgeBase.getStyleBySlug(preferredStyles[0]) || knowledgeBase.getAllStyles()[0];

      userToEvaluate = {
        id: customUser.id || 'usr_adhoc_session',
        name: customUser.name || 'Current User',
        handle: customUser.handle || 'user',
        createdAt: new Date().toISOString(),
        visualProfile: customUser.visualProfile,
        styleProfile: {
          id: 'sty_adhoc',
          userId: customUser.id || 'usr_adhoc_session',
          dominantAestheticSlugs: preferredStyles,
          styleVector: customUser.styleProfile?.styleVector || styleFamily.styleVector || StyleVectorMath.createBalancedVector(),
          evidenceSignals: customUser.styleProfile?.evidenceSignals,
          preferences: {
            ...customUser.styleProfile?.preferences,
            preferredStyleSlugs: preferredStyles,
            dislikedStyleSlugs: customUser.styleProfile?.preferences?.dislikedStyleSlugs || [],
            preferredColors: customUser.styleProfile?.preferences?.preferredColors || ['black', 'white', 'charcoal', 'navy'],
            dislikedColors: customUser.styleProfile?.preferences?.dislikedColors || [],
            preferredFits: customUser.styleProfile?.preferences?.preferredFits || ['relaxed', 'tailored', 'regular'],
            dislikedFits: customUser.styleProfile?.preferences?.dislikedFits || ['skinny'],
            preferredSilhouettes: customUser.styleProfile?.preferences?.preferredSilhouettes || [],
            dislikedSilhouettes: customUser.styleProfile?.preferences?.dislikedSilhouettes || [],
            dislikedCategories: customUser.styleProfile?.preferences?.dislikedCategories || [],
            fitProportions: fitProportions || customUser.styleProfile?.preferences?.fitProportions || {
              preferredFits: ['relaxed', 'tailored'],
              dislikedFits: ['skinny'],
              topVolume: 3,
              bottomVolume: 3,
              preferredSilhouettes: [],
              dislikedSilhouettes: [],
              layeringPreference: 'moderate',
              garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
            },
            modestyLevel: customUser.styleProfile?.preferences?.modestyLevel || 'unrestricted',
            userConfirmedUndertone: customUser.styleProfile?.preferences?.userConfirmedUndertone || 'unspecified',
            genderCodingDirection: customUser.styleProfile?.preferences?.genderCodingDirection || 'androgynous',
            styleExpression: customUser.styleProfile?.preferences?.styleExpression || 'unspecified',
            genderIdentity: customUser.styleProfile?.preferences?.genderIdentity || 'unspecified',
            skinDepth: customUser.styleProfile?.preferences?.skinDepth || 'unspecified',
            contrastLevel: customUser.styleProfile?.preferences?.contrastLevel || 'unspecified',
            heightRange: customUser.styleProfile?.preferences?.heightRange || 'unspecified',
            torsoLegPreference: customUser.styleProfile?.preferences?.torsoLegPreference || 'unspecified',
            shoulderHipBalance: customUser.styleProfile?.preferences?.shoulderHipBalance || 'unspecified',
            budgetTier: customUser.styleProfile?.preferences?.budgetTier || 'unspecified',
            budgetBand: customUser.styleProfile?.preferences?.budgetBand || 'unspecified',
            preferredFormalityRange: customUser.styleProfile?.preferences?.preferredFormalityRange || [
              occasion.allowableFormalityRange[0],
              occasion.allowableFormalityRange[1],
            ],
            maxMaintenanceTolerance: customUser.styleProfile?.preferences?.maxMaintenanceTolerance || 'moderate',
            accessoryAffinities: customUser.styleProfile?.preferences?.accessoryAffinities || [],
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
    } else {
      userToEvaluate = await defaultStore.getUser(userId || 'usr_vael_curator');
    }

    if (!userToEvaluate) {
      return NextResponse.json({ error: 'User profile not resolved' }, { status: 400 });
    }

    // Call flagship 3-Step VaelStylingEngine via recommendationService
    const topThree = recommendationService.generateTopThreeLooks({
      user: userToEvaluate,
      context,
    });

    return NextResponse.json({
      success: true,
      data: {
        topThree,
        context,
        user: {
          id: userToEvaluate.id,
          name: userToEvaluate.name,
          visualProfile: userToEvaluate.visualProfile,
          dominantAestheticSlugs: userToEvaluate.styleProfile.dominantAestheticSlugs,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
