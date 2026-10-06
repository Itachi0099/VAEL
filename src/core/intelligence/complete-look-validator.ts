import { Outfit, Garment } from '../domain/fashion';

export interface LookCompositionValidation {
  isComplete: boolean;
  hasFoundation: boolean; // Top + Bottom OR One-piece
  hasFootwear: boolean;
  accessoryCount: number;
  outerwearCount: number;
  missingComponents: string[];
  notes: string[];
}

/**
 * Complete Look Composition Validator (R1.14)
 *
 * Enforces editorial integrity across complete looks:
 * 1. Must contain foundation: (Top + Bottom) OR One-piece (dress/jumpsuit/gown).
 * 2. Must contain exactly 1 Footwear anchor.
 * 3. Optional Outerwear: 0 or 1 (at most 2 for cold-weather layering).
 * 4. Curated Accessories: 0 to 3 max (prevents clutter / ornamental explosion).
 */
export class CompleteLookValidator {
  static validate(outfit: Outfit): LookCompositionValidation {
    const garments = outfit.items.map((i) => i.garment);
    const missingComponents: string[] = [];
    const notes: string[] = [];

    const hasTop = garments.some((g) => g.category === 'top');
    const hasBottom = garments.some((g) => g.category === 'bottom');
    const hasOnePiece = garments.some((g) => g.category === 'one-piece');
    const hasFootwear = garments.some((g) => g.category === 'footwear');
    const accessories = garments.filter((g) => g.category === 'accessory');
    const outerwear = garments.filter((g) => g.category === 'outerwear');

    const hasFoundation = (hasTop && hasBottom) || hasOnePiece;

    if (!hasFoundation) {
      if (!hasTop && !hasOnePiece) missingComponents.push('Upper body foundation (top or one-piece)');
      if (!hasBottom && !hasOnePiece) missingComponents.push('Lower body foundation (bottom or one-piece)');
    }

    if (!hasFootwear) {
      missingComponents.push('Footwear anchor');
    }

    if (accessories.length > 3) {
      notes.push(`Restraint advisory: ${accessories.length} accessories present; recommended maximum is 3 for editorial focus.`);
    }

    if (outerwear.length > 2) {
      notes.push(`Layering volume caution: ${outerwear.length} outerwear items stacked simultaneously.`);
    }

    if (hasFoundation && hasFootwear) {
      notes.push(
        hasOnePiece
          ? 'Complete monolithic look: singular one-piece foundation grounded with footwear anchor.'
          : 'Complete two-piece look: top and bottom foundation balanced and anchored with footwear.'
      );
    }

    return {
      isComplete: hasFoundation && hasFootwear,
      hasFoundation,
      hasFootwear,
      accessoryCount: accessories.length,
      outerwearCount: outerwear.length,
      missingComponents,
      notes,
    };
  }
}
