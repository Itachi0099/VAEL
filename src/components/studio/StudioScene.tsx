'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { StudioLookState, StudioSlotType, AvatarAppearance } from './types';
import { Mannequin } from './Mannequin';
import { GarmentMesh } from './GarmentMesh';

interface StudioSceneProps {
  look: StudioLookState;
  appearance: AvatarAppearance;
  selectedSlot: StudioSlotType | null;
  onSelectSlot?: (slotType: StudioSlotType) => void;
  onRotateStep?: (direction: 'left' | 'right') => void;
}

// Inner Controller handling Camera, Auto-rotation, and Double-Tap reset
const SceneController: React.FC<{
  look: StudioLookState;
  appearance: AvatarAppearance;
  selectedSlot: StudioSlotType | null;
  onSelectSlot?: (slotType: StudioSlotType) => void;
  prefersReducedMotion: boolean;
}> = ({ look, appearance, selectedSlot, onSelectSlot, prefersReducedMotion }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartInteraction = () => {
    setIsInteracting(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  const handleEndInteraction = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3000); // 3-second resume after idle
  };

  const handlePointerDown = () => handleStartInteraction();
  const handlePointerUp = () => handleEndInteraction();

  // Reset to initial framing on double click
  const handleDoubleClick = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        autoRotate={!prefersReducedMotion && !isInteracting}
        autoRotateSpeed={3.3}
        minDistance={2.4}
        maxDistance={5.8}
        minPolarAngle={Math.PI * 0.35} // ~63 deg
        maxPolarAngle={Math.PI * 0.58} // ~104 deg
        onStart={handleStartInteraction}
        onEnd={handleEndInteraction}
      />

      {/* Editorial Soft Studio Lighting */}
      <ambientLight intensity={0.85} color="#ffffff" />
      <directionalLight
        position={[3, 4, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
        shadow-bias={-0.0001}
      />
      {/* Soft Fill Light */}
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#f4ede6" />
      {/* Subtle Rim / Contour Light */}
      <directionalLight position={[0, 3, -4]} intensity={0.4} color="#e6f0fa" />

      {/* Interactive Mannequin and Garment Slots */}
      <group
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <Mannequin appearance={appearance} />

        {/* Render Garment Archetypes */}
        {look.slots['one-piece'] && (
          <GarmentMesh
            slotType="one-piece"
            garment={look.slots['one-piece'].garment}
            isSelected={selectedSlot === 'one-piece'}
            onSelect={onSelectSlot}
          />
        )}
        {look.slots.top && !look.slots['one-piece'] && (
          <GarmentMesh
            slotType="top"
            garment={look.slots.top.garment}
            isSelected={selectedSlot === 'top'}
            onSelect={onSelectSlot}
          />
        )}
        {look.slots.bottom && !look.slots['one-piece'] && (
          <GarmentMesh
            slotType="bottom"
            garment={look.slots.bottom.garment}
            isSelected={selectedSlot === 'bottom'}
            onSelect={onSelectSlot}
          />
        )}
        {look.slots.outerwear && (
          <GarmentMesh
            slotType="outerwear"
            garment={look.slots.outerwear.garment}
            isSelected={selectedSlot === 'outerwear'}
            onSelect={onSelectSlot}
          />
        )}
        {look.slots.footwear && (
          <GarmentMesh
            slotType="footwear"
            garment={look.slots.footwear.garment}
            isSelected={selectedSlot === 'footwear'}
            onSelect={onSelectSlot}
          />
        )}
        {look.slots.accessory && (
          <GarmentMesh
            slotType="accessory"
            garment={look.slots.accessory.garment}
            isSelected={selectedSlot === 'accessory'}
            onSelect={onSelectSlot}
          />
        )}

        {/* Soft Editorial Contact Shadows */}
        <ContactShadows
          position={[0, -0.9, 0]}
          opacity={0.45}
          scale={2.2}
          blur={1.8}
          far={1.4}
        />
      </group>
    </>
  );
};

export const StudioScene: React.FC<StudioSceneProps> = ({
  look,
  appearance,
  selectedSlot,
  onSelectSlot,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  return (
    <div className="w-full h-full relative select-none bg-[#faf9f6]">
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 3.8], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <SceneController
          look={look}
          appearance={appearance}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Canvas>
    </div>
  );
};
