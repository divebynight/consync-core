# SDC — Plan Consync Runtime Layer Diagram Function Reorg

MODE: PLANNING

EXECUTION SURFACE:
consync-core architecture docs, diagram source, and refactor planning notes.

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Create a diagram-first plan for reorganizing Consync runtime functions and modules around explicit product-layer ownership.

TASKS:
1. Inspect current Consync runtime/module layout.
2. Define the canonical runtime layer diagram.
3. Map existing functions/modules into these layers:
   - Observation
   - Analysis
   - Interpretation
   - Action
   - Bridge / Adapter surfaces
4. Identify misplaced or mixed-responsibility functions/modules.
5. Document allowed dependency directions.
6. Separate orchestration concerns from product/domain logic in the proposed map.
7. Produce a concrete follow-up refactor target list.

VERIFY:
Review the diagram and module/function map for consistency with the repository layout. Run lint/typecheck or relevant tests only if touched files require it.

OUTPUT:
- canonical runtime layer diagram or diagram source
- module/function ownership map
- misplaced or mixed-responsibility list
- dependency-direction notes
- follow-up refactor targets

CONSTRAINTS:
- Keep ScaffoldAI and Consync responsibilities separate.
- Keep this packet focused on planning, not implementation.
- Preserve local lifecycle and git ownership.
- Prefer fail-closed behavior.
- Do not mix process hardening with product reorg work.
