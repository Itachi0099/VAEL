import { NextResponse } from 'next/server';
import { recommendationService } from '@/core/services';
import { defaultStore } from '@/core/persistence';
import { knowledgeBase } from '@/core/knowledge';
import { Context } from '@/core/domain';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let context: Context | undefined;
    if (body.occasionSlug) {
      const occasion = knowledgeBase.getOccasionBySlug(body.occasionSlug);
      if (occasion) {
        context = {
          occasion,
          weather: body.weather,
          targetFormality: body.targetFormality,
        };
      }
    }

    let targetVisual = body.visual;
    let targetPreferences = body.preferences;
    let targetFeedback = body.feedback;

    if (body.customUser) {
      targetVisual = targetVisual || body.customUser.visualProfile;
      targetPreferences = targetPreferences || body.customUser.styleProfile?.preferences;
      targetFeedback = targetFeedback || body.customUser.styleProfile?.feedbackProfile;
    } else if (body.userId) {
      const user = await defaultStore.getUser(body.userId);
      targetVisual = targetVisual || user?.visualProfile;
      targetPreferences = targetPreferences || user?.styleProfile.preferences;
      targetFeedback = targetFeedback || user?.styleProfile.feedbackProfile;
    } else if (!body.isExplicitEmpty) {
      const user = await defaultStore.getUser('usr_vael_curator');
      targetVisual = targetVisual || user?.visualProfile;
      targetPreferences = targetPreferences || user?.styleProfile.preferences;
      targetFeedback = targetFeedback || user?.styleProfile.feedbackProfile;
    }

    const recommendations = recommendationService.generateGroomingRecommendations({
      visual: targetVisual,
      context,
      preferences: targetPreferences,
      feedback: targetFeedback,
      limit: body.limit || 6,
    });

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
