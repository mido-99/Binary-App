# Binary Referral System - Frontend Build Instructions

## Tech Stack

### Core Framework
- React 19
- TypeScript
- Vite (build tool)
- React Router v7 (client-side routing)

### Styling & UI
- Tailwind CSS 4.0
- shadcn/ui component library
- Radix UI primitives (via shadcn/ui)
- PostCSS + Autoprefixer
- Tailwind CSS Animate plugin

### Icons & Fonts
- Lucide React (icons)
- Google Fonts: Inter (body), Barlow Condensed (headings), JetBrains Mono (code)

### State Management & Data Fetching
- TanStack Query v5 (server state)
- Zustand (global client state)
- React Context API (auth, theme)

### Forms & Validation
- React Hook Form
- Zod (schema validation)

### Visualization & Charts
- React Flow (binary tree visualization)
- Recharts (charts and graphs)

### Animations & Interactions
- Framer Motion
- Sonner (toast notifications)

### Backend Communication
- Axios (HTTP client)
- Django REST API endpoints

---

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature-specific components
│   ├── pages/
│   ├── hooks/
│   ├── context/
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── styles/
│   ├── types/
│   └── App.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── components.json
```

---

## Installation Commands

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend

npm install react-router-dom @tanstack/react-query zustand axios
npm install framer-motion sonner
npm install @xyflow/react recharts
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
npm install clsx tailwind-merge class-variance-authority

npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

npx shadcn@latest init
```

---

## Core Components to Install (shadcn/ui)

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add skeleton
npx shadcn@latest add scroll-area
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add tooltip
```

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Barlow Condensed', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

---

## CSS Variables (src/styles/globals.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 160 84% 39%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 28% 17%;
    --secondary-foreground: 0 0% 98%;
    --accent: 217 91% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 350 89% 60%;
    --destructive-foreground: 0 0% 98%;
    --muted: 214 32% 91%;
    --muted-foreground: 215 16% 47%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 160 84% 39%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --primary: 160 84% 39%;
    --primary-foreground: 0 0% 100%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --accent: 217 91% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 350 89% 60%;
    --destructive-foreground: 0 0% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --card: 217 33% 17%;
    --card-foreground: 210 40% 98%;
    --border: 217 33% 25%;
    --input: 217 33% 25%;
    --ring: 160 84% 39%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-secondary/30 rounded;
}

::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/50 rounded hover:bg-muted-foreground/70;
}

/* Glass morphism effect */
.glass-card {
  @apply bg-card/40 backdrop-blur-lg border border-border/50;
}

/* Smooth transitions */
.page-transition {
  @apply transition-all duration-300 ease-in-out;
}
```

---

## Pages to Build

### 1. Authentication Pages
- **LoginPage** - Email/password login form with validation
- **RegisterPage** - Registration with referral code input

### 2. Dashboard Pages
- **DashboardPage** - Overview with stats cards, referral link, quick actions
- **TreePage** - Binary tree visualization with React Flow
- **BonusesPage** - Bonus history table with filters
- **PurchasesPage** - Purchase history and product browsing
- **SettingsPage** - User settings and preferences

### 3. Admin Pages
- **AdminPage** - User management, system stats
- **UserDetailPage** - Individual user details and tree

---

## Key Features to Implement

### Authentication
- JWT token storage in localStorage
- AuthContext for global auth state
- Protected routes with authentication checks
- Automatic token refresh

### Theme Management
- Light/dark mode toggle
- Theme persistence in localStorage
- System preference detection
- Smooth theme transitions

### Binary Tree Visualization
- Interactive React Flow diagram
- Left/right lane indicators
- User nodes with avatar/info
- Connection lines between referrals
- Zoom/pan controls
- Empty slot indicators

### Dashboard Stats
- Animated counter components
- Real-time data updates with TanStack Query
- Stat cards with icons (Lucide React)
- Progress indicators
- Bonus breakdown charts (Recharts)

### Referral System
- Copy referral link button with toast notification
- QR code generator for referral link
- Share buttons (WhatsApp, Email, Twitter)
- Referral statistics display

### Forms
- React Hook Form for all forms
- Zod schema validation
- Error messages below inputs
- Loading states on submit
- Success/error toast notifications

### Tables
- Sortable columns
- Pagination
- Search/filter functionality
- Row actions (view, edit, delete)
- Loading skeletons
- Empty states

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Hamburger menu for mobile
- Touch-friendly buttons (min 44px height)
- Collapsible sidebar on mobile

### Animations
- Page transitions with Framer Motion
- Hover effects on cards and buttons
- Loading spinners and skeletons
- Smooth scrolling
- Toast notification animations
- Number count-up animations for stats

---

## Component Patterns

### Layout Components

#### AppLayout
```typescript
- Header with logo, navigation, user menu
- Sidebar (collapsible on mobile)
- Main content area
- Footer
- Toast notifications container
```

#### DashboardLayout
```typescript
- Dashboard-specific navigation
- Breadcrumbs
- Page title and actions
```

### Feature Components

#### StatsCard
```typescript
Props: title, value, icon, trend, change
- Gradient background
- Icon with colored circle
- Animated value counter
- Trend indicator (up/down arrow)
```

#### ReferralLink
```typescript
Props: code, link
- Read-only input with referral link
- Copy button with success feedback
- QR code toggle
- Social share buttons
```

#### BinaryTreeNode
```typescript
Props: user, position, level, hasChildren
- Avatar or placeholder
- User name/email
- Purchase status badge
- Left/right position indicator
- Click to view details
```

#### BonusHistoryTable
```typescript
Props: bonuses, loading, onSort, onFilter
- Columns: date, type, amount, status, paired users
- Status badges (pending, released, paid)
- Sortable headers
- Filter dropdowns
- Pagination controls
```

---

## API Integration

### Axios Setup
```typescript
// src/lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### TanStack Query Setup
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

### API Endpoints
```typescript
// Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
GET /api/auth/me

// Users
GET /api/users/dashboard
GET /api/users/tree
GET /api/users/referrals
PATCH /api/users/settings

// Bonuses
GET /api/bonuses
GET /api/bonuses/stats

// Purchases
GET /api/purchases
POST /api/purchases

// Products
GET /api/products
GET /api/products/:id

// Admin
GET /api/admin/users
GET /api/admin/stats
PATCH /api/admin/users/:id
```

---

## React Flow Tree Configuration

```typescript
// Custom node type
const nodeTypes = {
  userNode: UserNode,
  emptyNode: EmptyNode,
}

// Edge styling
const edgeOptions = {
  animated: false,
  style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  type: 'smoothstep',
}

// Layout algorithm: Binary tree with left/right positioning
// Root at top, children below in L/R lanes
// Auto-calculate positions based on tree depth
```

---

## Performance Optimizations

- Code splitting with React.lazy() for routes
- Image lazy loading with loading="lazy"
- Memoize expensive computations with useMemo
- Debounce search inputs
- Virtual scrolling for long lists
- Optimize React Flow rendering with memo
- Use TanStack Query caching effectively
- Minimize re-renders with React.memo
- Bundle size optimization with Vite

---

## Accessibility Requirements

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- Alt text on images
- Color contrast ratio > 4.5:1
- Skip to main content link
- Screen reader announcements for dynamic content
- Form labels properly associated

---

## Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Binary Referral System
VITE_ENABLE_ANALYTICS=false
```

---

## Build & Deployment

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Design Principles

- **Color Palette**: Deep slate backgrounds, emerald accent (#10B981), sky blue highlights (#3B82F6)
- **Spacing**: Consistent 4px grid system
- **Typography**: Clear hierarchy with heading/body font distinction
- **Cards**: Subtle borders, soft shadows, hover lift effects
- **Buttons**: Primary (filled), secondary (outline), ghost variants
- **Forms**: Inline validation, clear error states, proper labels
- **Loading States**: Skeleton screens for content, spinners for actions
- **Empty States**: Helpful illustrations/icons with call-to-action
- **Mobile**: Bottom navigation, swipe gestures, full-screen modals
- **Micro-interactions**: Button clicks, hover effects, focus states

---

## Testing Strategy

- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- Test coverage > 80%

---

## Documentation

- Component Storybook
- API integration docs
- Setup/installation guide
- Contributing guidelines

---

## Priority Build Order

1. Setup project structure and tooling
2. Install shadcn/ui and core dependencies
3. Create layout components (Header, Sidebar, Footer)
4. Implement authentication (Login, Register, AuthContext)
5. Build Dashboard page with stats cards
6. Create Binary Tree visualization
7. Build Bonuses page with table
8. Implement Purchases/Products pages
9. Add Settings page
10. Build Admin pages
11. Polish animations and transitions
12. Add mobile responsiveness
13. Accessibility audit and fixes
14. Performance optimization
15. Testing and bug fixes
