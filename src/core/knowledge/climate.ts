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
    const tempLevel = context.temperatureLevel || (
      temp !== undefined
        ? temp >= 28 ? 'hot' : temp >= 20 ? 'warm' : temp >= 14 ? 'mild' : temp >= 8 ? 'cool' : 'cold'
        : context.weather === 'hot' ? 'hot'
        : context.weather === 'warm' ? 'warm'
        : context.weather === 'cool' ? 'cool'
        : context.weather === 'cold' ? 'cold'
        : 'mild'
    );
    const isRain = context.condition === 'rain' || context.weather === 'rainy';
    const humidity = context.humidity;
    const isConfirmed = context.isWeatherConfirmed ?? true;

    // --- 1. EXTREME HEAT / HOT WEATHER (> 28°C or tempLevel === 'hot') ---
    const isHot = (temp !== undefined && temp >= 28) || tempLevel === 'hot';
    if (isHot) {
      // Functional property-based evaluation:
      // Heavyweight non-breathable fabrics, heavily lined outerwear, down, or low-temp ceiling garments
      const isExcessivelyHeavy = garment.fabricWeight === 'heavyweight' && garment.category !== 'bottom';
      const hasSevereHeatRestriction = garment.maxTemperatureC !== undefined && garment.maxTemperatureC < 25;
      const isImpermeableOuter = garment.category === 'outerwear' && garment.breathability === 'low' && garment.fabricWeight === 'heavyweight';

      if (isExcessivelyHeavy || hasSevereHeatRestriction || isImpermeableOuter) {
        return {
          score: 0.1,
          isPermissible: false,
          vetoReason: `Vetoed for extreme heat: ${garment.name} (${garment.fabricWeight}, ${garment.breathability} breathability) causes thermal discomfort above 28°C.`,
          comfortNotes: [],
          cautions: [`Incompatible with high ambient temperature.`],
          climateUncertainty: !isConfirmed,
        };
      }

      if (garment.breathability === 'high') {
        const isTropicalWool = garment.material.toLowerCase().includes('tropical') && garment.material.toLowerCase().includes('wool');
        if (isTropicalWool) {
          comfortNotes.push(`High-twist tropical wool weave provides active thermal regulation and crisp ventilation up to 28°C.`);
        } else {
          comfortNotes.push(`High breathability (${garment.material}) supports natural airflow in hot conditions.`);
        }
      }

      if (humidity === 'high' && garment.humidityTolerance === 'dry-only') {
        cautions.push(`May hold moisture under high humidity.`);
      }
    }

    // --- 2. COLD WEATHER (< 10°C or tempLevel === 'cold') ---
    const isCold = (temp !== undefined && temp <= 10) || tempLevel === 'cold';
    if (isCold) {
      // Property and coverage check: zero thermal protection, standalone shorts, open sandals
      const isSubZeroUnsuitable =
        garment.subcategory.includes('shorts') ||
        garment.subcategory.includes('sandals') ||
        (garment.fabricWeight === 'lightweight' && garment.layeringRole === 'standalone');

      if (isSubZeroUnsuitable || (garment.minTemperatureC !== undefined && garment.minTemperatureC > 16)) {
        return {
          score: 0.1,
          isPermissible: false,
          vetoReason: `Vetoed for cold weather: ${garment.name} provides insufficient thermal barrier below 10°C.`,
          comfortNotes: [],
          cautions: [`Insufficient thermal barrier against cold.`],
          climateUncertainty: !isConfirmed,
        };
      }

      if (garment.fabricWeight === 'heavyweight' || garment.breathability === 'low') {
        comfortNotes.push(`Dense thermal barrier (${garment.material}) shields against cold ambient temps.`);
      }
    }

    // --- 3. RAIN / WET CONDITIONS ---
    if (isRain) {
      if (garment.category === 'footwear') {
        if (garment.waterResistance === 'none' || garment.material.toLowerCase().includes('suede') || garment.material.toLowerCase().includes('canvas')) {
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
