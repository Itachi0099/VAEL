import { User, Context } from '../../core/domain';
import { knowledgeBase } from '../../core/knowledge';

export interface StudioProfileOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  user: User;
  context: Context;
}

function createBaseUserProfile(id: string, name: string): User {
  return {
    id,
    name,
    handle: id.replace('usr_', ''),
    createdAt: '2026-10-12T00:00:00.000Z',
    styleProfile: {
      id: `sty_${id}`,
      userId: id,
      dominantAestheticSlugs: ['minimal'],
      styleVector: {
        formality: 3,
        structure: 3,
        volume: 3,
        colorIntensity: 1,
        contrast: 3,
        pattern: 1,
        texture: 2,
        ornamentation: 1,
        classicTrend: 3,
        utilityPolish: 3,
        genderCoding: 'androgynous',
      },
      preferences: {
        preferredStyleSlugs: ['minimal'],
        dislikedStyleSlugs: [],
        preferredColors: ['black', 'white', 'charcoal'],
        dislikedColors: [],
        preferredFits: ['relaxed', 'regular'],
        dislikedFits: [],
        preferredSilhouettes: [],
        dislikedSilhouettes: [],
        fitProportions: {
          preferredFits: ['relaxed', 'regular'],
          dislikedFits: [],
          topVolume: 3,
          bottomVolume: 3,
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          layeringPreference: 'moderate',
          garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
        },
        modestyLevel: 'unrestricted',
        userConfirmedUndertone: 'neutral',
        genderCodingDirection: 'androgynous',
        styleExpression: 'androgynous',
        preferredFormalityRange: [2, 4],
        maxMaintenanceTolerance: 'moderate',
        accessoryAffinities: [],
      },
      feedbackProfile: {
        history: [],
        learnedStyleAffinities: {},
        learnedColorAffinities: {},
        learnedSilhouetteAffinities: {},
        learnedFitAffinities: {},
        repeatPassCount: {},
      },
      evidenceSignals: {
        hairTexture: {
          value: 'straight',
          authority: 'USER_ENTERED',
          confidence: 1.0,
          source: 'manual_input',
          updatedAt: '2026-10-12T00:00:00.000Z',
        },
      },
      updatedAt: '2026-10-12T00:00:00.000Z',
    },
  };
}

export const SAMPLE_STUDIO_PROFILES: StudioProfileOption[] = [
  // 1. Profile 01: Minimalist Everyday
  {
    id: 'profile_01',
    name: 'Profile 01 — Minimalist Everyday',
    badge: 'FEMININE / CASUAL',
    description: 'Feminine expression, mild 18°C, casual everyday dining (formality 2-3).',
    user: {
      ...createBaseUserProfile('usr_p01', 'Elena Vance'),
      visualProfile: {
        id: 'vis_p01',
        userId: 'usr_p01',
        face: { shape: 'oval', jaw: 'soft', hasFacialHair: false },
        hair: { texture: 'wavy', density: 'medium', length: 'shoulder', volume: 'moderate' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: '2026-10-12T00:00:00.000Z',
      },
      styleProfile: {
        ...createBaseUserProfile('usr_p01', 'Elena Vance').styleProfile,
        preferences: {
          ...createBaseUserProfile('usr_p01', 'Elena Vance').styleProfile.preferences,
          styleExpression: 'feminine',
          genderCodingDirection: 'feminine',
          userConfirmedUndertone: 'warm',
        },
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 2,
      temperatureLevel: 'mild',
      temperatureCelsius: 18,
      isWeatherConfirmed: true,
    },
  },

  // 2. Profile 14: Fluid / Creative Evening
  {
    id: 'profile_14',
    name: 'Profile 14 — Fluid / Creative Evening',
    badge: 'ANDROGYNOUS / FLUID',
    description: 'Androgynous curated fluid expression, mild evening 16°C, gallery / social event.',
    user: {
      ...createBaseUserProfile('usr_p14', 'Alex Chen'),
      visualProfile: {
        id: 'vis_p14',
        userId: 'usr_p14',
        face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
        hair: { texture: 'straight', density: 'high', length: 'short', volume: 'moderate' },
        body: { silhouette: 'rectangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: '2026-10-12T00:00:00.000Z',
      },
      styleProfile: {
        ...createBaseUserProfile('usr_p14', 'Alex Chen').styleProfile,
        dominantAestheticSlugs: ['minimal', 'smart-casual'],
        preferences: {
          ...createBaseUserProfile('usr_p14', 'Alex Chen').styleProfile.preferences,
          styleExpression: 'androgynous',
          genderCodingDirection: 'androgynous',
          preferredStyleSlugs: ['minimal', 'smart-casual'],
          userConfirmedUndertone: 'neutral',
        },
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('dinner')!,
      targetFormality: 3,
      temperatureLevel: 'mild',
      temperatureCelsius: 16,
      isWeatherConfirmed: true,
    },
  },

  // 3. Profile 17: Masculine Hot Interview
  {
    id: 'profile_17',
    name: 'Profile 17 — Masculine Hot Interview',
    badge: 'MASCULINE / 32°C HOT',
    description: 'Masculine expression, 32°C hot humid, corporate job interview (formality 4). Poplin & fresco tailoring.',
    user: {
      ...createBaseUserProfile('usr_p17', 'Marcus Sterling'),
      visualProfile: {
        id: 'vis_p17',
        userId: 'usr_p17',
        face: {
          shape: 'square',
          jaw: 'angular',
          hasFacialHair: true,
          beardCharacteristics: {
            currentLength: 'short',
            observedDensity: 'thick',
            growthPattern: 'full',
          },
        },
        hair: { texture: 'straight', density: 'medium', length: 'short', volume: 'moderate' },
        body: { silhouette: 'inverted-triangle' },
        source: 'user_input',
        confidenceScore: 1.0,
        lastObservedAt: '2026-10-12T00:00:00.000Z',
      },
      styleProfile: {
        ...createBaseUserProfile('usr_p17', 'Marcus Sterling').styleProfile,
        dominantAestheticSlugs: ['smart-casual', 'minimal'],
        preferences: {
          ...createBaseUserProfile('usr_p17', 'Marcus Sterling').styleProfile.preferences,
          styleExpression: 'masculine',
          genderCodingDirection: 'masculine',
          preferredStyleSlugs: ['smart-casual', 'minimal'],
          userConfirmedUndertone: 'neutral',
        },
      },
    },
    context: {
      occasion: knowledgeBase.getOccasionBySlug('job-interview')!,
      targetFormality: 4,
      subParameter: 'corporate',
      temperatureLevel: 'hot',
      temperatureCelsius: 32,
      condition: 'dry',
      isWeatherConfirmed: true,
    },
  },
];
