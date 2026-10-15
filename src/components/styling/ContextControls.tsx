'use client';

import React, { useState } from 'react';
import { FormalityLevel, TemperatureLevel, WeatherConditionType } from '@/core/domain';
import { AlertCircle, Check } from 'lucide-react';

export interface OccasionItem {
  slug: string;
  name: string;
  defaultFormality: FormalityLevel;
  allowableRange: [FormalityLevel, FormalityLevel];
  subParameters?: string[];
}

export const ALL_OCCASIONS: OccasionItem[] = [
  { slug: 'office', name: 'Workplace', defaultFormality: 3, allowableRange: [2, 4], subParameters: ['corporate', 'creative', 'startup'] },
  { slug: 'job-interview', name: 'Job Interview', defaultFormality: 4, allowableRange: [3, 5], subParameters: ['corporate', 'creative', 'startup'] },
  { slug: 'wedding-guest', name: 'Wedding Guest', defaultFormality: 4, allowableRange: [3, 5], subParameters: ['day', 'evening'] },
  { slug: 'dinner', name: 'Fine Dining / Dinner', defaultFormality: 4, allowableRange: [3, 5] },
  { slug: 'date', name: 'Evening Date', defaultFormality: 3, allowableRange: [2, 4] },
  { slug: 'night-out', name: 'Night Out / Lounge', defaultFormality: 2, allowableRange: [2, 4] },
  { slug: 'party', name: 'Social Gathering / Party', defaultFormality: 2, allowableRange: [1, 3] },
  { slug: 'casual', name: 'Everyday Casual', defaultFormality: 1, allowableRange: [1, 2] },
  { slug: 'university-college', name: 'Campus / College', defaultFormality: 2, allowableRange: [1, 3] },
  { slug: 'cultural-traditional', name: 'Cultural Ceremony', defaultFormality: 4, allowableRange: [3, 5] },
  { slug: 'travel', name: 'Travel', defaultFormality: 2, allowableRange: [1, 3] },
  { slug: 'custom', name: 'Custom', defaultFormality: 3, allowableRange: [1, 5] },
];

interface ContextControlsProps {
  selectedOccasion: string;
  onSelectOccasion: (slug: string) => void;
  selectedSubParameter?: string;
  onSelectSubParameter?: (sub: string) => void;
  temperatureLevel?: TemperatureLevel;
  onSelectTemperatureLevel?: (level: TemperatureLevel) => void;
  weatherCondition?: WeatherConditionType;
  onSelectWeatherCondition?: (condition: WeatherConditionType) => void;
  // Legacy props
  weather?: string;
  onSelectWeather?: (weather: any) => void;
  formalityOverride?: FormalityLevel;
  onSelectFormality?: (level: FormalityLevel, isOverridden?: boolean) => void;
}

export function ContextControls({
  selectedOccasion,
  onSelectOccasion,
  selectedSubParameter,
  onSelectSubParameter,
  temperatureLevel = 'mild',
  onSelectTemperatureLevel,
  weatherCondition = 'dry',
  onSelectWeatherCondition,
  weather,
  onSelectWeather,
  formalityOverride,
  onSelectFormality,
}: ContextControlsProps) {
  const [pendingFormalityOverride, setPendingFormalityOverride] = useState<FormalityLevel | null>(null);

  // Track user-interaction authority (defaults are tagged 'assumed' until clicked)
  const [isOccasionAssumed, setIsOccasionAssumed] = useState<boolean>(true);
  const [isTempAssumed, setIsTempAssumed] = useState<boolean>(true);
  const [isConditionAssumed, setIsConditionAssumed] = useState<boolean>(true);
  const [isFormalityAssumed, setIsFormalityAssumed] = useState<boolean>(true);

  const currentOccasion = ALL_OCCASIONS.find(
    (o) => o.slug === selectedOccasion || (selectedOccasion === 'wedding' && o.slug === 'wedding-guest') || (selectedOccasion === 'college' && o.slug === 'university-college')
  ) || ALL_OCCASIONS[0];

  const minAllowed = currentOccasion.allowableRange[0];
  const maxAllowed = currentOccasion.allowableRange[1];

  const handleFormalityClick = (level: FormalityLevel) => {
    setIsFormalityAssumed(false);
    if (level < minAllowed || level > maxAllowed) {
      // Out-of-band: trigger plain-language warning dialog
      setPendingFormalityOverride(level);
    } else {
      if (onSelectFormality) {
        onSelectFormality(level, false);
      }
    }
  };

  const confirmOverride = () => {
    if (pendingFormalityOverride && onSelectFormality) {
      onSelectFormality(pendingFormalityOverride, true);
    }
    setPendingFormalityOverride(null);
  };

  const tempOptions = [
    { id: 'cold', label: 'Cold (<6°C)' },
    { id: 'cool', label: 'Cool (6–15°C)' },
    { id: 'mild', label: 'Mild (16–22°C)' },
    { id: 'warm', label: 'Warm (23–27°C)' },
    { id: 'hot', label: 'Hot (>27°C)' },
  ] as const;

  const conditionOptions = [
    { id: 'dry', label: 'Clear / Dry' },
    { id: 'rain', label: 'Rain / Wet' },
  ] as const;

  const formalityOptions: FormalityLevel[] = [1, 2, 3, 4, 5];

  // Arrow key navigation helpers
  const handleTempKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % tempOptions.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (currentIdx - 1 + tempOptions.length) % tempOptions.length;
    } else {
      return;
    }
    e.preventDefault();
    const nextItem = tempOptions[nextIdx];
    setIsTempAssumed(false);
    if (onSelectTemperatureLevel) onSelectTemperatureLevel(nextItem.id);
    if (onSelectWeather) onSelectWeather(nextItem.id);
    const btn = document.getElementById(`temp-btn-${nextItem.id}`);
    btn?.focus();
  };

  const handleConditionKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % conditionOptions.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (currentIdx - 1 + conditionOptions.length) % conditionOptions.length;
    } else {
      return;
    }
    e.preventDefault();
    const nextItem = conditionOptions[nextIdx];
    setIsConditionAssumed(false);
    if (onSelectWeatherCondition) onSelectWeatherCondition(nextItem.id);
    if (nextItem.id === 'rain' && onSelectWeather) onSelectWeather('rainy');
    else if (nextItem.id === 'dry' && onSelectWeather) onSelectWeather(temperatureLevel || 'mild');
    const btn = document.getElementById(`condition-btn-${nextItem.id}`);
    btn?.focus();
  };

  return (
    <div className="space-y-4 font-editorial-mono text-xs">
      {/* Occasion Selection (All 12 Registry Occasions) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
              WHERE ARE YOU GOING?
            </span>
            {isOccasionAssumed ? (
              <span className="text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded-2xs">
                DEFAULT (assumed)
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-2xs">
                USER CONFIRMED
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase">
            OCCASION
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Occasion Selection"
          className="flex flex-wrap gap-1.5"
        >
          {ALL_OCCASIONS.map((occ) => {
            const isSelected =
              selectedOccasion === occ.slug ||
              (selectedOccasion === 'wedding' && occ.slug === 'wedding-guest') ||
              (selectedOccasion === 'college' && occ.slug === 'university-college');

            return (
              <button
                key={occ.slug}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setIsOccasionAssumed(false);
                  onSelectOccasion(occ.slug);
                }}
                className={`px-2.5 py-1.5 uppercase tracking-wider text-[11px] border transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black font-semibold'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                }`}
              >
                {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white dark:bg-black mr-0.5" aria-hidden="true" />}
                {occ.name}
              </button>
            );
          })}
        </div>

        {/* Sub-parameters for Workplace, Interview, and Wedding */}
        {currentOccasion.subParameters && onSelectSubParameter && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
              SUB-SETTING:
            </span>
            <div className="flex flex-wrap gap-1">
              {currentOccasion.subParameters.map((sub) => (
                <button
                  key={sub}
                  onClick={() => onSelectSubParameter(sub)}
                  className={`px-2 py-0.5 uppercase text-[10px] border transition ${
                    selectedSubParameter === sub
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black font-semibold'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Climate: Distinct Temperature Band & Atmospheric Precipitation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-6">
          {/* Temperature Levels (Strict Single-Select Radio Group with Arrow-Key Nav) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span id="temperature-group-label" className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                TEMPERATURE
              </span>
              {isTempAssumed && (
                <span className="text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1 py-0.2 rounded-2xs">
                  assumed
                </span>
              )}
            </div>
            <div
              role="radiogroup"
              aria-labelledby="temperature-group-label"
              className="flex items-center gap-1"
            >
              {tempOptions.map((t, idx) => {
                const isSelected = (temperatureLevel || weather || 'mild') === t.id;
                return (
                  <button
                    key={t.id}
                    id={`temp-btn-${t.id}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onKeyDown={(e) => handleTempKeyDown(e, idx)}
                    onClick={() => {
                      setIsTempAssumed(false);
                      if (onSelectTemperatureLevel) onSelectTemperatureLevel(t.id);
                      if (onSelectWeather) onSelectWeather(t.id);
                    }}
                    className={`px-2 py-0.5 uppercase text-[10px] border transition flex items-center gap-1 ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black font-semibold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                    }`}
                  >
                    {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white dark:bg-black mr-0.5" aria-hidden="true" />}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition: Mutually Exclusive Clear / Dry vs Rain / Wet with Helper Text */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span id="condition-group-label" className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                PRECIPITATION (Clear | Rain)
              </span>
              {isConditionAssumed && (
                <span className="text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1 py-0.2 rounded-2xs">
                  assumed
                </span>
              )}
            </div>
            <div
              role="radiogroup"
              aria-labelledby="condition-group-label"
              className="flex items-center gap-1"
            >
              {conditionOptions.map((c, idx) => {
                const isSelected = (weatherCondition || (weather === 'rainy' ? 'rain' : 'dry')) === c.id;
                return (
                  <button
                    key={c.id}
                    id={`condition-btn-${c.id}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onKeyDown={(e) => handleConditionKeyDown(e, idx)}
                    onClick={() => {
                      setIsConditionAssumed(false);
                      if (onSelectWeatherCondition) onSelectWeatherCondition(c.id);
                      if (c.id === 'rain' && onSelectWeather) onSelectWeather('rainy');
                      else if (c.id === 'dry' && onSelectWeather) onSelectWeather(temperatureLevel || 'mild');
                    }}
                    className={`px-2.5 py-0.5 uppercase text-[10px] border transition flex items-center gap-1 ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black font-semibold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                    }`}
                  >
                    {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white dark:bg-black mr-0.5" aria-hidden="true" />}
                    {c.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic hidden xl:inline">
              Rain adds water-resistant outer layers and footwear
            </span>
          </div>
        </div>

        {/* Formality Slider with Occasion Band Enforced (F-04) */}
        {onSelectFormality && (
          <div className="flex items-center gap-2">
            <span id="formality-group-label" className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              FORMALITY ({minAllowed}–{maxAllowed}):
            </span>
            <div
              role="radiogroup"
              aria-labelledby="formality-group-label"
              className="flex items-center gap-1"
            >
              {formalityOptions.map((lvl) => {
                const isCurrent = (formalityOverride || currentOccasion.defaultFormality) === lvl;
                const isOutOfBand = lvl < minAllowed || lvl > maxAllowed;

                return (
                  <button
                    key={lvl}
                    id={`formality-btn-${lvl}`}
                    type="button"
                    role="radio"
                    aria-checked={isCurrent}
                    onClick={() => handleFormalityClick(lvl)}
                    className={`w-5 h-5 flex items-center justify-center text-[10px] border transition ${
                      isCurrent
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black font-semibold'
                        : isOutOfBand
                        ? 'border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 hover:border-neutral-600'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                    title={isOutOfBand ? `Outside usual ${currentOccasion.name} band (${minAllowed}-${maxAllowed})` : undefined}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 italic xl:hidden">
        Rain adds water-resistant outer layers and footwear
      </div>


      {/* Formality Out-of-Band Warning Dialog Modal (F-04) */}
      {pendingFormalityOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-editorial-mono">
          <div className="bg-white dark:bg-[#161619] border border-neutral-900 dark:border-neutral-700 max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm uppercase font-semibold text-neutral-900 dark:text-neutral-100 tracking-wider">
                  FORMALITY OUTSIDE OCCASION BAND
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans mt-1.5 leading-relaxed">
                  You selected formality level <strong>{pendingFormalityOverride}</strong>, but <strong>{currentOccasion.name}</strong> typically calls for levels <strong>{minAllowed} to {maxAllowed}</strong>.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1 italic">
                  Choosing an out-of-band formality will override occasion dress code scoring. Do you want to proceed?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setPendingFormalityOverride(null)}
                className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-[11px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white"
              >
                KEEP IN BAND
              </button>
              <button
                type="button"
                onClick={confirmOverride}
                className="px-4 py-1.5 bg-neutral-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-[11px] uppercase tracking-wider font-semibold"
              >
                CONFIRM OVERRIDE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
