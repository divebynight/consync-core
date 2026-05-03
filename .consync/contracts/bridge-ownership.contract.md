# Bridge Ownership Contract

## Purpose

Define a provisional ownership boundary between Consync, ScaffoldAI, and the
Bridge control surface before any structural split.

This contract does not move, rename, or restructure files.

Related target separation note:
`.consync/contracts/scaffoldai-consync-separation.contract.md`

## Layers

- `CONSYNC` = product/runtime.
- `SCAFFOLDAI` = process/harness.
- `BRIDGE` = shared control surface between Consync, ScaffoldAI, and
  human/AI execution state.

## Bridge Owns

- `.consync/state/**`
- `.consync/streams/**`
- Verification and control expectations that connect process and runtime
- Gatekeeper, dry-run, and state-integrity behavior
- Handoff and snapshot surfaces

## Consync Owns

- Product/runtime app code
- Electron UI
- Product CLI behavior
- Sandbox/product fixtures
- Runtime/product tests

## ScaffoldAI Owns

- Agents
- Skills
- Prompts
- Templates
- Process docs
- Packet workflow docs
- Tool adapter guidance

## Boundary Rules

- ScaffoldAI should interact with Consync through Bridge contracts and state,
  not by depending directly on arbitrary product internals.
- Consync runtime should not depend on ScaffoldAI planning or process docs.
- Bridge must stay thin and must not become a planning or idea dump.

## Status

- Provisional contract.
- No files are moved or renamed by this contract.
- Future structural splits must update references and pass verify.
