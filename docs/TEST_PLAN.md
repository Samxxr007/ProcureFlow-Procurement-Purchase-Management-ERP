# ProcureFlow — Test Plan

## 1. Testing Philosophy
The ProcureFlow testing strategy operates across multiple verification tiers:
1. **Unit Testing**: Isolated logic testing for `AuthorizationPolicy` matrix rules and `WorkflowService` finite state machine transitions.
2. **Integration Testing**: API endpoint verification across auth, sessions, requisitions, approvals, POs, dock receipts, invoices, and payments.
3. **Stateful Authorization Testing**: End-to-end multi-role API scenarios combining Response and State Oracles.
4. **Predictive Regression Selection**: Git diff impact analysis and machine learning candidate scoring.
5. **Confidence-Aware Adaptive Scope**: Evidence-based routing between Full, Expanded, and Selective testing.

## 2. Test Execution Commands
```powershell
# Run all unit, integration and authorization test suites
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run stateful authorization scenario suite
npm run test:auth
```

## 3. Coverage Targets
- Authorization Policy branch coverage: 100%
- Workflow transition validity coverage: 100%
- Stateful Authorization Scenarios: 15/15 passing in standard profile
- Defect logging on vulnerable profile: Automated reproducible defect tickets
