import { NextResponse } from 'next/server';
import { knowledgeBase } from '@/core/knowledge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const style = knowledgeBase.getStyleBySlug(slug);
    if (!style) {
      return NextResponse.json({ error: `Style '${slug}' not found` }, { status: 404 });
    }
    return NextResponse.json({ data: style });
  }

  const styles = knowledgeBase.getAllStyles();
  return NextResponse.json({ count: styles.length, data: styles });
}
