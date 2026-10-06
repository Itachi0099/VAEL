import { NextResponse } from 'next/server';
import { knowledgeBase } from '@/core/knowledge';

export async function GET() {
  const occasions = knowledgeBase.getAllOccasions();
  return NextResponse.json({ count: occasions.length, data: occasions });
}
