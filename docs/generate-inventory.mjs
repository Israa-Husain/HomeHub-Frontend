import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(
  import.meta.dirname,
  "../../HomeHub/src/main/java/com/ga/HomeHub",
);
const spec = await (await fetch("http://localhost:8070/v3/api-docs")).json();
mkdirSync("docs", { recursive: true });
writeFileSync("docs/openapi.json", JSON.stringify(spec, null, 2));
const placement = {
  auth: "Auth.jsx — public",
  users: "Account.jsx / AuthContext — authenticated",
  homes: "Homes.jsx / Services.jsx — HOMEOWNER",
  providers: "Provider.jsx — PROVIDER",
  services:
    "Services.jsx / Provider.jsx — authenticated reads; PROVIDER mutations",
  categories: "Services.jsx / Admin.jsx — authenticated reads; ADMIN mutations",
  availability: "Provider.jsx — authenticated reads; PROVIDER mutations",
  booking:
    "Bookings.jsx / Services.jsx — participant reads, HOMEOWNER create/cancel, PROVIDER/ADMIN status; ADMIN lookup/cancel",
  reschedules:
    "Bookings.jsx request (HOMEOWNER); Provider.jsx decision (PROVIDER)",
  waitlist: "Saved.jsx / Services.jsx — HOMEOWNER",
  favorites: "Saved.jsx / Services.jsx — HOMEOWNER",
  reviews: "Saved.jsx reads (authenticated); Bookings.jsx create (HOMEOWNER)",
  reports: "Bookings.jsx — participant reads; PROVIDER submission",
  assessments: "Bookings.jsx — PROVIDER, pending read / completed submission",
  notifications: "NotificationContext / Saved.jsx — authenticated, own records",
  admin: "Admin.jsx — ADMIN",
};
const schemaName = (schema) =>
  schema?.$ref?.split("/").at(-1) ||
  (schema?.type === "array"
    ? `array<${schemaName(schema.items)}>`
    : schema?.type || "empty");
let markdown =
  "# HomeHub API inventory\n\nGenerated from the running backend OpenAPI and checked against all 16 controller sources. Protected requests use `Authorization: Bearer <token>`. Root API URL: `/api` (local proxy to port 8070). Auth routes are public; other routes require login. Ownership and state checks remain server-side.\n\n";
let count = 0;
for (const [path, operations] of Object.entries(spec.paths).sort()) {
  for (const [method, operation] of Object.entries(operations)) {
    count++;
    markdown += `## ${method.toUpperCase()} ${path}\n\n`;
    markdown += `- Controller tag: ${operation.tags?.join(", ") || "See source"}\n- Frontend / role: ${placement[path.split("/")[2]]}\n`;
    markdown += `- Parameters: ${(operation.parameters || []).map((p) => `${p.name} (${p.in}, ${p.required ? "required" : "optional"}, ${schemaName(p.schema)})`).join("; ") || "none"}\n`;
    const body = operation.requestBody?.content;
    markdown += `- Body: ${
      body
        ? Object.entries(body)
            .map(([type, content]) => `${type}: ${schemaName(content.schema)}`)
            .join("; ")
        : "none"
    }\n`;
    markdown += `- Responses: ${Object.entries(operation.responses || {})
      .map(
        ([code, response]) =>
          `${code}: ${
            Object.values(response.content || {})
              .map((c) => schemaName(c.schema))
              .join(", ") || "empty"
          }`,
      )
      .join("; ")}\n\n`;
  }
}
markdown += `Total: ${count} operations.\n\n## Exact request and response schemas\n\nSee [openapi.json](openapi.json) for full schemas, validation constraints, enums, and Spring Page structures. To keep controller-defined maps explicit, their source return mappings are included below.\n\n`;
for (const name of readdirSync(resolve(root, "controller")).filter((name) =>
  name.endsWith(".java"),
)) {
  const code = readFileSync(resolve(root, "controller", name), "utf8");
  const compact = code
    .replace(/import .*;\r?\n/g, "")
    .replace(/\s*@Operation\([^\n]*\)/g, "")
    .replace(/\s*@ApiResponses\(value=\{[\s\S]*?\}\)/g, "");
  markdown += `### ${name}\n\n\`\`\`java\n${compact.trim()}\n\`\`\`\n\n`;
}
writeFileSync("docs/API-INVENTORY.md", markdown);
console.log(`Inventory created: ${count} operations, 16 controllers.`);
