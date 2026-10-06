import { ID, FormalityLevel, ModestyLevel } from './types';
import { Garment } from './fashion';
import { HairStyle, BeardStyle } from './grooming';

export interface TraditionGarmentMapping {
  garmentId: ID;
  ceremonyRoles: string[]; // e.g. ['groom', 'ceremonial-guest', 'reception', 'festival']
  drapingInstructions?: string;
  regionalVariant?: string;
}

export interface TraditionPack {
  id: ID;
  slug: string;
  name: string;
  region: string;
  description: string;
  garmentIds: ID[];
  silhouetteAffinities: string[];
  fabricPreferences: string[];
  supportedOccasions: string[];
  modestyRequirements: ModestyLevel[];
  groomingCompatibilities?: {
    hairStyleSlugs: string[];
    beardStyleSlugs: string[];
  };
  stylingRules: string[];
  status: 'AVAILABLE' | 'IN_CURATION' | 'UNAVAILABLE';
}

export interface TraditionAvailabilityCheck {
  isAvailable: boolean;
  traditionSlug: string;
  message: string;
  pack?: TraditionPack;
}
