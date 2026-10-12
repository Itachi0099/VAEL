# VAEL R1.2 — Scoring Formula, Factor Weights & Caps

**Version:** R1.2 (Commit: HEAD)  
**Date:** 12 October 2026  
**Auditor / Review:** Fashion Lead  

---

## 1. Evidence Hierarchy (Strict 5-Rank Authority)

Every styling input is tracked with explicit origin authority. Higher authority strictly overrides lower authority; Vision can never overwrite user confirmation or user input.

| Rank | Authority | Precedence Weight | Permissible Overwrite |
|---|---|---|---|
| **5** | `USER_CONFIRMED` | Explicit user verification | Highest; overrides all |
| **4** | `USER_ENTERED` | Direct manual form / radio entry | Overrides 1, 2, 3 |
| **3** | `LEARNED_FEEDBACK` | Repeat behavior inference | Overrides 1, 2 |
| **2** | `VISION` | Multimodal camera observation | Overrides 1 only; **never overrides User** |
| **1** | `DEFAULT` | Baseline fallback assumption | Base level; lowest authority |

---

## 2. Recommendation Factor Weights (Soft Scoring)

Once hard filters (modesty, climate thresholds, dress-code restrictions, and explicit dislikes) pass, surviving candidate outfits are ranked by weighted multi-attribute convergence:

| Factor Category | Default Weight | Range / Score Scale | Trigger & Impact |
|---|---|---|---|
| **Occasion Fit** (`occasion_fit`) | **3.0** | 0.0 – 1.0 | Distance from occasion target formality & guidelines |
| **Style Affinity** (`style_affinity`) | **2.5** | 0.0 – 1.0 | Dot-product alignment with user's 10-axis style vector |
| **Silhouette & Proportions** (`silhouette_balance`) | **2.0** | 0.0 – 1.0 | Geometric balance between top volume and bottom drape |
| **Color Harmony** (`color_harmony`) | **1.8** | 0.0 – 1.0 | Monochromatic restraint, tonal harmony, and undertone temperature |
| **Weather / Climate Fit** (`weather_fit`) | **1.5** | 0.0 – 1.0 | Breathability in heat; insulation and wind barrier in cold |
| **Wardrobe Priority** (`wardrobe_priority`) | **1.5** | 0.0 – 1.0 | Boost for user-owned items in personal wardrobe |
| **Style Expression Soft Affinity** (`expression_affinity`) | **1.0** | 0.5 – 0.8 | **Capped soft impact (<= 0.15 score delta)**; never vetoes |
| **Metal Tone Coherence** (`accessory_coherence`) | **0.5** | 0.6 – 0.95 | Penalizes silver vs gold/brass hardware clashes |
| **Budget Tier Fit** (`preference_reinforcement`) | **0.5** | 0.6 – 0.95 | Only active when user explicitly enters budget tier |

Composite Outfit Score:
$$\text{Score} = \frac{\sum (\text{weight}_i \times \text{score}_i)}{\sum \text{weight}_i}$$

---

## 3. Confidence State Matrix & Caps

Confidence measures **evidence sufficiency**, not whether a look is fashionable:

- **`STRONG`**:
  - Requires Formality, Climate (temperature & condition), Style Vector, and Grooming to ALL be user-sourced.
  - Composite look harmony score must be $\ge 0.82$.
- **`GOOD`**:
  - Exactly 1 default assumption among core inputs, OR all user-sourced with score $< 0.82$.
  - Capped at GOOD if skin undertone is unknown (`unspecified`).
- **`EXPLORATORY`**:
  - $\ge 2$ default assumptions among core inputs.
  - Cultural ceremony contexts with no installed tradition pack.
- **`NEED_MORE_INFO`**:
  - Empty profile or zero context specified.

Every returned look card provides **ONE concrete prompt** in `toIncreaseConfidence` specifying exactly what input would elevate confidence.

---

## 4. Diversity Selection Order

1. **BEST MATCH**: Highest composite scoring candidate passing all hard filters.
2. **SAFE**: Proven, low-risk classic candidate (lowest Euclidean distance from core archetype or owned wardrobe match).
3. **STRETCH**: Directional proposal differing on $\ge 2$ stylistic axes (volume, structure, or adjacent aesthetic) while strictly maintaining dress code and climate compliance.
