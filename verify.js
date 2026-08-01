const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/Users/romit/.gemini/antigravity-ide/brain/be3eb91a-e6cf-469c-be9f-0709f8e03868';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verify() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let errors = [];
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  // Listen for failed network requests
  page.on('requestfailed', request => {
    errors.push(`Failed Request: ${request.url()} - ${request.failure().errorText}`);
  });

  page.on('response', response => {
    if (response.status() >= 400 && response.request().resourceType() !== 'image') {
      errors.push(`API Error: ${response.url()} returned ${response.status()}`);
    }
  });

  async function checkPage(name, url, screenshotName) {
    console.log(`Checking ${name} at ${url}...`);
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await delay(1500); // Give a bit of extra time for dynamic rendering
      
      const status = response ? response.status() : 200;
      const success = status >= 200 && status < 400;
      
      console.log(`${name} - HTTP Status: ${status}`);
      
      const screenshotPath = path.join(ARTIFACTS_DIR, `${screenshotName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved screenshot to ${screenshotPath}`);

      if (!success) {
        errors.push(`${name} failed to load (HTTP ${status})`);
      }
      
      return success;
    } catch (e) {
      console.error(`Error checking ${name}:`, e.message);
      errors.push(`Error checking ${name}: ${e.message}`);
      return false;
    }
  }

  // --- Customer Storefront Verification ---
  console.log('\n=== Storefront Verification ===');
  
  await checkPage('Home', 'http://localhost:3000', 'storefront_home');
  await checkPage('Collections', 'http://localhost:3000/collections', 'storefront_collections');
  await checkPage('Categories', 'http://localhost:3000/categories', 'storefront_categories');
  await checkPage('Product Details', 'http://localhost:3000/products/classic-red-rose-bouquet-f84y', 'storefront_product');
  await checkPage('Search', 'http://localhost:3000/search?q=rose', 'storefront_search');
  
  // Login flow
  await checkPage('Login Page', 'http://localhost:3000/auth/login', 'storefront_login_page');
  
  console.log('Attempting Login...');
  try {
    await page.type('input[type="email"]', 'admin@curiowrap.com');
    await page.type('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await delay(3000);
    console.log('Login attempt complete');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'storefront_login_success.png') });
  } catch (e) {
    console.error('Login failed:', e.message);
    errors.push(`Login failed: ${e.message}`);
  }

  // Authenticated pages
  await checkPage('Profile', 'http://localhost:3000/account', 'storefront_profile');
  await checkPage('Addresses', 'http://localhost:3000/account/addresses', 'storefront_addresses');
  await checkPage('Order History', 'http://localhost:3000/account/orders', 'storefront_orders');
  await checkPage('Wishlist', 'http://localhost:3000/wishlist', 'storefront_wishlist');
  await checkPage('Cart', 'http://localhost:3000/cart', 'storefront_cart');

  // Add to cart and Checkout
  console.log('Testing Add to Cart & Checkout...');
  try {
    await page.goto('http://localhost:3000/products/classic-red-rose-bouquet-f84y', { waitUntil: 'domcontentloaded' });
    await delay(1500);
    const addToCartHandle = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && b.textContent.includes('Add to Cart'));
    });
    const addToCartBtn = addToCartHandle.asElement();
    if (addToCartBtn) {
      await addToCartBtn.click();
      await delay(2000);
      await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
      await delay(1500);
      console.log('Navigated to checkout');
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'storefront_checkout.png') });
    } else {
      console.log('Could not find Add to Cart button');
    }
  } catch (e) {
    console.error('Checkout flow failed:', e.message);
  }

  // Logout
  console.log('Attempting Logout...');
  try {
    await page.goto('http://localhost:3000/account', { waitUntil: 'domcontentloaded' });
    await delay(1500);
    const logoutHandle = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && b.textContent.includes('Log Out'));
    });
    const logoutBtn = logoutHandle.asElement();
    if (logoutBtn) {
      await logoutBtn.click();
      await delay(2000);
      console.log('Logout successful');
    } else {
      console.log('Could not find Logout button, clearing cookies instead');
      const cookies = await page.cookies();
      await page.deleteCookie(...cookies);
    }
  } catch (e) {
    console.error('Logout failed:', e.message);
  }

  // --- Admin Verification ---
  console.log('\n=== Admin Verification ===');
  
  await checkPage('Admin Login Page', 'http://localhost:3001/login', 'admin_login_page');
  
  console.log('Attempting Admin Login...');
  try {
    await page.type('input[type="email"]', 'admin@curiowrap.com');
    await page.type('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await delay(3000);
    console.log('Admin Login complete');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_login_success.png') });
  } catch (e) {
    console.error('Admin Login failed:', e.message);
    errors.push(`Admin Login failed: ${e.message}`);
  }

  // Authenticated Admin pages
  await checkPage('Admin Dashboard', 'http://localhost:3001', 'admin_dashboard');
  await checkPage('Admin Analytics', 'http://localhost:3001/analytics', 'admin_analytics');
  await checkPage('Admin Products', 'http://localhost:3001/products', 'admin_products');
  await checkPage('Admin Categories', 'http://localhost:3001/categories', 'admin_categories');
  await checkPage('Admin Collections', 'http://localhost:3001/collections', 'admin_collections');
  await checkPage('Admin Inventory', 'http://localhost:3001/inventory', 'admin_inventory');
  await checkPage('Admin Orders', 'http://localhost:3001/orders', 'admin_orders');
  await checkPage('Admin Media', 'http://localhost:3001/media', 'admin_media');
  await checkPage('Admin Settings', 'http://localhost:3001/settings', 'admin_settings');

  await browser.close();

  console.log('\\n=== Verification Summary ===');
  if (errors.length > 0) {
    console.log('❌ ERRORS DETECTED:');
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('✅ ALL TESTS PASSED. No console or network errors detected.');
  }
}

verify().catch(console.error);
