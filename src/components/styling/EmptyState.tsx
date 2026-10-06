'use client';

import React from 'react';
import { Sparkles, ArrowRight, UserPlus } from 'lucide-react';

interface EmptyStateProps {
  onOpenEditor: () => void;
  onUseDemo: () => void;
}

export function EmptyState({ onOpenEditor, onUseDemo }: EmptyStateProps) {
  return (
    <div className="border border-neutral-300 bg-white p-8 md:p-14 text-center font-editorial-mono">
      <div className="max-w-md mx-auto space-y-5">
        <div className="w-12 h-12 mx-auto rounded-full border border-neutral-300 flex items-center justify-center text-neutral-800">
          <Sparkles className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-editorial-title uppercase tracking-widest text-neutral-900">
            PROFILE NOT INITIALIZED
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
            VAEL requires your visual features or stylistic preferences before generating calibrated looks.
            No assumptions are made without evidence.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenEditor}
            className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            BUILD YOUR PROFILE
          </button>
          <button
            onClick={onUseDemo}
            className="w-full sm:w-auto px-6 py-2.5 border border-neutral-300 hover:border-black text-neutral-800 text-xs uppercase tracking-wider transition"
          >
            TRY DEMO PROFILE
          </button>
        </div>
      </div>
    </div>
  );
}
