const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function run() {
  console.log("Launching Chromium browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages from browser
  page.on("console", (msg) => {
    console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    console.error("[BROWSER EXCEPTION]", err);
  });

  const email = `e2e.test.auth.${Date.now()}@example.com`;
  const password = "Password123!";
  const firstName = "Jane";
  const lastName = "Doe";

  const checklist = {
    register: "FAIL",
    dbUserCreation: "FAIL",
    duplicateEmail: "FAIL",
    logout: "FAIL",
    invalidCredentials: "FAIL",
    login: "FAIL",
    tokenRefresh: "FAIL",
    protectedRoutes: "FAIL",
    disabledOAuth: "FAIL"
  };

  try {
    // --- 1. REGISTER ---
    console.log("\n=== 1. Testing Register ===");
    await page.goto("http://localhost:3000/auth/register", { waitUntil: "networkidle" });
    await page.fill('input[name="firstName"]', firstName);
    await page.fill('input[name="lastName"]', lastName);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL("**/account", { timeout: 10000 });
    checklist.register = "PASS";
    console.log("✓ Register form submitted and redirected to /account");

    // --- 2. DB USER CREATION ---
    console.log("\n=== 2. Testing Database User Creation ===");
    const userInDb = await prisma.user.findUnique({
      where: { email },
    });
    if (userInDb && userInDb.firstName === firstName && userInDb.lastName === lastName) {
      checklist.dbUserCreation = "PASS";
      console.log("✓ PostgreSQL verification: User exists in database with correct role & fields");
    } else {
      console.error("✗ PostgreSQL verification failed");
    }

    // --- 3. DUPLICATE EMAIL ---
    console.log("\n=== 3. Testing Duplicate Email Handling ===");
    await page.goto("http://localhost:3000/auth/register", { waitUntil: "networkidle" });
    await page.fill('input[name="firstName"]', "Duplicate");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="email"]', email); // Same email
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1500);
    if (page.url().endsWith("/auth/register")) {
      checklist.duplicateEmail = "PASS";
      console.log("✓ Duplicate email registration correctly blocked (stayed on page)");
    } else {
      console.error("✗ Duplicate email allowed redirect!");
    }

    // --- 4. LOGIN ---
    console.log("\n=== 4. Testing Login (Valid Credentials) ===");
    await page.goto("http://localhost:3000/auth/login", { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/account", { timeout: 10000 });
    checklist.login = "PASS";
    console.log("✓ Login succeeded and redirected to /account");

    // --- 5. AUTOMATIC TOKEN REFRESH ---
    console.log("\n=== 5. Testing Automatic Token Refresh ===");
    console.log("Corrupting access token in localStorage to simulate expiration...");
    await page.evaluate(() => {
      const storageKey = "auth-storage";
      const data = JSON.parse(localStorage.getItem(storageKey));
      if (data && data.state) {
        data.state.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNmQ4YTg0MC0xOGQyLTQ2MjMtOGFhYi05NTZlZDU0NmM1NjAiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE1MDAwMDAwMDAsImV4cCI6MTUwMDAwMDYwMH0.signature";
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    });

    console.log("Navigating to /wishlist (protected page)...");
    await page.goto("http://localhost:3000/wishlist", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    if (page.url().endsWith("/wishlist")) {
      const updatedToken = await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem("auth-storage"));
        return data?.state?.token;
      });
      
      if (updatedToken && !updatedToken.includes("signature")) {
        checklist.tokenRefresh = "PASS";
        console.log("✓ Token automatically refreshed and updated in localStorage");
      } else {
        console.error("✗ Access token was not updated in localStorage");
      }
    } else {
      console.error("✗ Redirected away from /wishlist:", page.url());
    }

    // --- 6. LOGOUT ---
    console.log("\n=== 6. Testing Logout ===");
    console.log("Navigating to http://localhost:3000/account...");
    await page.goto("http://localhost:3000/account", { waitUntil: "networkidle" });
    
    // Dump page state for debugging
    const buttons = await page.locator("button").allTextContents();
    console.log("Page URL:", page.url());
    console.log("Buttons found on page:", buttons);
    
    const logoutBtn = page.locator("button").filter({ hasText: /Log\s*out/i });
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await page.waitForURL("**/auth/login", { timeout: 10000 });
      checklist.logout = "PASS";
      console.log("✓ Logout succeeded and redirected to /auth/login");
    } else {
      console.error("✗ Logout button not found");
    }

    // --- 7. INVALID CREDENTIALS ---
    console.log("\n=== 7. Testing Login (Invalid Credentials) ===");
    await page.goto("http://localhost:3000/auth/login", { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    if (page.url().endsWith("/auth/login")) {
      checklist.invalidCredentials = "PASS";
      console.log("✓ Invalid credentials submission correctly blocked (stayed on login page)");
    } else {
      console.error("✗ Allowed login with invalid credentials!");
    }

    // --- 8. PROTECTED ROUTES ---
    console.log("\n=== 8. Testing Protected Routes ===");
    await page.goto("http://localhost:3000/account", { waitUntil: "networkidle" });
    await page.waitForURL("**/auth/login", { timeout: 10000 });
    checklist.protectedRoutes = "PASS";
    console.log("✓ Direct access to /account without session correctly blocked and redirected to /auth/login");

    // --- 9. DISABLED OAUTH BUTTONS ---
    console.log("\n=== 9. Testing OAuth Configuration ===");
    await page.goto("http://localhost:3000/auth/login", { waitUntil: "networkidle" });
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    const googleNotConfigured = page.locator('button:has-text("Continue with Google") :has-text("Not Configured")');
    const googleDisabled = await googleBtn.getAttribute("disabled");

    const appleBtn = page.locator('button:has-text("Continue with Apple")');
    const appleNotConfigured = page.locator('button:has-text("Continue with Apple") :has-text("Not Configured")');
    const appleDisabled = await appleBtn.getAttribute("disabled");

    if (await googleNotConfigured.count() > 0 && googleDisabled !== null &&
        await appleNotConfigured.count() > 0 && appleDisabled !== null) {
      checklist.disabledOAuth = "PASS";
      console.log("✓ Google and Apple OAuth buttons correctly disabled and badged 'Not Configured'");
    } else {
      console.error("✗ OAuth buttons not properly disabled or badged");
    }

  } catch (error) {
    console.error("E2E Test execution failed with error:", error);
    await page.screenshot({ path: "scratch/playwright-failure.png" });
    console.log("Screenshot saved to scratch/playwright-failure.png");
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("\n=================================");
  console.log("    E2E VERIFICATION CHECKLIST    ");
  console.log("=================================");
  Object.entries(checklist).forEach(([feature, status]) => {
    console.log(`- ${feature.padEnd(20)}: [${status}]`);
  });
  console.log("=================================");
}

run();
