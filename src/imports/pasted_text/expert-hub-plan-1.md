# ExpertHub — Implementation Plan

> **Strategy**: One codebase (ExpertHub). mytin = read-only specification. Never boot, never upgrade, never deploy mytin.

## Why This Approach

The Cursor plan spends 60-70% of effort on infrastructure (Rails 5→8 upgrade, Hippo decoupling, Docker, strangler pattern) that produces **zero features**. ExpertHub already runs on Rails 8 + PostgreSQL + Next.js 14. The only thing missing is the **business logic** encoded in mytin's 249 tables.

This plan extracts every feature from mytin at the table level, decides keep/cut/defer for each, and sequences the build so you can demo in Week 1 and ship the full Panther replacement by Week 8.

---

## User Review Required

> [!IMPORTANT]
> **Referral Program Budget & Configuration**:
> - We assume referral rewards are credited as local discount vouchers in cents. We will set a default reward of $10.00 (1000 cents) for both referrer and referee, which can be overridden in the tenant's configuration settings. Please confirm if this matches the business logic.
>
> [!IMPORTANT]
> **i18n Translation Schema**:
> - We propose storing translations directly in `translations` JSONB fields on the `Category` and `Page` models (e.g. `{ "en": "Name", "es": "Nombre" }`) to keep schema overhead minimal. If a specific translation is missing for the requested locale, it will fall back to the tenant's default locale. Please verify if dynamic translated models (e.g. via Mobility/Globalize gems) are preferred instead.

## Open Questions

1. **PayPal / Payfast Checkout and Webhook Integration**:
   - For PayPal, do we want to integrate using PayPal Smart Buttons (frontend SDK processing standard capture API endpoints), or standard backend redirect flow?
2. **Analytics Scope**:
   - For the operator/expert dashboards, should statistics be pre-aggregated periodically via a background worker or calculated dynamically on request? (Dynamic computation is proposed for simplicity first, using database indexes).


---

## Complete Feature Inventory (mytin → ExpertHub)

I've read every model, service, and job in mytin. Here's every feature mapped at the table level with a verdict.

### Domain 1: Multi-Tenancy (Community = Tenant)

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `communities` (3,308 LOC model) | Tenant: ident, domain, business_type, marketplace_type, billing, feature flags | `tenants` — clean schema, `locked_vertical` enum, `platform_fee_percent` | **1** |
| `community_customizations` | Name, description, slogan per locale | `tenant_customizations` — simplified, single locale first | **1** |
| `community_domains` | Custom domains per tenant | `tenant_domains` — CNAME instructions, DNS verification | **3** |
| `community_themes` | CSS variables, colors, fonts | Already in `TenantThemeProvider` — store in `tenants` JSON column | **1** |
| `community_memberships` | Person ↔ Community join + role status | `memberships` — `role` enum replaces boolean flags + status string | **1** |
| `community_translations` | i18n per tenant | Skip for MVP — English only, add in Phase 4 |  |
| `community_webhook_settings` | Outbound webhook URLs | `tenant_webhooks` | **3** |
| `community_open_api_keys` | API keys for tenant's open API | `tenant_api_keys` | **3** |
| `community_search_countries` | Restrict search to countries | Column on `tenants` (JSON array) | **3** |
| `community_social_logos` | Social sharing image | Column on `tenants` | **2** |
| `community_deeplinks_configs` | Mobile deep link config | Skip — no mobile app in MVP |  |
| `community_referrals` | Tenant-level referral settings | Skip for MVP |  |
| `community_hippo_gateways` | Hippo chat config | **BURN** — replaced by internal messaging |  |
| `community_yelo_plans` | Billing plan from Yelo platform | **BURN** — we own billing |  |
| `community_zoom_keys` | Zoom OAuth per tenant | Skip — Daily.co only for now |  |
| `marketplace_configurations` | Feature toggles (50+ columns) | `tenant_settings` JSON column on `tenants` | **1** |
| `marketplace_plans` | Sharetribe plan tiers | **BURN** — our own plan system |  |
| `marketplace_trials` | Trial period tracking | Column on `tenants`: `trial_ends_at` | **1** |
| `marketplace_sender_emails` | Custom sender email | Column on `tenants` | **3** |
| `marketplace_setup_steps` | Onboarding wizard state | `tenant_setup_steps` JSON | **2** |
| `feature_flags` | Per-tenant feature flags | JSON column on `tenants` or dedicated `feature_flags` table | **1** |
| `themes` | Global theme presets | Seed data | **2** |

**Key porting note**: Community.rb is a 3,308-line god object. In ExpertHub, `Tenant` should be <200 lines with settings stored as JSON.

---

### Domain 2: Users & Roles

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `people` (6,336 LOC model) | God object: auth, profile, expert settings, timezone, bookings, subscriptions | Split into `users` + `expert_profiles` | **1** |
| `community_memberships` | Role + status in a community | `memberships` with `role` enum: `operator`, `expert`, `client`, `manager` | **1** |
| `person_teams` | Team membership for managers | `team_memberships` | **3** |
| `teams` | Team grouping | `teams` | **3** |
| `hippo_agents` | Chat agent identity | **BURN** |  |
| `person_locale_preferences` | Language preference | Column on `users` | **2** |
| `person_referral_codes` | Referral codes | Skip for MVP |  |
| `person_cards` | Saved payment cards | Handled by Stripe — no local storage needed |  |
| `person_commission_settings` | Per-expert commission override | `expert_commission_overrides` | **2** |
| `person_stripe_verification_links` | Stripe Connect onboarding links | Handled via Stripe API — ephemeral, no table needed |  |
| `follower_relationships` | Expert following | `follows` | **2** |
| `favorite_listings` | Saved/favorited listings | `favorites` | **2** |
| `auth_tokens` | API tokens (legacy) | JWT via Devise — no table needed |  |
| `user_fields` | Custom signup fields per tenant | `custom_user_fields` | **3** |
| `user_delete_logs` | GDPR deletion audit | `user_deletion_logs` | **3** |
| `sent_otps` | OTP records | `otps` (if phone auth needed) | **3** |

**Key porting note**: Person.rb has 50+ boolean flags for roles (`is_admin`, `is_expert`, `is_manager`, `is_hippo_agent`, `is_buddy_expert`). ExpertHub replaces ALL of these with one `memberships.role` enum.

---

### Domain 3: Catalog (Listings / Services)

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `listings` (1,864 LOC) | Expert's service offering (1:1 appointments) | `services` — clean model, <300 LOC | **1** |
| `listing_images` | Service photos | `service_images` (ActiveStorage) | **1** |
| `listing_videos` | Service videos | `service_videos` (ActiveStorage) | **3** |
| `listing_shapes` | Transaction type (product/rental/service/consult) | Not needed — ExpertHub is consult-only. Column `service_type` on `services` | **1** |
| `listing_working_hours` | Per-listing availability override | `service_availability_overrides` | **2** |
| `listing_blockdates` | Blocked dates | `blocked_dates` | **1** |
| `listing_datetime_prices` | DateTime-based pricing (hour/day/night rates) | `service_pricing_rules` | **2** |
| `listing_ratings` | Review/ratings | `reviews` (polymorphic) | **2** |
| `listing_promos` | Promo ↔ listing join | `promo_targets` (polymorphic) | **3** |
| `listing_demos` | Demo/trial bookings | Skip for MVP |  |
| `listing_followers` | Following a listing | `favorites` (polymorphic) | **2** |
| `listing_units` | Unit types (hour/day/night) | Column on `services` | **1** |
| `listing_average_ratings` | Cached average | Calculated field, no table | |
| `categories` | Service categories (hierarchical) | `categories` with `parent_id` | **1** |
| `category_translations` | Category names per locale | English only for MVP — column on `categories` | **1** |
| `category_custom_fields` | Custom field ↔ category link | `category_custom_fields` | **3** |
| `category_listing_shapes` | Category ↔ shape link | Not needed — single shape |  |
| `category_commission_settings` | Commission override per category | `category_commission_overrides` | **2** |
| `custom_fields` | Dynamic fields on listings | `custom_fields` (EAV pattern) | **3** |
| `custom_field_values` + 6 type tables | STI values | `custom_field_values` (JSONB) | **3** |
| `custom_slot_pricings` | Per-slot price overrides | `slot_pricing_overrides` | **3** |
| `security_listings` | Listings with security deposits | Column `security_deposit_cents` on `services` | **3** |

**Key porting note from mytin**: The `listing.get_date_time_slots()` method (lines 692-820 of listing.rb) is the most complex business logic in the codebase — 130 lines of nested timezone arithmetic, booking overlap detection, Google Calendar integration, and multi-joinee slot filtering. This MUST be ported carefully into a dedicated `AvailabilityService` in ExpertHub.

---

### Domain 4: Bookings & Transactions (the money path)

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `transactions` | Payment + booking state machine (38 states) | `bookings` — AASM, simplified to ~15 states | **1** |
| `transaction_transitions` | Statesman audit trail | `booking_transitions` (AASM or Statesman) | **1** |
| `transaction_processes` | Process type per community | Not needed — single process type |  |
| `transaction_process_tokens` | One-time use tokens | Not needed |  |
| `transaction_params` | Stored checkout params | Column on `bookings` (JSONB) | **1** |
| `bookings` (mytin) | start_time, end_time, per_hour, per_datetime | Merged into `bookings` table | **1** |
| `scheduled_transactions` | Confirmed booking + video room link | `booking_sessions` — video room, calendar event | **1** |
| `scheduled_transaction_instants` | Multi-slot bookings | `booking_slots` | **2** |
| `booking_ratings` | Post-session ratings | `reviews` (polymorphic) | **2** |
| `reschedule_appointments` | Reschedule request/accept/reject/expire | `reschedule_requests` | **2** |
| `reschedule_activities` | Reschedule audit log | Column on `reschedule_requests` | **2** |
| `transaction_cancel_requests` | Cancellation requests | `cancellation_requests` | **2** |
| `cancellation_policies` | Refund rules per tenant | `cancellation_policies` | **2** |
| `cancel_policy_reasons` | Cancellation reason options | `cancellation_reasons` | **2** |
| `transaction_checkout_fields` | Custom checkout fields | `checkout_fields` | **3** |
| `transaction_checkout_field_selections` | Checkout field values | `checkout_field_values` | **3** |
| `order_permissions` | Order-level permissions | Skip — use Pundit |  |
| `order_request_details` | Order request metadata | Skip |  |
| `date_time_units` | Booking unit configuration | Column on `services` |  |
| `date_time_transaction_prices` | Per-booking pricing record | Columns on `bookings` |  |

**State Machine Porting Guide** (from [transaction_process_state_machine.rb](file:///Users/sambhar/Desktop/mytin/app/state_machines/transaction_process_state_machine.rb)):

```
mytin (38 states)                    ExpertHub (15 states)
─────────────────                    ─────────────────────
not_started                     →    pending
free                            →    confirmed_free
initiated                      →    payment_initiated
payment_intent_requires_action  →    payment_action_required
payment_intent_failed           →    payment_failed
payment_intent_action_expired   →    payment_expired
preauthorized                   →    authorized
pending_ext                     →    (merge into authorized)
paid                            →    paid
confirmed                      →    confirmed
rejected                       →    rejected
canceled                        →    canceled
errored                         →    errored

SKIP (escrow — 7 states):
escrow_*                        →    Not in MVP

SIMPLIFY (cancellation — 6 states):
buyer_cancel_before_paid*       →    cancel_requested → canceled/cancel_rejected
buyer_cancel_after_paid*        →    cancel_requested → refunded/cancel_rejected

SKIP (security deposit — 3 states):
security_*                      →    Phase 3
```

---

### Domain 5: Payments & Commission

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `payment_settings` | Gateway config per tenant | Columns on `tenants` or `payment_configs` | **1** |
| `stripe_payment_settings` | Stripe keys per tenant | `payment_configs` (encrypted) | **1** |
| `stripe_accounts` | Expert Stripe Connect accounts | `payout_accounts` | **1** |
| `stripe_payments` | Stripe payment records | `payment_records` | **1** |
| `stripe_transfers` | Platform → expert transfers | `payout_records` | **1** |
| `stripe_payouts_data` | Payout batch records | `payout_records` (same table) | **1** |
| `stripe_api_logs` | API call audit | `payment_api_logs` | **2** |
| `razorpay_accounts` | Razorpay linked accounts | `payout_accounts` (gateway column) | **2** |
| `razorpay_orders` | Razorpay order records | `payment_records` (gateway column) | **2** |
| `razorpay_payments` | Razorpay payment records | `payment_records` | **2** |
| `razorpay_api_logs` | API audit | `payment_api_logs` | **2** |
| `paypal_accounts` + 7 PayPal tables | PayPal integration | Skip for MVP — Stripe + Razorpay sufficient |  |
| `payfast_*` (3 tables) | South Africa payments | Skip for MVP |  |
| `escrow_*` (3 tables) | Escrow.com integration | Skip for MVP |  |
| `commission_settings` | Default commission per tenant | Columns on `tenants`: `seller_commission_pct`, `buyer_commission_pct` | **1** |
| `category_commission_settings` | Commission override per category | `category_commission_overrides` | **2** |
| `person_commission_settings` | Commission override per expert | `expert_commission_overrides` | **2** |
| `payouts_data` | Legacy payout records | `payout_records` | **1** |
| `checkout_accounts` | Buyer saved payment methods | Stripe handles this |  |
| `checkout_fields` + `checkout_field_categories` | Custom checkout form fields | `checkout_fields` | **3** |

**Commission Engine** (from [transaction.rb](file:///Users/sambhar/Desktop/mytin/app/models/transaction.rb) lines 605-640):
```ruby
# mytin: 3-tier commission cascade
# 1. person_commission_settings (expert-specific override)
# 2. category_commission_settings (category override)
# 3. commission_settings (tenant default)
# + minimum_commission floor
# + buyer_commission (charged to buyer on top of price)

# ExpertHub: Same cascade, cleaner implementation
class CommissionCalculator
  def calculate(booking)
    rate = expert_override || category_override || tenant_default
    seller_commission = [booking.subtotal * rate, minimum_commission].max
    buyer_fee = booking.subtotal * buyer_commission_rate
    { seller_commission:, buyer_fee:, expert_payout: booking.subtotal - seller_commission }
  end
end
```

---

### Domain 6: Video & Calendar

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `expert_appointment_rooms` | Hippo video room URLs | **BURN** |  |
| `daily_expert_appointment_rooms` | Daily.co room URLs for 1:1 | `video_rooms` | **1** |
| `expert_session_rooms` | Hippo group session rooms | **BURN** |  |
| `expert_session_daily_rooms` | Daily.co group rooms | `video_rooms` | **2** |
| `expert_session_zoom_rooms` | Zoom group rooms | Skip — Daily.co only |  |
| `expert_session_meet_rooms` | Google Meet rooms | Skip — Daily.co only |  |
| `google_calendar_configs` | Calendar OAuth config | `calendar_integrations` | **2** |
| `google_calendar_tokens` | OAuth tokens | `calendar_integrations` (encrypted) | **2** |
| `google_calender_events` | Synced events | `calendar_events` | **2** |

**Video Room Creation** (from [scheduled_transaction.rb](file:///Users/sambhar/Desktop/mytin/app/models/scheduled_transaction.rb) lines 173-201):
```ruby
# mytin's create_daily_room — 30 lines of raw Net::HTTP
# ExpertHub: DailyService with proper error handling
class DailyService
  def create_room(booking)
    response = client.post("/v1/rooms", {
      name: "#{booking.service_title}_#{SecureRandom.hex(4)}",
      properties: {
        nbf: booking.start_time.to_i,
        exp: (booking.end_time + 5.minutes).to_i
      }
    })
    booking.create_video_room!(url: response["url"], provider_id: response["id"])
  end
end
```

---

### Domain 7: Courses & Group Sessions

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `courses` (465 LOC) | Course with lessons, enrollment, certificates | `courses` | **3** |
| `lessons` | Course lessons (video/quiz/text) | `lessons` | **3** |
| `lesson_quizzes` | Quiz questions per lesson | `lesson_quizzes` | **3** |
| `lesson_resources` | Downloadable resources | `lesson_resources` (ActiveStorage) | **3** |
| `quiz_questions` | Quiz question bank | `quiz_questions` | **3** |
| `quiz_options` | Answer options | `quiz_options` | **3** |
| `course_categories` | Course category hierarchy | `categories` (polymorphic or `category_type`) | **3** |
| `course_certifications` | Certificate templates | `certificate_templates` | **3** |
| `course_comments` | Course reviews | `reviews` (polymorphic) | **3** |
| `person_course_purchases` | Course enrollment records | `enrollments` | **3** |
| `person_course_progresses` | Lesson completion tracking | `lesson_progress` | **3** |
| `person_lesson_progresses` | Individual lesson progress | `lesson_progress` | **3** |
| `person_quiz_selected_answers` | Quiz attempt records | `quiz_attempts` | **3** |
| `expert_sessions` (322 LOC) | Group session bookings | `group_sessions` | **3** |
| `session_attendances` | Group session enrollments | `session_attendances` | **3** |
| `session_categories` | Group session categories | `categories` (category_type) | **3** |
| `course_promos` + `course_category_promos` | Promo ↔ course links | `promo_targets` (polymorphic) | **3** |

---

### Domain 8: Expert Packages & Subscriptions

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `expert_booking_packages` | Bundle deals (X appointments + Y sessions + Z courses) | `booking_packages` | **3** |
| `booking_package_listings` | Package ↔ listing links | `package_services` | **3** |
| `booking_package_courses` | Package ↔ course links | `package_courses` | **3** |
| `person_package_purchases` | Customer package purchases | `package_purchases` | **3** |
| `subscription_plans` | Recurring subscription tiers | `subscription_plans` | **3** |
| `subscription_plan_benefits` | Benefits per plan | `subscription_benefits` | **3** |
| `subscription_benefits` | Benefit definitions | `benefit_definitions` (seed) | **3** |
| `person_subscriptions` | Active subscriptions | `subscriptions` | **3** |
| `person_subscription_benefits` | Benefit usage tracking | `subscription_usage` | **3** |
| `subscription_payments` | Recurring payment records | `subscription_payments` | **3** |
| `subscription_discounts` + 2 join tables | Discount campaigns on subscriptions | `subscription_discounts` | **3** |
| `subscription_logs` | Subscription event log | `subscription_events` | **3** |
| `subscription_plan_transactions` | Subscription purchase records | `subscription_payments` (same) | **3** |

---

### Domain 9: Marketing & Engagement

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `promos` | Promo codes (%, fixed, variable) | `promo_codes` | **3** |
| `applied_promos` | Promo usage tracking | `promo_redemptions` | **3** |
| `category_promos` | Promo ↔ category links | `promo_targets` (polymorphic) | **3** |
| `interval_promo_values` | Variable promo tiers | `promo_tiers` | **3** |
| `referrals` | Referral tracking | `referrals` | **4** |
| `applied_referrals` | Referral credit records | `referral_credits` | **4** |
| `testimonials` | Expert testimonials | `reviews` (polymorphic) | **2** |
| `advertisements` | Banner ads per tenant | Skip |  |
| `feeds` + 5 feed tables | Social feed per listing | Skip for MVP |  |
| `content_pages` | CMS pages per tenant | `pages` | **3** |
| `landing_pages` + `landing_page_versions` | Custom landing pages | `landing_pages` | **3** |
| `invitations` + `invitation_unsubscribes` | Email invitations | `invitations` | **2** |
| `prospect_emails` | Lead capture | Skip |  |
| `signup_texts` | Custom signup copy | Column on `tenants` | **3** |
| `social_links` | Social media links | JSON on `tenants` | **2** |

---

### Domain 10: Infrastructure & Messaging

| mytin table | mytin purpose | ExpertHub action | Phase |
|---|---|---|---|
| `conversations` | Chat threads | `conversations` (ActionCable or third-party) | **2** |
| `messages` | Chat messages | `messages` | **2** |
| `participations` | Conversation participants | `conversation_participants` | **2** |
| `emails` | Email records | Rails Mailer — no table needed |  |
| `notifications` / `notification_details` | In-app notifications | `notifications` | **2** |
| `delayed_jobs` | Background job queue | SolidQueue (Rails 8 default) |  |
| All `*_api_logs` tables (8 tables) | API call audit | `api_audit_logs` (single table) | **2** |
| `active_sessions` / `tb_active_app_sessions` | Session tracking | Rails session store |  |
| `menu_links` + translations | Navigation menus | `navigation_items` | **3** |
| All Hippo/Fugu tables (6 tables) | **BURN entirely** |  |  |
| All Jungle Auth tables | **BURN entirely** |  |  |

---

### Domain 11: AI (New — not in mytin)

| ExpertHub table | Purpose | Phase |
|---|---|---|
| `expert_embeddings` | pgvector embeddings for AI matching | **2** |
| `ai_triage_sessions` | Triage chatbot conversation state | **2** |
| `session_summaries` | AI-generated post-session summaries | **2** |

---

## Table Count Summary

| Category | mytin tables | ExpertHub tables (Phase 1) | ExpertHub tables (all phases) | Burned |
|---|---|---|---|---|
| Tenancy | 21 | 4 | 8 | 5 |
| Users | 16 | 4 | 8 | 2 |
| Catalog | 22 | 5 | 12 | 3 |
| Transactions | 15 | 5 | 10 | 2 |
| Payments | 30 | 5 | 8 | 18 |
| Video/Calendar | 8 | 1 | 4 | 4 |
| Courses/Sessions | 16 | 0 | 12 | 0 |
| Packages/Subs | 13 | 0 | 10 | 0 |
| Marketing | 16 | 0 | 6 | 2 |
| Infrastructure | 20 | 0 | 4 | 12 |
| AI (new) | 0 | 0 | 3 | 0 |
| **TOTAL** | **249** | **~24** | **~85** | **~48** |

**Phase 1 builds only 24 tables.** That's the entire MVP.

---

## Proposed Changes

### Phase 1: Core Loop (Weeks 1-3) — Ship & Sell

> Goal: Operator can demo: tenant setup → expert onboarding → client books → pays via Stripe → Daily.co session → booking confirmed

---

#### Backend (Rails 8 API)

##### [MODIFY] ExpertHub API migrations + models

Create these migrations and models:

```
db/migrate/
├── create_tenants.rb          # ident, domain, name, locked_vertical, platform_fee_pct, settings(jsonb)
├── create_users.rb            # email, password (Devise), given_name, family_name, avatar
├── create_memberships.rb      # user_id, tenant_id, role(enum), status
├── create_expert_profiles.rb  # user_id, specialization, bio, timezone_offset, slot_interval
├── create_categories.rb       # tenant_id, name, parent_id, sort_priority
├── create_services.rb         # expert_profile_id, tenant_id, category_id, title, description,
│                              # price_cents, currency, duration_minutes, approval_status
├── create_service_images.rb   # ActiveStorage
├── create_working_time_slots.rb  # expert_profile_id, week_day, from_time, till_time
├── create_blocked_dates.rb    # service_id, date
├── create_bookings.rb         # service_id, client_id, expert_id, tenant_id, start_time, end_time,
│                              # status(enum/AASM), price_cents, commission_cents, stripe_payment_intent_id
├── create_booking_transitions.rb  # AASM audit trail
├── create_video_rooms.rb      # booking_id, provider(daily), url, provider_room_id
├── create_payment_configs.rb  # tenant_id, gateway(enum), credentials(encrypted)
├── create_payout_accounts.rb  # expert_profile_id, gateway, stripe_account_id
└── create_payment_records.rb  # booking_id, gateway, provider_id, amount_cents, status
```

##### [NEW] Core Services (port from mytin)

| Service | Ported from | Key logic |
|---|---|---|
| `TenantSetupService` | [marketplace_service.rb](file:///Users/sambhar/Desktop/mytin/app/services/marketplace_service.rb) L116-140 | Create tenant + default category + admin user |
| `AvailabilityService` | [listing.rb](file:///Users/sambhar/Desktop/mytin/app/models/listing.rb) L692-820 | Slot generation, overlap detection, timezone math |
| `BookingService` | [transaction_service/](file:///Users/sambhar/Desktop/mytin/app/services/transaction_service/) | State machine transitions, validation |
| `CommissionCalculator` | [transaction.rb](file:///Users/sambhar/Desktop/mytin/app/models/transaction.rb) L605-640 | 3-tier cascade: expert → category → tenant default |
| `StripeService` | [stripe_service/](file:///Users/sambhar/Desktop/mytin/app/services/stripe_service/) | PaymentIntent create, webhook handling, Connect transfers |
| `DailyService` | [scheduled_transaction.rb](file:///Users/sambhar/Desktop/mytin/app/models/scheduled_transaction.rb) L173-201 | Room create on booking confirm |
| `WebhookService` | New | Idempotent Stripe webhook processing |

##### [NEW] Background Jobs (port from mytin's 85 jobs — only 8 needed for Phase 1)

| Job | Ported from | Trigger |
|---|---|---|
| `ConfirmBookingJob` | `automatic_booking_confirmation_job.rb` | 2 days after session end |
| `BookingReminderJob` | `schedule_reminder.rb` | 10 min before start |
| `BookingStartedJob` | `booking_ongoing_job.rb` | At start_time |
| `BookingEndedJob` | `booking_past_job.rb` | At end_time + 2min |
| `CreateVideoRoomJob` | `create_room_job.rb` | On booking confirmed |
| `SendBookingReceiptJob` | `send_payment_receipts.rb` | On payment success |
| `NewBookingNotificationJob` | `new_booking_job.rb` | On booking created |
| `SendWebhookJob` | `send_webhook_job.rb` | On booking state change |

---

#### Frontend (Next.js 14)

##### [MODIFY] Existing ExpertHub frontend

Port these from the existing `~/Desktop/experthub-web/src/`:
- Auth pages (login/signup with role selection)
- Marketplace discovery with category filtering
- Expert profile page with availability calendar
- Booking flow (date → slot → payment → confirmation)
- Role-based dashboards (operator/expert/client)

---

### Phase 2: Differentiation (Weeks 4-6) — AI + Polish

> Goal: AI matching, triage chatbot, session summaries, reschedule flow, reviews

#### Database Schema Changes

We will create the following tables:

1. **`payout_accounts`** — links experts to Stripe Connect/Razorpay Route accounts.
   - `expert_profile_id` (bigint, index, foreign key)
   - `gateway` (string, e.g., "stripe", "razorpay")
   - `account_identifier` (string, account ID)
   - `status` (string, e.g., "active", "pending")
   
2. **`reviews`** — polymorphic review system for bookings, courses, and sessions.
   - `tenant_id` (bigint, index, foreign key)
   - `reviewer_id` (bigint, index, foreign key -> users)
   - `reviewee_id` (bigint, index, foreign key -> users, nullable)
   - `reviewable_type` (string)
   - `reviewable_id` (bigint)
   - `rating` (integer, 1..5)
   - `content` (text)

3. **`reschedule_requests`** — requests to change appointment times.
   - `tenant_id` (bigint, index, foreign key)
   - `booking_id` (bigint, index, foreign key -> bookings)
   - `requested_by_id` (bigint, index, foreign key -> users)
   - `old_start_time` (datetime)
   - `old_end_time` (datetime)
   - `new_start_time` (datetime)
   - `new_end_time` (datetime)
   - `status` (string/integer: pending, accepted, rejected, expired)
   - `reason` (text)
   - `expires_at` (datetime)

4. **`cancellation_policies`** — rules regarding booking cancellations.
   - `tenant_id` (bigint, index, foreign key)
   - `name` (string)
   - `refund_percentage` (decimal, precision: 5, scale: 2)
   - `prior_hours` (integer)
   - `is_active` (boolean, default: true)
   - *Note: We will also add a `cancellation_policy_id` foreign key column to both `services` and `bookings`.*

5. **`conversations`**, **`conversation_participations`**, and **`messages`** — 1:1 chat engine.
   - `conversations`: `tenant_id` (bigint, index, foreign key)
   - `conversation_participations`: `conversation_id` (fk), `user_id` (fk), `last_read_at` (datetime)
   - `messages`: `conversation_id` (fk), `sender_id` (fk -> users), `content` (text)

6. **`notifications`** — in-app notification center.
   - `tenant_id` (bigint, index, foreign key)
   - `user_id` (bigint, index, foreign key)
   - `notification_type` (string)
   - `data` (jsonb)
   - `read_at` (datetime, nullable)

7. **`expert_embeddings`** — pgvector search cache.
   - `expert_profile_id` (bigint, index, foreign key, unique)
   - `embedding` (vector, limit: 1536)
   - `content_hash` (string)

8. **`ai_triage_sessions`** — chat state for AI triage widget.
   - `tenant_id` (bigint, index, foreign key)
   - `user_id` (bigint, index, foreign key, nullable)
   - `session_token` (string, unique index)
   - `messages` (jsonb, array of chat history)
   - `status` (string, default: "active")

9. **`session_summaries`** — AI-generated notes from meeting.
   - `booking_id` (bigint, index, foreign key, unique)
   - `summary` (text)
   - `action_items` (jsonb, array of items)
   - `transcript` (text, raw)

---

#### Models & Associations

- **Review**: `belongs_to :reviewer, class_name: 'User'`, `belongs_to :reviewee, class_name: 'User', optional: true`, `belongs_to :reviewable, polymorphic: true`, `belongs_to :tenant`. Validates rating in `1..5`.
- **RescheduleRequest**: `belongs_to :booking`, `belongs_to :requested_by, class_name: 'User'`, `belongs_to :tenant`. Validate that `new_start_time` is in the future, doesn't overlap with existing bookings, and that the booking status is `paid`, `confirmed`, or `authorized`.
- **CancellationPolicy**: `belongs_to :tenant`, `has_many :services`.
- **Conversation**: `belongs_to :tenant`, `has_many :participations, dependent: :destroy`, `has_many :users, through: :participations`, `has_many :messages, dependent: :destroy`.
- **ConversationParticipation**: `belongs_to :conversation`, `belongs_to :user`.
- **Message**: `belongs_to :conversation`, `belongs_to :sender, class_name: 'User'`.
- **Notification**: `belongs_to :tenant`, `belongs_to :user`.
- **ExpertEmbedding**: `belongs_to :expert_profile`. Acts as a pgvector model using the `neighbor` gem syntax: `has_neighbors :embedding`.
- **AiTriageSession**: `belongs_to :tenant`, `belongs_to :user, optional: true`.
- **SessionSummary**: `belongs_to :booking`.

---

#### AI Services & Background Jobs

1. **`GenerateEmbeddingJob`**:
   - Triggered when an `ExpertProfile` is approved or updated.
   - Compiles search metadata (specialization, bio, title, categories) and sends it to OpenAI's Embeddings API (`text-embedding-3-small`).
   - Saves/updates the vector in `expert_embeddings`.

2. **`Ai::MatchExpertsService`**:
   - Accepts a query string (e.g. "React developer who knows python") and a `tenant`.
   - Generates the embedding for the query.
   - Uses `neighbor` distance calculation to find the closest expert profiles:
     ```ruby
     nearest_embeddings = ExpertEmbedding.nearest_neighbors(:embedding, query_vector, distance: :cosine).limit(limit)
     ExpertProfile.where(id: nearest_embeddings.map(&:expert_profile_id))
     ```

3. **`Ai::TriageChatService`**:
   - Handles message exchanges for the AI triage widget.
   - Feeds the user's chat history and active tenant context to Anthropic's Claude API.
   - Instructs the system prompt to ask questions about the user's needs, and eventually trigger tool outputs (JSON payload) listing target category slugs or expert profile IDs.

4. **`Ai::GenerateSummaryService`**:
   - Ingests raw meeting transcript text from a finished Daily.co session.
   - Uses Claude/Gemini to extract a concise high-level summary and a structured JSON array of action items (tasks/due dates/assignees).
   - Saves the result in `session_summaries` table.

---

#### Razorpay Payment Integration

1. **`PaymentConfig` Setup**: Support setting `gateway: "razorpay"` with credentials `key_id` and `key_secret` (stored encrypted).
2. **`RazorpayService`**:
   - `create_order(booking)`: generates a Razorpay Order with the booking's `client_total_cents` and currency.
   - `process_payout(booking)`: routes the expert's payout percentage (`expert_payout_cents`) to their Razorpay Linked Account using Route Transfers.
   - `handle_webhook(event)`: processes `payment.captured` webhooks idempotently (using cache-based event logging) and marks bookings as paid.

---

#### API Endpoints

- **Reviews**:
  - `POST /services/:service_id/reviews` (Create review for service)
  - `GET /services/:service_id/reviews` (Fetch service reviews)
- **Rescheduling**:
  - `POST /bookings/:id/reschedule_requests` (Request a reschedule)
  - `POST /reschedule_requests/:id/accept` (Accept reschedule - shifts start/end time of booking, closes request)
  - `POST /reschedule_requests/:id/reject` (Reject reschedule)
- **Chat**:
  - `GET /conversations` (List user conversations)
  - `POST /conversations` (Find or create a conversation between 2 users)
  - `GET /conversations/:id/messages` (Paginated message history)
  - `POST /conversations/:id/messages` (Send message)
- **Notifications**:
  - `GET /notifications` (Fetch unread notifications)
  - `POST /notifications/:id/read` (Mark notification as read)
- **AI Triage & Match**:
  - `POST /ai/match` (Submit query to get ranked expert recommendations)
  - `POST /ai/triage_sessions` (Create an intake chat session)
  - `POST /ai/triage_sessions/:session_token/chat` (Send message, get chatbot reply + potential expert recommendations)

---

#### Verification Plan

1. **RSpec Model Specs**:
   - `Review` validation and ratings range.
   - `RescheduleRequest` state machine logic, overlap checking, and time bounds.
2. **RSpec Service Specs**:
   - `Ai::MatchExpertsService` mock embedding query results and cosine distance matching.
   - `Ai::TriageChatService` stubbed API requests and chat context updates.
   - `Ai::GenerateSummaryService` stubbed summary and action item parser.
   - `RazorpayService` Mock checkout order generation and transfer routes.
3. **RSpec Request Specs**:
   - E2E chat creation, message routing, and notification delivery.
   - E2E reschedule request lifecycle (pending -> accepted/rejected).
   - E2E Razorpay webhook signature parsing and booking paid state transitions.

---

### Phase 3: Platform (Weeks 7-10) — Courses, Packages, White-label

> Goal: Full Panther feature parity: Courses, Group Sessions, Packages, Subscriptions, Promos, Dynamic Checkout Fields, Custom Domains, CMS.

#### Database Schema Changes

We will create the following migrations:

1. **`courses`** — expert courses.
   - `tenant_id` (bigint, index, foreign key)
   - `expert_profile_id` (bigint, index, foreign key)
   - `title` (string)
   - `description` (text)
   - `price_cents` (integer, default: 0)
   - `currency` (string, default: "USD")
   - `approval_status` (integer, default: 0)
   - `is_active` (boolean, default: true)

2. **`lessons`** — course chapters.
   - `course_id` (bigint, index, foreign key)
   - `title` (string)
   - `description` (text)
   - `video_url` (string)
   - `sort_priority` (integer, default: 0)

3. **`lesson_quizzes`** — quiz for a lesson.
   - `lesson_id` (bigint, index, foreign key, unique)
   - `title` (string)

4. **`quiz_questions`** — question bank.
   - `lesson_quiz_id` (bigint, index, foreign key)
   - `question_text` (text)

5. **`quiz_options`** — answer choices.
   - `quiz_question_id` (bigint, index, foreign key)
   - `option_text` (string)
   - `is_correct` (boolean, default: false)

6. **`enrollments`** — client course purchases.
   - `tenant_id` (bigint, index, foreign key)
   - `course_id` (bigint, index, foreign key)
   - `user_id` (bigint, index, foreign key)
   - `status` (string, default: "active")

7. **`lesson_progresses`** — progress tracking.
   - `enrollment_id` (bigint, index, foreign key)
   - `lesson_id` (bigint, index, foreign key)
   - `completed_at` (datetime)

8. **`certificates`** — issued certificates.
   - `enrollment_id` (bigint, index, foreign key, unique)
   - `certificate_code` (string, unique)
   - `issued_at` (datetime)

9. **`group_sessions`** — expert-led webinars / group classes.
   - `tenant_id` (bigint, index, foreign key)
   - `expert_profile_id` (bigint, index, foreign key)
   - `title` (string)
   - `description` (text)
   - `start_time` (datetime)
   - `end_time` (datetime)
   - `price_cents` (integer, default: 0)
   - `currency` (string, default: "USD")
   - `max_participants` (integer, default: 10)
   - `video_room_url` (string)

10. **`session_attendances`** — participants in group sessions.
    - `group_session_id` (bigint, index, foreign key)
    - `user_id` (bigint, index, foreign key)
    - `status` (string, default: "registered")

11. **`booking_packages`** — pre-purchased bundle of 1:1 sessions.
    - `tenant_id` (bigint, index, foreign key)
    - `expert_profile_id` (bigint, index, foreign key)
    - `title` (string)
    - `description` (text)
    - `price_cents` (integer, default: 0)
    - `currency` (string, default: "USD")
    - `booking_count` (integer, default: 5)

12. **`package_purchases`** — package balances.
    - `tenant_id` (bigint, index, foreign key)
    - `booking_package_id` (bigint, index, foreign key)
    - `user_id` (bigint, index, foreign key)
    - `remaining_bookings` (integer)

13. **`subscription_plans`** — customer/expert subscriptions.
    - `tenant_id` (bigint, index, foreign key)
    - `name` (string)
    - `price_cents` (integer)
    - `currency` (string)
    - `billing_interval` (string, default: "monthly")
    - `target_role` (string)

15. **`subscriptions`** — client active plans.
    - `tenant_id` (bigint, index, foreign key)
    - `user_id` (bigint, index, foreign key)
    - `subscription_plan_id` (bigint, index, foreign key)
    - `status` (string, default: "active")
    - `current_period_end` (datetime)
    - `stripe_subscription_id` (string)

16. **`promo_codes`** & **`promo_redemptions`** — coupon engine.
    - `promo_codes`: `tenant_id` (fk), `code` (string), `discount_type` (string), `discount_value` (decimal), `expires_at` (datetime), `max_redemptions` (integer), `redemptions_count` (integer)
    - `promo_redemptions`: `promo_code_id` (fk), `booking_id` (fk, optional), `user_id` (fk)

17. **`checkout_fields`** & **`checkout_field_values`** — dynamic fields.
    - `checkout_fields`: `tenant_id` (fk), `field_name` (string), `field_type` (string), `required` (boolean), `options` (jsonb)
    - `checkout_field_values`: `checkout_field_id` (fk), `booking_id` (fk), `value` (text)

18. **`pages`** — custom CMS content.
    - `tenant_id` (bigint, index, foreign key)
    - `slug` (string)
    - `title` (string)
    - `content` (text)
    - `is_published` (boolean, default: true)

*We will also run a migration to add custom domain fields to `tenants`:*
- `custom_domain` (string, unique index)
- `custom_domain_status` (string)
- `dns_txt_record` (string)

---

#### Models & Associations

- **Course**: `belongs_to :tenant`, `belongs_to :expert_profile`, `has_many :lessons`, `has_many :enrollments`.
- **Lesson**: `belongs_to :course`, `has_one :quiz, class_name: 'LessonQuiz'`.
- **LessonQuiz**: `belongs_to :lesson`, `has_many :questions, class_name: 'QuizQuestion'`.
- **QuizQuestion**: `belongs_to :quiz`, `has_many :options, class_name: 'QuizOption'`.
- **QuizOption**: `belongs_to :question`.
- **Enrollment**: `belongs_to :tenant`, `belongs_to :course`, `belongs_to :user`, `has_many :progresses, class_name: 'LessonProgress'`, `has_one :certificate`.
- **LessonProgress**: `belongs_to :enrollment`, `belongs_to :lesson`.
- **Certificate**: `belongs_to :enrollment`.
- **GroupSession**: `belongs_to :tenant`, `belongs_to :expert_profile`, `has_many :attendances, class_name: 'SessionAttendance'`.
- **SessionAttendance**: `belongs_to :group_session`, `belongs_to :user`.
- **BookingPackage**: `belongs_to :tenant`, `belongs_to :expert_profile`, `has_many :purchases, class_name: 'PackagePurchase'`.
- **PackagePurchase**: `belongs_to :tenant`, `belongs_to :booking_package`, `belongs_to :user`.
- **SubscriptionPlan**: `belongs_to :tenant`, `has_many :subscriptions`.
- **Subscription**: `belongs_to :tenant`, `belongs_to :user`, `belongs_to :subscription_plan`.
- **PromoCode**: `belongs_to :tenant`, `has_many :redemptions, class_name: 'PromoRedemption'`.
- **PromoRedemption**: `belongs_to :promo_code`, `belongs_to :booking`, `belongs_to :user`.
- **CheckoutField**: `belongs_to :tenant`, `has_many :values, class_name: 'CheckoutFieldValue'`.
- **CheckoutFieldValue**: `belongs_to :checkout_field`, `belongs_to :booking`.
- **Page**: `belongs_to :tenant`.

---

#### API Endpoints

- **Courses & Lessons**:
  - `GET /courses` (list approved active courses)
  - `POST /courses` (create course, expert only)
  - `POST /courses/:id/enroll` (purchase course & generate enrollment)
  - `GET /enrollments/:id` (view enrollment details, progress, quiz status)
  - `POST /lessons/:id/complete` (marks a lesson as finished)
  - `POST /lessons/:id/quiz/submit` (submits answers; triggers certificate generation if course complete)
- **Group Sessions**:
  - `GET /group_sessions` (list active group sessions)
  - `POST /group_sessions` (create session, expert only)
  - `POST /group_sessions/:id/register` (join/pay for session)
- **Packages**:
  - `GET /booking_packages`
  - `POST /booking_packages/:id/purchase` (purchase package)
- **Subscriptions**:
  - `GET /subscription_plans`
  - `POST /subscriptions` (subscribe client/expert)
- **Promo Codes**:
  - `POST /promo_codes/validate` (validate coupon prior to checkout)
- **CMS Pages**:
  - `GET /pages/:slug` (publicly fetch custom page content)
- **Checkout Fields**:
  - `GET /checkout_fields` (retrieve custom inputs required for a tenant's booking)

---

#### Verification Plan

1. **Model Specs**:
   - Courses and lesson ordering.
   - Enrollment completion state and Quiz validation scoring.
   - Subscription states (active/canceled).
   - Promo code expiration and max redemptions cap.
2. **Request Specs**:
   - Course buying flow & completion E2E.
   - Group session registration and capacity check.
   - Package purchase and subsequent free booking creation (deducting package balance).
   - Subscriptions lifecycle (active -> canceled).
   - CMS routing.

---

### Phase 4: Scale (Weeks 11+)

Goal: Implement referral code distribution and rewards, support multi-locale translations for categories and pages, add PayPal and Payfast payment config and processing webhooks, and provide advanced analytics dashboards.

#### Database Schema Changes

We will create the following migrations:

1. **`AddReferralFieldsToUsers`**:
   - `referral_code` (string, unique index)
   - `referred_by_code` (string)

2. **`create_referral_credits`**:
   - `tenant_id` (bigint, index, foreign key)
   - `user_id` (bigint, index, foreign key)
   - `amount_cents` (integer)
   - `currency` (string, default: "USD")
   - `status` (string, default: "active") # active, redeemed, expired
   - `referred_user_id` (bigint, nullable, index, foreign key -> users)

3. **`AddTranslationsToCategoriesAndPages`**:
   - Add `translations` (jsonb, default: {}) to `categories`
   - Add `translations` (jsonb, default: {}) to `pages`

4. **`AddSupportedLocalesToTenants`**:
   - Add `supported_locales` (jsonb, default: ["en"]) to `tenants`

#### Models & Associations

- **User**: Generates a unique `referral_code` on creation. Can have many referral credits.
- **ReferralCredit**: `belongs_to :tenant`, `belongs_to :user`, `belongs_to :referred_user, class_name: 'User', optional: true`. Validates status in `active`, `redeemed`, `expired`.
- **Category & Page**: Include a custom concern/helper to retrieve the field in the current locale (e.g. falling back to the default language if requested key is missing from `translations` hash).

#### API Endpoints & Routes

- **Referrals**:
  - `GET /referrals/summary` (Retrieve user's referral code, count of signups, and current active credit balance).
- **Payment Gateways**:
  - `POST /payment_configs/paypal` (Config PayPal credentials).
  - `POST /payment_configs/payfast` (Config Payfast credentials).
  - `POST /webhooks/paypal` (Handle PayPal capture payments).
  - `POST /webhooks/payfast` (Handle Payfast callback notifications).
- **Analytics**:
  - `GET /analytics/dashboard` (Provides operator-level reports: total commission earnings, total sales revenue, signup metrics, active users, top-performing expert categories, total bookings).
  - `GET /analytics/expert` (Provides expert-specific metrics: session hours, ratings average, earnings payout, bookings status).

#### Verification Plan

1. **RSpec Model Specs**:
   - Referral code generation and uniqueness.
   - Translation parsing and default locale fallback logic.
2. **RSpec Request Specs**:
   - E2E referral reward logic (referred user signup -> referred user completes first booking -> check referral credit created for both referrer and referee -> discount applied on referee's next booking).
   - i18n categories list with different `Accept-Language` headers.
   - PayPal/Payfast checkout callback hooks and order statuses.
   - Analytics dashboard calculations.


---

## Verification Plan

### Automated Tests

```bash
# Phase 1 verification
bundle exec rspec spec/services/availability_service_spec.rb
bundle exec rspec spec/services/commission_calculator_spec.rb
bundle exec rspec spec/models/booking_spec.rb  # state machine transitions
bundle exec rspec spec/services/stripe_service_spec.rb

# Stripe webhook E2E
stripe trigger payment_intent.succeeded \
  --forward-to localhost:3000/webhooks/stripe

# Full flow
bundle exec rspec spec/integration/booking_flow_spec.rb
```

### Manual Verification

1. **Tenant isolation**: Create 2 tenants, verify zero data leakage
2. **Booking flow**: Search → select slot → pay (card 4242...) → booking confirmed → Daily room URL
3. **Commission**: Verify platform fee deducted in Stripe dashboard
4. **Video**: Join Daily.co room from booking confirmation page
5. **Webhook**: `stripe listen --forward-to` → payment confirmed → booking state transitions
6. **Role redirects**: Operator → admin dashboard, Expert → expert dashboard, Client → bookings

---

## What We're NOT Building (explicit cut list)

From mytin's 249 tables, we are **permanently skipping** 48 tables:

| Burned | Reason |
|---|---|
| All Hippo/Fugu tables (6) | Dead platform — replaced by internal messaging |
| All Jungle Auth tables | Dead platform — replaced by Devise |
| All Panther/Yelo tables (3) | Dead platform — we own DNS + billing |
| PayPal (7 tables) | Stripe + Razorpay sufficient for MVP |
| Payfast (3 tables) | South Africa — add when operator demands |
| Escrow.com (3 tables) | Niche — add when operator demands |
| Mercury CMS tables | Dead gem |
| Sphinx search tables | Replaced by PostgreSQL full-text + pgvector |
| Feed/social tables (6) | Not core to consultation marketplaces |
| Tookan/Osigu/Foodics | Vertical-specific — add when operator demands |
| PowerTranz/MyFatoorah/EasyPay | Regional gateways — add when needed |
