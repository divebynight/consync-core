# ScaffoldAI Intake Inbox

Purpose:
- `.scaffoldai/inbox/` is the preferred landing zone for candidate packet files before formal intake.
- Intake candidates are transient artifacts, not authoritative process state.

Lifecycle:
1. A candidate packet is placed in `.scaffoldai/inbox/*.sdc.md`.
2. `scaffoldai packet intake <path>` validates strict SDC structure and policy constraints.
3. On acceptance, the normalized durable packet is written to `.scaffoldai/packets/`.
4. Optional housekeeping can clear intake metadata and consumed inbox candidates.

Accepted Packet Flow:
- Accepted packet files in `.scaffoldai/packets/` are durable process artifacts.
- Intake cleanup must never delete accepted packet copies.
- Intake does not imply activation or execution approval.

Cleanup Expectations:
- Transient intake artifacts:
  - `.scaffoldai/runtime/packet-intake/latest-intake.json`
  - consumed inbox candidate packet files
- Cleanup entrypoint:
  - `scaffoldai housekeeping clean-intake-artifacts`
- Cleanup is explicit only (never automatic), bounded to known ScaffoldAI surfaces, and must preserve append-only logs/history.
