TYPE: PROCESS
PACKAGE: define_stream_switch_and_active_owner_rules

STATUS

PASS

SUMMARY

Defined a lightweight stream-switch model that makes one active stream explicit, keeps `next-action.md` and `handoff.md` singular, and avoids a heavier stream-state hierarchy.

The new rule doc defines four stream statuses, a single live-loop owner rule, the minimum information that belongs in one shared `active-stream.md` state file, and a simple switch ritual for pausing one stream and mounting another into the live loop. The current state surface was also aligned so a human can now tell in one glance that `process` owns the live loop and `electron_ui` is paused.

STREAM STATUS MODEL

- `ACTIVE` — the stream currently owns the live loop
- `PAUSED` — the stream stopped at a clean point and can resume later
- `SUPPORTING` — the stream is not the live owner, but it is supplying context or adjacent work
- `BLOCKED` — the stream cannot continue until a named blocker is resolved

ACTIVE OWNER RULE

- only one stream may own `.consync/state/next-action.md` and `.consync/state/handoff.md` at a time
- the live owner is recorded in `.consync/state/active-stream.md`
- `active-stream.md` records active stream, previous stream, switch reason, paused streams, supporting streams, and the live owner note
- per-stream durable files remain for recovery context, but they do not compete with the global live slots

STREAM SWITCH RITUAL

- close or pause the current stream cleanly
- mark the previous stream `PAUSED`, `SUPPORTING`, or `BLOCKED`
- update `.consync/state/active-stream.md` with active stream, previous stream, and switch reason
- mount the new active stream into `next-action.md`
- keep `handoff.md` aligned with the active stream's latest closeout

FILES CREATED

- `.consync/docs/stream-switch-and-active-owner-rules.md` — defines the minimal status model, live ownership rule, durable stream ownership, and stream-switch ritual.
- `.consync/state/active-stream.md` — records the current active stream, previous stream, switch reason, paused/supporting streams, and the live owner note for the global loop.

FILES MODIFIED

- `.consync/docs/current-system.md` — adds light pointers to the new stream-switch rules doc and the new active-stream live state file.
- `.consync/orchestration/active_foreground_stream.txt` — aligns the foreground stream marker with the current live-loop owner.
- `.consync/streams/electron_ui/stream.md` — marks `electron_ui` paused while process packages own the live loop.
- `.consync/streams/process/stream.md` — marks `process` active as the current live-loop owner.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Open `.consync/state/active-stream.md` and confirm a human can tell immediately that `process` is active, `electron_ui` is paused, and the live loop owner is singular.
2. Open `.consync/docs/stream-switch-and-active-owner-rules.md` and confirm it defines only the four requested statuses: `ACTIVE`, `PAUSED`, `SUPPORTING`, and `BLOCKED`.
3. Confirm the doc explicitly states that only one stream may own `.consync/state/next-action.md` and `.consync/state/handoff.md` at a time.
4. Confirm the switch ritual is lightweight and does not add per-stream live-loop duplication or automation.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the change stayed limited to one new rules doc, one new live state doc, small alignment edits, and the live handoff. If multiple files still disagree about which stream is active, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based.
- Confirmed the new `active-stream.md` gives a one-glance answer for the active stream, previous stream, paused streams, and live-loop ownership.
- Confirmed the live ownership rule stays singular: `next-action.md` and `handoff.md` are still global slots, and the new model only names one owner at a time.
- Ran `git status --short` and observed the expected surface: the new stream-switch rules doc, the new active-stream state file, small alignment edits to the current stream indicators, the live handoff, and the already-live `next-action.md`.
- Confirmed scope stayed lightweight: one new rules doc, one new live state doc, and small alignment edits to existing stream indicators without creating a larger state hierarchy.

NEXT RECOMMENDED PACKAGE

- Add one small process package that defines how a paused stream should record its return conditions or resume note without creating a second live loop.