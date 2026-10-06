import {
  TemperatureLevel,
  WeatherConditionType,
  FormalityLevel,
  FitType,
  ModestyLevel,
  UndertonePreference,
  ContrastLevel,
  GenderIdentity,
  StyleExpression,
  User,
  Context,
} from '../domain';

export interface SanitizedContextState {
  occasionSlug: string;
  temperatureLevel: TemperatureLevel;
  weatherCondition: WeatherConditionType;
  formality: FormalityLevel;
  subParameter?: string;
  isOverridden: boolean;
}

const VALID_TEMPERATURES: TemperatureLevel[] = ['cold', 'cool', 'mild', 'warm', 'hot'];
const VALID_CONDITIONS: WeatherConditionType[] = ['dry', 'rain', 'unspecified'];

/**
 * Sanitizes context input state on hydration or user input.
 * Resolves legacy arrays (e.g. ['MILD', 'WARM'] -> 'mild') to a single canonical value.
 */
export function sanitizeContextState(raw: any): SanitizedContextState {
  let temp: TemperatureLevel = 'mild';
  if (Array.isArray(raw?.temperatureLevel)) {
    const first = String(raw.temperatureLevel[0] || '').toLowerCase();
    temp = (VALID_TEMPERATURES as string[]).includes(first) ? (first as TemperatureLevel) : 'mild';
  } else if (typeof raw?.temperatureLevel === 'string') {
    const normalized = raw.temperatureLevel.toLowerCase();
    temp = (VALID_TEMPERATURES as string[]).includes(normalized) ? (normalized as TemperatureLevel) : 'mild';
  } else if (typeof raw?.weather === 'string') {
    const normalized = raw.weather.toLowerCase();
    if (normalized === 'rainy') {
      temp = 'mild';
    } else {
      temp = (VALID_TEMPERATURES as string[]).includes(normalized) ? (normalized as TemperatureLevel) : 'mild';
    }
  }

  let cond: WeatherConditionType = 'dry';
  if (Array.isArray(raw?.weatherCondition)) {
    const first = String(raw.weatherCondition[0] || '').toLowerCase();
    cond = first === 'rain' ? 'rain' : 'dry';
  } else if (typeof raw?.weatherCondition === 'string') {
    const normalized = raw.weatherCondition.toLowerCase();
    cond = normalized === 'rain' ? 'rain' : 'dry';
  } else if (raw?.weather === 'rainy') {
    cond = 'rain';
  }

  let formality: FormalityLevel = 3;
  if (typeof raw?.targetFormality === 'number' && raw.targetFormality >= 1 && raw.targetFormality <= 5) {
    formality = Math.round(raw.targetFormality) as FormalityLevel;
  } else if (typeof raw?.formality === 'number' && raw.formality >= 1 && raw.formality <= 5) {
    formality = Math.round(raw.formality) as FormalityLevel;
  }

  const occasionSlug = typeof raw?.occasionSlug === 'string' && raw.occasionSlug.trim() ? raw.occasionSlug : 'dinner';

  return {
    occasionSlug,
    temperatureLevel: temp,
    weatherCondition: cond,
    formality,
    subParameter: typeof raw?.subParameter === 'string' ? raw.subParameter : undefined,
    isOverridden: Boolean(raw?.isFormalityOverridden || raw?.isOverridden),
  };
}

/**
 * Sanitizes user profile state on hydration, preventing invalid legacy array leakages.
 */
export function sanitizeProfileState(raw: any): any {
  if (!raw) return null;
  const preferences = raw.styleProfile?.preferences || {};

  // Single-select sanitization
  const topFit = Array.isArray(preferences.preferredFits) && preferences.preferredFits[0]
    ? preferences.preferredFits[0]
    : 'relaxed';
  const bottomFit = Array.isArray(preferences.preferredFits) && preferences.preferredFits[1]
    ? preferences.preferredFits[1]
    : 'regular';

  const undertone: UndertonePreference = ['warm', 'cool', 'neutral'].includes(preferences.userConfirmedUndertone)
    ? preferences.userConfirmedUndertone
    : 'unspecified';

  const modesty: ModestyLevel = [
    'unrestricted',
    'covered-arms',
    'covered-legs',
    'covered-both',
    'high-coverage',
    'low-coverage',
    'standard',
  ].includes(preferences.modestyLevel)
    ? preferences.modestyLevel
    : 'unrestricted';

  const genderIdentity: GenderIdentity = [
    'man',
    'woman',
    'non-binary',
    'prefer-not-to-specify',
    'self-describe',
  ].includes(preferences.genderIdentity)
    ? preferences.genderIdentity
    : 'unspecified';

  const styleExpression: StyleExpression = [
    'masculine',
    'feminine',
    'androgynous',
    'no-preference',
  ].includes(preferences.styleExpression || preferences.genderCodingDirection)
    ? (preferences.styleExpression || preferences.genderCodingDirection)
    : 'androgynous';

  return {
    ...raw,
    styleProfile: {
      ...raw.styleProfile,
      preferences: {
        ...preferences,
        topFit,
        bottomFit,
        userConfirmedUndertone: undertone,
        modestyLevel: modesty,
        genderIdentity,
        styleExpression,
        genderCodingDirection: styleExpression === 'no-preference' ? 'unspecified' : styleExpression,
      },
    },
  };
}
