import { chromium } from "playwright";
import { loadEnv } from "vite";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.FRONTEND_URL || "http://localhost:5173";
const env = loadEnv("development", process.cwd(), "VITE_");
const [authReachable, bookingReachable, notificationReachable] = await Promise.all(
  [
    env.VITE_AUTH_API_BASE_URL || "http://localhost:8081",
    env.VITE_BOOKING_API_BASE_URL || "http://localhost:8082",
    env.VITE_NOTIFICATION_API_BASE_URL || "http://localhost:8083",
  ].map((url) =>
    fetch(`${url.trim().replace(/\/+$/, "").replace(/\/api$/, "")}/v3/api-docs`, {
      signal: AbortSignal.timeout(10000),
    }).then((response) => response.ok).catch(() => false),
  ),
);
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
  headless: true,
});
const results = [];
const failures = [];
const context = await browser.newContext();
const page = await context.newPage();
let loginRequests = 0;
let registrationRequests = 0;
page.on("request", (request) => {
  if (request.method() !== "POST") return;
  if (request.url().endsWith("/api/auth/login")) loginRequests++;
  if (request.url().endsWith("/api/auth/register")) registrationRequests++;
});
page.on("pageerror", (error) => failures.push(error.message));
const protectedPaths = [
  "/services",
  "/services/1",
  "/providers/1",
  "/reschedules",
  "/reschedules/1",
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
  assert.equal(
    registrationRequests,
    0,
    "Empty registration must not send an account creation request",
  );
  results.push(
    "Registration native required-field validation: passed (no account created)",
  );
  if (authReachable) {
    await page.goto(base + "/login");
    await page
      .locator('input[name="email"]')
      .fill("frontend-check-nonexistent@homehub.example");
    await page.locator('input[name="password"]').fill("NotAnAccount123!");
    const failedLoginResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/login") &&
        response.request().method() === "POST",
    );
    const beforeLoginRequests = loginRequests;
    await page.evaluate(() => {
      const form = document.querySelector("form");
      form.requestSubmit();
      form.requestSubmit();
    });
    assert.equal(
      (await failedLoginResponse).status(),
      401,
      "Invalid credentials should return 401, not a server/database error",
    );
    await page.getByRole("alert").waitFor();
    assert.equal(
      loginRequests,
      beforeLoginRequests + 1,
      "Repeated same-turn submits must send only one request",
    );
    results.push(
      "Duplicate login submissions: one real request sent for two submit attempts",
    );
    assert.equal(
      await page.locator('input[name="email"]').inputValue(),
      "frontend-check-nonexistent@homehub.example",
    );
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("homehub.token")),
      null,
    );
    results.push(
      "Real backend failed login: HTTP 401, error displayed, input preserved, no session created",
    );
    await page.goto(base + "/verify");
    await page
      .locator('input[name="token"]')
      .fill("invalid-frontend-check-token");
    const invalidVerificationResponse = page.waitForResponse((response) =>
      response.url().includes("/api/auth/verify?"),
    );
    await page
      .getByRole("button", { name: "Verify email", exact: true })
      .click();
    assert.equal(
      (await invalidVerificationResponse).status(),
      404,
      "Invalid token should return 404, not a server/database error",
    );
    await page.getByRole("alert").waitFor();
    results.push(
      "Real backend invalid verification token: HTTP 404, error displayed",
    );
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
  } else {
    results.push(
      "Live backend login, verification and restored-session checks: NOT RUN (backend unreachable)",
    );
    await page.goto(base + "/login");
    await page
      .locator('input[name="email"]')
      .fill("frontend-check@homehub.example");
    await page
      .locator('input[name="password"]')
      .fill("ConnectionCheck123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(
      await page.locator('input[name="email"]').inputValue(),
      "frontend-check@homehub.example",
    );
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("homehub.token")),
      null,
    );
    results.push(
      "Backend-unavailable error display and input preservation: passed (not an authentication integration test)",
    );
  }

  for (const role of ["HOMEOWNER", "PROVIDER", "ADMIN"]) {
    const email = process.env[`TEST_${role}_EMAIL`];
    const password = process.env[`TEST_${role}_PASSWORD`];
    if (!authReachable || !bookingReachable || !notificationReachable || !email || !password) {
      results.push(
        `${role} authenticated browser workflows: NOT RUN (backend or verified credentials unavailable)`,
      );
      continue;
    }
    await page.goto(base + "/login");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
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
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/dashboard",
        "/services",
        "/bookings",
        "/account",
        "/notifications",
        "/reviews",
        ...paths,
      ]) {
        await page.goto(base + path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.waitForFunction(
          () =>
            ![...document.querySelectorAll('[role="status"]')].some((item) =>
              /^Loading/.test(item.textContent),
            ),
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          `${role} ${path}: overflow at ${width}px`,
        );
        assert.equal(
          await page.getByRole("alert").count(),
          0,
          `${role} ${path}: unexpected error`,
        );
      }
    }
    await page.getByRole("button", { name: "Sign out" }).click();
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("homehub.token")),
      null,
    );
    results.push(
      `${role} login, reload, read-only role pages at 1440/768/390px, logout: passed`,
    );
  }
  assert.deepEqual(failures, [], "Browser runtime errors");
  results.push("Browser runtime errors: none");
} finally {
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/browser-results.txt", results.join("\n") + "\n");
  console.log(results.join("\n"));
  await browser.close();
}
