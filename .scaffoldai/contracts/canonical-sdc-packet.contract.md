# Canonical SDC Packet Contract

Status: ACTIVE CONTRACT

Purpose:
- expose the current strict SDC intake contract in one durable location
- document the canonical packet shape used by `scaffoldai packet intake`
- reduce packet-authoring drift without weakening validation strictness

Canonical baseline:
- use `.scaffoldai/examples/canonical-sdc-packet-example.sdc.md` as the passing example
- use `.scaffoldai/templates/canonical-sdc-packet-template.sdc.md` as the reusable authoring template
- both reflect the current validator implementation in `src/lib/scaffoldaiPacketIntake.auth.scaffoldai.js`

Required title syntax:
- first non-empty line must be `# SDC — <Title>`

Required section order:
1. `MODE:`
2. `EXECUTION SURFACE:`
3. `APPROVAL:`
4. `GOAL:`
5. `TASKS:`
6. `VERIFY:`
7. `OUTPUT:`
8. `CONSTRAINTS:`

Formatting rules:
- section headers must end with `:` exactly
- section headers must appear in canonical order
- `APPROVAL:` entries must be indented by at least two spaces
- `APPROVAL:` must include both `execute` and `commit`
- approval values must be one of `PENDING`, `APPROVED`, `DENIED`
- `MODE:` must be one of:
  - `PROCESS_REFACTOR`
  - `PROCESS_VALIDATION`
  - `PROCESS_DOCUMENTATION`
  - `CONTRACT_REFACTOR`
  - `PLANNING`

Structural validation behavior:
- malformed title is rejected
- missing required sections are rejected
- out-of-order sections are rejected
- malformed approval block entries are rejected
- unknown or blocked MODE values are rejected

Policy validation behavior:
- requests for autonomous execution are rejected
- requests for MCP write authority are rejected
- requests for automatic commits are rejected
- negated constraint lines are not treated as escalation requests

Recovery ergonomics:
- validator responses should include stable recovery hints
- preferred recovery path is to copy the canonical template/example and edit content conservatively
- next safe action remains local CLI intake rerun after repair

Packet lifecycle semantics:
- `.scaffoldai/inbox/*.sdc.md` contains transient intake candidates only
- accepted packets are normalized into `.scaffoldai/packets/*.sdc.md`
- `.scaffoldai/packets/` is the durable accepted/retained packet surface; active vs inactive state is tracked in `.scaffoldai/state/`, not by packet location alone
- reusable examples belong in `.scaffoldai/examples/`
- reusable blank-safe authoring templates belong in `.scaffoldai/templates/`
- runtime cleanup must never delete accepted packets

Archive recommendation:
- keep canonical examples out of `.scaffoldai/packets/` so examples remain stable references rather than live accepted artifacts
- treat timestamped historical packet records in `.scaffoldai/packets/` as local retained archive material when present
