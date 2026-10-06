import { FaceProfile, HairProfile, BodyProfile } from '../domain/visual';
import { GarmentCategory, FitType } from '../domain/types';

export interface VisualAnalysisInput {
  imageBuffer?: Uint8Array | Buffer;
  base64?: string;
  imageUrl?: string;
  mimeType?: string;
  contextHint?: 'face_focus' | 'full_body' | 'hair_focus' | 'outfit_flatlay';
}

export interface DetectedGarmentObservation {
  estimatedCategory: GarmentCategory;
  estimatedFit: FitType;
  colorName: string;
  detectedMaterialTexture?: string;
  confidence: number;
}

export interface DetectedOutfitObservation {
  items: DetectedGarmentObservation[];
  dominantColors: string[];
  observedSilhouette: string;
}

export interface VisualAnalysisResult {
  face: FaceProfile;
  hair: HairProfile;
  body: BodyProfile;
  detectedOutfit?: DetectedOutfitObservation;
  confidenceScore: number;
  metadata: {
    provider: string; // e.g. 'mock-vision-adapter', 'gemini-1.5-pro', 'gpt-4o'
    modelId?: string;
    isMock: boolean;
    processingTimeMs: number;
    processedAt: string;
  };
}

export interface VisualAnalyzer {
  readonly providerName: string;
  analyze(input: VisualAnalysisInput): Promise<VisualAnalysisResult>;
}
