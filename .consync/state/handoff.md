TYPE: PROCESS
PACKAGE: define_stream_operating_model

STATUS

PASS

SUMMARY

Created one small process-facing stream operating model reference under `.consync/docs/`.

The new doc defines the tiny stream core, the current status vocabulary, the pause-safe rule, and the current one-foreground-stream policy with a short future-friendly note about possible parallel work later. Supporting updates were kept light: one pointer in the current-system doc and one pointer in the stream index.

Legacy `.consync/state/` remains the live loop, and no orchestration code, new streams, or heavy framework material was added.

FILES CREATED

- `.consync/docs/stream-operating-model.md` — defines the current minimal stream structure, status meanings, pause-safe rule, and foreground-stream policy.

FILES MODIFIED

- `.consync/docs/current-system.md` — adds a short pointer to the new stream doc and notes where stream orchestration state now lives.
- `.consync/orchestration/stream_index.md` — adds a short reference to the operating-model doc near the stream list.
- `.consync/state/handoff.md` — records this package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-operating-model.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,120p' .consync/docs/current-system.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,80p' .consync/orchestration/stream_index.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-operating-model.md` and confirm the doc exists.
2. Confirm that the doc covers all four required areas: tiny stream core, status vocabulary, pause-safe rule, and foreground rule with a short future-friendly note.
3. Confirm the doc stays small and practical rather than expanding into a framework or implementation plan.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,120p' .consync/docs/current-system.md` and confirm the new reference appears in the state-and-artifacts section.
5. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,80p' .consync/orchestration/stream_index.md` and confirm the stream list now points to the operating-model doc.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the expected success case: one new doc plus only the two light pointer updates and the updated handoff. If additional unrelated files appear, treat that as a failure case for this package's repo-scope cleanliness and inspect before advancing.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated test or runtime command was appropriate for this doc-only process package.
- Confirmed the chosen location fits the existing `.consync/docs/` process surface and keeps the operating model easy to find.
- Validated the new doc includes the required tiny-core list, all six statuses, the pause-safe recovery test, and the one-foreground-stream rule.
- Validated the supporting updates remain light and do not migrate or rewrite the legacy live loop.

NOTES

- The document is intentionally small and process-facing; it does not introduce orchestration behavior, agent logic, or concurrency control.
- Legacy `.consync/state/` remains the authoritative live loop for now, so this package only clarifies the new stream model instead of migrating the whole process system.