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

export type TimelessTrendTag = 'TIMELESS' | 'TREND';

export type ModestyLevel = 'unrestricted' | 'low-coverage' | 'standard' | 'high-coverage' | 'covered-arms' | 'covered-legs' | 'covered-both';

export type UndertonePreference = 'warm' | 'cool' | 'neutral' | 'unspecified';

export type ContrastLevel = 'low' | 'medium' | 'high' | 'unspecified';

export type HeightRange = 'compact' | 'average' | 'tall' | 'unspecified';

export type TorsoLegPreference = 'balanced' | 'longer-torso' | 'longer-legs' | 'unspecified';

export type ShoulderHipBalance = 'broad-shoulders' | 'balanced' | 'wider-hips' | 'unspecified';

export type TemperatureLevel = 'cold' | 'cool' | 'mild' | 'warm' | 'hot';

export type WeatherConditionType = 'dry' | 'rain' | 'unspecified';
