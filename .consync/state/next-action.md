TYPE: PROCESS
PACKAGE: define_next_action_handoff_automation_contract

GOAL

Define a minimal, explicit automation contract for the `next-action` ↔ `handoff` loop so future tooling can generate, validate, and advance package work with less manual copy/paste and less risk of drift.

WHY

The current loop is working well in practice:

- ChatGPT generates an SDC for `next-action`
- the package is run through the existing prompt/process
- a structured handoff is written
- the handoff is returned for review
- the next package is selected and written back into `next-action`

This pattern is now stable enough to formalize. Before building any helper script, agent skill, or MCP-facing tool, we should define the smallest machine-readable contract that preserves the current workflow and judgment points.

DO

1. Audit the current `next-action` and `handoff` loop as it exists in the repo/process docs and identify:
   - which fields are required in a valid `next-action` package
   - which fields are required in a valid handoff
   - which parts are deterministic
   - which parts still require human or model judgment

2. Write a small contract document that defines:
   - required structure for `next-action`
   - required structure for handoff
   - minimum pass/fail criteria for a valid package closeout
   - where the “next recommended package” belongs
   - what an automation helper is allowed to do vs not do

3. Keep the contract lightweight and aligned to the current working loop. Do not redesign the whole process or introduce a larger agent framework in this package.

4. Add one small validation surface if appropriate. Examples:
   - a simple script stub
   - a format checker
   - a documented checklist
   But only if it directly supports the contract and stays small.

5. Record open follow-up packages needed for actual automation, such as:
   - validate handoff structure automatically
   - generate draft next-action from latest handoff
   - support stream-aware package advancement

CONSTRAINTS

- Do not build full automation in this package.
- Do not change the current working package loop unless necessary for clarity.
- Prefer explicit contract definition over speculative architecture.
- Keep this process-facing and portable across streams.

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- CURRENT LOOP AUDIT
- CONTRACT DECISIONS
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum:
- confirm the contract document matches the current real loop
- confirm any added validation surface runs successfully if one is added
- confirm no existing process docs were accidentally broadened or contradicted