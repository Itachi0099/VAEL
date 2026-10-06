import { UserRepository } from '../persistence/repositories.interface';
import { defaultStore } from '../persistence/memory-store';
import { VisualProfile } from '../domain/visual';
import { StyleProfile, User } from '../domain/user';
import { VisualAnalyzer } from '../vision/visual-analyzer.interface';
import { MockVisualAnalyzer } from '../vision/mock-visual-analyzer';

export class ProfileService {
  constructor(
    private userRepo: UserRepository = defaultStore,
    private visualAnalyzer: VisualAnalyzer = new MockVisualAnalyzer()
  ) {}

  async getUser(userId: string): Promise<User | null> {
    return this.userRepo.getUser(userId);
  }

  async processVisualScan(userId: string, imageData?: { imageUrl?: string; base64?: string }): Promise<VisualProfile> {
    const analysis = await this.visualAnalyzer.analyze({
      imageUrl: imageData?.imageUrl,
      base64: imageData?.base64,
    });

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

    await this.userRepo.updateVisualProfile(userId, visualProfile);
    return visualProfile;
  }

  async updateStyleProfile(userId: string, updates: Partial<StyleProfile>): Promise<StyleProfile | null> {
    const user = await this.userRepo.getUser(userId);
    if (!user) return null;

    const updatedProfile: StyleProfile = {
      ...user.styleProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.userRepo.updateStyleProfile(userId, updatedProfile);
  }
}

export const profileService = new ProfileService();
