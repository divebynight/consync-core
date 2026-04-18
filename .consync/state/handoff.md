TYPE: PROCESS
PACKAGE: define_stream_and_legacy_state_interaction

STATUS

PASS

SUMMARY

Created one small process-facing bridge reference under `.consync/docs/` that defines how the new stream structure interacts with the existing `.consync/state/` live loop.

The new doc states that `.consync/state/next-action.md` and `handoff.md` remain the active execution surface for now, explains that the foreground stream drives what appears there through `.consync/orchestration/active_foreground_stream.txt`, and clarifies that per-stream state is durable pause-and-resume context rather than a competing active source of truth. Supporting updates were kept light: one bridge pointer from the stream operating model doc and one current-system pointer.

No migration, orchestration code, or second execution loop was introduced.

FILES CREATED

- `.consync/docs/stream-and-state-interaction.md` — defines how the global live loop and per-stream state interact during the current hybrid phase.

FILES MODIFIED

- `.consync/docs/stream-operating-model.md` — adds a short bridge reference to the live-loop interaction doc.
- `.consync/docs/current-system.md` — adds a short pointer to the stream-and-live-loop interaction doc.
- `.consync/state/handoff.md` — records this package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-and-state-interaction.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,100p' .consync/docs/stream-operating-model.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,120p' .consync/docs/current-system.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-and-state-interaction.md` and confirm the doc exists.
2. Confirm the doc clearly states that `.consync/state/next-action.md` and `handoff.md` remain the active execution surface for now.
3. Confirm it explains that `.consync/orchestration/active_foreground_stream.txt` identifies the foreground stream and that the live loop should reflect that stream's work.
4. Confirm it explains that per-stream state is for durable pause, resume, and recovery, not a second active source of truth.
5. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,100p' .consync/docs/stream-operating-model.md` and confirm the new bridge pointer appears near the top.
6. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,120p' .consync/docs/current-system.md` and confirm the bridge reference appears in the state-and-artifacts section.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the success case: one new bridge doc, two light supporting doc updates, and the updated handoff. If additional unrelated changes appear beyond the already-live `next-action.md`, treat that as a failure case for clean package scope and inspect before advancing.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated test or runtime command was appropriate for this doc-only process package.
- Confirmed the new doc sits cleanly beside the other stream references under `.consync/docs/` and remains easy to find.
- Validated that the new doc names `.consync/state/next-action.md` and `handoff.md` as the active live loop, names `.consync/orchestration/active_foreground_stream.txt` as the foreground-stream selector, and defines per-stream state as pause-and-resume context rather than an active competing surface.
- Validated the transition model stays explicitly hybrid and does not force migration or introduce a second execution loop.

NOTES

- The document is intentionally small and process-facing; it does not introduce migration machinery, orchestration code, or a redesigned execution model.
- The main caution in this package was to avoid duplicated active state: the live loop remains global for execution, while stream-local state remains the durable recovery surface.