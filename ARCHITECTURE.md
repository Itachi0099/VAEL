# VAEL Architecture Specification

## 1. High-Level Architecture Overview

VAEL is architected around an extensible, decoupled pipeline where **styling intelligence is deterministic, explainable, and testable**, while **visual observation is abstracted through clean multimodal interfaces**.

```
                           +------------------------------+
                           |  User Input / Raw Image     |
                           +------------------------------+
                                          |
                                          v
                           +------------------------------+
                           |      VisualAnalyzer          |  (Mock / Gemini / Vision LLM)
                           +------------------------------+
                                          |
                                          v
                           +------------------------------+
                           |        VisualProfile         |  (Objective styling signals only)
                           +------------------------------+
                                          |
+----------------------+                  |                  +--------------------------+
|  User Preferences &  |                  v                  | Fashion Knowledge Graph  |
|  Feedback Profile    | ----> [ COMPATIBILITY ENGINE ] <--- | (Taxonomies, Silhouettes,|
+----------------------+                  |                  |  Color Theory, Occasions)|
                                          v                  +--------------------------+
                           +------------------------------+
                           |    Weighted Scoring &        |
                           |    Explainability Engine     |
                           +------------------------------+
                                          |
                                          v
                           +------------------------------+
                           |   Ranked Recommendations     |
                           |   (Score + Factors + Reasons)|
                           +------------------------------+
                                          |
                                          v
                           +------------------------------+
                           |  Editorial Presentation UI   |
                           +------------------------------+
```

---

## 2. Separation of Concerns

The architecture strictly delineates 6 independent layers:

1. **Presentation / UI Layer (`src/app/page.tsx`)**:
   - Minimal editorial shell reflecting VAEL brand aesthetics (whitespace, stark contrast, monospace accents).
   - Consumes the API layer over HTTP/JSON.
   - Zero recommendation or scoring logic resides here.
2. **API Layer (`src/app/api/*`)**:
   - 14 REST endpoints exposing the styling services.
   - Responsible for request validation, query parsing, and status code dispatch.
3. **Domain Layer (`src/core/domain/*`)**:
   - Pure TypeScript types and interfaces defining User, VisualProfile, HairStyle, BeardStyle, Garment, Outfit, Style, Occasion, Context, Recommendation, and Feedback.
4. **Fashion Knowledge Layer (`src/core/knowledge/*`)**:
   - Structured relational taxonomies, color theory engines, and proportion balance evaluators.
   - Knowledge is represented as structured attributes (silhouette, fit, formality, palette, material, maintenance) rather than opaque text blocks.
5. **Intelligence Layer (`src/core/intelligence/*`)**:
   - Deterministic compatibility algorithms for hair, grooming, outfits, and latent styles.
   - Explainable scoring engine that generates concrete reasons and cautions for every recommendation.
   - Preference weighting engine that updates scores based on user feedback.
6. **Persistence Layer (`src/core/persistence/*`)**:
   - Abstract repository contracts (`UserRepository`, `WardrobeRepository`, `FeedbackRepository`, `OutfitRepository`).
   - Standard implementation: in-memory store pre-seeded with development curator profile. Pluggable with PostgreSQL / Prisma / DynamoDB without touching styling services.

---

## 3. The Recommendation Pipeline

A recommendation is processed in 4 distinct phases:

### Phase A: Signal Extraction
The user's visual profile is retrieved or analyzed:
- Face geometry (shape, jawline, thirds balance, facial hair presence)
- Hair attributes (texture, density, length, volume)
- Body silhouette (trapezoid, rectangle, inverted triangle)

### Phase B: Candidate Filtering & Compatibility Assessment
Candidate items (hairstyles, beard styles, or garments) from the Fashion Knowledge Base are evaluated against:
1. **Physical Compatibility**: Does the hairstyle work with observed hair texture and face shape? Does the beard style fit the user's hair density?
2. **Context & Occasion**: Does the piece comply with occasion dress codes and target formality?
3. **Climate & Seasonality**: Are materials and layering appropriate for current weather?
4. **Proportion & Color Cohesion**: (For outfits) Does the top/bottom volume balance create visual harmony? Do the colors follow monochromatic, tonal, or complementary-accent principles?

### Phase C: Preference & Feedback Modulation
Scores are modulated by the user's explicit preferences and historical feedback:
- Explicit style matches receive bonuses (+0.15) or penalties (-0.25).
- Feedback history dynamically shifts affinities:
  - `LOVE`: +0.30 weight push
  - `LIKE`: +0.12 weight push
  - `DISLIKE`: -0.20 weight push
  - `NOT_FOR_ME`: -0.45 weight push

### Phase D: Explainable Synthesis
Every recommendation output includes:
- Normalized score between `0.00` and `1.00`.
- Factor-by-factor breakdown (`visual_feature`, `occasion_fit`, `preference_reinforcement`, etc.).
- Plain-English styling reasons (e.g. *"Complements your oval face geometry by balancing facial thirds"*).
- Preemptive cautions (e.g. *"Demands high maintenance which exceeds your preferred routine"*).

---

## 4. Deterministic Intelligence vs. AI/Model Abstraction

| Concern | Method | Rationale |
|---|---|---|
| **Image Feature Extraction** | Multimodal AI (`VisualAnalyzer`) | Requires visual perception to extract face shape, hair texture, and current clothing. |
| **Styling Compatibility** | Deterministic Knowledge Engine | Rules of color harmony, geometric proportion, and formality codes are structured rules, not hallucinations. |
| **Recommendation Ranking** | Weighted Scoring Engine | Ensures complete transparency, consistency, and explainability. |
| **Personal Adaptation** | Reinforcement Weight Delta Engine | Fast, deterministic user learning without costly model fine-tuning. |

### Multimodal Vision Abstraction (`VisualAnalyzer`)
The interface `VisualAnalyzer` accepts an image buffer or URL and returns a `VisualAnalysisResult`:
```typescript
export interface VisualAnalyzer {
  readonly providerName: string;
  analyze(input: VisualAnalysisInput): Promise<VisualAnalysisResult>;
}
```
Currently implemented with `MockVisualAnalyzer`, which outputs realistic structured styling signals with transparent metadata (`isMock: true`, `provider: 'mock-vision-adapter'`). In production, this can be swapped with a Google Gemini 2.5/Flash Vision adapter by implementing the same interface.
