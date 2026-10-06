import { NextResponse } from 'next/server';
import { knowledgeBase } from '@/core/knowledge';

export async function GET() {
  const beards = knowledgeBase.getAllBeards();
  return NextResponse.json({ count: beards.length, data: beards });
}
