import catalogData from './catalog.json';
import scenariosData from './scenarios.json';
import { TestCaseMetadata, AuthScenarioDefinition } from '@procureflow/shared';

export type { AuthScenarioDefinition, TestCaseMetadata };
export const TEST_CATALOG: TestCaseMetadata[] = catalogData as TestCaseMetadata[];
export const AUTH_SCENARIOS: AuthScenarioDefinition[] = scenariosData as AuthScenarioDefinition[];

export function getTestById(testId: string): TestCaseMetadata | undefined {
  return TEST_CATALOG.find((t) => t.testId === testId);
}

export function getScenarioById(scenarioId: string): AuthScenarioDefinition | undefined {
  return AUTH_SCENARIOS.find((s) => s.scenarioId === scenarioId);
}

export function getTestsForFile(filePath: string): TestCaseMetadata[] {
  const normalized = filePath.replace(/\\/g, '/');
  return TEST_CATALOG.filter((test) =>
    test.relatedSourceFiles.some((sf) => normalized.includes(sf) || sf.includes(normalized))
  );
}
