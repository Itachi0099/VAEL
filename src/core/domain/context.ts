import { ID, FormalityLevel, Season, WeatherCondition, TimelessTrendTag, TemperatureLevel, WeatherConditionType } from './types';

export interface Occasion {
  id: ID;
  slug: string;
  name: string;
  category: 'professional' | 'social' | 'evening' | 'academic' | 'casual' | 'ceremony' | 'cultural';
  defaultFormality: FormalityLevel;
  allowableFormalityRange: [FormalityLevel, FormalityLevel];
  guidelines: string[];
  restrictedGarmentCategories?: string[]; // e.g. 'gym-shorts' or 'graphic-tees'
  keyStyleAffinities: string[]; // style slugs favored
  isCulturalOrTraditional?: boolean;
  subParameters?: string[]; // e.g. ['corporate', 'creative', 'startup'] or ['day', 'evening']

  // Knowledge versioning
  timelessOrTrend: TimelessTrendTag;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Context {
  occasion: Occasion;
  weather?: WeatherCondition; // Retained for backwards compatibility
  temperatureLevel?: TemperatureLevel; // Cold, Cool, Mild, Warm, Hot
  condition?: WeatherConditionType; // Dry, Rain
  temperatureCelsius?: number;
  humidity?: 'low' | 'moderate' | 'high';
  isWeatherConfirmed?: boolean; // if false, system marks climate uncertainty
  season?: Season;
  timeOfDay?: TimeOfDay;
  targetFormality?: FormalityLevel;
  isFormalityOverridden?: boolean; // Set true if user explicitly overrode the occasion's allowed band
  subParameter?: string; // e.g. 'corporate', 'creative', 'startup', 'day', 'evening'
  locationContext?: string; // e.g. 'outdoor terrace', 'creative agency office'
  budgetTier?: 'accessible' | 'elevated' | 'investment';
}
