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

    const occasionSlug = body.occasionSlug || 'dinner';
    const occasion = knowledgeBase.getOccasionBySlug(occasionSlug) || knowledgeBase.getAllOccasions()[0];

    const context: Context = {
      occasion,
      weather: body.weather || 'mild',
      targetFormality: body.targetFormality || occasion.defaultFormality,
    };

    const recommendation = recommendationService.generateOutfit({
      visual: user?.visualProfile,
      context,
      preferences: body.preferences || user?.styleProfile.preferences,
      feedback: user?.styleProfile.feedbackProfile,
    });

    return NextResponse.json({ success: true, data: recommendation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
