# Workflow Pressure Test Reference v0

Status: first-pass reference
Role: supporting process pressure-test reference
Scope: simulated workflow observations only

---

## 1. Purpose

Workflow pressure tests exist because process maturity is not proven by having
good documents or passing checks in isolation. The operating model also needs to
work when a human and an AI/client move through a realistic task: choosing a
surface, checking authority, using commands, interpreting evidence, and deciding
where to stop.

Operational seams often appear only during use. A command may be clear on its
own but confusing when paired with a contract. A diagram may orient one reader
while leaving another unsure which document has authority. A verification result
may be clean while the intended change still needs human judgment.

This pressure test is a controlled simulation. It does not introduce automation,
runtime behavior, MCP behavior, hidden execution, or product changes.

---

## 2. Simulated Workflow Scenario

### Initial Request

A human asks for a small documentation refinement:

```text
Add a short note to the ScaffoldAI docs explaining when to run the link audit
before changing process documentation.
```

The request is documentation-only, but it touches operational guidance and could
affect how future AI clients interpret process safety.

### Orientation Path

The operator starts with the operational baseline:

- `.scaffoldai/reference/operational-baseline-v0.reference.md`

The baseline explains that ScaffoldAI process work is manual-first, that
deterministic checks provide evidence, and that warning-oriented review surfaces
are intentional. Its visual companion points to:

- `.scaffoldai/reference/scaffoldai-flowchart-v0.reference.md`

The flowchart helps locate the relevant layers:

- human/operator layer
- operational command surface
- contracts/authority layer
- process layer
- reference/supporting layer
- verification/audit layer

Because the request could change operational guidance, the operator checks the
authority model:

- `.scaffoldai/contracts/gatekeeper-approval-authority-v0.contract.md`

The authority contract clarifies that recommendation does not equal approval,
execution does not authorize follow-on work, and verification does not approve
intent or closeout.

### Gatekeeper-Style Classification

Using the Gatekeeper recommendation model conceptually, the request maps to:

```text
recommended_surface: documentation-capable repo client
required_capabilities:
  - can_read_repo_context
  - can_edit_files
  - strong_at_review
  - safe_for_documentation_only_work
risk_level: MEDIUM
manual_only: true
human_next_action: Approve the specific docs-only edit and expected checks.
```

Authority mattered here because the recommendation identified a suitable client
surface, but did not approve the edit. The human still had to approve the doc
mutation and verification expectations.

### Operational Path

Before editing, the operator checks current process health:

```text
make scaffoldai-link-audit
```

The audit validates active `.scaffoldai` references, Make targets, package
scripts, and key authority-role expectations. It also reports existing
review-only warnings for generated/live state paths.

The operator then makes the hypothetical documentation edit within `.scaffoldai/`
and runs:

```text
make scaffoldai-test
```

This command bundles:

- repo status visibility
- required docs check
- link and command audit
- drift check
- ScaffoldAI verifier
- manual leak-check prompts

If the edit changes only ScaffoldAI process documentation and passes
`make scaffoldai-test`, the operator may choose whether `make repo-test` is
useful. `make repo-test` adds Consync fast runtime checks, which can be valuable
for broad confidence but may be more than the lightest necessary check for a
small process-doc refinement.

### Ambiguity Encountered

The simulation exposes one believable ambiguity:

```text
When is repo-test required for documentation-only ScaffoldAI work?
```

The baseline says `repo-test` is the normal combined confidence bundle, while
`scaffoldai-test` is the focused ScaffoldAI process bundle. The distinction is
understandable, but a new contributor may still wonder whether "normal combined"
means mandatory for every docs change.

The manual resolution is to use authority and verification semantics:

- `scaffoldai-test` is sufficient evidence for many bounded ScaffoldAI-only doc
  changes.
- `repo-test` is appropriate when the doc change affects repo-level command
  semantics, shared verification expectations, or cross-surface claims.
- The human remains responsible for deciding whether broader verification is
  warranted.

This is not a failure. It is a seam worth keeping visible.

---

## 3. Observed Strengths

- The operational baseline gives a stable first stop for command and check
  semantics.
- The flowchart helps distinguish contracts, process docs, references, runtime
  surfaces, and historical context quickly.
- The approval/authority contract reduces the common confusion between
  recommendation, execution, verification, and approval.
- `make scaffoldai-link-audit` provides fast confidence that new references and
  command mentions are coherent.
- `make scaffoldai-test` is a readable ScaffoldAI-focused bundle rather than a
  vague catch-all.
- Drift checks preserve useful review signal without turning every historical or
  negative example into a failure.
- Leak-check prompts keep reflective questions visible after deterministic
  checks finish.

---

## 4. Observed Friction / Seams

- The line between `make scaffoldai-test` and `make repo-test` is sensible but
  still judgment-based for documentation-only work that describes repo-level
  behavior.
- The link audit's generated/live path warnings are useful, but a new reader may
  not immediately know which warnings are accepted review-only classes.
- The flowchart points to the authority layer generally, but does not yet show
  the new approval/authority contract as a named node.
- Gatekeeper recommendation concepts are spread across contract, taxonomy, and
  examples. The separation is healthy, but first-time navigation takes a few
  hops.
- "Escalation means ask the human" is clear in the authority contract, but
  practical examples of good escalation wording are still light.

These are believable pressure points. None require runtime changes or new
automation.

---

## 5. Unknown Unknowns / Unasked Questions

- What would a new contributor assume after seeing both `scaffoldai-test` and
  `repo-test` in close succession?
- Which warnings are intentionally preserved as review signal, and where should
  accepted warning classes be documented?
- Does the current orientation chain make `.scaffoldai/contracts/` feel too
  heavy for a small docs task, or appropriately authoritative?
- What operational knowledge still lives in recent conversation rather than in
  stable docs?
- Would a future MCP-capable client correctly understand that read-only
  observation is not approval to execute?
- What feels stable because the current maintainers remember it, but would be
  ambiguous after context loss?
- Are there enough examples of when to escalate from a recommendation to a human
  clarification?

The strongest hidden assumption is that the operator already understands when a
ScaffoldAI-only confidence pass is enough. The docs explain the tools, but the
decision threshold remains partly human judgment.

---

## 6. Authority / Verification Reflection

Approval semantics helped most at the point where the simulated Gatekeeper
classification named a suitable documentation-capable client. The authority
contract made it explicit that the recommendation did not approve the edit, did
not select a hidden executor, and did not authorize follow-on git actions.

Verification semantics helped after the hypothetical edit. A passing
`make scaffoldai-test` would prove deterministic evidence for the ScaffoldAI
surface, but it would not prove that the wording was the best architectural
choice or that broad repo verification was unnecessary. That distinction kept
verification useful without overclaiming.

No operational layer in the simulated path needed to imply approval. The
remaining risk is reader interpretation: command success can feel like approval
unless the authority contract remains discoverable.

---

## 7. Operational Surface Reflection

The Makefile surface is readable. The command names communicate scope better
than generic aliases:

- `make scaffoldai-test` reads as process/harness confidence.
- `make repo-test` reads as combined confidence.
- `make repo-full-audit` reads as heavy/broad confidence.

The link audit is useful before documentation edits because it catches stale
references and command mentions deterministically. Its WARN/FAIL split is
important: generated/live paths remain visible without blocking work.

The drift check is useful because it catches forbidden or ambiguous wording
without punishing historical and negative examples. INFO/WARN/FAIL semantics are
mostly intuitive, but the accepted warning class for generated/live paths should
eventually be documented in one obvious place.

The separation between `repo-test` and `scaffoldai-test` is clear once read, but
still requires judgment in mixed documentation tasks.

---

## 8. Non-Goals

This pressure test was not:

- runtime automation
- runtime orchestration
- AI self-management
- autonomous execution
- automatic graph generation
- proof that the architecture is finished
- approval to change runtime, MCP, package scripts, or product behavior

It is a manual review artifact for pressure-testing process clarity.

---

## 9. Recommended Follow-Ups

- Document accepted review-only warning classes for `make scaffoldai-link-audit`.
- Add the approval/authority contract as a named authority node in a future
  flowchart update.
- Add one or two examples of escalation wording to the authority contract or a
  supporting reference.
- Clarify when `make scaffoldai-test` is sufficient for bounded ScaffoldAI docs
  work versus when `make repo-test` is recommended.
- Keep future pressure tests scenario-based rather than exhaustive.
