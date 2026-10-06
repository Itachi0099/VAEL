# VAEL Canonical Domain Model Reference

The VAEL domain layer defines the entities that form the foundation of personal styling intelligence.

---

## 1. User & Identity Profile

### `User`
Root aggregate representing an individual styling subject.
- `id`: Unique identifier
- `name`: Display name
- `handle`: Public username
- `visualProfile?`: Associated `VisualProfile`
- `styleProfile`: Associated `StyleProfile`

### `VisualProfile`
Represents **objective styling observations** derived from computer vision or manual calibration. It expressly contains **no judgments of attractiveness**.
- `face`: `FaceProfile`
  - `shape`: `'oval' | 'square' | 'round' | 'rectangle' | 'heart' | 'diamond' | 'triangle'`
  - `jaw`: `'sharp' | 'soft' | 'angular' | 'prominent' | 'narrow' | 'receding'`
  - `proportions`: Forehead ratio, cheekbone prominence, facial thirds balance
  - `hasFacialHair`: boolean
  - `beardCharacteristics`: Current length, observed density, growth pattern
- `hair`: `HairProfile`
  - `texture`: `'straight' | 'wavy' | 'curly' | 'coily'`
  - `density`: `'low' | 'medium' | 'high'`
  - `length`: `'buzz' | 'short' | 'medium' | 'shoulder' | 'long'`
  - `volume`: `'flat' | 'moderate' | 'voluminous'`
- `body`: `BodyProfile`
  - `silhouette`: `'inverted-triangle' | 'rectangle' | 'trapezoid' | 'oval' | 'triangle'`
  - `shoulderToHipRatio`: `'broad-shoulders' | 'balanced' | 'wider-hips'`
  - `torsoToLegRatio`: `'balanced' | 'longer-torso' | 'longer-legs'`

### `StyleProfile`
Encapsulates taste, tolerances, and learned preferences.
- `dominantAestheticSlugs`: Primary style family alignments
- `preferences`: `PreferenceProfile`
  - Preferred / Disliked Style Slugs
  - Preferred / Disliked Colors
  - Preferred / Disliked Fits (`'skinny' | 'slim' | 'regular' | 'relaxed' | 'oversized' | 'boxy' | 'tailored'`)
  - Formality Range (`[1..5, 1..5]`)
  - Max Maintenance Tolerance (`'minimal' | 'moderate' | 'high'`)
- `feedbackProfile`: `FeedbackProfile`
  - `history`: Array of past `Feedback` events
  - `learnedStyleAffinities`: Dynamic weights `[-1.0 .. 1.0]` for styles
  - `learnedColorAffinities`: Dynamic weights `[-1.0 .. 1.0]` for colors

---

## 2. Grooming Entities

### `HairStyle`
- `id`, `slug`, `name`, `description`
- `targetLength`: `'buzz' | 'short' | 'medium' | 'shoulder' | 'long'`
- `compatibleTextures`: Array of supported textures (`straight`, `wavy`, `curly`, `coily`)
- `compatibleDensities`: Array of supported hair densities
- `compatibleFaceShapes`: Face shapes this cut flatters
- `incompatibleFaceShapes`: Face shapes that clash with this cut
- `maintenance`: Level of required barber upkeep
- `stylingDifficulty`: Daily effort required
- `formalityRange`: Minimum and maximum formality
- `compatibleStyleSlugs`: Style families this cut resonates with

### `BeardStyle`
- `id`, `slug`, `name`, `description`
- `targetLength`: Length classification
- `minimumDensity`: Minimum observed density required for full appearance
- `shapeCharacteristics`: `'sculpted' | 'natural' | 'linear' | 'chin-focused' | 'clean'`
- `compatibleFaceShapes`: Face shapes enhanced by this beard silhouette
- `maintenance`: Trimming commitment

---

## 3. Fashion & Wardrobe Entities

### `Garment`
- `category`: `'top' | 'bottom' | 'outerwear' | 'footwear' | 'accessory' | 'one-piece'`
- `subcategory`: Specific garment type (e.g., `'knit-polo'`, `'wide-trousers'`, `'chelsea-boots'`)
- `fit`: Geometric fit (`'boxy'`, `'relaxed'`, `'tailored'`, etc.)
- `silhouette`: Proportional description
- `color`: `GarmentColor` (name, hex, tone: `'neutral' | 'warm' | 'cool' | 'earth' | 'vibrant'`)
- `material`: Fabric composition
- `pattern`: Pattern intensity
- `formality`: Level 1 (ultra-casual) to 5 (black-tie)
- `seasons`: Compatible seasons
- `compatibleWeather`: Weather conditions
- `layeringRole`: `'base' | 'mid' | 'outer' | 'standalone'`

### `WardrobeItem`
User-owned garment record with wear tracking.
- `userId`: Owner ID
- `garment`: Garment definition
- `wearCount`: Frequency of usage
- `isFavorite`: User favorite flag

### `Outfit`
Harmonious composition of multiple garments.
- `items`: Array of `OutfitItem` (garment, layer position, styling note)
- `primaryStyleSlug`: Associated style family
- `formality`: Formality rating
- `silhouetteBalance`: Explainable proportion structure
- `colorStory`: Description of color palette cohesion

---

## 4. Context & Occasion

### `Occasion`
- `name`, `slug`, `category`
- `defaultFormality`: Standard formality expected
- `allowableFormalityRange`: Flexible bounds
- `guidelines`: Styling and etiquette directives
- `restrictedGarmentCategories`: Forbidden clothing items for this occasion

### `Context`
Dynamic situational state:
- `occasion`: Active `Occasion`
- `weather`: Active weather (`'hot'`, `'mild'`, `'cold'`, `'rainy'`)
- `targetFormality`: Optional formality override
- `budgetTier`: Accessible, elevated, investment

---

## 5. Recommendation & Explainability

### `Recommendation<T>`
Explainable recommendation wrapper.
- `item`: Recommended entity (`HairStyle`, `BeardStyle`, `Outfit`)
- `score`: Normalized compatibility rating `[0.00 .. 1.00]`
- `factors`: Detailed `RecommendationFactor[]` breakdown:
  - `category`: `'visual_feature' | 'occasion_fit' | 'silhouette_balance' | 'color_harmony' | 'preference_reinforcement'`
  - `weight`: Relative impact of this criterion
  - `score`: Criterion score
  - `reason`: Criterion explanation
- `reasons`: Human-readable summary reasons
- `cautions`: Potential risks or drawbacks
- `stylingAdvice`: Practical styling tips
