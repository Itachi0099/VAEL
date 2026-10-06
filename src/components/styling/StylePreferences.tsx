'use client';

import React from 'react';
import { Sparkles, Check, Plus, Minus } from 'lucide-react';

export interface StyleOption {
  slug: string;
  name: string;
  subtitle: string;
}

export const ARCHETYPES: StyleOption[] = [
  { slug: 'minimal', name: 'Minimal', subtitle: 'Purity of line, stripped utility' },
  { slug: 'korean-minimal', name: 'Korean Minimal', subtitle: 'Fluid drapery, soft neutral harmonies' },
  { slug: 'smart-casual', name: 'Smart Casual', subtitle: 'Versatile tailoring, elevated knitwear' },
  { slug: 'old-money', name: 'Old Money', subtitle: 'Heritage fabrics, collegiate polish' },
  { slug: 'streetwear', name: 'Streetwear', subtitle: 'Oversized drape, sneaker focus' },
  { slug: 'workwear', name: 'Workwear', subtitle: 'Utilitarian canvas, chore coats, selvedge' },
  { slug: 'techwear', name: 'Techwear', subtitle: 'Weatherproof technical membranes' },
  { slug: 'dark-academia', name: 'Dark Academia', subtitle: 'Heavy wools, tweed, moody tones' },
  { slug: 'vintage', name: 'Vintage', subtitle: 'Mid-century silhouettes, worn patina' },
  { slug: 'experimental', name: 'Experimental', subtitle: 'Asymmetry, subversive tailoring' },
];

interface StylePreferencesProps {
  selectedStyles: string[];
  onToggleStyle: (slug: string) => void;
  dislikedStyles: string[];
  onToggleDislike: (slug: string) => void;
}

export function StylePreferences({
  selectedStyles,
  onToggleStyle,
  dislikedStyles,
  onToggleDislike,
}: StylePreferencesProps) {
  return (
    <div className="font-editorial-mono text-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold block">
            STYLE DIRECTION
          </span>
          <span className="text-[10px] text-neutral-400 font-sans">
            Select up to 3 style directions that align with how you wish to present yourself.
          </span>
        </div>
        <span className="text-[10px] text-neutral-400">
          {selectedStyles.length} / 3 SELECTED
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {ARCHETYPES.map((arch) => {
          const isSelected = selectedStyles.includes(arch.slug);
          const isDisliked = dislikedStyles.includes(arch.slug);

          return (
            <div
              key={arch.slug}
              className={`p-2.5 border transition flex flex-col justify-between text-left ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : isDisliked
                  ? 'border-red-200 bg-red-50/40 text-neutral-400 opacity-60'
                  : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold uppercase text-[11px] leading-tight block">
                    {arch.name}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-white shrink-0 mt-0.5" />}
                </div>
                <p
                  className={`text-[9px] mt-1 line-clamp-2 leading-relaxed ${
                    isSelected ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {arch.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-neutral-100/30 text-[9px]">
                <button
                  type="button"
                  onClick={() => onToggleStyle(arch.slug)}
                  className={`px-1.5 py-0.5 uppercase tracking-wider rounded-xs transition ${
                    isSelected
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {isSelected ? 'REMOVE' : 'SELECT'}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleDislike(arch.slug)}
                  title={isDisliked ? 'Unmark dislike' : 'Mark as dislike'}
                  className={`px-1.5 py-0.5 uppercase tracking-wider rounded-xs transition ${
                    isDisliked
                      ? 'bg-red-200 text-red-900 font-semibold'
                      : 'text-neutral-400 hover:text-red-700'
                  }`}
                >
                  {isDisliked ? 'AVOIDED' : 'AVOID'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
