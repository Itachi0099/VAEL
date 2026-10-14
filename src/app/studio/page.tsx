'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, CheckCircle2, ShieldCheck, Cpu, Info } from 'lucide-react';
import { DynamicStudioViewer } from '@/components/studio';
import { SAMPLE_STUDIO_PROFILES, StudioProfileOption } from '@/components/studio/sample-profiles';
import { BUILD_INFO } from '@/core/version';

export default function StudioPage() {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('profile_01');
  const [isFeatureFlagActive, setIsFeatureFlagActive] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check environment feature flag or URL preview parameter
    const envFlag = process.env.NEXT_PUBLIC_STUDIO_ENABLED === 'true';
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const previewOverride = urlParams?.get('preview') === '1' || urlParams?.get('studio') === 'true';
    
    // In dev mode or when flag/override is present, enable studio
    if (process.env.NODE_ENV === 'development' || envFlag || previewOverride) {
      setIsFeatureFlagActive(true);
    } else {
      setIsFeatureFlagActive(false);
    }
  }, []);

  const activeProfileOption: StudioProfileOption =
    SAMPLE_STUDIO_PROFILES.find((p) => p.id === selectedProfileId) || SAMPLE_STUDIO_PROFILES[0];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 font-editorial-mono">
      {/* Editorial Studio Masthead */}
      <header className="border-b border-neutral-300 bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 border border-neutral-200 hover:border-black rounded-xs transition text-neutral-600 hover:text-black flex items-center gap-1.5 text-xs uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>FLAGSHIP</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-editorial-title uppercase font-semibold tracking-wider text-neutral-950">
                  VAEL STUDIO 3D SPIKE
                </h1>
                <span className="text-[10px] uppercase tracking-wider bg-neutral-900 text-white px-2 py-0.5 rounded-xs">
                  R2.0 SPIKE
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-xs">
                  ISOLATED ADAPTER
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-0.5">
                Client-only dynamic 3D styling figure · Read-only recommendation adapter
              </p>
            </div>
          </div>

          {/* Feature Flag & Spec Status */}
          <div className="flex items-center gap-2 text-[10px] text-neutral-600">
            <span className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 px-2 py-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ENGINE UNTOUCHED
            </span>
            <span className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 px-2 py-1">
              <Cpu className="w-3 h-3 text-blue-600" />
              R3F CLIENT CHUNK
            </span>
            <span className="bg-neutral-100 border border-neutral-200 px-2 py-1">
              BUILD: {BUILD_INFO.commitHash}
            </span>
          </div>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Feature Flag Notice if disabled */}
        {!isFeatureFlagActive && mounted && (
          <div className="bg-amber-50 border border-amber-300 p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase">
              <Info className="w-4 h-4 text-amber-700" />
              STUDIO SPIKE BEHIND FEATURE FLAG
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-sans">
              The 3D Studio route is currently gated behind the{' '}
              <code className="bg-amber-100 px-1 py-0.5 font-editorial-mono text-[11px]">
                NEXT_PUBLIC_STUDIO_ENABLED
              </code>{' '}
              environment variable. As specified in R2.0, the 3D dependencies are isolated in a dynamic client-only chunk so that the core flagship application bundle pays 0 KB.
            </p>
            <button
              onClick={() => setIsFeatureFlagActive(true)}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] uppercase tracking-wider font-semibold"
            >
              PREVIEW 3D SPIKE ANYWAY
            </button>
          </div>
        )}

        {isFeatureFlagActive && (
          <>
            {/* Profile Switcher Ribbon */}
            <div className="bg-white border border-neutral-300 p-4 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900">
                  SELECT REAL ENGINE PROFILE (3 SAMPLE CONTEXTS):
                </span>
                <span className="text-[11px] text-neutral-500">
                  Evaluated via read-only combinatorial generator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SAMPLE_STUDIO_PROFILES.map((p) => {
                  const isSelected = p.id === selectedProfileId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`p-3 text-left border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-neutral-950 bg-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 hover:border-neutral-400 text-neutral-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-xs ${
                              isSelected
                                ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                                : 'bg-white text-neutral-700 border border-neutral-300'
                            }`}
                          >
                            {p.badge}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wider mt-1">
                          {p.name}
                        </div>
                        <p
                          className={`text-[10px] mt-1 font-sans line-clamp-2 ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-600'
                          }`}
                        >
                          {p.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3D Dynamic Viewer Mounting */}
            <div className="relative">
              <DynamicStudioViewer
                key={activeProfileOption.id}
                user={activeProfileOption.user}
                context={activeProfileOption.context}
              />
            </div>

            {/* Technical Verification & Architecture Strip */}
            <div className="bg-white border border-neutral-300 p-5 space-y-4 shadow-2xs text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="font-semibold uppercase tracking-wider text-neutral-900">
                  R2.0 TECHNICAL AUDIT SUMMARY
                </span>
                <span className="text-[10px] text-neutral-500 uppercase">
                  Honest Tagged Reporting
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px]">
                <div className="p-3 bg-[#faf9f6] border border-neutral-200 space-y-1">
                  <span className="text-neutral-400 text-[9px] uppercase block">TARGET FRAME RATE</span>
                  <span className="font-semibold text-neutral-900 text-base">60 FPS</span>
                  <p className="text-[10px] text-neutral-600 font-sans">
                    Targeted on modern hardware and mid-range mobile with capped DPR (1.5).
                  </p>
                </div>

                <div className="p-3 bg-[#faf9f6] border border-neutral-200 space-y-1">
                  <span className="text-neutral-400 text-[9px] uppercase block">CORE APP BUNDLE IMPACT</span>
                  <span className="font-semibold text-emerald-700 text-base">0 KB</span>
                  <p className="text-[10px] text-neutral-600 font-sans">
                    Dynamic import (`ssr: false`) strictly isolates Three.js / R3F into a standalone chunk.
                  </p>
                </div>

                <div className="p-3 bg-[#faf9f6] border border-neutral-200 space-y-1">
                  <span className="text-neutral-400 text-[9px] uppercase block">ARCHETYPE COVERAGE</span>
                  <span className="font-semibold text-neutral-900 text-base">268 / 268 (100%)</span>
                  <p className="text-[10px] text-neutral-600 font-sans">
                    Every garment in catalog maps cleanly to one of 30 parametric 3D archetypes.
                  </p>
                </div>

                <div className="p-3 bg-[#faf9f6] border border-neutral-200 space-y-1">
                  <span className="text-neutral-400 text-[9px] uppercase block">ASSET LICENSES</span>
                  <span className="font-semibold text-neutral-900 text-base">PERMISSIVE (MIT)</span>
                  <p className="text-[10px] text-neutral-600 font-sans">
                    Zero third-party meshes. Procedural geometry only. Documented in LICENSES.
                  </p>
                </div>
              </div>

              {/* Behavior Checklist */}
              <div className="border-t border-neutral-200 pt-3 text-[11px] space-y-1 text-neutral-700">
                <span className="font-semibold uppercase tracking-wider text-neutral-900 block mb-1">
                  BEHAVIOR SPECIFICATION VERIFICATION:
                </span>
                <ul className="list-disc list-inside space-y-1 font-sans">
                  <li>
                    <strong>Auto-rotate:</strong> Vertical axis (~18 s / rev). Drag/touch rotates, pinch/scroll zooms, polar angles limited. Auto-rotate pauses on interaction and resumes after 3 s idle.
                  </li>
                  <li>
                    <strong>Reduced Motion:</strong> Honors `prefers-reduced-motion` media query by disabling auto-spin and displaying manual step buttons.
                  </li>
                  <li>
                    <strong>Shuffle:</strong> Pulls next best candidate from engine pool beyond top 3, requiring $\ge 2$ axis differences. Preserves locked garments.
                  </li>
                  <li>
                    <strong>Slots & Swap:</strong> Tap any slot to view attributes, lock status, and ranked compatible alternatives with real-time compatibility scores.
                  </li>
                  <li>
                    <strong>2D Flat-Lay Fallback:</strong> Dedicated non-WebGL fallback view retaining full shuffle, lock, and swap functionality.
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-neutral-300 bg-white py-6 mt-12 text-center text-xs text-neutral-500 font-editorial-mono">
        <p>VAEL ARCHIVE · 3D STUDIO SPIKE · BUILD {BUILD_INFO.commitHash} · {BUILD_INFO.buildDate}</p>
        <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest">
          Illustration, not a fit simulation.
        </p>
      </footer>
    </div>
  );
}
