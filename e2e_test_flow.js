import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('/Users/sambhar/.gemini/antigravity-ide/brain/b6724b20-8423-42f0-8261-e79a4b29d4a2/html_artifacts');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function run() {
  console.log('🚀 Starting ExpertHub Frontend E2E Test...');
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  
  // ==========================================
  // PHASE 1: MARKETPLACE CREATION
  // ==========================================
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await page1.setViewportSize({ width: 1280, height: 800 });

  console.log('1. Navigating to signup page on main platform...');
  await page1.goto('http://localhost:5174/signup');
  await page1.waitForLoadState('networkidle');

  console.log('2. Filling marketplace admin and tenant details...');
  await page1.fill('input[placeholder="Alex"]', 'Admin');
  await page1.fill('input[placeholder="Johnson"]', 'Fitz');
  await page1.fill('input[type="email"]', 'admin@fitnesszone.localhost');
  await page1.fill('input[type="password"]', 'Password123');
  await page1.fill('input[placeholder="e.g. Acme Experts"]', 'Fitness Zone');
  await page1.fill('input[placeholder="e.g. acme"]', 'fitnesszone');

  await page1.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_signup_filled.png') });
  
  console.log('3. Clicking Create Account...');
  await page1.click('button:has-text("Create account")');

  console.log('4. Waiting for marketplace setup confirmation...');
  await page1.waitForSelector('text=Marketplace Created!', { timeout: 15000 });
  await page1.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_marketplace_created.png') });
  console.log('🎉 Marketplace successfully created!');

  // Get the link href
  const dashboardLink = await page1.getAttribute('a:has-text("Go to Marketplace Admin Dashboard")', 'href');
  console.log(`🔗 Admin auto-login link: ${dashboardLink}`);

  // ==========================================
  // PHASE 2 & 3: ADMIN SETUP - CATEGORIES, CODES, POLICIES
  // ==========================================
  console.log('5. Accessing admin session on tenant subdomain...');
  const contextAdmin = await browser.newContext();
  const adminPage = await contextAdmin.newPage();
  await adminPage.setViewportSize({ width: 1280, height: 800 });
  
  // Use the auto-login dashboard link
  await adminPage.goto(dashboardLink);
  await adminPage.waitForLoadState('networkidle');
  console.log('6. Logged in successfully! Admin page URL:', adminPage.url());
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_admin_onboarding.png') });

  console.log('7. Navigating to Admin Categories...');
  await adminPage.goto('http://fitnesszone.localhost:5174/admin/categories');
  await adminPage.waitForSelector('input[placeholder="Enter new category name..."]');
  
  console.log('8. Adding Personal Training category...');
  await adminPage.fill('input[placeholder="Enter new category name..."]', 'Personal Training');
  await adminPage.click('button:has-text("Add Category")');
  await adminPage.waitForTimeout(1000);

  console.log('9. Adding Yoga category...');
  await adminPage.fill('input[placeholder="Enter new category name..."]', 'Yoga');
  await adminPage.click('button:has-text("Add Category")');
  await adminPage.waitForTimeout(1000);
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_admin_categories_created.png') });

  console.log('10. Navigating to Admin Promo Codes...');
  await adminPage.goto('http://fitnesszone.localhost:5174/admin/promo-codes');
  await adminPage.waitForSelector('input[placeholder="e.g. SAVE20"]');
  await adminPage.fill('input[placeholder="e.g. SAVE20"]', 'FIT20');
  await adminPage.fill('input[placeholder="20"]', '20');
  await adminPage.click('button:has-text("Create Promo Code")');
  await adminPage.waitForTimeout(1000);
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_admin_promo_code_created.png') });

  console.log('11. Navigating to Admin Settings for Cancellation Policy...');
  await adminPage.goto('http://fitnesszone.localhost:5174/admin/settings');
  await adminPage.click('button:has-text("Policies")');
  await adminPage.waitForSelector('label:has-text("Moderate")');
  await adminPage.click('label:has-text("Moderate")');
  await adminPage.click('button:has-text("Save Policy")');
  await adminPage.waitForTimeout(1000);
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_admin_policy_saved.png') });

  // ==========================================
  // PHASE 4: EXPERT SIGNUP
  // ==========================================
  console.log('12. Creating new session context for Expert Signup...');
  const contextExpert = await browser.newContext();
  const expertPage = await contextExpert.newPage();
  expertPage.on('pageerror', err => console.error('🔴 EXPERT PAGE RUNTIME ERROR:', err));
  expertPage.on('console', msg => {
    if (msg.type() === 'error') console.error('🔴 EXPERT PAGE CONSOLE ERROR:', msg.text());
  });
  await expertPage.setViewportSize({ width: 1280, height: 800 });

  await expertPage.goto('http://fitnesszone.localhost:5174/signup/expert');
  await expertPage.waitForSelector('input[placeholder="Alex"]');
  
  console.log('13. Filling out expert registration details...');
  await expertPage.fill('input[placeholder="Alex"]', 'John');
  await expertPage.fill('input[placeholder="Johnson"]', 'Trainer');
  await expertPage.fill('input[type="email"]', 'john@fitnesszone.localhost');
  await expertPage.fill('input[type="password"]', 'Password123');
  await expertPage.fill('input[placeholder*="Cardiology"]', 'Personal Trainer & Yoga Coach');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_expert_signup_form.png') });

  await expertPage.click('button:has-text("Create account")');
  await expertPage.waitForSelector('text=Check your email');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_expert_signup_complete.png') });

  console.log('13a. Navigating to apply page to submit expert application...');
  await expertPage.goto('http://fitnesszone.localhost:5174/apply');
  await expertPage.waitForSelector('text=Personal Information');

  console.log('13b. Filling out application step 1 (Personal Info)...');
  await expertPage.fill('label:has-text("First Name") + input', 'John');
  await expertPage.fill('label:has-text("Last Name") + input', 'Trainer');
  await expertPage.fill('label:has-text("Professional Headline") + input', 'Personal Trainer & Yoga Coach');
  await expertPage.fill('label:has-text("Bio") + textarea', 'Experienced fitness coach and yoga instructor with 10+ years of training individuals.');
  await expertPage.fill('label:has-text("Location") + input', 'San Francisco, CA');
  await expertPage.fill('input[placeholder="yoursite.com"]', 'johntrainer.fitness');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07a_apply_step1.png') });
  await expertPage.click('button:has-text("Next")');

  console.log('13c. Filling out application step 2 (Expertise)...');
  await expertPage.waitForSelector('text=Your Expertise');
  await expertPage.click('button:has-text("Health & Wellness")');
  await expertPage.selectOption('select', '5–10');
  await expertPage.fill('label:has-text("Notable Credentials") + textarea', 'NASM CPT, RYT-500 Yoga Certification');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07b_apply_step2.png') });
  await expertPage.click('button:has-text("Next")');

  console.log('13d. Filling out application step 3 (Services)...');
  await expertPage.waitForSelector('text=Services You');
  await expertPage.click('button:has-text("1:1 Video Call")');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07c_apply_step3.png') });
  await expertPage.click('button:has-text("Next")');

  console.log('13e. Filling out application step 4 (Pricing)...');
  await expertPage.waitForSelector('text=Pricing & Payouts');
  await expertPage.fill('input[type="number"]', '50');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07d_apply_step4.png') });
  await expertPage.click('button:has-text("Next")');

  console.log('13f. Reviewing and submitting application step 5...');
  await expertPage.waitForSelector('text=Review Your Application');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07e_apply_step5.png') });
  await expertPage.click('button:has-text("Submit Application")');

  await expertPage.waitForSelector('text=Application submitted!');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_expert_signup_submitted.png') });
  console.log('👍 Expert application submitted successfully!');

  // ==========================================
  // PHASE 5: ADMIN APPROVAL OF EXPERT
  // ==========================================
  console.log('14. Going back to Admin tab to approve expert application...');
  await adminPage.goto('http://fitnesszone.localhost:5174/admin/experts');
  await adminPage.waitForSelector('text=John Trainer');
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_admin_expert_applications_list.png') });

  console.log('15. Clicking Approve on the expert application...');
  await adminPage.click('button:has-text("Approve")');
  await adminPage.waitForTimeout(1000);
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_admin_expert_approved.png') });
  console.log('🎉 Expert application approved!');

  // ==========================================
  // PHASE 6: EXPERT LOGS IN, CREATES LISTING AND AVAILABILITY
  // ==========================================
  console.log('16. Logging in as approved Expert John Trainer...');
  await expertPage.goto('http://fitnesszone.localhost:5174/login/expert');
  await expertPage.waitForSelector('input[type="email"]');
  await expertPage.fill('input[type="email"]', 'john@fitnesszone.localhost');
  await expertPage.fill('input[type="password"]', 'Password123');
  await expertPage.click('button:has-text("Sign in")');
  await expertPage.waitForSelector('text=Welcome back, John');
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_expert_dashboard_overview.png') });

  console.log('17. Setting Weekly Availability slots (Monday 09:00 - 17:00)...');
  await expertPage.click('button:has-text("Availability Settings")');
  await expertPage.click('button:has-text("Add Slot")');
  await expertPage.waitForSelector('select#slot-day');
  await expertPage.selectOption('select#slot-day', '1'); // Monday
  await expertPage.fill('input#slot-from', '09:00');
  await expertPage.fill('input#slot-till', '17:00');
  await expertPage.click('form button:has-text("Add Slot")');
  await expertPage.waitForTimeout(1000);

  console.log('18. Setting Weekly Availability slots (Tuesday 09:00 - 17:00)...');
  await expertPage.click('button:has-text("Add Slot")');
  await expertPage.waitForSelector('select#slot-day');
  await expertPage.selectOption('select#slot-day', '2'); // Tuesday
  await expertPage.fill('input#slot-from', '09:00');
  await expertPage.fill('input#slot-till', '17:00');
  await expertPage.click('form button:has-text("Add Slot")');
  await expertPage.waitForTimeout(1000);
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_expert_availability_slots.png') });

  console.log('19. Creating 1:1 Coaching Service Listing...');
  await expertPage.click('button:has-text("Listings & Services")');
  await expertPage.click('button:has-text("Create Listing")');
  await expertPage.waitForSelector('input#listing-title');
  await expertPage.fill('input#listing-title', '1-on-1 Fitness Coaching');
  await expertPage.fill('textarea#listing-desc', 'Personalized fitness coaching session tailored to your goals. Includes home workout plans and nutritional advice.');
  await expertPage.fill('input#listing-price', '50.00');
  await expertPage.fill('input#listing-duration', '60');
  await expertPage.selectOption('select#listing-category', { label: 'Personal Training' });
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_expert_service_listing_form.png') });
  await expertPage.click('button:has-text("Submit Listing")');
  await expertPage.waitForTimeout(1500);
  await expertPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_expert_service_created.png') });
  console.log('💪 1:1 Service Listing created!');

  // ==========================================
  // PHASE 7: CLIENT SIGNUP AND BOOKING
  // ==========================================
  console.log('20. Creating new session context for Client...');
  const contextClient = await browser.newContext();
  const clientPage = await contextClient.newPage();
  clientPage.on('pageerror', err => console.error('🔴 CLIENT PAGE RUNTIME ERROR:', err));
  clientPage.on('console', msg => {
    console.log(`💻 CLIENT CONSOLE [${msg.type()}]:`, msg.text());
  });
  clientPage.on('requestfailed', req => {
    console.log(`🔴 CLIENT REQUEST FAILED: ${req.url()} - ${req.failure()?.errorText || 'Unknown error'}`);
  });
  await clientPage.setViewportSize({ width: 1280, height: 800 });

  console.log('21. Signing up as new customer Jane Fit...');
  await clientPage.goto('http://fitnesszone.localhost:5174/signup/customer');
  await clientPage.waitForSelector('input[placeholder="Alex"]');
  await clientPage.fill('input[placeholder="Alex"]', 'Jane');
  await clientPage.fill('input[placeholder="Johnson"]', 'Fit');
  await clientPage.fill('input[type="email"]', 'jane@fitnesszone.localhost');
  await clientPage.fill('input[type="password"]', 'Password123');
  await clientPage.click('button:has-text("Create account")');
  await clientPage.waitForSelector('text=Continue to Fitness Zone');
  await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_client_signup_complete.png') });
  
  await clientPage.click('text=Continue to Fitness Zone');
  await clientPage.waitForURL('http://fitnesszone.localhost:5174/explore');
  await clientPage.waitForLoadState('networkidle');
  console.log('22. Customer explore page loaded!');
  await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_client_explore_page.png') });

  console.log('23. Clicking Book Now on John Trainer card...');
  await clientPage.locator('div.card-hover').filter({ hasText: 'John Trainer' }).locator('button:has-text("Book Now")').click();
  await clientPage.waitForSelector('text=1-on-1 Fitness Coaching');
  await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_expert_storefront_page.png') });

  console.log('24. Selecting date on calendar and picking time slot...');
  const monButton = clientPage.locator('button:has-text("Mon")');
  if (await monButton.count() > 0) {
    await monButton.first().click();
  } else {
    await clientPage.locator('button:has-text("Tue")').first().click();
  }
  await clientPage.waitForTimeout(1000);

  // Pick the slot
  const slotButton = clientPage.locator('div:has-text("Available Times") + div button');
  await slotButton.first().waitFor({ state: 'visible' });
  await slotButton.first().click();
  await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_storefront_date_slot_selected.png') });

  try {
    console.log('25. Proceeding to checkout...');
    await clientPage.click('button:has-text("Book for")');
    await clientPage.waitForSelector('textarea[placeholder*="goals"]', { timeout: 15000 });
    console.log('26. Checkout Page Step 0 loaded.');
    await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '19_checkout_step_0.png') });
  } catch (checkoutErr) {
    console.error('🔴 E2E checkout loading failed:', checkoutErr);
    await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'err_client_checkout.png') }).catch(() => {});
    console.log('📸 Saved client checkout page error screenshot. URL was:', clientPage.url());
    throw checkoutErr;
  }

  console.log('27. Filling out discussion description and continuing...');
  await clientPage.fill('textarea[placeholder*="goals"]', 'I want to build strength and learn basic yoga poses.');
  await clientPage.click('button:has-text("Continue")');
  await clientPage.waitForTimeout(500);

  console.log('28. Checkout Step 1: Communication settings...');
  await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '20_checkout_step_1.png') });
  
  try {
    console.log('29. Clicking Continue to Payment...');
    await clientPage.click('button:has-text("Continue to Payment")');

    console.log('29a. Waiting for Stripe Elements Payment Form to render...');
    const frameElement = await clientPage.waitForSelector('iframe[title*="Secure card payment"], iframe[src*="elements-inner-card"], iframe[title*="Secure payment"], iframe[src*="elements-inner-easel"]', { timeout: 20000 });
    const cardFrame = await frameElement.contentFrame();
    await clientPage.waitForTimeout(3000);
    const html = await cardFrame.content();
    console.log('💻 STRIPE IFRAME HTML CONTENT AFTER 3s:', html.substring(0, 1000));
    
    const cardInput = cardFrame.locator('input[autocomplete="cc-number"], input#Field-numberInput, input[name="cardnumber"]');
    await cardInput.waitFor({ state: 'visible', timeout: 20000 });

    console.log('29b. Filling in Stripe test card details...');
    await cardInput.fill('4242424242424242');
    
    const expInput = cardFrame.locator('input[autocomplete="cc-exp"], input#Field-expiryInput, input[name="expiry"], input[name="exp-date"]');
    await expInput.fill('11/32');
    
    const cvcInput = cardFrame.locator('input[autocomplete="cc-csc"], input#Field-cvcInput, input[name="cvc"]');
    await cvcInput.fill('453');
    
    const zipInput = cardFrame.locator('input[autocomplete="postal-code"], input#Field-postalCodeInput, input[name="postalCode"], input[name="postal"]');
    if (await zipInput.count() > 0 && await zipInput.isVisible()) {
      await zipInput.fill('94111');
    }

    await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '20a_stripe_details_filled.png') });

    console.log('29c. Confirming Stripe Checkout Payment...');
    await clientPage.click('#stripe-pay-button');

    console.log('30. Waiting for confirmation page...');
    await clientPage.waitForSelector('text=Booking Confirmed!', { timeout: 15000 });
    await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '21_checkout_booking_confirmed.png') });
    console.log('🎉 E2E Booking Flow Successful! Booking is confirmed!');
  } catch (err) {
    console.error('❌ E2E Payment step failed:', err);
    try {
      const rootText = await clientPage.innerText('#root');
      console.log('💻 CLIENT PAGE #root INNER TEXT:', rootText);
    } catch (e) {
      console.error('Failed to get #root inner text:', e);
    }
    await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'err_client_checkout.png') });
    throw err;
  }

  console.log('31. Checking Client Dashboard for upcoming sessions...');
  await clientPage.click('a:has-text("View Dashboard")');
  await clientPage.waitForSelector('text=1-on-1 Fitness Coaching');
  await clientPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '22_client_dashboard.png') });
  console.log('🌟 E2E Frontend Validation Finished Successfully!');

  await browser.close();
}

run().catch(err => {
  console.error('❌ E2E Test execution failed:', err);
  process.exit(1);
});
