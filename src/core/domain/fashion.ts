import {
  ID,
  GarmentCategory,
  FitType,
  FormalityLevel,
  Season,
  WeatherCondition,
} from './types';

export interface GarmentColor {
  name: string; // e.g. 'off-white', 'charcoal', 'olive'
  hex?: string;
  tone: 'neutral' | 'warm' | 'cool' | 'earth' | 'vibrant' | 'pastel';
  isBaseColor: boolean;
}

export interface Garment {
  id: ID;
  name: string;
  slug: string;
  category: GarmentCategory;
  subcategory: string; // e.g. 'oversized-tee', 'knit-polo', 'tailored-trousers', 'chelsea-boots'
  fit: FitType;
  silhouette: string; // e.g. 'box-cut', 'tapered', 'wide-leg', 'structured-shoulder'
  length?: 'cropped' | 'regular' | 'extended' | 'ankle' | 'full-break';
  color: GarmentColor;
  material: string; // e.g. 'heavyweight cotton', 'merino wool', 'raw denim'
  pattern: 'solid' | 'subtle-stripe' | 'houndstooth' | 'plaid' | 'graphic' | 'textured-weave';
  formality: FormalityLevel;
  seasons: Season[];
  compatibleWeather: WeatherCondition[];
  compatibleStyleSlugs: string[];
  layeringRole?: 'base' | 'mid' | 'outer' | 'standalone';
  imageUrl?: string;
}

export interface WardrobeItem {
  id: ID;
  userId: ID;
  garment: Garment;
  customNotes?: string;
  isFavorite: boolean;
  wearCount: number;
  addedAt: string;
  lastWornAt?: string;
}

export interface OutfitItem {
  garment: Garment;
  layerPosition: number; // 0 for base, 1 for mid, 2 for outer, etc.
  stylingNote?: string; // e.g. "Cuff hem twice", "Tuck into trousers"
}

export interface Outfit {
  id: ID;
  title: string;
  description: string;
  items: OutfitItem[];
  primaryStyleSlug: string;
  formality: FormalityLevel;
  compatibleOccasions: string[];
  seasonality: Season[];
  harmonyScore?: number;
  silhouetteBalance: string; // e.g. "Volume on top balanced with tailored bottom"
  colorStory: string; // e.g. "Tonal earth palette with cream focal point"
}
