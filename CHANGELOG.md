# VAEL Changelog

## [R1.2.1] - 2026-10-13

### Changed
- **Corpus Count Assertion**: Replaced the static hardcoded corpus count (152 / 154) in `tests/evaluation/corpus.test.ts` with registry-derived validation (`KnowledgeBaseValidator.validateAll()`). The test now dynamically checks that total garments and hairstyles reflect the live registry count and satisfy baseline minimums (`>= 152` garments, `>= 30` hairstyles) with zero contradictions.
- **Garment Coding Audit**: Audited and cured all 27 previously unclassified garments (`genderCoding: 'unspecified'`) into explicit, curated categories: 23 traditional heritage pieces coded as `masculine` (`garmentCoding: -1.0`), and 4 unisex accessories coded as `androgynous` (`garmentCoding: 0.0`, `fluidTag: true`).
- **Curated Fluid Attribute**: `fluidTag` is now an explicitly curated boolean property on all garments rather than being derived.
- **Catalog Gap Closure**: Added 25 new garments and 6 hairstyles tagged `reviewed_by: engineering-draft` covering evening/formal dresses across temperature bands, covered-both modest long options, jumpsuits, direction-specific tailoring, cold/rain outerwear, bags, jewelry, hosiery, and protective coily styles (goddess locs, fulani braids, senegalese twists).
- **Hair Score Weights**: Capped face-shape weight to <= 10% of total hair score (weight 1.0 out of 13.0 total = 7.7%).
- **Version Stamp & Deploy**: Configured `next.config.mjs` to map `VERCEL_GIT_COMMIT_SHA` to the client environment, showing the real deployed commit hash on Vercel and 'dev' when no hash exists.
- **Factor Labels**: Standardized UI look card compatibility factors to human-readable terms: *Style match, Color balance, Proportion, Weather fit, Dress code*.
- **Inverse Silhouette & Volume Rules**: Formalized inverse silhouette pairing (oversized top + slim/tapered bottom) in proportion evaluation; ensured zero-style baseline does not artificially bias toward Minimal; under-three look messages explicitly name the restricting constraint.
