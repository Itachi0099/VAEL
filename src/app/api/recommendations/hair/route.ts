import { NextResponse } from 'next/server';
import { recommendationService } from '@/core/services';
import { defaultStore } from '@/core/persistence';
import { knowledgeBase } from '@/core/knowledge';
import { Context } from '@/core/domain';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'usr_vael_curator';

    const user = await defaultStore.getUser(userId);

    // Build context if occasion provided
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

    const recommendations = recommendationService.generateHairRecommendations({
      visual: body.visual || user?.visualProfile,
      context,
      preferences: body.preferences || user?.styleProfile.preferences,
      feedback: user?.styleProfile.feedbackProfile,
      limit: body.limit || 5,
    });

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
