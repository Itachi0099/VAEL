import {
  VisualAnalyzer,
  VisualAnalysisInput,
  VisualAnalysisResult,
} from './visual-analyzer.interface';
import { FaceShape, HairTexture } from '../domain/types';

export interface MockArchetypePreset {
  name: string;
  faceShape: FaceShape;
  hairTexture: HairTexture;
}

/**
 * MockVisualAnalyzer
 *
 * NOTE: This is explicitly a development / simulation adapter.
 * It simulates multimodal computer vision output with structured observations
 * adhering strictly to the VAEL VisualProfile schema.
 */
export class MockVisualAnalyzer implements VisualAnalyzer {
  readonly providerName = 'mock-vision-adapter (V1 Development Stub)';

  private archetypeIndex = 0;

  private archetypes: VisualAnalysisResult[] = [
    {
      face: {
        shape: 'oval',
        jaw: 'sharp',
        proportions: {
          foreheadRatio: 'balanced',
          cheekboneProminence: 'moderate',
          facialThirdsBalance: 'balanced',
        },
        hasFacialHair: true,
        beardCharacteristics: {
          currentLength: 'stubble',
          observedDensity: 'medium',
          growthPattern: 'full',
        },
      },
      hair: {
        texture: 'wavy',
        density: 'high',
        length: 'short',
        volume: 'moderate',
        currentStyleDescription: 'Overgrown taper with soft forward wave',
        hairline: 'straight',
        colorTone: 'dark',
      },
      body: {
        silhouette: 'trapezoid',
        shoulderToHipRatio: 'broad-shoulders',
        torsoToLegRatio: 'balanced',
        heightImpression: 'average',
      },
      detectedOutfit: {
        items: [
          {
            estimatedCategory: 'top',
            estimatedFit: 'oversized',
            colorName: 'off-white',
            detectedMaterialTexture: 'heavy jersey',
            confidence: 0.92,
          },
          {
            estimatedCategory: 'bottom',
            estimatedFit: 'relaxed',
            colorName: 'charcoal',
            detectedMaterialTexture: 'wool blend',
            confidence: 0.89,
          },
        ],
        dominantColors: ['off-white', 'charcoal'],
        observedSilhouette: 'relaxed-drape',
      },
      confidenceScore: 0.94,
      metadata: {
        provider: 'mock-vision-adapter',
        modelId: 'vael-mock-archetype-01',
        isMock: true,
        processingTimeMs: 45,
        processedAt: new Date().toISOString(),
      },
    },
    {
      face: {
        shape: 'square',
        jaw: 'angular',
        proportions: {
          foreheadRatio: 'compact',
          cheekboneProminence: 'high',
          facialThirdsBalance: 'balanced',
        },
        hasFacialHair: false,
      },
      hair: {
        texture: 'straight',
        density: 'medium',
        length: 'medium',
        volume: 'moderate',
        currentStyleDescription: 'Center parted flow',
        hairline: 'rounded',
        colorTone: 'medium',
      },
      body: {
        silhouette: 'rectangle',
        shoulderToHipRatio: 'balanced',
        torsoToLegRatio: 'longer-legs',
        heightImpression: 'tall',
      },
      confidenceScore: 0.91,
      metadata: {
        provider: 'mock-vision-adapter',
        modelId: 'vael-mock-archetype-02',
        isMock: true,
        processingTimeMs: 38,
        processedAt: new Date().toISOString(),
      },
    },
  ];

  async analyze(input: VisualAnalysisInput): Promise<VisualAnalysisResult> {
    // Simulate slight async inference latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Cycle through archetypes or return default
    const result = { ...this.archetypes[this.archetypeIndex % this.archetypes.length] };
    result.metadata.processedAt = new Date().toISOString();
    this.archetypeIndex++;
    return result;
  }
}
