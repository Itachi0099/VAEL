import { NextResponse } from 'next/server';
import { MockVisualAnalyzer } from '@/core/vision';
import { defaultStore } from '@/core/persistence';
import { VisualProfile } from '@/core/domain';

const visualAnalyzer = new MockVisualAnalyzer();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 'usr_vael_curator';

    // Execute through visual analyzer abstraction
    const analysis = await visualAnalyzer.analyze({
      imageUrl: body.imageUrl,
      base64: body.base64,
      contextHint: body.contextHint,
    });

    // Update user profile with observed styling signals
    const visualProfile: VisualProfile = {
      id: `vis_${Date.now()}`,
      userId,
      face: analysis.face,
      hair: analysis.hair,
      body: analysis.body,
      source: 'visual_analysis',
      confidenceScore: analysis.confidenceScore,
      lastObservedAt: new Date().toISOString(),
    };

    await defaultStore.updateVisualProfile(userId, visualProfile);

    return NextResponse.json({
      success: true,
      analysis,
      visualProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
