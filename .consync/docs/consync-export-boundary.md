# Consync Export Boundary

Captured: 2026-04-27
Packet: `consync-shareable-export-boundary-v1`
Mode: inspection/documentation only

This document defines the minimum observed boundary for creating a shareable
Consync desktop app build without exposing ScaffoldAI/dev-harness internals. It
does not move files, rename files, change build config, extract ScaffoldAI, or
add packaging automation.

## Boundary Summary

The shareable app boundary should be the Electron desktop runtime plus the
smallest user data/session surface needed by that runtime. The current repo also
contains Consync process state, agents, prompts, docs, sandbox fixtures, probes,
CLI process commands, and verification support. Those are development and
governance surfaces, not user-facing app bundle content.

The current Electron package build is already narrow because
`@electron-forge/plugin-vite` installs a packager ignore rule that keeps only
paths under the repo-root `/.vite` directory. That means `.consync/`, `.github/`,
`sandbox/`, docs, source files, and tests do not currently appear in
`app.asar`.

At initial inspection, the package was not yet a clean shareable app build: the
renderer build output was produced under
`src/electron/renderer/.vite/renderer/main_window/` instead of repo-root
`.vite/renderer/main_window/`, while the packaged main bundle loaded
`../renderer/main_window/index.html` relative to root `.vite/build`. That
inspected `app.asar` contained only:

```text
.vite/
.vite/build/
.vite/build/index.js
.vite/build/preload.js
package.json
```

That package did not include the dev/process folders, but it also did not
include the renderer artifact required by the packaged window. The renderer
output path has since been aligned to repo-root `.vite/renderer/main_window/`.

## 1. User-Facing Consync App / Runtime

These files and folders belong to the user-facing Electron app/runtime boundary.

| Area | Required surface | Notes |
| --- | --- | --- |
| Electron main process | `src/electron/main/index.js`, `src/electron/main/window.js`, `src/electron/main/ipc.js` | Creates the app, registers IPC, opens the main window, and handles desktop operations. |
| Electron preload | `src/electron/preload/preload.js`, `src/electron/preload/bridge.js` | Exposes the constrained renderer bridge through `window.consyncDesktop`. |
| Shared IPC contract | `src/electron/shared/ipc-channels.js` | Required by both preload and main bundles. |
| Renderer UI | `src/electron/renderer/index.html`, `src/electron/renderer/renderer.jsx`, `src/electron/renderer/App.jsx`, `src/electron/renderer/styles.css` | User-facing desktop UI. |
| Renderer UI helpers | `src/electron/renderer/session-panel.mjs`, `src/electron/renderer/bookmark-flow.mjs`, `src/electron/renderer/mock-search-panel.mjs`, `src/electron/renderer/mock-waveform-panel.mjs` | Currently imported by the renderer and needed unless the app surface is simplified. |
| Runtime core | `src/core/desktop-shell.js`, `src/core/session.js` | Provides desktop summaries, sandbox-backed search, reveal behavior, session state, and bookmark writes. |
| Runtime library dependency | `src/lib/sandbox-anchors.js` | Currently required by `src/core/desktop-shell.js` for desktop mock search. |
| Build manifest | `package.json`, `package-lock.json` | Required to install/build/package reproducibly. |
| Electron/Vite config | `forge.config.js`, `vite.main.config.mjs`, `vite.preload.config.mjs`, `vite.renderer.config.mjs` | Required for local development and packaging. |
| Runtime dependencies | production dependencies from `package.json` | Current production dependencies are `react` and `react-dom`; Electron itself is a build/dev dependency used by Forge packaging. |
| Packaged runtime output | root `.vite/build/index.js`, root `.vite/build/preload.js`, root `.vite/renderer/main_window/**`, packaged `package.json` | This is the intended packaged app shape. |

Current runtime data expectation:

- `src/core/session.js` defaults to `process.cwd()/sandbox/current` unless
  `CONSYNC_SESSION_DIR` is set.
- `src/core/desktop-shell.js` checks `process.cwd()/sandbox/current` for session
  counts.
- Desktop search defaults in the renderer point at
  `sandbox/fixtures/nested-anchor-trial`.

Those defaults are development-shaped. A shareable app should not require the
repo `sandbox/` directory; it should either use app-owned user data/session
storage or receive an explicit user-selected session/search root.

## 2. ScaffoldAI Development Harness

These surfaces are development/process/harness surfaces. They should remain in
the repo, but they are not part of the user-facing app bundle.

| Area | Current location | Boundary note |
| --- | --- | --- |
| Consync process truth | `.consync/` | Agents, state, streams, docs, prompts, skills, templates, packets, and artifacts. |
| GitHub/Copilot adapter | `.github/` | Tool-specific guidance only; points back to `.consync/`. |
| Process CLI entrypoint | `src/index.js`, `src/cli/index.js` | Mixed CLI dispatcher; useful for development and process commands, not the Electron runtime bundle. |
| Gatekeeper/process commands | `src/commands/gatekeeper.js`, `src/commands/state-integrity-check.js`, `src/commands/handoff-bundle.js`, `src/commands/reentry-check.js`, `src/commands/system-check.js`, `src/commands/system-summary.js` | Process and integrity workflow commands. |
| Process libs | `src/lib/gatekeeper*.js`, `src/lib/stateIntegrityCheck.js`, `src/lib/portableScaffold.js`, `src/lib/fs.js` where it targets `.consync/state` or `sandbox/current` | Development/process support. |
| Utility scripts | `scripts/check-handoff-contract.js`, `scripts/playwright-electron-main.cjs` | Verification and test support. |
| Existing process docs | `README.md`, `AGENTS.md`, `.consync/docs/**` | Repo/process guidance, not app runtime content. |

## 3. Tests / Sandbox / Dev-Only Support

These files are required for development verification, but should not ship in a
shared/user-facing app bundle.

| Area | Current location | Notes |
| --- | --- | --- |
| Unit/integration tests | `src/test/*.js`, `src/test/*.jsx` | Includes CLI, session, renderer slices, gatekeeper, handoff, and state integrity checks. |
| E2E tests | `src/test/e2e/*.spec.js` | Playwright coverage for desktop behavior. |
| Test config | `playwright.config.js` | Required for local e2e only. |
| Sandbox fixtures | `sandbox/fixtures/**` | Development fixture data for scan/search/proposal behavior. |
| Sandbox expectations | `sandbox/expectations/**` | Verification snapshots for sandbox commands. |
| Sandbox probes | `sandbox/probes/**` | Experimental/dev probes. |
| Test outputs | `test-results/`, Playwright artifacts | Generated verification output; never app content. |
| Build intermediates | `.vite/`, `src/electron/renderer/.vite/` | Generated build output. Only the final packaged runtime output should ship. |

## 4. Build Artifacts / Dependencies

Build/dependency surfaces should be handled deliberately:

| Area | Current location | Ship? |
| --- | --- | --- |
| npm lockfile | `package-lock.json` | Source repo yes; user app bundle no. |
| installed dependencies | `node_modules/` | Source checkout yes; packaged app should contain only what Forge/Electron requires. |
| Vite output | `.vite/**` | Packaged app yes, but only complete runtime output. |
| Renderer Vite output | `src/electron/renderer/.vite/**` | Build artifact caused by current renderer config; should not be a separate source-controlled or leaked dev tree. |
| Electron package output | `out/**` | Generated artifact; distributable output may be shared, but not committed as source. |
| Electron asar | `out/consync-core-darwin-x64/consync-core.app/Contents/Resources/app.asar` | Current inspected package contains only root `.vite/build` and `package.json`; renderer artifact is missing. |

## Runtime Required Files

For local development with source:

```text
package.json
package-lock.json
forge.config.js
vite.main.config.mjs
vite.preload.config.mjs
vite.renderer.config.mjs
src/electron/main/**
src/electron/preload/**
src/electron/shared/**
src/electron/renderer/**
src/core/desktop-shell.js
src/core/session.js
src/lib/sandbox-anchors.js
```

For the packaged Electron app:

```text
package.json
.vite/build/index.js
.vite/build/preload.js
.vite/renderer/main_window/index.html
.vite/renderer/main_window/assets/**
Electron runtime resources generated by Forge
```

Resolved package gap: `.vite/renderer/main_window/**` is required by
`.vite/build/index.js` and is now present in the inspected `app.asar` after the
renderer output path fix.

Runtime data should be app-owned or user-selected. The repo-local
`sandbox/current` and `sandbox/fixtures/**` paths are development defaults, not a
clean shareable-app requirement.

## Development-Only Files

Required only for development, verification, or Consync process operation:

```text
.consync/**
.github/**
AGENTS.md
README.md
scripts/**
src/index.js
src/cli/**
src/commands/**
src/lib/gatekeeper*.js
src/lib/stateIntegrityCheck.js
src/lib/portableScaffold.js
src/test/**
playwright.config.js
sandbox/**
test-results/**
node_modules/**
package-lock.json
```

Some `src/commands/**` and `src/lib/**` files may become product CLI/runtime
surfaces later, but they are not required for the current Electron package.

## Should Not Ship

These should never appear in a shared/user-facing app bundle unless a future
product decision explicitly turns a narrow subset into public user content:

```text
.consync/state/**
.consync/streams/**
.consync/packets/**
.consync/prompts/**
.consync/agents/**
.consync/skills/**
.consync/docs/**
.consync/artifacts/**
.github/**
AGENTS.md
scripts/**
src/test/**
playwright.config.js
sandbox/fixtures/**
sandbox/expectations/**
sandbox/probes/**
test-results/**
source maps or raw source files exposing process internals
```

The strongest rule is that live Consync process state and governance surfaces
must not ship: `.consync/state/**`, `.consync/streams/**`, packets, prompts,
agent definitions, skills, and internal docs are repo/operator context, not user
runtime content.

## `.consync/` Runtime Decision

`.consync/` is not needed for the current Electron app runtime.

Observed Electron runtime imports do not read `.consync/` directly. The desktop
runtime reads sandbox session/search data through `src/core/session.js`,
`src/core/desktop-shell.js`, and `src/lib/sandbox-anchors.js`. `.consync/` is
needed for development/process workflows: state preflight/postflight,
gatekeeper, handoff bundle, portable template scaffolding, agent guidance, docs,
streams, prompts, and skills.

Conclusion: `.consync/` should stay out of shareable/user-facing app bundles.

## Current Package Inclusion

Inspection command:

```text
npm run package:desktop
node -e "const asar=require('@electron/asar'); ..."
```

Observed package:

```text
out/consync-core-darwin-x64/consync-core.app/Contents/Resources/app.asar
```

Initial observed `app.asar` contents before the renderer output path fix:

```text
.vite
.vite/build
.vite/build/index.js
.vite/build/preload.js
package.json
```

Inclusion answers:

| Path | Included in current inspected `app.asar`? | Notes |
| --- | --- | --- |
| `.consync/` | No | Excluded by Forge Vite plugin ignore behavior. |
| `.github/` | No | Excluded. |
| `sandbox/` | No | Excluded. |
| docs / `README.md` / `AGENTS.md` | No | Excluded. |
| `src/` | No | Excluded as raw source. Bundled main/preload code contains compiled portions of runtime imports. |
| root `.vite/build/**` | Yes | Main and preload bundles. |
| renderer artifact | Yes after fix | Now generated under root `.vite/renderer/main_window/**` and included in `app.asar`. |

## Smallest Next Step

The smallest next step toward a clean shareable build was to fix the renderer
build output boundary so the packaged app contains
`.vite/renderer/main_window/index.html` and its assets at the path the packaged
main process loads. That step has been completed.

Keep that next step narrow:

1. Adjust only the renderer build output/package boundary.
2. Re-run `npm run package:desktop`.
3. Inspect `app.asar` again and confirm it contains root `.vite/build/**`, root
   `.vite/renderer/main_window/**`, and `package.json`, while still excluding
   `.consync/`, `.github/`, `sandbox/`, tests, docs, and raw source.
4. Defer replacing `sandbox/current` and `sandbox/fixtures/**` runtime defaults
   until after the packaged renderer artifact is present.

## Verification Evidence

Commands run during this inspection:

```text
npm run check:state-preflight
npm run package:desktop
npm run verify
npm run check:state-postflight
```

Results:

- `npm run check:state-preflight`: PASS.
- First `npm run package:desktop`: failed on network access while resolving
  `github.com`.
- Re-run `npm run package:desktop` with network permission: PASS.
- `npm run verify`: PASS.
- `npm run check:state-postflight`: PASS.
