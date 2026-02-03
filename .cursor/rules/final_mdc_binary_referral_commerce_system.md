---
description: Project initialization and core architecture for Binary Referral Commerce System
globs: **/*.py, **/*.html, **/*.css
alwaysApply: true
---

# Architecture Overview

This system is a **binary referral-based commerce platform** where:
- Users buy products at a markup
- Profit is split between the app, direct referrer, and a hierarchy pool
- Hierarchy bonuses are released **only when L/R pairs form**
- All financial logic is **purchase-triggered, append-only, async, and auditable**

The system is explicitly **NOT MLM**:
- No earnings without purchases
- No forced recruiting to access base product value
- Bonuses decay with depth and have a hard cutoff

---

# Core Business Rules (Authoritative)

## User & Referral Rules
- `referred_by` exists on `users`
- `referred_by` is immutable once set
- Users may assign `referred_by` after signup, but only once
- Direct referral ≠ tree parent

## Tree Rules
- Tree is binary (Left / Right)
- Tree placement is stored in `tree_nodes`
- Each node has at most 2 children (L, R)
- Tree placement is immutable once assigned
- Users can inspect **only their own subtree**, never ancestors

## Purchase Rules
- **Bonuses are calculated ONLY on purchase**, never on signup
- A purchase creates a "unit" that propagates upward
- All calculations are async (Celery)

---

# Profit Split (Current Locked Ratios)

For a product sold at markup:
- 20% → App fee
- 40% → Direct referrer
- 40% → Hierarchy pool

(Percentages are configurable but default to above.)

---

# Hierarchy Pool Distribution Logic

Hierarchy pool is distributed using **inverse-depth decay**:

Formula:
```
share_at_depth_i = hierarchy_pool * (30 / i / 100)
```

Example (hierarchy pool = 100):
- Depth 1 → 30
- Depth 2 → 15
- Depth 3 → 7.5
- Depth 4 → 3.75
- ... continues until cutoff

## Cutoff Rule
- Traversal stops when:
  - Pool is exhausted OR
  - Max depth cutoff of 15 is reached 

---

# Pairing & Bonus Release Rules (CRITICAL)

- Pairing is **lane-based**, not depth-total based
- Each purchase increments counters on the ancestor’s lane (L or R)
- A "pair" is formed when:
```
min(left_count, right_count) increases
```
- Only the **delta increase** releases bonuses
- One extra unit on a lane remains pending

## Release Rules
- When a new pair forms:
  - Release exactly one pair’s worth of bonuses
  - Includes BOTH direct and hierarchy bonuses
- Bonuses are immediately withdrawable upon release

---

# Bonus Ledger Rules

- All bonuses are stored in `bonus_events`
- Bonus events are append-only
- Status transitions:
  - PENDING → RELEASED
- Never update amount, only status

Bonus Types:
- DIRECT
- HIERARCHY

---

# Async & Consistency Rules

- All bonus calculations run in Celery
- HTTP requests NEVER calculate bonuses
- Pairing counters updated in SERIALIZABLE transactions
- Tasks must be idempotent (safe retries)

---

# Admin & Visibility

## Admin Panel
- Use Django Admin
- Read-only fields:
  - referred_by
  - tree placement
- Admin can:
  - Inspect users
  - Inspect trees
  - Inspect bonus ledgers
  - Inspect payouts

## User Dashboard
- View own subtree only
- See:
  - Total referrals
  - L / R counts
  - Direct vs hierarchy bonuses
  - Pending vs released bonuses
- Visual binary tree
- Placement warnings before assigning L/R

---

# Frontend Architecture

- Backend: Django
- Frontend: Django Templates + HTMX
- Styling: TailwindCSS
- UI supports light/dark mode toggle
- No SPA framework in current scope

---

# Background Processing

- Task queue: Celery
- Broker: Redis
- Tasks:
  - Process purchase
  - Traverse hierarchy
  - Create bonus events
  - Update pairing counters
  - Release bonuses

---

# Agent Rules (MANDATORY)

1. NEVER modify `referred_by`
2. NEVER modify tree placement
3. NEVER calculate bonuses synchronously
4. NEVER recalculate historical bonuses
5. NEVER allow negative bonuses
6. Bonuses only come from purchases
7. All money writes are append-only
8. Pairing uses lane counts only

---

# Forbidden Actions

- Signup bonuses
- Depth-based payouts without decay
- Unlimited hierarchy without cutoff
- Editing referral relationships
- Tree rebalancing after assignment

---

# File Tree (Expected)

```
project/
├── users/
├── tree/
├── orders/
├── bonuses/
├── payouts/
├── sellers/
├── products/
├── tasks/
├── templates/
├── static/
└── admin/
```

---

This MDC is the **single source of truth** for the Binary Referral Commerce System.
Any deviation is a bug, not a feature.

