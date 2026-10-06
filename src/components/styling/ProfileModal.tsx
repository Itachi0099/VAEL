'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import {
  FaceShape,
  HairTexture,
  HairLength,
  HairDensity,
  MaintenanceLevel,
  FitType,
  VisualProfile,
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
                  Facial Hair
                </label>
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
