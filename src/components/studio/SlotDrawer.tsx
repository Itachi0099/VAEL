'use client';

import React from 'react';
import { Garment } from '../../core/domain';
import { StudioLookState, StudioSlotType } from './types';
import { Lock, Unlock, ArrowRight, X, AlertCircle } from 'lucide-react';

interface SlotDrawerProps {
  selectedSlot: StudioSlotType | null;
  look: StudioLookState;
  lockedSlugs: Set<string>;
  compatibleAlternatives: Array<{ garment: Garment; compatibilityScore: number; reason: string }>;
  onClose: () => void;
  onToggleLock: (slug: string) => void;
  onSwap: (slotType: StudioSlotType, garment: Garment) => void;
}

export const SlotDrawer: React.FC<SlotDrawerProps> = ({
  selectedSlot,
  look,
  lockedSlugs,
  compatibleAlternatives,
  onClose,
  onToggleLock,
  onSwap,
}) => {
  if (!selectedSlot) return null;

  const slotData = look.slots[selectedSlot];
  const garment = slotData?.garment;
  if (!garment) return null;

  const isLocked = lockedSlugs.has(garment.slug);

  return (
    <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white/95 backdrop-blur-md border-l border-neutral-200 z-30 flex flex-col font-editorial-mono shadow-2xl transition-all animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">SLOT DETAILS</span>
          <span className="text-xs uppercase font-semibold text-neutral-900">• {selectedSlot}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-900 transition rounded-xs"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Piece Details */}
      <div className="p-5 border-b border-neutral-200 space-y-3 bg-[#faf9f6]/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-editorial-title text-sm tracking-wide text-neutral-900 uppercase">
              {garment.name}
            </h3>
            <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
              {garment.material} · {garment.fabricWeight}
            </p>
          </div>
          {/* Color Swatch */}
          <div
            className="w-5 h-5 rounded-full border border-neutral-300 shadow-xs shrink-0"
            style={{ backgroundColor: garment.color.hex }}
            title={garment.color.name}
          />
        </div>

        {/* Technical Specs */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-600 pt-2 border-t border-neutral-200/60">
          <div>Formality: <span className="font-semibold text-neutral-900">Level {garment.formality}</span></div>
          <div>Structure: <span className="font-semibold text-neutral-900">Level {garment.structure}</span></div>
          <div>Coding: <span className="font-semibold text-neutral-900">{garment.genderCoding} ({garment.garmentCoding !== undefined ? (garment.garmentCoding > 0 ? `+${garment.garmentCoding}` : garment.garmentCoding) : '0'})</span></div>
          <div>Lining: <span className="font-semibold text-neutral-900">{garment.lining || 'unlined'}</span></div>
        </div>

        {/* Lock / Unlock Toggle Button */}
        <div className="pt-2">
          <button
            onClick={() => onToggleLock(garment.slug)}
            className={`w-full py-2 px-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition ${
              isLocked
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 hover:border-neutral-900 text-neutral-800'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" /> PIECE LOCKED ACROSS SHUFFLES
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-neutral-400" /> LOCK PIECE IN LOOK
              </>
            )}
          </button>
        </div>
      </div>

      {/* SWAP Compatible Alternatives */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-500">
          <span>COMPATIBLE SWAP OPTIONS</span>
          <span className="text-[10px] text-neutral-400">{compatibleAlternatives.length} available</span>
        </div>

        {compatibleAlternatives.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-400 font-sans">
            No compatible alternative pieces found within current climate bounds.
          </div>
        ) : (
          <div className="space-y-2">
            {compatibleAlternatives.map(({ garment: altGarment, compatibilityScore, reason }) => (
              <div
                key={altGarment.id}
                onClick={() => onSwap(selectedSlot, altGarment)}
                className="p-3 border border-neutral-200 hover:border-neutral-800 bg-white transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-neutral-300"
                      style={{ backgroundColor: altGarment.color.hex }}
                    />
                    <span className="text-xs font-semibold text-neutral-900 group-hover:text-black">
                      {altGarment.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-sans">
                    {altGarment.material} · Formality {altGarment.formality}
                  </p>
                  <div className="text-[9px] text-neutral-400 uppercase tracking-tight">
                    {reason}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-neutral-700">
                    {Math.round(compatibilityScore * 100)}%
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
