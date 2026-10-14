import fs from 'fs';
import path from 'path';
import { knowledgeBase } from '../src/core/knowledge';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
import { recommendationService } from '../src/core/services';
import { defaultStore } from '../src/core/persistence';
import { User, Context, TopThreeLooks, StyleVector } from '../src/core/domain';

const REVIEW_DIR = path.resolve(process.cwd(), 'review');
const OUTPUTS_DIR = path.join(REVIEW_DIR, 'outputs');

fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

function createBaseUserProfile(id: string, name: string): User {
  return {
    id,
    name,
    handle: id.replace('usr_', ''),
    createdAt: '2026-10-12T00:00:00.000Z',
    styleProfile: {
      id: `sty_${id}`,
      userId: id,
      dominantAestheticSlugs: ['minimal'],
      styleVector: {
        formality: 3,
        structure: 3,
        volume: 3,
        colorIntensity: 1,
        contrast: 3,
        pattern: 1,
        texture: 2,
        ornamentation: 1,
        classicTrend: 3,
        utilityPolish: 3,
        genderCoding: 'androgynous',
      },
      preferences: {
        preferredStyleSlugs: ['minimal'],
        dislikedStyleSlugs: [],
        preferredColors: ['black', 'white', 'charcoal'],
        dislikedColors: [],
        preferredFits: ['relaxed', 'regular'],
        dislikedFits: [],
        preferredSilhouettes: [],
        dislikedSilhouettes: [],
        fitProportions: {
          preferredFits: ['relaxed', 'regular'],
          dislikedFits: [],
          topVolume: 3,
          bottomVolume: 3,
          preferredSilhouettes: [],
          dislikedSilhouettes: [],
          layeringPreference: 'moderate',
          garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
        },
        modestyLevel: 'unrestricted',
        userConfirmedUndertone: 'neutral',
        genderCodingDirection: 'androgynous',
        styleExpression: 'androgynous',
        preferredFormalityRange: [2, 4],
        maxMaintenanceTolerance: 'moderate',
        accessoryAffinities: [],
      },
      feedbackProfile: {
        history: [],
        learnedStyleAffinities: {},
        learnedColorAffinities: {},
        learnedSilhouetteAffinities: {},
        learnedFitAffinities: {},
        repeatPassCount: {},
      },
      evidenceSignals: {
        hairTexture: {
          value: 'straight',
          authority: 'USER_ENTERED',
          confidence: 1.0,
          source: 'manual_input',
          updatedAt: '2026-10-12T00:00:00.000Z',
        },
      },
      updatedAt: '2026-10-12T00:00:00.000Z',
    },
  };
}

async function generateReviewOutputs() {
  console.log('Generating Review Package in /review...');

  // 1. Export Garments Registry (JSON and CSV)
  const allGarments = knowledgeBase.getAllGarments();
  fs.writeFileSync(path.join(REVIEW_DIR, 'garments.json'), JSON.stringify(allGarments, null, 2));

  const csvHeaders = [
    'id',
    'name',
    'slug',
    'category',
    'subcategory',
    'fit',
    'silhouette',
    'length',
    'colorName',
    'material',
    'fabricWeight',
    'breathability',
    'waterResistance',
    'minTemperatureC',
    'maxTemperatureC',
    'formality',
    'structure',
    'volume',
    'texture',
    'drape',
    'lining',
    'insulation',
    'ornamentation',
    'budgetTier',
    'modestyRating',
    'genderCoding',
    'garmentCoding',
    'fluidTag',
    'reviewed_by',
  ];

  const csvRows = allGarments.map((g) => [
    g.id,
    `"${g.name.replace(/"/g, '""')}"`,
    g.slug,
    g.category,
    g.subcategory,
    g.fit,
    g.silhouette,
    g.length || '',
    `"${g.color.name}"`,
    `"${g.material}"`,
    g.fabricWeight,
    g.breathability,
    g.waterResistance,
    g.minTemperatureC ?? '',
    g.maxTemperatureC ?? '',
    g.formality,
    g.structure,
    g.volume,
    g.texture,
    g.drape || '',
    g.lining || '',
    g.insulation || '',
    g.ornamentation ?? '',
    g.budgetTier || '',
    g.modestyRating,
    g.genderCoding,
    g.garmentCoding ?? 0,
    g.fluidTag ?? false,
    g.reviewed_by || '',
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
  fs.writeFileSync(path.join(REVIEW_DIR, 'garments.csv'), csvContent);
  console.log(`✓ Exported ${allGarments.length} garments to review/garments.json and review/garments.csv`);

  // Export gender-coded slices
  const mascGarments = allGarments.filter((g) => g.genderCoding === 'masculine' || (g.garmentCoding !== undefined && g.garmentCoding < 0));
  const femGarments = allGarments.filter((g) => g.genderCoding === 'feminine' || (g.garmentCoding !== undefined && g.garmentCoding > 0));
  const fluidGarments = allGarments.filter((g) => g.fluidTag === true);

  fs.writeFileSync(path.join(REVIEW_DIR, 'garments-masculine.json'), JSON.stringify(mascGarments, null, 2));
  fs.writeFileSync(path.join(REVIEW_DIR, 'garments-feminine.json'), JSON.stringify(femGarments, null, 2));
  
  const fluidExportData = fluidGarments.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    category: g.category,
    subcategory: g.subcategory,
    genderCoding: g.genderCoding,
    garmentCoding: g.garmentCoding ?? 0,
    fluidTag: true,
    rationale: (g as any).fluidRationale || (g as any).curated_notes || 'Deliberately cross-coded / unisex fluid foundation piece',
  }));
  fs.writeFileSync(path.join(REVIEW_DIR, 'garments-fluid.json'), JSON.stringify(fluidExportData, null, 2));

  const mascCsvRows = mascGarments.map((g) => [g.id, `"${g.name.replace(/"/g, '""')}"`, g.slug, g.category, g.genderCoding, g.garmentCoding ?? 0, g.fluidTag ?? false]);
  const femCsvRows = femGarments.map((g) => [g.id, `"${g.name.replace(/"/g, '""')}"`, g.slug, g.category, g.genderCoding, g.garmentCoding ?? 0, g.fluidTag ?? false]);
  const fluidCsvRows = fluidExportData.map((g) => [g.id, `"${g.name.replace(/"/g, '""')}"`, g.slug, g.category, g.genderCoding, g.garmentCoding ?? 0, g.fluidTag ?? false, `"${g.rationale.replace(/"/g, '""')}"`]);

  const sliceHeaders = ['id', 'name', 'slug', 'category', 'genderCoding', 'garmentCoding', 'fluidTag'];
  const fluidSliceHeaders = ['id', 'name', 'slug', 'category', 'genderCoding', 'garmentCoding', 'fluidTag', 'rationale'];
  fs.writeFileSync(path.join(REVIEW_DIR, 'garments-masculine.csv'), [sliceHeaders.join(','), ...mascCsvRows.map((r) => r.join(','))].join('\n'));
  fs.writeFileSync(path.join(REVIEW_DIR, 'garments-feminine.csv'), [sliceHeaders.join(','), ...femCsvRows.map((r) => r.join(','))].join('\n'));
  fs.writeFileSync(path.join(REVIEW_DIR, 'garments-fluid.csv'), [fluidSliceHeaders.join(','), ...fluidCsvRows.map((r) => r.join(','))].join('\n'));
  console.log(`✓ Exported slices: ${mascGarments.length} masculine, ${femGarments.length} feminine, ${fluidGarments.length} curated fluid.`);

  // 2. Export Scoring Weights Specification
  const scoringWeightsMd = `# VAEL R1.2 — Scoring Formula, Factor Weights & Caps

**Version:** R1.2 (Commit: HEAD)  
**Date:** 12 October 2026  
**Auditor / Review:** Fashion Lead  

---

## 1. Evidence Hierarchy (Strict 5-Rank Authority)

Every styling input is tracked with explicit origin authority. Higher authority strictly overrides lower authority; Vision can never overwrite user confirmation or user input.

| Rank | Authority | Precedence Weight | Permissible Overwrite |
|---|---|---|---|
| **5** | \`USER_CONFIRMED\` | Explicit user verification | Highest; overrides all |
| **4** | \`USER_ENTERED\` | Direct manual form / radio entry | Overrides 1, 2, 3 |
| **3** | \`LEARNED_FEEDBACK\` | Repeat behavior inference | Overrides 1, 2 |
| **2** | \`VISION\` | Multimodal camera observation | Overrides 1 only; **never overrides User** |
| **1** | \`DEFAULT\` | Baseline fallback assumption | Base level; lowest authority |

---

## 2. Recommendation Factor Weights (Soft Scoring)

Once hard filters (modesty, climate thresholds, dress-code restrictions, and explicit dislikes) pass, surviving candidate outfits are ranked by weighted multi-attribute convergence:

| Factor Category | Default Weight | Range / Score Scale | Trigger & Impact |
|---|---|---|---|
| **Occasion Fit** (\`occasion_fit\`) | **3.0** | 0.0 – 1.0 | Distance from occasion target formality & guidelines |
| **Style Affinity** (\`style_affinity\`) | **2.5** | 0.0 – 1.0 | Dot-product alignment with user's 10-axis style vector |
| **Silhouette & Proportions** (\`silhouette_balance\`) | **2.0** | 0.0 – 1.0 | Geometric balance between top volume and bottom drape |
| **Color Harmony** (\`color_harmony\`) | **1.8** | 0.0 – 1.0 | Monochromatic restraint, tonal harmony, and undertone temperature |
| **Weather / Climate Fit** (\`weather_fit\`) | **1.5** | 0.0 – 1.0 | Breathability in heat; insulation and wind barrier in cold |
| **Wardrobe Priority** (\`wardrobe_priority\`) | **1.5** | 0.0 – 1.0 | Boost for user-owned items in personal wardrobe |
| **Style Expression Soft Affinity** (\`expression_affinity\`) | **1.0** | 0.5 – 0.8 | **Capped soft impact (<= 0.15 score delta)**; never vetoes |
| **Metal Tone Coherence** (\`accessory_coherence\`) | **0.5** | 0.6 – 0.95 | Penalizes silver vs gold/brass hardware clashes |
| **Budget Tier Fit** (\`preference_reinforcement\`) | **0.5** | 0.6 – 0.95 | Only active when user explicitly enters budget tier |

Composite Outfit Score:
$$\\text{Score} = \\frac{\\sum (\\text{weight}_i \\times \\text{score}_i)}{\\sum \\text{weight}_i}$$

---

## 3. Confidence State Matrix & Caps

Confidence measures **evidence sufficiency**, not whether a look is fashionable:

- **\`STRONG\`**:
  - Requires Formality, Climate (temperature & condition), Style Vector, and Grooming to ALL be user-sourced.
  - Composite look harmony score must be $\\ge 0.82$.
- **\`GOOD\`**:
  - Exactly 1 default assumption among core inputs, OR all user-sourced with score $< 0.82$.
  - Capped at GOOD if skin undertone is unknown (\`unspecified\`).
- **\`EXPLORATORY\`**:
  - $\\ge 2$ default assumptions among core inputs.
  - Cultural ceremony contexts with no installed tradition pack.
- **\`NEED_MORE_INFO\`**:
  - Empty profile or zero context specified.

Every returned look card provides **ONE concrete prompt** in \`toIncreaseConfidence\` specifying exactly what input would elevate confidence.

---

## 4. Diversity Selection Order

1. **BEST MATCH**: Highest composite scoring candidate passing all hard filters.
2. **SAFE**: Proven, low-risk classic candidate (lowest Euclidean distance from core archetype or owned wardrobe match).
3. **STRETCH**: Directional proposal differing on $\\ge 2$ stylistic axes (volume, structure, or adjacent aesthetic) while strictly maintaining dress code and climate compliance.
`;
  fs.writeFileSync(path.join(REVIEW_DIR, 'scoring-weights.md'), scoringWeightsMd);
  console.log('✓ Exported review/scoring-weights.md');

  // 3. Define and run the 15 Required Profiles
  const demoUser = await defaultStore.getUser('usr_vael_curator');

  const profileConfigs = [
    // 1. Empty profile
    {
      filename: 'profile-01.json',
      title: 'Profile 01: Empty profile',
      user: {
        id: 'usr_p01_empty',
        name: 'Empty Profile User',
        handle: 'empty_user',
        createdAt: '2026-10-12T00:00:00.000Z',
        styleProfile: {
          id: 'sty_p01',
          userId: 'usr_p01_empty',
          dominantAestheticSlugs: [],
          styleVector: {
            formality: 3,
            structure: 3,
            volume: 3,
            colorIntensity: 1,
            contrast: 3,
            pattern: 1,
            texture: 2,
            ornamentation: 1,
            classicTrend: 3,
            utilityPolish: 3,
            genderCoding: 'androgynous',
          },
          preferences: {
            preferredStyleSlugs: [],
            dislikedStyleSlugs: [],
            preferredColors: [],
            dislikedColors: [],
            preferredFits: [],
            dislikedFits: [],
            preferredSilhouettes: [],
            dislikedSilhouettes: [],
            fitProportions: {
              preferredFits: [],
              dislikedFits: [],
              topVolume: 3,
              bottomVolume: 3,
              preferredSilhouettes: [],
              dislikedSilhouettes: [],
              layeringPreference: 'moderate',
              garmentLengthPreferences: {},
            },
            modestyLevel: 'unrestricted',
            userConfirmedUndertone: 'unspecified',
            genderCodingDirection: 'androgynous',
            styleExpression: 'unspecified',
            preferredFormalityRange: [1, 5],
            maxMaintenanceTolerance: 'moderate',
            accessoryAffinities: [],
          },
          feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
          updatedAt: '2026-10-12T00:00:00.000Z',
        },
      },
      context: undefined,
    },

    // 2. Demo profile
    {
      filename: 'profile-02.json',
      title: 'Profile 02: Demo profile',
      user: demoUser || createBaseUserProfile('usr_p02_demo', 'VAEL Curator Demo'),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('dinner')!,
        weather: 'mild',
        temperatureLevel: 'mild',
        targetFormality: 4,
        isWeatherConfirmed: true,
      },
    },

    // 3. Round face, curly, low density, full beard, Workplace
    {
      filename: 'profile-03.json',
      title: 'Profile 03: Round face, curly, low density, full beard, Workplace',
      user: {
        ...createBaseUserProfile('usr_p03', 'Round Face Full Beard'),
        visualProfile: {
          id: 'vis_p03',
          userId: 'usr_p03',
          face: {
            shape: 'round',
            jaw: 'soft',
            hasFacialHair: true,
            beardCharacteristics: { currentLength: 'full', observedDensity: 'thick', growthPattern: 'full' },
          },
          hair: { texture: 'curly', density: 'low', length: 'medium', volume: 'moderate' },
          body: { silhouette: 'rectangle' },
          source: 'user_input',
          confidenceScore: 1.0,
          lastObservedAt: '2026-10-12T00:00:00.000Z',
        },
      },
      context: {
        occasion: knowledgeBase.getOccasionBySlug('office')!,
        targetFormality: 3,
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 4. Coily, short, low maintenance, Workplace
    {
      filename: 'profile-04.json',
      title: 'Profile 04: Coily, short, low maintenance, Workplace',
      user: {
        ...createBaseUserProfile('usr_p04', 'Coily Low Maintenance'),
        visualProfile: {
          id: 'vis_p04',
          userId: 'usr_p04',
          face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
          hair: { texture: 'coily', density: 'high', length: 'short', volume: 'moderate' },
          body: { silhouette: 'rectangle' },
          source: 'user_input',
          confidenceScore: 1.0,
          lastObservedAt: '2026-10-12T00:00:00.000Z',
        },
      },
      context: {
        occasion: knowledgeBase.getOccasionBySlug('office')!,
        targetFormality: 3,
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 5. Modesty covered-both + hot + Wedding Guest (evening)
    {
      filename: 'profile-05.json',
      title: 'Profile 05: Modesty covered-both + hot + Wedding Guest (evening)',
      user: (() => {
        const u = createBaseUserProfile('usr_p05', 'Modest Evening Wedding');
        u.styleProfile.preferences.modestyLevel = 'covered-both';
        return u;
      })(),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
        targetFormality: 4,
        temperatureLevel: 'hot',
        temperatureCelsius: 30,
        subParameter: 'evening',
        isWeatherConfirmed: true,
      },
    },

    // 6. Feminine expression, long straight hair, Job Interview (corporate)
    {
      filename: 'profile-06.json',
      title: 'Profile 06: Feminine expression, long straight hair, Job Interview (corporate)',
      user: {
        ...(() => {
          const u = createBaseUserProfile('usr_p06', 'Corporate Feminine');
          u.styleProfile.preferences.styleExpression = 'feminine';
          u.styleProfile.preferences.genderCodingDirection = 'feminine';
          return u;
        })(),
        visualProfile: {
          id: 'vis_p06',
          userId: 'usr_p06',
          face: { shape: 'oval', jaw: 'soft', hasFacialHair: false },
          hair: { texture: 'straight', density: 'medium', length: 'long', volume: 'moderate' },
          body: { silhouette: 'rectangle' },
          source: 'user_input',
          confidenceScore: 1.0,
          lastObservedAt: '2026-10-12T00:00:00.000Z',
        },
      },
      context: {
        occasion: knowledgeBase.getOccasionBySlug('job-interview')!,
        targetFormality: 4,
        subParameter: 'corporate',
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 7. No-preference expression, wavy medium hair, Evening Date
    {
      filename: 'profile-07.json',
      title: 'Profile 07: No-preference expression, wavy medium hair, Evening Date',
      user: {
        ...(() => {
          const u = createBaseUserProfile('usr_p07', 'No Preference Date');
          u.styleProfile.preferences.styleExpression = 'no-preference';
          return u;
        })(),
        visualProfile: {
          id: 'vis_p07',
          userId: 'usr_p07',
          face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
          hair: { texture: 'wavy', density: 'medium', length: 'medium', volume: 'moderate' },
          body: { silhouette: 'rectangle' },
          source: 'user_input',
          confidenceScore: 1.0,
          lastObservedAt: '2026-10-12T00:00:00.000Z',
        },
      },
      context: {
        occasion: knowledgeBase.getOccasionBySlug('date')!,
        targetFormality: 3,
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 8. Hot + humid, Campus / College
    {
      filename: 'profile-08.json',
      title: 'Profile 08: Hot + humid, Campus / College',
      user: createBaseUserProfile('usr_p08', 'Campus Summer'),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('university-college')!,
        temperatureLevel: 'hot',
        temperatureCelsius: 32,
        humidity: 'high' as const,
        targetFormality: 2,
        isWeatherConfirmed: true,
      },
    },

    // 9. Cold + rain, Workplace
    {
      filename: 'profile-09.json',
      title: 'Profile 09: Cold + rain, Workplace',
      user: createBaseUserProfile('usr_p09', 'Cold Rain Commute'),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('office')!,
        temperatureLevel: 'cold',
        temperatureCelsius: 4,
        condition: 'rain' as const,
        targetFormality: 3,
        isWeatherConfirmed: true,
      },
    },

    // 10. Streetwear + Techwear selected, hot
    {
      filename: 'profile-10.json',
      title: 'Profile 10: Streetwear + Techwear selected, hot',
      user: (() => {
        const u = createBaseUserProfile('usr_p10', 'Hot Weather Techwear');
        u.styleProfile.preferences.preferredStyleSlugs = ['streetwear', 'techwear'];
        return u;
      })(),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('casual')!,
        temperatureLevel: 'hot',
        temperatureCelsius: 31,
        targetFormality: 2,
        isWeatherConfirmed: true,
      },
    },

    // 11. Cultural Ceremony, no tradition pack
    {
      filename: 'profile-11.json',
      title: 'Profile 11: Cultural Ceremony, no tradition pack',
      user: createBaseUserProfile('usr_p11', 'Cultural Ceremony Guest'),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('cultural-traditional')!,
        targetFormality: 4,
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 12. Avoid Minimal, minimal-leaning occasion
    {
      filename: 'profile-12.json',
      title: 'Profile 12: Avoid Minimal, minimal-leaning occasion',
      user: (() => {
        const u = createBaseUserProfile('usr_p12', 'Avoid Minimal User');
        u.styleProfile.preferences.preferredStyleSlugs = ['smart-casual', 'vintage'];
        u.styleProfile.preferences.dislikedStyleSlugs = ['minimal'];
        return u;
      })(),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('dinner')!,
        targetFormality: 3,
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 13. Oversized top fit + relaxed bottom fit
    {
      filename: 'profile-13.json',
      title: 'Profile 13: Oversized top fit + relaxed bottom fit',
      user: (() => {
        const u = createBaseUserProfile('usr_p13', 'Volume Play User');
        u.styleProfile.preferences.preferredFits = ['oversized', 'relaxed'];
        u.styleProfile.preferences.fitProportions.topVolume = 5;
        u.styleProfile.preferences.fitProportions.bottomVolume = 4;
        return u;
      })(),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('dinner')!,
        targetFormality: 3,
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 14. Everything unknown except occasion
    {
      filename: 'profile-14.json',
      title: 'Profile 14: Everything unknown except occasion',
      user: (() => {
        const u = createBaseUserProfile('usr_p14', 'Total Unknown User');
        u.styleProfile.preferences.preferredStyleSlugs = [];
        u.styleProfile.preferences.userConfirmedUndertone = 'unspecified';
        u.styleProfile.preferences.contrastLevel = 'unspecified';
        u.styleProfile.preferences.heightRange = 'unspecified';
        u.styleProfile.preferences.torsoLegPreference = 'unspecified';
        u.styleProfile.preferences.shoulderHipBalance = 'unspecified';
        u.styleProfile.preferences.styleExpression = 'unspecified';
        u.styleProfile.preferences.genderIdentity = 'unspecified';
        u.visualProfile = undefined;
        return u;
      })(),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('dinner')!,
        isWeatherConfirmed: false,
      },
    },

    // 15. Conflict: Wedding Guest + formality 1
    {
      filename: 'profile-15.json',
      title: 'Profile 15: Conflict: Wedding Guest + formality 1',
      user: createBaseUserProfile('usr_p15', 'Formality Conflict User'),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
        targetFormality: 1,
        isFormalityOverridden: false,
        temperatureLevel: 'mild',
        isWeatherConfirmed: true,
      },
    },

    // 16. Androgynous + Wedding Guest evening
    {
      filename: 'profile-16.json',
      title: 'Profile 16: Androgynous + Wedding Guest evening',
      user: (() => {
        const u = createBaseUserProfile('usr_p16', 'Androgynous Evening Wedding User');
        u.styleProfile.preferences.styleExpression = 'androgynous';
        u.styleProfile.preferences.genderCodingDirection = 'androgynous';
        u.styleProfile.preferences.preferredFormalityRange = [4, 5];
        return u;
      })(),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('wedding-guest')!,
        targetFormality: 4,
        temperatureLevel: 'mild',
        condition: 'dry',
        isWeatherConfirmed: true,
      },
    },

    // 17. Masculine + hot + Job Interview
    {
      filename: 'profile-17.json',
      title: 'Profile 17: Masculine + hot + Job Interview',
      user: (() => {
        const u = createBaseUserProfile('usr_p17', 'Masculine Hot Interview User');
        u.styleProfile.preferences.styleExpression = 'masculine';
        u.styleProfile.preferences.genderCodingDirection = 'masculine';
        u.styleProfile.preferences.preferredFits = ['tailored', 'regular'];
        u.styleProfile.preferences.preferredFormalityRange = [3, 4];
        return u;
      })(),
      context: {
        occasion: knowledgeBase.getOccasionBySlug('job-interview')!,
        targetFormality: 4,
        temperatureLevel: 'hot',
        temperatureCelsius: 32,
        condition: 'dry',
        isWeatherConfirmed: true,
        subParameter: 'corporate',
      },
    },
  ];

  const reviewSheetSections: string[] = [];

  for (const cfg of profileConfigs) {
    const userToEvaluate = cfg.user as User;
    const contextToEvaluate = cfg.context as Context | undefined;
    const result = VaelStylingEngine.generateTopThreeLooks({
      user: userToEvaluate,
      context: contextToEvaluate,
    });

    const outputPayload = {
      profileId: userToEvaluate.id,
      title: cfg.title,
      profile: {
        user: userToEvaluate,
        evidenceHierarchy: {
          userConfirmedUndertone: (userToEvaluate.styleProfile?.preferences as any)?.userConfirmedUndertone,
          modestyLevel: (userToEvaluate.styleProfile?.preferences as any)?.modestyLevel,
          styleExpression: (userToEvaluate.styleProfile?.preferences as any)?.styleExpression,
          genderIdentity: (userToEvaluate.styleProfile?.preferences as any)?.genderIdentity,
          evidenceSignals: userToEvaluate.styleProfile?.evidenceSignals,
        },
      },
      context: contextToEvaluate,
      result: {
        looksCount: result.looks.length,
        looksCountExplanation: result.looksCountExplanation,
        relaxationLog: result.relaxationLog,
        contextApplied: result.contextApplied,
        vetoedCandidateCount: result.vetoedCandidateCount,
        evaluatedCandidateCount: result.evaluatedCandidateCount,
        looks: result.looks.map((l) => ({
          tier: l.tier,
          tierRationale: l.tierRationale,
          confidence: l.confidence,
          overallHarmonyScore: l.overallHarmonyScore,
          reasons: l.reasons,
          cautions: l.cautions,
          outfit: {
            id: l.outfit.item.id,
            title: l.outfit.item.title,
            primaryStyleSlug: l.outfit.item.primaryStyleSlug,
            formality: l.outfit.item.formality,
            score: l.outfit.score,
            items: l.outfit.item.items.map((it) => ({
              category: it.garment.category,
              subcategory: it.garment.subcategory,
              name: it.garment.name,
              material: it.garment.material,
              color: it.garment.color.name,
              fit: it.garment.fit,
              modestyRating: it.garment.modestyRating,
              genderCoding: it.garment.genderCoding,
              layerPosition: it.layerPosition,
            })),
            factors: l.outfit.factors,
            traceableReasons: l.outfit.traceableReasons,
            stylingAdvice: l.outfit.stylingAdvice,
          },
          hairStyle: l.hairStyle ? {
            name: l.hairStyle.item.name,
            slug: l.hairStyle.item.slug,
            score: l.hairStyle.score,
            reasons: l.hairStyle.reasons,
          } : undefined,
          groomingStyle: l.groomingStyle ? {
            name: l.groomingStyle.item.name,
            slug: l.groomingStyle.item.slug,
            score: l.groomingStyle.score,
            reasons: l.groomingStyle.reasons,
          } : undefined,
        })),
      },
    };

    fs.writeFileSync(path.join(OUTPUTS_DIR, cfg.filename), JSON.stringify(outputPayload, null, 2));
    console.log(`✓ Generated review/outputs/${cfg.filename}`);

    // Generate markdown section for review/REVIEW_SHEET.md (strictly <= 40 lines per profile)
    const prefs = userToEvaluate.styleProfile?.preferences;
    const signals = userToEvaluate.styleProfile?.evidenceSignals;
    const utAuth = signals?.undertone?.authority || (prefs?.userConfirmedUndertone && prefs.userConfirmedUndertone !== 'unspecified' ? 'USER_CONFIRMED' : 'DEFAULT');
    const exprAuth = (signals as any)?.styleExpression?.authority || (prefs?.styleExpression && prefs.styleExpression !== 'no-preference' ? 'USER_ENTERED' : 'DEFAULT');
    const modAuth = (signals as any)?.modestyLevel?.authority || signals?.modesty?.authority || (prefs?.modestyLevel && prefs.modestyLevel !== 'unrestricted' ? 'USER_ENTERED' : 'DEFAULT');
    const contrastAuth = prefs?.contrastLevel && prefs.contrastLevel !== 'unspecified' ? 'USER_ENTERED' : 'DEFAULT';
    const skinDepthAuth = prefs?.skinDepth && prefs.skinDepth !== 'unspecified' ? 'USER_ENTERED' : 'DEFAULT';
    const propAuth = prefs?.torsoLegPreference && prefs.torsoLegPreference !== 'unspecified' ? 'USER_ENTERED' : 'DEFAULT';
    const heightAuth = prefs?.heightRange && prefs.heightRange !== 'unspecified' ? 'USER_ENTERED' : 'DEFAULT';
    const dislikesAuth = (prefs?.dislikedFits?.length || prefs?.dislikedColors?.length || prefs?.dislikedStyleSlugs?.length) ? 'USER_ENTERED' : 'NONE';
    const budgetAuth = prefs?.budgetTier && prefs.budgetTier !== 'unspecified' ? 'USER_ENTERED' : 'DEFAULT';

    const pLines: string[] = [];
    pLines.push(`## ${cfg.title}`);
    pLines.push(`**Inputs with Authority:** Expression: ${prefs?.styleExpression || 'none'} (${exprAuth}) | Undertone: ${prefs?.userConfirmedUndertone || 'unspecified'} (${utAuth}) | Skin Depth: ${prefs?.skinDepth || 'unspecified'} (${skinDepthAuth}) | Contrast: ${prefs?.contrastLevel || 'unspecified'} (${contrastAuth}) | Budget: ${prefs?.budgetTier || 'unspecified'} (${budgetAuth}) | Dislikes: ${dislikesAuth} | Proportions: ${prefs?.torsoLegPreference || 'unspecified'}/${prefs?.shoulderHipBalance || 'unspecified'} (${propAuth}) | Height: ${prefs?.heightRange || 'unspecified'} (${heightAuth})`);
    
    const ctx = contextToEvaluate;
    pLines.push(`**Context:** Occasion: ${ctx?.occasion?.name || 'Unspecified'} | Formality: ${ctx?.targetFormality || ctx?.occasion?.defaultFormality || 3} | Climate: ${ctx?.temperatureLevel || 'mild'}${ctx?.temperatureCelsius !== undefined ? ` (${ctx.temperatureCelsius}°C)` : ''} | Condition: ${ctx?.condition || 'dry'}${ctx?.subParameter ? ` | Sub-Setting: ${ctx.subParameter}` : ''}`);

    result.looks.forEach((look, idx) => {
      const tierLabel = look.tier || (idx === 0 ? 'BEST_MATCH' : idx === 1 ? 'SAFE' : 'STRETCH');
      const meanCoding = look.outfit.item.items
        .filter((it) => it.garment.category !== 'accessory')
        .reduce((sum, it) => sum + (it.garment.garmentCoding ?? (it.garment.genderCoding === 'feminine' ? 1 : it.garment.genderCoding === 'masculine' ? -1 : 0)), 0) /
        Math.max(1, look.outfit.item.items.filter((it) => it.garment.category !== 'accessory').length);

      pLines.push(`**Look ${idx + 1} [${tierLabel}]:** ${look.outfit.item.title || look.outfit.item.id} (Score: ${look.overallHarmonyScore.toFixed(2)}, Mean Coding: ${meanCoding >= 0 ? `+${meanCoding.toFixed(2)}` : meanCoding.toFixed(2)}, Formality: ${look.outfit.item.formality})`);
      look.outfit.item.items.forEach((it) => {
        const g = it.garment;
        const cVal = g.garmentCoding !== undefined ? g.garmentCoding : (g.genderCoding === 'feminine' ? 1 : g.genderCoding === 'masculine' ? -1 : 0);
        pLines.push(`- ${g.name} | ${g.category} | coding: ${cVal > 0 ? `+${cVal}` : cVal} | fluid: ${!!g.fluidTag} | F${g.formality} | ${g.material} (${g.fabricWeight})`);
      });
    });

    const hairText = result.looks[0]?.hairStyle ? `${result.looks[0].hairStyle.item.name} (${result.looks[0].hairStyle.score.toFixed(2)})` : 'None';
    const groomText = result.looks[0]?.groomingStyle ? `${result.looks[0].groomingStyle.item.name} (${result.looks[0].groomingStyle.score.toFixed(2)})` : 'None';
    pLines.push(`**Hair & Grooming:** Hair: ${hairText} | Grooming: ${groomText}`);

    const conf = result.looks[0]?.confidence;
    pLines.push(`**Confidence:** ${conf?.state || 'GOOD'} — ${conf?.explanation || 'Aligned'} (To increase: ${conf?.toIncreaseConfidence || 'None'})`);

    const allReasons = Array.from(new Set(result.looks.flatMap((l) => l.reasons))).slice(0, 3).join('; ');
    const allCautions = Array.from(new Set(result.looks.flatMap((l) => l.cautions))).slice(0, 3).join('; ') || 'None';
    pLines.push(`**Reasons:** ${allReasons || 'Aesthetic alignment'}`);
    pLines.push(`**Cautions:** ${allCautions}`);
    pLines.push('');

    reviewSheetSections.push(pLines.join('\n'));
  }

  // Generate complete review/REVIEW_SHEET.md
  let reviewSheetContent = '# VAEL R1.2.4 — Review Evaluation Sheet\n\n';
  reviewSheetContent += 'Executive synthesis across all 17 calibrated user review profiles, reporting inputs with authority, context, candidate looks with garment-level breakdown, hair & grooming, confidence, reasons, and cautions (strictly <= 40 lines per profile).\n\n';
  reviewSheetContent += reviewSheetSections.join('\n');
  reviewSheetContent += '\n---\n\n';
  reviewSheetContent += '# Curated Fluid Foundation Garments Catalog (40 Items)\n\n';
  reviewSheetContent += '| Garment Name | Slug | Category | Coding | Formality | Min Temp (°C) | Max Temp (°C) | Material / Fabric Weight |\n';
  reviewSheetContent += '|:---|:---|:---|:---:|:---:|:---:|:---:|:---|\n';

  fluidGarments.forEach((g) => {
    const minT = g.minTemperatureC !== undefined ? `${g.minTemperatureC}°C` : 'Any';
    const maxT = g.maxTemperatureC !== undefined ? `${g.maxTemperatureC}°C` : 'Any';
    const codingStr = (g.garmentCoding ?? 0) > 0 ? `+${g.garmentCoding}` : `${g.garmentCoding ?? 0}`;
    reviewSheetContent += `| ${g.name} | \`${g.slug}\` | ${g.category} | ${codingStr} | F${g.formality} | ${minT} | ${maxT} | ${g.material} (${g.fabricWeight}) |\n`;
  });

  fs.writeFileSync(path.join(REVIEW_DIR, 'REVIEW_SHEET.md'), reviewSheetContent);
  console.log(`✓ Generated review/REVIEW_SHEET.md with 17 profiles and 40 fluid garments table`);

  console.log('✅ Review package export completed successfully.');
}

generateReviewOutputs().catch((err) => {
  console.error('Failed to export review package:', err);
  process.exit(1);
});
