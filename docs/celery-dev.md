# Celery + Redis dev runbook (Windows)

Run the Celery worker and broker locally so dashboard recompute and purchase-processing tasks run asynchronously.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Redis URL for the message broker. |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/0` | Redis URL for task results (optional). |
| `CELERY_ALWAYS_EAGER` | `false` | Set to `true` to run tasks inline (no worker); useful for tests. |

No need to set these if using default Redis on localhost.

## 1. Run Redis

Redis must be running before starting the Celery worker.

**Option A – Docker (recommended)**

```powershell
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Option B – Windows (WSL2 or native)**

- Install Redis via WSL2: `sudo apt install redis-server` then `redis-server`.
- Or use a Windows build from [tporadowski/redis](https://github.com/tporadowski/redis/releases) and run `redis-server.exe`.

Check Redis:

```powershell
# If you have redis-cli (e.g. in Docker container or WSL):
redis-cli ping
# Expected: PONG
```

## 2. Start the Celery worker

From the project root (where `manage.py` is), with the project virtualenv activated:

```powershell
celery -A core worker -l info
```

- `-A core` uses the Celery app defined in `core/celery.py` (and loaded in `core/__init__.py`).
- `-l info` sets log level to info.

The worker will autodiscover tasks from installed Django apps. Tasks are defined in `tasks/tasks.py` (`process_purchase`, `release_pairs_for_user`).

## 3. Verify tasks are registered

**Requires Redis to be running** (inspect connects to the broker). In another terminal (same venv, project root):

```powershell
celery -A core inspect registered
```

You should see something like:

```
-> celery@HOSTNAME: ...
  . tasks.tasks.process_purchase
  . tasks.tasks.release_pairs_for_user
```

Without Redis, you can still confirm discovery by importing the app and loading tasks (e.g. `import tasks.tasks` then list `app.tasks`); the worker will load these when it starts.

## 4. Optional: run tasks inline (no Redis)

For tests or single-process dev without Redis:

```powershell
$env:CELERY_ALWAYS_EAGER = "true"
python manage.py runserver
```

Tasks will run synchronously in the same process when `.delay()` is called.

## 5. Triggering dashboard-visible work

- **From the UI (dev):** Log in, open Dashboard, call `POST /api/dashboard/recompute/` (e.g. add a “Recompute” button that posts there). That enqueues `release_pairs_for_user(user_id)`.
- **From the shell:**

  ```powershell
  python manage.py enqueue_demo_bonus --user 1
  ```

With the worker running, the task will run and update `PairingCounter` and create a `BonusEvent`; refresh the dashboard to see updated stats and bonus events.

## Summary

| Step | Command |
|------|--------|
| Start Redis | `docker run -d --name redis -p 6379:6379 redis:alpine` (or your Redis setup) |
| Start worker | `celery -A core worker -l info` |
| Check tasks | `celery -A core inspect registered` |
