'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Garment } from '../../core/domain';
import { StudioSlotType } from './types';
import { StudioMaterials } from './materials';
import { mapGarmentToArchetype, ArchetypeId } from './archetype-mapper';

interface GarmentMeshProps {
  slotType: StudioSlotType;
  garment: Garment;
  isSelected?: boolean;
  onSelect?: (slotType: StudioSlotType) => void;
}

export const GarmentMesh: React.FC<GarmentMeshProps> = ({
  slotType,
  garment,
  isSelected = false,
  onSelect,
}) => {
  const materialType = useMemo(() => {
    const mat = (garment.material || '').toLowerCase();
    if (mat.includes('wool') || mat.includes('cashmere') || mat.includes('flannel')) return 'wool';
    if (mat.includes('silk') || mat.includes('satin')) return 'silk';
    if (mat.includes('leather') || mat.includes('calfskin') || mat.includes('suede')) return 'leather';
    if (mat.includes('linen')) return 'linen';
    if (mat.includes('gore-tex') || mat.includes('nylon') || mat.includes('membrane')) return 'technical';
    return 'cotton';
  }, [garment.material]);

  const garmentMat = useMemo(() => {
    const hex = garment.color?.hex || '#2b2b2b';
    const mat = StudioMaterials.createGarmentMaterial(hex, materialType, garment.structure);
    if (isSelected) {
      mat.emissive = new THREE.Color('#333333');
    }
    return mat;
  }, [garment.color?.hex, materialType, garment.structure, isSelected]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelect) onSelect(slotType);
  };

  // Archetype Identification
  const archetype: ArchetypeId = useMemo(() => mapGarmentToArchetype(garment), [garment]);

  return (
    <group position={[0, -0.9, 0]} onClick={handleClick}>
      {/* ========================================================
          1. TOP / SHIRT / KNIT / POLO / HOODIE
          ======================================================== */}
      {slotType === 'top' && (
        <group>
          {archetype === 'tee' ? (
            /* Fitted / Boxy T-Shirt */
            <group position={[0, 1.25, 0]}>
              <mesh material={garmentMat} castShadow>
                <cylinderGeometry args={[0.195, 0.155, 0.36, 28]} />
              </mesh>
              <mesh position={[-0.23, 0.08, 0]} rotation={[0, 0, 0.1]} material={garmentMat}>
                <cylinderGeometry args={[0.048, 0.044, 0.14, 20]} />
              </mesh>
              <mesh position={[0.23, 0.08, 0]} rotation={[0, 0, -0.1]} material={garmentMat}>
                <cylinderGeometry args={[0.048, 0.044, 0.14, 20]} />
              </mesh>
            </group>
          ) : archetype === 'hoodie' ? (
            /* Relaxed Hoodie / Sweatshirt */
            <group position={[0, 1.24, 0]}>
              <mesh material={garmentMat} castShadow>
                <cylinderGeometry args={[0.22, 0.18, 0.44, 28]} />
              </mesh>
              <mesh position={[-0.24, 0.01, 0]} rotation={[0, 0, 0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.054, 0.044, 0.38, 20]} />
              </mesh>
              <mesh position={[0.24, 0.01, 0]} rotation={[0, 0, -0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.054, 0.044, 0.38, 20]} />
              </mesh>
              {/* Hood Volume at collar */}
              <mesh position={[0, 0.22, -0.06]} material={garmentMat}>
                <sphereGeometry args={[0.09, 16, 16]} />
              </mesh>
            </group>
          ) : archetype === 'knit' ? (
            /* Chunky / Fine Knit Crewneck or Turtleneck */
            <group position={[0, 1.24, 0]}>
              <mesh material={garmentMat} castShadow>
                <cylinderGeometry args={[0.21, 0.175, 0.42, 28]} />
              </mesh>
              <mesh position={[-0.24, 0.01, 0]} rotation={[0, 0, 0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.052, 0.042, 0.38, 20]} />
              </mesh>
              <mesh position={[0.24, 0.01, 0]} rotation={[0, 0, -0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.052, 0.042, 0.38, 20]} />
              </mesh>
              <mesh position={[0, 0.22, 0]} material={garmentMat}>
                <torusGeometry args={[0.065, 0.014, 16, 28]} />
              </mesh>
            </group>
          ) : (
            /* Poplin Shirt / Camp Collar / Silk Blouse */
            <group position={[0, 1.24, 0]}>
              <mesh material={garmentMat} castShadow>
                <cylinderGeometry args={[0.2, 0.165, 0.38, 28]} />
              </mesh>
              <mesh position={[-0.24, 0.01, 0]} rotation={[0, 0, 0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.048, 0.038, 0.38, 20]} />
              </mesh>
              <mesh position={[0.24, 0.01, 0]} rotation={[0, 0, -0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.048, 0.038, 0.38, 20]} />
              </mesh>
              {/* Pointed / Camp Collar */}
              <mesh position={[0, 0.2, 0.02]} rotation={[0.2, 0, 0]} material={garmentMat}>
                <boxGeometry args={[0.16, 0.04, 0.06]} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ========================================================
          2. BOTTOM / TROUSERS / CHINOS / DENIM / SKIRT / SHORTS
          ======================================================== */}
      {slotType === 'bottom' && (
        <group>
          {archetype === 'skirt' ? (
            /* Midi / A-Line Skirt */
            <group position={[0, 0.62, 0]}>
              <mesh material={garmentMat} castShadow>
                <cylinderGeometry args={[0.168, 0.29, 0.66, 32, 1, true]} />
              </mesh>
            </group>
          ) : archetype === 'shorts' ? (
            /* Tailored Bermuda / Casual Shorts */
            <group position={[0, 0.76, 0]}>
              <mesh position={[0, 0.2, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.168, 0.16, 0.14, 28]} />
              </mesh>
              <mesh position={[-0.1, 0.02, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.075, 0.075, 0.24, 24]} />
              </mesh>
              <mesh position={[0.1, 0.02, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.075, 0.075, 0.24, 24]} />
              </mesh>
            </group>
          ) : archetype === 'trousers-wide' ? (
            /* Wide-Leg Fluid Trousers */
            <group position={[0, 0.52, 0]}>
              <mesh position={[0, 0.44, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.172, 0.165, 0.16, 28]} />
              </mesh>
              <mesh position={[-0.11, 0.05, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.085, 0.09, 0.68, 24]} />
              </mesh>
              <mesh position={[0.11, 0.05, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.085, 0.09, 0.68, 24]} />
              </mesh>
            </group>
          ) : (
            /* Straight / Tailored Trousers / Chinos / Denim */
            <group position={[0, 0.52, 0]}>
              <mesh position={[0, 0.44, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.168, 0.158, 0.16, 28]} />
              </mesh>
              <mesh position={[-0.11, 0.05, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.068, 0.054, 0.68, 24]} />
              </mesh>
              <mesh position={[0.11, 0.05, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.068, 0.054, 0.68, 24]} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ========================================================
          3. ONE-PIECE / DRESS / JUMPSUIT / GOWN
          ======================================================== */}
      {slotType === 'one-piece' && (
        <group position={[0, 0.95, 0]}>
          {archetype === 'jumpsuit' ? (
            /* Jumpsuit / Boiler Suit */
            <group>
              <mesh position={[0, 0.28, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.2, 0.165, 0.36, 28]} />
              </mesh>
              <mesh position={[-0.11, -0.38, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.075, 0.07, 0.72, 24]} />
              </mesh>
              <mesh position={[0.11, -0.38, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.075, 0.07, 0.72, 24]} />
              </mesh>
            </group>
          ) : (
            /* Sheath Dress / Shirt Dress / Evening Gown */
            <group>
              <mesh position={[0, 0.28, 0]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.198, 0.16, 0.38, 28]} />
              </mesh>
              <mesh position={[0, -0.32, 0]} material={garmentMat} castShadow>
                <cylinderGeometry
                  args={[
                    0.16,
                    archetype === 'evening-gown' ? 0.34 : 0.25,
                    archetype === 'evening-gown' ? 0.85 : 0.7,
                    32,
                    1,
                    true,
                  ]}
                />
              </mesh>
              <mesh position={[-0.24, 0.24, 0]} rotation={[0, 0, 0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.044, 0.036, 0.34, 20]} />
              </mesh>
              <mesh position={[0.24, 0.24, 0]} rotation={[0, 0, -0.08]} material={garmentMat}>
                <cylinderGeometry args={[0.044, 0.036, 0.34, 20]} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ========================================================
          4. OUTERWEAR / BLAZER / TRENCH / OVERCOAT / BOMBER
          ======================================================== */}
      {slotType === 'outerwear' && (
        <group>
          {archetype === 'coat' ? (
            /* Longline Overcoat / Trench */
            <group position={[0, 1.05, 0]}>
              <mesh material={garmentMat} castShadow>
                <cylinderGeometry args={[0.23, 0.27, 0.85, 30, 1, true]} />
              </mesh>
              <mesh position={[-0.26, 0.2, 0]} rotation={[0, 0, 0.09]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.058, 0.05, 0.44, 20]} />
              </mesh>
              <mesh position={[0.26, 0.2, 0]} rotation={[0, 0, -0.09]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.058, 0.05, 0.44, 20]} />
              </mesh>
              <mesh position={[0, 0.35, 0.1]} material={garmentMat}>
                <boxGeometry args={[0.24, 0.26, 0.05]} />
              </mesh>
            </group>
          ) : (
            /* Tailored Blazer / Bomber / Harrington */
            <group position={[0, 1.25, 0]}>
              <mesh material={garmentMat} castShadow>
                <cylinderGeometry args={[0.22, 0.19, 0.46, 28]} />
              </mesh>
              <mesh position={[-0.25, 0.02, 0]} rotation={[0, 0, 0.08]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.054, 0.044, 0.4, 20]} />
              </mesh>
              <mesh position={[0.25, 0.02, 0]} rotation={[0, 0, -0.08]} material={garmentMat} castShadow>
                <cylinderGeometry args={[0.054, 0.044, 0.4, 20]} />
              </mesh>
              <mesh position={[0, 0.1, 0.08]} material={garmentMat}>
                <boxGeometry args={[0.22, 0.26, 0.04]} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ========================================================
          5. FOOTWEAR / BOOTS / LOAFERS / DERBIES / SNEAKERS / HEELS
          ======================================================== */}
      {slotType === 'footwear' && (
        <group position={[0, 0, 0]}>
          {archetype === 'boots' ? (
            /* Chelsea / Riding Boots */
            <>
              <group position={[-0.11, 0.06, 0.03]}>
                <mesh material={garmentMat} castShadow>
                  <boxGeometry args={[0.08, 0.08, 0.19]} />
                </mesh>
                <mesh position={[0, 0.1, -0.02]} material={garmentMat}>
                  <cylinderGeometry args={[0.046, 0.042, 0.18, 20]} />
                </mesh>
              </group>
              <group position={[0.11, 0.06, 0.03]}>
                <mesh material={garmentMat} castShadow>
                  <boxGeometry args={[0.08, 0.08, 0.19]} />
                </mesh>
                <mesh position={[0, 0.1, -0.02]} material={garmentMat}>
                  <cylinderGeometry args={[0.046, 0.042, 0.18, 20]} />
                </mesh>
              </group>
            </>
          ) : archetype === 'heels' ? (
            /* Kitten Heel / Pumps */
            <>
              <mesh position={[-0.11, 0.06, 0.04]} material={garmentMat} castShadow>
                <boxGeometry args={[0.07, 0.05, 0.18]} />
              </mesh>
              <mesh position={[-0.11, 0.025, -0.03]} material={garmentMat}>
                <cylinderGeometry args={[0.01, 0.01, 0.05, 12]} />
              </mesh>
              <mesh position={[0.11, 0.06, 0.04]} material={garmentMat} castShadow>
                <boxGeometry args={[0.07, 0.05, 0.18]} />
              </mesh>
              <mesh position={[0.11, 0.025, -0.03]} material={garmentMat}>
                <cylinderGeometry args={[0.01, 0.01, 0.05, 12]} />
              </mesh>
            </>
          ) : (
            /* Loafers / Derbies / Oxfords / Minimal Sneakers */
            <>
              <mesh position={[-0.11, 0.055, 0.04]} material={garmentMat} castShadow>
                <boxGeometry args={[0.076, 0.065, 0.19]} />
              </mesh>
              <mesh position={[0.11, 0.055, 0.04]} material={garmentMat} castShadow>
                <boxGeometry args={[0.076, 0.065, 0.19]} />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* ========================================================
          6. ACCESSORIES / BAG / EYEWEAR / SCARF / BELT
          ======================================================== */}
      {slotType === 'accessory' && (
        <group>
          {archetype === 'bag' ? (
            /* Minimalist Leather Tote at side */
            <mesh position={[-0.32, 0.82, 0.04]} material={garmentMat} castShadow>
              <boxGeometry args={[0.08, 0.26, 0.24]} />
            </mesh>
          ) : archetype === 'eyewear' ? (
            /* Sunglasses on face */
            <mesh position={[0, 1.63, 0.105]} material={garmentMat}>
              <boxGeometry args={[0.12, 0.028, 0.03]} />
            </mesh>
          ) : (
            /* Belt or Scarf Accent */
            <mesh position={[0, 1.05, 0]} material={garmentMat}>
              <cylinderGeometry args={[0.155, 0.155, 0.03, 28]} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
};
