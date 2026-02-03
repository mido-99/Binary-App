## Core Principles
- Monetary logic is append-only and auditable
- Referral (`referred_by`) is immutable once set
- Tree placement (L/R + parent) is immutable once set
- Bonuses are calculated only on purchases
- Pairing is lane-based (L/R), not depth-only
- Async-safe, idempotent operations

---

## users
Represents buyer accounts only.

**Columns**
- id (PK, bigint)
- email (unique, indexed)
- password_hash
- referred_by (FK → users.id, nullable, immutable)
- created_at
- is_active

**Constraints**
- referred_by IS NULL OR referred_by != id

**Indexes**
- idx_users_referred_by

---

## tree_nodes
Represents binary tree placement (graph structure).

**Columns**
- id (PK)
- user_id (FK → users.id, unique)
- parent_node_id (FK → tree_nodes.id, nullable)
- lane (enum: 'L', 'R')
- depth (int)
- created_at

**Constraints**
- UNIQUE(parent_node_id, lane)
- lane immutable after insert
- parent_node_id immutable after insert

**Indexes**
- idx_tree_parent
- idx_tree_depth

---

## sellers
Dedicated seller identity.

**Columns**
- id (PK)
- owner_user_id (FK → users.id)
- store_id (FK → stores.id)
- created_at

**Indexes**
- idx_sellers_owner

---

## stores

**Columns**
- id (PK)
- name
- seller_id (FK → sellers.id)
- created_at

---

## products

**Columns**
- id (PK)
- store_id (FK → stores.id)
- base_price
- markup_price
- is_active

**Indexes**
- idx_products_store

---

## orders

**Columns**
- id (PK)
- buyer_id (FK → users.id)
- total_price
- created_at
- status (enum: pending, paid, cancelled)

**Indexes**
- idx_orders_buyer
- idx_orders_created

---

## order_items

**Columns**
- id (PK)
- order_id (FK → orders.id)
- product_id (FK → products.id)
- quantity
- price_at_purchase

---

## bonus_events
Immutable bonus records (ledger-style).

**Columns**
- id (PK)
- user_id (FK → users.id)
- order_id (FK → orders.id)
- bonus_type (enum: DIRECT, HIERARCHY)
- amount
- lane (nullable, enum L/R)
- depth
- status (enum: PENDING, RELEASED)
- created_at

**Indexes**
- idx_bonus_user
- idx_bonus_order
- idx_bonus_status

---

## pairing_counters
Tracks pairing state per user.

**Columns**
- user_id (PK, FK → users.id)
- left_count
- right_count
- released_pairs
- updated_at

**Logic**
- released_pairs = min(left_count, right_count) at last release
- new release triggered when min(left_count, right_count) increases

---

## payouts

**Columns**
- id (PK)
- user_id (FK → users.id)
- amount
- created_at
- status (enum: requested, completed, failed)

**Indexes**
- idx_payout_user

---

## background_tasks (optional audit table)

**Columns**
- id (PK)
- task_name
- related_object_id
- status
- created_at

---

## Integrity Guarantees
- All bonus calculations happen via Celery tasks
- Orders are idempotent via order_id uniqueness
- Bonus events are never updated, only appended
- Pairing counters updated in SERIALIZABLE transaction

---

## Explicitly Forbidden
- Updating referred_by
- Updating tree placement
- Calculating bonuses in HTTP request cycle
- Negative bonus values
