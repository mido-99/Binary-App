# Binary Referral Commerce

Django + HTMX + Tailwind app: purchase-triggered, pair-based referral bonuses (see `.cursor/rules/` for business rules).

## Run locally and open in browser

1. **Start the server**
   ```bash
   uv run python manage.py runserver
   ```
2. **Open in browser**
   - **Store (homepage):** [http://127.0.0.1:8000/](http://127.0.0.1:8000/) — product grid, categories, filters, sort
   - **Your dashboard:** [http://127.0.0.1:8000/dashboard/](http://127.0.0.1:8000/dashboard/) — referral overview (login required)
   - **Admin:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

Use the header links **Shop**, **Dashboard**, and **Admin** to move between the store, your referral dashboard, and the admin panel.

## Database: one DB for the whole app

- **One database** is used for everything: admin, dashboard, users, orders, bonuses, tree, etc. There is no separate “admin DB” vs “site DB”.
- **Local default:** SQLite file `db_fresh.sqlite3` (see `core/settings.py`).  
  The old `db.sqlite3` (from before the custom User model) is **not** used; you can delete it.
- **Production (e.g. Supabase Postgres):**
  1. Install Postgres deps: `uv pip install ".[postgres]"`
  2. Set `DATABASE_URL` to your Postgres URL (Supabase: **Settings → Database → Connection string URI**).
  3. Run migrations: `uv run python manage.py migrate`

Example:
```bash
export DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
uv run python manage.py migrate
uv run python manage.py runserver
```

The app uses `DATABASE_URL` only when it’s set and starts with `postgres`; otherwise it uses SQLite.
