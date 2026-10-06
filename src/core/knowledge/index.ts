import { STYLE_FAMILIES } from './styles.data';
import { HAIRSTYLES } from './hairstyles.data';
import { BEARD_STYLES } from './beards.data';
import { OCCASIONS } from './occasions.data';
import { GARMENTS } from './garments.data';
import { StyleFamily } from '../domain/style';
import { HairStyle, BeardStyle } from '../domain/grooming';
import { Occasion } from '../domain/context';
import { Garment } from '../domain/fashion';

export * from './color-theory';
export * from './silhouettes';
export * from './climate';
export * from './styles.data';
export * from './hairstyles.data';
export * from './beards.data';
export * from './occasions.data';
export * from './garments.data';
export * from './validator';

export class FashionKnowledgeBase {
  private styles = new Map<string, StyleFamily>();
  private hairstyles = new Map<string, HairStyle>();
  private beards = new Map<string, BeardStyle>();
  private occasions = new Map<string, Occasion>();
  private garments = new Map<string, Garment>();

  constructor() {
    STYLE_FAMILIES.forEach((s) => this.styles.set(s.slug, s));
    HAIRSTYLES.forEach((h) => this.hairstyles.set(h.slug, h));
    BEARD_STYLES.forEach((b) => this.beards.set(b.slug, b));
    OCCASIONS.forEach((o) => this.occasions.set(o.slug, o));
    GARMENTS.forEach((g) => this.garments.set(g.slug, g));
  }

  // --- STYLES ---
  getAllStyles(): StyleFamily[] {
    return Array.from(this.styles.values());
  }

  getStyleBySlug(slug: string): StyleFamily | undefined {
    return this.styles.get(slug);
  }

  // --- HAIRSTYLES ---
  getAllHairstyles(): HairStyle[] {
    return Array.from(this.hairstyles.values());
  }

  getHairstyleBySlug(slug: string): HairStyle | undefined {
    return this.hairstyles.get(slug);
  }

  // --- BEARD STYLES ---
  getAllBeards(): BeardStyle[] {
    return Array.from(this.beards.values());
  }

  getBeardBySlug(slug: string): BeardStyle | undefined {
    return this.beards.get(slug);
  }

  // --- OCCASIONS ---
  getAllOccasions(): Occasion[] {
    return Array.from(this.occasions.values());
  }

  getOccasionBySlug(slug: string): Occasion | undefined {
    if (this.occasions.has(slug)) return this.occasions.get(slug);
    // Legacy / shorthand slug aliases
    const aliases: Record<string, string> = {
      'interview': 'job-interview',
      'casual-day': 'casual',
      'wedding': 'wedding-guest',
      'college': 'university-college',
    };
    const targetSlug = aliases[slug];
    if (targetSlug && this.occasions.has(targetSlug)) {
      return this.occasions.get(targetSlug);
    }
    return undefined;
  }

  // --- GARMENTS ---
  getAllGarments(): Garment[] {
    return Array.from(this.garments.values());
  }

  getGarmentBySlug(slug: string): Garment | undefined {
    return this.garments.get(slug);
  }

  getGarmentById(id: string): Garment | undefined {
    return Array.from(this.garments.values()).find((g) => g.id === id);
  }

  getGarmentsByCategory(category: Garment['category']): Garment[] {
    return Array.from(this.garments.values()).filter((g) => g.category === category);
  }
}

// Global singleton instance for knowledge queries
export const knowledgeBase = new FashionKnowledgeBase();
