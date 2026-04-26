# WORK_PACKET v3 Template

Copy and fill this template when handing off an implementation task to a Copilot or Codex agent.

This version adds explicit idempotency detection. The agent must evaluate the ALREADY_COMPLETE CHECK before performing any work.

---

```
PACKET_ID: [packet-YYYYMMDDTHHMMSSZ]
MODE: NEXT_ACTION
TOOL: COPILOT_AGENT
STATUS: [COMPLETE | ALREADY_COMPLETE | STOPPED]

---

CONTEXT:
[Describe the current state of the repo or feature area. One short paragraph.
Include any recent changes relevant to this task.]

TASK:
[One clear sentence describing what to build or change.]

GOAL:
[What success looks like. What the agent should leave behind when done.]

---

EXECUTION PHASES:

Follow this order strictly. Do not skip phases. Do not proceed past a phase that fails.

  PHASE 1 — ALREADY_COMPLETE CHECK
  PHASE 2 — IMPLEMENT  (skip if ALREADY_COMPLETE)
  PHASE 3 — VERIFY
  PHASE 4 — DOCUMENT
  PHASE 5 — COMMIT

---

ALLOWED FILES:
[List the files the agent is permitted to create or modify.
Be specific. Do not allow open-ended file access.]

Examples:
- src/commands/[new-command].js           (create)
- src/lib/[new-lib].js                    (create)
- .consync/state/handoff.md               (modify)
- .consync/state/work-log.md              (append)
- README.md                               (modify if needed)

---

STOP CONDITIONS:

Stop and return STATUS: STOPPED if any of the following occur:
- The task requires modifying files not listed in ALLOWED FILES
- Verification fails after one retry
- The task requires a product decision that is not already made
- The task scope has drifted from the stated TASK
- A dependency is missing and cannot be resolved locally
- Repeated failure with no clear path forward

Do not attempt to work around stop conditions.
Do not modify files outside scope to unblock yourself.

---

ALREADY_COMPLETE CHECK:

Before doing any work, check the following. If ALL pass, return STATUS: ALREADY_COMPLETE.

  1. Expected artifact or test file exists:
     - [path/to/expected/file or test]

  2. Documentation is updated:
     - [path/to/doc — confirm the relevant section reflects this feature]

  3. Work-log entry exists:
     - .consync/state/work-log.md contains an entry for this task or PACKET_ID

  4. Latest commit touching relevant files:
     - Run: git log --oneline -- [relevant file paths]
     - Record the commit hash if found
     - If a recent commit message clearly matches this task, treat as confirmed

If ALL four checks pass, return:

  STATUS: ALREADY_COMPLETE
  SUMMARY: [brief description of what already exists]
  COMMIT: [hash if identified, otherwise "not identified"]
  FILES CHECKED: [list]

Do not modify any files in this case.

---

COMPLETE PATH:

Only enter this path if ALREADY_COMPLETE CHECK fails on one or more items.

  IMPLEMENT:
  - [Describe what to build or change, concisely.]
  - [List any specific behaviors, outputs, or file shapes required.]
  - Do not add features beyond the stated TASK.

  VERIFY:
  [Choose one level. Default to FULL_VERIFY unless scope is narrow.]

  FAST_CHECK   → npm test                   (unit + integration only, no Electron)
  UI_CHECK     → npm run test:e2e           (Playwright/Electron e2e, requires display)
  FULL_VERIFY  → npm run verify:full        (state preflight + unit + e2e + state postflight)

  VERIFY LEVEL FOR THIS TASK: [FAST_CHECK | UI_CHECK | FULL_VERIFY]

  DOCUMENT:
  - Append an entry to .consync/state/work-log.md describing what was done.
  - Update any doc files listed in ALLOWED FILES if their content is now stale.
  - Do not create new doc files unless explicitly listed in ALLOWED FILES.

  COMMIT:
  - Stage only files listed in ALLOWED FILES that were actually changed.
  - Use a commit message of the form:
      [short verb phrase]: [what changed] ([PACKET_ID])
  - Do not push.
  - Do not amend existing commits.

---

STOPPED PATH:

If a STOP CONDITION is met, return immediately:

  STATUS: STOPPED
  REASON: [which stop condition triggered]
  PHASE: [which phase was active when stopped]
  SAFE STATE: [confirm whether repo is in a clean state or describe what was left behind]
  RECOMMENDED NEXT STEP: [one sentence]

Do not attempt further work after a stop condition triggers.

---

VERIFICATION:

[Restate the verify command for this packet.]

Example: FAST_CHECK → npm test

---

COMMIT RULES:

- Only commit files listed in ALLOWED FILES.
- Commit message format: [verb phrase]: [description] ([PACKET_ID])
- Do not push.
- Do not force-push.
- Do not amend published commits.
- Do not use --no-verify.

---

OUTPUT CONTRACT:

Return at minimum:

  STATUS:         COMPLETE | ALREADY_COMPLETE | STOPPED
  SUMMARY:        What was done, found, or why execution stopped
  FILES CREATED:  List of new files (or "none")
  FILES MODIFIED: List of changed files (or "none")
  VERIFICATION:   Command run + result (pass / fail / skipped)
  COMMIT:         Commit hash or "none" or "not identified"
  ANY FOLLOW-UPS: Unresolved friction, deferred decisions, or next steps
```

---

## Notes on Use

- **ALREADY_COMPLETE is a first-class outcome.** It is not a failure. It means the work was already done and the agent verified it.
- **STOPPED is a first-class outcome.** Do not treat it as an error. It means the agent encountered a boundary it should not cross.
- **COMPLETE is the normal outcome.** Implement, verify, document, commit.
- **FULL_VERIFY is the default** for any packet that touches production code or state contracts.
- **ALLOWED FILES must be filled in.** An open-ended list defeats the scope protection.
- **Do not add tooling to support this template.** It is copy-paste only.

See `.consync/docs/verification-ladder.md` for the full verification level definitions.
See `.consync/.agents/skills/closeout-agent.md` for the closeout workflow.
