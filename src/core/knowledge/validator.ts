import { GARMENTS } from './garments.data';
import { HAIRSTYLES } from './hairstyles.data';
import { BEARD_STYLES } from './beards.data';
import { STYLE_FAMILIES } from './styles.data';
import { OCCASIONS } from './occasions.data';
import { NUMERIC_STYLE_AXES } from '../domain/style-axis';

export interface ValidationError {
  entityType: 'garment' | 'hairstyle' | 'beard_style' | 'style_family' | 'occasion';
  entityId: string;
  field: string;
  issue: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalGarments: number;
  totalHairstyles: number;
  totalBeards: number;
  totalStyles: number;
  totalOccasions: number;
  errors: ValidationError[];
  warnings: string[];
}

export class KnowledgeBaseValidator {
  static validateAll(): ValidationReport {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // --- 1. Validate Garments ---
    for (const g of GARMENTS) {
      if (!g.id || !g.slug || !g.name) {
        errors.push({ entityType: 'garment', entityId: g.id || 'unknown', field: 'identifiers', issue: 'Missing id, slug or name' });
      }

      // Physics Contradiction Check: Heavyweight wool/fleece marked for extreme heat
      const isWoolOrDownOrFleece =
        g.material.toLowerCase().includes('wool') ||
        g.material.toLowerCase().includes('down') ||
        g.material.toLowerCase().includes('fleece');

      if (g.maxTemperatureC && g.maxTemperatureC > 30 && g.fabricWeight === 'heavyweight' && isWoolOrDownOrFleece) {
        errors.push({
          entityType: 'garment',
          entityId: g.id,
          field: 'maxTemperatureC',
          issue: `Contradiction: Heavyweight fabric (${g.material}) has maxTemperatureC > 30°C`,
        });
      }

      // Temperature bounds
      if (g.minTemperatureC !== undefined && g.maxTemperatureC !== undefined) {
        if (g.minTemperatureC > g.maxTemperatureC) {
          errors.push({
            entityType: 'garment',
            entityId: g.id,
            field: 'temperatureRange',
            issue: `minTemperatureC (${g.minTemperatureC}) exceeds maxTemperatureC (${g.maxTemperatureC})`,
          });
        }
      }

      // Scale limits [1..5]
      if (g.structure < 1 || g.structure > 5) {
        errors.push({ entityType: 'garment', entityId: g.id, field: 'structure', issue: `Structure ${g.structure} outside [1, 5]` });
      }
      if (g.volume < 1 || g.volume > 5) {
        errors.push({ entityType: 'garment', entityId: g.id, field: 'volume', issue: `Volume ${g.volume} outside [1, 5]` });
      }
      if (g.texture < 1 || g.texture > 5) {
        errors.push({ entityType: 'garment', entityId: g.id, field: 'texture', issue: `Texture ${g.texture} outside [1, 5]` });
      }
    }

    // --- 2. Validate Hairstyles ---
    for (const h of HAIRSTYLES) {
      if (!h.compatibleTextures || h.compatibleTextures.length === 0) {
        errors.push({ entityType: 'hairstyle', entityId: h.id, field: 'compatibleTextures', issue: 'Compatible textures cannot be empty' });
      }
      if (h.formalityRange[0] > h.formalityRange[1]) {
        errors.push({ entityType: 'hairstyle', entityId: h.id, field: 'formalityRange', issue: 'Min formality exceeds max formality' });
      }
    }

    // --- 3. Validate Beard Styles ---
    for (const b of BEARD_STYLES) {
      if (b.formalityRange[0] > b.formalityRange[1]) {
        errors.push({ entityType: 'beard_style', entityId: b.id, field: 'formalityRange', issue: 'Min formality exceeds max formality' });
      }
    }

    // --- 4. Validate Style Families ---
    for (const s of STYLE_FAMILIES) {
      for (const axis of NUMERIC_STYLE_AXES) {
        const val = s.styleVector[axis];
        if (typeof val !== 'number' || val < 1 || val > 5) {
          errors.push({ entityType: 'style_family', entityId: s.id, field: axis, issue: `Style vector axis ${axis} value ${val} outside [1, 5]` });
        }
      }
    }

    // --- 5. Validate Occasions ---
    for (const o of OCCASIONS) {
      if (o.allowableFormalityRange[0] > o.allowableFormalityRange[1]) {
        errors.push({ entityType: 'occasion', entityId: o.id, field: 'allowableFormalityRange', issue: 'Min formality exceeds max formality' });
      }
      if (o.defaultFormality < o.allowableFormalityRange[0] || o.defaultFormality > o.allowableFormalityRange[1]) {
        errors.push({ entityType: 'occasion', entityId: o.id, field: 'defaultFormality', issue: 'Default formality outside allowable bounds' });
      }
    }

    return {
      isValid: errors.length === 0,
      totalGarments: GARMENTS.length,
      totalHairstyles: HAIRSTYLES.length,
      totalBeards: BEARD_STYLES.length,
      totalStyles: STYLE_FAMILIES.length,
      totalOccasions: OCCASIONS.length,
      errors,
      warnings,
    };
  }
}
