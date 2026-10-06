'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  X,
  Compass,
} from 'lucide-react';

import { ProfileHeader } from '@/components/styling/ProfileHeader';
import { ProfileModal, ProfileFormData } from '@/components/styling/ProfileModal';
import { ContextControls } from '@/components/styling/ContextControls';
import { StylePreferences } from '@/components/styling/StylePreferences';
import { LookCard } from '@/components/styling/LookCard';
import { EmptyState } from '@/components/styling/EmptyState';
import { TopThreeLooks, WeatherCondition, FormalityLevel, VisualProfile, User } from '@/core/domain';

type ActiveView = 'LOOKS' | 'HAIR' | 'GROOMING' | 'STYLE LAB';

export default function VaelShell() {
  const [activeView, setActiveView] = useState<ActiveView>('LOOKS');
  const [profileMode, setProfileMode] = useState<'EMPTY' | 'DEMO' | 'CONFIGURED'>('DEMO');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active User / Profile State
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [manualProfileData, setManualProfileData] = useState<Partial<ProfileFormData>>({});

  // Context & Preference State
  const [selectedOccasion, setSelectedOccasion] = useState<string>('dinner');
  const [selectedWeather, setSelectedWeather] = useState<WeatherCondition>('mild');
  const [formalityOverride, setFormalityOverride] = useState<FormalityLevel | undefined>(undefined);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['korean-minimal', 'minimal']);
  const [dislikedStyles, setDislikedStyles] = useState<string[]>([]);

  // Engine Output State
  const [topThreeLooks, setTopThreeLooks] = useState<TopThreeLooks | null>(null);
  const [hairRecs, setHairRecs] = useState<any[]>([]);
  const [beardRecs, setBeardRecs] = useState<any[]>([]);
  const [styleFamilies, setStyleFamilies] = useState<any[]>([]);
  const [selectedStyleSlug, setSelectedStyleSlug] = useState<string>('korean-minimal');
  const [styleExploration, setStyleExploration] = useState<any>(null);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Initialize demo data on load
  useEffect(() => {
    initializeVael();
  }, []);

  const initializeVael = async () => {
    try {
      const pRes = await fetch('/api/profile');
      const pData = await pRes.json();
      if (pData.data) {
        setActiveUser(pData.data);
      }

      const stylesRes = await fetch('/api/styles');
      const stylesData = await stylesRes.json();
      setStyleFamilies(stylesData.data || []);

      // Generate initial flagship looks
      generateLooksForContext(pData.data, 'dinner', 'mild', ['korean-minimal', 'minimal']);
    } catch (err) {
      console.error('Failed to initialize VAEL:', err);
    }
  };

  const generateLooksForContext = async (
    userToUse: User | null,
    occ = selectedOccasion,
    weather = selectedWeather,
    styles = selectedStyles,
    formality = formalityOverride
  ) => {
    if (!userToUse && profileMode === 'EMPTY') {
      setTopThreeLooks(null);
      return;
    }

    setIsGenerating(true);
    try {
      const payload: any = {
        occasionSlug: occ,
        weather: weather,
        activeStyles: styles,
        targetFormality: formality,
      };

      if (profileMode === 'CONFIGURED' && userToUse) {
        payload.customUser = userToUse;
      } else if (profileMode === 'DEMO') {
        payload.userId = 'usr_vael_curator';
      }

      const res = await fetch('/api/recommendations/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.data?.topThree) {
        setTopThreeLooks(data.data.topThree);
      }

      // Fetch accompanying individual recommendations
      fetchHair(userToUse, occ);
      fetchGrooming(userToUse, occ);
    } catch (err) {
      console.error('Error calculating styling recommendations:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchHair = async (user?: any, occ = selectedOccasion) => {
    try {
      const payload: any = { occasionSlug: occ };
      if (profileMode === 'CONFIGURED' && user) {
        payload.customUser = user;
      } else if (profileMode === 'EMPTY') {
        payload.isExplicitEmpty = true;
      }
      const res = await fetch('/api/recommendations/hair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.data) {
        setHairRecs(data.data.recommendations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGrooming = async (user?: any, occ = selectedOccasion) => {
    try {
      const payload: any = { occasionSlug: occ };
      if (profileMode === 'CONFIGURED' && user) {
        payload.customUser = user;
      } else if (profileMode === 'EMPTY') {
        payload.isExplicitEmpty = true;
      }
      const res = await fetch('/api/recommendations/grooming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.data) {
        setBeardRecs(data.data.recommendations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileSave = (formData: ProfileFormData) => {
    setManualProfileData(formData);
    setProfileMode('CONFIGURED');

    // Build user visual profile from user inputs
    const updatedVisual: VisualProfile = {
      id: `vis_user_${Date.now()}`,
      userId: 'usr_manual_session',
      face: {
        shape: formData.faceShape,
        jaw: 'angular',
        hasFacialHair: formData.facialHair !== 'clean-shaven',
        beardCharacteristics:
          formData.facialHair !== 'clean-shaven'
            ? {
                currentLength: formData.facialHair.replace('-beard', '') as any,
                observedDensity: 'medium',
                growthPattern: 'full',
              }
            : undefined,
      },
      hair: {
        texture: formData.hairTexture,
        density: formData.hairDensity,
        length: formData.hairLength,
        volume: 'moderate',
      },
      body: {
        silhouette: 'rectangle',
      },
      source: 'user_input',
      confidenceScore: 1.0,
      lastObservedAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: 'usr_manual_session',
      name: 'Custom User',
      handle: 'custom',
      createdAt: new Date().toISOString(),
      visualProfile: updatedVisual,
      styleProfile: {
        id: 'sty_manual_session',
        userId: 'usr_manual_session',
        dominantAestheticSlugs: selectedStyles,
        styleVector: {
          formality: 3,
          structure: 3,
          volume: 3,
          colorIntensity: 1,
          contrast: 3,
          pattern: 1,
          texture: 2,
          ornamentation: 1,
          classicTrend: 3,
          utilityPolish: 3,
          genderCoding: formData.genderDirection,
        },
        preferences: {
          preferredStyleSlugs: selectedStyles,
          dislikedStyleSlugs: dislikedStyles,
          preferredColors: ['black', 'white', 'charcoal', 'off-white'],
          dislikedColors: [],
          preferredFits: [formData.topFit, formData.bottomFit],
          dislikedFits: ['skinny'],
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          fitProportions: {
            preferredFits: [formData.topFit, formData.bottomFit],
            dislikedFits: ['skinny'],
            topVolume: formData.topFit === 'boxy' || formData.topFit === 'oversized' ? 4 : 3,
            bottomVolume: formData.bottomFit === 'relaxed' || formData.bottomFit === 'oversized' ? 4 : 3,
            preferredSilhouettes: [],
            dislikedSilhouettes: [],
            layeringPreference: 'moderate',
            garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
          },
          modestyLevel: formData.modestyLevel || 'unrestricted',
          userConfirmedUndertone: formData.undertone || 'unspecified',
          contrastLevel: formData.contrastLevel || 'unspecified',
          traditionConstraint: formData.traditionConstraint || undefined,
          budgetTier: formData.budgetTier || 'unspecified',
          heightRange: formData.heightRange || 'unspecified',
          torsoLegPreference: formData.torsoLegPreference || 'unspecified',
          shoulderHipBalance: formData.shoulderHipBalance || 'unspecified',
          genderCodingDirection: formData.genderDirection,
          preferredFormalityRange: [2, 4],
          maxMaintenanceTolerance: formData.maintenanceTolerance,
          accessoryAffinities: ['signet-rings'],
        },
        feedbackProfile: {
          history: [],
          learnedStyleAffinities: {},
          learnedColorAffinities: {},
          learnedSilhouetteAffinities: {},
          learnedFitAffinities: {},
          repeatPassCount: {},
        },
        updatedAt: new Date().toISOString(),
      },
    };

    setActiveUser(newUser);
    generateLooksForContext(newUser, selectedOccasion, selectedWeather, selectedStyles);
    setFeedbackNotice('Profile updated with your physical characteristics.');
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleUseDemo = async () => {
    setProfileMode('DEMO');
    try {
      const pRes = await fetch('/api/profile');
      const pData = await pRes.json();
      if (pData.data) {
        setActiveUser(pData.data);
        generateLooksForContext(pData.data, selectedOccasion, selectedWeather, selectedStyles);
        setFeedbackNotice('Switched to Demo Mode (Sample Profile).');
        setTimeout(() => setFeedbackNotice(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetProfile = () => {
    setProfileMode('EMPTY');
    setActiveUser(null);
    setTopThreeLooks(null);
    setFeedbackNotice('Profile reset. Please set your characteristics or load demo.');
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleToggleStyle = (slug: string) => {
    let next: string[];
    if (selectedStyles.includes(slug)) {
      if (selectedStyles.length === 1) return; // Keep at least one
      next = selectedStyles.filter((s) => s !== slug);
    } else {
      if (selectedStyles.length >= 3) {
        next = [...selectedStyles.slice(1), slug];
      } else {
        next = [...selectedStyles, slug];
      }
    }
    setSelectedStyles(next);
    generateLooksForContext(activeUser, selectedOccasion, selectedWeather, next);
  };

  const handleToggleDislike = (slug: string) => {
    let next: string[];
    if (dislikedStyles.includes(slug)) {
      next = dislikedStyles.filter((s) => s !== slug);
    } else {
      next = [...dislikedStyles, slug];
      // remove from selected if present
      if (selectedStyles.includes(slug)) {
        setSelectedStyles(selectedStyles.filter((s) => s !== slug));
      }
    }
    setDislikedStyles(next);
  };

  const handleOccasionChange = (occ: string) => {
    setSelectedOccasion(occ);
    generateLooksForContext(activeUser, occ, selectedWeather, selectedStyles);
  };

  const handleWeatherChange = (w: WeatherCondition) => {
    setSelectedWeather(w);
    generateLooksForContext(activeUser, selectedOccasion, w, selectedStyles);
  };

  const handleExploreStyle = async (slug: string) => {
    setSelectedStyleSlug(slug);
    try {
      const res = await fetch(`/api/recommendations/explore?style=${slug}`);
      const data = await res.json();
      if (data.data) {
        setStyleExploration(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Brand & Editorial Masthead */}
      <header className="border-b border-neutral-200 pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-editorial-title font-medium tracking-widest uppercase text-neutral-950">
              VAEL
            </h1>
            <span className="font-editorial-mono text-xs px-2.5 py-1 bg-black text-white rounded-full">
              EARLY ACCESS
            </span>
          </div>
          <p className="text-xs uppercase tracking-widest text-neutral-500 mt-2 font-editorial-mono">
            Your style, interpreted.
          </p>
        </div>

        {/* Profile State Card */}
        <div className="w-full md:w-auto md:min-w-[420px]">
          <ProfileHeader
            mode={profileMode}
            visual={activeUser?.visualProfile}
            onOpenEditor={() => setIsProfileModalOpen(true)}
            onResetProfile={handleResetProfile}
            onUseDemo={handleUseDemo}
          />
        </div>
      </header>

      {/* Global Feedback Notice */}
      {feedbackNotice && (
        <div className="mb-6 p-3 bg-neutral-900 text-white text-xs font-editorial-mono flex items-center justify-between transition-all">
          <span>{feedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Context & Style Control Section */}
      <section className="bg-white border border-neutral-300 p-6 mb-10 space-y-6 shadow-xs">
        <ContextControls
          selectedOccasion={selectedOccasion}
          onSelectOccasion={handleOccasionChange}
          weather={selectedWeather}
          onSelectWeather={handleWeatherChange}
          formalityOverride={formalityOverride}
          onSelectFormality={(f) => {
            setFormalityOverride(f);
            generateLooksForContext(activeUser, selectedOccasion, selectedWeather, selectedStyles, f);
          }}
        />

        <div className="pt-4 border-t border-neutral-200">
          <StylePreferences
            selectedStyles={selectedStyles}
            onToggleStyle={handleToggleStyle}
            dislikedStyles={dislikedStyles}
            onToggleDislike={handleToggleDislike}
          />
        </div>

        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-editorial-mono text-xs">
          <div className="text-neutral-500 text-[11px]">
            {isGenerating ? (
              <span className="text-neutral-900 font-semibold animate-pulse">
                • Building your looks...
              </span>
            ) : (
              <span>
                • READY — CURATED LOOK PROPOSALS
              </span>
            )}
          </div>

          <button
            onClick={() => generateLooksForContext(activeUser, selectedOccasion, selectedWeather, selectedStyles)}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white transition uppercase tracking-wider text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            RECALCULATE LOOKS
          </button>
        </div>
      </section>

      {/* Views Navigation */}
      <nav className="flex border-b border-neutral-200 mb-8 font-editorial-mono text-xs">
        {[
          { id: 'LOOKS', label: 'TOP 3 LOOKS (FLAGSHIP)' },
          { id: 'HAIR', label: 'HAIR COMPATIBILITY' },
          { id: 'GROOMING', label: 'GROOMING' },
          { id: 'STYLE LAB', label: 'STYLE TAXONOMY' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id as ActiveView);
              if (tab.id === 'STYLE LAB' && !styleExploration) {
                handleExploreStyle(selectedStyleSlug);
              }
            }}
            className={`px-4 py-2.5 uppercase tracking-wider transition border-b-2 -mb-px text-[11px] ${
              activeView === tab.id
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* MAIN VIEW 1: FLAGSHIP TOP 3 LOOKS */}
      {activeView === 'LOOKS' && (
        <div>
          {profileMode === 'EMPTY' && !topThreeLooks ? (
            <EmptyState
              onOpenEditor={() => setIsProfileModalOpen(true)}
              onUseDemo={handleUseDemo}
            />
          ) : topThreeLooks ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between font-editorial-mono text-xs text-neutral-500 pb-2 border-b border-neutral-100">
                <span className="uppercase tracking-widest text-[11px]">
                  {topThreeLooks.looks?.length === 3
                    ? 'THREE COMPLETE PERSPECTIVES: SAFE · BEST MATCH · STRETCH'
                    : `VIABLE PERSPECTIVES (${topThreeLooks.looks?.length || 3} RETURNED)`}
                </span>
                <span className="text-[10px]">
                  EVALUATED: {topThreeLooks.evaluatedCandidateCount} · VETOED: {topThreeLooks.vetoedCandidateCount}
                </span>
              </div>

              {/* Honest Explanation when fewer than 3 looks returned */}
              {topThreeLooks.looksCountExplanation && (
                <div className="p-3 bg-neutral-100 border border-neutral-300 text-[11px] text-neutral-800 font-editorial-mono">
                  <span className="font-semibold block mb-0.5 uppercase tracking-wide">NOTICE:</span>
                  {topThreeLooks.looksCountExplanation}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {topThreeLooks.looks && topThreeLooks.looks.length > 0 ? (
                  topThreeLooks.looks.map((l, idx) => (
                    <LookCard key={l.id} look={l} isExpanded={l.tier === 'BEST_MATCH' || idx === 0} />
                  ))
                ) : (
                  <>
                    <LookCard look={topThreeLooks.safe} />
                    <LookCard look={topThreeLooks.bestMatch} isExpanded={true} />
                    <LookCard look={topThreeLooks.stretch} />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-editorial-mono text-neutral-400">
              Building your looks...
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: HAIR COMPATIBILITY */}
      {activeView === 'HAIR' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-editorial-title font-medium text-neutral-950">
              HAIR DISCOVERY & PROPORTION MATCHING
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-editorial-mono">
              COMPATIBILITY SCORED DETERMINISTICALLY AGAINST FACE SHAPE, JAWLINE, AND HAIR TEXTURE.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {hairRecs.slice(0, 6).map((rec, i) => (
              <div key={rec.id} className="border border-neutral-300 bg-white p-5 flex flex-col justify-between font-editorial-mono text-xs">
                <div>
                  <div className="flex justify-between items-start mb-2 pb-2 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                        RANK 0{i + 1}
                      </span>
                      <h3 className="text-base font-editorial-title uppercase mt-0.5 text-neutral-900">
                        {rec.item.name}
                      </h3>
                    </div>
                    <span className="font-mono text-sm font-bold text-neutral-900">
                      {Math.round(rec.score * 100)}%
                    </span>
                  </div>

                  <p className="text-[11px] font-sans text-neutral-600 mb-4 line-clamp-2">
                    {rec.item.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-[10px]">
                    <span className="text-neutral-400 uppercase tracking-wider block">
                      WHY IT SUITS YOU:
                    </span>
                    {rec.reasons.slice(0, 2).map((r: string, idx: number) => (
                      <p key={idx} className="text-neutral-700 flex items-start gap-1">
                        <span className="text-neutral-400">•</span>
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                  <span className="uppercase">MAINTENANCE: {rec.item.maintenance}</span>
                  {(rec.item.targetLength || rec.item.length) && (
                    <span className="uppercase">LENGTH: {rec.item.targetLength || rec.item.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: BEARD & GROOMING */}
      {activeView === 'GROOMING' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-editorial-title font-medium text-neutral-950">
              BEARD & FACIAL HAIR GEOMETRY
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-editorial-mono">
              SHAPING JAWLINE PROPORTIONS AND CONTROLLING FACIAL HARMONY.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {beardRecs.slice(0, 6).map((rec, i) => (
              <div key={rec.id} className="border border-neutral-300 bg-white p-5 flex flex-col justify-between font-editorial-mono text-xs">
                <div>
                  <div className="flex justify-between items-start mb-2 pb-2 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                        RANK 0{i + 1}
                      </span>
                      <h3 className="text-base font-editorial-title uppercase mt-0.5 text-neutral-900">
                        {rec.item.name}
                      </h3>
                    </div>
                    <span className="font-mono text-sm font-bold text-neutral-900">
                      {Math.round(rec.score * 100)}%
                    </span>
                  </div>

                  <p className="text-[11px] font-sans text-neutral-600 mb-4 line-clamp-2">
                    {rec.item.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-[10px]">
                    <span className="text-neutral-400 uppercase tracking-wider block">
                      HONEST REASON:
                    </span>
                    {rec.reasons.slice(0, 2).map((r: string, idx: number) => (
                      <p key={idx} className="text-neutral-700 flex items-start gap-1">
                        <span className="text-neutral-400">•</span>
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                  {(rec.item.targetLength || rec.item.length) && (
                    <span className="uppercase">LENGTH: {rec.item.targetLength || rec.item.length}</span>
                  )}
                  <span className="uppercase">MAINTENANCE: {rec.item.maintenance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: STYLE TAXONOMY / STYLE LAB */}
      {activeView === 'STYLE LAB' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-editorial-title font-medium text-neutral-950">
              STYLE TAXONOMY & LATENT DISCOVERY
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-editorial-mono">
              DISCOVER HOW DEEP ATTRIBUTES ALIGN WITH YOUR TASTES BEYOND GENERIC LABELS.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 font-editorial-mono text-xs">
            {styleFamilies.map((sf) => (
              <button
                key={sf.slug}
                onClick={() => handleExploreStyle(sf.slug)}
                className={`px-3 py-1.5 uppercase transition ${
                  selectedStyleSlug === sf.slug
                    ? 'bg-black text-white font-semibold'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-black'
                }`}
              >
                {sf.name}
              </button>
            ))}
          </div>

          {styleExploration && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-white border border-neutral-200 p-6">
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-neutral-100">
                  <div>
                    <h3 className="text-2xl font-serif font-medium">{styleExploration.style.name}</h3>
                    <p className="text-xs text-neutral-500 italic mt-0.5">
                      "{styleExploration.style.editorialSubtitle}"
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-editorial-mono uppercase text-neutral-400">ALIGNMENT</div>
                    <div className="text-xl font-editorial-mono font-bold">
                      {Math.round(styleExploration.matchScore * 100)}%
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed mb-6 font-sans">
                  {styleExploration.style.description}
                </p>

                <div className="mb-6 space-y-2">
                  <div className="text-[10px] font-editorial-mono uppercase text-neutral-400">
                    SHARED ATTRIBUTE SIGNALS:
                  </div>
                  {styleExploration.matchingAttributes.map((m: string, idx: number) => (
                    <div key={idx} className="text-xs font-editorial-mono text-neutral-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-[10px] font-editorial-mono uppercase text-neutral-400 mb-3">
                    GATEWAY SIGNATURE PIECES:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {styleExploration.gatewayGarments.map((g: any) => (
                      <div key={g.id} className="p-3 bg-neutral-50 border border-neutral-200 text-xs">
                        <div className="font-medium text-neutral-900">{g.name}</div>
                        <div className="text-[11px] font-editorial-mono text-neutral-500 mt-1">
                          {g.material} · {g.fit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-neutral-200 p-6 text-xs font-editorial-mono">
                  <div className="text-[10px] text-neutral-400 uppercase mb-2">KEY INSPIRATIONS:</div>
                  <div className="space-y-1 mb-4 text-neutral-800">
                    {styleExploration.style.keyInspirations.map((ki: string, idx: number) => (
                      <div key={idx}>• {ki}</div>
                    ))}
                  </div>

                  <div className="text-[10px] text-neutral-400 uppercase mb-2 border-t border-neutral-100 pt-3">
                    COLOR PALETTE:
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {styleExploration.style.attributes.colorPalette.primaryTones.map((t: string) => (
                      <span key={t} className="bg-neutral-100 px-2 py-0.5 text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-neutral-400 uppercase mb-2 border-t border-neutral-100 pt-3">
                    CORE MATERIALS:
                  </div>
                  <div className="text-neutral-700 leading-relaxed font-sans">
                    {styleExploration.style.attributes.coreMaterials.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialData={manualProfileData}
        onSave={handleProfileSave}
      />

      {/* Minimal Editorial Footer */}
      <footer className="mt-20 pt-8 border-t border-neutral-200 text-center text-xs font-editorial-mono text-neutral-400 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>VAEL © 2026. AUTONOMOUS STYLING ARTIST.</div>
        <div className="flex items-center gap-4 text-neutral-500">
          <span>SAFE · BEST MATCH · STRETCH</span>
          <span>•</span>
          <span>EVIDENCE-BASED ATTRIBUTES</span>
        </div>
      </footer>
    </div>
  );
}
