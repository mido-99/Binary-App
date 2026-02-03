# Binary Referral Commerce — React frontend

Modern SPA built per `rules/frontend`: React 18, TypeScript, Vite, Tailwind, shadcn-style UI, Framer Motion, React Flow, TanStack Query, Zustand, React Hook Form + Zod, Axios, Sonner.

## Setup

```bash
cd frontend
npm install
```

## Development

With Django running on port 8000:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` and `/media` to Django.

## Build

```bash
npm run build
```

Output in `dist/`. To serve from Django in production, point static files and a catch-all route to `dist/`.

## Stack

- **UI**: Tailwind CSS, Radix primitives (Slot, Label), custom Button/Card/Input
- **Auth**: AuthContext, session cookies (Django)
- **Data**: TanStack Query, Axios (withCredentials)
- **Forms**: React Hook Form, Zod
- **Animations**: Framer Motion (page transitions, hover)
- **Tree**: React Flow (@xyflow/react)
- **Toasts**: Sonner
