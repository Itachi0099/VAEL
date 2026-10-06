import { EVALUATION_CORPUS } from './corpus';
import { EvaluationScenario } from './corpus-types';
import { VaelStylingEngine } from '../../src/core/intelligence/engine';
import { KnowledgeBaseValidator } from '../../src/core/knowledge/validator';

interface ScenarioResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  assertionsPassed: number;
  totalAssertions: number;
  diagnostics: string[];
}

export function runEvaluationSuite(): {
  allPassed: boolean;
  totalScenarios: number;
  scenariosPassed: number;
  totalAssertions: number;
  assertionsPassed: number;
  results: ScenarioResult[];
} {
  console.log('======================================================================');
  console.log('           VAEL FASHION INTELLIGENCE — EVALUATION HARNESS             ');
  console.log('======================================================================\n');

  // Step 0: Validate Knowledge Base First
  console.log('>>> [PRE-FLIGHT] Validating Fashion Knowledge Base Integrity...');
  const kbReport = KnowledgeBaseValidator.validateAll();
  if (!kbReport.isValid) {
    console.error('❌ KNOWLEDGE BASE CONTRADICTIONS FOUND:');
    kbReport.errors.forEach((e) => console.error(`   - [${e.entityType}:${e.entityId}] ${e.field}: ${e.issue}`));
    process.exit(1);
  } else {
    console.log(
      `✓ Knowledge Base Verified: ${kbReport.totalGarments} Garments, ${kbReport.totalHairstyles} Hairstyles, ${kbReport.totalBeards} Beards, ${kbReport.totalStyles} Archetypes, ${kbReport.totalOccasions} Occasions\n`
    );
  }

  const results: ScenarioResult[] = [];
  let totalAssertions = 0;
  let assertionsPassed = 0;

  for (const scenario of EVALUATION_CORPUS) {
    // Generate Top Three Looks for the scenario
    const topThree = VaelStylingEngine.generateTopThreeLooks({
      user: scenario.user,
      context: scenario.context,
    });

    const assertionResults = scenario.assertions(topThree);
    const passedCount = assertionResults.filter((a) => a.passed).length;
    const isScenarioPassed = passedCount === assertionResults.length;

    totalAssertions += assertionResults.length;
    assertionsPassed += passedCount;

    const diagnostics: string[] = assertionResults.map((a) =>
      `${a.passed ? '✓' : '✗'} ${a.message}`
    );

    results.push({
      id: scenario.id,
      name: scenario.name,
      category: scenario.category,
      passed: isScenarioPassed,
      assertionsPassed: passedCount,
      totalAssertions: assertionResults.length,
      diagnostics,
    });
  }

  // Display Category Grouped Results
  const categories = Array.from(new Set(results.map((r) => r.category)));

  for (const cat of categories) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`CATEGORY: ${cat.toUpperCase()}`);
    console.log(`----------------------------------------------------------------------`);
    const catScenarios = results.filter((r) => r.category === cat);
    for (const s of catScenarios) {
      const statusIcon = s.passed ? '✅' : '❌';
      console.log(`${statusIcon} [${s.id}] ${s.name} (${s.assertionsPassed}/${s.totalAssertions} assertions)`);
      if (!s.passed) {
        s.diagnostics.forEach((d) => console.log(`   ${d}`));
      }
    }
  }

  const scenariosPassed = results.filter((r) => r.passed).length;
  const passRate = Math.round((scenariosPassed / results.length) * 100);
  const assertionPassRate = Math.round((assertionsPassed / totalAssertions) * 100);

  console.log('\n======================================================================');
  console.log('                        EVALUATION SUMMARY                            ');
  console.log('======================================================================');
  console.log(`Total Scenarios Evaluated:  ${results.length}`);
  console.log(`Scenarios Passed:           ${scenariosPassed} / ${results.length} (${passRate}%)`);
  console.log(`Individual Assertions:      ${assertionsPassed} / ${totalAssertions} (${assertionPassRate}%)`);
  console.log(`Stylist Endorsement Rate:   >= 80% Threshold (${passRate >= 80 ? 'MET ✓' : 'FAILED ✗'})`);
  console.log('======================================================================\n');

  return {
    allPassed: scenariosPassed === results.length,
    totalScenarios: results.length,
    scenariosPassed,
    totalAssertions,
    assertionsPassed,
    results,
  };
}

// Direct CLI entry point execution
const result = runEvaluationSuite();
if (!result.allPassed) {
  process.exit(1);
}
