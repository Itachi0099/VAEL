import {
  ID,
  FaceShape,
  HairTexture,
  HairDensity,
  HairLength,
  BeardLength,
  BeardDensity,
  MaintenanceLevel,
  StylingDifficulty,
  FormalityLevel,
} from './types';

export interface HairStyle {
  id: ID;
  name: string;
  slug: string;
  description: string;
  targetLength: HairLength;
  compatibleTextures: HairTexture[];
  compatibleDensities: HairDensity[];
  compatibleFaceShapes: FaceShape[];
  incompatibleFaceShapes?: FaceShape[];
  maintenance: MaintenanceLevel;
  stylingDifficulty: StylingDifficulty;
  formalityRange: [FormalityLevel, FormalityLevel];
  compatibleStyleSlugs: string[]; // references style families e.g. 'minimal', 'streetwear'
  silhouetteCharacter: 'tight' | 'balanced' | 'voluminous' | 'angular' | 'flowing';
  visualTags: string[];
  stylingTips: string[];
}

export interface BeardStyle {
  id: ID;
  name: string;
  slug: string;
  description: string;
  targetLength: BeardLength;
  minimumDensity: BeardDensity;
  shapeCharacteristics: 'sculpted' | 'natural' | 'linear' | 'chin-focused' | 'clean';
  compatibleFaceShapes: FaceShape[];
  maintenance: MaintenanceLevel;
  compatibleStyleSlugs: string[];
  formalityRange: [FormalityLevel, FormalityLevel];
  visualTags: string[];
  groomingTips: string[];
}

export interface GroomingPairing {
  hairStyleId: ID;
  beardStyleId: ID;
  harmonyScore: number; // 0.0 to 1.0
  notes: string;
}
