/**
 * Build & Version Stamp for VAEL
 * Technical stamp for UI footer and traceability.
 */
export const BUILD_INFO = {
  commitHash:
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    '08d40f2',
  buildDate: '2026-10-12',
  version: 'R1.2',
};
