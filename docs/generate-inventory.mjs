import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

//Generate from the reviewed source inventory when the backend is offline.
const backend = resolve(import.meta.dirname, "../../HomeHub");
const inventory = readFileSync(
  resolve(backend, "docs/BACKEND-API-INVENTORY.md"),
  "utf8",
);
const operations = [
  ...inventory.matchAll(
    /^\| `(GET|POST|PUT|DELETE|PATCH) ([^`]+)` \| (.*?) \| `([^`]+)` \| `([^`]+)` \|$/gm,
  ),
].map(([, method, path, authorization, request, response]) => ({
  method,
  path,
  authorization,
  request,
  response,
}));
if (operations.length !== 70)
  throw new Error(
    `Expected 70 inspected operations; found ${operations.length}. Review controller changes before regenerating.`,
  );
writeFileSync(
  "docs/backend-contracts.json",
  JSON.stringify(
    {
      source:
        "Inspected backend controller source; not live integration evidence",
      operations,
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  "docs/API-INVENTORY.md",
  inventory +
    "\n\nPhase 5 frontend consumers: Provider.jsx handles provider details, owned services and availability; Reschedules.jsx handles homeowner/provider requests and decisions; Bookings.jsx includes reports, assessments and booking history; Saved.jsx includes reviews, favorites, waitlists and notifications. See PHASE-5-INTEGRATION.md for verification limits.\n",
);
if (process.argv.includes("--live")) {
  const response = await fetch(
    process.env.OPENAPI_URL || "http://localhost:8070/v3/api-docs",
  );
  if (!response.ok) throw new Error(`OpenAPI returned HTTP ${response.status}`);
  writeFileSync(
    "docs/openapi.json",
    JSON.stringify(await response.json(), null, 2) + "\n",
  );
  console.log(
    "Live OpenAPI snapshot refreshed; authenticated workflows were not executed by this command.",
  );
}
console.log(`${operations.length} source-inspected API operations documented.`);
