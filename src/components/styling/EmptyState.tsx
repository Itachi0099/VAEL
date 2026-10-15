'use client';

import React from 'react';
import { Sparkles, ArrowRight, UserPlus } from 'lucide-react';

interface EmptyStateProps {
  onOpenEditor: () => void;
  onUseDemo: () => void;
}

export function EmptyState({ onOpenEditor, onUseDemo }: EmptyStateProps) {
  return (
    <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#161619] p-8 md:p-14 text-center font-editorial-mono">
      <div className="max-w-md mx-auto space-y-5">
        <div className="w-12 h-12 mx-auto rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
          <Sparkles className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-editorial-title uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            PROFILE REQUIRED
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-2 leading-relaxed">
            Build your profile to generate tailored looks.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenEditor}
            className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs uppercase tracking-wider font-semibold transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            BUILD YOUR PROFILE
          </button>
          <button
            onClick={onUseDemo}
            className="w-full sm:w-auto px-6 py-2.5 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-800 dark:text-neutral-200 text-xs uppercase tracking-wider transition"
          >
            TRY DEMO PROFILE
          </button>
        </div>
      </div>
    </div>

  );
}
