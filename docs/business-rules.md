# Business Rules

## Resident Lifecycle

```
RESERVED
   ↓ (check-in)
ACTIVE
   ↓ (notice submitted)
NOTICE_PERIOD
   ↓ (notice period elapsed)
CHECKOUT_PENDING
   ↓ (checkout approved)
CHECKED_OUT
```

State transitions are enforced by `domain/residents/rules.ts` — `isValidStatusTransition()`.

## Notice Period

**Rule:** A resident must give **15 days notice** before leaving.

**Implementation:**
- Configurable via `hostel_settings.notice_period_days` (default: 15)
- Single source of truth: `domain/notices/rules.ts` → `calculateExpectedCheckoutDate()`
- Formula: `expected_checkout_date = notice_date + notice_period_days`

**Never hard-code 15 in components, pages, or services.**

## Security Deposits

- Can be paid in full or via installments
- At checkout: `refundable = paid - deductions - outstanding_fines - other_deductions`
- Deductions require approval (OWNER/MANAGER)
- Refund amount calculated server-side only

## Fines

- Statuses: `UNPAID` → `PARTIALLY_PAID` → `PAID` (or `WAIVED`)
- Waiver requires `fines.waive` permission (OWNER or MANAGER only)
- Waiver is recorded with who waived it and when
- Once `PAID`, a fine cannot be waived
- Payment amounts are validated: cannot exceed outstanding balance

## Checkout Eligibility

A resident **cannot** be checked out unless:
1. They are in `CHECKOUT_PENDING` status
2. An authorized employee (MANAGER/OWNER) approves the checkout
3. Settlement is calculated and confirmed

## Financial Integrity

- Payment records are **immutable** — never update an amount after recording
- To correct: create a reversal/adjustment record
- All financial calculations are performed **server-side**
- Browser-submitted financial values are **ignored** — recalculate from DB
- Financial history is preserved with `created_by` and `created_at` timestamps

## Audit Logging

The following actions **must** generate an activity log entry:

- Resident created / updated / checked in / checked out
- Bed assigned / changed
- Payment recorded
- Fine created / waived / paid
- Deposit recorded / deduction approved
- Notice submitted
- Checkout approved
- Employee permissions changed
- Settings changed
