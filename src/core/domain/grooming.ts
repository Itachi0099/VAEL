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
  TimelessTrendTag,
} from './types';
import { GenderCodingDirection } from './style-axis';

export interface HairStyle {
  id: ID;
  name: string;
  slug: string;
  description: string;
  targetLength: HairLength;
  compatibleTextures: HairTexture[];
  compatibleDensities: HairDensity[];
  compatibleFaceShapes: FaceShape[]; // Used strictly as a SOFT signal, never a hard veto
  incompatibleFaceShapes?: FaceShape[];
  maintenance: MaintenanceLevel;
  stylingDifficulty: StylingDifficulty;
  formalityRange: [FormalityLevel, FormalityLevel];
  compatibleStyleSlugs: string[]; // references style families
  silhouetteCharacter: 'tight' | 'balanced' | 'voluminous' | 'angular' | 'flowing';
  visualTags: string[];
  stylingTips: string[];
  protectiveStyle?: boolean;
  genderCoding?: GenderCodingDirection;

  // Knowledge versioning
  timelessOrTrend: TimelessTrendTag;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
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

  // Knowledge versioning
  timelessOrTrend: TimelessTrendTag;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroomingPairing {
  hairStyleId: ID;
  beardStyleId: ID;
  harmonyScore: number; // 0.0 to 1.0
  notes: string;
}
