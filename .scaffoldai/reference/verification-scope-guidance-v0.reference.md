# Verification Scope Guidance Reference v0

Status: first-pass reference
Role: supporting operational guidance
Scope: verification scope and review-only warning interpretation

---

## 1. Purpose

Verification scope guidance exists because deterministic checks still require
human interpretation. A command can prove that a bounded set of checks passed,
but it cannot decide whether that evidence is sufficient for a specific change,
whether a warning matters, or whether uncertainty should trigger broader review.

This reference clarifies how to think about the current verification surfaces:

- when `make scaffoldai-test` is usually enough
- when `make repo-test` is usually appropriate
- when `make repo-full-audit` is usually worth the extra cost
- which warning and info classes are expected to remain visible for review

This is guidance, not executable policy. It does not create automatic
verification selection, mandatory workflow routing, approval automation, runtime
behavior, or hidden escalation logic.

Warning-oriented surfaces are intentional. Not every useful signal should become
a failure. Some signals are healthiest when they stay visible and reviewable.

---

## 2. Verification Surface Overview

### `make scaffoldai-test`

`make scaffoldai-test` is the focused ScaffoldAI process and harness check. It
is oriented around process documentation, contracts, command references, drift
visibility, invariant checks, and manual leak-check prompts.

It currently covers:

- ScaffoldAI status visibility
- required ScaffoldAI documentation presence
- deterministic link and command audit
- drift-risk scanning
- ScaffoldAI verifier surface
- manual leak-check prompts

This is suitable for many docs-only, process-only, contract-only, and
reference-only changes that remain inside `.scaffoldai/` and do not alter
runtime behavior.

### `make repo-test`

`make repo-test` is the normal broader repo confidence surface. It runs the
ScaffoldAI checks and the fast Consync product/runtime checks.

It is appropriate when a change may cross or describe boundaries between
ScaffoldAI process behavior and Consync runtime/product behavior, or when the
operator wants broader confidence without running the full e2e audit path.

### `make repo-full-audit`

`make repo-full-audit` is the highest-confidence operational verification
surface. It includes the broader repo checks and the full verification path,
which may include Electron/Playwright/e2e coverage and pre/postflight integrity
checks.

It is heavier than the ordinary process check. Use it when confidence needs to
be maximized or when the change touches surfaces where fast checks are not
enough evidence.

---

## 3. Suggested Verification Escalation Heuristics

These are heuristics, not hard rules. The operator remains responsible for
choosing the appropriate scope.

### Usually ScaffoldAI-only Is Sufficient When

- The change is documentation-only inside `.scaffoldai/`.
- The change updates process, reference, or contract wording without modifying
  product/runtime code.
- No package scripts, Makefile targets, MCP behavior, or runtime configuration
  changed.
- The change does not claim new Consync product behavior.
- The intended evidence is process integrity, documentation coherence, and drift
  visibility.

Typical command:

```text
make scaffoldai-test
```

### Usually Repo-Test Is Appropriate When

- The change describes or touches repo-level command semantics.
- The change is runtime-adjacent, even if it is mostly documentation.
- The change modifies shared operational surfaces such as the Makefile or
  verification scripts.
- The change updates boundary language between ScaffoldAI and Consync.
- The operator is uncertain whether a process change could affect product-facing
  assumptions.

Typical command:

```text
make repo-test
```

### Usually Repo-Full-Audit Is Appropriate When

- Electron, renderer, desktop, or runtime behavior changed.
- Verification surfaces changed.
- Package scripts changed.
- MCP surfaces changed.
- Broad architectural boundary claims changed.
- A release, merge, handoff, or high-confidence closeout needs maximum local
  evidence.
- The operator or reviewer specifically asks for the broadest available check.

Typical command:

```text
make repo-full-audit
```

Escalation should remain explainable. If a broader command is chosen, the reason
should be clear enough for a future reader to understand.

---

## 4. Accepted Review-Only Warning Classes

Some warning and info classes are expected to remain visible because they help
humans review drift, context, and boundary assumptions.

Accepted review-only classes include:

- **Historical references**: old paths, terms, or behaviors preserved for
  context.
- **Migration evidence**: references that explain how the system moved from one
  structure to another.
- **Negative examples**: examples of wording or behavior the system rejects.
- **Forbidden-behavior examples**: explicit examples of blocked behaviors such
  as hidden execution, automatic dispatch, or background behavior.
- **Generated/live-state paths**: references to paths such as `.scaffoldai/tmp/`
  or `.scaffoldai/state/` that may not exist in a clean checkout but are useful
  to document.
- **Drift-aware wording**: terms that are mentioned because they might drift,
  not because they are active behavior.
- **Blocked/non-goal language**: non-goals and blocked patterns kept visible so
  future changes do not accidentally normalize them.

Visibility is intentional. These signals are not automatically failures because
their value is often in review, not rejection.

An accepted warning class can still become actionable if the context changes.
For example, a generated path warning is acceptable when documenting live-state
semantics, but suspicious if a new doc treats that path as a required static
file.

---

## 5. Verification Philosophy

Verification produces evidence. Humans interpret significance.

Core principles:

- Passing checks are not approval.
- Verification does not prove architectural wisdom or correctness of intent.
- Warning visibility is healthier than silent assumptions.
- Deterministic checks should expose seams, not hide them.
- Failures should remain narrow enough to be trustworthy.
- Review-oriented signal should stay review-oriented until the system can define
  a stable invariant.

This preserves manual process coordination while still making repeatable checks
cheap to run.

---

## 6. Known Judgment Areas

Some decisions intentionally remain human-centered in v0:

- selecting verification scope for documentation-only work
- deciding when uncertainty warrants `make repo-test`
- deciding when broad confidence warrants `make repo-full-audit`
- interpreting architecture-risk language in references and contracts
- deciding whether a warning is expected, stale, or newly meaningful
- deciding whether a clean verification result is enough evidence for closeout
- deciding when a change requires explicit human approval before continuing

These are not gaps to patch with automatic routing. They are judgment surfaces
that should stay visible until the manual process is stable enough to describe
more precisely.

---

## 7. Non-Goals

This guidance is not:

- an automatic escalation engine
- executable policy
- runtime orchestration
- approval automation
- workflow enforcement
- a substitute for human judgment
- permission to skip verification when scope is unclear

---

## 8. Future Direction

Future conceptual improvements may include:

- authority overlays in the flowchart
- verification overlays for command surfaces
- richer verification heuristics
- operational confidence visualization
- clearer examples of when warnings should remain review-only

These are future conceptual directions only. They are not current runtime
behavior, executable policy, or automatic verification selection.
