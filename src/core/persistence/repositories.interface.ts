import { User, StyleProfile } from '../domain/user';
import { VisualProfile } from '../domain/visual';
import { WardrobeItem, Outfit } from '../domain/fashion';
import { Feedback } from '../domain/feedback';

export interface UserRepository {
  getUser(id: string): Promise<User | null>;
  saveUser(user: User): Promise<User>;
  updateVisualProfile(userId: string, visualProfile: VisualProfile): Promise<VisualProfile>;
  updateStyleProfile(userId: string, styleProfile: StyleProfile): Promise<StyleProfile>;
}

export interface WardrobeRepository {
  getItems(userId: string): Promise<WardrobeItem[]>;
  addItem(item: WardrobeItem): Promise<WardrobeItem>;
  removeItem(userId: string, itemId: string): Promise<boolean>;
}

export interface FeedbackRepository {
  recordFeedback(feedback: Feedback): Promise<Feedback>;
  getFeedbackHistory(userId: string): Promise<Feedback[]>;
}

export interface OutfitRepository {
  getOutfits(userId?: string): Promise<Outfit[]>;
  getOutfitById(id: string): Promise<Outfit | null>;
  saveOutfit(outfit: Outfit): Promise<Outfit>;
}
