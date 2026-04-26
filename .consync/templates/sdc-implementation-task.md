# SDC Template — Implementation Task

Copy and fill this template when handing off an implementation task to a Copilot or Codex agent.

---

```
MODE: NEXT_ACTION
TOOL: COPILOT_AGENT

CONTEXT:
[Describe the current state of the repo or feature area. One short paragraph is enough.
Include any recent changes that are relevant to this task.]

TASK:
[One clear sentence describing what to build or change.]

GOAL:
[What success looks like. What the agent should leave behind when done.]

CONSTRAINTS:
- Do not modify production code outside the stated scope.
- Do not add new dependencies unless clearly necessary.
- Do not invent speculative features.
- Do not push automatically.
- [Add any task-specific constraints here.]

EXPECTED CHANGES:
- [List files or areas expected to change.]
- [Be specific enough to guide scope without over-specifying implementation.]

VERIFICATION:
[Choose one level from the verification ladder. Default to FULL_VERIFY unless scope is narrow.]

FAST_CHECK   → npm test                   (unit + integration only, no Electron)
UI_CHECK     → npm run test:e2e           (Playwright/Electron e2e, requires display)
FULL_VERIFY  → npm run verify:full        (state preflight + unit + e2e + state postflight)

VERIFY LEVEL FOR THIS TASK: [FAST_CHECK | UI_CHECK | FULL_VERIFY]

OUTPUT CONTRACT:
Return at minimum:
- STATUS        (DONE / BLOCKED / PARTIAL)
- SUMMARY       (what was built or changed)
- FILES CREATED (list)
- FILES MODIFIED (list)
- VERIFICATION  (commands run + result)
- ANY FOLLOW-UPS (unresolved friction, next steps, or deferred decisions)
```

---

## Notes on Use

- **FULL_VERIFY is the default for closeout.** Only drop to FAST_CHECK or UI_CHECK when the task is explicitly limited to unit-tested logic or UI-only changes with no state contract impact.
- **CONSTRAINTS** should be conservative. Err toward narrower scope.
- **EXPECTED CHANGES** helps the agent stay on target without you needing to supervise mid-task.
- **OUTPUT CONTRACT** ensures handoff-quality output so the next iteration starts from a clean record.

See `.consync/docs/verification-ladder.md` for the full verification level definitions.
See `.consync/skills/closeout-agent.md` for the closeout workflow.
