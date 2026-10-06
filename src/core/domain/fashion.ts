import {
  ID,
  GarmentCategory,
  FitType,
  FormalityLevel,
  Season,
  WeatherCondition,
  TimelessTrendTag,
  ModestyLevel,
} from './types';
import { GenderCodingDirection } from './style-axis';

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

  // Climate and physical properties
  fabricWeight: 'lightweight' | 'midweight' | 'heavyweight';
  breathability: 'high' | 'moderate' | 'low';
  waterResistance: 'none' | 'water-resistant' | 'waterproof';
  minTemperatureC?: number; // Minimum recommended ambient temperature in Celsius
  maxTemperatureC?: number; // Maximum recommended ambient temperature in Celsius
  humidityTolerance: 'all' | 'dry-only' | 'high-humidity-friendly';

  pattern: 'solid' | 'subtle-stripe' | 'houndstooth' | 'plaid' | 'graphic' | 'textured-weave';
  formality: FormalityLevel;

  // Style axis ratings for the garment
  structure: number; // 1-5
  volume: number; // 1-5
  texture: number; // 1-5

  modestyRating: ModestyLevel;
  genderCoding: GenderCodingDirection;

  seasons: Season[];
  compatibleWeather: WeatherCondition[];
  compatibleStyleSlugs: string[];
  layeringRole?: 'base' | 'mid' | 'outer' | 'standalone';
  imageUrl?: string;

  // Knowledge versioning & review
  timelessOrTrend: TimelessTrendTag;
  reviewDate: string; // ISO date format YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  sourceNotes?: string;
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
  modestyRating?: ModestyLevel;
  minTemperatureC?: number;
  maxTemperatureC?: number;
}
