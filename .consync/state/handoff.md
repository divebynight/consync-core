TYPE: PROCESS
PACKAGE: define_stream_lifecycle_and_promotion

STATUS

PASS

SUMMARY

Created one small process-facing lifecycle and promotion reference under `.consync/docs/`.

The new doc defines when an idea becomes a real stream, when extra structure is earned, how the current status vocabulary works over time, how low-gravity streams should be reviewed, and how Consync prefers recognizable patterns across scales. Supporting updates were kept light: one companion pointer from the operating-model doc and one current-system pointer.

Legacy `.consync/state/` remains the live loop, and no new streams, orchestration behavior, or archival framework was added.

FILES CREATED

- `.consync/docs/stream-lifecycle-and-promotion.md` — defines when streams become real, how they earn more structure, how statuses are used over time, and how low-gravity streams should be reviewed.

FILES MODIFIED

- `.consync/docs/stream-operating-model.md` — adds a short companion reference to the lifecycle and promotion doc.
- `.consync/docs/current-system.md` — adds a short pointer to the lifecycle and promotion doc in the state-and-artifacts section.
- `.consync/state/handoff.md` — records this package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-lifecycle-and-promotion.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,80p' .consync/docs/stream-operating-model.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,120p' .consync/docs/current-system.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-lifecycle-and-promotion.md` and confirm the doc exists.
2. Confirm it covers all five required areas: promotion rule, earned structure rule, lifecycle states in practice, low-gravity or decay handling, and consistency across scales.
3. Confirm the doc stays short and practical rather than expanding into an archival or orchestration framework.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,80p' .consync/docs/stream-operating-model.md` and confirm the companion pointer appears near the top.
5. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,120p' .consync/docs/current-system.md` and confirm the new lifecycle reference appears in the state-and-artifacts section.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the success case: one new lifecycle doc, two light supporting doc updates, and the updated handoff. If unrelated files appear beyond the already-live `next-action.md`, treat that as a failure case for clean package scope and inspect before advancing.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated test or runtime command was appropriate for this doc-only process package.
- Confirmed the new doc sits cleanly beside the stream operating model and remains easy to find under `.consync/docs/`.
- Validated that the new doc covers promotion, earned structure, practical lifecycle use of all six statuses, low-gravity review handling, and repeating patterns across scales.
- Validated that the supporting updates remain light and do not add new stream mechanics or rewrite the legacy live loop.

NOTES

- The document is intentionally small and process-facing; it does not introduce decay automation, archival machinery, or orchestrator behavior.
- Legacy `.consync/state/` remains the authoritative live loop for now, so this package only clarifies stream lifecycle behavior instead of migrating the full process system.