import * as fs from 'fs';
import * as path from 'path';
import { EVALUATION_CORPUS } from '../../../tests/evaluation/corpus';
import { VaelStylingEngine } from '../intelligence/engine';
import { KnowledgeBaseValidator } from '../knowledge/validator';

export interface EvaluationExportRecord {
  scenarioId: string;
  scenarioName: string;
  category: string;
  userContext: {
    userId: string;
    dominantAesthetics: string[];
    genderCodingDirection: string;
    temperatureCelsius?: number;
    condition?: string;
    formalityTarget?: number;
    occasion: string;
  };
  recommendations: {
    safe: {
      lookId: string;
      title: string;
      items: { name: string; category: string; material: string }[];
      confidenceState: string;
      harmonyScore: number;
      reasons: string[];
      traceableReasons: {
        reasonId: string;
        text: string;
        signalIds: string[];
        knowledgeEntryIds: string[];
        factor: string;
      }[];
    };
    bestMatch: {
      lookId: string;
      title: string;
      items: { name: string; category: string; material: string }[];
      confidenceState: string;
      harmonyScore: number;
      reasons: string[];
      traceableReasons: {
        reasonId: string;
        text: string;
        signalIds: string[];
        knowledgeEntryIds: string[];
        factor: string;
      }[];
    };
    stretch: {
      lookId: string;
      title: string;
      items: { name: string; category: string; material: string }[];
      confidenceState: string;
      harmonyScore: number;
      reasons: string[];
      traceableReasons: {
        reasonId: string;
        text: string;
        signalIds: string[];
        knowledgeEntryIds: string[];
        factor: string;
      }[];
    };
  };
  evaluationSummary: {
    assertionsPassed: number;
    totalAssertions: number;
    allPassed: boolean;
  };
}

export function exportEvaluationReport(outputPath?: string): string {
  const targetPath = outputPath || path.resolve(process.cwd(), 'reports', 'evaluation-report-r1.json');
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const kbReport = KnowledgeBaseValidator.validateAll();
  const records: EvaluationExportRecord[] = [];

  for (const scenario of EVALUATION_CORPUS) {
    const topThree = VaelStylingEngine.generateTopThreeLooks({
      user: scenario.user,
      context: scenario.context,
    });

    const assertionResults = scenario.assertions(topThree);
    const passedCount = assertionResults.filter((a) => a.passed).length;

    const mapLook = (look: typeof topThree.safe) => ({
      lookId: look.id,
      title: look.outfit.item.title,
      items: look.outfit.item.items.map((i) => ({
        name: i.garment.name,
        category: i.garment.category,
        material: i.garment.material,
      })),
      confidenceState: look.confidence.state,
      harmonyScore: look.overallHarmonyScore,
      reasons: look.reasons,
      traceableReasons: look.traceableReasons || [],
    });

    records.push({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      category: scenario.category,
      userContext: {
        userId: scenario.user.id,
        dominantAesthetics: scenario.user.styleProfile.dominantAestheticSlugs,
        genderCodingDirection: scenario.user.styleProfile.preferences.genderCodingDirection || 'androgynous',
        temperatureCelsius: scenario.context?.temperatureCelsius,
        condition: scenario.context?.condition || scenario.context?.weather,
        formalityTarget: scenario.context?.targetFormality,
        occasion: scenario.context?.occasion?.name || 'Unspecified',
      },
      recommendations: {
        safe: mapLook(topThree.safe),
        bestMatch: mapLook(topThree.bestMatch),
        stretch: mapLook(topThree.stretch),
      },
      evaluationSummary: {
        assertionsPassed: passedCount,
        totalAssertions: assertionResults.length,
        allPassed: passedCount === assertionResults.length,
      },
    });
  }

  const exportPayload = {
    version: 'R1.0-fashion-intelligence',
    generatedAt: new Date().toISOString(),
    knowledgeBaseSummary: {
      totalGarments: kbReport.totalGarments,
      totalHairstyles: kbReport.totalHairstyles,
      totalBeardStyles: kbReport.totalBeards,
      totalArchetypes: kbReport.totalStyles,
      totalOccasions: kbReport.totalOccasions,
      contradictionsCount: kbReport.errors.length,
    },
    scenariosCount: records.length,
    scenariosPassedCount: records.filter((r) => r.evaluationSummary.allPassed).length,
    scenarios: records,
  };

  fs.writeFileSync(targetPath, JSON.stringify(exportPayload, null, 2), 'utf-8');
  return targetPath;
}

// Allow direct CLI invocation
if (process.argv[1]?.includes('export-eval')) {
  const p = exportEvaluationReport();
  console.log(`✓ Machine-readable evaluation report successfully written to: ${p}`);
}
