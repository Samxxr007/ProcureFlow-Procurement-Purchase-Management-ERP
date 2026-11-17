import { describe, it, expect } from 'vitest';
import { app } from '../../apps/api/src/app';
import { ScenarioRunner } from '../../apps/api/src/testing/ScenarioRunner';

describe('Stateful Multi-Role API Authorization Scenarios (AUTH-001 - AUTH-015)', () => {
  it('should execute full suite of 15 authorization scenarios against standard profile', async () => {
    const summary = await ScenarioRunner.runScenarios(app, 'ALL', 'standard');

    console.log(`\n--- Scenario Runner Execution Summary ---`);
    console.log(`Total Scenarios: ${summary.totalScenarios}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Duration: ${summary.durationMs}ms`);
    console.log(`Defects Logged: ${summary.defectsLogged}`);

    for (const r of summary.results) {
      console.log(` [${r.status}] ${r.scenarioId} - ${r.title} (HTTP ${r.httpStatus})`);
      if (r.errorMessage) {
        console.log(`     Error: ${r.errorMessage}`);
      }
    }

    expect(summary.totalScenarios).toBe(15);
    expect(summary.passed).toBe(15);
    expect(summary.failed).toBe(0);
  });

  it('should detect deliberate defect under vulnerable profile and auto-log defect', async () => {
    // Run scenario AUTH-001 against vulnerable environment
    const summary = await ScenarioRunner.runScenarios(app, 'AUTH-001', 'vulnerable');

    expect(summary.totalScenarios).toBe(1);
    expect(summary.results.length).toBe(1);
  });
});
