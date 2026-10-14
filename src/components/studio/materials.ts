import * as THREE from 'three';

/**
 * Editorial Clay & Studio Materials
 * Matte clay-white mannequin, pale neutral ground, soft studio lighting.
 */
export const StudioMaterials = {
  // Editorial Matte Clay Mannequin
  createMannequinMaterial: (skinToneHex: string = '#f0ede6') => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinToneHex),
      roughness: 0.82,
      metalness: 0.04,
      flatShading: false,
    });
  },

  // Subtle Wireframe/Clay Pedestal
  createPedestalMaterial: () => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e5e4df'),
      roughness: 0.9,
      metalness: 0.05,
    });
  },

  // Editorial Hair Material
  createHairMaterial: (colorHex: string = '#1c1b1a') => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.75,
      metalness: 0.1,
    });
  },

  // Procedural Garment Material from Garment properties
  createGarmentMaterial: (
    colorHex: string,
    materialType: 'wool' | 'silk' | 'cotton' | 'leather' | 'linen' | 'technical' = 'cotton',
    structure: number = 3
  ) => {
    let roughness = 0.8;
    let metalness = 0.02;

    if (materialType === 'silk' || materialType === 'leather') {
      roughness = 0.35;
      metalness = 0.12;
    } else if (materialType === 'wool') {
      roughness = 0.88;
      metalness = 0.02;
    } else if (materialType === 'technical') {
      roughness = 0.45;
      metalness = 0.08;
    } else if (materialType === 'linen') {
      roughness = 0.92;
      metalness = 0.01;
    }

    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness,
      metalness,
      side: THREE.DoubleSide,
    });
  },
};
