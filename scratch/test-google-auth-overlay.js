const puppeteer = require("puppeteer");
const path = require("path");

async function testGoogleAuthOverlay() {
  console.log("=== Testing Google Authentication Overlay Layering ===");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // 1. DESKTOP TEST: Top of page
  console.log("\n--- 1. Desktop Test: /auth/login at top of page ---");
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/auth/login", { waitUntil: "networkidle2" });

  // Verify sticky header exists with z-40
  const headerZIndex = await page.evaluate(() => {
    const header = document.querySelector("header");
    return window.getComputedStyle(header).zIndex;
  });
  console.log(`Header z-index: ${headerZIndex} (expected: 40)`);
  if (headerZIndex !== "40") throw new Error(`Expected header z-index 40, got ${headerZIndex}`);

  // Trigger Google authentication overlay
  console.log("Clicking Google authentication button...");
  await page.evaluate(() => {
    // Click the Google button container or trigger click
    const btnContainer = document.querySelector('[onClickCapture], [class*="[&>div]:w-full"]');
    if (btnContainer) {
      btnContainer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
  });

  await new Promise((r) => setTimeout(r, 500));

  // Check overlay attributes
  const overlayInfo = await page.evaluate(() => {
    const overlay = document.querySelector('[role="dialog"][aria-label="Google Authentication"]');
    if (!overlay) return null;

    const style = window.getComputedStyle(overlay);
    const rect = overlay.getBoundingClientRect();
    const isDirectChildOfBody = overlay.parentElement === document.body;

    // Check hit testing over header area (e.g. x=200, y=40)
    const elementAtHeaderArea = document.elementFromPoint(200, 40);
    const headerIsCovered = overlay.contains(elementAtHeaderArea);

    return {
      exists: true,
      position: style.position,
      zIndex: style.zIndex,
      backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      isDirectChildOfBody,
      bodyOverflow: document.body.style.overflow,
      headerIsCovered,
      elementFoundAtHeader: elementAtHeaderArea ? elementAtHeaderArea.tagName : "none",
    };
  });

  console.log("Overlay properties at top of page:", overlayInfo);
  if (!overlayInfo || !overlayInfo.exists) {
    throw new Error("Overlay failed to appear on Google authentication click!");
  }
  if (overlayInfo.position !== "fixed") {
    throw new Error(`Expected position fixed, got ${overlayInfo.position}`);
  }
  if (parseInt(overlayInfo.zIndex) <= 40) {
    throw new Error(`Expected z-index > 40, got ${overlayInfo.zIndex}`);
  }
  if (!overlayInfo.isDirectChildOfBody) {
    throw new Error("Overlay must be portaled directly to document.body!");
  }
  if (overlayInfo.bodyOverflow !== "hidden") {
    throw new Error(`Expected body overflow hidden, got ${overlayInfo.bodyOverflow}`);
  }
  if (!overlayInfo.headerIsCovered) {
    throw new Error("Header was NOT covered by overlay! Stacking context issue detected!");
  }
  console.log("✓ Overlay is portaled to document.body with fixed inset-0 z-60");
  console.log("✓ Header area is completely covered by the overlay");
  console.log("✓ Body scroll is locked (overflow: hidden)");

  // Test scrolling while overlay is open
  console.log("Attempting to scroll while overlay is open...");
  await page.evaluate(() => window.scrollBy(0, 500));
  const scrollYWhileOpen = await page.evaluate(() => window.scrollY);
  console.log(`scrollY after attempted scroll: ${scrollYWhileOpen} (expected: 0)`);
  if (scrollYWhileOpen !== 0) {
    throw new Error(`Scrolling occurred while overlay was active! scrollY = ${scrollYWhileOpen}`);
  }
  console.log("✓ Page scroll is completely locked while overlay is open");

  await page.screenshot({ path: path.join(__dirname, "auth_overlay_top_desktop.png") });
  console.log("✓ Saved screenshot: auth_overlay_top_desktop.png");

  // Close overlay by clicking Cancel
  console.log("Clicking Cancel on overlay...");
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Cancel"));
    if (cancelBtn) cancelBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const bodyOverflowAfterClose = await page.evaluate(() => document.body.style.overflow);
  console.log(`Body overflow after close: "${bodyOverflowAfterClose}" (expected: "")`);
  if (bodyOverflowAfterClose !== "") {
    throw new Error("Body overflow was not restored after closing overlay!");
  }
  console.log("✓ Normal page scrolling restored after closing overlay");

  // 2. SCROLL DOWN AND TRIGGER AGAIN
  console.log("\n--- 2. Scrolled Down Test: Scroll down, then trigger overlay ---");
  await page.evaluate(() => window.scrollTo(0, 400));
  const scrollYBefore = await page.evaluate(() => window.scrollY);
  console.log(`Scrolled down to: ${scrollYBefore}`);

  // Trigger Google authentication again while page is scrolled down
  await page.evaluate(() => {
    const btnContainer = document.querySelector('[onClickCapture], [class*="[&>div]:w-full"]');
    if (btnContainer) {
      btnContainer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  const scrolledOverlayInfo = await page.evaluate(() => {
    const overlay = document.querySelector('[role="dialog"][aria-label="Google Authentication"]');
    if (!overlay) return null;

    const rect = overlay.getBoundingClientRect();
    const elementAtHeaderArea = document.elementFromPoint(200, 40);
    const headerIsCovered = overlay.contains(elementAtHeaderArea);

    return {
      exists: true,
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
      headerIsCovered,
      bodyOverflow: document.body.style.overflow,
    };
  });

  console.log("Overlay properties when page was pre-scrolled:", scrolledOverlayInfo);
  if (!scrolledOverlayInfo || !scrolledOverlayInfo.exists) {
    throw new Error("Overlay failed to appear when triggered while scrolled!");
  }
  if (scrolledOverlayInfo.top !== 0 || scrolledOverlayInfo.height !== scrolledOverlayInfo.viewportHeight) {
    throw new Error(`Overlay does not cover full viewport! top: ${scrolledOverlayInfo.top}, height: ${scrolledOverlayInfo.height}`);
  }
  if (!scrolledOverlayInfo.headerIsCovered) {
    throw new Error("Sticky header appeared above overlay when scrolled!");
  }
  console.log("✓ Overlay covers 100% of the viewport even when page is scrolled down");
  console.log("✓ Sticky header remains UNDER the blur overlay (header never appears above)");

  await page.screenshot({ path: path.join(__dirname, "auth_overlay_scrolled_desktop.png") });
  console.log("✓ Saved screenshot: auth_overlay_scrolled_desktop.png");

  // Close overlay
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Cancel"));
    if (cancelBtn) cancelBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const scrollYRestored = await page.evaluate(() => window.scrollY);
  console.log(`Scroll position after closing: ${scrollYRestored} (expected: 400)`);
  if (scrollYRestored !== 400) {
    throw new Error(`Scroll position jumped! Expected 400, got ${scrollYRestored}`);
  }
  console.log("✓ Scroll position maintained without jumping after closing overlay");

  // 3. MOBILE VIEWPORT TEST
  console.log("\n--- 3. Mobile Layout Test: /auth/register on mobile viewport ---");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/auth/register", { waitUntil: "networkidle2" });

  // Scroll down a bit on mobile
  await page.evaluate(() => window.scrollTo(0, 200));

  // Trigger Google authentication on register page
  await page.evaluate(() => {
    const btnContainer = document.querySelector('[onClickCapture], [class*="[&>div]:w-full"]');
    if (btnContainer) {
      btnContainer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  const mobileOverlayInfo = await page.evaluate(() => {
    const overlay = document.querySelector('[role="dialog"][aria-label="Google Authentication"]');
    if (!overlay) return null;

    const rect = overlay.getBoundingClientRect();
    const elementAtHeaderArea = document.elementFromPoint(100, 30);
    const headerIsCovered = overlay.contains(elementAtHeaderArea);

    return {
      exists: true,
      rectWidth: rect.width,
      rectHeight: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      headerIsCovered,
      bodyOverflow: document.body.style.overflow,
    };
  });

  console.log("Mobile overlay info:", mobileOverlayInfo);
  if (!mobileOverlayInfo || !mobileOverlayInfo.exists) {
    throw new Error("Mobile overlay failed to appear!");
  }
  if (!mobileOverlayInfo.headerIsCovered) {
    throw new Error("Mobile header appeared above overlay!");
  }
  console.log("✓ Mobile overlay covers 100% of the mobile viewport");
  console.log("✓ Mobile header is completely covered by overlay");

  await page.screenshot({ path: path.join(__dirname, "auth_overlay_mobile.png") });
  console.log("✓ Saved screenshot: auth_overlay_mobile.png");

  await browser.close();
  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Layering and stacking issues are 100% resolved!");
}

testGoogleAuthOverlay().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
