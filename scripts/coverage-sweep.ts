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

  let processed = 0;
  const startTime = Date.now();

  for (const expr of expressions) {
    for (const occSlug of occasions) {
      const occasion = knowledgeBase.getOccasionBySlug(occSlug)!;
      for (const temp of temperatures) {
        for (const cond of conditions) {
          for (const modesty of modestyLevels) {
            processed++;

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
              const count = [res.safe, res.bestMatch, res.stretch].filter(Boolean).length;
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

  const report = {
    totalCells,
    viableThreeLookCells: completeLooks,
    underThreeCellsCount: underThreeCells.length,
    underThreeCellsList: underThreeCells,
  };

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(reportsDir, 'coverage-sweep-results.json'), JSON.stringify(report, null, 2));
  console.log(`Report written to reports/coverage-sweep-results.json`);
}

runSweep().catch(console.error);
