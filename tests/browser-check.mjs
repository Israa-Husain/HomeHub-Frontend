import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.FRONTEND_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
  headless: true,
});
const results = [];
const failures = [];
const context = await browser.newContext();
const page = await context.newPage();
page.on("pageerror", (error) => failures.push(error.message));
const protectedPaths = [
  "/services",
  "/services/1",
  "/dashboard",
  "/account",
  "/notifications",
  "/bookings",
  "/bookings/1",
  "/reviews",
  "/homes",
  "/favorites",
  "/waitlist",
  "/provider/profile",
  "/provider/services",
  "/provider/availability",
  "/provider/reschedules",
  "/admin/users",
  "/admin/providers",
  "/admin/categories",
];
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/does-not-exist",
];
try {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of publicPaths) {
      await page.goto(base + path);
      await page.locator("h1").waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
        `${path} overflow at ${width}`,
      );
    }
    await page.goto(base);
    mkdirSync("test-results", { recursive: true });
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
    results.push(
      `Public routes and no horizontal overflow at ${width}px: passed`,
    );
  }
  for (const path of protectedPaths) {
    await page.goto(base + path);
    await page.waitForURL("**/login");
  }
  results.push(
    `Unauthenticated redirects: ${protectedPaths.length} routes passed`,
  );
  await page.goto(base + "/register");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  assert.equal((await page.locator("input:invalid").count()) > 0, true);
  assert.equal(new URL(page.url()).pathname, "/register");
  results.push(
    "Registration native required-field validation: passed (no account created)",
  );
  await page.goto(base + "/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill("frontend-check-nonexistent@homehub.example");
  await page.getByLabel("Password", { exact: true }).fill("NotAnAccount123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(
    await page.getByLabel("Email", { exact: true }).inputValue(),
    "frontend-check-nonexistent@homehub.example",
  );
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("homehub.token")),
    null,
  );
  results.push(
    "Real backend failed login: error displayed, input preserved, no session created",
  );
  await page.goto(base + "/verify");
  await page
    .getByLabel("Token from your email")
    .fill("invalid-frontend-check-token");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await page.getByRole("alert").waitFor();
  results.push("Real backend invalid verification token: error displayed");
  await page.evaluate(() =>
    sessionStorage.setItem("homehub.token", "invalid-session-check"),
  );
  await page.goto(base + "/dashboard");
  await page.waitForURL("**/login");
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("homehub.token")),
    null,
  );
  results.push(
    "Invalid restored session: rejected by backend, cleared, redirected",
  );

  for (const role of ["HOMEOWNER", "PROVIDER", "ADMIN"]) {
    const email = process.env[`TEST_${role}_EMAIL`];
    const password = process.env[`TEST_${role}_PASSWORD`];
    if (!email || !password) {
      results.push(
        `${role} authenticated browser workflows: NOT RUN (credentials unavailable)`,
      );
      continue;
    }
    await page.goto(base + "/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await page.reload();
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/dashboard");
    const paths =
      role === "HOMEOWNER"
        ? ["/homes", "/favorites", "/waitlist"]
        : role === "PROVIDER"
          ? [
              "/provider/profile",
              "/provider/services",
              "/provider/availability",
              "/provider/reschedules",
            ]
          : ["/admin/users", "/admin/providers", "/admin/categories"];
    for (const path of paths) {
      await page.goto(base + path);
      await page.getByRole("heading", { level: 1 }).waitFor();
    }
    await page.getByRole("button", { name: "Sign out" }).click();
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("homehub.token")),
      null,
    );
    results.push(`${role} login, reload, role pages, logout: passed`);
  }
  assert.deepEqual(failures, [], "Browser runtime errors");
  results.push("Browser runtime errors: none");
} finally {
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/browser-results.txt", results.join("\n") + "\n");
  console.log(results.join("\n"));
  await browser.close();
}
