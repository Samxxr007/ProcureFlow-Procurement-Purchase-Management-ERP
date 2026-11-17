# ProcureFlow — Stateful Authorization Testing Engine

## 1. Dual Oracle Verification Architecture

The testing engine implements two independent verification mechanisms:

```
[Test Request Dispatch]
         |
         +--------------------------------------------+
         |                                            |
         v                                            v
[Response Oracle]                              [State Oracle]
- Evaluates HTTP Status code                   - Queries SQLite database directly
- Asserts JSON response body error code        - Checks row counts before vs after
- Validates permission outcome (ALLOW / DENY)  - Asserts field mutations & immutability
                                               - Verifies no unauthorized DB side-effects
```

### Critical Security Rule:
A request that returns HTTP 403 Forbidden but still writes a payment record to the database is classified as a **Security Failure**. Both oracles must pass for a scenario to be marked `PASSED`.

---

## 2. Vulnerability Simulation & Defect Auto-Logging

The Quality Lab supports two runtime security profiles:
1. **Standard Profile (`standard`)**: Secure production policy layer. All 15 scenarios pass with 0 defects.
2. **Vulnerable Profile (`vulnerable`)**: Deliberately injects controlled defect switches (e.g. bypassing separation of duties). Running scenarios against this profile produces reproducible failures, and `ScenarioRunner` automatically generates structured `Defect` records linked to the test run.
