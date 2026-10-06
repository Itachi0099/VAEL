'use client';

import React, { useState } from 'react';
import { CompleteLook, ConfidenceState, RecommendationTier } from '@/core/domain';
import { ShieldCheck, Sparkles, Compass, AlertCircle, ChevronDown, ChevronUp, Check, Info } from 'lucide-react';

interface LookCardProps {
  look: CompleteLook;
  isExpanded?: boolean;
}

export function LookCard({ look, isExpanded = false }: LookCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(isExpanded);
  const { tier, tierRationale, outfit, hairStyle, groomingStyle, confidence, reasons, cautions } = look;

  const getTierBadge = (t: RecommendationTier) => {
    switch (t) {
      case 'SAFE':
        return {
          title: 'LOOK 01 — SAFE',
          subtitle: 'Baseline Reliability',
          badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          icon: ShieldCheck,
        };
      case 'BEST_MATCH':
        return {
          title: 'LOOK 02 — BEST MATCH',
          subtitle: 'Highest Affinity & Context Calibration',
          badgeClass: 'bg-black text-white border-black',
          icon: Sparkles,
        };
      case 'STRETCH':
        return {
          title: 'LOOK 03 — STRETCH',
          subtitle: 'Curated Exploration',
          badgeClass: 'bg-neutral-800 text-white border-neutral-800',
          icon: Compass,
        };
    }
  };

  const getConfidenceBadge = (state: ConfidenceState) => {
    switch (state) {
      case 'STRONG':
        return { label: 'CONFIDENCE: STRONG', class: 'bg-neutral-900 text-white' };
      case 'GOOD':
        return { label: 'CONFIDENCE: GOOD', class: 'bg-neutral-700 text-white' };
      case 'EXPLORATORY':
        return { label: 'CONFIDENCE: EXPLORATORY', class: 'bg-neutral-300 text-neutral-900' };
      case 'NEED_MORE_INFO':
        return { label: 'CONFIDENCE: PROVISIONAL', class: 'bg-amber-100 text-amber-900 border border-amber-300' };
    }
  };

  const tierMeta = getTierBadge(tier);
  const confMeta = getConfidenceBadge(confidence.state);
  const TierIcon = tierMeta.icon;

  const garments = outfit.item.items;
  const topGarment = garments.find((g) => g.garment.category === 'top');
  const bottomGarment = garments.find((g) => g.garment.category === 'bottom');
  const outerwearGarment = garments.find((g) => g.garment.category === 'outerwear');
  const footwearGarment = garments.find((g) => g.garment.category === 'footwear');
  const accessories = garments.filter((g) => g.garment.category === 'accessory');

  return (
    <div className="border border-neutral-900 bg-white flex flex-col justify-between font-editorial-mono text-xs">
      {/* Look Header */}
      <div className="p-5 border-b border-neutral-200">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] uppercase font-semibold border ${tierMeta.badgeClass}`}>
                {tier}
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                {tierMeta.subtitle}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-editorial-title uppercase tracking-wide text-neutral-900 mt-1">
              {outfit.item.title}
            </h3>
          </div>
          <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-xs ${confMeta.class}`}>
            {confMeta.label}
          </span>
        </div>

        <p className="text-[11px] font-sans text-neutral-600 leading-relaxed italic">
          "{tierRationale}"
        </p>
      </div>

      {/* Outfit Breakdown */}
      <div className="p-5 space-y-4 grow">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block mb-2.5">
            OUTFIT COMPOSITION
          </span>
          <div className="space-y-2 text-[11px]">
            {topGarment && (
              <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-neutral-100">
                <span className="text-neutral-500 uppercase text-[10px] shrink-0">TOP</span>
                <div className="text-right">
                  <span className="font-semibold text-neutral-900 block">{topGarment.garment.name}</span>
                  {topGarment.stylingNote && (
                    <span className="text-[10px] text-neutral-500 italic block">{topGarment.stylingNote}</span>
                  )}
                </div>
              </div>
            )}

            {bottomGarment && (
              <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-neutral-100">
                <span className="text-neutral-500 uppercase text-[10px] shrink-0">BOTTOM</span>
                <div className="text-right">
                  <span className="font-semibold text-neutral-900 block">{bottomGarment.garment.name}</span>
                  {bottomGarment.stylingNote && (
                    <span className="text-[10px] text-neutral-500 italic block">{bottomGarment.stylingNote}</span>
                  )}
                </div>
              </div>
            )}

            {outerwearGarment && (
              <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-neutral-100">
                <span className="text-neutral-500 uppercase text-[10px] shrink-0">OUTERWEAR</span>
                <div className="text-right">
                  <span className="font-semibold text-neutral-900 block">{outerwearGarment.garment.name}</span>
                  {outerwearGarment.stylingNote && (
                    <span className="text-[10px] text-neutral-500 italic block">{outerwearGarment.stylingNote}</span>
                  )}
                </div>
              </div>
            )}

            {footwearGarment && (
              <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-neutral-100">
                <span className="text-neutral-500 uppercase text-[10px] shrink-0">FOOTWEAR</span>
                <div className="text-right">
                  <span className="font-semibold text-neutral-900 block">{footwearGarment.garment.name}</span>
                </div>
              </div>
            )}

            {accessories.length > 0 && (
              <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-neutral-100">
                <span className="text-neutral-500 uppercase text-[10px] shrink-0">ACCENTS</span>
                <div className="text-right">
                  <span className="font-semibold text-neutral-900 block">
                    {accessories.map((a) => a.garment.name).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coordinated Hair & Grooming */}
        <div className="pt-2 border-t border-neutral-200">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block mb-2">
            COORDINATED HAIR & GROOMING
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 p-2.5 border border-neutral-200">
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase">HAIRSTYLE</span>
              <span className="font-semibold text-neutral-900 block">
                {hairStyle ? hairStyle.item.name : 'Natural texture preserved'}
              </span>
              {hairStyle?.reasons?.[0] && (
                <span className="text-[9px] text-neutral-500 line-clamp-1 mt-0.5 block">
                  {hairStyle.reasons[0]}
                </span>
              )}
            </div>
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase">GROOMING</span>
              <span className="font-semibold text-neutral-900 block">
                {groomingStyle ? groomingStyle.item.name : 'Disciplined perimeter'}
              </span>
              {groomingStyle?.reasons?.[0] && (
                <span className="text-[9px] text-neutral-500 line-clamp-1 mt-0.5 block">
                  {groomingStyle.reasons[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Honest Reasons */}
        <div className="pt-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block mb-1.5">
            WHY THIS WORKS (HONEST REASONS)
          </span>
          <ul className="space-y-1 text-[11px] text-neutral-700">
            {reasons.slice(0, 3).map((r, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-neutral-400 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cautions (if any) */}
        {cautions && cautions.length > 0 && (
          <div className="bg-amber-50/60 border border-amber-200 p-2.5 text-[10px] text-amber-900 space-y-1">
            <span className="font-semibold uppercase tracking-wider block">CONSIDERATION:</span>
            {cautions.map((c, idx) => (
              <p key={idx} className="font-sans leading-relaxed">{c}</p>
            ))}
          </div>
        )}

        {/* Honest Confidence Calibration */}
        {confidence.toIncreaseConfidence && (
          <div className="bg-neutral-50 border border-neutral-200 p-2.5 text-[10px] text-neutral-600">
            <span className="text-neutral-400 uppercase tracking-wider font-semibold block mb-0.5">
              TO INCREASE CONFIDENCE:
            </span>
            <p className="font-sans italic">{confidence.toIncreaseConfidence}</p>
          </div>
        )}
      </div>

      {/* Accordion Toggle for Technical Factors */}
      <div className="border-t border-neutral-200 bg-neutral-50/50 p-3">
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-600 hover:text-black transition"
        >
          <span>VIEW TECHNICAL COMPATIBILITY FACTORS</span>
          {detailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {detailsOpen && (
          <div className="mt-3 pt-3 border-t border-neutral-200 space-y-2 text-[10px]">
            {outfit.factors.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-neutral-600">
                <span className="uppercase text-neutral-500">{f.category.replace('_', ' ')}</span>
                <span className="font-mono text-neutral-900 font-semibold">{Math.round(f.score * 100)}%</span>
              </div>
            ))}
            <div className="pt-2 border-t border-neutral-200 flex justify-between font-semibold text-neutral-900">
              <span>OVERALL HARMONY SCORE</span>
              <span className="font-mono">{Math.round(look.overallHarmonyScore * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
