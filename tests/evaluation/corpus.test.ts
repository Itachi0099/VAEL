import { describe, it, expect } from 'vitest';
import { EVALUATION_CORPUS } from './corpus';
import { VaelStylingEngine } from '../../src/core/intelligence/engine';
import { KnowledgeBaseValidator } from '../../src/core/knowledge/validator';

describe('Golden Evaluation Corpus Validation Suite', () => {
  it('Knowledge Base must have zero contradictions and valid bounds across all 152 garments, 30 hairs, 20 beards', () => {
    const report = KnowledgeBaseValidator.validateAll();
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.totalGarments).toBe(152);
    expect(report.totalHairstyles).toBe(30);
    expect(report.totalBeards).toBe(20);
    expect(report.totalStyles).toBe(10);
    expect(report.totalOccasions).toBe(12);
  });

  describe('Autonomous Scenario Evaluation', () => {
    EVALUATION_CORPUS.forEach((scenario) => {
      it(`[${scenario.id}] ${scenario.name}`, () => {
        const topThree = VaelStylingEngine.generateTopThreeLooks({
          user: scenario.user,
          context: scenario.context,
        });

        const assertions = scenario.assertions(topThree);
        assertions.forEach((a) => {
          expect(a.passed, `${scenario.id} failed assertion: ${a.message}`).toBe(true);
        });
      });
    });
  });
});
