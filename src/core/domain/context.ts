import { ID, FormalityLevel, Season, WeatherCondition } from './types';

export interface Occasion {
  id: ID;
  slug: string;
  name: string;
  category: 'professional' | 'social' | 'evening' | 'academic' | 'casual' | 'ceremony';
  defaultFormality: FormalityLevel;
  allowableFormalityRange: [FormalityLevel, FormalityLevel];
  guidelines: string[];
  restrictedGarmentCategories?: string[]; // e.g. 'gym-shorts' or 'graphic-tees'
  keyStyleAffinities: string[]; // style slugs favored
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Context {
  occasion: Occasion;
  weather?: WeatherCondition;
  temperatureCelsius?: number;
  season?: Season;
  timeOfDay?: TimeOfDay;
  targetFormality?: FormalityLevel;
  locationContext?: string; // e.g. 'outdoor terrace', 'creative agency office'
  budgetTier?: 'accessible' | 'elevated' | 'investment';
}
