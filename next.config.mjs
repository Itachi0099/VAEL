import { execSync } from 'child_process';

let commitSha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  '';

if (!commitSha) {
  try {
    commitSha = execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    commitSha = '';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: commitSha,
  },
};

export default nextConfig;

