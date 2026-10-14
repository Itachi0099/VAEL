'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AvatarAppearance } from './types';
import { StudioMaterials } from './materials';

interface MannequinProps {
  appearance: AvatarAppearance;
}

export const Mannequin: React.FC<MannequinProps> = ({ appearance }) => {
  const mannequinMat = useMemo(
    () => StudioMaterials.createMannequinMaterial(appearance.skinTone),
    [appearance.skinTone]
  );

  const hairMat = useMemo(
    () => StudioMaterials.createHairMaterial(appearance.hairColor),
    [appearance.hairColor]
  );

  const pedestalMat = useMemo(() => StudioMaterials.createPedestalMaterial(), []);

  return (
    <group position={[0, -0.9, 0]}>
      {/* 1. Pedestal Ground Anchor */}
      <mesh position={[0, 0.015, 0]} material={pedestalMat} receiveShadow>
        <cylinderGeometry args={[0.55, 0.6, 0.03, 48]} />
      </mesh>

      {/* 2. Feet */}
      <mesh position={[-0.11, 0.05, 0.04]} material={mannequinMat} castShadow>
        <boxGeometry args={[0.07, 0.06, 0.18]} />
      </mesh>
      <mesh position={[0.11, 0.05, 0.04]} material={mannequinMat} castShadow>
        <boxGeometry args={[0.07, 0.06, 0.18]} />
      </mesh>

      {/* 3. Lower Legs (Calves) */}
      <mesh position={[-0.11, 0.28, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.42, 24]} />
      </mesh>
      <mesh position={[0.11, 0.28, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.42, 24]} />
      </mesh>

      {/* 4. Knees */}
      <mesh position={[-0.11, 0.51, 0]} material={mannequinMat}>
        <sphereGeometry args={[0.042, 16, 16]} />
      </mesh>
      <mesh position={[0.11, 0.51, 0]} material={mannequinMat}>
        <sphereGeometry args={[0.042, 16, 16]} />
      </mesh>

      {/* 5. Thighs */}
      <mesh position={[-0.11, 0.74, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.062, 0.046, 0.42, 24]} />
      </mesh>
      <mesh position={[0.11, 0.74, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.062, 0.046, 0.42, 24]} />
      </mesh>

      {/* 6. Pelvis & Hips */}
      <mesh position={[0, 0.98, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.165, 0.15, 0.14, 28]} />
      </mesh>

      {/* 7. Waist & Abdomen */}
      <mesh position={[0, 1.11, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.15, 0.142, 0.14, 28]} />
      </mesh>

      {/* 8. Chest & Torso */}
      <mesh position={[0, 1.28, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.19, 0.152, 0.22, 28]} />
      </mesh>

      {/* 9. Shoulders */}
      <mesh position={[0, 1.4, 0]} material={mannequinMat} castShadow>
        <boxGeometry args={[0.44, 0.07, 0.16]} />
      </mesh>

      {/* 10. Arms & Forearms */}
      {/* Left Arm */}
      <mesh position={[-0.23, 1.25, 0]} rotation={[0, 0, 0.08]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.28, 20]} />
      </mesh>
      <mesh position={[-0.25, 0.97, 0.02]} rotation={[0.05, 0, 0.05]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.035, 0.03, 0.28, 20]} />
      </mesh>
      <mesh position={[-0.26, 0.81, 0.03]} material={mannequinMat} castShadow>
        <boxGeometry args={[0.04, 0.07, 0.03]} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.23, 1.25, 0]} rotation={[0, 0, -0.08]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.28, 20]} />
      </mesh>
      <mesh position={[0.25, 0.97, 0.02]} rotation={[0.05, 0, -0.05]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.035, 0.03, 0.28, 20]} />
      </mesh>
      <mesh position={[0.26, 0.81, 0.03]} material={mannequinMat} castShadow>
        <boxGeometry args={[0.04, 0.07, 0.03]} />
      </mesh>

      {/* 11. Neck */}
      <mesh position={[0, 1.48, 0]} material={mannequinMat} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.12, 24]} />
      </mesh>

      {/* 12. Head & Editorial Face Feature Profile */}
      <group position={[0, 1.62, 0]}>
        {/* Main Cranium / Face */}
        <mesh material={mannequinMat} castShadow>
          <sphereGeometry args={[0.105, 32, 32]} />
        </mesh>
        {/* Editorial Minimal Jaw/Chin Plane */}
        <mesh position={[0, -0.055, 0.03]} material={mannequinMat} castShadow>
          <cylinderGeometry args={[0.075, 0.05, 0.07, 24]} />
        </mesh>

        {/* 13. Procedural Hair Styling */}
        {appearance.hairLength === 'buzz' && (
          <mesh position={[0, 0.025, 0]} material={hairMat}>
            <sphereGeometry args={[0.108, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
        )}

        {appearance.hairLength === 'short' && (
          <group position={[0, 0.03, 0]}>
            <mesh material={hairMat}>
              <sphereGeometry args={[0.114, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            </mesh>
            {appearance.hairTexture === 'curly' || appearance.hairTexture === 'coily' ? (
              // Textured crown waves
              <>
                <mesh position={[0, 0.08, 0.02]} material={hairMat}>
                  <sphereGeometry args={[0.05, 12, 12]} />
                </mesh>
                <mesh position={[-0.04, 0.07, -0.02]} material={hairMat}>
                  <sphereGeometry args={[0.045, 12, 12]} />
                </mesh>
                <mesh position={[0.04, 0.07, -0.02]} material={hairMat}>
                  <sphereGeometry args={[0.045, 12, 12]} />
                </mesh>
              </>
            ) : null}
          </group>
        )}

        {(appearance.hairLength === 'medium' || appearance.hairLength === 'shoulder' || appearance.hairLength === 'long') && (
          <group position={[0, 0.03, 0]}>
            <mesh material={hairMat}>
              <sphereGeometry args={[0.115, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            </mesh>
            {/* Side drape */}
            <mesh position={[-0.09, -0.06, -0.02]} rotation={[0, 0, -0.1]} material={hairMat}>
              <cylinderGeometry args={[0.03, 0.025, appearance.hairLength === 'long' ? 0.28 : 0.16, 12]} />
            </mesh>
            <mesh position={[0.09, -0.06, -0.02]} rotation={[0, 0, 0.1]} material={hairMat}>
              <cylinderGeometry args={[0.03, 0.025, appearance.hairLength === 'long' ? 0.28 : 0.16, 12]} />
            </mesh>
            {/* Back drape */}
            <mesh position={[0, -0.08, -0.08]} material={hairMat}>
              <cylinderGeometry args={[0.07, 0.06, appearance.hairLength === 'long' ? 0.32 : 0.18, 16]} />
            </mesh>
          </group>
        )}

        {/* 14. Facial Hair (if selected) */}
        {appearance.facialHairStyle && (
          <group position={[0, -0.06, 0.045]}>
            <mesh material={hairMat}>
              <boxGeometry args={[0.09, 0.04, 0.06]} />
            </mesh>
            {appearance.facialHairStyle === 'full-beard' && (
              <mesh position={[0, -0.04, 0.01]} material={hairMat}>
                <sphereGeometry args={[0.045, 16, 16]} />
              </mesh>
            )}
          </group>
        )}
      </group>
    </group>
  );
};
