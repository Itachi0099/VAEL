import {
  StyleVector,
  NUMERIC_STYLE_AXES,
  NumericStyleAxisKey,
  GenderCodingDirection,
} from '../domain/style-axis';

export class StyleVectorMath {
  /**
   * Calculates normalized Euclidean distance between two 10D style vectors.
   * Maximum possible distance across 10 axes with delta 4 each is sqrt(10 * 16) = sqrt(160) ≈ 12.649.
   * Result is strictly normalized between 0.00 (identical) and 1.00 (maximally distant).
   */
  static calculateDistance(a: StyleVector, b: StyleVector): number {
    let sumSquaredDiff = 0;
    for (const key of NUMERIC_STYLE_AXES) {
      const diff = a[key] - b[key];
      sumSquaredDiff += diff * diff;
    }
    const rawDistance = Math.sqrt(sumSquaredDiff);
    const maxPossibleDistance = Math.sqrt(NUMERIC_STYLE_AXES.length * 16); // (5-1)^2 = 16 per axis

    const normalized = rawDistance / maxPossibleDistance;
    return Math.max(0, Math.min(1, Math.round(normalized * 100) / 100));
  }

  /**
   * Converts distance into an intuitive affinity score [0.0, 1.0].
   * An identical style returns 1.0. Completely opposing styles return 0.0.
   */
  static calculateAffinity(a: StyleVector, b: StyleVector): number {
    const dist = this.calculateDistance(a, b);
    return Math.round((1 - dist) * 100) / 100;
  }

  /**
   * Blends multiple style vectors with optional weights into a single cohesive style vector.
   * Example: 60% Korean Minimal + 40% Modern Workwear.
   */
  static blendStyles(
    inputs: { vector: StyleVector; weight?: number }[],
    targetGenderCoding?: GenderCodingDirection
  ): StyleVector {
    if (inputs.length === 0) {
      return this.createBalancedVector();
    }

    if (inputs.length === 1) {
      return { ...inputs[0].vector };
    }

    const totalWeight = inputs.reduce((sum, item) => sum + (item.weight ?? 1.0), 0);
    if (totalWeight <= 0) {
      return this.createBalancedVector();
    }

    const blended: Record<NumericStyleAxisKey, number> = {} as any;

    for (const key of NUMERIC_STYLE_AXES) {
      let weightedSum = 0;
      for (const item of inputs) {
        const w = item.weight ?? 1.0;
        weightedSum += item.vector[key] * w;
      }
      const rawVal = weightedSum / totalWeight;
      // Clamp between 1.0 and 5.0 rounded to one decimal place
      blended[key] = Math.max(1.0, Math.min(5.0, Math.round(rawVal * 10) / 10));
    }

    // Gender coding direction: take explicit target if provided, else take dominant input weight
    let genderCoding: GenderCodingDirection = targetGenderCoding || 'unspecified';
    if (!targetGenderCoding) {
      const genderCounts: Record<string, number> = {};
      inputs.forEach((i) => {
        const g = i.vector.genderCoding;
        genderCounts[g] = (genderCounts[g] || 0) + (i.weight ?? 1.0);
      });
      const topGender = Object.entries(genderCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      genderCoding = (topGender as GenderCodingDirection) || 'unspecified';
    }

    return {
      ...blended,
      genderCoding,
    };
  }

  /**
   * Creates a default balanced style vector (3 on all numeric axes, androgynous/unspecified)
   */
  static createBalancedVector(genderCoding: GenderCodingDirection = 'unspecified'): StyleVector {
    return {
      formality: 3,
      structure: 3,
      volume: 3,
      colorIntensity: 3,
      contrast: 3,
      pattern: 3,
      texture: 3,
      ornamentation: 3,
      classicTrend: 3,
      utilityPolish: 3,
      genderCoding,
    };
  }
}
