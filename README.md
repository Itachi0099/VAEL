# VAEL

> **Personal Styling System & Curated Visual Architecture**  
> *"Personal styling, explained. Your style, interpreted."*

VAEL is an editorial personal styling system and deterministic recommendation engine. Rather than generating synthetic imagery or offering generic chatbot prose, VAEL analyzes how an individual presents themselves—synthesizing facial geometry, hair texture, body line, textile physics, climate constraints, and personal aesthetics into coherent, elevated complete looks.


Live Deployment: [https://vael-eight.vercel.app](https://vael-eight.vercel.app)

---

## Architectural Principles

VAEL enforces a strict separation of concerns across visual perception, deterministic fashion knowledge, and user taste:

```
UI (Minimalist Monochrome Editorial Interface)
  ↓
API (Typed Next.js Application Route Handlers)
  ↓
DOMAIN (Canonical Entities: User, VisualProfile, CompleteLook, Context)
  ↓
KNOWLEDGE (Textile Physics, Color Theory, Silhouettes, Occasion Formality)
  ↓
INTELLIGENCE (Deterministic Scoring, 10D Style Vectors, Explainable Logic)
  ↓
PERSISTENCE (Decoupled Repositories & In-Memory Store)
```

The system separates:
1. **Observed Visual Geometry**: Objective facial structure, follicular density, and bodily proportions.
2. **Deterministic Fashion Physics**: Thermal airflow limits, moisture boundaries, volumetric balancing, and dress codes.
3. **Explicit User Taste & Evidence Authority**: 5-tier authority hierarchy (`USER_CONFIRMED` > `USER_ENTERED` > `LEARNED_FEEDBACK` > `VISION` > `DEFAULT`).
4. **Transparent Explainability**: Every recommendation factor links to verifiable signal IDs and knowledge entries with non-judgmental editorial language.

---

## The Three Tiers of Recommendation

For every context and profile, VAEL curates three distinct, purposeful perspectives rather than triplicates:

- **SAFE**: The effortless baseline. Anchors firmly within the user's proven comfort zone, matching exact occasion expectations with balanced proportions and neutral harmony.
- **BEST MATCH**: The algorithmic optimum. Represents the highest composite alignment across personal style vectors, silhouette architecture, undertone harmony, and climate parameters.
- **STRETCH**: The editorial expansion. Intentionally challenges the user's aesthetic boundaries—introducing curated contrast, bold textures, or fluid silhouettes anchored by disciplined foundation pieces.

---

## Core Capabilities

- **Complete Look Composition (`generateTopThreeLooks`)**: Assembles complete head-to-toe outfits including tops, bottoms, outerwear, footwear, and accessories grounded within $\le 1$ formality step.
- **10-Dimensional Style Vector Analysis**: Models aesthetic identity across formality, structure, volume, color intensity, value contrast, pattern, texture, ornamentation, classic/trend cadence, and utility/polish.
- **Gradated Gender Coding & Curated Fluidity**: Continuous spectrum across $\{-1.0, -0.5, 0.0, +0.5, +1.0\}$. Plain staples are treated as neutral basics ($0.0$, `fluid: false`), while deliberately cross-coded garments carry curated fluid attribution (`fluidTag: true`).
- **Hair & Beard Architecture (`generateHairRecommendations`, `generateGroomingRecommendations`)**: Evaluates cuts against texture (straight, wavy, curly, coily), length (buzz to long), face shape, and maintenance commitment. Features dedicated protective styles and formal coily updos.
- **Climate & Textile Physics Engine (`ClimateFabricRules`)**: Property-based thresholds evaluating fabric weight, weave breathability, water resistance, and insulation across freezing, rain, and extreme heat ($>28^\circ\text{C}$).
- **Proportion Calibration**: Evaluates torso/leg balance, shoulder/hip geometry, and height vertical lines using balancing and echoing phrasing without corrective or body-shaming terminology.
- **Hardware & Metal Tone Coherence**: Checks accessory metal hardware harmony (gold, silver, brass) with soft visual tension penalties rather than hard vetoes.

---

## Catalog & Knowledge Registry

- **203 Curated Garments**: 54 tops, 40 bottoms, 34 outerwear, 15 one-piece, 35 footwear, and 25 accessories with comprehensive physical and thermal attributes.
- **40 Distinct Hairstyles**: Reconciled across straight, wavy, curly, and coily textures spanning buzz, short, medium, shoulder, and long lengths up to formality 5.
- **20 Grooming & Beard Styles**: Clean-shaven to full sculpted silhouettes with follicular density matching.
- **12 Occasions & 37 Formality Bands**: From everyday casual to black-tie gala and bespoke ceremonial events.
- **10 Core Style Archetypes**: Minimal, Korean Minimal, Smart Casual, Old Money, Streetwear, Techwear, Workwear, Dark Academia, Vintage, and Formal.

---

## Verification & Quality Standards

VAEL adheres to rigorous mathematical and behavioral testing criteria:

- **Metric v3 Strict Grid Sweep**: Evaluates foundation pieces across 2,960 grid cells (4 style expressions $\times$ 37 occasion-formality pairs $\times$ 5 temperature bands $\times$ 2 conditions $\times$ 2 modesty levels), achieving **100.0% pass rate** (2,960/2,960 cells) with $\ge 90\%$ passing looks per group.
- **Separates Ratio**: Feminine looks maintain $\ge 40\%$ separates (870 separates vs 1,294 one-pieces across 2,220 looks).
- **Golden Test Suite**: 138 automated unit and integration tests verifying climate gates, precedence hierarchy, and input sensitivities with zero weak assertions (`toBeDefined` or `length > 0` alone).
- **Zero Banned Language**: Strict regex guardrails prevent corrective, hiding, or slimming terminology across all generated text.

---

## Repository Structure

```
vael/
├── src/
│   ├── app/                      # Next.js App Router & minimalist editorial UI
│   ├── components/               # Editorial cards, accordions, and look inspectors
│   └── core/
│       ├── domain/               # Canonical domain models (User, Visual, Fashion, Context)
│       ├── intelligence/         # Styling engine, scoring, and recommendation services
│       ├── knowledge/            # Garments, hairstyles, beards, occasions, climate rules
│       ├── persistence/          # Repository interfaces & in-memory datastore
│       └── services/             # High-level recommendation and feedback services
├── tests/
│   ├── evaluation/               # 45 Engineer-authored evaluation scenarios
│   └── golden-r12.test.ts        # Comprehensive golden suite & precedence proofs
├── review/                       # Exported profiles (1-17), CSV/JSON slices, scoring weights
├── reports/                      # Coverage sweep v3 CSV and results json
└── scripts/                      # Review export, sweep runners, and screenshot utilities
```

---

## Getting Started

### Prerequisites

- Node.js (v20+ or v26+)
- npm

### Installation

```bash
npm install
```

### Running Tests

```bash
npm test
```

### Running Fashion Knowledge Evaluation

```bash
npm run eval
```

### TypeScript Verification

```bash
npm run typecheck
```

### Production Build

```bash
npm run build
```

### Export Review Package

```bash
npm run export:review
```

---

## License

Proprietary — VAEL 2026.
