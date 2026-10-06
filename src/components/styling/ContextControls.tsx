'use client';

import React from 'react';
import { FormalityLevel, WeatherCondition } from '@/core/domain';
import { Sun, Cloud, Snowflake, CloudRain, Wind } from 'lucide-react';

export interface OccasionItem {
  slug: string;
  name: string;
  formality: FormalityLevel;
}

export const POPULAR_OCCASIONS: OccasionItem[] = [
  { slug: 'dinner', name: 'Dinner / Evening', formality: 3 },
  { slug: 'office', name: 'Workplace', formality: 3 },
  { slug: 'date', name: 'Intimate Date', formality: 3 },
  { slug: 'college', name: 'Campus / Daily', formality: 2 },
  { slug: 'wedding', name: 'Formal Wedding', formality: 4 },
  { slug: 'party', name: 'Gallery / Party', formality: 3 },
  { slug: 'casual', name: 'Weekend Casual', formality: 1 },
  { slug: 'job-interview', name: 'Job Interview', formality: 4 },
];

interface ContextControlsProps {
  selectedOccasion: string;
  onSelectOccasion: (slug: string) => void;
  weather: WeatherCondition;
  onSelectWeather: (weather: WeatherCondition) => void;
  formalityOverride?: FormalityLevel;
  onSelectFormality?: (level: FormalityLevel) => void;
  temperature?: number;
  onTemperatureChange?: (celsius: number) => void;
}

export function ContextControls({
  selectedOccasion,
  onSelectOccasion,
  weather,
  onSelectWeather,
  formalityOverride,
  onSelectFormality,
  temperature,
  onTemperatureChange,
}: ContextControlsProps) {
  return (
    <div className="space-y-4 font-editorial-mono text-xs">
      {/* Occasion Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">
            WHERE ARE YOU GOING?
          </span>
          <span className="text-[10px] text-neutral-400 uppercase">
            TARGET OCCASION
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_OCCASIONS.map((occ) => {
            const isSelected = selectedOccasion === occ.slug;
            return (
              <button
                key={occ.slug}
                onClick={() => onSelectOccasion(occ.slug)}
                className={`px-3 py-1.5 uppercase tracking-wider text-[11px] border transition ${
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
      </div>

      {/* Climate & Weather Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">
            WEATHER:
          </span>
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'mild', label: 'Mild' },
                { id: 'hot', label: 'Hot' },
                { id: 'cool', label: 'Cool' },
                { id: 'cold', label: 'Cold' },
                { id: 'rainy', label: 'Rainy' },
              ] as const
            ).map((w) => (
              <button
                key={w.id}
                onClick={() => onSelectWeather(w.id)}
                className={`px-2 py-0.5 uppercase text-[10px] border transition ${
                  weather === w.id
                    ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formality Tuning (Optional Calibration) */}
        {onSelectFormality && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              FORMALITY:
            </span>
            <div className="flex items-center gap-1">
              {([1, 2, 3, 4, 5] as FormalityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => onSelectFormality(level)}
                  className={`w-5 h-5 flex items-center justify-center text-[10px] border transition ${
                    formalityOverride === level
                      ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
