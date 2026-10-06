# VAEL Golden Evaluation System

The VAEL evaluation system provides an automated, regression-proof verification harness to validate fashion intelligence recommendations against stylist-grade scenarios.

---

## 1. Golden Evaluation Corpus

Located in [`tests/evaluation/corpus.ts`](file:///Users/manangulati/projects/VAEL/tests/evaluation/corpus.ts), the corpus contains **40 scenarios** spanning 10 critical domains:

1. **Physics & Climate Reality (Cases 1–4)**:
   - Extreme heat summer wedding (34°C): Verifies hard veto of heavyweight wool/down outerwear.
   - Sub-zero freezing commute (-4°C): Verifies veto of summer shorts and uninsulated open footwear.
   - Torrential rain transit: Verifies water resistance and fabric durability.
   - Tropical high-humidity evening: Verifies breathable open-weave fabrics over heat-trapping synthetics.

2. **Taste Learning & Negative Signals (Cases 5–7, 34–36)**:
   - Repeated passes on oversized silhouettes: Dampens oversized fits when `repeatPassCount.oversized >= 3`.
   - Aversion to bright/neon colors: Hard filters prevent disliked color tones.
   - Stated style dislikes: Filters out disliked style families.
   - Androgynous & Masculine directions: Honors user gender-coding direction.
   - **Neutral styling language guardrail**: Verifies zero instances of body-shaming or flaw-fixing vocabulary.

3. **Silhouette & Proportion Harmony (Cases 8–9, 38)**:
   - Dropped-shoulder boxy tee offset with wide fluid trousers.
   - Detection of style tension when pairing formal tailoring with extreme slouch.
   - Footwear grounding principles.

4. **Evidence Authority & Truth (Cases 10–11)**:
   - User-confirmed wavy hair (`rank 5`) strictly overrides camera/vision straight estimation (`rank 2`).
   - Face shape behaves as a soft multiplier, never a disqualifier.

5. **Color Theory & Undertone Compatibility (Cases 12–13, 37)**:
   - Cool undertone palettes (charcoal, slate, navy, crisp white).
   - Warm undertone earth palettes (camel, olive, canvas tan).
   - Monochromatic palette discipline.

6. **Modesty & Cultural Reverence (Cases 14–15)**:
   - High-coverage modesty preference vetoes low-coverage tops, deep scoops, and shorts.
   - Cultural/Traditional ceremony context surfaces Bandhgala, Kurta tunics, and heritage silks rather than defaulting to Western suits.

7. **Grooming & Hair Texture Feasibility (Cases 16–19)**:
   - Coily natural hair and protective style feasibility.
   - Curly hair texture compatibility.
   - Minimal maintenance haircut preferences.
   - Patchy beard density feasibility (prevents heavy full beard suggestions).

8. **Uncertainty & Confidence States (Cases 20–22)**:
   - Missing context yields `NEED_MORE_INFO` with one concrete prompt.
   - Unconfirmed weather yields `GOOD` confidence prompting local temperature confirmation.
   - Complete confirmed signals yield `STRONG` confidence.

9. **Top 3 Look Diversity (Case 23)**:
   - Verifies `SAFE`, `BEST_MATCH`, and `STRETCH` are meaningfully distinct, never triplicates.

10. **Diverse Occasion Formality Calibration (Cases 24–33, 39–40)**:
    - Techwear commute, Dark Academia campus, Old Money dinner, Streetwear night out, Workwear weekend, Vintage discovery, Black-Tie gala, Job interview, First date, Travel transit, Custom event, and Social house party.

---

## 2. Running Evaluations

### Pre-Flight Knowledge Validation
Checks all garments, hairstyles, beards, and styles for internal contradictions:
```bash
npm run typecheck
```

### Run the Evaluation Harness
Executes all 40 scenarios through [`VaelStylingEngine`](file:///Users/manangulati/projects/VAEL/src/core/intelligence/engine.ts) and displays category summaries:
```bash
npm run eval
```

### Run the Vitest Test Suite
Runs all unit, integration, and evaluation tests:
```bash
npm run test
```

---

## 3. Stylist Endorsement Standard

The evaluation suite requires **>= 80% pass rate** for stylist endorsement. Current automated suite performance:
- **Scenarios Evaluated**: 40 / 40
- **Scenarios Passed**: 40 / 40 (100%)
- **Individual Assertions Passed**: 61 / 61 (100%)
- **Contradictions in Knowledge Base**: 0
