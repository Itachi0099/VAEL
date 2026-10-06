import { NextResponse } from 'next/server';
import { feedbackService } from '@/core/services';
import { FeedbackTargetType, FeedbackType } from '@/core/domain';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 'usr_vael_curator';

    if (!body.targetType || !body.targetId || !body.feedbackType) {
      return NextResponse.json(
        { error: 'Missing targetType, targetId, or feedbackType' },
        { status: 400 }
      );
    }

    const feedback = await feedbackService.submitFeedback({
      userId,
      targetType: body.targetType as FeedbackTargetType,
      targetId: body.targetId,
      feedbackType: body.feedbackType as FeedbackType,
      specificDislikeReason: body.specificDislikeReason,
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr_vael_curator';

  const history = await feedbackService.getFeedbackHistory(userId);
  return NextResponse.json({ count: history.length, data: history });
}
