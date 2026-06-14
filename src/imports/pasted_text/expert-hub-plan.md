# ExpertHub — Frontend Implementation Plan (Next.js & Modern CSS)

This document outlines the detailed plan to implement and modernize the user interface of **ExpertHub** using **Next.js (App Router)** and modern CSS practices (Vanilla CSS/Tailwind CSS). This plan translates the visual structure and business flow extracted from the legacy `mytin` Rails frontend into a premium, responsive, and interactive experience.

---

## 1. Visual & Aesthetic Architecture

To deliver a premium visual impression, the design system will leverage:
* **Glassmorphism**: Backdrop blur layouts (`backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-white/20`) for floating drawers, checkout summaries, and calendar selectors.
* **Vibrant Themes**: Tailored HSL color models fetched dynamically from the `Tenant` database profile.
* **Micro-Animations**: Clean transitions using Framer Motion for modal drawer popups, carousel navigation, like heart icons, and tab switching.
* **Typography**: Clean, modern fonts (e.g., `Outfit` for headings, `Inter` for content) loaded via Google Fonts.
* **Skeleton Loaders**: Custom animated gradients for cards and detail blocks to prevent page flashes during data loading.

---

## 2. Page & Route Mapping

The Next.js client-side routes will match the Rails backend controllers:

| Route Path | Associated Screen | Target Rails API Endpoints |
|---|---|---|
| `/` | Multi-Vertical Discovery Home | `GET /api/v1/services`, `GET /api/v1/courses`, `GET /api/v1/group_sessions` |
| `/expert/:username` | Expert Storefront Profile | `GET /api/v1/expert_profiles/:username` |
| `/checkout` | Billing & Checkout Form | `POST /api/v1/bookings`, `POST /api/v1/promo_codes/validate` |
| `/courses/:id` | LMS Course Details & Progress | `GET /api/v1/courses/:id`, `POST /api/v1/courses/:id/enroll` |
| `/courses/:id/lessons/:lesson_id` | Lesson Video Player & Notes | `GET /api/v1/lessons/:lesson_id`, `POST /api/v1/lessons/:lesson_id/complete` |
| `/courses/:id/lessons/:lesson_id/quiz` | Interactive Quiz Screen | `POST /api/v1/lessons/:lesson_id/quiz/submit` |
| `/inbox` | Inbox Threads List | `GET /api/v1/conversations` |
| `/inbox/:conversation_id` | Real-time Chat Thread | `GET /api/v1/conversations/:id/messages`, `POST /api/v1/conversations/:id/messages` |
| `/admin/getting_started` | Admin Onboarding Checklist | `GET /api/v1/admin/onboarding_status` |
| `/admin/settings/branding` | Logo & HSL Style Manager | `PATCH /api/v1/admin/branding` |
| `/admin/settings/domains` | CNAME Custom Domain Manager | `GET/POST /api/v1/admin/domains` |
| `/admin/settings/landing_page` | Drag-and-Drop Page Builder | `GET/PATCH /api/v1/admin/landing_page_composition` |
| `/dashboard` | Operator & Expert Analytics | `GET /api/v1/analytics/dashboard` |

---

## 3. Sequential Implementation Stages

### Stage 1: Design Tokens & Layout Foundation
* **Goal**: Establish the base layouts, global variables, and tenant branding contexts.
* **Tasks**:
  * Create `globals.css` with HSL theme root tokens, custom scrollbars, and selection highlights.
  * Implement `TenantThemeProvider` to fetch colors, custom domains, and logos on initial load and distribute them via CSS variables.
  * Build the **Navigation Topbar** (with user dropdown, notifications popover, active tenant branding, role-specific client paths, and responsive burger menu).
  * Build reusable visual components: `SkeletonCard`, `confetti-effect` utility, and glassmorphic modal wrapper.

### Stage 2: Homepage & Search Discovery
* **Goal**: Recreate the multi-vertical grid list alongside Mapbox/Google Maps.
* **Tasks**:
  * Build the sticky tab switcher (switching listings, courses, and webinars).
  * Implement the location typeahead autocomplete (integrating Mapbox Search APIs) and horizontal filter dropdowns (category selections, price slider, calendar date picker).
  * Build the grid list matching `_consult_card_lg.haml` with hover effects and favorite badges.
  * Integrate React Mapbox/Google Map displaying interactive pin coordinates.
  * Implement the symptom checker onboarding modal step wizard.

### Stage 3: Expert Storefront & Social Timeline Feed
* **Goal**: Implement the scroll-spy expert profile with course modules, session tables, and the social updates feed.
* **Tasks**:
  * Build the cover picture photo grid and avatar layout with edit forms.
  * Implement the sticky sub-navigation tab bar with scroll-spy anchors.
  * Build the **Social Feed** timeline:
    * Image/video sliders with touch support.
    * Real-time heart animation toggle (likes counter).
    * Nested comments collapsible tray with scroll locks and comment text areas.
  * Build the review cards list showing star rating aggregates.

### Stage 4: Timeslots Selector & Checkout Flow
* **Goal**: Implement timezone-localized booking calendars and multi-gateway checkout screens.
* **Tasks**:
  * Build the horizontal date scroll row and duration radio buttons.
  * Implement the available timeslots grid dynamically calculated based on selected duration and client browser timezone.
  * Build the appointment package pricing comparison card slider.
  * Build the **Step Checkout Wizard**:
    * Step 1: Communication channels selector (Zoom, Daily, Phone, Chat).
    * Step 2: Custom dynamic fields form (mapping required text, checklist, and file inputs).
    * Step 3: Billing overview (coupon code text field with live AJAX verification, subtotal breakdown table, bank details card).
    * Step 4: Pay button triggering Stripe Element frames or Razorpay redirect handlers.

### Stage 5: LMS Course Player & Interactive Quiz
* **Goal**: Replicate the complete video play, lesson notes checklist, and client-side graded quiz layouts.
* **Tasks**:
  * Build the video viewport (supporting inline MP4 source files and YouTube embeds).
  * Create the collapsible right-side drawer displaying course chapters and completed checkmarks.
  * Build the interactive quiz view:
    * Slide deck layout showing one question at a time with smooth next/back animations.
    * Client-side scoring algorithm comparing selections with correct answers.
    * Result card display showing radial correct percentage, Try Again option, and Next Unit trigger.

### Stage 6: Messaging Inbox & Real-time Chat
* **Goal**: Build the chat thread matching ActionCable WebSocket connections.
* **Tasks**:
  * Build the inbox threads list showing user status indicators, last messages, and unread count badges.
  * Build the conversation view auto-scrolling to the bottom as new elements arrive.
  * Connect WebSocket channels to update messages in real-time.

### Stage 7: Admin Panel Dashboard & Setup Forms
* **Goal**: Implement the sidebar navigation tree, Getting Started guide, branding settings, and custom domains.
* **Tasks**:
  * Build the **Collapsible Admin Navigation Sidebar** (`LeftHandNavigation`) containing sections for metrics, configurations, gateways, and design.
  * Build the **Getting Started Onboarding checklist dashboard** with 6 status cards.
  * Build the **Branding Editor** panel:
    * Wide & Mobile logo drag-and-drop file uploaders.
    * Interactive color picker widgets dynamically updating the admin style.
  * Build the **Custom Domain Manager**:
    * Setup step instructions block.
    * Input form to set custom host domain name.
    * DNS checker button making async check API queries verifying CNAME propagation.

### Stage 8: Custom Composition Landing Page Builder
* **Goal**: Build the modular JSON-based drag-and-drop landing page manager.
* **Tasks**:
  * Build the **Composition Drag List Table** (using `dnd-kit`) allowing operators to re-index page structures.
  * Build customizable forms for each block type: Hero banner, Services benefits, Info blocks, Video players, and List carousels.
  * Create the **Split Preview Panel** displaying responsive live rendering of changes.

---

## 4. Verification & Testing Plan

### Automated Tests
* Use **Jest** and **React Testing Library** to verify:
  * Localization: Timezone helper correctly offsets UTC timeslots into local hours.
  * Grading: Quiz client-side assessment correctly scores multiple-choice options.
  * Theme provider correctly applies HSL variables.
  * Landing page builder correctly compiles composition configurations.
* Use **Cypress** to test:
  * The checkout flow (coupon validation, Stripe sandbox inputs, receipt screens).
  * Smooth scrolling to spy-spy tabs on expert storefronts.
  * Admin drag-and-drop sorting actions.

### Manual Verification
* Deploy the frontend to Vercel/Netlify connected to the staging Rails API.
* Audit performance scores (Targeting Lighthouse: SEO: 100, Accessibility: 95+, LCP: < 2.5s).
