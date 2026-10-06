'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import {
  FaceShape,
  HairTexture,
  HairLength,
  HairDensity,
  MaintenanceLevel,
  FitType,
  VisualProfile,
  UndertonePreference,
  ContrastLevel,
  ModestyLevel,
  HeightRange,
  TorsoLegPreference,
  ShoulderHipBalance,
  GenderIdentity,
  StyleExpression,
} from '@/core/domain';

export interface ProfileFormData {
  hairTexture: HairTexture;
  hairLength: HairLength;
  hairDensity: HairDensity;
  maintenanceTolerance: MaintenanceLevel;
  facialHair: 'clean-shaven' | 'stubble' | 'short-beard' | 'medium-beard' | 'full-beard' | 'moustache';
  faceShape: FaceShape;
  topFit: FitType;
  bottomFit: FitType;
  genderIdentity?: GenderIdentity;
  styleExpression?: StyleExpression;
  genderDirection: 'masculine' | 'androgynous' | 'feminine';
  undertone: UndertonePreference | 'unspecified';
  contrastLevel: ContrastLevel;
  modestyLevel: ModestyLevel;
  heightRange: HeightRange;
  torsoLegPreference: TorsoLegPreference;
  shoulderHipBalance: ShoulderHipBalance;
  traditionConstraint?: string;
  budgetTier?: 'accessible' | 'elevated' | 'investment' | 'unspecified';
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<ProfileFormData>;
  onSave: (data: ProfileFormData) => void;
}

const DEFAULT_PROFILE_FORM: ProfileFormData = {
  hairTexture: 'straight',
  hairLength: 'short',
  hairDensity: 'medium',
  maintenanceTolerance: 'moderate',
  facialHair: 'clean-shaven',
  faceShape: 'oval',
  topFit: 'relaxed',
  bottomFit: 'regular',
  genderDirection: 'androgynous',
  undertone: 'unspecified',
  contrastLevel: 'unspecified',
  modestyLevel: 'unrestricted',
  heightRange: 'unspecified',
  torsoLegPreference: 'unspecified',
  shoulderHipBalance: 'unspecified',
  traditionConstraint: '',
  budgetTier: 'unspecified',
};

export function ProfileModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: ProfileModalProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    ...DEFAULT_PROFILE_FORM,
    ...initialData,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...DEFAULT_PROFILE_FORM,
        ...initialData,
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const update = <K extends keyof ProfileFormData>(key: K, val: ProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-editorial-mono">
      <div className="bg-white border border-neutral-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4 mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-editorial-title uppercase tracking-widest text-neutral-900">
              PHYSICAL PROFILE
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-0.5">
              Factual styling characteristics. Used to balance silhouettes, cuts, and proportion.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Hair Section */}
          <div className="border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="text-[11px] font-semibold text-neutral-800 tracking-wider uppercase block mb-3">
              HAIR CHARACTERISTICS
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label id="hair-texture-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Texture
                </label>
                <div role="radiogroup" aria-labelledby="hair-texture-label" className="flex flex-wrap gap-1.5">
                  {(['straight', 'wavy', 'curly', 'coily'] as HairTexture[]).map((t) => {
                    const isSelected = formData.hairTexture === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('hairTexture', t)}
                        className={`px-3 py-1.5 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label id="hair-length-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Length
                </label>
                <div role="radiogroup" aria-labelledby="hair-length-label" className="flex flex-wrap gap-1.5">
                  {(['buzz', 'short', 'medium', 'long'] as HairLength[]).map((l) => {
                    const isSelected = formData.hairLength === l;
                    return (
                      <button
                        type="button"
                        key={l}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('hairLength', l)}
                        className={`px-3 py-1.5 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label id="hair-density-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Density
                </label>
                <div role="radiogroup" aria-labelledby="hair-density-label" className="flex flex-wrap gap-1.5">
                  {(['low', 'medium', 'high'] as HairDensity[]).map((d) => {
                    const isSelected = formData.hairDensity === d;
                    return (
                      <button
                        type="button"
                        key={d}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('hairDensity', d)}
                        className={`px-3 py-1.5 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label id="hair-maintenance-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Maintenance Tolerance
                </label>
                <div role="radiogroup" aria-labelledby="hair-maintenance-label" className="flex flex-wrap gap-1.5">
                  {(['minimal', 'moderate', 'high'] as MaintenanceLevel[]).map((m) => {
                    const isSelected = formData.maintenanceTolerance === m;
                    return (
                      <button
                        type="button"
                        key={m}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('maintenanceTolerance', m)}
                        className={`px-3 py-1.5 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Facial Hair & Face Shape */}
          <div className="border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="text-[11px] font-semibold text-neutral-800 tracking-wider uppercase block mb-3">
              FACE & GROOMING
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label id="facial-hair-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Current Facial Hair
                </label>
                <span className="text-[10px] text-neutral-400 block mb-2 font-sans normal-case">
                  Describes your present grooming baseline, not an immutable styling limit.
                </span>
                <div role="radiogroup" aria-labelledby="facial-hair-label" className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'clean-shaven', label: 'Clean-shaven' },
                    { id: 'stubble', label: 'Stubble' },
                    { id: 'short-beard', label: 'Short Beard' },
                    { id: 'medium-beard', label: 'Medium Beard' },
                    { id: 'full-beard', label: 'Full Beard' },
                    { id: 'moustache', label: 'Moustache' },
                  ].map((item) => {
                    const isSelected = formData.facialHair === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('facialHair', item.id as any)}
                        className={`px-3 py-1.5 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label id="face-shape-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Face Shape
                </label>
                <div role="radiogroup" aria-labelledby="face-shape-label" className="flex flex-wrap gap-1.5">
                  {(['oval', 'square', 'round', 'rectangle', 'heart', 'diamond'] as FaceShape[]).map((shape) => {
                    const isSelected = formData.faceShape === shape;
                    return (
                      <button
                        type="button"
                        key={shape}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('faceShape', shape)}
                        className={`px-3 py-1.5 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {shape}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Fit & Silhouette Direction */}
          <div className="border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="text-[11px] font-semibold text-neutral-800 tracking-wider uppercase block mb-3">
              FIT & PROPORTION PREFERENCES
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label id="top-fit-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Top Fit
                </label>
                <div role="radiogroup" aria-labelledby="top-fit-label" className="flex flex-wrap gap-1.5">
                  {(['slim', 'regular', 'relaxed', 'boxy', 'oversized'] as FitType[]).map((fit) => {
                    const isSelected = formData.topFit === fit;
                    return (
                      <button
                        type="button"
                        key={fit}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('topFit', fit)}
                        className={`px-2.5 py-1 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {fit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label id="bottom-fit-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Bottom Fit
                </label>
                <div role="radiogroup" aria-labelledby="bottom-fit-label" className="flex flex-wrap gap-1.5">
                  {(['slim', 'regular', 'relaxed', 'tailored', 'oversized'] as FitType[]).map((fit) => {
                    const isSelected = formData.bottomFit === fit;
                    return (
                      <button
                        type="button"
                        key={fit}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update('bottomFit', fit)}
                        className={`px-2.5 py-1 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {fit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label id="style-expression-label" className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Style Expression
                </label>
                <span className="text-[10px] text-neutral-400 block mb-2 font-sans normal-case">
                  Soft presentation preference. Never hard-filters clothing items.
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="style-expression-label"
                  className="flex flex-wrap gap-1.5"
                >
                  {[
                    { id: 'masculine', label: 'Masculine' },
                    { id: 'feminine', label: 'Feminine' },
                    { id: 'androgynous', label: 'Androgynous' },
                    { id: 'no-preference', label: 'No Preference' },
                  ].map((item) => {
                    const isSelected =
                      (formData.styleExpression || formData.genderDirection) === item.id ||
                      (item.id === 'no-preference' && !formData.styleExpression && formData.genderDirection === 'androgynous');

                    return (
                      <button
                        type="button"
                        key={item.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          update('styleExpression', item.id as StyleExpression);
                          if (item.id !== 'no-preference') {
                            update('genderDirection', item.id as 'masculine' | 'androgynous' | 'feminine');
                          }
                        }}
                        className={`px-2.5 py-1 uppercase text-[11px] border transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Optional Gender Identity Context (ZERO Scoring Weight) */}
            <div className="mt-4 pt-3 border-t border-neutral-200">
              <label id="gender-identity-label" className="block text-neutral-500 mb-1 uppercase tracking-wide">
                Gender Identity (Optional Context — 0 Scoring Weight)
              </label>
              <span className="text-[10px] text-neutral-400 block mb-2 font-sans normal-case">
                VAEL styles people. Gender identity carries strictly zero scoring weight and never filters clothing.
              </span>
              <div
                role="radiogroup"
                aria-labelledby="gender-identity-label"
                className="flex flex-wrap gap-1.5"
              >
                {[
                  { id: 'man', label: 'Man' },
                  { id: 'woman', label: 'Woman' },
                  { id: 'non-binary', label: 'Non-binary' },
                  { id: 'prefer-not-to-specify', label: 'Prefer not to specify' },
                  { id: 'self-describe', label: 'Self-describe' },
                  { id: 'unspecified', label: 'Skip / Unanswered' },
                ].map((item) => {
                  const isSelected = (formData.genderIdentity || 'unspecified') === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => update('genderIdentity', item.id as GenderIdentity)}
                      className={`px-2.5 py-1 uppercase text-[11px] border transition flex items-center gap-1 ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-0.5" aria-hidden="true" />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color & Contrast (F-01) */}
          <div className="border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="text-[11px] font-semibold text-neutral-800 tracking-wider uppercase block mb-3">
              COLOR & CONTRAST
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Undertone
                </label>
                <span className="text-[10px] text-neutral-400 block mb-2 font-sans normal-case">
                  Unknown undertone defaults safely to neutral-safe palette curation.
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'warm', label: 'Warm' },
                    { id: 'cool', label: 'Cool' },
                    { id: 'neutral', label: 'Neutral' },
                    { id: 'unspecified', label: 'Not sure / Skip' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => update('undertone', item.id as any)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.undertone === item.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Contrast Level
                </label>
                <span className="text-[10px] text-neutral-400 block mb-2 font-sans normal-case">
                  Intensity difference between hair, eyes, and skin.
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'low', label: 'Low' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'high', label: 'High' },
                    { id: 'unspecified', label: 'Not sure / Skip' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => update('contrastLevel', item.id as any)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.contrastLevel === item.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modesty & Coverage (F-01) */}
          <div className="border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="text-[11px] font-semibold text-neutral-800 tracking-wider uppercase block mb-3">
              MODESTY & COVERAGE
            </span>
            <div>
              <span className="text-[10px] text-neutral-400 block mb-2 font-sans normal-case">
                Strict coverage preference. Items violating your coverage limit are permanently vetoed.
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'unrestricted', label: 'Unrestricted / Standard' },
                  { id: 'covered-arms', label: 'Covered Arms' },
                  { id: 'covered-legs', label: 'Covered Legs' },
                  { id: 'covered-both', label: 'Covered Arms & Legs' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => update('modestyLevel', item.id as any)}
                    className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                      formData.modestyLevel === item.id
                        ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Physical Proportions (F-01) */}
          <div className="border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="text-[11px] font-semibold text-neutral-800 tracking-wider uppercase block mb-3">
              PHYSICAL PROPORTIONS & BALANCE
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Height Range
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'average', label: 'Average' },
                    { id: 'tall', label: 'Tall' },
                    { id: 'unspecified', label: 'Skip' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => update('heightRange', item.id as any)}
                      className={`px-2.5 py-1 uppercase text-[11px] border transition ${
                        formData.heightRange === item.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Torso / Leg Ratio
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'longer-torso', label: 'Long Torso' },
                    { id: 'longer-legs', label: 'Long Legs' },
                    { id: 'unspecified', label: 'Skip' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => update('torsoLegPreference', item.id as any)}
                      className={`px-2.5 py-1 uppercase text-[11px] border transition ${
                        formData.torsoLegPreference === item.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Shoulder / Hip Frame
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'broad-shoulders', label: 'Broad Shoulders' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'wider-hips', label: 'Wider Hips' },
                    { id: 'unspecified', label: 'Skip' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => update('shoulderHipBalance', item.id as any)}
                      className={`px-2.5 py-1 uppercase text-[11px] border transition ${
                        formData.shoulderHipBalance === item.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tradition Layer & Budget (F-01, F-07) */}
          <div className="border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="text-[11px] font-semibold text-neutral-800 tracking-wider uppercase block mb-3">
              TRADITION LAYER & BUDGET TIER
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Tradition Constraint (Optional)
                </label>
                <input
                  type="text"
                  value={formData.traditionConstraint || ''}
                  onChange={(e) => update('traditionConstraint', e.target.value)}
                  placeholder="e.g. South Asian, East Asian, Nordic..."
                  className="w-full px-3 py-1.5 border border-neutral-300 text-[11px] bg-white text-neutral-900 focus:outline-none focus:border-black font-sans"
                />
                {formData.traditionConstraint && (
                  <span className="text-[10px] text-neutral-500 block mt-1 italic">
                    Note: Tradition pack not available yet. Cultural ceremony occasions will prioritize heritage tunics and raw silk suiting.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Budget Tier
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'accessible', label: 'Accessible' },
                    { id: 'elevated', label: 'Elevated' },
                    { id: 'investment', label: 'Investment' },
                    { id: 'unspecified', label: 'Not sure / Skip' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => update('budgetTier', item.id as any)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.budgetTier === item.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:border-black transition uppercase tracking-wider text-[11px]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-neutral-900 hover:bg-black text-white transition uppercase tracking-wider text-[11px] font-semibold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              SAVE & UPDATE PROFILE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
