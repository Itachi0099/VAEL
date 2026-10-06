import { NextResponse } from 'next/server';
import { recommendationService } from '@/core/services';
import { defaultStore } from '@/core/persistence';
import { knowledgeBase } from '@/core/knowledge';
import { Context } from '@/core/domain';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 'usr_vael_curator';

    let outfit = body.outfit;
    if (!outfit && body.outfitId) {
      outfit = await defaultStore.getOutfitById(body.outfitId);
    }
    if (!outfit) {
      const allOutfits = await defaultStore.getOutfits();
      outfit = allOutfits[0];
    }

    const user = await defaultStore.getUser(userId);

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

    const elevated = recommendationService.elevateOutfit(outfit, {
      visual: user?.visualProfile,
      context,
      preferences: user?.styleProfile.preferences,
      feedback: user?.styleProfile.feedbackProfile,
    });

    return NextResponse.json({ success: true, data: elevated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
