# SDC — Add ScaffoldAI Intake Inbox and Intake Artifact Cleanup

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI intake/runtime housekeeping boundary

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Add a dedicated ScaffoldAI intake inbox flow and cleanup handling for transient intake artifacts so packet intake no longer depends on arbitrary repo-root SDC files or manual intake cleanup.

BACKGROUND:
Current packet intake accepts arbitrary local file paths and leaves transient intake artifacts behind after successful intake/activation.

Current transient intake artifacts include:
- local candidate `.sdc.md` files
- `.scaffoldai/runtime/packet-intake/latest-intake.json`

The accepted normalized packet already persists safely in:
- `.scaffoldai/packets/`

The next hardening step is:
- introducing a dedicated intake inbox
- formalizing intake artifact cleanup
- separating transient intake artifacts from authoritative packet state

TASKS:
1. Add ScaffoldAI inbox structure.

Create:
- `.scaffoldai/inbox/`
- `.scaffoldai/inbox/README.md`

Document:
- inbox purpose
- candidate packet lifecycle
- intake flow
- accepted packet flow
- cleanup expectations

2. Update packet intake flow.

Preferred intake path:
- `.scaffoldai/inbox/*.sdc.md`

Behavior:
- intake should warn when packet source is outside inbox
- optionally support future strict mode requiring inbox-only intake
- accepted packets continue normalizing into `.scaffoldai/packets/`

Do not:
- mutate accepted packet semantics
- auto-delete accepted packets

3. Add intake artifact cleanup handling.

Add housekeeping support for:
- `.scaffoldai/runtime/packet-intake/latest-intake.json`
- local inbox candidate packet cleanup

Suggested commands:
- `scaffoldai housekeeping clean-intake-artifacts`
- or integrate into existing housekeeping/runtime cleanup flow

Behavior:
- remove/reset transient intake metadata
- optionally archive or remove consumed inbox packet candidates
- preserve accepted packet copies
- preserve append-only logs/history

4. Cleanup policy.

Transient:
- inbox candidate files
- latest intake metadata
- temporary intake reports

Durable:
- accepted packets
- contracts
- append-only runtime logs
- completion history/signals

5. Add safety behavior.

Do not:
- remove accepted packets
- remove append-only logs
- remove runtime audit history
- auto-clean without explicit housekeeping call
- auto-delete arbitrary external files

6. Update docs/contracts.

Clarify:
- inbox lifecycle
- intake lifecycle
- accepted packet durability
- transient vs durable artifacts
- housekeeping semantics

7. Add tests.

Include:
- inbox path intake accepted
- external path intake warning behavior
- intake metadata cleanup
- consumed inbox cleanup behavior
- accepted packet preserved
- append-only logs preserved
- housekeeping remains bounded
- verify remains green

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. inbox structure
3. intake path behavior
4. cleanup behavior
5. transient vs durable policy
6. verification result
7. confirmation accepted packets/logs are preserved

CONSTRAINTS:
- no MCP write authority
- no autonomous cleanup
- no deletion of accepted packets
- no deletion of append-only logs
- no arbitrary filesystem cleanup
- no automatic packet activation
- no Consync runtime/product changes
- no commits
