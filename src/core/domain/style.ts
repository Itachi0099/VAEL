import { ID, FitType, FormalityLevel } from './types';
import { StyleVector } from './style-axis';

export interface StyleAttributes {
  primarySilhouettes: string[]; // e.g. ['relaxed-top-wide-bottom', 'box-cut-cropped']
  dominantFits: FitType[];
  colorPalette: {
    primaryTones: string[]; // e.g. ['charcoal', 'cream', 'ecru', 'slate']
    temperaturePreference?: 'cool' | 'warm' | 'neutral' | 'high-contrast';
    accentTolerances: 'monochromatic' | 'subtle-accents' | 'bold-accents';
  };
  formalityRange: [FormalityLevel, FormalityLevel];
  layeringTendency: 'minimal' | 'moderate' | 'complex';
  patternIntensity: 'none' | 'subtle' | 'bold' | 'expressive';
  coreMaterials: string[]; // e.g. ['heavy cotton', 'wool', 'linen', 'raw denim', 'leather']
  footwearTendencies: string[]; // e.g. ['derbies', 'minimal leather sneakers', 'chelsea boots']
  accessoryPhilosophy: 'strictly-utilitarian' | 'minimalist' | 'statement' | 'layered';
  visualCharacter: string[]; // e.g. ['architectural', 'clean', 'textured', 'draped']
}

export interface StyleFamily {
  id: ID;
  slug: string;
  name: string;
  editorialSubtitle: string;
  description: string;
  styleVector: StyleVector; // 11-dimensional formal style coordinate
  attributes: StyleAttributes;
  characteristicGarments: string[]; // subcategory slugs typically associated
  relatedStyleSlugs: string[];
  keyInspirations: string[];
  timelessOrTrend: 'TIMELESS' | 'TREND';
  reviewDate: string; // ISO date format YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}
