import {
  UserRepository,
  WardrobeRepository,
  FeedbackRepository,
  OutfitRepository,
} from './repositories.interface';
import { User, StyleProfile } from '../domain/user';
import { VisualProfile } from '../domain/visual';
import { WardrobeItem, Outfit } from '../domain/fashion';
import { Feedback } from '../domain/feedback';
import { GARMENTS } from '../knowledge/garments.data';

export class InMemoryStore
  implements UserRepository, WardrobeRepository, FeedbackRepository, OutfitRepository
{
  private users = new Map<string, User>();
  private wardrobe = new Map<string, WardrobeItem[]>();
  private feedback = new Map<string, Feedback[]>();
  private outfits = new Map<string, Outfit>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultUserId = 'usr_vael_curator';

    // Seed default User
    const defaultVisual: VisualProfile = {
      id: 'vis_profile_01',
      userId: defaultUserId,
      face: {
        shape: 'oval',
        jaw: 'angular',
        proportions: {
          foreheadRatio: 'balanced',
          cheekboneProminence: 'moderate',
          facialThirdsBalance: 'balanced',
        },
        hasFacialHair: true,
        beardCharacteristics: {
          currentLength: 'stubble',
          observedDensity: 'medium',
          growthPattern: 'full',
        },
      },
      hair: {
        texture: 'wavy',
        density: 'high',
        length: 'short',
        volume: 'moderate',
        currentStyleDescription: 'Overgrown textured taper',
      },
      body: {
        silhouette: 'trapezoid',
        shoulderToHipRatio: 'broad-shoulders',
        torsoToLegRatio: 'balanced',
        heightImpression: 'average',
      },
      source: 'visual_analysis',
      confidenceScore: 0.95,
      lastObservedAt: new Date().toISOString(),
    };

    const defaultStyleProfile: StyleProfile = {
      id: 'sty_profile_01',
      userId: defaultUserId,
      dominantAestheticSlugs: ['minimal', 'korean-minimal'],
      preferences: {
        preferredStyleSlugs: ['minimal', 'korean-minimal', 'smart-casual'],
        dislikedStyleSlugs: ['formal'],
        preferredColors: ['black', 'off-white', 'charcoal', 'olive'],
        dislikedColors: ['neon-pink', 'fluorescent-yellow'],
        preferredFits: ['relaxed', 'boxy', 'tailored'],
        dislikedFits: ['skinny'],
        preferredSilhouettes: ['dropped-shoulder-fluid', 'wide-leg-break'],
        dislikedSilhouettes: ['skinny-uniform'],
        preferredFormalityRange: [2, 4],
        maxMaintenanceTolerance: 'moderate',
        accessoryAffinities: ['signet-rings', 'minimal-totes'],
      },
      feedbackProfile: {
        history: [],
        learnedStyleAffinities: {},
        learnedColorAffinities: {},
        learnedSilhouetteAffinities: {},
        learnedFitAffinities: {},
      },
      updatedAt: new Date().toISOString(),
    };

    const defaultUser: User = {
      id: defaultUserId,
      name: 'Julian Vance',
      handle: 'julian',
      createdAt: new Date().toISOString(),
      visualProfile: defaultVisual,
      styleProfile: defaultStyleProfile,
    };

    this.users.set(defaultUserId, defaultUser);

    // Seed Wardrobe with subset of curated garments
    const curatedWardrobeItems: WardrobeItem[] = [
      {
        id: 'wdr_01',
        userId: defaultUserId,
        garment: GARMENTS.find((g) => g.slug === 'heavyweight-boxy-tee-offwhite') || GARMENTS[0],
        isFavorite: true,
        wearCount: 14,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'wdr_02',
        userId: defaultUserId,
        garment: GARMENTS.find((g) => g.slug === 'wide-pleated-trousers-black') || GARMENTS[1],
        isFavorite: true,
        wearCount: 19,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'wdr_03',
        userId: defaultUserId,
        garment: GARMENTS.find((g) => g.slug === 'deconstructed-blazer-charcoal') || GARMENTS[2],
        isFavorite: false,
        wearCount: 6,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'wdr_04',
        userId: defaultUserId,
        garment: GARMENTS.find((g) => g.slug === 'chunky-derbies-black') || GARMENTS[3],
        isFavorite: true,
        wearCount: 22,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'wdr_05',
        userId: defaultUserId,
        garment: GARMENTS.find((g) => g.slug === 'knit-polo-olive') || GARMENTS[4],
        isFavorite: false,
        wearCount: 4,
        addedAt: new Date().toISOString(),
      },
    ];

    this.wardrobe.set(defaultUserId, curatedWardrobeItems);

    // Seed Outfits
    const defaultOutfit: Outfit = {
      id: 'outfit_curated_01',
      title: 'Monochrome Fluid Tailoring',
      description: 'Dropped-shoulder boxy tee anchored inside double-pleated wool trousers and chunky derbies.',
      items: [
        {
          garment: GARMENTS.find((g) => g.slug === 'heavyweight-boxy-tee-offwhite') || GARMENTS[0],
          layerPosition: 0,
          stylingNote: 'Tuck loosely into high-rise waistband',
        },
        {
          garment: GARMENTS.find((g) => g.slug === 'deconstructed-blazer-charcoal') || GARMENTS[2],
          layerPosition: 1,
          stylingNote: 'Leave unbuttoned for architectural drape',
        },
        {
          garment: GARMENTS.find((g) => g.slug === 'wide-pleated-trousers-black') || GARMENTS[1],
          layerPosition: 0,
          stylingNote: 'Allow soft break at the footwear vamp',
        },
        {
          garment: GARMENTS.find((g) => g.slug === 'chunky-derbies-black') || GARMENTS[3],
          layerPosition: 0,
        },
      ],
      primaryStyleSlug: 'korean-minimal',
      formality: 3,
      compatibleOccasions: ['office', 'dinner', 'date'],
      seasonality: ['spring', 'fall', 'all-season'],
      silhouetteBalance: 'Oversized top drape balanced with wide structured floor break',
      colorStory: 'High-contrast monochrome: off-white focal against deep charcoal and pitch-black',
    };

    this.outfits.set(defaultOutfit.id, defaultOutfit);
  }

  // --- UserRepository ---
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async saveUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async updateVisualProfile(userId: string, visualProfile: VisualProfile): Promise<VisualProfile> {
    const user = this.users.get(userId);
    if (user) {
      user.visualProfile = visualProfile;
      this.users.set(userId, user);
    }
    return visualProfile;
  }

  async updateStyleProfile(userId: string, styleProfile: StyleProfile): Promise<StyleProfile> {
    const user = this.users.get(userId);
    if (user) {
      user.styleProfile = styleProfile;
      this.users.set(userId, user);
    }
    return styleProfile;
  }

  // --- WardrobeRepository ---
  async getItems(userId: string): Promise<WardrobeItem[]> {
    return this.wardrobe.get(userId) || [];
  }

  async addItem(item: WardrobeItem): Promise<WardrobeItem> {
    const list = this.wardrobe.get(item.userId) || [];
    list.push(item);
    this.wardrobe.set(item.userId, list);
    return item;
  }

  async removeItem(userId: string, itemId: string): Promise<boolean> {
    const list = this.wardrobe.get(userId) || [];
    const filtered = list.filter((i) => i.id !== itemId);
    this.wardrobe.set(userId, filtered);
    return filtered.length !== list.length;
  }

  // --- FeedbackRepository ---
  async recordFeedback(feedbackItem: Feedback): Promise<Feedback> {
    const list = this.feedback.get(feedbackItem.userId) || [];
    list.push(feedbackItem);
    this.feedback.set(feedbackItem.userId, list);

    // Update user learned weights
    const user = this.users.get(feedbackItem.userId);
    if (user) {
      const fbProfile = user.styleProfile.feedbackProfile;
      fbProfile.history.push(feedbackItem);

      const delta =
        feedbackItem.feedbackType === 'LOVE'
          ? 0.3
          : feedbackItem.feedbackType === 'LIKE'
          ? 0.15
          : feedbackItem.feedbackType === 'DISLIKE'
          ? -0.2
          : -0.4;

      if (feedbackItem.targetType === 'style_family') {
        const cur = fbProfile.learnedStyleAffinities[feedbackItem.targetId] || 0;
        fbProfile.learnedStyleAffinities[feedbackItem.targetId] = Math.max(-1, Math.min(1, cur + delta));
      }

      this.users.set(user.id, user);
    }

    return feedbackItem;
  }

  async getFeedbackHistory(userId: string): Promise<Feedback[]> {
    return this.feedback.get(userId) || [];
  }

  // --- OutfitRepository ---
  async getOutfits(userId?: string): Promise<Outfit[]> {
    return Array.from(this.outfits.values());
  }

  async getOutfitById(id: string): Promise<Outfit | null> {
    return this.outfits.get(id) || null;
  }

  async saveOutfit(outfit: Outfit): Promise<Outfit> {
    this.outfits.set(outfit.id, outfit);
    return outfit;
  }
}

export const defaultStore = new InMemoryStore();
