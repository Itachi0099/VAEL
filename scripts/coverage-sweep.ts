import { recommendationService } from '../src/core/services';
import { knowledgeBase } from '../src/core/knowledge';
import { VaelStylingEngine } from '../src/core/intelligence/engine';
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
  console.log(`Starting Metric v4 sweep across ${totalCells} cells (${expressions.length} expressions × ${totalPairs} occasion-formality pairs × ${temperatures.length} temps × ${conditions.length} conditions × ${modestyLevels.length} modesty levels)...`);

  let completeLooks = 0;
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
  // Metric v4 definition:
  // - Foundation pieces only: top, bottom, one-piece, outerwear, footwear (NOT accessories)
  // - Feminine: look mean coding >= +0.25
  // - Masculine: look mean coding <= -0.25
  // - Androgynous: |mean coding| <= 0.25 AND (>= 1 curated-fluid NON-footwear piece OR >= 2 curated-fluid foundation pieces)
  // - No-preference: any look matches
  // - Cell passes if >= 2 of 3 looks match the expression criteria
  const groupStats: Record<string, { totalCells: number; alignedCells: number; failingCells: any[] }> = {};

  // Variety tracking per expression:
  const bestMatchCounts: Record<StyleExpression, Record<string, { title: string; count: number }>> = {
    masculine: {},
    feminine: {},
    androgynous: {},
    'no-preference': {},
    unspecified: {},
  };

  // Feminine separates reconciliation tracking:
  let feminineTotalLooks = 0;
  let feminineSeparatesCount = 0;
  let feminineOnePieceCount = 0;
  let feminineOtherCount = 0;

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

                // Track Best Match Variety
                if (res.bestMatch) {
                  const bId = res.bestMatch.outfit.item.id;
                  const bTitle = res.bestMatch.outfit.item.title;
                  if (!bestMatchCounts[expr][bId]) {
                    bestMatchCounts[expr][bId] = { title: bTitle, count: 0 };
                  }
                  bestMatchCounts[expr][bId].count++;
                }

                // Metric v4 alignment evaluation
                let matchingLooksCount = 0;
                for (const look of returnedLooks) {
                  const foundationPieces = look.outfit.item.items
                    .map((i) => i.garment)
                    .filter((g) => g.category !== 'accessory');

                  if (foundationPieces.length === 0) continue;
                  const sumCoding = foundationPieces.reduce((acc, g) => acc + (g.garmentCoding !== undefined ? g.garmentCoding : (g.genderCoding === 'masculine' ? -1 : g.genderCoding === 'feminine' ? 1 : 0)), 0);
                  const meanCoding = sumCoding / foundationPieces.length;

                  // Metric v4 Curated Fluid counts:
                  const nonFootwearCuratedFluid = foundationPieces.filter((g) => g.category !== 'footwear' && g.fluidTag === true).length;
                  const totalCuratedFluid = foundationPieces.filter((g) => g.fluidTag === true).length;
                  const fluidPass = nonFootwearCuratedFluid >= 1 || totalCuratedFluid >= 2;

                  let lookMatches = false;
                  if (expr === 'feminine') {
                    lookMatches = meanCoding >= 0.25;
                  } else if (expr === 'masculine') {
                    lookMatches = meanCoding <= -0.25;
                  } else if (expr === 'androgynous') {
                    lookMatches = Math.abs(meanCoding) <= 0.25 && fluidPass;
                  } else {
                    lookMatches = true;
                  }

                  if (lookMatches) matchingLooksCount++;

                  // Feminine look type accounting across all 740 feminine cells
                  if (expr === 'feminine') {
                    feminineTotalLooks++;
                    const hasTop = foundationPieces.some((g) => g.category === 'top');
                    const hasBottom = foundationPieces.some((g) => g.category === 'bottom');
                    const hasOnePiece = foundationPieces.some((g) => g.category === 'one-piece');

                    if (hasTop && hasBottom && !hasOnePiece) {
                      feminineSeparatesCount++;
                    } else if (hasOnePiece) {
                      feminineOnePieceCount++;
                    } else {
                      feminineOtherCount++;
                    }
                  }
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
  console.log(`\nSweep complete in ${durationSec}s.`);
  console.log(`Total Cells: ${totalCells}`);
  console.log(`Viable 3-Look Cells: ${completeLooks} (${((completeLooks / totalCells) * 100).toFixed(1)}%)`);
  console.log(`Under-3 Look Cells: ${underThreeCells.length}`);

  console.log('\n--- STRICT ALIGNMENT METRIC V4 PER CELL GROUP ---');
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

  console.log('\n--- FEMININE LOOK RECONCILIATION ---');
  console.log(`True Denominator (740 cells × 3 looks): ${feminineTotalLooks}`);
  console.log(`Separates Looks: ${feminineSeparatesCount} (${((feminineSeparatesCount / feminineTotalLooks) * 100).toFixed(1)}%)`);
  console.log(`One-Piece Looks: ${feminineOnePieceCount} (${((feminineOnePieceCount / feminineTotalLooks) * 100).toFixed(1)}%)`);
  console.log(`Other/Fallback Looks: ${feminineOtherCount} (${((feminineOtherCount / feminineTotalLooks) * 100).toFixed(1)}%)`);
  console.log(`Sum: ${feminineSeparatesCount + feminineOnePieceCount + feminineOtherCount} / ${feminineTotalLooks}`);

  console.log('\n--- VARIETY ANALYSIS PER EXPRESSION ---');
  const varietyReport: Record<string, any> = {};
  for (const expr of expressions) {
    const counts = bestMatchCounts[expr];
    const distinctCount = Object.keys(counts).length;
    const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
    const top5 = sorted.slice(0, 5).map(([id, data]) => ({
      id,
      title: data.title,
      cellCount: data.count,
      cellShare: `${((data.count / 740) * 100).toFixed(1)}%`,
    }));
    varietyReport[expr] = {
      distinctBestMatchLooks: distinctCount,
      top5Repeated: top5,
    };
    console.log(`\n[${expr.toUpperCase()}] Distinct Best-Match Looks: ${distinctCount} / 740 cells`);
    top5.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title} (${t.id}): ${t.cellCount} cells (${t.cellShare})`);
    });
  }

  // Dress and skirt counts by formality x temperature
  console.log('\n--- DRESS AND SKIRT MATRIX (FORMALITY × TEMPERATURE) ---');
  const allGarments = knowledgeBase.getAllGarments();
  const dresses = allGarments.filter((g) => g.subcategory === 'dress' || g.subcategory === 'gown');
  const skirts = allGarments.filter((g) => g.subcategory === 'skirt');

  console.log(`Total Dresses: ${dresses.length}`);
  console.log(`Total Skirts: ${skirts.length}`);

  const formalityLevels = [1, 2, 3, 4, 5];
  const matrix: Record<string, any> = { dresses: {}, skirts: {} };
  for (const f of formalityLevels) {
    matrix.dresses[`F${f}`] = {};
    matrix.skirts[`F${f}`] = {};
    for (const t of temperatures) {
      const dCount = dresses.filter((d) => d.formality === f && (d.compatibleWeather as string[]).includes(t)).length;
      const sCount = skirts.filter((s) => s.formality === f && (s.compatibleWeather as string[]).includes(t)).length;
      matrix.dresses[`F${f}`][t] = dCount;
      matrix.skirts[`F${f}`][t] = sCount;
    }
  }

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const report = {
    totalCells,
    viableThreeLookCells: completeLooks,
    underThreeCellsCount: underThreeCells.length,
    underThreeCellsList: underThreeCells,
    groupAlignmentResults: groupResults,
    allGroupsPassedTarget: allGroupsPassed,
    feminineReconciliation: {
      totalLooks: feminineTotalLooks,
      separatesCount: feminineSeparatesCount,
      separatesShare: `${((feminineSeparatesCount / feminineTotalLooks) * 100).toFixed(1)}%`,
      onePieceCount: feminineOnePieceCount,
      onePieceShare: `${((feminineOnePieceCount / feminineTotalLooks) * 100).toFixed(1)}%`,
      otherCount: feminineOtherCount,
      otherShare: `${((feminineOtherCount / feminineTotalLooks) * 100).toFixed(1)}%`,
    },
    varietyReport,
    garmentMatrix: matrix,
    failingCellsByGroup: Object.fromEntries(
      Object.entries(groupStats)
        .filter(([_, s]) => s.failingCells.length > 0)
        .map(([g, s]) => [g, s.failingCells])
    ),
  };

  fs.writeFileSync(path.join(reportsDir, 'coverage-sweep-results.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(reportsDir, 'coverage-sweep-v4.csv'), csvRows.join('\n'));
  console.log(`\nReport written to reports/coverage-sweep-results.json`);
  console.log(`Per-cell CSV written to reports/coverage-sweep-v4.csv`);
}

runSweep().catch(console.error);
