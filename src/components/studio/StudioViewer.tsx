'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Context, Garment, Outfit } from '../../core/domain';
import { StudioLookState, StudioSlotType, AvatarAppearance } from './types';
import { StudioAdapter } from './studio-adapter';
import { StudioScene } from './StudioScene';
import { SlotDrawer } from './SlotDrawer';
import { FlatLayFallback } from './FlatLayFallback';
import {
  Shuffle,
  ChevronLeft,
  RotateCcw,
  SlidersHorizontal,
  Lock,
  Unlock,
  Eye,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface StudioViewerProps {
  user: User;
  context?: Context;
  initialOutfit?: Outfit;
  onClose?: () => void;
}

export const StudioViewer: React.FC<StudioViewerProps> = ({
  user,
  context,
  initialOutfit,
  onClose,
}) => {
  // Ranked candidate pool (read-only)
  const rankedPool = useMemo(() => StudioAdapter.getRankedPool(user, context), [user, context]);

  // Initial Look State
  const initialLookState = useMemo(() => {
    const outfit = initialOutfit || rankedPool[0];
    return StudioAdapter.fromOutfit(outfit, user, context, undefined, false);
  }, [initialOutfit, rankedPool, user, context]);

  // Session State
  const [currentLook, setCurrentLook] = useState<StudioLookState>(initialLookState);
  const [history, setHistory] = useState<StudioLookState[]>([initialLookState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lockedSlugs, setLockedSlugs] = useState<Set<string>>(new Set());
  const [viewedLookIds, setViewedLookIds] = useState<Set<string>>(new Set([initialLookState.id]));
  const [selectedSlot, setSelectedSlot] = useState<StudioSlotType | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [showAppearanceDrawer, setShowAppearanceDrawer] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  // Avatar Appearance State
  const [appearance, setAppearance] = useState<AvatarAppearance>(() =>
    StudioAdapter.getAvatarAppearance(user)
  );

  // Compatible alternatives for selected slot
  const compatibleAlternatives = useMemo(() => {
    if (!selectedSlot) return [];
    return StudioAdapter.getCompatibleSlotAlternatives(selectedSlot, currentLook, user, context);
  }, [selectedSlot, currentLook, user, context]);

  // Lock / Unlock Handler
  const handleToggleLock = useCallback((slug: string) => {
    setLockedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  // Shuffle Handler: Next Best Look beyond top 3
  const handleShuffleNext = useCallback(() => {
    const nextLook = StudioAdapter.getNextShuffleLook(
      currentLook,
      rankedPool,
      user,
      context,
      lockedSlugs,
      viewedLookIds,
      history.length
    );

    if (nextLook) {
      setCurrentLook(nextLook);
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), nextLook]);
      setHistoryIndex((prev) => prev + 1);
      setViewedLookIds((prev) => new Set([...prev, nextLook.id]));
      setSelectedSlot(null);
    }
  }, [currentLook, rankedPool, user, context, lockedSlugs, viewedLookIds, history.length, historyIndex]);

  // History Back Handler
  const handleHistoryBack = useCallback(() => {
    if (historyIndex > 0) {
      const prevLook = history[historyIndex - 1];
      setCurrentLook(prevLook);
      setHistoryIndex((prev) => prev - 1);
      setSelectedSlot(null);
    }
  }, [historyIndex, history]);

  // Slot Swap Handler
  const handleSwapPiece = useCallback(
    (slotType: StudioSlotType, newGarment: Garment) => {
      const updatedLook = StudioAdapter.swapPiece(currentLook, slotType, newGarment, user, context);
      setCurrentLook(updatedLook);
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), updatedLook]);
      setHistoryIndex((prev) => prev + 1);
      setLockedSlugs((prev) => new Set([...prev, newGarment.slug]));
      setSelectedSlot(null);
    },
    [currentLook, user, context, historyIndex]
  );

  return (
    <div className="w-full h-[680px] md:h-[760px] bg-[#faf9f6] border border-neutral-300 relative flex flex-col font-editorial-mono select-none overflow-hidden">
      {/* 1. Technical Top Bar */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-white/90 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-900">
              VAEL 3D STUDIO v0
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 border-l border-neutral-200 pl-3 hidden sm:inline">
            Illustration, not a fit simulation.
          </span>
        </div>

        {/* Look Meta & Mode Controls */}
        <div className="flex items-center gap-2">
          {/* Custom / Alternative Pill */}
          {currentLook.isCustom ? (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-xs">
              CUSTOM LOOK
            </span>
          ) : currentLook.alternativeIndex !== undefined ? (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xs">
              ALTERNATIVE {currentLook.alternativeIndex}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-neutral-900 text-white rounded-xs">
              EDITORIAL BEST MATCH
            </span>
          )}

          {/* Confidence Pill */}
          <span
            className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-xs font-semibold ${
              currentLook.confidence.state === 'STRONG'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : currentLook.confidence.state === 'GOOD'
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
            }`}
          >
            {currentLook.confidence.state} ({Math.round(currentLook.confidence.score * 100)}%)
          </span>

          {/* 3D / 2D View Mode Switch */}
          <div className="flex items-center border border-neutral-300 rounded-xs overflow-hidden ml-1">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2.5 py-1 text-[10px] uppercase font-semibold transition ${
                viewMode === '3d' && !hasWebGLError
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:text-black'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2.5 py-1 text-[10px] uppercase font-semibold transition ${
                viewMode === '2d' || hasWebGLError
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:text-black'
              }`}
            >
              2D
            </button>
          </div>

          {/* Avatar Customizer Toggle */}
          <button
            onClick={() => setShowAppearanceDrawer((v) => !v)}
            title="Configure Avatar Appearance"
            className="p-1.5 border border-neutral-300 hover:border-black text-neutral-700 hover:text-black transition rounded-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Stage Area (3D Scene or 2D Flat-Lay) */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === '3d' && !hasWebGLError ? (
          <StudioScene
            look={currentLook}
            appearance={appearance}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
          />
        ) : (
          <FlatLayFallback
            look={currentLook}
            lockedSlugs={lockedSlugs}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
          />
        )}

        {/* Slot Details & Swap Drawer */}
        <SlotDrawer
          selectedSlot={selectedSlot}
          look={currentLook}
          lockedSlugs={lockedSlugs}
          compatibleAlternatives={compatibleAlternatives}
          onClose={() => setSelectedSlot(null)}
          onToggleLock={handleToggleLock}
          onSwap={handleSwapPiece}
        />

        {/* Avatar Appearance Drawer */}
        {showAppearanceDrawer && (
          <div className="absolute top-0 left-0 w-80 h-full bg-white/95 backdrop-blur-md border-r border-neutral-200 z-30 p-5 space-y-4 shadow-xl overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-900">
                AVATAR CALIBRATION
              </span>
              <button
                onClick={() => setShowAppearanceDrawer(false)}
                className="text-neutral-400 hover:text-neutral-900 text-xs"
              >
                CLOSE
              </button>
            </div>

            {/* Skin Tone Palette */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-600">
                <span>SKIN DEPTH ({appearance.skinDepth.toUpperCase()})</span>
                {appearance.isAssumedTone && (
                  <span className="text-[9px] text-amber-700 uppercase bg-amber-50 px-1 border border-amber-200">
                    ASSUMED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {[
                  { depth: 'fair', hex: '#f5eee6' },
                  { depth: 'light', hex: '#ecd2c0' },
                  { depth: 'medium', hex: '#c79f86' },
                  { depth: 'rich', hex: '#8e5f46' },
                  { depth: 'deep', hex: '#4f3225' },
                ].map(({ depth, hex }) => (
                  <button
                    key={depth}
                    onClick={() =>
                      setAppearance((prev) => ({
                        ...prev,
                        skinTone: hex,
                        skinDepth: depth as any,
                        isAssumedTone: false,
                      }))
                    }
                    className={`w-7 h-7 rounded-full border transition ${
                      appearance.skinDepth === depth ? 'ring-2 ring-neutral-900 scale-110' : 'border-neutral-300'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Length */}
            <div className="space-y-2">
              <span className="text-[11px] text-neutral-600 block">HAIR LENGTH</span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {(['buzz', 'short', 'medium', 'shoulder', 'long'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setAppearance((prev) => ({ ...prev, hairLength: l }))}
                    className={`p-1.5 border uppercase tracking-wider transition ${
                      appearance.hairLength === l
                        ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Texture */}
            <div className="space-y-2">
              <span className="text-[11px] text-neutral-600 block">HAIR TEXTURE</span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {(['straight', 'wavy', 'curly', 'coily', 'locs', 'braids'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAppearance((prev) => ({ ...prev, hairTexture: t }))}
                    className={`p-1.5 border uppercase tracking-wider transition ${
                      appearance.hairTexture === t
                        ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="space-y-2">
              <span className="text-[11px] text-neutral-600 block">HAIR COLOR</span>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Black', hex: '#1c1b1a' },
                  { name: 'Dark Brown', hex: '#3b2f2f' },
                  { name: 'Chestnut', hex: '#5c3a21' },
                  { name: 'Blonde', hex: '#b59e5f' },
                  { name: 'Silver Grey', hex: '#949599' },
                ].map(({ name, hex }) => (
                  <button
                    key={name}
                    onClick={() => setAppearance((prev) => ({ ...prev, hairColor: hex }))}
                    className={`w-6 h-6 rounded-full border transition ${
                      appearance.hairColor === hex ? 'ring-2 ring-neutral-900 scale-110' : 'border-neutral-300'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overlay Cautions Bar if any */}
        {currentLook.cautions.length > 0 && (
          <div className="absolute top-3 left-4 max-w-sm bg-amber-50/95 border border-amber-300 p-2 text-[10px] text-amber-900 flex items-start gap-1.5 z-10 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>{currentLook.cautions[0]}</span>
          </div>
        )}
      </div>

      {/* 3. Bottom Slot Inspector & Shuffle Bar */}
      <div className="p-3 border-t border-neutral-200 bg-white flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Interactive Slots Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mr-1 hidden sm:inline">
            SLOTS:
          </span>
          {(['one-piece', 'top', 'bottom', 'outerwear', 'footwear', 'accessory'] as const).map(
            (slotType) => {
              const slot = currentLook.slots[slotType];
              if (!slot) return null;
              const isSelected = selectedSlot === slotType;
              const isLocked = lockedSlugs.has(slot.garment.slug);

              return (
                <button
                  key={slotType}
                  onClick={() => setSelectedSlot(isSelected ? null : slotType)}
                  className={`px-2.5 py-1.5 border text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 rounded-xs ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                      : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: slot.garment.color.hex }}
                  />
                  <span className="max-w-[80px] sm:max-w-[110px] truncate">{slot.garment.name}</span>
                  {isLocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                </button>
              );
            }
          )}
        </div>

        {/* Shuffle & History Controls */}
        <div className="flex items-center gap-2">
          {/* History Back */}
          <button
            onClick={handleHistoryBack}
            disabled={historyIndex <= 0}
            className={`px-3 py-2 border text-[11px] uppercase tracking-wider transition flex items-center gap-1 rounded-xs ${
              historyIndex > 0
                ? 'border-neutral-300 hover:border-black text-neutral-800'
                : 'border-neutral-200 text-neutral-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> BACK
          </button>

          {/* Shuffle Next */}
          <button
            onClick={handleShuffleNext}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-semibold uppercase tracking-wider transition flex items-center gap-2 rounded-xs shadow-xs"
          >
            <Shuffle className="w-3.5 h-3.5" /> SHUFFLE NEXT LOOK
          </button>
        </div>
      </div>
    </div>
  );
};
