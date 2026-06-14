# ExpertHub — Modern Design System & UI Implementation Plan

## Context

ExpertHub is a multi-tenant expert marketplace replacing the legacy "mytin" Rails monolith. It needs a premium, trustworthy visual identity that communicates expertise and converts visitors into booked clients. The React + Tailwind v4 scaffold is already in place with 48 Shadcn/Radix UI primitives ready to compose. The app is currently empty (`App.tsx` is a blank shell). This plan defines the complete design system and the order in which to implement all major screens.

---

## Design Philosophy

**Calm, Confident, Premium.**  
Experts deserve a platform that looks as professional as they are. The visual language draws from the aesthetics of Linear, Notion, and Stripe — clean geometry, generous white space, purposeful color, and motion that communicates state rather than decorates.

Three design principles:
1. **Trust by default** — whitespace, consistent grids, readable type, verified badge patterns
2. **Progressive disclosure** — show only what's needed per step; modals and drawers for depth
3. **Tenant-aware** — every color, logo, and slogan is overridable via CSS variables

---

## 1. Design Tokens (theme.css updates)

Replace the current generic tokens with ExpertHub's brand palette.

### Color Palette

**Primary Brand — Indigo Violet**
```css
:root {
  /* Brand */
  --brand-50:  #eef2ff;
  --brand-100: #e0e7ff;
  --brand-200: #c7d2fe;
  --brand-500: #6366f1;   /* primary actions */
  --brand-600: #4f46e5;   /* hover state */
  --brand-700: #4338ca;   /* pressed state */
  --brand-900: #312e81;

  /* Accent — Amber (CTAs, badges, highlights) */
  --accent-400: #fbbf24;
  --accent-500: #f59e0b;
  --accent-600: #d97706;

  /* Semantic */
  --success:     #10b981;  /* confirmed, paid, online */
  --warning:     #f59e0b;  /* pending, expiring */
  --error:       #ef4444;  /* failed, destructive */
  --info:        #3b82f6;  /* informational */

  /* Neutrals — Cool Slate */
  --slate-50:  #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-400: #94a3b8;
  --slate-600: #475569;
  --slate-800: #1e293b;
  --slate-900: #0f172a;
  --slate-950: #020617;

  /* Tenant override hooks (set from TenantThemeProvider) */
  --tenant-primary:   var(--brand-500);
  --tenant-secondary: var(--brand-100);
  --tenant-logo-bg:   var(--brand-700);
}
```

### Light Mode Tokens
```css
:root {
  --background:         #ffffff;
  --surface:            #f8fafc;       /* cards, sidebar bg */
  --surface-elevated:   #ffffff;       /* modals, popovers */
  --border:             #e2e8f0;
  --border-subtle:      #f1f5f9;

  --foreground:         #0f172a;       /* primary text */
  --foreground-muted:   #64748b;       /* secondary text */
  --foreground-subtle:  #94a3b8;       /* placeholder/disabled */

  --primary:            var(--brand-500);
  --primary-foreground: #ffffff;
  --primary-hover:      var(--brand-600);

  --ring:               var(--brand-500);
  --radius:             0.625rem;      /* 10px base */
  --radius-sm:          0.375rem;
  --radius-lg:          0.875rem;
  --radius-xl:          1.25rem;
  --radius-2xl:         1.5rem;
  --radius-full:        9999px;
}
```

### Dark Mode Tokens
```css
.dark {
  --background:       #0f172a;
  --surface:          #1e293b;
  --surface-elevated: #1e293b;
  --border:           #334155;
  --border-subtle:    #1e293b;

  --foreground:       #f1f5f9;
  --foreground-muted: #94a3b8;

  --primary:          #818cf8;   /* lighter indigo for dark mode */
  --primary-hover:    #a5b4fc;
}
```

---

## 2. Typography System

Add to `src/styles/fonts.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
```

Add to `src/styles/theme.css`:
```css
:root {
  --font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'Fira Code', ui-monospace, monospace;
}
```

**Type Scale (applied via Tailwind utilities):**

| Role | Size | Weight | Font | Usage |
|------|------|--------|------|-------|
| Display XL | 3.5rem / 56px | 800 | Heading | Hero headlines |
| Display LG | 2.25rem / 36px | 700 | Heading | Page titles |
| Heading MD | 1.5rem / 24px | 700 | Heading | Section titles |
| Heading SM | 1.125rem / 18px | 600 | Heading | Card titles |
| Body LG | 1.0625rem / 17px | 400 | Body | Expert bios |
| Body MD | 0.9375rem / 15px | 400 | Body | Default copy |
| Body SM | 0.8125rem / 13px | 400 | Body | Labels, captions |
| Caption | 0.75rem / 12px | 500 | Body | Timestamps, badges |

---

## 3. Elevation & Glassmorphism System

Define reusable shadow utilities in `globals.css`:
```css
.shadow-card    { box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04); }
.shadow-raised  { box-shadow: 0 4px 16px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04); }
.shadow-modal   { box-shadow: 0 20px 60px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.06); }

/* Glassmorphism (drawer, booking panel, checkout summary) */
.glass-light {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(16px) saturate(1.8);
  border: 1px solid rgba(255,255,255,0.4);
}
.glass-dark {
  background: rgba(15,23,42,0.72);
  backdrop-filter: blur(16px) saturate(1.8);
  border: 1px solid rgba(255,255,255,0.08);
}
```

---

## 4. Component Patterns

### 4.1 Button Hierarchy
Use the existing `Button` from `src/app/components/ui/button.tsx`:
- **Primary**: `variant="default"` — indigo fill, white text, `px-5 py-2.5 rounded-lg`
- **Secondary**: `variant="outline"` — border + brand color text
- **Ghost**: `variant="ghost"` — transparent, hover fill
- **Destructive**: `variant="destructive"` — red fill
- **CTA (hero)**: Custom large variant — `px-8 py-4 text-base font-semibold rounded-xl` with subtle glow `shadow-[0_0_20px_rgba(99,102,241,0.4)]`

### 4.2 Card Pattern
Two elevations used throughout:
- **Flat Card**: `bg-surface border border-border rounded-xl p-5 shadow-card`
- **Elevated Card**: `bg-surface-elevated rounded-2xl p-6 shadow-raised`

**Expert Card (discovery grid):**
```
┌─────────────────────────────────┐
│ [Cover image 16:9]              │
│                                 │
├─────────────────────────────────┤
│ ◉ Avatar + Online dot           │
│ Expert Name          ★ 4.9 (82) │
│ Specialization tagline          │
│ ──────────────────────────────  │
│ 💬 Chat  📅 Book Now  from $X/h │
└─────────────────────────────────┘
```

### 4.3 Status Badges
```
Online:    green dot + "Online"  bg-success/10 text-success
Offline:   gray dot              bg-slate-100 text-slate-500
Verified:  blue shield ✓         bg-brand-50 text-brand-600
Pending:   amber clock ◷         bg-amber-50 text-amber-600
Paid:      emerald check ✓       bg-success/10 text-success
Cancelled: red ×                 bg-error/10 text-error
```

### 4.4 Skeleton Loaders
Use the existing `Skeleton` component from `ui/skeleton.tsx` with:
- Expert card skeleton: 3 lines + avatar circle + two button shapes
- `animate-pulse` on all instances
- Match exact dimensions of real content to prevent layout shift

### 4.5 Empty States
Centered illustration + heading + body + optional CTA. Keep illustrations minimal (lucide icon + colored background circle, no external image deps).

---

## 5. Layout Architecture

### 5.1 Navigation Topbar
**Height:** 64px | **Sticky:** yes | **Blur on scroll:** yes

```
[Tenant Logo]  [Search bar ─ typeahead]   [Notifications 🔔]  [Avatar ▾]
```

- Mobile: Logo + Hamburger → slide-in Sheet drawer
- Unauthenticated: Logo + "Sign In" + "Get Started" CTA
- Expert user: adds "My Dashboard" link
- Operator user: adds "Admin" link

### 5.2 Admin Sidebar
**Width:** 240px | **Collapsible to 64px (icon-only)**

Use existing `Sidebar` component from `ui/sidebar.tsx`. Groups:
1. Getting Started (onboarding checklist)
2. Analytics (dashboard, transactions, payouts)
3. Configure (categories, custom fields, tenant settings)
4. Payments (Stripe, Razorpay setup)
5. Design & Brand (logo, colors, domains)
6. Content (landing page builder, CMS pages)
7. Users & Experts
8. Bookings & Chat

### 5.3 Page Grid
- **Max content width:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Discovery grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`
- **Storefront layout:** `grid-cols-1 lg:grid-cols-[1fr_360px] gap-8`
- **Checkout layout:** `grid-cols-1 lg:grid-cols-[1fr_400px] gap-8`
- **Dashboard:** `grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4` (metric cards)

---

## 6. Screen-by-Screen Specifications

### Screen 1: Homepage / Discovery (`/`)

**Hero Section (above fold):**
- Full-width gradient background: `from-slate-950 via-brand-900 to-slate-950`
- Centered headline (Display XL) + subtext + search bar
- Search bar: pill shape, full-width, category icon prefix, typeahead suggestions
- Below search: popular category chips (scrollable horizontal row)

**Vertical Tab Switcher:**
- Sticky below hero when scrolling
- 3 tabs: "Consultations" | "Courses" | "Live Sessions"
- Active tab: indigo underline + bold label
- Switching tab replaces the grid below with Motion `AnimatePresence` fade

**Filter Bar (below tabs):**
- Horizontal scroll on mobile, full display on desktop
- Filters: Category (Select) | Price Range (Slider popover) | Availability (Calendar popover) | Online Only (Toggle)
- Active filters shown as removable chips below the bar

**Expert Grid (main content):**
- 3-4 column grid of expert cards (defined in 4.2)
- Infinite scroll with skeleton loaders at the bottom
- Empty state: illustration + "No experts found" + "Clear filters"

**Map Toggle (desktop):**
- Button in top-right of grid area: "🗺 Map view"  
- Slides open a right-side panel (takes 40% width) with interactive pin markers
- Clicking a map pin highlights the corresponding card

---

### Screen 2: Expert Storefront (`/expert/:username`)

**Cover + Identity Header:**
- Full-width cover image (280px tall) with dark gradient overlay at bottom
- Circular avatar (112px) with `ring-4 ring-white` positioned half-overlapping cover bottom
- Name (Heading LG), verified badge, specialization text
- Rating stars + count + "X reviews" + response time badge
- Online status indicator (pulsing green dot)

**Sticky Sub-Navigation:**
- Tabs: About | Specializations | Services | Courses | Sessions | Reviews
- Scroll-spy: tabs highlight as user scrolls through sections
- "Book Consultation" CTA button always visible in the sticky nav (right side, hidden on mobile)

**Main Content (left 2/3):**
- **About**: bio text with "Read more" collapse
- **Specializations**: `flex-wrap` pill badges
- **Services**: service cards with duration, price, "Book" button
- **Courses**: grid cards with thumbnail, title, rating, price
- **Sessions**: webinar cards with date/time/spots-left
- **Reviews**: star aggregate + review list with avatar, name, text, rating

**Booking Panel (right 1/3, sticky):**
```
┌────────────────────────────┐
│  Select Date               │
│  ← Mon Tue Wed Thu Fri →   │
│                            │
│  Duration:  [30m] [60m]    │
│                            │
│  Available Times:          │
│  [9:00 AM] [10:30 AM]      │
│  [2:00 PM] [4:00 PM]       │
│                            │
│  ─────────────────────     │
│  Total: $120               │
│  [Book Now →]              │
└────────────────────────────┘
```
- Uses `glass-light` class
- On mobile: collapsed into a sticky bottom bar with "Book Now" button that triggers a Sheet drawer

---

### Screen 3: Checkout (`/checkout`)

**Step Progress Bar (top):**
`① Details  ②─ Communication  ③─ Payment  ④─ Confirm`
Use existing `Progress` component or custom step indicator with indigo fill.

**Left Column — Steps (accordion):**
- **Step 1 — Appointment Details**: read-only summary card (expert name, date, time, duration)
- **Step 2 — Communication**: radio group with icons (Video Call, Phone, Chat). Video shows Daily.co icon, Phone shows input for number
- **Step 3 — Custom Questions**: dynamic field rendering based on `checkout_fields` API
- **Step 4 — Payment**: Stripe Elements iframe in a card frame

**Right Column — Order Summary (sticky, glass card):**
```
┌───────────────────────────────┐
│ Order Summary                 │
│ ─────────────────────────── │
│ Service:   Expert Consultation│
│ Duration:  60 minutes         │
│ Date:      June 15, 2026      │
│ ─────────────────────────── │
│ Subtotal         $120.00      │
│ Platform fee      $12.00      │
│ Promo code [____] [Apply]     │
│ Discount         -$20.00      │
│ ─────────────────────────── │
│ Total            $112.00      │
│                               │
│ [Pay $112.00 →]               │
│ 🔒 Secured by Stripe          │
└───────────────────────────────┘
```

---

### Screen 4: LMS Lesson Player (`/courses/:id/lessons/:lesson_id`)

**Full-height dark layout** (no topbar, minimal chrome):
```
┌──────────────────────────────────────────────────────┐
│ ← Back   Course Title                      ☰ Outline │
├──────────────────────────────┬───────────────────────┤
│                              │ Module 1 ▼            │
│   [   VIDEO PLAYER   ]       │   ✓ Lesson 1          │
│   16:9 aspect ratio          │   ▶ Lesson 2 (active) │
│   custom controls overlay    │   ○ Lesson 3          │
│                              │ Module 2 ▶            │
│ Tabs: Notes | Resources      │   ○ Lesson 4          │
│ ─────────────────────────    │   ○ Lesson 5          │
│ [◁ Previous] [Mark Complete] [Next ▷]                │
└──────────────────────────────────────────────────────┘
```
- Dark background: `bg-slate-950`
- Video area: full dark chrome with custom HTML5 controls
- Sidebar: `w-72 bg-slate-900 border-l border-slate-800`
- Completed lessons: `text-success` with check icon
- Active lesson: `bg-brand-500/10 border-l-2 border-brand-500`
- Progress bar at top: thin indigo line showing overall course completion

---

### Screen 5: Quiz (`/courses/:id/lessons/:lesson_id/quiz`)

**Single-question slide deck:**
```
Progress: Question 3 of 8  ████████░░░░ 37%

┌──────────────────────────────────────────────┐
│                                              │
│  Which hook is used for side effects?        │
│                                              │
│  ○  useState                                 │
│  ◉  useEffect         ← selected            │
│  ○  useCallback                              │
│  ○  useMemo                                  │
│                                              │
└──────────────────────────────────────────────┘

[← Back]                          [Next Question →]
```
- Questions animate in with `x: 20 → 0` slide transition (Motion)
- Selected option: `bg-brand-50 border-brand-500 text-brand-700`
- After submission — correct: `bg-success/10 border-success` + check icon
- After submission — wrong: `bg-error/10 border-error` + × icon + correct answer highlighted

**Results overlay (Modal):**
```
        🎉 Great Work!

        82% Score
    ┌──────────────────┐
    │  Radial progress │
    │     circle       │
    └──────────────────┘
    
    Correct:  7/8
    Wrong:    1/8
    
    [Try Again]  [Next Lesson →]
```

---

### Screen 6: Messaging / Inbox (`/inbox`)

**Two-panel layout (desktop) / Full-screen thread (mobile):**
```
┌─────────────────┬────────────────────────────────┐
│ Inbox           │ Dr. Sarah Chen                  │
│ ─────────────── │ ──────────────────────────────── │
│ ◉ Dr. Sarah     │                                  │
│   Hey I have... │         [Expert]                 │
│   2 min ago  🔵 │         "Let me check your..."  │
│                 │         10:23 AM                 │
│ ○ John Smith    │                                  │
│   Thanks for    │  [You]                           │
│   the session   │  "Thanks! One more question"    │
│   Yesterday     │  10:25 AM                        │
│                 │                                  │
│                 │ ────────────────────────────────│
│                 │ [📎] [Message...          ] [→] │
└─────────────────┴────────────────────────────────┘
```
- Left panel: `w-80 border-r border-border`
- Message bubbles: Expert → `bg-surface rounded-2xl rounded-tl-sm` | User → `bg-brand-500 text-white rounded-2xl rounded-tr-sm`
- Typing indicator: 3 pulsing dots `● ● ●` (animate-bounce with staggered delay)
- Unread badge: `bg-brand-500 text-white text-xs rounded-full px-1.5`

---

### Screen 7: Expert Dashboard (`/dashboard`)

**Metric Cards Row:**
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total Earned  │  │ Bookings     │  │ Avg Rating   │  │ New Reviews  │
│ $3,240       │  │ 28 sessions  │  │ ★ 4.9        │  │ 7 this week  │
│ ↑ 12% month  │  │ ↑ 3 pending  │  │ 127 reviews  │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```
- Cards use `shadow-raised` elevation
- Trend arrows: green `↑` for positive, red `↓` for negative

**Earnings Chart:**
- `recharts` AreaChart with gradient fill (`fill-brand-500/20`)
- 30-day view by default, toggle to 7d / 90d / 1y

**Upcoming Bookings Table:**
- Columns: Client | Date | Duration | Status | Actions
- Status column uses badge component
- Actions: View, Reschedule, Cancel

**Availability Quick-Edit:**
- Inline week grid showing available hours
- Click to toggle slots — no separate page

---

### Screen 8: Admin Onboarding (`/admin/getting_started`)

**6-card grid with progress tracking:**
```
Progress: 3 of 6 steps complete  ████████████░░░░░░░░ 50%

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ✓ Name your  │  │ ✓ Brand      │  │ ✓ Payments   │
│   marketplace│  │   setup      │  │   connected  │
│   Complete   │  │   Complete   │  │   Complete   │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ → Domain     │  │ ○ Landing    │  │ ○ Invite     │
│   Setup      │  │   Page       │  │   Experts    │
│   In progress│  │   Pending    │  │   Pending    │
└──────────────┘  └──────────────┘  └──────────────┘
```
- Complete cards: `bg-success/5 border-success/20` + green check
- Active card: `bg-brand-50 border-brand-300 ring-2 ring-brand-500/20` + animation pulse on icon
- Pending cards: `bg-surface border-border opacity-70`

---

## 7. Motion Design System

All animations use the `motion` package. Standard easing curves:

```ts
// src/app/lib/motion.ts
export const spring = { type: "spring", stiffness: 300, damping: 28 }
export const ease   = { duration: 0.2, ease: [0.4, 0, 0.2, 1] }

export const fadeInUp = {
  initial:   { opacity: 0, y: 12 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -8 },
  transition: ease
}

export const slideInRight = {
  initial:   { opacity: 0, x: 20 },
  animate:   { opacity: 1, x: 0 },
  exit:      { opacity: 0, x: 20 },
  transition: ease
}
```

**Where motion is used:**
- Route transitions: `fadeInUp` on every page mount
- Tab panel switching: `slideInRight`
- Modal/Sheet entry: built into Radix (use `data-[state=open]:animate-in`)
- Quiz question transitions: `slideInRight` between questions
- Expert card hover: `whileHover={{ scale: 1.02 }}` with shadow upgrade
- Like button: spring scale `1 → 1.3 → 1`

---

## 8. Implementation Sequence

### Sprint 1 (Week 1): Design Foundation
1. Update `src/styles/theme.css` with new color tokens and type scale
2. Add font imports to `src/styles/fonts.css`
3. Add `glass-light`, `glass-dark`, shadow utilities to `globals.css`
4. Create `src/app/lib/motion.ts` with shared animation variants
5. Create `TenantThemeProvider` component (reads CSS variables, exposes context)
6. Build `Topbar` component with navigation, user dropdown, notifications
7. Build `AppShell` layout component (Topbar + content area)
8. Add React Router — create route structure for all screens

### Sprint 2 (Week 2): Discovery & Expert Profile
1. Homepage hero section with search bar + category chips
2. Vertical tab switcher (Consultations / Courses / Sessions)
3. Filter bar (Category, Price, Date, Online toggle)
4. Expert card component with hover animation + skeleton variant
5. Infinite scroll grid (virtualized if needed)
6. Expert storefront: cover + identity header
7. Scroll-spy sticky sub-navigation
8. Booking panel (date row, timeslots, price, CTA)
9. Mobile: booking panel as bottom Sheet drawer

### Sprint 3 (Week 3): Booking & Checkout
1. Booking calendar — date scroll row component
2. Timeslot grid with selection state + timezone display
3. Checkout multi-step wizard (Progress + Accordion)
4. Order summary glass card
5. Communication tool selector
6. Dynamic custom fields renderer
7. Stripe Elements integration (placeholder/mock for now)
8. Booking confirmation screen (success state with confetti)

### Sprint 4 (Week 4): LMS
1. Lesson player layout (dark, full-height)
2. Video viewport component (HTML5 + YouTube embed)
3. Course outline sidebar with module accordion
4. Lesson progress checkmarks
5. Notes/Resources tabs below video
6. Quiz slide deck with question transitions
7. Quiz results modal with radial progress circle

### Sprint 5 (Week 5): Messaging + Dashboard
1. Inbox two-panel layout
2. Thread list with unread badges
3. Message bubble variants (sent/received)
4. Typing indicator animation
5. Input bar with attachment trigger
6. Expert dashboard — metric cards with Recharts
7. Upcoming bookings table
8. Availability quick-edit week grid

### Sprint 6 (Week 6): Admin Panel
1. Admin sidebar (collapsible, with groups from Section 5.2)
2. Getting Started onboarding checklist
3. Branding editor (logo upload, color picker)
4. Custom domain manager
5. Landing page composition drag-and-drop builder

---

## 9. Critical Files to Modify

| File | Change |
|------|--------|
| `src/styles/theme.css` | Replace color tokens with brand palette |
| `src/styles/fonts.css` | Add Google Fonts import |
| `src/styles/globals.css` | Add glassmorphism + shadow utilities |
| `src/app/App.tsx` | Add router + AppShell |
| `src/app/components/ui/button.tsx` | Add `cta` variant (large, glow) |

**New files to create in `src/app/components/`:**
- `AppShell.tsx` — layout wrapper
- `Topbar.tsx` — navigation bar
- `TenantThemeProvider.tsx` — CSS variable injection
- `expert/ExpertCard.tsx` — discovery grid card
- `expert/ExpertCardSkeleton.tsx` — loading state
- `expert/BookingPanel.tsx` — right-side booking widget
- `booking/DateScroller.tsx` — horizontal date row
- `booking/TimeslotGrid.tsx` — available slot buttons
- `checkout/CheckoutWizard.tsx` — multi-step checkout
- `checkout/OrderSummary.tsx` — glass summary card
- `lms/LessonPlayer.tsx` — full-screen lesson view
- `lms/CourseOutline.tsx` — sidebar with progress
- `quiz/QuizSlide.tsx` — single question card
- `quiz/QuizResults.tsx` — results modal
- `messaging/InboxLayout.tsx` — two-panel layout
- `messaging/MessageBubble.tsx` — chat messages
- `dashboard/MetricCard.tsx` — stat card
- `admin/AdminSidebar.tsx` — collapsible nav
- `admin/OnboardingChecklist.tsx` — setup steps

**New pages to create in `src/app/pages/`:**
- `HomePage.tsx`, `ExpertStorefrontPage.tsx`, `CheckoutPage.tsx`
- `LessonPlayerPage.tsx`, `QuizPage.tsx`
- `InboxPage.tsx`, `DashboardPage.tsx`
- `admin/AdminOnboardingPage.tsx`, `admin/BrandingPage.tsx`

---

## 10. Verification Plan

**Visual QA per screen:**
1. Start dev server (already running in Make environment)
2. Check each page at 375px (mobile), 768px (tablet), 1280px (desktop)
3. Toggle dark mode — all surfaces should invert cleanly
4. Check hover states, focus rings (accessibility), and active states
5. Test Motion animations are smooth (no jank)
6. Verify skeleton loaders appear and transition correctly

**Key interaction checks:**
- Discovery tab switch → grid swaps with animation
- Expert card hover → scale + shadow lift
- Booking date selection → timeslots load dynamically
- Checkout step advance → progress indicator updates
- Quiz question next → slide animation + answer lock
- Inbox message send → appears at bottom instantly
- Admin sidebar collapse → icons-only mode

**Accessibility (WCAG AA minimum):**
- All interactive elements have visible focus rings
- Color contrast ≥ 4.5:1 for body text (indigo-600 on white: 5.9:1 ✓)
- Radix UI primitives handle keyboard navigation and ARIA automatically
