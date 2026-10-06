import { Feedback, FeedbackType } from '../domain/feedback';
import { PreferenceProfile, FeedbackProfile } from '../domain/user';

export class PreferenceWeightingEngine {
  /**
   * Calculates a score modifier based on explicit user preferences.
   * Returns a score multiplier or offset [-0.4, 0.4].
   */
  static evaluateStyleAffinity(
    styleSlugs: string[],
    preferences?: PreferenceProfile,
    feedbackProfile?: FeedbackProfile
  ): { scoreDelta: number; reasons: string[] } {
    let delta = 0;
    const reasons: string[] = [];

    if (!preferences && !feedbackProfile) {
      return { scoreDelta: 0, reasons };
    }

    // 1. Explicit Preferences
    if (preferences) {
      for (const slug of styleSlugs) {
        if (preferences.preferredStyleSlugs?.includes(slug)) {
          delta += 0.15;
          reasons.push(`Directly aligns with your preferred ${slug} aesthetic`);
        }
        if (preferences.dislikedStyleSlugs?.includes(slug)) {
          delta -= 0.25;
          reasons.push(`Deprioritized due to your aversion to ${slug} aesthetic`);
        }
      }
    }

    // 2. Feedback History Weight Learning
    if (feedbackProfile?.learnedStyleAffinities) {
      for (const slug of styleSlugs) {
        const learned = feedbackProfile.learnedStyleAffinities[slug];
        if (learned) {
          delta += learned * 0.2;
          if (learned > 0.2) {
            reasons.push(`Reflects positive feedback history for ${slug}`);
          } else if (learned < -0.2) {
            reasons.push(`Filtered based on past feedback for ${slug}`);
          }
        }
      }
    }

    return {
      scoreDelta: Math.max(-0.4, Math.min(0.4, delta)),
      reasons,
    };
  }

  /**
   * Computes feedback weight impact from a feedback action
   */
  static calculateFeedbackDelta(type: FeedbackType): number {
    switch (type) {
      case 'LOVE':
        return 0.3;
      case 'LIKE':
        return 0.12;
      case 'DISLIKE':
        return -0.2;
      case 'NOT_FOR_ME':
        return -0.45;
      default:
        return 0;
    }
  }
}
