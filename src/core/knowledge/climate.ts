import { Garment } from '../domain/fashion';
import { Context } from '../domain/context';

export interface ClimateEvaluationResult {
  score: number; // 0.0 to 1.0
  isPermissible: boolean; // false triggers hard veto in recommendation filter
  vetoReason?: string;
  comfortNotes: string[];
  cautions: string[];
  climateUncertainty: boolean; // true if weather/temperature was assumed rather than confirmed
}

export class ClimateFabricRules {
  /**
   * Evaluates garments against active context temperature, weather condition, and humidity.
   * Enforces strict physiological comfort thresholds:
   * 1. Extreme Heat (> 28°C): Hard veto on heavy wool, multi-layer knits, down, and heavy leather.
   * 2. Cold (< 10°C): Hard veto on shorts or single sheer layers without thermal outer/mid protection.
   * 3. Rain: Penalizes unprotected canvas/suede footwear; rewards water-resistant outer layers.
   */
  static evaluateGarmentClimateFit(garment: Garment, context?: Context): ClimateEvaluationResult {
    const comfortNotes: string[] = [];
    const cautions: string[] = [];

    if (!context || (!context.temperatureCelsius && !context.weather && !context.season)) {
      return {
        score: 0.75,
        isPermissible: true,
        comfortNotes: ['Default climate baseline assumed; weather context was not specified.'],
        cautions: [],
        climateUncertainty: true,
      };
    }

    const temp = context.temperatureCelsius;
    const weather = context.weather;
    const humidity = context.humidity;
    const isConfirmed = context.isWeatherConfirmed ?? true;

    // --- 1. EXTREME HEAT / HOT WEATHER (> 28°C or weather === 'hot') ---
    const isHot = (temp !== undefined && temp >= 28) || weather === 'hot';
    if (isHot) {
      // VETO CONDITION: Heavyweight fabrics, wool outer/knit, leather outerwear in extreme heat
      const isExcessivelyHeavy = garment.fabricWeight === 'heavyweight' && garment.category !== 'bottom';
      const isHeatIncompatibleMaterial =
        garment.material.toLowerCase().includes('melton wool') ||
        garment.material.toLowerCase().includes('boiled wool') ||
        garment.material.toLowerCase().includes('down') ||
        garment.material.toLowerCase().includes('heavyweight fleece') ||
        (garment.category === 'outerwear' && garment.material.toLowerCase().includes('leather'));

      if (isHeatIncompatibleMaterial || (garment.maxTemperatureC !== undefined && garment.maxTemperatureC < 25)) {
        return {
          score: 0.1,
          isPermissible: false,
          vetoReason: `Vetoed for extreme heat: ${garment.name} (${garment.material}) will cause severe thermal discomfort above 28°C.`,
          comfortNotes: [],
          cautions: [`Incompatible with high ambient temperature.`],
          climateUncertainty: !isConfirmed,
        };
      }

      if (garment.breathability === 'high') {
        comfortNotes.push(`High breathability (${garment.material}) supports natural airflow in hot conditions.`);
      }

      if (humidity === 'high' && garment.humidityTolerance === 'dry-only') {
        cautions.push(`May hold moisture under high humidity.`);
      }
    }

    // --- 2. COLD WEATHER (< 10°C or weather === 'cold') ---
    const isCold = (temp !== undefined && temp <= 10) || weather === 'cold';
    if (isCold) {
      // VETO CONDITION: Shorts, open sandals, or ultra-lightweight standalone summer pieces in sub-10°C cold
      const isSubZeroUnsuitable =
        garment.subcategory.includes('shorts') ||
        garment.subcategory.includes('sandals') ||
        (garment.material.toLowerCase().includes('linen') && garment.layeringRole === 'standalone');

      if (isSubZeroUnsuitable || (garment.minTemperatureC !== undefined && garment.minTemperatureC > 16)) {
        return {
          score: 0.1,
          isPermissible: false,
          vetoReason: `Vetoed for cold weather: ${garment.name} provides zero thermal insulation below 10°C.`,
          comfortNotes: [],
          cautions: [`Insufficient thermal barrier against cold.`],
          climateUncertainty: !isConfirmed,
        };
      }

      if (garment.fabricWeight === 'heavyweight' || garment.material.toLowerCase().includes('wool')) {
        comfortNotes.push(`Dense thermal barrier (${garment.material}) shields against cold ambient temps.`);
      }
    }

    // --- 3. RAIN / WET CONDITIONS ---
    if (weather === 'rainy') {
      if (garment.category === 'footwear') {
        if (garment.material.toLowerCase().includes('suede') || garment.material.toLowerCase().includes('canvas')) {
          cautions.push(`Porous ${garment.material} footwear will absorb rainwater without protective treatment.`);
        }
      }
      if (garment.waterResistance === 'waterproof' || garment.waterResistance === 'water-resistant') {
        comfortNotes.push(`Water-repellent construction protects against precipitation.`);
      }
    }

    // Baseline temperature range match
    let tempScore = 0.85;
    if (temp !== undefined && garment.minTemperatureC !== undefined && garment.maxTemperatureC !== undefined) {
      if (temp >= garment.minTemperatureC && temp <= garment.maxTemperatureC) {
        tempScore = 0.98;
      } else {
        const delta = Math.min(Math.abs(temp - garment.minTemperatureC), Math.abs(temp - garment.maxTemperatureC));
        tempScore = Math.max(0.4, 0.9 - delta * 0.05);
      }
    }

    return {
      score: Math.round(tempScore * 100) / 100,
      isPermissible: true,
      comfortNotes,
      cautions,
      climateUncertainty: !isConfirmed,
    };
  }

  /**
   * Evaluates an entire ensemble (outfit) for thermal balance and weather suitability
   */
  static evaluateOutfitClimateFit(garments: Garment[], context?: Context): ClimateEvaluationResult {
    let combinedScore = 0;
    const allComfortNotes: string[] = [];
    const allCautions: string[] = [];
    let isPermissible = true;
    let vetoReason: string | undefined;

    for (const g of garments) {
      const gResult = this.evaluateGarmentClimateFit(g, context);
      if (!gResult.isPermissible) {
        isPermissible = false;
        vetoReason = gResult.vetoReason;
        break;
      }
      combinedScore += gResult.score;
      allComfortNotes.push(...gResult.comfortNotes);
      allCautions.push(...gResult.cautions);
    }

    const avgScore = garments.length > 0 ? combinedScore / garments.length : 0.8;

    return {
      score: Math.round(avgScore * 100) / 100,
      isPermissible,
      vetoReason,
      comfortNotes: Array.from(new Set(allComfortNotes)),
      cautions: Array.from(new Set(allCautions)),
      climateUncertainty: context?.isWeatherConfirmed === false,
    };
  }
}
