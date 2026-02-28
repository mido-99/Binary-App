# Unit testing plan

Use this as a checklist to add tests without breaking the current architecture. Add tests in small steps.

## Running tests

- **Backend:** `uv run python manage.py test` (all) or `uv run python manage.py test core.tests tree.tests`
- **Frontend:** `cd frontend && npm run test` (single run) or `npm run test:watch`

## Backend (Django)

- **Runner:** `uv run python manage.py test` or `pytest` if you add it.
- **Placement:** Per-app `tests/` package or `tests/test_<module>.py` next to the code.

### Core API (`core/api_views.py`)

1. **Auth:** `api_login`, `api_register`, `api_me`, `api_logout`  
   - Valid/invalid credentials, missing fields, duplicate email, CSRF/cookies.
2. **Stores:** `api_stores`, `api_store_detail`, `api_store_products`  
   - List shape, 404 for missing store, products payload.
3. **Products:** `api_products`, `api_product_detail`, `api_product_related`  
   - Filtering, pagination, 404, related products.
4. **Cart:** `api_cart_list`, `api_cart_add`, `api_cart_update`, `api_cart_remove`, `api_cart_clear`  
   - All require auth; test add/update/remove/clear and list shape.
5. **Users:** `api_user_update`, `api_change_password`, address CRUD  
   - Auth required, validation, 404 for bad address id.
6. **Orders:** list, detail, cancel, mark-paid  
   - Auth, 404, state transitions.
7. **Wishlist:** list, add, remove  
   - Auth, list shape.
8. **Dashboard:** `api_dashboard`, `api_tree_data`, `api_bonus_events`, `api_dashboard_recompute`  
   - Auth; dashboard stats shape; tree nodes/edges and `side`/`left_users_below`/`right_users_below`; bonus-events pagination; recompute returns 200.

### Tree app

- **Models:** `TreeNode`, `PairingCounter` – creation, relations.
- **Logic:** Any helpers that compute tree structure or counts (if extracted from api_views).

### Other apps

- **bonuses:** BonusEvent creation and status.
- **orders:** Order/OrderItem creation, totals.
- **users:** User, ShippingAddress, Wishlist model behavior.

---

## Frontend (React / Vite)

- **Runner:** `npm run test` (add Vitest or Jest to the frontend).
- **Placement:** `frontend/src/**/*.test.ts` or `*.test.tsx` next to components, or `frontend/src/test/`.

### API & data

1. **`lib/api`:** Axios instance base URL and interceptors (if any).
2. **Dashboard tree data:** Type `TreeNode` / tree payload; layout input/output if you extract pure functions.

### Components (optional, as you add tests)

1. **DashboardPage:**  
   - Tree layout: given `nodes`/`edges`, computed positions stay left/right of center and don’t overlap.  
   - Bonus events list: loading, error, empty, pagination.
2. **AuthContext:** Login/logout flow, `user` state.
3. **Cart store:** Add, update, remove, clear (Zustand).

### What to test first (recommended order)

1. **Backend:** `api_dashboard` and `api_tree_data` (JSON shape and auth).
2. **Backend:** Auth: login, register, me, logout.
3. **Backend:** Dashboard bonus-events and recompute.
4. **Frontend:** Tree layout pure functions (if you split them out) or snapshot of initial nodes for a fixed tree payload.
5. Expand to other API endpoints and critical UI flows.

---

## Notes

- Keep tests fast: use SQLite in-memory or fixtures; mock external/Celery if needed.
- No E2E in this plan; add Playwright/Cypress later if desired.
- `recharts` is in `package.json` but not used in `src`; safe to remove from deps or leave for future charts.
