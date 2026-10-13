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
  const occasions = knowledgeBase.getAllOccasions();
  const temperatures: TemperatureLevel[] = ['cold', 'cool', 'mild', 'warm', 'hot'];
  const conditions: WeatherConditionType[] = ['dry', 'rain'];
  const modestyLevels: ModestyLevel[] = ['unrestricted', 'covered-both'];

  // 37 occasion-formality pairs across 12 occasions
  let totalPairs = 0;
  for (const occ of occasions) {
    const [minF, maxF] = occ.allowableFormalityRange;
    totalPairs += (maxF - minF + 1);
  }

  const totalCells = expressions.length * totalPairs * temperatures.length * conditions.length * modestyLevels.length;
  console.log(`Starting Metric v3 sweep across ${totalCells} cells (${expressions.length} expressions × ${totalPairs} occasion-formality pairs × ${temperatures.length} temps × ${conditions.length} conditions × ${modestyLevels.length} modesty levels)...`);

  let completeLooks = 0; // Exactly 3 distinct looks
  const underThreeCells: Array<{
    expression: string;
    occasion: string;
    formality: number;
    temp: string;
    condition: string;
    modesty: string;
    lookCount: number;
    reason: string;
  }> = [];

  const csvRows: string[] = ['expression,occasion,formality,temperature,condition,modesty,looks_count,matching_looks_count,status,look_ids'];

  // Group metrics: (expression, occasionCategory) -> { totalCells, alignedCells, failingCells }
  // Metric v3 definition:
  // - Foundation pieces only: top, bottom, one-piece, outerwear, footwear (NOT accessories)
  // - Feminine: look mean coding >= +0.25
  // - Masculine: look mean coding <= -0.25
  // - Androgynous: |mean coding| <= 0.25 AND >= 1 curated-fluid foundation piece (fluidTag === true)
  // - No-preference: any look matches
  // - Cell passes if >= 2 of 3 looks match the expression criteria
  const groupStats: Record<string, { totalCells: number; alignedCells: number; failingCells: any[] }> = {};

  let processed = 0;
  const startTime = Date.now();

  for (const expr of expressions) {
    for (const occasion of occasions) {
      const groupKey = `${expr} | ${occasion.category}`;
      if (!groupStats[groupKey]) {
        groupStats[groupKey] = { totalCells: 0, alignedCells: 0, failingCells: [] };
      }

      const [minF, maxF] = occasion.allowableFormalityRange;
      for (let f = minF; f <= maxF; f++) {
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
                targetFormality: f as any,
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
                    occasion: occasion.slug,
                    formality: f,
                    temp,
                    condition: cond,
                    modesty,
                    lookCount: count,
                    reason: count < 3 ? 'Catalog hard constraints yielded fewer than 3 valid outfits' : 'Unknown',
                  });
                }

                // Metric v3 alignment evaluation
                let matchingLooksCount = 0;
                for (const look of returnedLooks) {
                  const foundationPieces = look.outfit.item.items
                    .map((i) => i.garment)
                    .filter((g) => g.category !== 'accessory');

                  if (foundationPieces.length === 0) continue;
                  const sumCoding = foundationPieces.reduce((acc, g) => acc + (g.garmentCoding !== undefined ? g.garmentCoding : (g.genderCoding === 'masculine' ? -1 : g.genderCoding === 'feminine' ? 1 : 0)), 0);
                  const meanCoding = sumCoding / foundationPieces.length;
                  const hasCuratedFluid = foundationPieces.some((g) => g.fluidTag === true);

                  let lookMatches = false;
                  if (expr === 'feminine') {
                    lookMatches = meanCoding >= 0.25;
                  } else if (expr === 'masculine') {
                    lookMatches = meanCoding <= -0.25;
                  } else if (expr === 'androgynous') {
                    lookMatches = Math.abs(meanCoding) <= 0.25 && hasCuratedFluid;
                  } else {
                    lookMatches = true;
                  }

                  if (lookMatches) matchingLooksCount++;
                }

                const status = matchingLooksCount >= 2 ? 'PASS' : 'FAIL';
                const lookIds = returnedLooks.map(l => l.outfit.item.id).join(';');
                csvRows.push(`${expr},${occasion.slug},${f},${temp},${cond},${modesty},${count},${matchingLooksCount},${status},${lookIds}`);

                if (matchingLooksCount >= 2) {
                  groupStats[groupKey].alignedCells++;
                } else {
                  groupStats[groupKey].failingCells.push({
                    expression: expr,
                    occasion: occasion.slug,
                    formality: f,
                    temp,
                    condition: cond,
                    modesty,
                    matchingLooksCount,
                    totalLooks: count,
                    lookIds,
                  });
                }
              } catch (err: any) {
                underThreeCells.push({
                  expression: expr,
                  occasion: occasion.slug,
                  formality: f,
                  temp,
                  condition: cond,
                  modesty,
                  lookCount: 0,
                  reason: err.message || 'Engine threw exception',
                });
                groupStats[groupKey].failingCells.push({
                  expression: expr,
                  occasion: occasion.slug,
                  formality: f,
                  temp,
                  condition: cond,
                  modesty,
                  error: err.message,
                });
                csvRows.push(`${expr},${occasion.slug},${f},${temp},${cond},${modesty},0,0,ERROR,${err.message}`);
              }
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

  console.log('\n--- STRICT ALIGNMENT METRIC V3 PER CELL GROUP ---');
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
  fs.writeFileSync(path.join(reportsDir, 'coverage-sweep-v3.csv'), csvRows.join('\n'));
  console.log(`Report written to reports/coverage-sweep-results.json`);
  console.log(`Per-cell CSV written to reports/coverage-sweep-v3.csv`);
}

runSweep().catch(console.error);
