import { ID } from './types';

export type FeedbackType = 'LIKE' | 'DISLIKE' | 'LOVE' | 'NOT_FOR_ME';

export type FeedbackTargetType =
  | 'hairstyle'
  | 'beard_style'
  | 'garment'
  | 'outfit'
  | 'style_family'
  | 'color'
  | 'silhouette';

export interface Feedback {
  id: ID;
  userId: ID;
  targetType: FeedbackTargetType;
  targetId: string; // ID or attribute slug (e.g., 'textured-crop' or 'korean-minimal' or 'color:olive')
  feedbackType: FeedbackType;
  specificDislikeReason?:
    | 'too_formal'
    | 'too_casual'
    | 'unflattering_silhouette'
    | 'color_clash'
    | 'high_maintenance'
    | 'not_my_aesthetic';
  createdAt: string;
}

export interface FeedbackWeightImpact {
  targetId: string;
  weightDelta: number; // e.g. +0.25 for LOVE, +0.10 for LIKE, -0.15 for DISLIKE, -0.35 for NOT_FOR_ME
  attributePushes: {
    attributeName: string;
    delta: number;
  }[];
}
