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
  { slug: 'travel', name: 'Airport Transit', defaultFormality: 2, allowableRange: [1, 3] },
  { slug: 'custom', name: 'Custom Curated Event', defaultFormality: 3, allowableRange: [1, 5] },
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

  const currentOccasion = ALL_OCCASIONS.find(
    (o) => o.slug === selectedOccasion || (selectedOccasion === 'wedding' && o.slug === 'wedding-guest') || (selectedOccasion === 'college' && o.slug === 'university-college')
  ) || ALL_OCCASIONS[0];

  const minAllowed = currentOccasion.allowableRange[0];
  const maxAllowed = currentOccasion.allowableRange[1];

  const handleFormalityClick = (level: FormalityLevel) => {
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

  return (
    <div className="space-y-4 font-editorial-mono text-xs">
      {/* Occasion Selection (All 12 Registry Occasions) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">
            WHERE ARE YOU GOING?
          </span>
          <span className="text-[10px] text-neutral-400 uppercase">
            12 OCCASIONS REGISTERED
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_OCCASIONS.map((occ) => {
            const isSelected =
              selectedOccasion === occ.slug ||
              (selectedOccasion === 'wedding' && occ.slug === 'wedding-guest') ||
              (selectedOccasion === 'college' && occ.slug === 'university-college');

            return (
              <button
                key={occ.slug}
                onClick={() => onSelectOccasion(occ.slug)}
                className={`px-2.5 py-1.5 uppercase tracking-wider text-[11px] border transition ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {occ.name}
              </button>
            );
          })}
        </div>

        {/* Sub-parameters for Workplace, Interview, and Wedding */}
        {currentOccasion.subParameters && onSelectSubParameter && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-neutral-100">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wide">
              SUB-SETTING:
            </span>
            <div className="flex flex-wrap gap-1">
              {currentOccasion.subParameters.map((sub) => (
                <button
                  key={sub}
                  onClick={() => onSelectSubParameter(sub)}
                  className={`px-2 py-0.5 uppercase text-[10px] border transition ${
                    selectedSubParameter === sub
                      ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Climate: Split Temperature & Rain Condition (F-05) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-4">
          {/* Temperature Levels */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              TEMPERATURE:
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'cold', label: 'Cold' },
                  { id: 'cool', label: 'Cool' },
                  { id: 'mild', label: 'Mild' },
                  { id: 'warm', label: 'Warm' },
                  { id: 'hot', label: 'Hot' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (onSelectTemperatureLevel) onSelectTemperatureLevel(t.id);
                    if (onSelectWeather) onSelectWeather(t.id);
                  }}
                  className={`px-2 py-0.5 uppercase text-[10px] border transition ${
                    (temperatureLevel === t.id || weather === t.id)
                      ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Condition: Dry vs Rain */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              CONDITION:
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'dry', label: 'Dry' },
                  { id: 'rain', label: 'Rain' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (onSelectWeatherCondition) onSelectWeatherCondition(c.id);
                    if (c.id === 'rain' && onSelectWeather) onSelectWeather('rainy');
                  }}
                  className={`px-2 py-0.5 uppercase text-[10px] border transition ${
                    (weatherCondition === c.id || (c.id === 'rain' && weather === 'rainy'))
                      ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Formality Slider with Occasion Band Enforced (F-04) */}
        {onSelectFormality && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              FORMALITY (BAND {minAllowed}–{maxAllowed}):
            </span>
            <div className="flex items-center gap-1">
              {([1, 2, 3, 4, 5] as FormalityLevel[]).map((lvl) => {
                const isCurrent = formalityOverride === lvl;
                const isOutOfBand = lvl < minAllowed || lvl > maxAllowed;

                return (
                  <button
                    key={lvl}
                    onClick={() => handleFormalityClick(lvl)}
                    className={`w-5 h-5 flex items-center justify-center text-[10px] border transition ${
                      isCurrent
                        ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                        : isOutOfBand
                        ? 'border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 hover:border-neutral-600'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
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

      {/* Formality Out-of-Band Warning Dialog Modal (F-04) */}
      {pendingFormalityOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-editorial-mono">
          <div className="bg-white border border-neutral-900 max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm uppercase font-semibold text-neutral-900 tracking-wider">
                  FORMALITY OUTSIDE OCCASION BAND
                </h4>
                <p className="text-xs text-neutral-600 font-sans mt-1.5 leading-relaxed">
                  You selected formality level <strong>{pendingFormalityOverride}</strong>, but <strong>{currentOccasion.name}</strong> typically calls for levels <strong>{minAllowed} to {maxAllowed}</strong>.
                </p>
                <p className="text-xs text-neutral-500 font-sans mt-1 italic">
                  Choosing an out-of-band formality will override occasion dress code scoring. Do you want to proceed?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setPendingFormalityOverride(null)}
                className="px-3 py-1.5 border border-neutral-300 text-[11px] uppercase tracking-wider text-neutral-700 hover:border-black"
              >
                KEEP IN BAND
              </button>
              <button
                type="button"
                onClick={confirmOverride}
                className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-[11px] uppercase tracking-wider font-semibold"
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
