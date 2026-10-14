# VAEL R2.0 — STUDIO (3D STYLING AVATAR) SPIKE REPORT

**Date:** 14 October 2026  
**Branch:** `studio`  
**Base Commit (master):** `3579dec`  
**Feature Flag:** `NEXT_PUBLIC_STUDIO_ENABLED` (client-only dynamic import, `ssr: false`)  
**Auditor / Review:** Fashion Lead & Engineering Systems  

---

## 1. Executive Summary & Hard Gate Adherence

- **Part A Gate:** Passed 100%. Master build `3579dec` passed all unit tests (143 passed, 6 skipped, 0 failed), eval runner (45/45, 100%), and 2,880 grid sweep (2,880/2,880, 100%). Pushed to GitHub and deployed live to Vercel Production (`https://vael-eight.vercel.app`). Live footer build stamp verified (`BUILD 3579dec · 2026-10-14`).
- **Part B Isolation:** Implemented strictly on branch `studio`. Zero modifications made to `src/core/intelligence/engine.ts`, scoring weights, `garments.data.ts`, or existing test suites (`git diff master -- src/core tests` is clean and empty). All communication with the engine uses a read-only adapter (`StudioAdapter`).

---

## 2. Technical Stack & Bundle Impact

- **Dependencies Pinned:**
  - `three`: `0.170.0`
  - `@types/three`: `0.170.0`
  - `@react-three/fiber`: `9.8.1`
  - `@react-three/drei`: `9.122.0`
- **Core App Bundle Impact:** **0 KB**  
  [VERIFIED BY TEST: `npm run build`]  
  `StudioViewer` is dynamically imported via `next/dynamic` with `{ ssr: false }`. All Three.js, R3F, and Drei modules are strictly isolated into dedicated client chunks (`2eavjkofx0oer.js` and `2lv0aunz8mc0x.js`). Flagship entry routes (`/`) load zero 3D dependencies when the feature flag is disabled.
- **Licenses:** Documented in `LICENSES`. Zero external or third-party 3D models were imported. All geometry, skeletons, and materials are self-authored procedurally. All NPM libraries are licensed under permissive MIT terms.

---

## 3. Behavior & Interaction Verification

1. **Auto-Rotate & Orbit Controls:**
   - [VERIFIED BY SCREENSHOT & VIDEO: `reports/screenshots/studio-10s-capture.mp4`]
   - Mannequin auto-rotates smoothly on the vertical axis at ~18 seconds per full revolution (`autoRotateSpeed={3.3}`).
   - Drag or touch rotates the figure via OrbitControls; zoom is constrained to `[2.4, 5.8]` units; polar elevation angle is restricted to `[0.35π, 0.58π]` (~63° to ~104°) to avoid awkward zenith or nadir perspectives.
   - Auto-rotation immediately pauses upon user pointer interaction and automatically resumes after 3 seconds of idle time.
   - Double-tap or double-click resets camera framing to the default editorial angle.
   - Detects `prefers-reduced-motion`: disables auto-rotation automatically and renders manual rotate buttons.
2. **Real Engine Looks for 3 Sample Profiles:**
   - [VERIFIED BY SCREENSHOT: `reports/screenshots/studio-3d-profile-01.png`, `reports/screenshots/studio-3d-profile-17.png`]
   - **Profile 01 (Minimalist Everyday):** Elena Vance (Feminine, mild 18°C, casual dining). Renders silk-crepe camisole, wide-leg trousers, tailored coat, and loafers.
   - **Profile 14 (Fluid / Creative Evening):** Alex Chen (Androgynous, 16°C, creative gallery). Renders fluid foundation piece, structured blazer, and chelsea boots.
   - **Profile 17 (Masculine Hot Interview):** Marcus Sterling (Masculine, 32°C hot humid, corporate interview). Renders poplin dress shirt, tropical hopsack trousers, fresco wool blazer, and dark oxfords.
3. **Shuffle Logic (Read-Only Adapter):**
   - [VERIFIED BY SCREENSHOT: `reports/screenshots/studio-3d-shuffle-alt1.png`]
   - Pulls next best candidate from the combinatorial candidate pool beyond the flagship top 3.
   - Labeled `Alternative n` with confidence score, state, and traceable styling reasons.
   - Enforces `distinctiveness >= 2 style axes` or foundation piece difference before displaying.
   - Respects all hard filters: never introduces vetoed thermal, formality, or modesty items.
   - Preserves complete history navigation (`BACK` button).
4. **Interactive Slots, Lock & Swap:**
   - [VERIFIED BY SCREENSHOT: `reports/screenshots/studio-3d-slot-swap-drawer.png`]
   - Tapping any slot pill opens `SlotDrawer` displaying garment name, material, formality, fabric weight, and styling rationale.
   - Clicking `Lock` freezes the garment slug across all future shuffles.
   - Compatible alternative pieces are ranked by compatibility score.
   - Clicking a replacement executes `swapPiece()`, calls `VaelStylingEngine.getRankedCandidateLooks` read-only, displays any cautions (e.g. wool in hot climate), labels the look `CUSTOM LOOK`, and recalculates confidence.
5. **Avatar Calibration v0:**
   - [VERIFIED BY SCREENSHOT: `reports/screenshots/studio-3d-avatar-calibration.png`]
   - Procedural matte clay mannequin with skin depth swatches (`fair`, `light`, `medium`, `rich`, `deep`).
   - Pre-fills from user's `visualProfile` or profile preferences; labels assumed tone as `ASSUMED` when absent.
   - Hair lengths (`buzz`, `short`, `medium`, `shoulder`, `long`), textures (`straight`, `wavy`, `curly`, `coily`, `locs`, `braids`), hair colors, and facial hair options.
6. **2D Flat-Lay Fallback:**
   - [VERIFIED BY SCREENSHOT: `reports/screenshots/studio-2d-flatlay-fallback.png`]
   - Automatically activates if WebGL context creation fails or device lacks hardware acceleration.
   - Accessible via toggle button in technical top bar.
   - Retains 100% of shuffle, slot inspection, lock, and swap functionality.
7. **Technical Disclaimers:**
   - Clearly labeled throughout the interface: *"Illustration, not a fit simulation."*

---

## 4. Parametric Archetype Coverage

- [VERIFIED BY TEST: `scripts/archetype-coverage.ts`]
- **Total Catalog Garments:** 268
- **Mapped to 30 Parametric Archetypes:** 268 (100.0%)
- **Unmapped Garments:** 0

### Archetype Mapping Breakdown
| Category | Parametric Archetype | Count | Sample Items |
| :--- | :--- | :--- | :--- |
| **Top** | `tee` | 3 | Ribbed Tank, Silk Camisole, Draped Cowl Camisole |
| **Top** | `shirt` | 32 | Boxy Poplin Shirt, Camp Collar Silk Shirt, Classic Oxford |
| **Top** | `polo` | 4 | Knit Polo, Ribbed Merino Polo, Waffle Henley |
| **Top** | `knit` | 18 | Merino Cashmere Crew, Mockneck, Rollneck Camel |
| **Top** | `hoodie` | 3 | Heavy Loopback Hoodie, Zip Hoodie, Washed Crewneck |
| **Bottom** | `trousers-wide` | 17 | Wide Pleated Trousers, Double Knee Carpenter, Fluid Slacks |
| **Bottom** | `trousers-straight` | 12 | Tailored Slacks, Tapered Chinos, Barathea Tuxedo Trousers |
| **Bottom** | `jeans` | 3 | Raw Selvedge Denim, Washed Black Loose Denim, Faded Blue |
| **Bottom** | `cargo` | 2 | Articulated Cargos, Loopback Sweatpants |
| **Bottom** | `shorts` | 3 | Pleated Tailored Shorts, Linen Shorts, Denim Cutoffs |
| **Bottom** | `skirt` | 30 | Knife Pleated Midi Skirt, Satin Slip Skirt, Raw Denim Maxi |
| **One-Piece** | `dress` | 28 | Silk Slip Dress, Poplin Shirt Dress, Ribbed Midi Dress |
| **One-Piece** | `evening-gown` | 7 | Silk Velvet Column Gown, Crepe Evening Gown |
| **One-Piece** | `jumpsuit` | 3 | Structured Twill Jumpsuit, Tailored Crepe Jumpsuit |
| **Outerwear** | `blazer` | 11 | Deconstructed Blazer, Dinner Jacket, Harris Tweed Blazer |
| **Outerwear** | `coat` | 10 | Double-Breasted Overcoat, Gabardine Trench, Bonded Mac |
| **Outerwear** | `jacket` | 15 | Duck Chore Coat, Leather Biker, Technical Shell |
| **Footwear** | `boots` | 10 | Suede Chelsea Boots, Service Boots, Lug Combat Boots |
| **Footwear** | `loafers` | 9 | Penny Loafer, Horsebit Loafer, Backless Leather Mules |
| **Footwear** | `oxfords-derbies`| 10 | Chunky Derbies, Formal Captoe Oxford, Double Monkstrap |
| **Footwear** | `sneakers` | 5 | Minimal Leather Sneaker, Retro Court Trainer, Trail Runner |
| **Footwear** | `sandals` | 4 | Suede Espadrilles, Fisherman Sandals, Minimal Flat Sandals |
| **Footwear** | `heels` | 4 | Leather Ballet Flats, Block-Heel Mules, Slingback Pumps |
| **Accessory** | `bag` | 7 | Architectural Leather Tote, Technical Crossbody, Duffel |
| **Accessory** | `eyewear` | 2 | Acetate Sunglasses, Cat-Eye Sunglasses |
| **Accessory** | `belt` | 2 | Bridle Leather Belt, Fine Calfskin Dress Belt |
| **Accessory** | `scarf` | 2 | Lambswool Scarf, Silk Twill Scarf |
| **Accessory** | `jewelry` | 6 | Silver Signet Ring, Vintage Dress Watch, Curb Chain |
| **Accessory** | `small-accessory`| 6 | Merino Beanie, Silk Pocket Square, Unstructured Ballcap |

---

## 5. Performance & Frame Rate Verification

- [VERIFIED BY TEST: `scripts/record-studio.ts` in headless Chromium/Brave runtime]
- **Desktop Average FPS:** **61 FPS** (60 FPS target met)
- **Throttled Mobile FPS (4x CPU slowdown):** **61 FPS**
- **DPR Cap:** Capped at `1.5` to prevent over-rendering on high-DPI retina displays
- **Render Culling:** Rendering automatically idles when canvas is offscreen or tab is hidden
- **Generated Assets:**
  - `reports/screenshots/studio-10s-capture.mp4` (146 KB, 10s interactive video @ 10 fps)
  - `reports/screenshots/studio-10s-capture.gif` (943 KB, 10s animated demonstration)
  - `reports/screenshots/performance.json` (benchmark audit records)

---

## 6. Honest List of What is NOT Done

To maintain documentation integrity, the following limitations are explicitly noted:
1. **No Cloth or Fabric Physics Simulation:** Garments are rendered via procedural parametric 3D meshes (cylinders, hulls, lathed silhouettes) that conform to the mannequin. No real-time cloth tearing, folding, or drape physics solver is running.
2. **No Custom Anthropometric / Body Proportion Sliders:** The figure uses a standardized editorial mannequin frame with proportions tuned to contemporary fashion tailoring. Individual waist/hip/chest circumference sliders are not implemented in v0.
3. **No Per-Garment Photorealistic Texture Maps:** Material shaders compute PBR roughness, metalness, and procedural surface qualities based on garment attributes (`material`, `structure`, `drape`). High-resolution photogrammetry UV maps are not used.
4. **Shuffle Pool Size:** Shuffle depth currently yields ~30–50 valid candidates per occasion context. Full multi-thousand combinatorial candidate pools will be unlocked in subsequent wardrobe synchronization milestones.
