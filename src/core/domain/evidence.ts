/**
 * VAEL EVIDENCE LAYER
 *
 * Authority Order (Highest to Lowest):
 * 1. USER_CONFIRMED: Explicit user verification (e.g., "Yes, my hair is wavy")
 * 2. USER_ENTERED: Direct manual inputs / quiz answers
 * 3. LEARNED_FEEDBACK: Derived from repeat user feedback history
 * 4. VISION: Multimodal perception / camera analysis
 * 5. DEFAULT: System baseline assumptions
 *
 * NON-NEGOTIABLE PRINCIPLE:
 * Vision NEVER overrides user-entered or user-confirmed information.
 */

export type EvidenceAuthority =
  | 'USER_CONFIRMED'
  | 'USER_ENTERED'
  | 'LEARNED_FEEDBACK'
  | 'VISION'
  | 'DEFAULT';

export const AUTHORITY_RANK: Record<EvidenceAuthority, number> = {
  USER_CONFIRMED: 5,
  USER_ENTERED: 4,
  LEARNED_FEEDBACK: 3,
  VISION: 2,
  DEFAULT: 1,
};

export interface EvidenceSignal<T> {
  value: T;
  authority: EvidenceAuthority;
  confidence: number; // 0.0 to 1.0
  source: string; // e.g. 'user_taste_quiz', 'manual_edit', 'camera_analysis', 'default_baseline'
  updatedAt: string;
  notes?: string;
}

/**
 * Resolves conflict between existing signal and incoming signal.
 * The higher authority ALWAYS wins. If authorities are equal, the incoming signal wins.
 * Crucially: VISION (rank 2) can NEVER overwrite USER_ENTERED (rank 4) or USER_CONFIRMED (rank 5).
 */
export function resolveEvidenceSignal<T>(
  current: EvidenceSignal<T> | undefined,
  incoming: EvidenceSignal<T>
): EvidenceSignal<T> {
  if (!current) {
    return incoming;
  }

  const currentRank = AUTHORITY_RANK[current.authority] || 1;
  const incomingRank = AUTHORITY_RANK[incoming.authority] || 1;

  if (incomingRank >= currentRank) {
    return incoming;
  }

  // Current has strictly higher authority -> retain current
  return current;
}
