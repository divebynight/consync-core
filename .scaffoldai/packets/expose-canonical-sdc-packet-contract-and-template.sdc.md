# SDC — Expose Canonical SDC Packet Contract And Template

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI packet intake validation, packet authoring ergonomics, packet schema exposure, validator guidance, and local contract/template tooling

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Reduce friction in creating valid SDC packets by exposing the canonical packet contract and providing reusable compliant templates/examples for humans and agents.

The goal is to make packet generation deterministic without weakening validation strictness, lifecycle semantics, or authority boundaries.

BACKGROUND:
ScaffoldAI currently enforces strict packet intake validation including:
- canonical title formatting
- required section enforcement
- policy validation
- authority boundary enforcement
- lifecycle safety constraints

Recent operational testing demonstrated:
- the validator correctly rejects malformed packets
- packet structure expectations are stricter than currently documented
- humans and agents currently rely on implicit schema knowledge
- packet authoring friction is now one of the highest operational pain points

The system now needs:
- explicit packet contract exposure
- reusable canonical examples
- reusable canonical templates
- clearer validator recovery guidance
- deterministic packet-generation semantics

TASKS:
1. Inventory current SDC validation behavior.

Document:
- required packet sections
- required title formatting
- expected section ordering
- required formatting syntax
- approval block expectations
- allowed MODE values
- policy rejection behavior
- forbidden authority escalation patterns

Include both:
- structural validation behavior
- policy validation behavior

2. Define canonical SDC packet structure.

Produce a deterministic packet structure specification covering:
- title syntax
- section syntax
- formatting conventions
- canonical ordering
- approval block formatting
- task formatting expectations
- verify/output formatting expectations
- constraint formatting expectations

3. Create canonical reusable packet template.

Add a reusable SDC template that:
- passes validation unchanged
- includes placeholder guidance
- demonstrates canonical formatting
- avoids ambiguous wording
- reflects current authority boundaries

Suggested locations:
- `.scaffoldai/contracts/`
- `.scaffoldai/examples/`
- `.scaffoldai/process/`
- `.scaffoldai/templates/`

4. Preserve valid packet examples.

Establish a durable location for:
- valid historical packets
- passing packet examples
- reference packet patterns

Clarify distinction between:
- templates
- examples
- active packets
- archived packets
- inbox candidates

5. Improve validator guidance where appropriate.

Review validator output and improve:
- missing-section guidance
- formatting guidance
- policy violation explanations
- next-safe-action guidance
- recovery ergonomics

Do not weaken enforcement behavior.

6. Add validation coverage.

Add or extend tests covering:
- canonical valid packet acceptance
- invalid title rejection
- missing-section rejection
- malformed approval block rejection
- invalid MODE rejection
- forbidden authority escalation rejection
- malformed formatting rejection

Ensure:
- deterministic validation behavior
- stable diagnostics
- readable recovery guidance

7. Documentation updates.

Document:
- canonical packet lifecycle
- inbox vs packets vs archive semantics
- packet template usage
- packet example usage
- packet validation expectations

8. Recommend follow-up packets.

Recommend likely next packets including:
- repo structure inventory + lifecycle state-machine test plan
- lifecycle transition-table implementation
- exhaustive negative lifecycle testing
- randomized/property-based lifecycle testing
- MCP candidate SDC inbox submission tooling

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. canonical packet contract summary
3. canonical template location
4. canonical example location
5. validator guidance improvements
6. validation coverage added
7. packet lifecycle/archive recommendations
8. verification result

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- no weakening validator strictness
- no bypassing intake validation
- no authority-boundary relaxation
- no Consync product/runtime modification
- no broad repository reorganization
- human-controlled commits only
