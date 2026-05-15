# SDC — Canonical SDC Packet Example

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI packet intake validation and local process tooling

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Expose the canonical passing SDC packet shape used by strict intake validation.

TASKS:
1. Document the packet contract.
2. Provide a reusable passing example.
3. Preserve strict validator enforcement.

VERIFY:
Run:
- npm run verify:scaffoldai

OUTPUT:
1. files changed
2. contract summary
3. template/example locations
4. verification result

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- no weakening validator strictness
- human-controlled commits only
