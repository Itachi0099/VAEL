import { NextResponse } from 'next/server';
import { knowledgeBase } from '@/core/knowledge';

export async function GET() {
  const hairstyles = knowledgeBase.getAllHairstyles();
  return NextResponse.json({ count: hairstyles.length, data: hairstyles });
}
