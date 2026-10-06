# VAEL

> **Autonomous Personal Styling Artist & Intelligence Backbone**  
> *"Your style, interpreted."*

VAEL is not an AI chatbot, not a generic fashion recommendation website, and not merely an image generator. VAEL is designed as a personal styling artist—an intelligent system that learns how a user presents themselves, what they like and dislike, and what works harmoniously for them across grooming, hairstyles, silhouette architecture, and occasion-specific styling.

---

## Technical Foundations

VAEL is engineered around a strict separation of concerns:

```
UI (Minimal Editorial Shell)
  ↓
API (Typed Next.js Route Handlers)
  ↓
DOMAIN (Canonical Domain Entities)
  ↓
FASHION KNOWLEDGE (Taxonomies, Color Theory, Silhouettes)
  ↓
INTELLIGENCE (Deterministic Compatibility & Explainable Scoring)
  ↓
PERSISTENCE (Decoupled Repositories & In-Memory Store)
```

The system separates:
1. **Observed Visual Data** (objective facial proportions, hair texture, body silhouette geometry)
2. **Deterministic Fashion Knowledge** (color harmony, silhouette balance, occasion codes)
3. **User-Specific Preferences & Feedback** (explicit taste + learned weights)
4. **Pluggable Multimodal AI Models** (mock/Gemini/OpenAI vision adapters)

---

## Key Capabilities (Implemented)

- **Hairstyle Discovery (`generateHairRecommendations`)**: Scores cuts based on face geometry, hair texture/density compatibility, maintenance tolerance, occasion formality, and style aesthetic.
- **Beard & Grooming Architecture (`generateGroomingRecommendations`)**: Evaluates facial hair styles against jawline structure, follicular density feasibility, and grooming commitment.
- **Outfit Analysis (`analyzeOutfit`)**: Evaluates color coordination (tonal, monochromatic, accent), top-to-bottom silhouette volume balance, occasion restrictions, and weather fitness.
- **Outfit Elevation (`elevateOutfit`)**: Identifies weak links in a look and deterministically upgrades the outfit with architectural layers, appropriate footwear, and styling directives, reporting an explainable score delta.
- **Latent Style Discovery (`exploreStyle`)**: Evaluates alignment with style families (Korean Minimal, Techwear, Old Money, Dark Academia, etc.) based on underlying attributes (fit, palette, materials) rather than mere labels.
- **Preference Learning (`FeedbackService`)**: Adapts scoring weights dynamically based on user feedback (`LOVE`, `LIKE`, `NOT_FOR_ME`).
- **Vision Abstraction (`VisualAnalyzer`)**: Clean interface separating computer vision inference from the core styling engine. Currently running on a high-fidelity development mock adapter with transparent metadata.

---

## Project Structure

```
vael/
├── src/
│   ├── core/
│   │   ├── domain/               # Canonical domain models (User, Visual, Fashion, Grooming, Style, Context, Recs)
│   │   ├── knowledge/            # Structured taxonomies (12 styles, 18 hairstyles, 10 beards, 34 garments, 10 occasions)
│   │   │   ├── color-theory.ts   # Harmony evaluation (monochromatic, tonal, analogous)
│   │   │   └── silhouettes.ts    # Volumetric and proportion balance rules
│   │   ├── intelligence/         # Deterministic scoring & explainability engine
│   │   │   ├── scoring.ts
│   │   │   ├── hair-compatibility.ts
│   │   │   ├── grooming-compatibility.ts
│   │   │   ├── outfit-compatibility.ts
│   │   │   ├── style-compatibility.ts
│   │   │   └── preference-weighting.ts
│   │   ├── vision/               # Multimodal vision analyzer interface & mock adapter
│   │   ├── services/             # 6 Core business and styling recommendation services
│   │   └── persistence/          # Repository interfaces & pre-seeded in-memory store
│   └── app/                      # Next.js App Router (14 REST endpoints + Minimal Editorial Shell)
├── tests/                        # Vitest test suite verifying the intelligence layer
├── ARCHITECTURE.md               # Detailed architectural specification
└── DOMAIN_MODEL.md               # Canonical domain model reference
```

---

## Getting Started

### Prerequisites

- Node.js (v20+ or v26)
- npm

### Installation

```bash
npm install
```

### Running Tests

```bash
npm run test
```

### Running the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to interact with the minimal VAEL editorial interface.

### Running Typechecks & Production Build

```bash
npm run typecheck
npm run build
```

---

## Seed Data Summary

- **12 Style Families**: Minimal, Korean Minimal, Smart Casual, Old Money, Streetwear, Techwear, Workwear, Dark Academia, Vintage, Formal, Casual, Experimental.
- **18 Hairstyles**: Textured French Crop, Classic Side Part, Middle Part Curtains, Architectural Buzz Cut, Wavy Mod Cut, Textured Quiff, Slick Back Undercut, Curly High Top Taper, Shoulder Flow, Ivy League, Wolf Cut, Comb Over Fade, Short Locs Taper, Blunt Crop, Caesar Cut, Executive Pompadour, Knot Undercut, Textured Casual Waves.
- **10 Beard Styles**: Clean Shaven, Designer Stubble, Heavy Stubble, Short Boxed Beard, Tapered Fade Beard, Extended Goatee, Full Rugged Beard, Balbo & Anchor, Ducktail Beard, Refined Chevron Mustache.
- **34 Garments**: Structured across tops, bottoms, outerwear, footwear, and accessories with fit, silhouette, color, and formality attributes.
- **10 Occasions**: Job Interview, Office, Evening Date, Fine Dining, Night Out, Party, College, Wedding, Casual Day, Travel.

---

## License

Proprietary — VAEL 2026.
