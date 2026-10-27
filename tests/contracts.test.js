import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const spec = JSON.parse(
  readFileSync(new URL("../docs/openapi.json", import.meta.url)),
);
const sources =
  readdirSync("src/pages")
    .filter((name) => name.endsWith(".jsx"))
    .map((name) => readFileSync(resolve("src/pages", name), "utf8"))
    .join("\n") +
  readFileSync("src/api/index.js", "utf8") +
  readFileSync("src/context/NotificationContext.jsx", "utf8");
const templates = [
  ...sources.matchAll(
    /(?:get|post|put|remove|patch|allPages)\(\s*['"`]\/(auth|users|services|providers|categories|homes|booking|reschedules|waitlist|favorites|reviews|reports|assessments|availability|notifications|admin)([^'"`\n]*)['"`]/g,
  ),
].map((match) => "/api/" + match[1] + match[2].replace(/\$\{[^}]+\}/g, "{id}"));
const normalize = (path) => path.replace(/\{[^}]+\}/g, "{id}");
test("every API path referenced by the application exists in live OpenAPI snapshot", () => {
  const paths = Object.keys(spec.paths).map(normalize);
  assert.ok(
    new Set(templates).size >= 30,
    "Contract scan must include multiline requests",
  );
  for (const path of new Set(templates))
    assert.ok(paths.includes(path), `Unknown API path: ${path}`);
});
test("every controller endpoint is accounted for in the inventory", () => {
  const inventory = readFileSync("docs/API-INVENTORY.md", "utf8");
  for (const [path, operations] of Object.entries(spec.paths))
    for (const method of Object.keys(operations)) {
      assert.ok(
        inventory.includes(`${method.toUpperCase()} ${path}`),
        `Missing ${method} ${path}`,
      );
    }
});
