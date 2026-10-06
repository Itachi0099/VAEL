# VAEL Fashion Knowledge System & Architecture

> "Tell VAEL who you are and where you're going. It gives you three complete looks — outfit, hair and grooming — with honest reasons, using what you already own where it can."

---

## 1. Product Identity & Core Principles

VAEL is an autonomous personal styling artist. It is not an AI chatbot, not a generic fast-fashion recommendation directory, and not an unconstrained diffusion generator.

VAEL operates on foundational principles:
1. **USER > AI**: Explicit user inputs always take precedence over inferences or vision estimations.
2. **REASONING > GENERATION**: Clear architectural justifications, fabric physics, and color harmony over superficial visual generation.
3. **PERSONAL > GENERIC**: Tailored to individual taste vectors, proportions, and wardrobe inventory.
4. **OPEN > LOCKED**: Modular, extensible architecture allowing replacement of algorithms, data stores, and intelligence providers without rewriting domain models.
5. **HONEST UNCERTAINTY**: The engine explicitly admits when it lacks context (`NEED_MORE_INFO` / `EXPLORATORY`) rather than hallucinating overconfidence.
6. **NEUTRAL STYLING LANGUAGE**: Prohibits body-shaming or "flaw-fixing" terminology (*slimming, hide flaws, problem areas*). All advice uses neutral architectural terms (*balance, emphasize, proportion, structure, volume, contrast*).

---

## 2. Evidence Layer & Authority Hierarchy

VAEL enforces a strict multi-tiered evidence resolution hierarchy:

| Rank | Authority | Description |
|:---:|:---|:---|
| **5** | `USER_CONFIRMED` | Explicit user verification (e.g. "Yes, my hair is wavy") |
| **4** | `USER_ENTERED` | Direct manual inputs or quiz answers |
| **3** | `LEARNED_FEEDBACK`| Derived from repeated user feedback history |
| **2** | `VISION` | Multimodal visual perception / camera analysis |
| **1** | `DEFAULT` | System baseline assumptions |

> [!IMPORTANT]
> **Non-Negotiable Guardrail**: Vision signals (`rank 2`) can **NEVER** overwrite user-entered (`rank 4`) or user-confirmed (`rank 5`) attributes.

---

## 3. Style Axis System (11 Dimensions)

VAEL represents individual taste and garment aesthetic vectors across 11 formal dimensions. The first 10 are normalized numeric scales [1.0 to 5.0]:

1. **FORMALITY** (1: Lounge/Understated → 3: Smart Casual → 5: Black-Tie Formal)
2. **STRUCTURE** (1: Fluid/Draped → 3: Soft Canvassing → 5: Sharply Tailored)
3. **VOLUME** (1: Close/Fitted → 3: Regular → 5: Expansive/Oversized)
4. **COLOR INTENSITY** (1: Monochromatic/Neutral → 3: Muted Earth → 5: Saturated/Vibrant)
5. **CONTRAST** (1: Low/Tonal → 3: Balanced → 5: Stark Dark-Light Polarity)
6. **PATTERN** (1: Solid → 3: Textured Weaves → 5: Bold Graphic Prints)
7. **TEXTURE** (1: Smooth/Matte → 3: Balanced → 5: Deep Tactile/Heavy Bouclé/Tweed)
8. **ORNAMENTATION** (1: Austere/Minimal → 3: Tasteful Accents → 5: Ornate/Layered Jewelry)
9. **CLASSIC ↔ TREND** (1: Heritage Timeless → 3: Contemporary → 5: Avant-Garde Runway)
10. **UTILITY ↔ POLISH** (1: Rugged Workwear/Technical → 3: Balanced → 5: Immaculate Sartorial)
11. **GENDER-CODING DIRECTION** (`masculine` | `feminine` | `androgynous` | `unspecified`)

See full semantic specifications in [`STYLE_AXIS_DEFINITIONS.md`](file:///Users/manangulati/projects/VAEL/STYLE_AXIS_DEFINITIONS.md).

---

## 4. Fashion Knowledge Registry

The VAEL knowledge base contains fully structured, physics-validated fashion archetypes:

- **122 Garment Archetypes**:
  - Tops (38 archetypes): Boxy tees, open-collar knit polos, Guayaberas, linen Kurtas, silk band collared shirts, waffle thermals.
  - Bottoms (28 archetypes): Double-pleated wide trousers, raw selvedge denim, Gurkha trousers, Khadi lounge pants, seersucker trousers.
  - Outerwear (24 archetypes): Deconstructed virgin wool blazers, Harris Tweed jackets, Mackintosh bonded coats, bespoke Matka silk bandhgala/sherwani jackets, M-65 field coats.
  - Footwear (18 archetypes): Chunky lug derbies, Horween shell cordovan loafers, Goodyear-welted service boots, Gore-Tex trail runners, split-toe Tabi boots, jute espadrilles.
  - Accessories (14 archetypes): Brushed sterling silver signet rings, architectural leather totes, Scottish lambswool scarves, Fidlock crossbody bags.
- **30 Hair Archetypes**: Textured French crops, fluid middle-part curtains, curly high top tapers, architectural wolf cuts, protective locs and cornrows, blunt bobs, and classic tapered side parts.
- **20 Grooming & Beard Archetypes**: Clean shaven, designer 3-day stubble, short boxed beards, Balbo, ducktail, anchor beards, with explicit hair density feasibility checks.
- **10 Core Style Archetypes**: Minimal, Korean Minimal, Smart Casual, Old Money, Streetwear, Workwear, Techwear, Dark Academia, Vintage, Experimental.
- **12 Contextual Occasion Specifications**: Job Interview, Modern Office, Everyday Casual, Fine Dining, Evening Date, Night Out, Social Party, University Campus, Wedding Guest, Cultural/Traditional Ceremony, Airport Travel, and Custom Curated.

---

## 5. Three-Step Recommendation Engine

[`VaelStylingEngine`](file:///Users/manangulati/projects/VAEL/src/core/intelligence/engine.ts) executes an unambiguous 3-step recommendation pipeline:

```
[Candidate Pool]
       ↓
STEP 1: HARD FILTERS / VETO
  • Modesty check (high-coverage vetoes low-coverage/revealing pieces)
  • Climate fabric physics (heavy wool/down vetoed in heat; unlayered linen vetoed in cold)
  • Disliked colors, fits, and style families strictly excluded
  • Occasion restricted categories enforced
       ↓
STEP 2: SOFT SCORING & COMPATIBILITY
  • 10D Style Vector Euclidean distance & affinity
  • Silhouette proportion balance & style tension detection
  • Color theory harmony & user undertone calibration
  • Occasion formality calibration
  • Weather thermal comfort
  • Wardrobe inventory prioritization
       ↓
STEP 3: DIVERSE TOP 3 SELECTION
  • SAFE: High familiar certainty, wardrobe-first, timeless staples
  • BEST MATCH: Optimal composite convergence of style vector & context
  • STRETCH: Curated directional exploration pushing volume, texture, or adjacent aesthetic
```

---

## 6. Honest Confidence States

Every recommendation bundle communicates transparency through one of four confidence states:
- `STRONG`: Supported by verified user preferences, confirmed weather, and visual analysis.
- `GOOD`: Solid alignment with occasion guidelines; suggests optional fine-tuning (e.g. confirm temperature).
- `EXPLORATORY`: Directional proposal using baseline principles; requests key inputs.
- `NEED_MORE_INFO`: Critical context or taste signals are missing; provides a concrete next step.
