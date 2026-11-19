import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { readNotificationEvents } from "../src/api/notificationStream.js";

const { operations } = JSON.parse(
  readFileSync(new URL("../docs/backend-contracts.json", import.meta.url)),
);
const spec = { paths: {} };
for (const { method, path } of operations) {
  spec.paths[path] ||= {};
  spec.paths[path][method.toLowerCase()] = {};
}
// The bundled inventory/OpenAPI files describe the historical monolith.
const currentEndpoints = operations.map((operation) => ({
  ...operation,
  path: operation.path.replace(/^\/api\/admin\/users(?=\/|$)/, "/api/users"),
}));
const sources =
  readdirSync("src/pages")
    .filter((name) => name.endsWith(".jsx"))
    .map((name) => readFileSync(resolve("src/pages", name), "utf8"))
    .join("\n") +
  readFileSync("src/api/index.js", "utf8") +
  readFileSync("src/api/client.js", "utf8") +
  readFileSync("src/context/NotificationContext.jsx", "utf8");
const templates = [
  ...sources.matchAll(
    /(?:get|post|put|remove|patch|allPages)\(\s*['"`]\/(auth|users|services|providers|categories|homes|booking|reschedules|waitlist|favorites|reviews|reports|assessments|availability|notifications|admin)([^'"`\n]*)['"`]/g,
  ),
].map((match) => "/api/" + match[1] + match[2].replace(/\$\{[^}]+\}/g, "{id}"));
const normalize = (path) => path.replace(/\{[^}]+\}/g, "{id}");
test("every direct API path referenced by the application exists in the inspected source contract", () => {
  const paths = currentEndpoints.map(({ path }) => normalize(path));
  assert.ok(
    new Set(templates).size >= 30,
    "Contract scan must include multiline requests",
  );
  for (const path of new Set(templates))
    assert.ok(paths.includes(path), `Unknown API path: ${path}`);
});

test("direct API requests use the inspected HTTP method as well as the path", () => {
  const methods = {
    get: "GET",
    post: "POST",
    put: "PUT",
    remove: "DELETE",
    delete: "DELETE",
    patch: "PATCH",
    allPages: "GET",
  };
  const known = new Set(
    currentEndpoints.map(({ method, path }) => `${method} ${normalize(path)}`),
  );
  const calls = [
    ...sources.matchAll(
      /\b(get|post|put|remove|delete|patch|allPages)\(\s*["'`]([^"'`\n]+)["'`]/g,
    ),
  ].filter(([, , path]) => path.startsWith("/"));
  assert.ok(new Set(calls.map(([, fn, path]) => `${fn} ${path}`)).size >= 60);
  for (const [, fn, path] of calls)
    assert.ok(
      known.has(
        `${methods[fn]} /api${normalize(path.replace(/\$\{[^}]+\}/g, "{id}"))}`,
      ),
      `Unknown ${methods[fn]} ${path}`,
    );
});

test("all previously supported operations have a current frontend request path", () => {
  const paths = [
    ...sources.matchAll(
      /["'`](\/(?:auth|users|services|providers|categories|homes|booking|reschedules|waitlist|favorites|reviews|reports|assessments|availability|notifications|admin)[^"'`\n]*)["'`]/g,
    ),
  ].map(([, path]) => normalize(`/api${path.replace(/\$\{[^}]+\}/g, "{id}")}`));
  assert.match(sources, /notificationStreamUrl = `\$\{notificationBase\}\/api\/notifications\/stream`/);
  assert.ok(sources.includes("fetch(notificationStreamUrl,"));
  paths.push("/api/notifications/stream");
  for (const { method, path } of currentEndpoints)
    assert.ok(
      paths.includes(normalize(path)),
      `Missing frontend path: ${method} ${path}`,
    );
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

test("inspected controller methods and paths agree with the refreshed live OpenAPI snapshot", () => {
  const live = JSON.parse(readFileSync("docs/openapi.json", "utf8"));
  for (const { method, path } of operations)
    assert.ok(
      live.paths[path]?.[method.toLowerCase()],
      `Live schema missing ${method} ${path}`,
    );
});

test("notification SSE parses named frames across split line endings", async () => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of [
        ": keepalive\r\n\r",
        "\nid: 201\r\nevent: book",
        'ing\r\ndata: {"id":201}\r\n\r',
        '\nevent: refresh\ndata: {"unreadCount":1}\n\n',
      ]) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  const events = [];
  await readNotificationEvents(body, (type, id) => events.push([type, id]));
  assert.deepEqual(events, [["booking", "201"], ["refresh", undefined]]);
});
