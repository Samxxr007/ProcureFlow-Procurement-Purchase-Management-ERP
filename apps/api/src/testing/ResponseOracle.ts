export interface ResponseAssertionResult {
  passed: boolean;
  actualStatus: number;
  expectedStatus: number;
  errorMessage?: string;
}

export class ResponseOracle {
  static evaluate(actualStatus: number, expectedStatus: number, responseBody: any): ResponseAssertionResult {
    const passed = actualStatus === expectedStatus;
    let errorMessage: string | undefined;

    if (!passed) {
      errorMessage = `HTTP Status Mismatch: Expected ${expectedStatus}, received ${actualStatus}. Response: ${JSON.stringify(responseBody)}`;
    }

    return {
      passed,
      actualStatus,
      expectedStatus,
      errorMessage,
    };
  }
}
