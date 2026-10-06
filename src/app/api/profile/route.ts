import { NextResponse } from 'next/server';
import { defaultStore } from '@/core/persistence';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr_vael_curator';

  const user = await defaultStore.getUser(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 'usr_vael_curator';

    const user = await defaultStore.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (body.preferences) {
      user.styleProfile.preferences = {
        ...user.styleProfile.preferences,
        ...body.preferences,
      };
    }

    if (body.dominantAestheticSlugs) {
      user.styleProfile.dominantAestheticSlugs = body.dominantAestheticSlugs;
    }

    user.styleProfile.updatedAt = new Date().toISOString();
    await defaultStore.saveUser(user);

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
