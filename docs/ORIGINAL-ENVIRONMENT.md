# Original HomeHub environment: startup and identity checks

Prepared offline on 2026-10-28. Neither server was started. No database connection or query was executed during this review. Follow these instructions yourself only after reviewing the handoff.

## What the existing files establish

| Setting | Inspected value |
|---|---|
| Backend repository | `C:\Users\HP\jdb\projects\HomeHub` |
| Main class / JDK | `com.ga.HomeHub.HomeHubApplication` / Java 17 (`temurin-17` in the project) |
| Source profile | `dev` from `application.properties` |
| Source JDBC URL | `jdbc:postgresql://localhost:5432/HomeHub` |
| Backend port | `8070` |
| Frontend repository | `C:\Users\HP\jdb\projects\HomeHub-Frontend` |
| Frontend script | `npm.cmd run dev` (binds to `127.0.0.1`) |
| Frontend port | `5173`, now strict: an occupied port causes failure instead of switching ports |
| Browser API base / upload path | `/api` / `/uploads` |
| Vite proxy default | `http://localhost:8070` |
| Frontend env files found | `.env.example` only; it agrees with these defaults |
| Shell proxy/config overrides found | None of the inspected proxy URL, Spring profile/config/URL/port or Java-option variables were set |
| Required secrets in current shell | `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `MAIL_USERNAME`, `MAIL_PASSWORD` were absent; values were not printed |
| Saved IDE backend configuration found | `HomeHub E2E - Bahrain` (JAR run): do not use it |
| Saved IDE database connection found | `HomeHub E2E` → `HomeHub_E2E`: do not use it |
| Runtime identity | Unconfirmed: no Java process or listeners on 8070/5173 were found during inspection |

Source defaults, an IDE database connection, a successful login, or an OpenAPI response alone do not prove which database the running backend uses. IDE run settings, environment variables, VM/program arguments and external Spring configuration can override source properties.

## Before starting: avoid startup writes

The existing backend has **two startup write risks**. No backend file was changed to remove them:

1. `application-dev.properties` has `spring.jpa.hibernate.ddl-auto=update`. A normal startup can alter schema.
2. `DataSeed.run()` runs without a demo profile. It inserts default categories if the category table is empty, and an administrator if the email from the existing `MAIL_USERNAME` setting is absent. The `demo` profile would additionally create demo records.

To preserve the original database, first use an original-HomeHub PostgreSQL connection and run the following **read-only** checks. If the only saved IDE connection is E2E, do not run these there: create/open a connection to `localhost:5432/HomeHub` using your existing original credentials, or use `psql` with those credentials. Do not copy E2E connection settings or guess a password. Leave E2E untouched.

In IntelliJ: Database tool window → select the original HomeHub data source → New Query Console. Verify its JDBC URL and set the console/data source read-only if available. Run:

```sql
BEGIN READ ONLY;
SELECT current_database() AS database_name,
       current_user AS database_user,
       inet_server_addr() AS server_address,
       inet_server_port() AS server_port;
SELECT to_regclass('public.users') AS users_table,
       to_regclass('public.category') AS category_table;
-- Continue only if the database is exactly HomeHub and both tables exist.
SELECT COUNT(*) AS category_count FROM public.category;
-- Replace the placeholder with the exact existing MAIL_USERNAME email.
-- This is an existence check, not an instruction to change that setting.
SELECT EXISTS (
  SELECT 1 FROM public.users
  WHERE email_address = '<existing MAIL_USERNAME email>'
) AS administrator_seed_condition_already_satisfied;
ROLLBACK;
```

The category count must be greater than zero and the existence check must be true. Inspect only results you need; do not export account records. If your original schema differs from `public`, confirm the intended existing schema instead of creating tables.

**Stop before backend startup if identity, schema, credentials or either seed condition is unresolved.** There is no inspected seed-disable switch to assume. `ddl-auto=validate` prevents Hibernate DDL but does not disable `DataSeed`. Do not insert records, activate `demo`, or use `update` to make startup pass.

## Start the original backend in IntelliJ (you perform this later)

1. Open the original `HomeHub` project. Select JDK 17 and the main class `src/main/java/com/ga/HomeHub/HomeHubApplication.java`. Do not run `HomeHubServiceTest.java`, an E2E JAR, or any test configuration.
2. Run → Edit Configurations. Use an existing original Spring Boot configuration if you have one elsewhere. Otherwise create **Spring Boot** (or **Application**) named `HomeHub Original - Manual`, main class `com.ga.HomeHub.HomeHubApplication`, module/classpath `HomeHub`, working directory `C:\Users\HP\jdb\projects\HomeHub`.
3. Use the original environment/secret source for `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `MAIL_USERNAME`, `MAIL_PASSWORD`. Preserve their existing values. This review cannot recover or verify them; do not borrow secrets from the E2E run configuration or store them in Git/frontend env files.
4. Use only the original `dev` profile. Check inherited environment variables, active-profile field, VM options, program arguments and external config paths. Remove E2E overrides from this new/original run: no `HomeHub_E2E`, `e2e`, `demo`, `target/e2e-runtime`, or isolated build/JAR/config paths. Confirm no effective datasource URL differs from `jdbc:postgresql://localhost:5432/HomeHub` and no port override differs from `8070`. Do not edit repository datasource URLs or credentials.
5. Because the existing default is schema-updating, use this **run-only program argument** to prevent Hibernate schema changes:

   ```text
   --spring.jpa.hibernate.ddl-auto=validate
   ```

   This does not edit a backend property file, credentials or schema. It deliberately fails on a schema mismatch. Do not switch back to `update` to bypass a failure. Startup remains conditional on the read-only seed checks above.
6. Inspect the effective JVM timezone. The backend uses `LocalDateTime.now()` and `LocalDate.now()` for business rules. Keep the existing original Bahrain-equivalent timezone (UTC+3). Do not reuse an E2E timezone setting. If the original JVM time cannot be confirmed as Bahrain-equivalent, stop and resolve that mismatch before bookings; the frontend cannot correct backend business time. No timezone or scheduling setting was changed by this work.
7. Keep scheduling unchanged and disabled. Current source has `@Scheduled` methods but no `@EnableScheduling`/scheduling registration was found. Do not add it, call scheduler methods, or start another backend to process timers.
8. For the first startup, add a normal line breakpoint at the **first executable line of `DataSeed.run()`**, before `if (categoryRepository.count()==0)`. This changes no source. Click **Debug** for the original main-class configuration so it pauses before any seed inserts. Keep Hibernate's run-only `validate` argument. Build the current source; do not launch an old E2E JAR.
9. While paused, IntelliJ Evaluate Expression can inspect only these non-secret values: `environment.getProperty("spring.datasource.url")`, `environment.getActiveProfiles()`, `java.time.ZoneId.systemDefault().getId()` and `java.time.LocalDateTime.now()`. Confirm original URL, only `dev`, and Bahrain-equivalent time. Do not dump all environment/system properties because they may contain secrets.
10. **Before resuming `DataSeed.run()`**, perform the actual JVM/PostgreSQL identity correlation below and recheck the two seed conditions on that confirmed database. The connection pool has been initialized by JPA validation at this point. If no unambiguous connection can be identified, a seed condition fails, or the application misses this breakpoint, stop the debug run; do not assume it was safe. Otherwise resume and wait for startup to finish successfully on 8070. Keep the pre-seed breakpoint for subsequent startups while preserving this no-startup-writes requirement.

If validation or authentication fails, stop and record the error. No database reset, migration, copying, seeding or credential change is part of these instructions.

## Confirm the running backend's actual database before opening the frontend

At the pre-seed breakpoint on the first debug startup, first read the running backend's effective datasource URL/profile from its run settings and startup output. An exact URL in the log is useful, but some Hibernate/Hikari log formats omit it. A PostgreSQL console connected to HomeHub proves only the console's identity, not the JVM's.

For stronger confirmation, correlate the original backend process with its PostgreSQL sessions. In IntelliJ Terminal (PowerShell), while the original debug run is paused before seeding:

```powershell
$homeHubBackendListeners = @(Get-NetTCPConnection -State Listen -LocalPort 8070 -ErrorAction Stop)
$homeHubBackendPids = @($homeHubBackendListeners.OwningProcess | Select-Object -Unique)
$homeHubBackendPids | ForEach-Object { Get-Process -Id $_ | Select-Object Id, ProcessName }
$homeHubPgSockets = @(Get-NetTCPConnection -State Established -RemotePort 5432 |
  Where-Object { $homeHubBackendPids -contains $_.OwningProcess })
$homeHubPgSockets | Select-Object OwningProcess, LocalAddress, LocalPort, RemoteAddress, RemotePort
```

Identify the PID as the Java process of the original IntelliJ run. Inspect only that process locally; do not paste command lines containing secrets. Note the local PostgreSQL client-port numbers. In the original read-only SQL console, substitute those numeric ports below:

```sql
BEGIN READ ONLY;
SELECT current_database() AS console_database;
SELECT pid, datname, application_name, client_addr, client_port, backend_type
FROM pg_stat_activity
WHERE backend_type = 'client backend'
  AND client_port IN (<local ports owned by the original Java process>);
ROLLBACK;
```

Every matching backend connection must have `datname = 'HomeHub'`, and at least one unambiguous JVM connection must match. Compare host/address too if multiple PostgreSQL instances exist. Do not terminate sessions. With restricted PostgreSQL visibility, empty results, ambiguous PIDs, a different port/host or no matching sockets, **identity is not confirmed**: stop and use an administrator-assisted read-only inspection or an existing debugger/connection-inspection facility to inspect the running datasource. Do not assume that a separate IDE connection or a successful UI request is sufficient.

To inspect only the JVM timezone property, use the installed `jcmd` against that original PID and filter its output locally:

```powershell
& 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\jcmd.exe' <original Java PID> VM.system_properties |
  Select-String '^user.timezone='
```

The path is the installed tool found during review; use the corresponding JDK tool if your installation moves. Confirm the reported zone is Bahrain-equivalent at UTC+3. A missing or unclear property is not proof of the effective zone; resolve it before booking tests.

## Start the existing frontend in IntelliJ (only after identity is confirmed)

Open `HomeHub-Frontend` as the existing project or use IntelliJ Terminal:

```powershell
cd C:\Users\HP\jdb\projects\HomeHub-Frontend
npm.cmd run dev -- --port 5173 --strictPort
```

Node 24.13.0/npm 11.6.2 and the existing installed dependencies were used for verification. No reinstall is required on this machine. If dependencies are missing elsewhere, use the existing lockfile with `npm.cmd ci`; do not recreate the project.

An IntelliJ npm run configuration can instead use this repository's `package.json`, script `dev`, arguments `--port 5173 --strictPort`, and the installed Node interpreter. Do not select `test:browser` or `tests/phase6-api-check.mjs`.

No `.env` copy is required: defaults already use `/api` and `http://localhost:8070`. Check local `.env`, `.env.local`, mode-specific files and inherited npm/IDE environment for conflicting `API_PROXY_TARGET` or `VITE_API_BASE_URL` values before launch. Do not put credentials in frontend files.

Open `http://127.0.0.1:5173` consistently. Using `localhost` is a different browser origin with different session storage. In browser DevTools, API URLs should be same-origin `http://127.0.0.1:5173/api/...`; Vite forwards them to 8070. Uploads use `/uploads`. The frontend starts no backend and accesses no database directly. Close any prior E2E browser tab/session before signing into the original environment.

If port 5173 is occupied, stop and identify the existing process; strict mode will not silently select 5174. Do not start a second isolated backend. Keep the SQL identity check result and original run profile with your manual test notes, excluding credentials/tokens.

## Scheduling limitation during manual testing

With scheduling left disabled, do not expect timer-driven booking expiration, report/status transitions, scheduled reminders or automatic expired-offer cleanup/offer advancement to run. Existing explicit actions such as cancellations and provider decisions may produce notifications or waitlist offers. The frontend shows actual stored statuses and an informational offer countdown; it does not simulate background work. See the manual guide for conditional tests.
