# Verification Ladder

Three levels of verification for use during development, review, and release.

---

## Levels

### FAST_CHECK

**When to use:** After logic-only changes to `src/lib/`, `src/commands/`, or `src/core/`. No UI or state contract changes.

**Command:**
```
npm test
```

Runs unit and integration tests. Fast, no Electron required.

---

### UI_CHECK

**When to use:** After changes to `src/electron/` (renderer, main, preload) or any UI-affecting logic. Requires a display environment.

**Command:**
```
npm run test:e2e
```

Runs the Playwright/Electron e2e suite. Covers app launch, search panel, session rendering, and bookmark flows.

---

### FULL_VERIFY

**When to use:** Before committing a completed package, before handoff review, or after any broad changes touching state contracts, CLI, or UI.

**Command:**
```
npm run verify:full
```

Expands to:
1. `npm run check:state-preflight` — verify state contracts before work
2. `npm test` — unit + integration
3. `npm run test:e2e` — Playwright/Electron e2e
4. `npm run check:state-postflight` — verify state contracts after work

---

## Quick Reference

| Level        | Command              | Scope                          | Requires Electron |
|--------------|----------------------|--------------------------------|-------------------|
| FAST_CHECK   | `npm test`           | Unit + integration             | No                |
| UI_CHECK     | `npm run test:e2e`   | Playwright/Electron e2e        | Yes               |
| FULL_VERIFY  | `npm run verify:full`| State checks + unit + e2e      | Yes               |

---

## Notes

- `FAST_CHECK` is always safe to run locally.
- `UI_CHECK` requires a display (native macOS or headed CI).
- `FULL_VERIFY` is the definitive gate before a handoff or merge.
- Do not skip `FULL_VERIFY` for packages that touch state contracts or CLI surface.
