TYPE: DOCS
PACKAGE: formalize_context_anchor_architecture

STATUS

PASS

SUMMARY

Updated the active orientation docs so they now describe Consync as a sparse local context-anchor system rather than a full filesystem mirror.

The repo overview, current-direction notes, active-work summary, current-system guide, and live re-entry docs now align on the same baseline: sessions are the primary captured unit, local `.consync` anchors hold durable local context truth where they exist, selective capture is the default scope, broader discovery can scan nested anchors without making search hits durable links, and `sandbox/current` is only a development harness.

No dedicated architecture note was added because the existing active docs were the cleaner place to capture this direction.

FILES CREATED

- `.consync/state/history/plans/docs-20260416-formalize-context-anchor-architecture.md` — preserved the executed docs instruction before restoring the live `next-action.md` slot to the next planned package.

FILES MODIFIED

- `README.md` — reframed the repo overview around context capture, sparse local anchors, selective scope, and the real saved-session bookmark loop.
- `.consync/artifacts/01_current-direction.md` — clarified the stable architecture direction around sessions, sparse anchors, selective capture, discovery, and the `sandbox/current` harness boundary.
- `.consync/artifacts/02_active-work.md` — replaced stale packet wording with near-term work aligned to anchor architecture and mock-session trial readiness.
- `.consync/docs/current-system.md` — documented what Consync is and is not, made sessions and local anchors explicit, and clarified discovery vs durable links.
- `.consync/state/decisions.md` — added the core anchor/session architecture decisions to the live re-entry decision set.
- `.consync/state/package_plan.md` — recorded this docs package in the active sequence and advanced the next package pointer back to the mock-session trial.
- `.consync/state/snapshot.md` — updated the re-entry summary so the current architecture direction is visible without reading scattered docs first.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this docs package.

KEY DOCUMENTED DECISIONS

- Consync is a context and re-entry layer over creative work, not a full mirror of filesystem truth.
- Session is the primary unit of captured context; folder context matters, but folder != session.
- Local `.consync` anchors are durable local truth only where meaningful persistence exists, and they should stay sparse and intentional.
- Active scope is selective by default: interacted-with or bookmarked artifacts matter first, while ambient nearby files stay background.
- Parent or higher-level context may link child contexts later, but search/discovery hits are provisional until linked deliberately.
- `sandbox/current` is a development harness for current artifact flow and verification, not the final storage ontology.
- Rebuildable indexes/caches and gravity/decay ideas remain future-layer concepts rather than foundation behavior.

OPEN QUESTIONS / DEFERRED DETAILS

- How higher-level linking should be represented once multiple local anchors need durable relationships.
- Whether a rebuildable discovery cache is useful enough to justify itself once nested-anchor scanning is exercised on real folders.
- How far selective capture should widen by default beyond explicit bookmarking or deliberate user inclusion.
- What the first concrete mock-session blocker will reveal about the current desktop shell.

COMMANDS RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Review `README.md`, `.consync/artifacts/01_current-direction.md`, and `.consync/docs/current-system.md` and confirm they all describe Consync as a context layer rather than a filesystem mirror.
3. Confirm the docs consistently state that sessions are primary, local `.consync` anchors are sparse durable truth, and `sandbox/current` is only a development harness.
4. Confirm the docs do not imply that every folder needs a `.consync` directory or that search hits automatically become durable links.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected docs and state files.
6. Failure case: if any updated doc still implies full filesystem tracking, root-level permanence, or automatic durable linking from discovery alone, the package is incomplete.
7. Failure case: if the edits read like a full technical spec with invented implementation details, the package is too broad.

VERIFICATION NOTES

- Reviewed the active orientation docs together and aligned the shared terminology around context capture, local anchors, sessions, selective scope, discovery, and the `sandbox/current` harness boundary.
- Actually tested `cd /Users/markhughes/Projects/consync-core && npm run verify` and `cd /Users/markhughes/Projects/consync-core && git status --short` after the doc updates.
- Observed outcome: `npm run verify` passed, and the repo state showed only the expected docs, state-file, and archived-instruction changes.
- Validated the important edge cases that the updated docs do not imply automatic `.consync` placement everywhere, do not describe discovery hits as durable links, and do not describe `sandbox/current` as the long-term ontology.