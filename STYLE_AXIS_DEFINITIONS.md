# VAEL Style Axis Definitions

VAEL represents personal style as an 11-dimensional coordinate space rather than a collection of rigid, mutually exclusive labels.

A person is never just *"Streetwear"* or *"Smart Casual"*. They exist as a vector across these continuous aesthetic dimensions.

---

## The 11 Dimensions

| # | Axis Name | Scale | Low (1) | Mid (3) | High (5) |
|---|---|---|---|---|---|
| 1 | **Formality** | 1 – 5 | Lounge / Street Casual | Smart Casual / Elevated Day | Ceremonial / Black Tie |
| 2 | **Structure** | 1 – 5 | Fluid / Dropped / Draped | Soft Tailored / Natural Shoulder | Sharply Canvassed / Architectural |
| 3 | **Volume** | 1 – 5 | Close / Tailored-Fitted | Balanced / Straight Cadence | Oversized / Expansive Drape |
| 4 | **Color Intensity** | 1 – 5 | Monochromatic / Neutral Base | Earth Tones / Subdued Accents | Vibrant / High Saturation |
| 5 | **Contrast** | 1 – 5 | Tonal / Low Contrast | Balanced Contrast | Stark High Contrast |
| 6 | **Pattern** | 1 – 5 | Pure Solid | Textured Weave / Micro-Pattern | Bold Graphic / Statement Print |
| 7 | **Texture** | 1 – 5 | Smooth / Flat / Matte | Moderate Tactile Interest | Rich / Heavy / Raw Tactile |
| 8 | **Ornamentation** | 1 – 5 | Austere / Pure Utilitarian | Tasteful Minimal Accents | Ornate / Statement Layered |
| 9 | **Classic ↔ Trend** | 1 – 5 | Heritage / Timeless Classic | Contemporary Modern | Avant-Garde / Trend-Forward |
| 10 | **Utility ↔ Polish** | 1 – 5 | Rugged / Functional Utility | Elevated Casual Balance | Sartorial Polish / Immaculate |
| 11 | **Gender Direction** | Enum | `'masculine'`, `'feminine'`, `'androgynous'`, or `'unspecified'` (User-Controlled) |

---

## Detailed Axis Breakdowns

### 1. Formality
*Social context and ceremonial gravity.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Lounge, skate, technical utility, gym-adjacent, graphic casual. Complete freedom from institutional dress codes.
- **3 (Balanced)**: Smart casual, unstructured blazers, knit polos, pleated chinos, clean leather low-tops or loafers. Moves seamlessly from office to evening wine bar.
- **5 (High Expression)**: Black tie, white tie, morning dress, tuxedo with satin lapels, high gala formality.
- **Higher values imply**: Tighter dress etiquette, canvassed fabrication, formal shoes, tie/cufflink expectations.
- **Lower values imply**: High mobility, soft stretch fabrics, relaxed collars, unfastened silhouettes.
- **Examples**:
  - `Formality 1`: Oversized heavyweight graphic tee, raw canvas carpenter pants, canvas skate sneakers.
  - `Formality 3`: Fine merino knit polo, charcoal wool trousers, leather penny loafers.
  - `Formality 5`: Midnight navy satin peak-lapel dinner suit, marcella front shirt, patent wholecuts.

---

### 2. Structure
*The rigidity, internal architecture, and drape geometry of garments.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Fluid drape, rayon shirts, dropped soft shoulders, drawstring linen, unlined cardigans. Garment yields entirely to body movement.
- **3 (Balanced)**: Soft tailoring, patch-pocket jackets with light chest canvas, structured cotton chinos, denim with natural drape.
- **5 (High Expression)**: Heavily canvassed suits, structured roped shoulders, razor-pressed trouser creases, trench coats with heavy storm flaps, architectural outerwear.
- **Higher values imply**: Sharp vertical lines, physical presence, visual authority, geometric silhouettes.
- **Lower values imply**: Nonchalance, ease, organic lines, sensory comfort.
- **Examples**:
  - `Structure 1`: Silk-viscose camp collar shirt, fluid tencel wide-leg pants.
  - `Structure 3`: Deconstructed unstructured wool blazer, relaxed oxford cloth shirt.
  - `Structure 5`: Double-breasted melton wool greatcoat with roped shoulders.

---

### 3. Volume
*Spatial footprint, ease allowance, and proportional width.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Close-fitting, tailored slim, contouring close to the limbs with minimal ease allowance.
- **3 (Balanced)**: Regular straight fit, standard collar spacing, clean break or no-break hem. Classic mid-century proportions.
- **5 (High Expression)**: Wide-leg puddle hem trousers, dropped-shoulder boxy cuts, cocoon overcoats, volumetric sleeves.
- **Higher values imply**: Modern silhouette impact, contemporary streetwear or Seoul minimal aesthetics, bold geometric proportions.
- **Lower values imply**: Classic athletic or slim European tailoring, compact visual footprint.
- **Examples**:
  - `Volume 1`: Slim merino turtleneck, tailored flat-front cigarette trousers.
  - `Volume 3`: Regular-fit oxford shirt, straight-leg selvedge denim.
  - `Volume 5`: 500gsm oversized dropped-shoulder hoodie, double-pleated wide-leg trousers breaking over chunky derbies.

---

### 4. Color Intensity
*Vibrancy and saturation level of the palette.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Strictly achromatic or neutral base: black, chalk white, charcoal, slate, raw cream.
- **3 (Balanced)**: Earth tones and grounded hues: olive drab, camel, warm walnut, faded indigo, dusty sage.
- **5 (High Expression)**: High-saturation focal shades: cobalt blue, crimson, solar yellow, electric orange, bright pastels.
- **Higher values imply**: High visual energy, expressive playfulness, attention focal points.
- **Lower values imply**: Monochromatic discipline, gallery minimalist restraint, effortless cross-item coordination.
- **Examples**:
  - `Color Intensity 1`: Black mock neck, charcoal trousers, matte black derbies.
  - `Color Intensity 3`: Camel overcoat, olive knit polo, navy trousers.
  - `Color Intensity 5`: Cobalt blue brushed mohair sweater, off-white corduroys.

---

### 5. Contrast
*Value separation between outfit elements.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Tonal and monochromatic depth. Dark grey on black, ecru on cream, navy on washed blue. Soft seamless transitions.
- **3 (Balanced)**: Moderate value contrast. Mid-grey trousers with dark navy jacket and light blue shirt.
- **5 (High Expression)**: Stark polarity. Jet black outerwear over crisp white shirt; dark trousers with light footwear.
- **Higher values imply**: Crisp separation of layers, strong silhouette edges, high graphic presence.
- **Lower values imply**: Flowing uninterrupted visual lines, elongated perceived height, understated elegance.
- **Examples**:
  - `Contrast 1`: Charcoal cashmere sweater, slate wool trousers, black boots.
  - `Contrast 3`: Navy overshirt, heather grey tee, olive chinos.
  - `Contrast 5`: Pitch black deconstructed blazer, stark white boxy tee, pitch black pleated trousers.

---

### 6. Pattern
*Frequency, scale, and expressiveness of surface ornamentation.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Solid surfaces throughout. Depth comes entirely from texture and weave.
- **3 (Balanced)**: Micro-patterns, herringbone, pinstripes, subtle houndstooth, melange knits, tonal shadow plaids.
- **5 (High Expression)**: Broad madras, bold tartans, animal prints, graphic illustrations, loud horizontal block stripes.
- **Higher values imply**: Focal garment dominance, narrative storytelling, vintage/retro or punk resonance.
- **Lower values imply**: Architectural purity, timeless longevity, low visual noise.
- **Examples**:
  - `Pattern 1`: Solid white heavyweight tee, solid raw denim, solid leather boots.
  - `Pattern 3`: Fine charcoal pinstripe wool slacks, solid knit crewneck.
  - `Pattern 5`: Bold floral camp-collar silk shirt, vintage graphic souvenir jacket.

---

### 7. Texture
*Tactile dimensionality and surface grain.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Flat, smooth, matte: high-thread-count poplin, mercerized cotton, smooth gabardine, flat leather.
- **3 (Balanced)**: Moderate hand: brushed oxford cloth, twill chinos, dry wool, unwashed denim.
- **5 (High Expression)**: Heavy tactile drama: boiled wool, wide-wale corduroy, hairy mohair, slub canvas, shearling, chunky fisherman rib knit.
- **Higher values imply**: Depth under ambient light, cozy autumnal/winter luxury, organic tactile intimacy.
- **Lower values imply**: Crisp summertime lightness, razor-sharp formal hygiene, high technical sleekness.
- **Examples**:
  - `Texture 1`: Smooth cotton poplin button-down, lightweight wool slacks, polished calfskin derbies.
  - `Texture 3`: Oxford button-down, raw denim, suede chelsea boots.
  - `Texture 5`: Heavy cable-knit fisherman sweater, thick corduroy trousers, pebbled leather boots.

---

### 8. Ornamentation
*Density of non-structural hardware, jewelry, and styling embellishments.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Austere, utilitarian. Hidden plackets, zero visible logos, minimal hardware, unadorned wrists.
- **3 (Balanced)**: Tasteful restraint. A single signet ring, a clean mechanical timepiece, subtle belt buckle.
- **5 (High Expression)**: Ornate statement. Layered chains, multiple rings, visible external harness webbing, lapel pins, decorative embroidery.
- **Higher values imply**: Individualistic flair, subcultural identification (goth, grunge, maximalism, high streetwear).
- **Lower values imply**: Quiet luxury, Bauhaus utility, zen minimalist restraint.
- **Examples**:
  - `Ornamentation 1`: Hidden-placket minimal coat, no jewelry, minimal leather sneakers.
  - `Ornamentation 3`: Brushed silver signet ring, vintage automatic watch with brown leather strap.
  - `Ornamentation 5`: Stacked Cuban link chains, dual statement rings, heavy silver belt buckle, embroidered souvenir jacket.

---

### 9. Classic ↔ Trend-Forward
*Temporal orientation: heritage longevity versus directional innovation.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Timeless heritage. Pieces that could have been worn in 1965, 1995, or 2025: trench coats, Oxford shirts, penny loafers, raw denim.
- **3 (Balanced)**: Contemporary modern. Timeless pieces cut in modern relaxed proportions.
- **5 (High Expression)**: Avant-garde / trend-forward. Asymmetric hems, deconstructed seams, extreme volume, innovative technical materials.
- **Higher values imply**: Runway literacy, subcultural novelty, fearless aesthetic experimentation.
- **Lower values imply**: Investment durability, universal social legibility, multi-decade wardrobe utility.
- **Examples**:
  - `Classic 1`: Baracuta G9 Harrington jacket, Shetland wool crewneck, selvedge denim, penny loafers.
  - `Classic 3`: Relaxed deconstructed blazer, boxy tee, pleated trousers, clean minimal sneakers.
  - `Classic 5`: Asymmetric wrap trench coat, warped-seam split hem trousers, architectural platform shoes.

---

### 10. Utility ↔ Polish
*The tension between rugged workwear function and immaculate sartorial refinement.*

- **Scale**: 1 to 5
- **1 (Low Expression)**: Rugged utility. Double-knee canvas, triple stitching, oiled leather, water-repellent shell membranes, heavy lug soles.
- **3 (Balanced)**: Elevated casual. Chore jacket in refined wool, dark raw denim without distressing, leather boots with clean silhouettes.
- **5 (High Expression)**: Sartorial polish. Pristine canvassed tailoring, pressed razor creases, wholecut calfskin oxfords, pocket square.
- **Higher values imply**: Executive authority, salon refinement, immaculate ceremonial polish.
- **Lower values imply**: Blue-collar heritage, outdoor resilience, authentic patina, wear-and-tear celebration.
- **Examples**:
  - `Utility 1`: 12oz duck canvas chore coat, double-knee carpenter trousers, steel-toe service boots.
  - `Utility 3`: Wool overshirt, tapered dark selvedge denim, suede chelsea boots.
  - `Utility 5`: Bespoke two-piece charcoal worsted suit, white poplin shirt, mirror-shined oxfords.

---

### 11. User-Set Gender-Coding Direction
*User-determined styling emphasis.*

- **Values**:
  - `'androgynous'`: Neutral, architectural, and silhouette-focused cuts that transcend traditional gender conventions.
  - `'masculine'`: Emphasizes traditional masculine tailoring geometry (broad shoulder emphasis, straight linear cadence).
  - `'feminine'`: Emphasizes traditional feminine styling geometry (waist definition, fluid drapery, varied necklines).
  - `'unspecified'`: Default. Recommendations operate purely on geometric fit, proportion, and aesthetic harmony without gender-based assumptions.

VAEL defaults to `'unspecified'` or `'androgynous'` and only applies gender-coded cuts when explicitly directed by the user.
