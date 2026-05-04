# src/test/

## Purpose

This folder contains automated verification for Consync runtime behavior, process boundaries, and UI correctness.

Tests here validate that the product works correctly, that state contracts are upheld, and that the CLI, renderer, and bridge layers behave as specified.

---

## What Belongs Here

### Verify runner
- `verify.js` — the main verification orchestrator; runs all test groups in order; called by `npm run verify`

### Unit tests — isolated logic
- `unit-new-guid.js` — GUID generation logic
- `unit-dry-run-check.js` — Gatekeeper decision rules (pure logic, temp dir fixtures)
- `unit-get-in-flight-packet.js` — in-flight packet state reader
- `unit-consync-run.js` — consync-run command behavior
- `unit-intake-run.js` / `unit-preflight-run.js` / `unit-verify-run.js` — agent execution entry points
- `unit-standalone-notes-grouping.js` — notes grouping logic

### Integration tests — command/lib workflows
- `integration-new-guid-cli.js` — new-guid CLI end-to-end (creates real files)
- `integration-handoff-bundle-cli.js` — handoff-bundle CLI end-to-end

### Bridge / state tests — state contracts and integrity
- `bridge-integrity-checks.js` — verifies `.scaffoldai/` state files are present and well-formed
- `state-integrity-checks.js` — preflight/postflight state integrity check behavior
- `gatekeeper-checks.js` — Gatekeeper decision rule contracts
- `handoff-contract-checker.js` — handoff and next-action required field contracts

### Renderer slice tests — UI logic without full Electron
- `renderer-session-panel.js` — session panel row logic
- `renderer-mock-search-panel.js` — mock search panel behavior
- `renderer-bookmark-flow.js` — bookmark create/read/display flow
- `bookmark-write-read-render-loop.js` — bookmark write → read → render round-trip
- `desktop-scaffold.js` — desktop scaffold boundary checks
- `app-search-flow.test.jsx` — full App UI slice tests via vitest + jsdom (run by `npm run test:ui-search`)
- `core-session.js` — core session logic slice

### E2e tests — full Electron flows via Playwright
Located in `e2e/` — run by `npm run test:e2e` against a live Vite renderer dev server.

- `audio-*.spec.js` — audio file loading, playback, markers, hotkeys, undo, recent files
- `timeline-*.spec.js` — timeline view state and marker entry
- `inspector-*.spec.js` — inspector panel state and marker selection
- `search-panel-*.spec.js` — search panel smoke and input behavior

---

## What Does NOT Belong Here

- Reusable business logic (belongs in `src/lib/`)
- CLI command handlers (belong in `src/commands/`)
- Test fixtures and expected output files (belong in `sandbox/fixtures/` and `sandbox/expectations/`)
- ScaffoldAI process state or docs (belong under `.scaffoldai/`)
- Consync product metadata (belongs under `.consync/`)

---

## Important Boundaries

- **Do not weaken assertions to make failures pass** — fix the code or the test data instead
- **Do not skip tests** — if a test is flaky, fix the root cause; if it is truly optional, document why
- **Unit tests must not write to real `.scaffoldai/state/` files** — use isolated temp dirs for any state file fixtures
- **Renderer slice tests must not require Electron to be running** — they run via Node.js or jsdom only
- **E2e tests run against a real renderer server** — do not add arbitrary `waitFor` delays; use deterministic selectors
- **`verify.js` is the authoritative test runner** — do not bypass it by running individual test files as a substitute for `npm run verify`
- **Test files are verification, not product code** — do not import test helpers into `src/lib/` or `src/commands/`

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `src/lib/` | The logic being tested by unit and integration tests |
| `src/commands/` | The commands being exercised by integration tests |
| `src/electron/` | The Electron app layers exercised by renderer slice and e2e tests |
| `sandbox/fixtures/` | Deterministic input directories used by CLI tests |
| `sandbox/expectations/` | Expected output files matched against CLI output in `verify.js` |

---

## Verification Notes

- `npm run verify` — runs all groups: CLI, bridge/state, renderer slices, sandbox expectations, and agent tests
- `npm run test:ui-search` — runs `app-search-flow.test.jsx` via vitest + jsdom (also included in `npm run verify`)
- `npm run test:e2e` — runs `e2e/` via Playwright (part of `npm run verify:full`)
- `npm run verify:full` — full pipeline: preflight + tests + preload build + e2e + postflight
- Individual test files can be run as `node src/test/<file>.js` for quick manual checks
