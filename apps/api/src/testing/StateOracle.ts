import { prisma } from '../prisma';

export interface StateAssertion {
  table: string;
  condition: Record<string, any>;
  expectedCount?: number;
  expectedFields?: Record<string, any>;
}

export interface StateAssertionResult {
  passed: boolean;
  table: string;
  errorMessage?: string;
  actualValues?: any;
}

export class StateOracle {
  static async verifyAssertions(assertions: StateAssertion[]): Promise<StateAssertionResult[]> {
    const results: StateAssertionResult[] = [];

    for (const assertion of assertions) {
      try {
        const delegate = (prisma as any)[assertion.table.toLowerCase()] ||
                         (prisma as any)[assertion.table.charAt(0).toLowerCase() + assertion.table.slice(1)];

        if (!delegate) {
          results.push({
            passed: false,
            table: assertion.table,
            errorMessage: `Unknown Prisma table entity '${assertion.table}'`,
          });
          continue;
        }

        if (assertion.expectedCount !== undefined) {
          const count = await delegate.count({ where: assertion.condition });
          const matches = count === assertion.expectedCount;
          results.push({
            passed: matches,
            table: assertion.table,
            errorMessage: matches
              ? undefined
              : `State assertion failed for ${assertion.table}: Expected count ${assertion.expectedCount}, found ${count}.`,
            actualValues: { count },
          });
        }

        if (assertion.expectedFields) {
          const record = await delegate.findFirst({ where: assertion.condition });
          if (!record) {
            results.push({
              passed: false,
              table: assertion.table,
              errorMessage: `Record not found in ${assertion.table} matching condition: ${JSON.stringify(assertion.condition)}`,
            });
            continue;
          }

          let fieldsMatch = true;
          const mismatches: string[] = [];

          for (const [key, expectedVal] of Object.entries(assertion.expectedFields)) {
            if (record[key] !== expectedVal) {
              fieldsMatch = false;
              mismatches.push(`${key} (expected: ${expectedVal}, actual: ${record[key]})`);
            }
          }

          results.push({
            passed: fieldsMatch,
            table: assertion.table,
            errorMessage: fieldsMatch
              ? undefined
              : `Field state mismatch in ${assertion.table}: ${mismatches.join('; ')}`,
            actualValues: record,
          });
        }
      } catch (err: any) {
        results.push({
          passed: false,
          table: assertion.table,
          errorMessage: `Database verification query error: ${err.message}`,
        });
      }
    }

    return results;
  }
}
