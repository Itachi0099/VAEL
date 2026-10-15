'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  X,
  Compass,
  Box,
  Moon,
  Sun,
} from 'lucide-react';

import { ProfileHeader } from '@/components/styling/ProfileHeader';
import { ProfileModal, ProfileFormData } from '@/components/styling/ProfileModal';
import { ContextControls } from '@/components/styling/ContextControls';
import { StylePreferences } from '@/components/styling/StylePreferences';
import { LookCard } from '@/components/styling/LookCard';
import { EmptyState } from '@/components/styling/EmptyState';
import {
  TopThreeLooks,
  WeatherCondition,
  FormalityLevel,
  VisualProfile,
  User,
  sanitizeProfileImport,
  TemperatureLevel,
  WeatherConditionType,
} from '@/core/domain';
import { BUILD_INFO } from '@/core/version';
import { DynamicStudioViewer } from '@/components/studio';
import { SAMPLE_STUDIO_PROFILES } from '@/components/studio/sample-profiles';
import { knowledgeBase } from '@/core/knowledge';

type ActiveView = 'LOOKS' | 'STUDIO 3D' | 'HAIR' | 'GROOMING' | 'STYLE LAB';

export default function VaelShell() {
  const [activeView, setActiveView] = useState<ActiveView>('LOOKS');
  const [profileMode, setProfileMode] = useState<'EMPTY' | 'DEMO' | 'CONFIGURED'>('EMPTY');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active User / Profile State
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [manualProfileData, setManualProfileData] = useState<Partial<ProfileFormData>>({});

  // Context & Preference State
  const [selectedOccasion, setSelectedOccasion] = useState<string>('dinner');
  const [selectedWeather, setSelectedWeather] = useState<WeatherCondition>('mild');
  const [selectedTemperature, setSelectedTemperature] = useState<TemperatureLevel>('mild');
  const [selectedCondition, setSelectedCondition] = useState<WeatherConditionType>('dry');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [formalityOverride, setFormalityOverride] = useState<FormalityLevel | undefined>(undefined);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [dislikedStyles, setDislikedStyles] = useState<string[]>([]);

  // Engine Output State
  const [topThreeLooks, setTopThreeLooks] = useState<TopThreeLooks | null>(null);
  const [hairRecs, setHairRecs] = useState<any[]>([]);
  const [beardRecs, setBeardRecs] = useState<any[]>([]);
  const [styleFamilies, setStyleFamilies] = useState<any[]>([]);
  const [selectedStyleSlug, setSelectedStyleSlug] = useState<string>('minimal');
  const [styleExploration, setStyleExploration] = useState<any>(null);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Initialize data on load (with localStorage check & theme preference)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('vael_theme');
      if (savedTheme === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (savedTheme === 'light') {
        setTheme('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          setTheme('dark');
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          setTheme('light');
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    } catch (e) {
      // LocalStorage unavailable
    }

    initializeVael();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('vael_theme', nextTheme);
    } catch (e) {
      console.warn('Theme preference storage failed:', e);
    }
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const initializeVael = async () => {
    try {
      const stylesRes = await fetch('/api/styles');
      const stylesData = await stylesRes.json();
      setStyleFamilies(stylesData.data || []);

      // Check localStorage for saved user profile
      let savedUser: User | null = null;
      let savedMode: 'EMPTY' | 'DEMO' | 'CONFIGURED' = 'EMPTY';
      try {
        const rawUser = localStorage.getItem('vael_user_profile');
        const rawMode = localStorage.getItem('vael_profile_mode');
        if (rawUser) {
          savedUser = sanitizeProfileImport(JSON.parse(rawUser));
          if (rawMode === 'CONFIGURED' || rawMode === 'DEMO') {
            savedMode = rawMode;
          }
        }
      } catch (err) {
        console.warn('LocalStorage read bypassed:', err);
      }

      if (savedUser && savedMode === 'CONFIGURED') {
        setActiveUser(savedUser);
        setProfileMode('CONFIGURED');
        const userStyles = savedUser.styleProfile?.dominantAestheticSlugs || [];
        setSelectedStyles(userStyles);
        generateLooksForContext(savedUser, 'dinner', 'mild', userStyles, undefined, 'mild', 'dry');
      } else {
        // Fresh load: EMPTY profile, 0 / 3 styles selected
        setProfileMode('EMPTY');
        setActiveUser(null);
        setSelectedStyles([]);
      }
    } catch (err) {
      console.error('Failed to initialize VAEL:', err);
    }
  };

  const generateLooksForContext = async (
    userToUse: User | null,
    occ = selectedOccasion,
    weather = selectedWeather,
    styles = selectedStyles,
    formality = formalityOverride,
    tempLevel = selectedTemperature,
    cond = selectedCondition
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
        temperatureLevel: tempLevel,
        condition: cond,
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
          genderIdentity: formData.genderIdentity || 'unspecified',
          styleExpression: formData.styleExpression || formData.genderDirection,
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
    try {
      localStorage.setItem('vael_user_profile', JSON.stringify(newUser));
      localStorage.setItem('vael_profile_mode', 'CONFIGURED');
    } catch (e) {
      console.warn('LocalStorage save bypassed:', e);
    }
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
    setSelectedStyles([]);
    try {
      localStorage.removeItem('vael_user_profile');
      localStorage.setItem('vael_profile_mode', 'EMPTY');
    } catch (e) {
      console.warn('LocalStorage clear bypassed:', e);
    }
    setFeedbackNotice('Profile reset. Please set your characteristics or load demo.');
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleToggleStyle = (slug: string) => {
    let next: string[];
    if (selectedStyles.includes(slug)) {
      next = selectedStyles.filter((s) => s !== slug);
    } else {
      if (selectedStyles.length >= 3) {
        setFeedbackNotice('Maximum of 3 style directions allowed. Deselect one first.');
        setTimeout(() => setFeedbackNotice(null), 3000);
        return;
      }
      next = [...selectedStyles, slug];
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
    generateLooksForContext(activeUser, occ, selectedWeather, selectedStyles, formalityOverride, selectedTemperature, selectedCondition);
  };

  const handleWeatherChange = (w: WeatherCondition) => {
    setSelectedWeather(w);
    if (w === 'rainy') {
      setSelectedCondition('rain');
    } else {
      setSelectedCondition('dry');
      if (['cold', 'cool', 'mild', 'warm', 'hot'].includes(w)) {
        setSelectedTemperature(w as TemperatureLevel);
      }
    }
    generateLooksForContext(activeUser, selectedOccasion, w, selectedStyles, formalityOverride, selectedTemperature, selectedCondition);
  };

  const handleTemperatureChange = (t: TemperatureLevel) => {
    setSelectedTemperature(t);
    const weatherMap: Record<TemperatureLevel, WeatherCondition> = {
      cold: 'cold',
      cool: 'cool',
      mild: 'mild',
      warm: 'warm',
      hot: 'hot',
    };
    const legacyWeather = selectedCondition === 'rain' ? 'rainy' : weatherMap[t] || 'mild';
    setSelectedWeather(legacyWeather);
    generateLooksForContext(activeUser, selectedOccasion, legacyWeather, selectedStyles, formalityOverride, t, selectedCondition);
  };

  const handleConditionChange = (c: WeatherConditionType) => {
    setSelectedCondition(c);
    const legacyWeather: WeatherCondition = c === 'rain' ? 'rainy' : (selectedTemperature as WeatherCondition) || 'mild';
    setSelectedWeather(legacyWeather);
    generateLooksForContext(activeUser, selectedOccasion, legacyWeather, selectedStyles, formalityOverride, selectedTemperature, c);
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

  const handleExportProfile = () => {
    if (!activeUser) {
      setFeedbackNotice('No active profile to export.');
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }
    try {
      const jsonStr = JSON.stringify(activeUser, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vael-profile-${activeUser.handle || 'user'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedbackNotice('Profile exported successfully.');
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (e: any) {
      console.error('Export error:', e);
      setFeedbackNotice('Failed to export profile.');
      setTimeout(() => setFeedbackNotice(null), 3000);
    }
  };

  const handleImportProfile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const sanitized = sanitizeProfileImport(parsed);
        setActiveUser(sanitized);
        setProfileMode('CONFIGURED');
        try {
          localStorage.setItem('vael_user_profile', JSON.stringify(sanitized));
          localStorage.setItem('vael_profile_mode', 'CONFIGURED');
        } catch (err) {
          console.warn('Could not persist to localStorage:', err);
        }
        generateLooksForContext(sanitized, selectedOccasion, selectedWeather, sanitized.styleProfile?.dominantAestheticSlugs || selectedStyles);
        setFeedbackNotice('Profile imported and verified successfully.');
        setTimeout(() => setFeedbackNotice(null), 3000);
      } catch (err: any) {
        console.error('Import error:', err);
        setFeedbackNotice(`Import failed: ${err.message || 'Invalid JSON format'}`);
        setTimeout(() => setFeedbackNotice(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Brand & Editorial Masthead */}
      <header className="border-b border-neutral-200 pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-editorial-title font-medium tracking-widest uppercase text-neutral-950">
              VAEL
            </h1>
            <span className="font-editorial-mono text-xs px-2.5 py-1 bg-black text-white rounded-full">
              EARLY ACCESS
            </span>
            <button
              onClick={() => setActiveView('STUDIO 3D')}
              className={`font-editorial-mono text-xs px-2.5 py-1 border rounded-full transition flex items-center gap-1.5 ${
                activeView === 'STUDIO 3D'
                  ? 'border-neutral-950 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-800 dark:text-neutral-200'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-indigo-500" />
              <span>Studio (beta)</span>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="font-editorial-mono text-xs px-2.5 py-1 border border-neutral-300 hover:border-black text-neutral-800 rounded-full transition flex items-center gap-1.5"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>LIGHT</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-neutral-600" />
                  <span>DARK</span>
                </>
              )}
            </button>
            <Link
              href="/studio"
              className="font-editorial-mono text-[11px] px-2 py-1 text-neutral-500 hover:text-neutral-900 transition flex items-center gap-1"
            >
              <span>FULLSCREEN ↗</span>
            </Link>
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
            onExportProfile={activeUser ? handleExportProfile : undefined}
            onImportProfile={handleImportProfile}
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
          temperatureLevel={selectedTemperature}
          onSelectTemperatureLevel={handleTemperatureChange}
          weatherCondition={selectedCondition}
          onSelectWeatherCondition={handleConditionChange}
          weather={selectedWeather}
          onSelectWeather={handleWeatherChange}
          formalityOverride={formalityOverride}
          onSelectFormality={(f) => {
            setFormalityOverride(f);
            generateLooksForContext(
              activeUser,
              selectedOccasion,
              selectedWeather,
              selectedStyles,
              f,
              selectedTemperature,
              selectedCondition
            );
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
            onClick={() =>
              generateLooksForContext(
                activeUser,
                selectedOccasion,
                selectedWeather,
                selectedStyles,
                formalityOverride,
                selectedTemperature,
                selectedCondition
              )
            }
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white transition uppercase tracking-wider text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            RECALCULATE LOOKS
          </button>
        </div>
      </section>

      {/* Views Navigation */}
      <nav className="flex border-b border-neutral-200 dark:border-neutral-800 mb-8 font-editorial-mono text-xs overflow-x-auto">
        {[
          { id: 'LOOKS', label: 'TOP 3 LOOKS (FLAGSHIP)' },
          { id: 'STUDIO 3D', label: 'Studio (beta)' },
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
            className={`px-4 py-2.5 uppercase tracking-wider transition border-b-2 -mb-px text-[11px] whitespace-nowrap flex items-center gap-1.5 ${
              activeView === tab.id
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-800'
            }`}
          >
            {tab.id === 'STUDIO 3D' && <Box className="w-3 h-3 text-indigo-500" />}
            <span>{tab.label}</span>
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
              {/* Studio 3D Quick-Launch Banner */}
              <div className="p-4 bg-neutral-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 font-editorial-mono border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xs bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-semibold tracking-wider">
                        PART B — R2.0 STUDIO 3D STYLING AVATAR SPIKE
                      </span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2">
                        LIVE SPIKE
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                      Interact with these looks in real-time 3D: continuous vertical spin, drag-to-rotate, garment slot inspection, and read-only candidate swapping.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('STUDIO 3D')}
                  className="px-4 py-2 bg-white text-neutral-950 hover:bg-neutral-100 uppercase tracking-wider text-xs font-semibold shrink-0 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>LAUNCH 3D AVATAR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

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

      {/* VIEW: 3D STYLING AVATAR STUDIO */}
      {activeView === 'STUDIO 3D' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-neutral-200 gap-4 font-editorial-mono">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-editorial-title uppercase font-semibold text-neutral-950 dark:text-neutral-100">
                  Studio (beta)
                </h2>
                <span className="text-[10px] bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-2 py-0.5 rounded-xs uppercase tracking-wider font-semibold">
                  Illustration, not a fit simulation
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-xs">
                  INTERACTIVE 3D
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                EDITORIAL CLAY-WHITE MANNEQUIN · SOFT STUDIO LIGHTING · PROCEDURAL GARMENTS · READ-ONLY ADAPTER
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/studio"
                className="font-editorial-mono text-xs px-3 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 transition uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>OPEN FULLSCREEN STUDIO</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <DynamicStudioViewer
            user={activeUser || SAMPLE_STUDIO_PROFILES[0].user}
            context={
              activeUser
                ? {
                    occasion:
                      knowledgeBase.getOccasionBySlug(selectedOccasion) ||
                      knowledgeBase.getAllOccasions()[0],
                    temperatureCelsius:
                      selectedTemperature === 'cold'
                        ? 3
                        : selectedTemperature === 'cool'
                        ? 10
                        : selectedTemperature === 'warm'
                        ? 25
                        : selectedTemperature === 'hot'
                        ? 30
                        : 19,
                    temperatureLevel: selectedTemperature,
                    condition: selectedCondition,
                  }
                : SAMPLE_STUDIO_PROFILES[0].context
            }
          />
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
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span>VAEL © 2026. Your style, interpreted.</span>
          <span className="text-[10px] text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded-xs">
            BUILD {BUILD_INFO.commitHash} · {BUILD_INFO.buildDate}
          </span>
        </div>
        <div className="flex items-center gap-4 text-neutral-500">
          <span>SAFE · BEST MATCH · STRETCH</span>
          <span>•</span>
          <span>EVIDENCE-BASED ATTRIBUTES</span>
        </div>
      </footer>
    </div>
  );
}
