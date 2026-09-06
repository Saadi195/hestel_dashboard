# Testing & QA Strategy Document

## Overview
The Hostel Management System relies on a multi-tiered automated testing and quality assurance pipeline:

1. **Static Type Checking**: `npx tsc --noEmit` (TypeScript strict mode)
2. **Code Style & Linting**: `npm run lint` (`eslint . --max-warnings 0`)
3. **Unit & Integration Tests**: `npx vitest run --pool=threads` (Vitest test suite)
4. **End-to-End Tests**: `npx playwright test` (Playwright E2E test suite)
5. **Production Build Check**: `npm run build` (Next.js build verification)

---

## Test Suites Structure

```
tests/
├── unit/                        # Domain rules & pure logic tests
│   ├── domain/
│   │   ├── checkout/rules.test.ts
│   │   ├── deposits/rules.test.ts
│   │   ├── fines/rules.test.ts
│   │   ├── notices/rules.test.ts
│   │   ├── rent/rules.test.ts
│   │   ├── residents/rules.test.ts
│   │   └── rooms/rules.test.ts
│   └── lib/
│       └── auth/permissions.test.ts
├── integration/                 # Cross-cutting integration tests
│   ├── rbac.test.ts
│   ├── multi-hostel.test.ts
│   ├── resident-lifecycle.test.ts
│   ├── room-bed-integrity.test.ts
│   └── financial-integrity.test.ts
└── e2e/                        # Playwright browser E2E specs
    ├── auth/
    │   ├── auth.setup.ts
    │   └── auth.spec.ts
    ├── residents/
    │   └── residents.spec.ts
    ├── rooms/
    │   └── rooms.spec.ts
    ├── payments/
    │   └── payments.spec.ts
    └── checkout/
        └── checkout.spec.ts
```

---

## Execution Commands

### Run All Unit & Integration Tests
```bash
npx vitest run --pool=threads
```

### Run E2E Test Suite
```bash
npx playwright test
```

### Run Static Verification Pipeline
```bash
npx tsc --noEmit && npm run lint && npx vitest run --pool=threads
```
