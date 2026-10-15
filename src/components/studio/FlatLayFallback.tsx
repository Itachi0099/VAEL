'use client';

import React from 'react';
import { StudioLookState, StudioSlotType } from './types';
import { Lock } from 'lucide-react';

interface FlatLayFallbackProps {
  look: StudioLookState;
  lockedSlugs: Set<string>;
  selectedSlot: StudioSlotType | null;
  onSelectSlot: (slotType: StudioSlotType) => void;
}

export const FlatLayFallback: React.FC<FlatLayFallbackProps> = ({
  look,
  lockedSlugs,
  selectedSlot,
  onSelectSlot,
}) => {
  const activeSlots: Array<{ type: StudioSlotType; title: string }> = [
    { type: 'outerwear', title: 'OUTER LAYER' },
    { type: 'one-piece', title: 'FOUNDATION ONE-PIECE' },
    { type: 'top', title: 'FOUNDATION TOP' },
    { type: 'bottom', title: 'FOUNDATION BOTTOM' },
    { type: 'footwear', title: 'GROUNDING FOOTWEAR' },
    { type: 'accessory', title: 'TECHNICAL ACCENT' },
  ];

  return (
    <div className="w-full h-full bg-[#f8f7f4] dark:bg-[#121212] p-6 md:p-10 overflow-y-auto flex flex-col justify-center items-center font-editorial-mono">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            EDITORIAL FLAT-LAY PRESENTATION
          </span>
          <h2 className="text-lg font-editorial-title uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
            {look.title}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
            Score: {Math.round(look.totalScore * 100)}% · Formality Level {look.outfit.formality}
          </p>
        </div>

        {/* Flat-Lay Garment Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeSlots.map(({ type, title }) => {
            const slot = look.slots[type];
            if (!slot) return null;
            const garment = slot.garment;
            const isSelected = selectedSlot === type;
            const isLocked = lockedSlugs.has(garment.slug);

            return (
              <div
                key={type}
                onClick={() => onSelectSlot(type)}
                className={`p-4 border transition cursor-pointer relative bg-white dark:bg-[#18181b] flex flex-col justify-between min-h-[120px] ${
                  isSelected
                    ? 'border-neutral-950 dark:border-white ring-1 ring-neutral-950 dark:ring-white shadow-md'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >

                <div>
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                    <span>{title}</span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-neutral-900 font-semibold">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase leading-snug">
                    {garment.name}
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-sans mt-0.5 line-clamp-1">
                    {garment.material}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[10px] text-neutral-600 mt-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                      style={{ backgroundColor: garment.color.hex }}
                    />
                    <span className="text-[10px] text-neutral-500">{garment.color.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-700">F{garment.formality} · {garment.fit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-[10px] text-neutral-400 uppercase tracking-widest pt-4">
          Tap any slot above to inspect properties, lock pieces, or swap compatible alternatives.
        </div>
      </div>
    </div>
  );
};
