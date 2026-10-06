'use client';

import React from 'react';
import { Sparkles, Edit3, CheckCircle2, RotateCcw } from 'lucide-react';
import { VisualProfile } from '@/core/domain';

interface ProfileHeaderProps {
  mode: 'EMPTY' | 'DEMO' | 'CONFIGURED';
  visual?: VisualProfile;
  onOpenEditor: () => void;
  onResetProfile: () => void;
  onUseDemo: () => void;
}

export function ProfileHeader({
  mode,
  visual,
  onOpenEditor,
  onResetProfile,
  onUseDemo,
}: ProfileHeaderProps) {
  if (mode === 'EMPTY' || !visual) {
    return (
      <div className="border border-neutral-300 bg-neutral-50/60 p-5 font-editorial-mono text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
              <span className="uppercase tracking-widest font-semibold text-neutral-700">
                PROFILE NOT SET
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-md normal-case font-sans">
              VAEL does not guess what it has not observed or received. Enter your physical features or load sample profile to begin.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onUseDemo}
              className="px-3.5 py-1.5 border border-neutral-300 bg-white hover:border-black text-neutral-800 transition tracking-wider uppercase text-[11px]"
            >
              TRY DEMO
            </button>
            <button
              onClick={onOpenEditor}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white transition tracking-wider uppercase text-[11px] font-semibold"
            >
              BUILD YOUR PROFILE
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDemo = mode === 'DEMO';
  const faceShape = visual.face?.shape || 'Not specified';
  const hairTexture = visual.hair?.texture || 'Not specified';
  const hairDensity = visual.hair?.density || 'Not specified';
  const facialHair = visual.face?.hasFacialHair
    ? visual.face.beardCharacteristics?.currentLength || 'Present'
    : 'Clean-shaven';

  return (
    <div className={`p-4 border font-editorial-mono text-xs ${
      isDemo
        ? 'border-dashed border-neutral-300 bg-neutral-50/80'
        : 'border-neutral-900 bg-white shadow-xs'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${isDemo ? 'bg-amber-600' : 'bg-neutral-950'}`}></span>
          <span className="uppercase tracking-widest font-semibold text-neutral-900">
            {isDemo ? 'DEMO MODE — SAMPLE PROFILE' : 'YOUR PROFILE'}
          </span>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest px-1.5 py-0.5 bg-neutral-200">
            {isDemo ? 'READ-ONLY SAMPLE' : 'USER ENTERED'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isDemo ? (
            <button
              onClick={onOpenEditor}
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 bg-black text-white hover:bg-neutral-800 transition tracking-wider uppercase"
            >
              <Sparkles className="w-3 h-3" />
              CREATE YOUR OWN
            </button>
          ) : (
            <button
              onClick={onOpenEditor}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 border border-neutral-300 hover:border-black text-neutral-800 transition tracking-wider uppercase"
            >
              <Edit3 className="w-3 h-3" />
              EDIT PROFILE
            </button>
          )}

          <button
            onClick={onResetProfile}
            title="Reset profile"
            className="p-1 text-neutral-400 hover:text-black transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-neutral-800 text-[11px]">
        <div>
          <span className="text-neutral-400 block uppercase text-[10px]">FACE</span>
          <span className="font-semibold uppercase">{faceShape}</span>
        </div>
        <div>
          <span className="text-neutral-400 block uppercase text-[10px]">HAIR</span>
          <span className="font-semibold uppercase">{hairTexture}</span> ({hairDensity})
        </div>
        <div>
          <span className="text-neutral-400 block uppercase text-[10px]">GROOMING</span>
          <span className="font-semibold uppercase">{facialHair}</span>
        </div>
        <div>
          <span className="text-neutral-400 block uppercase text-[10px]">SOURCE & CONFIDENCE</span>
          <span className="font-semibold">
            {isDemo ? 'DEMO (95%)' : 'USER ENTERED (100%)'}
          </span>
        </div>
      </div>
    </div>
  );
}
