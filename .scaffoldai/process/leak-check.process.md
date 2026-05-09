# SUPPORTING PROCESS DOCUMENTATION — NOT SOURCE OF TRUTH
# ScaffoldAI Leak Check Process

Captured: 2026-05-08
Status: first-pass process document
Role: operational process reference

---

## 1. Purpose

Leak checks exist because verification alone is not enough.

Verification asks whether a known command, contract, or expected behavior still
passes. A leak check asks whether the system is quietly becoming harder to
reason about.

Seams widen gradually. A term gets reused with a slightly different meaning. A
manual boundary gains an exception. A temporary workaround makes the next task
easier, so it stays. An example written for illustration starts to imply a real
behavior. None of these may fail verification immediately, but each can make the
architecture less stable over time.

Temporary glue often becomes permanent architecture when it is useful, repeated,
and never reclassified. Leak checks make that pressure visible before it becomes
part of the system by accident.

Principle:

> Automation should only remove friction from a process that already works manually.

Leak checks help determine whether the manual process is actually working, or
whether it is only being held together by unstated assumptions.

---

## 2. Leak Check Philosophy

A leak check is a lightweight, manual pressure test of the ScaffoldAI process
model.

It is:

- reflective: it asks what the work revealed about the system
- adversarial in a healthy way: it looks for weak points without assigning blame
- architecture-focused: it inspects boundaries, contracts, ownership, and terms
- assumption-seeking: it names what was trusted without being tested
- drift-seeking: it looks for gradual divergence between docs, examples, tests,
  state, and real use
- human-centered: it supports human judgment instead of replacing it

Leak checks are not blame-oriented. They are not pass/fail tests. They are not a
scorecard for whether a task was good or bad.

The purpose is to expose structural weak points early, while they are still
small enough to discuss, document, split, or repair manually.

---

## 3. Core Leak Check Questions

Use these questions during a leak check. Add new recurring questions over time
when repeated work reveals a new kind of drift.

- Are terms drifting?
- Are docs contradicting each other?
- Are file locations still meaningful?
- Are "manual only" boundaries still true?
- Are examples implying behavior the contracts forbid?
- Are tests covering the thing we now believe is important?
- Are we quietly depending on a temporary workaround?
- Are we learning something from usage that invalidates an assumption?
- Did this task reveal a boundary that is present in practice but absent in docs?
- Did a recommendation sound like approval, execution, or authority?
- Did any process step rely on chat memory instead of repository state?
- Did any future-facing note imply that the future behavior already exists?

Questions should remain short and reusable. A leak check should invite
reflection, not become a large audit template.

---

## 4. Required Unasked Questions Section

Every leak check must include this section:

## UNASKED QUESTIONS

Use it to surface unknown unknowns, especially the issues the original task did
not explicitly request.

Suggested prompts:

- What question should the human have asked but did not?
- What assumption did this task rely on?
- What seam could widen later?
- What temporary thing is at risk of becoming permanent?
- What feels "obviously fine" but has not actually been pressure-tested?
- What dependency or behavior are we trusting implicitly?
- What would become confusing if another person picked this up next month?
- What did the task wording make easy to miss?

This section exists because directional prompts can unintentionally suppress
challenge and discovery. If the prompt already says what to inspect, the leak
check should still ask what was not named.

---

## 5. Relationship to Existing Verification

Verification asks:

> "Did the thing pass?"

Leak Check asks:

> "What are we failing to notice?"

Both are necessary.

Verification is evidence that known behavior still satisfies known expectations.
Leak checking is reflective pressure against the expectations themselves.

A clean verification result does not prove that terms, examples, boundaries, or
architecture are still coherent. A leak check does not replace verification and
does not certify execution readiness. It produces observations, questions, and
recommended manual follow-up.

---

## 6. Trigger Points

Suggested moments to perform a leak check:

- after major architecture changes
- after introducing new terminology
- after introducing new boundaries or contracts
- after MCP behavior changes
- after real-world testing reveals surprises
- before introducing automation or runtime behavior
- after repeated use exposes friction or confusion
- after examples are added to explain process behavior
- after a temporary exception is used more than once
- before promoting a planning idea into a contract or implementation packet

Leak checks should be small enough to run when they are useful. They should not
become mandatory ceremony for every minor documentation edit.

---

## 7. Drift Indicators

Potential leak indicators include:

- increasing terminology ambiguity
- "temporary" exceptions accumulating
- unclear ownership or authority
- tests no longer matching architecture priorities
- examples contradicting contracts
- hidden coupling between systems
- assumptions learned only through accidental testing
- process docs describing behavior that scripts do not actually implement
- scripts or tools returning output that sounds more authoritative than it is
- MCP, runtime command, or agent docs implying autonomy where only manual
  invocation exists
- state files becoming more trusted than their documented authority allows
- future automation plans obscuring unresolved manual-process ambiguity

When a drift indicator appears, the next step should usually be conservative:
name it, classify it, and decide whether it belongs in planning, contracts,
verification, examples, or a future work packet.

---

## 8. Non-Goals

This process does not introduce:

- autonomous auditing
- AI self-governance
- background monitoring
- orchestration
- mandatory bureaucracy
- automatic enforcement
- runtime monitoring
- hidden agent review
- automatic state mutation
- automatic issue creation, task creation, staging, committing, or pushing

Leak checks are manually invoked and manually interpreted. They produce process
observations, not authority.

---

## 9. Relationship to Future Automation

Principle:

> Automation-readiness means the manual process is already structurally complete.

Automation should compress proven manual flows. It should not invent missing
structure, hide ambiguity, or convert unclear human judgment into hidden machine
behavior.

Before any leak-check-related automation is considered, the manual leak check
process should already show that it can:

- identify meaningful drift without expanding scope
- distinguish observations from approvals
- preserve manual process coordination
- route findings to the right ScaffoldAI surface
- remain lightweight enough to be used repeatedly

If the manual version feels unclear, heavy, or inconsistent, automation is not
yet ready. The correct next step is to improve the manual process, not to encode
the ambiguity.
