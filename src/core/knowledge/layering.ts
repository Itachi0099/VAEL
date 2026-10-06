import { Garment } from '../domain/fashion';

export interface LayeringEvaluation {
  isHarmonious: boolean;
  score: number; // 0.0 to 1.0
  volumeProgression: 'proper' | 'reversed' | 'excessive_bulk';
  notes: string[];
  warnings: string[];
}

/**
 * Layering and Volume Stacking Rules
 *
 * Evaluates multi-layer torso assemblies (base -> mid -> outer):
 * 1. Base should have lower or equal structural weight/volume than outer.
 * 2. Stacking two heavyweight outerwear items is flagged as excessive bulk.
 * 3. Slim, tight jackets over chunky heavyweight knits create bunching tension.
 * 4. Midweight breathable bases under tailored outers are optimal.
 */
export class LayeringRules {
  static evaluateLayerStack(items: Garment[]): LayeringEvaluation {
    const notes: string[] = [];
    const warnings: string[] = [];

    const base = items.find((g) => g.layeringRole === 'base' || g.category === 'top');
    const mid = items.find((g) => g.layeringRole === 'mid');
    const outer = items.find((g) => g.layeringRole === 'outer' || g.category === 'outerwear');

    if (!outer || !base) {
      return {
        isHarmonious: true,
        score: 0.95,
        volumeProgression: 'proper',
        notes: ['Single layer torso foundation without stacking conflicts.'],
        warnings: [],
      };
    }

    let score = 0.95;
    let volumeProgression: 'proper' | 'reversed' | 'excessive_bulk' = 'proper';

    // Rule 1: Bulk Stacking check (Multiple heavyweights on torso)
    const heavyTorsoItems = items.filter(
      (g) => (g.category === 'top' || g.category === 'outerwear') && g.fabricWeight === 'heavyweight'
    );
    if (heavyTorsoItems.length >= 2) {
      score -= 0.3;
      volumeProgression = 'excessive_bulk';
      warnings.push(
        `Excessive bulk stacking: Layering ${heavyTorsoItems.map((g) => g.name).join(' and ')} creates restrictive immobility.`
      );
    }

    // Rule 2: Fit/Volume Inversion (Slim jacket over bulky/oversized knit or top)
    if (outer.fit === 'slim' && (base.fit === 'oversized' || base.volume >= 4)) {
      score -= 0.25;
      volumeProgression = 'reversed';
      warnings.push(
        `Fit compression tension: Slim tailored outer layer (${outer.name}) constricts high-volume base layer (${base.name}).`
      );
    }

    // Rule 3: Harmonious progression (Fluid base under structured outer)
    if (base.structure <= outer.structure && base.volume <= outer.volume + 1) {
      notes.push(
        `Harmonious volume progression: Clean base (${base.material}) drapes cleanly underneath structured outerwear frame (${outer.name}).`
      );
    }

    // Rule 4: Mid-layer integration
    if (mid) {
      if (mid.fabricWeight === 'heavyweight' && outer.fabricWeight === 'heavyweight') {
        score -= 0.2;
        warnings.push('Heavy mid-layer combined with heavy outer layer inhibits ease of movement.');
      } else {
        notes.push('Intermediate thermal buffer provides modular depth without silhouette distortion.');
      }
    }

    return {
      isHarmonious: score >= 0.7,
      score: Math.max(0.1, Math.round(score * 100) / 100),
      volumeProgression,
      notes,
      warnings,
    };
  }
}
