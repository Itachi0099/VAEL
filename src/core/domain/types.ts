export type ID = string;

export type FaceShape =
  | 'oval'
  | 'square'
  | 'round'
  | 'rectangle'
  | 'heart'
  | 'diamond'
  | 'triangle';

export type JawCharacteristic =
  | 'sharp'
  | 'soft'
  | 'angular'
  | 'prominent'
  | 'narrow'
  | 'receding';

export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily';

export type HairDensity = 'low' | 'medium' | 'high';

export type HairLength = 'buzz' | 'short' | 'medium' | 'shoulder' | 'long';

export type HairVolume = 'flat' | 'moderate' | 'voluminous';

export type BeardLength = 'clean-shaven' | 'stubble' | 'short' | 'medium' | 'full';

export type BeardDensity = 'patchy' | 'medium' | 'thick' | 'none';

export type BodySilhouette =
  | 'inverted-triangle'
  | 'rectangle'
  | 'trapezoid'
  | 'oval'
  | 'triangle';

export type FitType =
  | 'skinny'
  | 'slim'
  | 'regular'
  | 'relaxed'
  | 'oversized'
  | 'boxy'
  | 'tailored';

export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'outerwear'
  | 'footwear'
  | 'accessory'
  | 'one-piece';

export type FormalityLevel = 1 | 2 | 3 | 4 | 5; // 1 = ultra casual (lounge), 3 = smart casual, 5 = black tie / ultra formal

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';

export type WeatherCondition =
  | 'hot'
  | 'warm'
  | 'mild'
  | 'cool'
  | 'cold'
  | 'rainy'
  | 'windy';

export type MaintenanceLevel = 'minimal' | 'moderate' | 'high';

export type StylingDifficulty = 'easy' | 'moderate' | 'advanced';
