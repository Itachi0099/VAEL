'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  ThumbsUp,
  Heart,
  X,
  Scan,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

type Tab = 'HAIR' | 'GROOMING' | 'OUTFITS' | 'STYLE LAB';

export default function VaelShell() {
  const [activeTab, setActiveTab] = useState<Tab>('HAIR');
  const [profile, setProfile] = useState<any>(null);
  const [hairRecs, setHairRecs] = useState<any[]>([]);
  const [beardRecs, setBeardRecs] = useState<any[]>([]);
  const [currentOutfit, setCurrentOutfit] = useState<any>(null);
  const [elevatedResult, setElevatedResult] = useState<any>(null);
  const [styleFamilies, setStyleFamilies] = useState<any[]>([]);
  const [selectedStyleSlug, setSelectedStyleSlug] = useState<string>('korean-minimal');
  const [styleExploration, setStyleExploration] = useState<any>(null);
  const [feedbackFeedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('dinner');

  // Load initial state
  useEffect(() => {
    loadProfileAndInitialData();
  }, []);

  const loadProfileAndInitialData = async () => {
    try {
      const pRes = await fetch('/api/profile');
      const pData = await pRes.json();
      setProfile(pData.data);

      const stylesRes = await fetch('/api/styles');
      const stylesData = await stylesRes.json();
      setStyleFamilies(stylesData.data || []);

      // Fetch Hair Recs
      fetchHair(pData.data);
      // Fetch Beard Recs
      fetchGrooming(pData.data);
      // Fetch Outfit
      fetchOutfit(pData.data, 'dinner');
    } catch (err) {
      console.error('Error initializing VAEL shell:', err);
    }
  };

  const fetchHair = async (userProf?: any, occasion = selectedOccasion) => {
    try {
      const res = await fetch('/api/recommendations/hair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasionSlug: occasion }),
      });
      const data = await res.json();
      if (data.data) {
        setHairRecs(data.data.recommendations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGrooming = async (userProf?: any, occasion = selectedOccasion) => {
    try {
      const res = await fetch('/api/recommendations/grooming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasionSlug: occasion }),
      });
      const data = await res.json();
      if (data.data) {
        setBeardRecs(data.data.recommendations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOutfit = async (userProf?: any, occasion = selectedOccasion) => {
    try {
      const res = await fetch('/api/recommendations/outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasionSlug: occasion }),
      });
      const data = await res.json();
      if (data.data) {
        setCurrentOutfit(data.data.item);
        setElevatedResult(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleElevateOutfit = async () => {
    if (!currentOutfit) return;
    try {
      const res = await fetch('/api/outfits/elevate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit: currentOutfit, occasionSlug: selectedOccasion }),
      });
      const data = await res.json();
      if (data.data) {
        setElevatedResult(data.data);
      }
    } catch (e) {
      console.error(e);
    }
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

  const handleFeedback = async (targetType: string, targetId: string, feedbackType: string) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, feedbackType }),
      });
      setFeedbackNotice(`Recorded ${feedbackType} for ${targetId}. Preferences adapted.`);
      setTimeout(() => setFeedbackNotice(null), 3500);

      // Refresh recs
      fetchHair();
      fetchGrooming();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateVisualScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextHint: 'face_focus' }),
      });
      const data = await res.json();
      if (data.visualProfile) {
        setProfile((prev: any) => ({ ...prev, visualProfile: data.visualProfile }));
        fetchHair();
        fetchGrooming();
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Brand & Editorial Masthead */}
      <header className="border-b border-neutral-200 pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-editorial-title font-medium tracking-widest uppercase">
              VAEL
            </h1>
            <span className="font-editorial-mono text-xs px-2.5 py-1 bg-black text-white rounded-full">
              INTELLIGENCE BACKBONE v0.1
            </span>
          </div>
          <p className="text-xs uppercase tracking-widest text-neutral-500 mt-2 font-editorial-mono">
            YOUR STYLE, INTERPRETED.
          </p>
        </div>

        {/* User Visual Signals Bar */}
        {profile?.visualProfile && (
          <div className="text-xs font-editorial-mono bg-white p-4 border border-neutral-200 shadow-sm max-w-md">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-neutral-100">
              <span className="text-neutral-400 uppercase">VISUAL PROFILE (OBSERVED)</span>
              <button
                onClick={handleSimulateVisualScan}
                disabled={isScanning}
                className="inline-flex items-center gap-1 text-[11px] hover:text-black font-semibold text-neutral-600 transition"
              >
                <Scan className="w-3 h-3" />
                {isScanning ? 'ANALYZING...' : 'NEW SCAN'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-neutral-800">
              <div>
                FACE: <span className="font-semibold">{profile.visualProfile.face.shape}</span> ({profile.visualProfile.face.jaw})
              </div>
              <div>
                HAIR: <span className="font-semibold">{profile.visualProfile.hair.texture}</span> ({profile.visualProfile.hair.density} density)
              </div>
              <div>
                BODY: <span className="font-semibold">{profile.visualProfile.body.silhouette}</span>
              </div>
              <div>
                CONFIDENCE: <span className="font-semibold">95%</span> (DETERMINISTIC)
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Notice Toast */}
      {feedbackFeedbackNotice && (
        <div className="mb-6 p-3 bg-neutral-900 text-white text-xs font-editorial-mono flex items-center justify-between transition-all">
          <span>{feedbackFeedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Occasion / Context Selector Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-xs font-editorial-mono">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 uppercase">CONTEXT OCCASION:</span>
          {['dinner', 'office', 'date', 'college', 'wedding'].map((occ) => (
            <button
              key={occ}
              onClick={() => {
                setSelectedOccasion(occ);
                fetchHair(profile, occ);
                fetchGrooming(profile, occ);
                fetchOutfit(profile, occ);
              }}
              className={`px-3 py-1 uppercase tracking-wider transition ${
                selectedOccasion === occ
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-900'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial Navigation Tabs */}
      <nav className="flex border-b border-neutral-200 mb-10">
        {(['HAIR', 'GROOMING', 'OUTFITS', 'STYLE LAB'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'STYLE LAB' && !styleExploration) {
                handleExploreStyle(selectedStyleSlug);
              }
            }}
            className={`py-3 px-6 text-xs uppercase tracking-widest transition-all font-editorial-mono font-medium border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-neutral-950 text-neutral-950 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            [ {tab} ]
          </button>
        ))}
      </nav>

      {/* TAB CONTENT 1: HAIR */}
      {activeTab === 'HAIR' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-editorial-title font-medium">HAIRSTYLE DISCOVERY</h2>
            <p className="text-xs text-neutral-500 mt-1 font-editorial-mono">
              SCORING BASED ON DETECTED FACE GEOMETRY, TEXTURE FEASIBILITY, AND FORMALITY.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hairRecs.map((rec, idx) => (
              <div
                key={rec.id}
                className="bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-neutral-900 transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-editorial-mono text-xs text-neutral-400">0{idx + 1} / RANKED</span>
                    <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 text-xs font-editorial-mono font-semibold">
                      <span>COMPATIBILITY</span>
                      <span className="text-black">{Math.round(rec.score * 100)}%</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-serif font-medium mb-1">{rec.item.name}</h3>
                  <p className="text-xs text-neutral-600 mb-4 leading-relaxed">{rec.item.description}</p>

                  {/* Explainable Reasons */}
                  <div className="mb-4 bg-neutral-50 p-3 border-l-2 border-black text-xs font-editorial-mono space-y-1">
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                      WHY VAEL RECOMMENDS THIS:
                    </div>
                    {rec.reasons.map((r: string, rIdx: number) => (
                      <div key={rIdx} className="text-neutral-700 flex items-start gap-1.5">
                        <span className="text-neutral-400">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                    {rec.cautions &&
                      rec.cautions.map((c: string, cIdx: number) => (
                        <div key={cIdx} className="text-amber-800 flex items-start gap-1.5 mt-1">
                          <span className="text-amber-600">!</span>
                          <span>{c}</span>
                        </div>
                      ))}
                  </div>

                  {/* Attributes */}
                  <div className="flex flex-wrap gap-1.5 mb-4 text-[11px] font-editorial-mono text-neutral-500">
                    <span className="border border-neutral-200 px-2 py-0.5">Length: {rec.item.targetLength}</span>
                    <span className="border border-neutral-200 px-2 py-0.5">Care: {rec.item.maintenance}</span>
                    <span className="border border-neutral-200 px-2 py-0.5">Effort: {rec.item.stylingDifficulty}</span>
                  </div>
                </div>

                {/* Feedback Actions */}
                <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-xs font-editorial-mono">
                  <span className="text-neutral-400 text-[10px] uppercase">TRAIN PROFILE:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback('hairstyle', rec.item.slug, 'LOVE')}
                      className="px-2.5 py-1 border border-neutral-200 hover:border-black flex items-center gap-1 transition"
                    >
                      <Heart className="w-3 h-3" /> LOVE
                    </button>
                    <button
                      onClick={() => handleFeedback('hairstyle', rec.item.slug, 'LIKE')}
                      className="px-2.5 py-1 border border-neutral-200 hover:border-black flex items-center gap-1 transition"
                    >
                      <ThumbsUp className="w-3 h-3" /> LIKE
                    </button>
                    <button
                      onClick={() => handleFeedback('hairstyle', rec.item.slug, 'NOT_FOR_ME')}
                      className="px-2.5 py-1 border border-neutral-200 hover:border-red-600 hover:text-red-600 flex items-center gap-1 transition"
                    >
                      <X className="w-3 h-3" /> PASS
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: GROOMING */}
      {activeTab === 'GROOMING' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-editorial-title font-medium">BEARD & GROOMING ARCHITECTURE</h2>
            <p className="text-xs text-neutral-500 mt-1 font-editorial-mono">
              BALANCING JAWLINE SHARPNESS AND FOLLICULAR DENSITY REALITIES.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beardRecs.map((rec, idx) => (
              <div
                key={rec.id}
                className="bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-neutral-900 transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-editorial-mono text-xs text-neutral-400">0{idx + 1} / GROOMING</span>
                    <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 text-xs font-editorial-mono font-semibold">
                      <span>ALIGNMENT</span>
                      <span className="text-black">{Math.round(rec.score * 100)}%</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-serif font-medium mb-1">{rec.item.name}</h3>
                  <p className="text-xs text-neutral-600 mb-4 leading-relaxed">{rec.item.description}</p>

                  <div className="mb-4 bg-neutral-50 p-3 border-l-2 border-black text-xs font-editorial-mono space-y-1">
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                      STYLING RATIONALE:
                    </div>
                    {rec.reasons.map((r: string, rIdx: number) => (
                      <div key={rIdx} className="text-neutral-700 flex items-start gap-1.5">
                        <span className="text-neutral-400">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                    {rec.cautions &&
                      rec.cautions.map((c: string, cIdx: number) => (
                        <div key={cIdx} className="text-amber-800 flex items-start gap-1.5 mt-1">
                          <span className="text-amber-600">!</span>
                          <span>{c}</span>
                        </div>
                      ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4 text-[11px] font-editorial-mono text-neutral-500">
                    <span className="border border-neutral-200 px-2 py-0.5">Length: {rec.item.targetLength}</span>
                    <span className="border border-neutral-200 px-2 py-0.5">Density: {rec.item.minimumDensity}</span>
                    <span className="border border-neutral-200 px-2 py-0.5">Maintenance: {rec.item.maintenance}</span>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-xs font-editorial-mono">
                  <span className="text-neutral-400 text-[10px] uppercase">TRAIN:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback('beard_style', rec.item.slug, 'LOVE')}
                      className="px-2.5 py-1 border border-neutral-200 hover:border-black flex items-center gap-1 transition"
                    >
                      <Heart className="w-3 h-3" /> LOVE
                    </button>
                    <button
                      onClick={() => handleFeedback('beard_style', rec.item.slug, 'NOT_FOR_ME')}
                      className="px-2.5 py-1 border border-neutral-200 hover:border-red-600 hover:text-red-600 flex items-center gap-1 transition"
                    >
                      <X className="w-3 h-3" /> PASS
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: OUTFITS */}
      {activeTab === 'OUTFITS' && currentOutfit && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-editorial-title font-medium">CURATED OUTFIT COMPOSITION</h2>
              <p className="text-xs text-neutral-500 mt-1 font-editorial-mono">
                COLOR HARMONY, SILHOUETTE BALANCE, AND OCCASION FIT.
              </p>
            </div>
            <button
              onClick={handleElevateOutfit}
              className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 text-xs font-editorial-mono uppercase tracking-wider hover:bg-neutral-800 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ELEVATE THIS OUTFIT
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Garment Stack */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-neutral-200 p-6">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
                  <span className="font-editorial-mono text-xs uppercase text-neutral-400">
                    {currentOutfit.primaryStyleSlug} · FORMALITY LEVEL {currentOutfit.formality}
                  </span>
                  <span className="font-editorial-mono text-xs text-neutral-500">
                    {currentOutfit.items.length} PIECES
                  </span>
                </div>
                <h3 className="text-xl font-serif font-medium mb-2">{currentOutfit.title}</h3>
                <p className="text-xs text-neutral-600 mb-6">{currentOutfit.description}</p>

                <div className="space-y-3">
                  {currentOutfit.items.map((item: any, iIdx: number) => (
                    <div
                      key={iIdx}
                      className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-100"
                    >
                      <div>
                        <div className="text-xs font-medium text-neutral-900">{item.garment.name}</div>
                        <div className="text-[11px] font-editorial-mono text-neutral-500">
                          {item.garment.material} · {item.garment.fit} fit · {item.garment.color.name}
                        </div>
                      </div>
                      {item.stylingNote && (
                        <div className="text-[10px] font-editorial-mono bg-white px-2 py-1 border border-neutral-200 text-neutral-600">
                          {item.stylingNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Elevated Comparison Box (if clicked) */}
              {elevatedResult && (
                <div className="bg-neutral-950 text-white p-6 border border-neutral-800">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800 font-editorial-mono text-xs">
                    <span className="text-neutral-400 uppercase">VAEL ELEVATION SYNTHESIS</span>
                    <span className="text-emerald-400 font-semibold">
                      SCORE DELTA: +{Math.round(elevatedResult.elevationDeltaScore * 100)}%
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs font-editorial-mono">
                    <div className="text-neutral-400 uppercase text-[10px]">REFINEMENTS APPLIED:</div>
                    {elevatedResult.elevationsApplied.map((e: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-neutral-200">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{e}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-xs font-editorial-mono border-t border-neutral-800 pt-3">
                    <div className="text-neutral-400 uppercase text-[10px]">EDITORIAL DIRECTIVES:</div>
                    {elevatedResult.stylingDirectives.map((d: string, idx: number) => (
                      <div key={idx} className="text-neutral-300">
                        → {d}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Harmony Analysis Sidebar */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 p-6">
                <h4 className="text-xs font-editorial-mono uppercase tracking-widest text-neutral-400 mb-4">
                  COMPATIBILITY ARCHITECTURE
                </h4>
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-neutral-500 font-editorial-mono block text-[10px] uppercase">
                      SILHOUETTE GEOMETRY
                    </span>
                    <p className="mt-1 font-medium text-neutral-800">{currentOutfit.silhouetteBalance}</p>
                  </div>
                  <div className="border-t border-neutral-100 pt-3">
                    <span className="text-neutral-500 font-editorial-mono block text-[10px] uppercase">
                      COLOR STORY
                    </span>
                    <p className="mt-1 font-medium text-neutral-800">{currentOutfit.colorStory}</p>
                  </div>
                  <div className="border-t border-neutral-100 pt-3">
                    <span className="text-neutral-500 font-editorial-mono block text-[10px] uppercase">
                      OCCASIONS ALIGNED
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1 font-editorial-mono text-[11px]">
                      {currentOutfit.compatibleOccasions.map((o: string) => (
                        <span key={o} className="bg-neutral-100 px-2 py-0.5 uppercase">
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: STYLE LAB */}
      {activeTab === 'STYLE LAB' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-editorial-title font-medium">STYLE TAXONOMY & LATENT DISCOVERY</h2>
            <p className="text-xs text-neutral-500 mt-1 font-editorial-mono">
              DISCOVER HOW DEEP ATTRIBUTES ALIGN WITH YOUR TASTES BEYOND GENERIC LABELS.
            </p>
          </div>

          {/* Style Selector Pills */}
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

                <p className="text-xs text-neutral-700 leading-relaxed mb-6">
                  {styleExploration.style.description}
                </p>

                {/* Attribute Synergies */}
                <div className="mb-6 space-y-2">
                  <div className="text-[10px] font-editorial-mono uppercase text-neutral-400">
                    SHARED ATTRIBUTE SIGNALS:
                  </div>
                  {styleExploration.matchingAttributes.map((m: string, idx: number) => (
                    <div key={idx} className="text-xs font-editorial-mono text-emerald-800 flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>

                {/* Gateway Pieces */}
                <div>
                  <div className="text-[10px] font-editorial-mono uppercase text-neutral-400 mb-3">
                    GATEWAY SIGNATURE PIECES:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {styleExploration.gatewayGarments.map((g: any) => (
                      <div key={g.id} className="p-3 bg-neutral-50 border border-neutral-100 text-xs">
                        <div className="font-medium text-neutral-900">{g.name}</div>
                        <div className="text-[11px] font-editorial-mono text-neutral-500 mt-1">
                          {g.material} · {g.fit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inspiration & Visual Syntax */}
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
                  <div className="text-neutral-700 leading-relaxed">
                    {styleExploration.style.attributes.coreMaterials.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="mt-20 pt-8 border-t border-neutral-200 text-center text-xs font-editorial-mono text-neutral-400 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>VAEL © 2026. AUTONOMOUS STYLING ARTIST.</div>
        <div className="flex items-center gap-4 text-neutral-500">
          <span>DETERMINISTIC COMPATIBILITY ENGINE</span>
          <span>•</span>
          <span>EXPLAINABLE INTELLIGENCE</span>
        </div>
      </footer>
    </div>
  );
}
