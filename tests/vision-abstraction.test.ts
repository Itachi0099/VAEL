import { describe, it, expect } from 'vitest';
import { MockVisualAnalyzer } from '../src/core/vision';
import { profileService } from '../src/core/services';
import { defaultStore } from '../src/core/persistence';

describe('Vision & Multimodal AI Abstraction', () => {
  it('analyzer returns structured non-judgmental styling signals with clear mock metadata', async () => {
    const analyzer = new MockVisualAnalyzer();
    const result = await analyzer.analyze({ imageUrl: 'https://vael.internal/test-scan.jpg' });

    expect(result.face).toBeDefined();
    expect(result.face.shape).toBeDefined();
    expect(result.hair).toBeDefined();
    expect(result.hair.texture).toBeDefined();
    expect(result.metadata.isMock).toBe(true);
    expect(result.metadata.provider).toBe('mock-vision-adapter');
    expect(result.confidenceScore).toBeGreaterThan(0.8);
  });

  it('profile service processes visual scan and updates user visual profile', async () => {
    const updatedProfile = await profileService.processVisualScan('usr_vael_curator');

    expect(updatedProfile.userId).toBe('usr_vael_curator');
    expect(updatedProfile.source).toBe('visual_analysis');
    expect(updatedProfile.face.shape).toBeDefined();

    const user = await defaultStore.getUser('usr_vael_curator');
    expect(user?.visualProfile?.face.shape).toBe(updatedProfile.face.shape);
  });
});
