import { recommendationService } from '../src/core/services';
import { knowledgeBase } from '../src/core/knowledge';
import { User, VisualProfile, Context, TemperatureLevel, WeatherConditionType, ModestyLevel, StyleExpression } from '../src/core/domain';
import * as fs from 'fs';
import * as path from 'path';

async function runSweep() {
  const baseVisual: VisualProfile = {
    id: 'vis_sweep',
    userId: 'usr_sweep',
    face: { shape: 'oval', jaw: 'angular', hasFacialHair: false },
    hair: { texture: 'straight', density: 'medium', length: 'medium', volume: 'moderate' },
    body: { silhouette: 'rectangle' },
    source: 'user_input',
    confidenceScore: 1.0,
    lastObservedAt: new Date().toISOString(),
  };

  const expressions: StyleExpression[] = ['masculine', 'feminine', 'androgynous', 'no-preference'];
  const occasions = knowledgeBase.getAllOccasions().map(o => o.slug); // 12 occasions
  const temperatures: TemperatureLevel[] = ['cold', 'cool', 'mild', 'warm', 'hot']; // 5 temps
  const conditions: WeatherConditionType[] = ['dry', 'rain']; // 2 conditions
  const modestyLevels: ModestyLevel[] = ['unrestricted', 'covered-both']; // 2 modesty levels

  const totalCells = expressions.length * occasions.length * temperatures.length * conditions.length * modestyLevels.length;
  console.log(`Starting sweep across ${totalCells} cells (${expressions.length} expressions × ${occasions.length} occasions × ${temperatures.length} temps × ${conditions.length} conditions × ${modestyLevels.length} modesty levels)...`);

  let completeLooks = 0; // Exactly 3 distinct looks
  const underThreeCells: Array<{
    expression: string;
    occasion: string;
    temp: string;
    condition: string;
    modesty: string;
    lookCount: number;
    reason: string;
  }> = [];

  // Group metrics: (expression, occasionCategory) -> { totalCells, alignedCells, failingCells }
  // A cell is aligned if >= 2 of 3 returned looks contain a matching coded item:
  // - masculine expression: masculine-coded item (garmentCoding < 0 or genderCoding === 'masculine')
  // - feminine expression: feminine-coded item (garmentCoding > 0 or genderCoding === 'feminine')
  // - androgynous expression: curated fluid/androgynous item (fluidTag === true or genderCoding === 'androgynous')
  // - no-preference: neutral/balanced
  const groupStats: Record<string, { totalCells: number; alignedCells: number; failingCells: any[] }> = {};

  let processed = 0;
  const startTime = Date.now();

  for (const expr of expressions) {
    for (const occSlug of occasions) {
      const occasion = knowledgeBase.getOccasionBySlug(occSlug)!;
      const groupKey = `${expr} | ${occasion.category}`;
      if (!groupStats[groupKey]) {
        groupStats[groupKey] = { totalCells: 0, alignedCells: 0, failingCells: [] };
      }

      for (const temp of temperatures) {
        for (const cond of conditions) {
          for (const modesty of modestyLevels) {
            processed++;
            groupStats[groupKey].totalCells++;

            const testUser: User = {
              id: 'usr_sweep',
              name: 'Sweep User',
              handle: 'sweep',
              createdAt: new Date().toISOString(),
              visualProfile: baseVisual,
              styleProfile: {
                id: 'sty_sweep',
                userId: 'usr_sweep',
                dominantAestheticSlugs: ['minimal'],
                styleVector: knowledgeBase.getStyleBySlug('minimal')!.styleVector,
                preferences: {
                  preferredStyleSlugs: ['minimal'],
                  dislikedStyleSlugs: [],
                  preferredColors: ['black', 'charcoal', 'navy', 'white'],
                  dislikedColors: [],
                  preferredFits: ['relaxed', 'regular'],
                  dislikedFits: ['skinny'],
                  preferredSilhouettes: [],
                  dislikedSilhouettes: [],
                  fitProportions: {
                    preferredFits: ['relaxed', 'regular'],
                    dislikedFits: ['skinny'],
                    topVolume: 3,
                    bottomVolume: 3,
                    preferredSilhouettes: [],
                    dislikedSilhouettes: [],
                    layeringPreference: 'moderate',
                    garmentLengthPreferences: { top: 'regular', bottom: 'regular' },
                  },
                  modestyLevel: modesty,
                  userConfirmedUndertone: 'neutral',
                  genderIdentity: 'unspecified',
                  styleExpression: expr,
                  genderCodingDirection: expr === 'no-preference' ? 'unspecified' : expr,
                  preferredFormalityRange: [1, 5],
                  maxMaintenanceTolerance: 'moderate',
                  accessoryAffinities: [],
                },
                feedbackProfile: { history: [], learnedStyleAffinities: {}, learnedColorAffinities: {}, learnedSilhouetteAffinities: {}, learnedFitAffinities: {}, repeatPassCount: {} },
                updatedAt: new Date().toISOString(),
              },
            };

            const context: Context = {
              occasion,
              weather: temp,
              temperatureLevel: temp,
              condition: cond,
              targetFormality: occasion.defaultFormality || 3,
            };

            try {
              const res = recommendationService.generateTopThreeLooks({ user: testUser, context });
              const returnedLooks = res.looks || [res.safe, res.bestMatch, res.stretch].filter(Boolean);
              const count = returnedLooks.length;
              if (count === 3) {
                completeLooks++;
              } else {
                underThreeCells.push({
                  expression: expr,
                  occasion: occSlug,
                  temp,
                  condition: cond,
                  modesty,
                  lookCount: count,
                  reason: count < 3 ? 'Catalog hard constraints yielded fewer than 3 valid outfits' : 'Unknown',
                });
              }

              // Evaluate strict alignment metric for this cell:
              // Count looks that contain >= 1 matching item
              let matchingLooksCount = 0;
              for (const look of returnedLooks) {
                const garments = look.outfit.item.items.map((i) => i.garment);
                let hasMatchingItem = false;
                if (expr === 'masculine') {
                  hasMatchingItem = garments.some((g) => (g.garmentCoding !== undefined && g.garmentCoding < 0) || g.genderCoding === 'masculine');
                } else if (expr === 'feminine') {
                  hasMatchingItem = garments.some((g) => (g.garmentCoding !== undefined && g.garmentCoding > 0) || g.genderCoding === 'feminine');
                } else if (expr === 'androgynous') {
                  hasMatchingItem = garments.some((g) => g.fluidTag === true || g.genderCoding === 'androgynous');
                } else {
                  // no-preference: any look is valid
                  hasMatchingItem = true;
                }
                if (hasMatchingItem) {
                  matchingLooksCount++;
                }
              }

              // Cell passes alignment if >= 2 of 3 looks contain matching coded item
              if (matchingLooksCount >= 2) {
                groupStats[groupKey].alignedCells++;
              } else {
                groupStats[groupKey].failingCells.push({
                  expression: expr,
                  occasion: occSlug,
                  temp,
                  condition: cond,
                  modesty,
                  matchingLooksCount,
                  totalLooks: count,
                });
              }
            } catch (err: any) {
              underThreeCells.push({
                expression: expr,
                occasion: occSlug,
                temp,
                condition: cond,
                modesty,
                lookCount: 0,
                reason: err.message || 'Engine threw exception',
              });
              groupStats[groupKey].failingCells.push({
                expression: expr,
                occasion: occSlug,
                temp,
                condition: cond,
                modesty,
                error: err.message,
              });
            }
          }
        }
      }
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Sweep complete in ${durationSec}s.`);
  console.log(`Total Cells: ${totalCells}`);
  console.log(`Viable 3-Look Cells: ${completeLooks} (${((completeLooks / totalCells) * 100).toFixed(1)}%)`);
  console.log(`Under-3 Look Cells: ${underThreeCells.length}`);

  console.log('\n--- STRICT ALIGNMENT METRIC PER CELL GROUP ---');
  const groupResults: Record<string, { totalCells: number; alignedCells: number; share: string; status: string; failingCount: number }> = {};
  let allGroupsPassed = true;

  for (const [group, stat] of Object.entries(groupStats)) {
    const share = (stat.alignedCells / stat.totalCells) * 100;
    const passed = share >= 90;
    if (!passed) allGroupsPassed = false;
    groupResults[group] = {
      totalCells: stat.totalCells,
      alignedCells: stat.alignedCells,
      share: `${share.toFixed(1)}%`,
      status: passed ? 'PASS (>=90%)' : 'FAIL (<90%)',
      failingCount: stat.failingCells.length,
    };
    console.log(`${group.padEnd(30)}: ${share.toFixed(1)}% (${stat.alignedCells}/${stat.totalCells}) [${passed ? 'PASS' : 'FAIL'}] - Failing cells: ${stat.failingCells.length}`);
  }

  const report = {
    totalCells,
    viableThreeLookCells: completeLooks,
    underThreeCellsCount: underThreeCells.length,
    underThreeCellsList: underThreeCells,
    groupAlignmentResults: groupResults,
    allGroupsPassedTarget: allGroupsPassed,
    failingCellsByGroup: Object.fromEntries(
      Object.entries(groupStats)
        .filter(([_, s]) => s.failingCells.length > 0)
        .map(([g, s]) => [g, s.failingCells])
    ),
  };

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(reportsDir, 'coverage-sweep-results.json'), JSON.stringify(report, null, 2));
  console.log(`Report written to reports/coverage-sweep-results.json`);
}

runSweep().catch(console.error);
