# Planning — scaffoldai-question-command-v1

Created: 2026-05-06
Status: PLAN

---

## 1. Purpose

`scaffoldai question` is a read-only command that exposes uncertainty.

When ScaffoldAI encounters an unknown condition, ambiguity, policy gap, verification gap, or process uncertainty, it should surface the question explicitly rather than guess, silently proceed, or produce a misleading status.

It answers: "Is there something I am not sure about that a human should decide before we continue?"

This command is the uncertainty boundary of the ScaffoldAI runtime loop. It does not resolve, auto-fix, or dispatch any action. The human is always the decision-maker.

---

## 2. Non-Goals (v1)

- Does NOT write decision logs or question history files.
- Does NOT send messages, open issues, or communicate outside the terminal.
- Does NOT propose answers or infer what the human should decide.
- Does NOT block execution unless there is a hard BLOCKED condition.
- Does NOT implement MCP, autonomous orchestration, or decision inference.
- Does NOT replace `preflight`, `verify`, or `closeout`.
- Does NOT generate commit messages or modify state.
- Does NOT emit agentic language ("I will", "I am deciding", "I have resolved").

---

## 3. How It Differs from Other Runtime Commands

| Command     | Question It Answers                                | Read-Only? | Can Block? |
|-------------|-----------------------------------------------------|------------|------------|
| `status`    | What is the current state of things?               | Yes        | No         |
| `preflight` | Is it safe to start work?                          | Yes        | Yes        |
| `verify`    | Did the work pass verification?                    | Yes        | Yes        |
| `closeout`  | Is this work ready for human review/commit?        | Yes        | Yes        |
| `question`  | Is there something uncertain I should expose now?  | Yes        | Yes        |

`question` is complementary, not redundant. It surfaces uncertainty that is out of scope for the other commands — ambiguous packet classification, policy gaps, runtime terminology drift, tool boundary concerns, and conditions where the right path is unclear.

---

## 4. Command Semantics

```
node src/index.js scaffoldai question
```

No flags in v1. The command:

1. Reads `active-contract.json` and `next-action.md`.
2. Reads `active-stream.md`.
3. Checks for ambiguous or inconsistent state across those files.
4. Classifies any detected conditions into a question category.
5. Prints a structured question report.
6. Exits 0 unless a BLOCKED condition exists.

---

## 5. Status Model

| Status            | Meaning                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `CLEAR`           | No open questions detected. Safe to continue.                           |
| `QUESTION`        | One or more open questions exist. Human should review before proceeding.|
| `WARNING`         | Potential concern, but not blocking. Worth noting.                      |
| `BLOCKED`         | A hard condition prevents safe continuation. Requires human resolution. |

Default: if the command cannot read required state files → `BLOCKED`.

QUESTION is not an error. It is an honest signal that something needs human attention.

---

## 6. Category Model

Each detected condition is classified into one category. Categories are advisory labels, not error codes.

### UNKNOWN_CONDITION
A state value or combination of values that does not match any known pattern.

Examples:
- `next-action.md` contains a TYPE or PACKAGE not recognized by the contract model.
- `active-stream.md` references a stream directory that does not exist.

### POLICY_GAP
The current state is valid, but no explicit policy or rule covers what to do next.

Examples:
- `in_flight_packet` is null but `allowed_packet_types` is empty.
- No verify command maps to the current packet type.

### VERIFY_GAP
Verification state is ambiguous, missing, or incomplete.

Examples:
- No verify evidence provided (not `--verify-passed`, no recent output).
- `verify:scaffoldai` has not been run since the last file change.
- The resolved verify command does not match the active stream.

### AMBIGUOUS_PACKET
The current packet classification is mixed, unclear, or in conflict.

Examples:
- `next-action.md` has `TYPE: mixed` without clarification.
- `allowed_packet_types` contains conflicting entries (e.g., `["product","process"]`).
- `in_flight_packet` does not match any entry in `allowed_packet_types`.

### HUMAN_DECISION_REQUIRED
A condition exists that requires an explicit human judgment before work can safely continue.

Examples:
- Git is dirty but there is no active packet — unclear whether this is committed work or drift.
- `active-contract.json` has a `blocked_packet_types` entry that conflicts with the desired next action.

### TOOL_BOUNDARY_CONCERN
A tool or system the command depends on is behaving unexpectedly or is outside its defined scope.

Examples:
- `git status` returns an error (not a git repo, not installed).
- A required script is missing from `package.json`.
- The ScaffoldAI runtime command dispatch is incomplete.

### TEMP_ARTIFACT_BOUNDARY
A temp/runtime artifact was written or is expected outside `.scaffoldai/tmp/`.

Examples:
- A command log was written to `/tmp/`.
- A debug file was written to `~/`.
- Any runtime artifact exists outside the project root.

### RUNTIME_TERMINOLOGY_DRIFT
A label, flag, or terminology in the codebase or output deviates from the established ScaffoldAI runtime convention.

Examples:
- `VERIFY SURFACE` appears in output instead of `VERIFY COMMAND`.
- `--surface` flag is used where `--target` is the defined convention.
- Coverage table labels use non-standard names.

---

## 7. Output Format

```
[scaffoldai question]

ACTIVE PACKET:   (none)
STREAM:          electron_ui

QUESTIONS DETECTED: 1

  [1] CATEGORY: VERIFY_GAP
      DETAIL:   No verification evidence present. VERIFY COMMAND not yet run.
      SEVERITY: WARNING
      ACTION:   Run npm run verify:scaffoldai, then re-run scaffoldai closeout --verify-passed

BLOCKERS:        none
WARNINGS:        1

NEXT SAFE ACTION: Resolve the open question(s) above before proceeding to closeout.

STATUS: QUESTION
```

If no questions are detected:

```
[scaffoldai question]

ACTIVE PACKET:   (none)
STREAM:          electron_ui

QUESTIONS DETECTED: 0

NEXT SAFE ACTION: No open questions. Proceed with scaffoldai closeout.

STATUS: CLEAR
```

---

## 8. Relationship to the Runtime Loop

The runtime loop with `question` inserted:

```
scaffoldai status      → situational awareness
scaffoldai preflight   → safety gate before work starts
scaffoldai verify      → verification evidence
scaffoldai question    → uncertainty surface (run any time doubts arise)
scaffoldai closeout    → commit readiness judgment
```

`question` can be run at any point. It is especially useful:
- Before beginning a new work packet (alongside preflight).
- After an interruption or reentry.
- When the output of another command looks surprising.
- When introducing new tooling or process changes.

---

## 9. Future Evolution Path (not v1)

v2 could add:
- A `--category=<name>` flag to filter for a specific question category.
- A `--log` flag to append question output to `.scaffoldai/tmp/question.log`.
- Integration with a formal rule-intake process (human reviews questions and adds rules).

v3 could add:
- A lightweight question history under `.scaffoldai/state/questions/` (append-only, human-reviewed).
- Pattern-based category detection using configurable rules.

None of these are in scope for v1.

---

## 10. Implementation Plan (v1)

1. `src/commands/scaffoldai-question.js`
   - `runScaffoldaiQuestionCommand()` — no flags in v1
   - Runs all built-in checks in order
   - Classifies findings into category structs: `{ category, detail, severity, action }`
   - Prints structured output
   - Exits 0 unless BLOCKED

2. Built-in checks (v1):
   - Required state files present (TOOL_BOUNDARY_CONCERN if missing)
   - Contract coherence: `in_flight_packet` vs `blocked_packet_types` (HUMAN_DECISION_REQUIRED)
   - `allowed_packet_types` not empty (POLICY_GAP)
   - Resolved verify command exists for current contract state (VERIFY_GAP)
   - `active-stream.md` references existing stream directory (UNKNOWN_CONDITION)
   - No mixed/ambiguous TYPE in `next-action.md` (AMBIGUOUS_PACKET)

3. Reuse:
   - `src/lib/gitStatus.js`
   - `src/lib/resolveVerifyCommand.js`
   - `src/lib/getInFlightPacket.js`

4. CLI dispatch:
   - `src/cli/index.js` — add `if (subcommand === "question")` under scaffoldai block

5. Package script:
   - `"scaffoldai:question": "node src/index.js scaffoldai question"`

6. Test: `src/test/unit-scaffoldai-question.js`
   - Command runs and produces `[scaffoldai question]` header
   - Output includes all required sections
   - STATUS is one of: CLEAR, QUESTION, WARNING, BLOCKED
   - QUESTIONS DETECTED line is present
   - In healthy repo state: exits 0, no BLOCKED

7. Wire into `verify.js` under `GROUPS.SYSTEM` / `SURFACES.SCAFFOLDAI`

---

## 11. Verification Plan (v1)

After implementation:

```
node src/index.js scaffoldai question
npm run scaffoldai:question
node src/test/unit-scaffoldai-question.js
npm run verify:scaffoldai
npm run verify
```

Expected:
- `node src/index.js scaffoldai question` → `STATUS: CLEAR` or `STATUS: QUESTION` (depending on repo state)
- No BLOCKED in healthy repo
- `npm run verify:scaffoldai` → `[verify] PASS`
- `npm run verify` → `[verify] PASS`

---

## 12. Risks and Guardrails

| Risk | Guardrail |
|---|---|
| `question` starts to infer answers, not just surface them | Output must only describe the condition — never recommend a resolution that implies ScaffoldAI decided anything |
| Category proliferation | v1 ships with exactly 8 categories; additions require a planning SDC |
| `question` becomes a catch-all for all unresolved issues | Each category must have a concrete, testable detection criterion |
| Output becomes noisy and ignored | v1 must surface 0–3 questions in a healthy repo; structural noise is a blocker for implementation |
| Terminology drift in the command itself | All output labels must conform to the established runtime convention |

---

## 13. Implementation Checklist

- [ ] `src/commands/scaffoldai-question.js` created
- [ ] All v1 built-in checks implemented
- [ ] `src/cli/index.js` updated with `closeout` dispatch
- [ ] `"scaffoldai:question"` added to `package.json`
- [ ] `src/test/unit-scaffoldai-question.js` created
- [ ] Test wired into `verify.js` under SCAFFOLDAI surface
- [ ] `npm run verify:scaffoldai` → PASS
- [ ] `npm run verify` → PASS
