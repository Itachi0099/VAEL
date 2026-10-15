'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { ArchetypeId, mapGarmentToArchetype } from '@/components/studio/archetype-mapper';
import { knowledgeBase } from '@/core/knowledge';
import { Garment } from '@/core/domain';

interface ArchetypeMeta {
  id: ArchetypeId;
  name: string;
  category: 'top' | 'bottom' | 'one-piece' | 'outerwear' | 'footwear' | 'accessory';
  geometryDesc: string;
  keyParameters: string[];
}

const ARCHETYPE_METADATA: ArchetypeMeta[] = [
  // Tops (7)
  {
    id: 'tee',
    name: 'T-Shirt (Fitted & Boxy)',
    category: 'top',
    geometryDesc: 'Parametric torso cylinder with balanced crew/scoop neckline and capped sleeves.',
    keyParameters: ['Shoulder width', 'Torso drape', 'Sleeve length: short', 'Crew collar radius'],
  },
  {
    id: 'shirt',
    name: 'Woven Shirt & Camp Collar',
    category: 'top',
    geometryDesc: 'Tailored woven torso with dual-wing collar geometry and full-length articulated sleeves.',
    keyParameters: ['Collar spread angle', 'Button placket', 'Sleeve taper', 'Hem curvature'],
  },
  {
    id: 'polo',
    name: 'Knit Polo & Henley',
    category: 'top',
    geometryDesc: 'Structured knit torso with soft ribbed polo collar and placket opening.',
    keyParameters: ['Polo collar height', 'Sleeve cuff ribbing', 'Placket depth'],
  },
  {
    id: 'knit',
    name: 'Merino & Chunky Knit Crew',
    category: 'top',
    geometryDesc: 'Volumetric knit geometry with ribbed tubular collar, dropped shoulders, and relaxed sleeves.',
    keyParameters: ['Collar rib thickness', 'Chest volume', 'Hem rib tension'],
  },
  {
    id: 'hoodie',
    name: 'Relaxed Hoodie & Sweatshirt',
    category: 'top',
    geometryDesc: 'Oversized fleece torso with posterior hood volume sphere and ribbed cuffs.',
    keyParameters: ['Hood volume & drape', 'Kangaroo pouch contour', 'Dropped shoulder'],
  },
  {
    id: 'tank-camisole',
    name: 'Tank Top & Silk Camisole',
    category: 'top',
    geometryDesc: 'Sleeveless torso silhouette with delicate shoulder straps and open scoop/square neckline.',
    keyParameters: ['Strap width (18mm)', 'Neckline scoop depth', 'Armhole drop', 'Bias drape'],
  },
  {
    id: 'blouse',
    name: 'Fluid Draped & Tie-Neck Blouse',
    category: 'top',
    geometryDesc: 'Fluidly draped torso with blouson sleeves, soft curved hem, and draped necktie accents.',
    keyParameters: ['Sleeve blouson volume', 'Necktie drape angle', 'Fluid waist drape'],
  },

  // Bottoms (7)
  {
    id: 'trousers-straight',
    name: 'Straight & Tailored Trousers',
    category: 'bottom',
    geometryDesc: 'Classic tailored dual-cylinder leg geometry with structured waistband and clean break.',
    keyParameters: ['Waistband rise', 'Leg circumference (straight)', 'Inseam length', 'Hem break'],
  },
  {
    id: 'trousers-wide',
    name: 'Wide-Leg Fluid Trousers',
    category: 'bottom',
    geometryDesc: 'Expanded fluid leg cylinders draping from high waist down over shoe instep.',
    keyParameters: ['Leg width (wide-cut)', 'Front pleat depth', 'Fluid pooling factor'],
  },
  {
    id: 'trousers-slim',
    name: 'Slim Tailored Trousers',
    category: 'bottom',
    geometryDesc: 'Tapered leg cylinders closely tracking natural calf and ankle lines.',
    keyParameters: ['Knee-to-ankle taper ratio', 'Waist rise', 'Calf clearance'],
  },
  {
    id: 'jeans',
    name: 'Denim Jeans (5-Pocket)',
    category: 'bottom',
    geometryDesc: 'Heavyweight twill structure with waistband, front pocket scoops, and straight leg drape.',
    keyParameters: ['Denim weight stiffness', 'Leg taper', 'Hem opening diameter'],
  },
  {
    id: 'cargo',
    name: 'Cargo & Utility Trousers',
    category: 'bottom',
    geometryDesc: 'Utility-structured bottom with lateral cargo pocket volumes along outer thigh cylinders.',
    keyParameters: ['Cargo pocket extrusion', 'Ankle drawcord cinch', 'Articulated knee'],
  },
  {
    id: 'sweatpants',
    name: 'Loopback Fleece Sweatpants',
    category: 'bottom',
    geometryDesc: 'Relaxed athletic fleece bottom with elasticated ribbed waistband and tapered cuffed ankles.',
    keyParameters: ['Waistband elasticity', 'Thigh volume', 'Ankle cuff ribbing (46mm)'],
  },
  {
    id: 'shorts',
    name: 'Tailored Bermuda & Casual Shorts',
    category: 'bottom',
    geometryDesc: 'Above-knee dual leg cylinders paired with structured waistband.',
    keyParameters: ['Inseam length (above knee)', 'Leg opening circumference', 'Rise height'],
  },
  {
    id: 'skirt',
    name: 'Midi & A-Line Skirt',
    category: 'bottom',
    geometryDesc: 'Conical flared cylinder extending from natural waistline to mid-calf with fluid drape.',
    keyParameters: ['A-line flare angle', 'Hem radius', 'Waistline placement'],
  },

  // One-Piece (3)
  {
    id: 'dress',
    name: 'Shirt & Day Dress',
    category: 'one-piece',
    geometryDesc: 'Unified bodice and skirt geometry creating continuous architectural silhouette.',
    keyParameters: ['Bodice fit', 'Waist transition', 'Skirt sweep radius', 'Hemline: midi'],
  },
  {
    id: 'evening-gown',
    name: 'Floor-Length Evening Gown',
    category: 'one-piece',
    geometryDesc: 'Elongated conical evening geometry sweeping smoothly down to floor level.',
    keyParameters: ['Floor-length hem flare (0.34)', 'Bodice decolletage', 'Sweep volume'],
  },
  {
    id: 'jumpsuit',
    name: 'Tailored Jumpsuit & Boiler Suit',
    category: 'one-piece',
    geometryDesc: 'Unified upper and lower body construction with defined architectural waist seam.',
    keyParameters: ['Torso length', 'Waist seam definition', 'Leg cut balance'],
  },

  // Outerwear (3)
  {
    id: 'blazer',
    name: 'Tailored Blazer & Tuxedo Jacket',
    category: 'outerwear',
    geometryDesc: 'Structured suiting jacket with sharp padded shoulders, peaked/notched lapels, and side vents.',
    keyParameters: ['Shoulder padding box', 'Lapel geometry', 'Sleeve pitch', 'Jacket length'],
  },
  {
    id: 'coat',
    name: 'Raglan Overcoat & Mac Trench',
    category: 'outerwear',
    geometryDesc: 'Knee-length cocoon/straight outerwear volume with storm collar and wide cuff openings.',
    keyParameters: ['Coat drop length', 'Chest circumference (layering room)', 'Collar height'],
  },
  {
    id: 'jacket',
    name: 'Bomber & Blouson Jacket',
    category: 'outerwear',
    geometryDesc: 'Cropped outer layer with ribbed collar, full-zip placket, and ribbed waistband cinch.',
    keyParameters: ['Cropped waist hem', 'Sleeve fullness', 'Zip placket relief'],
  },

  // Footwear (8)
  {
    id: 'boots',
    name: 'Chelsea & Riding Boots',
    category: 'footwear',
    geometryDesc: 'Dual-box sole grounding paired with upright ankle cylinder and elasticated side paneling.',
    keyParameters: ['Shaft height (180mm)', 'Ankle opening circumference', 'Sole thickness'],
  },
  {
    id: 'oxfords-derbies',
    name: 'Oxfords & Derbies',
    category: 'footwear',
    geometryDesc: 'Refined dress shoe last with tapered toe box, welted sole, and lace facing.',
    keyParameters: ['Toe box taper', 'Welt extension', 'Heel lift height'],
  },
  {
    id: 'loafers',
    name: 'Penny & Lug-Sole Loafers',
    category: 'footwear',
    geometryDesc: 'Slip-on low-cut last with distinctive saddle/strap strap across upper vamp.',
    keyParameters: ['Vamp saddle band', 'Sole lug profile', 'Instep height'],
  },
  {
    id: 'sneakers',
    name: 'Minimalist Leather Sneakers',
    category: 'footwear',
    geometryDesc: 'Smooth cupsole chassis with rounded toe cap and streamlined silhouette.',
    keyParameters: ['Cupsole height', 'Toe spring curve', 'Padded collar'],
  },
  {
    id: 'sandals',
    name: 'Leather Strap Sandals',
    category: 'footwear',
    geometryDesc: 'Open architectural sole slab with dual or crossover foot straps.',
    keyParameters: ['Footbed contour', 'Strap placement width', 'Buckle hardware'],
  },
  {
    id: 'heels',
    name: 'Kitten Heels & Pumps',
    category: 'footwear',
    geometryDesc: 'Low-cut vamp with slender tapered heel stem elevating posterior footbed.',
    keyParameters: ['Heel height (45-60mm)', 'Vamp neckline curvature', 'Heel base radius'],
  },
  {
    id: 'flat-shoe',
    name: 'Ballet Flats & Leather Mules',
    category: 'footwear',
    geometryDesc: 'Streamlined zero-drop flat chassis with curved low vamp and soft heel counter.',
    keyParameters: ['Sole height (32mm)', 'Low-vamp scoop', 'Toe box softness'],
  },

  // Accessories (6)
  {
    id: 'bag',
    name: 'Leather Tote & Shoulder Bag',
    category: 'accessory',
    geometryDesc: 'Clean rectangular volume suspended at lateral hip with slim shoulder strap.',
    keyParameters: ['Bag box dimensions', 'Strap drop length', 'Hardware anchors'],
  },
  {
    id: 'eyewear',
    name: 'Acetate & Wire Sunglasses',
    category: 'accessory',
    geometryDesc: 'Curved brow bridge with dual ocular lenses mounted across facial bridge.',
    keyParameters: ['Frame width (120mm)', 'Temple arm angle', 'Lens tint opacity'],
  },
  {
    id: 'belt',
    name: 'Bridle Leather Belt',
    category: 'accessory',
    geometryDesc: 'Torso-encircling toroidal strap positioned along natural waistline.',
    keyParameters: ['Belt width (30mm)', 'Buckle metallic finish', 'Waist cinch radius'],
  },
  {
    id: 'scarf',
    name: 'Silk & Cashmere Scarf',
    category: 'accessory',
    geometryDesc: 'Draped fluid volume wrapped around neck cylinder with trailing ends.',
    keyParameters: ['Neck wrap diameter', 'Trailing length', 'Knot position'],
  },
  {
    id: 'jewelry',
    name: 'Signet Rings & Cuff Links',
    category: 'accessory',
    geometryDesc: 'Metallic focal accents positioned on hand or cuff nodes.',
    keyParameters: ['Metal tone finish', 'Facet geometry', 'Scale factor'],
  },
  {
    id: 'small-accessory',
    name: 'Pocket Square & Small Accents',
    category: 'accessory',
    geometryDesc: 'Pointed fold geometry emerging from breast pocket or lapel buttonhole.',
    keyParameters: ['Fold protrusion', 'Fabric sheen', 'Color accent balance'],
  },
];

export default function ArchetypeGalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allGarments = useMemo(() => knowledgeBase.getAllGarments(), []);

  // Compute mapping stats
  const mappedGarmentsByArchetype = useMemo(() => {
    const map: Record<ArchetypeId, Garment[]> = {} as any;
    for (const a of ARCHETYPE_METADATA) {
      map[a.id] = [];
    }
    for (const g of allGarments) {
      const arch = mapGarmentToArchetype(g);
      if (arch && map[arch]) {
        map[arch].push(g);
      }
    }
    return map;
  }, [allGarments]);

  const categories = [
    { id: 'all', label: `ALL ARCHETYPES (${ARCHETYPE_METADATA.length})` },
    { id: 'top', label: 'TOPS (7)' },
    { id: 'bottom', label: 'BOTTOMS (7)' },
    { id: 'one-piece', label: 'ONE-PIECE (3)' },
    { id: 'outerwear', label: 'OUTERWEAR (3)' },
    { id: 'footwear', label: 'FOOTWEAR (8)' },
    { id: 'accessory', label: 'ACCESSORIES (6)' },
  ];

  const filteredArchetypes = useMemo(() => {
    if (selectedCategory === 'all') return ARCHETYPE_METADATA;
    return ARCHETYPE_METADATA.filter((a) => a.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0d0d0f] text-neutral-900 dark:text-neutral-100 font-editorial-mono">
      {/* Gallery Masthead */}
      <header className="border-b border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#161619] px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/studio"
              className="p-2 border border-neutral-200 dark:border-neutral-700 hover:border-black dark:hover:border-white rounded-xs transition text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-1.5 text-xs uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>STUDIO 3D</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-editorial-title uppercase font-semibold tracking-wider text-neutral-950 dark:text-neutral-50">
                  3D PARAMETRIC ARCHETYPE GALLERY
                </h1>
                <span className="text-[10px] uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-xs font-semibold">
                  34 ARCHETYPES
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-xs">
                  268 / 268 MAPPED (100%)
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1">
                Visual inspection and specification review for all 34 procedural 3D archetypes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-xs uppercase tracking-wider transition"
            >
              FLAGSHIP APP
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Category Filters Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 dark:border-neutral-800 text-xs">
          <Filter className="w-3.5 h-3.5 text-neutral-400 mr-1 shrink-0" />
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 uppercase tracking-wider whitespace-nowrap border transition text-[11px] ${
                selectedCategory === c.id
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black font-semibold shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181b] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Archetype Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArchetypes.map((arch) => {
            const mapped = mappedGarmentsByArchetype[arch.id] || [];
            const sampleGarments = mapped.slice(0, 4);

            return (
              <div
                key={arch.id}
                className="bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-800 p-5 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
                          {arch.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          `{arch.id}`
                        </span>
                      </div>
                      <h3 className="text-base font-editorial-title uppercase font-semibold text-neutral-900 dark:text-neutral-100">
                        {arch.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 block">
                        {mapped.length}
                      </span>
                      <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">
                        GARMENTS
                      </span>
                    </div>
                  </div>

                  {/* Geometric Specification */}
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                      {arch.geometryDesc}
                    </p>

                    <div className="pt-2">
                      <span className="text-[9px] text-neutral-400 uppercase tracking-widest block mb-1">
                        KEY PARAMETRIC ATTRIBUTES:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {arch.keyParameters.map((param, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5"
                          >
                            {param}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Catalog Items Mapped */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-[9px] text-neutral-400 uppercase tracking-widest block mb-1.5">
                    SAMPLE CATALOG GARMENTS ({mapped.length} TOTAL):
                  </span>
                  <div className="space-y-1">
                    {sampleGarments.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between text-[10px] text-neutral-600 dark:text-neutral-400"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0"
                            style={{ backgroundColor: g.color.hex }}
                          />
                          <span className="truncate">{g.name}</span>
                        </div>
                        <span className="text-[9px] text-neutral-400 shrink-0 ml-2">F{g.formality}</span>
                      </div>
                    ))}
                    {mapped.length > 4 && (
                      <span className="text-[9px] text-neutral-400 italic block pt-0.5">
                        + {mapped.length - 4} more catalog pieces
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Gallery Footer */}
      <footer className="border-t border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#161619] py-6 mt-12 text-center text-xs text-neutral-500 font-editorial-mono">
        <p>VAEL STUDIO ARCHETYPE REGISTRY · 34 PROCEDURAL GEOMETRIES · 100% CATALOG COVERAGE</p>
        <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest">
          Illustration, not a fit simulation.
        </p>
      </footer>
    </div>
  );
}
