# Cold Start Context Recovery Test Reference v0

Status: first-pass reference
Role: supporting discoverability pressure-test reference
Scope: simulated cold-start and context-loss recovery observations only

---

## 1. Purpose

Cold-start and context-loss testing matters because a process system is only as
survivable as its repo-local memory. If a human, AI client, or future maintainer
needs recent conversation history to understand the system, then the operating
model is not fully encoded in the repo.

Discoverability matters for the same reason. A stable command surface is useful
only if a cold operator can find the right command, understand what it proves,
and know when to escalate uncertainty. Authority semantics are useful only if a
reader can tell which docs are binding, which are supporting, and which are
historical.

This reference is a pressure test. It documents a realistic recovery simulation
and the assumptions it exposes. It is not proof the system is complete, and it
does not introduce automation, runtime behavior, autonomous context
reconstruction, or workflow execution.

---

## 2. Simulated Context Loss Scenario

### Initial Conditions

A hypothetical operator opens the repo with no recent conversational context.
They know only:

- this is the `consync-core` repo
- `.scaffoldai/` appears to be important
- Makefile targets exist
- there may be process state, contracts, and verification commands

They do not know:

- what ScaffoldAI is
- how ScaffoldAI differs from Consync
- which docs are authoritative
- whether MCP is active runtime behavior or a controlled access layer
- which commands are safe to run first
- whether warnings indicate failure or expected review signal
- where uncertainty should escalate

### First Entry Points Discovered

The most likely entry points are:

- `AGENTS.md`
- `.scaffoldai/README.md`
- `Makefile`
- `.scaffoldai/state/snapshot.md`
- `.scaffoldai/reference/operational-baseline-v0.reference.md`

The simulated operator starts with `AGENTS.md`, because it is the Codex entry
point and names the repo-local boundaries. It points back to `.scaffoldai/`
instead of trying to restate the whole process system.

The operator then reads `.scaffoldai/README.md`, which provides the first
complete mental model:

- ScaffoldAI is the process harness, not the Consync product.
- Humans remain final authority.
- Runtime Commands are visible local commands.
- MCP is controlled local access, not execution authority.
- Reentry starts with state files and status/question commands.

Next, the operator checks the Makefile because it is the visible command
surface. `make help` exposes ScaffoldAI, Consync, and repo-level check lanes.

Finally, the operator reads:

- `.scaffoldai/reference/operational-baseline-v0.reference.md`
- `.scaffoldai/reference/scaffoldai-flowchart-v0.reference.md`
- `.scaffoldai/contracts/gatekeeper-approval-authority-v0.contract.md`
- `.scaffoldai/reference/verification-scope-guidance-v0.reference.md`

This gives the operator a more complete map of authority, verification scope,
manual-first boundaries, and warning interpretation.

---

## 3. Rediscovery Path

### What ScaffoldAI Is

The operator can rediscover ScaffoldAI from `.scaffoldai/README.md` quickly.
The README says ScaffoldAI is the process and AI development system used to
build `consync-core`, and explicitly says it is not the Consync product.

This felt discoverable.

### What Consync Is

The distinction between ScaffoldAI and Consync is discoverable through the
README, operational baseline, and flowchart:

- ScaffoldAI is the process harness.
- Consync is the product/runtime surface.
- `.consync/` is product metadata, not process state.

This felt discoverable, though a cold reader may need to read more than one doc
before the distinction feels natural.

### What Commands Are Safe

The Makefile is the strongest command rediscovery surface. It separates:

- ScaffoldAI checks
- Consync checks
- repo-level checks
- legacy aliases

`make scaffoldai-status`, `make scaffoldai-link-audit`, and
`make scaffoldai-test` feel safe and readable for process work. `make repo-test`
is understandable as broader confidence. `make repo-full-audit` is clearly
heavier and may involve e2e/local server behavior.

This felt discoverable.

### Which Docs Are Authoritative

The operator can rediscover the authority hierarchy from the operational
baseline and flowchart:

- contracts are authoritative
- the operational baseline is the authoritative operational orientation
- process docs guide manual execution
- references support navigation and memory
- historical/archive docs preserve context
- `.github/` is adapter-only

This felt discoverable once the operator found the baseline, but the entry order
still required some inference.

### What Behaviors Are Blocked

Blocked behavior is strongly documented across the README, Gatekeeper
recommendation contract, approval/authority contract, capability taxonomy, and
flowchart. A cold operator can find repeated boundaries:

- no autonomous approval
- no automatic dispatch
- no hidden execution
- no message-triggered execution
- no background command behavior
- no MCP-as-authority model
- no verification-as-approval model

This felt discoverable and intentionally redundant in a useful way.

### How Verification Works

The operational baseline explains INFO/WARN/FAIL semantics. The verification
scope guidance explains when to use `make scaffoldai-test`, `make repo-test`,
and `make repo-full-audit`. The authority contract clarifies that verification
is evidence, not approval.

This felt discoverable after finding the verification guidance. Without that
reference, the operator would likely infer the difference from the Makefile and
baseline, but with less confidence.

### Where Uncertainty Escalates

The authority contract gives the cleanest answer: escalation means ask the
human. The README also makes human authority explicit.

This felt understandable, but a cold reader still has to infer practical
examples of escalation phrasing and when uncertainty is large enough to pause.

---

## 4. Observed Strengths

- `AGENTS.md` correctly acts as a small entry point instead of duplicating the
  process model.
- `.scaffoldai/README.md` gives a strong first mental model for ScaffoldAI,
  Consync, MCP, state, and human authority.
- The Makefile help text is highly discoverable and separates ScaffoldAI,
  Consync, repo-level, and legacy command lanes.
- The operational baseline is useful as the textual orientation layer after the
  README.
- The flowchart improves visual orientation and helps a cold reader understand
  layer relationships.
- The approval/authority contract makes recommendation, execution,
  verification, and approval separable.
- The verification scope guidance directly addresses which check surface to run
  for different confidence needs.
- Deterministic audit output remains readable because warnings and failures are
  visibly distinct.

---

## 5. Observed Discoverability Gaps / Seams

- Entry order is still partially inferred. A cold operator can find good docs,
  but there is not yet one compact "start here after context loss" reference in
  `.scaffoldai/reference/`.
- Reentry state files are named clearly in the README, but a docs-only cold
  start may not know whether to prioritize live state or the stable operational
  baseline.
- The authority/approval contract is important, but a cold reader may discover
  it only after reading the baseline or flowchart.
- The verification scope guidance is highly useful, but it is not yet linked
  from the older baseline/flowchart orientation chain.
- MCP is explained carefully, but readers unfamiliar with MCP may still need to
  read both the README and MCP references before the "controlled access, not
  authority" distinction settles.
- Escalation is conceptually clear, but examples of good escalation wording are
  still light.

These are survivability seams. They do not imply runtime changes or new
automation.

---

## 6. Hidden Conversational Assumptions

The simulation exposed several assumptions that could still depend on prior
conversation or maintainer memory:

- The operator knows whether they are doing reentry into live work or cold
  orientation into the process model.
- The operator knows that `.scaffoldai/state/snapshot.md` is live continuity
  state, while the operational baseline is stable orientation.
- The operator understands that `make scaffoldai-test` may be enough for
  bounded process documentation work.
- The operator understands that `make repo-test` is broader confidence, not an
  automatic requirement for every docs change.
- The operator understands that accepted warnings can still deserve review.
- The operator understands MCP as a local capability/access layer rather than a
  remote runtime service or authority surface.
- The operator knows that repeated blocked-behavior language is intentional
  boundary reinforcement, not stale duplication.
- The operator knows when to ask a human instead of continuing with a plausible
  interpretation.

These are survivability risks, not failures. They identify places where the
system may still rely on conversational compression instead of repo-local
orientation.

---

## 7. Recovery Confidence Reflection

The system can realistically survive ordinary context loss. A careful operator
with only the repo can rediscover the main model:

- ScaffoldAI is the process harness.
- Consync is the product/runtime surface.
- humans hold final authority.
- commands are visible and deterministic.
- verification produces evidence, not approval.
- MCP is controlled local access, not autonomous execution.
- blocked behaviors are documented repeatedly.

Recovery confidence is strongest for command discovery, high-level authority,
and process/product separation. The Makefile, README, operational baseline, and
authority contract carry most of that weight.

Recovery confidence is weaker around sequencing. A cold operator can find the
right pieces, but still has to infer the ideal first-reading order and decide
whether they are doing live reentry, docs orientation, verification planning, or
authority review.

The current docs are survivable, but not frictionless. That is a good v0 state:
the manual process is visible enough to recover, and the remaining seams are
specific enough to improve without inventing automation.

---

## 8. Non-Goals

This pressure test is not:

- an onboarding engine
- autonomous context reconstruction
- runtime memory recovery
- AI orchestration
- workflow execution
- automatic reentry
- proof the architecture is finished
- approval to change runtime, MCP, package, or product behavior

---

## 9. Recommended Follow-Ups

Conservative follow-up areas:

- Add a compact cold-start orientation pointer from the operational baseline to
  the verification scope guidance and authority contract.
- Clarify the difference between live reentry state and stable orientation docs
  in one short reference note.
- Add a few examples of escalation wording to the authority model or a
  supporting reference.
- Consider a small operational glossary for recurring terms such as "harness",
  "runtime command", "verification surface", "review-only warning", and
  "authority layer".
- Refine future flowchart layering to show verification scope guidance and
  approval/authority as discoverable nodes.

These are documentation improvements only. They should preserve manual process
coordination and avoid automatic routing or policy execution.
