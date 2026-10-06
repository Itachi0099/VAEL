import { FeedbackRepository, UserRepository } from '../persistence/repositories.interface';
import { defaultStore } from '../persistence/memory-store';
import { Feedback, FeedbackType, FeedbackTargetType } from '../domain/feedback';

export interface RecordFeedbackParams {
  userId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  feedbackType: FeedbackType;
  specificDislikeReason?: Feedback['specificDislikeReason'];
}

export class FeedbackService {
  constructor(
    private feedbackRepo: FeedbackRepository = defaultStore,
    private userRepo: UserRepository = defaultStore
  ) {}

  async submitFeedback(params: RecordFeedbackParams): Promise<Feedback> {
    const feedback: Feedback = {
      id: `fb_${Date.now()}`,
      userId: params.userId,
      targetType: params.targetType,
      targetId: params.targetId,
      feedbackType: params.feedbackType,
      specificDislikeReason: params.specificDislikeReason,
      createdAt: new Date().toISOString(),
    };

    return this.feedbackRepo.recordFeedback(feedback);
  }

  async getFeedbackHistory(userId: string): Promise<Feedback[]> {
    return this.feedbackRepo.getFeedbackHistory(userId);
  }
}

export const feedbackService = new FeedbackService();
