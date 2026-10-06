import { NextResponse } from 'next/server';
import { knowledgeBase } from '@/core/knowledge';
import { GarmentCategory } from '@/core/domain';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as GarmentCategory | null;

  if (category) {
    const garments = knowledgeBase.getGarmentsByCategory(category);
    return NextResponse.json({ count: garments.length, data: garments });
  }

  const garments = knowledgeBase.getAllGarments();
  return NextResponse.json({ count: garments.length, data: garments });
}
