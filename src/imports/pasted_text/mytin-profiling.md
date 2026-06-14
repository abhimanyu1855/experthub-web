# mytin — Frontend View & Logic Profiling

This document profiles all major user interfaces (Lander/Homepage, Expert Storefronts, LMS Courses & Lessons, Interactive Quizzes, Checkout Flows, Messaging/Inbox, and Admin Settings) found in the `mytin` repository. It maps out their visual layouts, key client-side functions, stylesheet definitions, and modern React/Next.js visual modernization strategies.

---

## 1. Homepage & Discovery Lander

### Visual Layout & Structure
* **Files**: [homepage/index.haml](file:///Users/sambhar/Desktop/mytin/app/views/homepage/index.haml), [homepage/_consult_card_lg.haml](file:///Users/sambhar/Desktop/mytin/app/views/homepage/_consult_card_lg.haml), `homepage/flex-theme/*`, [_home.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/views/_home.scss)
* **Components**:
  * **Header Hero Block**: Large cover photo showcasing the marketplace slogan (`community_slogan`) and description, containing a centered search form (query search or typeahead location search).
  * **Switch Tab Selector**: A sticky tab button row (`homepage_content_switch_buttons`) to select the active marketplace vertical:
    * `consult` (listings grid view)
    * `courses` (LMS course cards grid view)
    * `session` (webinars/group classes cards grid view)
  * **Horizontal Filter Bar**: Responsive dropdowns for Category selection, date filters, price ranges, online expert switches, and custom fields.
  * **List / Map Container**: A split-screen responsive layout:
    * Left-hand column (`col-7` / `col-12` on mobile): Renders listing grid cards (`_consult_card_lg.haml` / `_consult_card_sm.haml`) or lists with infinity scroll pagination (`will_paginate` + `pageless`).
    * Right-hand column (`col-5` / hidden on mobile): Google Maps component (`_map.haml`) indicating expert locations with custom interactive pin markers (`markerclusterer.js`).

### Key Client-Side Functionalities
* **Infinity Pagination**: Calls `pageless.js` to append grid cards dynamically as the user scrolls, avoiding page reloads.
* **Online Switch Toggle**: Calls `homepage.js` to refresh result listings filtered by active real-time socket connections.
* **Symptom Checker Interceptor**: If `enable_categorywise_symptoms_checker` is enabled, any click on "Book Now" or "Chat Now" on an expert's card intercepts the action, displays the `#categoriesPopup` symptom selection modal, and forwards to booking/chat once symptoms are submitted.

### SCSS Assets Profile
* `_home.scss` controls the grid ratios, hover overlays, and cover photos.
* `_home-thumbnail-grid.scss` structures the card layout using float/flex layouts, with custom CSS variables defining the primary colors (`$main_color`).

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Replace the static header image with a high-contrast dark gradient layer overlay combined with glassmorphic cards.
  * **Micro-animations**: Cards should scale on hover (`scale-102`) with smooth transitions (`transition-all duration-300 shadow-md hover:shadow-xl`).
  * **Skeleton Loaders**: Replace the "loading more..." texts with animated, pulse-effect card skeletons (`animate-pulse bg-slate-200`) during infinite paginated queries.
  * **Responsive Drawer**: On mobile viewports, relocate filters into a slide-up floating drawer with a blur backdrop (`backdrop-blur-md bg-white/80`).

---

## 2. Expert Storefront & Details Page

### Visual Layout & Structure
* **Files**: [listings/new_store_front_expert_page.haml](file:///Users/sambhar/Desktop/mytin/app/views/listings/new_store_front_expert_page.haml), [_store_front_expert_page.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/views/_store_front_expert_page.scss)
* **Components**:
  * **Cover Banner**: A full-width header cover photo with a centered absolute circular avatar, display name, verified badges, rating statistics, and active status flag (Online/Offline).
  * **Navigation Tabs**: A horizontal sticky anchor bar (`About`, `Specialization`, `Courses`, `Sessions`, `Posts`, `Reviews`).
  * **Split Frame Layout**:
    * Left Column (`col-8` / `col-12` on mobile): Modular sections linked to navigation tabs:
      * **About**: Markdown-rendered bio text.
      * **Specializations**: Flex-wrap badge items.
      * **Courses**: Listing grid containing course images, ratings, title, description, and price labels.
      * **Webinar Sessions**: Grid displaying group class timings and enrollment price.
      * **Feed Posts**: Expert social updates containing media carousels (image/video sliders), comment counters, expandable comments view, and chat comment inputs.
      * **Reviews**: User testimonial list.
    * Right Column (`col-4` / sticky bottom drawer on mobile): Booking panel containing appointment schedule selectors (`_listing_actions.haml`).

### Key Client-Side Functionalities
* **Tab Selection Tracking**: Custom scroll-spy JS toggles active tab indicators based on scroll offsets.
* **Feed Media Carousel**: Javascript touch-enabled sliders (`image_carousel.js`) navigating multi-photo feed posts.
* **Comments & Likes Submissions**: Real-time AJAX operations submit comments to `feed_comments_path`, inserting the new comment container without resetting scroll states. Toggles post hearts.
* **Sticky Bottom Trigger**: For mobile viewports, the scheduling panel is collapsed. A sticky button (`#book-appointment-btn`) slides up a calendar modal drawer.

### SCSS Assets Profile
* `_store_front_expert_page.scss` sets absolute cover margins, circular image boundaries, and the border-radius metrics. It relies on media queries for mobile-specific button overlays.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Apply Framer Motion slide-in transitions when switching tabs to make panel transitions feel fluid.
  * Use CSS anchor positioning or glassmorphism on the right-hand booking calendar sticky sidebar so it floats elegantly during scrolling.
  * Replace raw video embeds with a modern custom React player supporting inline play, volume overlays, and auto-pause on scroll triggers.

---

## 3. Booking Calendar & Package Selector

### Visual Layout & Structure
* **Files**: [listings/_calendar.haml](file:///Users/sambhar/Desktop/mytin/app/views/listings/_calendar.haml), [listings/_appointment_packages.haml](file:///Users/sambhar/Desktop/mytin/app/views/listings/_appointment_packages.haml), [listings/_package_detail.haml](file:///Users/sambhar/Desktop/mytin/app/views/listings/_package_detail.haml), [_avail_calendar.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/partials/_avail_calendar.scss)
* **Components**:
  * **Dates Header Row**: A horizontal sliding selector (`_date_calendar.haml`) displaying dates (Day name + Day number) with back/next arrow triggers.
  * **Duration Selector**: Button group mapping available meeting lengths (e.g. 15m, 30m, 45m, 60m).
  * **Available Timeslot Grid**: Multi-column list of hourly buttons (e.g. 09:00 AM, 10:30 AM) representing slots available in the user's timezone.
  * **Action Button**: A primary call-to-action button showing the final consultation fee (`Book Now at $X.XX`).
  * **Package Selector Overlay**: An alternative view listing bundled offerings (e.g., "5-Session Package") with details (`_package_detail.haml`).

### Key Client-Side Functionalities
* **Dynamic Time Fetching**: Selecting a date runs an AJAX query to fetch available hours (`FromToDatePicker.sendDate`).
* **Price Calculation**: Selecting a duration updates the fee label dynamically using pricing config arrays (`custom_slot_pricing`).
* **Timezone Localization**: Detects browser local timezone offsets and maps UTC slots into correct user strings prior to display.
* **Button Validation**: The primary checkout trigger is initialised as disabled, toggled to active only when a slot is clicked.

### SCSS Assets Profile
* `_avail_calendar.scss` controls timeslot margins, select borders, and hover indicator animations.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Use a circular date calendar layout (such as a smooth flatpicker/modal design) with transition indicators showing slot availability counts per day.
  * Use micro-animations like hover scaling, subtle color transitions, and checkmark icons for selected timeslots.
  * Use absolute loaders during AJAX timezone recalculations rather than freezing selectors.

---

## 4. Checkout & Billing Screen

### Visual Layout & Structure
* **Files**: [do_checkout/new.haml](file:///Users/sambhar/Desktop/mytin/app/views/do_checkout/new.haml), [do_checkout/_choose_communication_tool_for_appointment.haml](file:///Users/sambhar/Desktop/mytin/app/views/do_checkout/_choose_communication_tool_for_appointment.haml), [_do_checkout.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/partials/_do_checkout.scss)
* **Components**:
  * **Breadcrumbs Line**: Back navigation trail indicator.
  * **Left Column**:
    * **Listing Snapshot**: Small grid containing the service cover image, title, and expert name.
    * **Appointment Details**: Form box confirming chosen date, duration, and timezone metrics.
    * **Communication Tool Selector**: Radio buttons for chosen channel (e.g. Zoom, Daily.co Room, Phone, Chat).
    * **Additional Questions**: Custom dynamic question inputs, text areas, or file uploaders.
  * **Right Column**:
    * **Coupon Redemptions Input**: Form to write promo/discount vouchers.
    * **Billing Summary Table**: Detailed rows (Booking fee + Taxes - Discounts = Grand Total).
    * **Direct Bank Transfer Panels**: Custom text boxes containing banking keys (Account, IFSC, Bank name) for offline transaction markets.
    * **Checkout Action Triggers**: Primary buttons targeting specific payment gateway integration hooks (Stripe checkout, Razorpay gateway overlay, Flutterwave, MyFatoorah).

### Key Client-Side Functionalities
* **Coupon Application**: Sending a promo string calls `ST.promo_code.apply()` which runs an AJAX query to validate conditions, updates the bill summary block dynamically, and recalibrates the final gateway price.
* **Communication Options Change**: Listens to toggles, updating required payload parameters (e.g. demanding phone number inputs when Phone call is clicked).
* **Payment SDK Initiators**: Clicks on checkout run custom SDK wrappers (e.g., `ST.payForBooking` or `ST.PowerTranzSettings.payForBooking`) which display the secure credit card overlay.

### SCSS Assets Profile
* `_do_checkout.scss` handles billing table structures, padding, responsive order reversals (putting summary on top in mobile views), and error borders.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Organize checkout forms using a clean accordion step layout (`1. Appointment Details`, `2. Communication Choice`, `3. Payment Info`).
  * Implement glassmorphic card designs for bank details and invoices.
  * Use inline validation indicators showing validation status (e.g. green checkmarks on valid inputs).
  * Enable smooth spinner transitions inside the pay button during checkout captures.

---

## 5. LMS Course Player & Lessons Sidebar

### Visual Layout & Structure
* **Files**: [courses/start_lesson.haml](file:///Users/sambhar/Desktop/mytin/app/views/courses/start_lesson.haml), [courses/_lessons_side_bar.haml](file:///Users/sambhar/Desktop/mytin/app/views/courses/_lessons_side_bar.haml), [courses/_lesson_switch_action_row.haml](file:///Users/sambhar/Desktop/mytin/app/views/courses/_lesson_switch_action_row.haml), [_courses.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/views/_courses.scss)
* **Components**:
  * **Top Breadcrumbs**: Standard title paths.
  * **Video Viewport Container**: Full-width viewport containing YouTube iframe or HTML5 mp4 player.
  * **Notes / Resources Tab Section**: Below the video, a modular container displaying text notes, downloadable document lists (with download icons), and resource links.
  * **Navigation Bar**: Bottom-docked bar containing `Previous Lesson` and `Next Lesson / Start Quiz` buttons.
  * **Course Index Drawer (Sidebar)**: Toggleable overlay drawer showing Modules, Lesson rows (marked with completed icons/checkboxes), and active lesson highlighting.

### Key Client-Side Functionalities
* **Lesson Progress Check**: Clicking `Mark Complete` fires an AJAX POST updating the completion logs.
* **Auto-Next Navigation**: When video playback completes, event listeners trigger notifications to forward the user to the next unit.
* **Sidebar Toggle**: Toggle buttons slide the lessons panel in/out on small screens.

### SCSS Assets Profile
* `_courses.scss` handles video aspect ratios (responsive 16:9 box scaling), notes section paddings, and list borders.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Implement a full dark-mode interface for the lesson player window to prioritize video focus.
  * **Transitions**: Use Framer Motion to slide the course index drawer from the right.
  * Provide animated progress bars indicating overall course completion percentages.
  * Implement smooth scroll triggers that auto-collapse headers when the video starts playing.

---

## 6. Interactive Quizzes & Results Page

### Visual Layout & Structure
* **Files**: [courses/start_quiz.haml](file:///Users/sambhar/Desktop/mytin/app/views/courses/start_quiz.haml), [courses/_quiz_result.haml](file:///Users/sambhar/Desktop/mytin/app/views/courses/_quiz_result.haml), [_quiz.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/partials/_quiz.scss), [submit_quiz.js](file:///Users/sambhar/Desktop/mytin/app/assets/javascripts/submit_quiz.js)
* **Components**:
  * **Question Cards**: Sequential box blocks containing the question title and options checklist.
  * **Option Rows**: Circular checklist round checkmark toggles.
  * **Quiz Footer Controls**: `Quit Quiz` button and `Submit Quiz` action.
  * **Results Modal Overlay**: Displayed upon submission, showing overall percentage, Correct vs Wrong count rows, Try Again links, and Next Unit buttons.

### Key Client-Side Functionalities
* **Selection State Tracker**: Clicking an option checkbox toggles the `.selected` CSS class on the row element.
* **Client-Side Grading**: On submit, `submitQuiz` loops through the DOM options, reads `data-iscorrect` states, calculates the correct score and percentage, and determines pass status.
* **State Sync**: Submits a POST containing performance arrays (`selected_options`) and completion flags via AJAX to save scores.

### SCSS Assets Profile
* `_quiz.scss` defines custom round checkboxes, grid offsets, and result card overlays.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Render questions in a paginated slide deck rather than a single long list, using slide transitions for each question.
  * Add success/failure micro-animations: green checkmarks for correct options, red highlights for wrong choices, and confetti effects upon passing.
  * Use a clean radial progress circle indicating final test scores.

---

## 7. Messaging & Chat Threads

### Visual Layout & Structure
* **Files**: [inboxes/show.haml](file:///Users/sambhar/Desktop/mytin/app/views/inboxes/show.haml), [conversations/show.haml](file:///Users/sambhar/Desktop/mytin/app/views/conversations/show.haml), [_conversation.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/views/_conversation.scss)
* **Components**:
  * **Inbox Thread Grid**: Scrollable list of chats containing user avatars, names, last message snippet, timestamp, and unread badges.
  * **Message Viewport**: Chat history panel displaying message bubbles (left-aligned for sender, right-aligned for receiver) with timestamps.
  * **Input Bar**: Bottom-docked form field containing text inputs and media attachments.

### Key Client-Side Functionalities
* **Message Polling/Sockets**: Updates the messaging container as new payloads arrive.
* **Auto-Scroll**: Automatically scrolls the viewport to the bottom when new messages are received or sent.
* **Unread State Trigger**: Focus/scroll triggers AJAX calls to mark messages as read.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Implement standard typing indicator animations (`pulse dots`).
  * Provide support for drag-and-drop file/image uploads directly into the chat container.
  * Render hover actions on message bubbles (e.g. quick reactions or copy button options).

---

## 8. Admin Settings & Earning Dashboard

### Visual Layout & Structure
* **Files**: [settings/earning_dashboard.haml](file:///Users/sambhar/Desktop/mytin/app/views/settings/earning_dashboard.haml), [_earning_dashboars.scss](file:///Users/sambhar/Desktop/mytin/app/assets/stylesheets/partials/_earning_dashboars.scss)
* **Components**:
  * **Left Dashboard Sidebar**: Custom settings list links.
  * **Metrics Grid**: Card blocks containing revenue aggregates (Gross sales, commission rates, net expert payouts).
  * **Details Table**: Tabulated list of transactions showing date, status, buyer name, and billing values.
  * **Onboarding Wizards**: Step-by-step checklist templates for Stripe Connect links, custom fields, and domain additions.

### Key Client-Side Functionalities
* **Search / Pagination**: Quick search filter on billing tables using client-side column filters.
* **Onboarding Steps**: Track completed profile settings, disabling listings creation until checklist criteria are met.

### SCSS Assets Profile
* `_earning_dashboars.scss` defines custom round checkboxes, grid offsets, and result card overlays.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Use modern SVG charting libraries (e.g. Recharts or Tremor components) to visualize earnings trends.
  * Implement clean layout configurations with glassmorphic metrics widgets and high-contrast tables.
  * Use animated onboarding progress bars to guide users through initial setup stages.

---

## 9. Admin Onboarding Guide & Sidebar Navigation

### Visual Layout & Structure
* **Files**: [admin/getting_started_guide/index.haml](file:///Users/sambhar/Desktop/mytin/app/views/admin/getting_started_guide/index.haml), [admin/_left_hand_navigation.haml](file:///Users/sambhar/Desktop/mytin/app/views/admin/_left_hand_navigation.haml)
* **Components**:
  * **Collapsible Sidebar Menu**: Structured using `_left_hand_navigation.haml`. Groups all admin management sub-pages dynamically:
    * `getting_started` (guides and updates).
    * `analytics` (dashboards, list of transactions, subscriber plans usage, payout data logs).
    * `configure` (tenant-wide default setups, custom checklist fields).
    * `payment_settings` (Stripe Connect links, Razorpay credentials, local gateways config).
    * `design_ui` (logos uploads, sitemaps, custom themes, custom domains configuration).
    * `bookings_and_chats` (operator inbox thread lists, calendar scheduling views).
    * `users` (membership rolls).
    * `listing` / `sessions` / `courses` (vertical-specific configurations).
  * **Getting Started Grid**: A dashboard card list containing 6 actionable setup tasks:
    1. **Name your marketplace**: slogan, description inputs (links to `details/edit`).
    2. **Customize your domain**: CNAME DNS configuration guides (links to `admin_domains/:id`).
    3. **Set up your brand**: picking design fonts & theme presets (links to `look_and_feel/edit`).
    4. **Set up landing page**: customizing hero page (links to `manage_landing_page`).
    5. **Create a course/session/listing**: dynamic card based on business type vertical mapping.
    6. **Set up payments**: gateway onboarding (links to Stripe Connect credentials).

### Key Client-Side Functionalities
* **Group Collapsibility**: Sidebar headings listen to clicks, rotating dropdown arrows (0 to 180 degrees) and toggling children list containers (display: none to block).
* **Selected Path Expansion**: Scans list classes for `.selected` tags on initial load, auto-expanding corresponding parent categories.
* **Onboarding Steps Progress**: Enables or locks marketplace visibility based on completed tasks indices.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Implement smooth accordion slide transitions (`framer-motion` height animation blocks) when expanding sidebar options.
  * Add visual progress indicators (such as checkmarks or progress bar gauges) on the Getting Started screen.
  * Replace the static grid design with animated cards containing premium glassmorphism layouts.

---

## 10. Admin Branding & Custom Domain Manager

### Visual Layout & Structure
* **Files**: [admin/communities/edit_look_and_feel.haml](file:///Users/sambhar/Desktop/mytin/app/views/admin/communities/edit_look_and_feel.haml), [admin/admin_domains/show.haml](file:///Users/sambhar/Desktop/mytin/app/views/admin/admin_domains/show.haml), [admin/admin_domain.js](file:///Users/sambhar/Desktop/mytin/app/assets/javascripts/admin/admin_domain.js)
* **Components**:
  * **Logo & Color Section**: Upload forms for Desktop wide logo, Mobile square icon, Favicon, and Text fields for Hex primary colors (`custom_color1`, Slogan colors, Description colors).
  * **Cover Photo Section**: Uploader fields for primary homepage cover photo (1920x450px) and small topbar headers (1920x96px).
  * **Domain Integration Section**: Tab views allowing operators to:
    * **Connect Existing Domain**: Instruction sheets outlining DNS records (adding CNAME to `admin.pantherapp.co`, A record pointing to server IP `34.193.164.254`, and chat CNAME pointing to Hippo) + Input form to save domain suffix.
    * **Buy New Domain**: Interactive domain TLD checker input (`www.[input].[com/in/net/co]`) showing check results.

### Key Client-Side Functionalities
* **Domain Check Validation**: Click checks trigger async Namecheap availability queries (`checkDomainAvailability2`), updating loaders and results lists dynamically.
* **Branding Previews**: File upload listeners render preview thumbnails on the fly.
* **DNS Propagation Warnings**: Displays validation disclaimers about 24-48 hours DNS changes prior to submission.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Implement an inline Color Picker component (such as `react-color` canvas overlays) with instant visual previews of topbars.
  * Build a Drag-and-Drop file uploader module (with progress indicators) for logo and cover assets.
  * Implement DNS status checkers that query target records dynamically and display success/fail alerts (green/red badges).

---

## 11. Custom Composition Landing Page Builder

### Visual Layout & Structure
* **Files**: [admin/manage_landing_page/index.html.erb](file:///Users/sambhar/Desktop/mytin/app/views/admin/manage_landing_page/index.html.erb), [admin/landing_page.js](file:///Users/sambhar/Desktop/mytin/app/assets/javascripts/admin/landing_page.js)
* **Components**:
  * **Composition Matrix Table**: A tabulated vertical stack of active landing page sections. Includes section names, dynamic locale indicators, section IDs, and action lists.
  * **Sort Buttons Row**: Arrow buttons (Up/Down) to change layout order dynamically.
  * **Action Controls**: Edit form triggers and delete options.
  * **Section Selector Dropdown**: Select inputs displaying all available layouts (e.g. Hero banner, Info block, Video player, Services grid, Course carousels, scrollable categories lists).

### Key Client-Side Functionalities
* **Interactive Drag/Sort Toggles**: Moving a row sends asynchronous updates to Rails to save modified sequence indices (`composition`).
* **Live Layout Preview**: Includes a "Preview" button overlaying the modified composition state on a blank viewport before publishing changes.
* **Modular JSON Templates**: Select additions request JSON schemas dynamically based on selected section kinds, spawning custom inputs.

### Modernization & Interaction Strategy
* **Visual Premium Guidelines**:
  * Replace tabulated rows with an interactive Drag-and-Drop block customizer (e.g. using `dnd-kit` or `react-beautiful-dnd`) with smooth transitions.
  * Provide a real-time side-by-side split screen view showing the landing page composition changes instantly on a tablet mock.

---

## 12. React-On-Rails Integration & View Utils

### Architecture & Mounting
* **Files**: `client/app/startup/*`, [client/app/components/sections/Topbar/Topbar.js](file:///Users/sambhar/Desktop/mytin/client/app/components/sections/Topbar/Topbar.js), [app/view_utils/listing_index_view_utils.rb](file:///Users/sambhar/Desktop/mytin/app/view_utils/listing_index_view_utils.rb)
* **Details**:
  * `react_on_rails` registers bundles on the window:
    * `TopbarApp`: Dynamic navigation bar compiling user notification count badges, language flag selectors, and search fields.
    * `SearchPageApp`: Discovery container rendering list card panels dynamically.
    * `ListingWorkingHoursApp` / `ManageAvailabilityApp`: Calendar slot schedulers.
  * View Utilities (`listing_index_view_utils.rb`): Normalizes ActiveRecord attributes into strict Struct definitions (`ListingItem`, `Author`, `ListingImage`) with predefined attributes before passing JSON payloads to React endpoints.
