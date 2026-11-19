import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

//Read-only live checks. No account, booking or notification mutation is attempted.
const base = process.env.BACKEND_URL || "http://127.0.0.1:8070";
const frontend = process.env.FRONTEND_URL || "http://127.0.0.1:5173";
const { operations } = JSON.parse(
  readFileSync("docs/backend-contracts.json", "utf8"),
);
const checks = [];
async function request(path, options = {}) {
  return fetch(base + path, { ...options, signal: AbortSignal.timeout(10000) });
}
async function check(name, run) {
  try {
    await run();
    checks.push({ name, result: "PASS" });
  } catch (error) {
    checks.push({ name, result: "FAIL", reason: error.message });
  }
}
await check(
  "Live OpenAPI agrees with all 70 inspected controller operations",
  async () => {
    const response = await request("/v3/api-docs");
    assert.equal(response.status, 200);
    const spec = await response.json();
    for (const { method, path } of operations)
      assert.ok(
        spec.paths[path]?.[method.toLowerCase()],
        `Missing ${method} ${path}`,
      );
    assert.equal(
      spec.components.schemas.User?.properties?.passwordHash,
      undefined,
    );
    assert.equal(
      spec.components.schemas.UserResponse?.properties?.passwordHash,
      undefined,
    );
  },
);
const protectedReads = operations.filter(
  ({ method, path }) => method === "GET" && !path.startsWith("/api/auth/"),
);
for (const { path } of protectedReads) {
  for (const token of [null, "invalid-phase6-token"]) {
    await check(
      `${path}: ${token ? "malformed JWT" : "anonymous"} denied without private response fields`,
      async () => {
        const response = await request(path.replace(/\{[^}]+\}/g, "1"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        assert.equal(response.status, 401);
        const body = await response.json();
        assert.deepEqual(Object.keys(body).sort(), ["message"]);
        assert.equal(typeof body.message, "string");
      },
    );
  }
}
await check(
  "Missing verification parameter returns safe HTTP 400",
  async () => {
    const response = await request("/api/auth/verify");
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.message, "Required parameter is missing: token");
    assert.equal(body.status, 400);
    assert.ok(!("trace" in body) && !("stackTrace" in body));
    //Compare offset-free server time with its HTTP UTC date, without changing JVM time.
    const utcHeader = Date.parse(response.headers.get("date"));
    const asBahrain = Date.parse(body.timestamp + "+03:00");
    assert.ok(
      Math.abs(asBahrain - utcHeader) < 5000,
      "Server error timestamp is inconsistent with Bahrain UTC+3",
    );
  },
);
for (const path of ["register", "login", "forgot-password", "reset-password"]) {
  await check(
    `Empty ${path} request is rejected before account/password/email mutation`,
    async () => {
      const response = await request(`/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.ok(!("trace" in body) && !("stackTrace" in body));
    },
  );
}
for (const [path, body] of [
  ["login", "{"],
  ["register", '{"role":"UNKNOWN_ROLE"}'],
]) {
  await check(
    `Invalid JSON/enum ${path} request returns safe HTTP 400`,
    async () => {
      const response = await request(`/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      assert.equal(
        response.status,
        400,
        "Running server must load the corrected JSON exception handler",
      );
      const payload = await response.json();
      assert.equal(
        payload.message,
        "Request body is missing or contains invalid JSON values",
      );
      assert.ok(!("trace" in payload) && !("stackTrace" in payload));
    },
  );
}
await check(
  "Vite same-origin API proxy returns the backend's protected response",
  async () => {
    const response = await fetch(frontend + "/api/users/profile", {
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Authentication required");
  },
);
await check(
  "Direct cross-origin authenticated preflight remains unsupported",
  async () => {
    const response = await request("/api/users/profile", {
      method: "OPTIONS",
      headers: {
        Origin: frontend,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization",
      },
    });
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.ok([401, 403].includes(response.status));
  },
);
mkdirSync("test-results", { recursive: true });
const report = {
  kind: "Read-only live HTTP checks; not successful role or transaction integration",
  protectedGetOperations: protectedReads.length,
  passed: checks.filter((x) => x.result === "PASS").length,
  failed: checks.filter((x) => x.result === "FAIL").length,
  checks,
};
writeFileSync(
  "test-results/phase6-api-results.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `${report.passed} live HTTP checks passed; ${report.failed} failed; ${protectedReads.length} protected GET operations checked with anonymous and malformed JWT requests.`,
);
for (const item of checks.filter((x) => x.result === "FAIL"))
  console.log(`${item.name}: ${item.reason}`);
if (report.failed) process.exitCode = 1;
