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
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Texture
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['straight', 'wavy', 'curly', 'coily'] as HairTexture[]).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => update('hairTexture', t)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.hairTexture === t
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Length
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['buzz', 'short', 'medium', 'long'] as HairLength[]).map((l) => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => update('hairLength', l)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.hairLength === l
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Density
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['low', 'medium', 'high'] as HairDensity[]).map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => update('hairDensity', d)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.hairDensity === d
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Maintenance Tolerance
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['minimal', 'moderate', 'high'] as MaintenanceLevel[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => update('maintenanceTolerance', m)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.maintenanceTolerance === m
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
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
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Current Facial Hair
                </label>
                <span className="text-[10px] text-neutral-400 block mb-2 font-sans normal-case">
                  Describes your present grooming baseline, not an immutable styling limit.
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'clean-shaven', label: 'Clean-shaven' },
                    { id: 'stubble', label: 'Stubble' },
                    { id: 'short-beard', label: 'Short Beard' },
                    { id: 'medium-beard', label: 'Medium Beard' },
                    { id: 'full-beard', label: 'Full Beard' },
                    { id: 'moustache', label: 'Moustache' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => update('facialHair', item.id as any)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.facialHair === item.id
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
                  Face Shape
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['oval', 'square', 'round', 'rectangle', 'heart', 'diamond'] as FaceShape[]).map((shape) => (
                    <button
                      type="button"
                      key={shape}
                      onClick={() => update('faceShape', shape)}
                      className={`px-3 py-1.5 uppercase text-[11px] border transition ${
                        formData.faceShape === shape
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
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
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Top Fit
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['slim', 'regular', 'relaxed', 'boxy', 'oversized'] as FitType[]).map((fit) => (
                    <button
                      type="button"
                      key={fit}
                      onClick={() => update('topFit', fit)}
                      className={`px-2.5 py-1 uppercase text-[11px] border transition ${
                        formData.topFit === fit
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Bottom Fit
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['slim', 'regular', 'relaxed', 'tailored', 'oversized'] as FitType[]).map((fit) => (
                    <button
                      type="button"
                      key={fit}
                      onClick={() => update('bottomFit', fit)}
                      className={`px-2.5 py-1 uppercase text-[11px] border transition ${
                        formData.bottomFit === fit
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Expression
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['masculine', 'androgynous', 'feminine'] as const).map((dir) => (
                    <button
                      type="button"
                      key={dir}
                      onClick={() => update('genderDirection', dir)}
                      className={`px-2.5 py-1 uppercase text-[11px] border transition ${
                        formData.genderDirection === dir
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
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
