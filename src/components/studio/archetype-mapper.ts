import { Garment } from '../../core/domain';

export type ArchetypeId =
  | 'tee'
  | 'shirt'
  | 'polo'
  | 'knit'
  | 'hoodie'
  | 'trousers-wide'
  | 'trousers-straight'
  | 'trousers-slim'
  | 'jeans'
  | 'cargo'
  | 'shorts'
  | 'skirt'
  | 'dress'
  | 'evening-gown'
  | 'jumpsuit'
  | 'blazer'
  | 'coat'
  | 'jacket'
  | 'boots'
  | 'loafers'
  | 'oxfords-derbies'
  | 'sneakers'
  | 'sandals'
  | 'heels'
  | 'bag'
  | 'eyewear'
  | 'belt'
  | 'scarf'
  | 'jewelry'
  | 'small-accessory';

export interface GarmentVisualBlock {
  archetype: ArchetypeId;
  presetMaterial?: 'wool' | 'silk' | 'leather' | 'linen' | 'cotton' | 'technical' | 'denim';
  sleeveLength?: 'sleeveless' | 'short' | 'three-quarter' | 'long';
  neckline?: 'crew' | 'v-neck' | 'collar' | 'turtle' | 'scoop' | 'open';
  hemLength?: 'cropped' | 'regular' | 'midi' | 'maxi' | 'floor';
  volume?: number;
}

export interface GarmentWithVisual extends Garment {
  visual?: GarmentVisualBlock;
}

/**
 * Maps any catalog garment to one of the parametric 3D archetypes based on
 * its category, subcategory, fit, and silhouette attributes.
 */
export function mapGarmentToArchetype(garment: GarmentWithVisual): ArchetypeId {
  // Respect explicit visual override if authored
  if (garment.visual?.archetype) {
    return garment.visual.archetype;
  }

  const cat = garment.category;
  const sub = (garment.subcategory || '').toLowerCase();
  const fit = garment.fit;
  const sil = (garment.silhouette || '').toLowerCase();

  if (cat === 'top') {
    if (sub.includes('tee') || sub.includes('tank') || sub.includes('camisole')) return 'tee';
    if (sub.includes('polo') || sub.includes('henley')) return 'polo';
    if (sub.includes('hoodie') || sub.includes('sweatshirt')) return 'hoodie';
    if (sub.includes('knit') || sub.includes('longsleeve')) return 'knit';
    if (sub.includes('shirt') || sub.includes('blouse') || sub.includes('tunic')) return 'shirt';
    return 'shirt';
  }

  if (cat === 'bottom') {
    if (sub.includes('skirt')) return 'skirt';
    if (sub.includes('shorts')) return 'shorts';
    if (sub.includes('jeans')) return 'jeans';
    if (sub.includes('cargo') || sub.includes('sweatpants')) return 'cargo';
    if (sub.includes('trousers') || sub.includes('pants') || sub.includes('chinos')) {
      if (sil.includes('wide') || fit === 'relaxed' || fit === 'oversized') return 'trousers-wide';
      if (fit === 'slim') return 'trousers-slim';
      return 'trousers-straight';
    }
    return 'trousers-straight';
  }

  if (cat === 'one-piece') {
    if (sub.includes('jumpsuit')) return 'jumpsuit';
    if (sub.includes('gown')) return 'evening-gown';
    if (sub.includes('dress')) return 'dress';
    return 'dress';
  }

  if (cat === 'outerwear') {
    if (sub.includes('blazer') || sub.includes('tuxedo')) return 'blazer';
    if (sub.includes('coat') || sub.includes('trench')) return 'coat';
    if (sub.includes('jacket')) return 'jacket';
    return 'jacket';
  }

  if (cat === 'footwear') {
    if (sub.includes('boot')) return 'boots';
    if (sub.includes('loafer') || sub.includes('mule') || sub.includes('clog')) return 'loafers';
    if (sub.includes('oxford') || sub.includes('derb') || sub.includes('monk') || sub.includes('dress-shoe')) {
      return 'oxfords-derbies';
    }
    if (sub.includes('sneaker')) return 'sneakers';
    if (sub.includes('sandal')) return 'sandals';
    if (sub.includes('heel') || sub.includes('ballet-flat')) return 'heels';
    return 'loafers';
  }

  if (cat === 'accessory') {
    if (sub.includes('bag')) return 'bag';
    if (sub.includes('eyewear') || sub.includes('sunglasses')) return 'eyewear';
    if (sub.includes('belt')) return 'belt';
    if (sub.includes('scarf')) return 'scarf';
    if (sub.includes('jewel') || sub.includes('watch')) return 'jewelry';
    if (
      sub.includes('pocket-square') ||
      sub.includes('hat') ||
      sub.includes('gloves') ||
      sub.includes('hosiery')
    ) {
      return 'small-accessory';
    }
    return 'small-accessory';
  }

  return 'shirt';
}
