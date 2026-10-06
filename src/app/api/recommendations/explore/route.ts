import { NextResponse } from 'next/server';
import { recommendationService } from '@/core/services';
import { defaultStore } from '@/core/persistence';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const styleSlug = searchParams.get('style') || 'korean-minimal';
  const userId = searchParams.get('userId') || 'usr_vael_curator';

  try {
    const user = await defaultStore.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const exploration = recommendationService.exploreStyle(styleSlug, user.styleProfile.preferences);
    return NextResponse.json({ success: true, data: exploration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
