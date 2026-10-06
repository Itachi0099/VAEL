import { NextResponse } from 'next/server';
import { defaultStore } from '@/core/persistence';
import { WardrobeItem } from '@/core/domain';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr_vael_curator';

  const items = await defaultStore.getItems(userId);
  return NextResponse.json({ count: items.length, data: items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 'usr_vael_curator';

    if (!body.garment) {
      return NextResponse.json({ error: 'Missing garment object' }, { status: 400 });
    }

    const newItem: WardrobeItem = {
      id: `wdr_${Date.now()}`,
      userId,
      garment: body.garment,
      isFavorite: body.isFavorite ?? false,
      wearCount: 0,
      customNotes: body.customNotes,
      addedAt: new Date().toISOString(),
    };

    const saved = await defaultStore.addItem(newItem);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
