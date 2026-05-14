# Approval Authority Contract — v1

**Status:** Active  
**Created:** 2026-05-13  
**Purpose:** Define execution approval semantics separate from routing and recommendation  
**Authority:** Documentation only — no runtime enforcement  

---

## 1. Purpose

This contract defines the lightweight v0.1 approval model for ScaffoldAI-managed work.

Approval is **human authority** to execute specific operations. It is distinct from:
- **Routing decisions** (Gatekeeper ALLOW/BLOCK)
- **Recommendations** (MCP tool observations, closeout PASS)
- **State management** (packet mounting to next-action.md)

Core principle: **Explicit approval required for mutation.**

---

## 2. Approval Authority

**Only humans grant approval.**

AI tools, MCP tools, gatekeeper decisions, and closeout reports may recommend or provide evidence, but they **do not grant approval**.

---

## 3. Approval States (v0.1)

### 3.1 Minimal State Model

```yaml
APPROVAL:
  execute: PENDING | APPROVED
  commit: PENDING | APPROVED
```

**Default when field is missing:** `PENDING` (safe — agent must ask)

---

### 3.2 State Semantics

#### `execute: PENDING`
- Agent **must not** create, edit, delete, move, or rename repository files
- Agent **must ask** human for approval before implementing
- Read-only operations are allowed (observation, analysis, recommendation)

#### `execute: APPROVED`
- Agent **may** create, edit, delete, move, or rename files **within ALLOWED FILES scope**
- Agent must still respect STOP CONDITIONS
- Agent must still honor MODE constraints (e.g., MODE: Read-only overrides approval)

#### `commit: PENDING`
- Agent **must not** stage or commit changes
- Agent **must ask** human for commit approval after verification passes
- Closeout PASS is evidence, not approval

#### `commit: APPROVED`
- Agent **may** stage and commit changes **for files within ALLOWED FILES scope only**
- Agent must use specified commit message format
- Agent **must not** push without separate explicit instruction

---

## 4. What Does NOT Grant Approval

The following do **not** grant execution or commit approval:

| Signal | What It Means | What It Does NOT Mean |
|--------|---------------|----------------------|
| **Gatekeeper ALLOW** | "No blockers, path is clear" | Not approval to execute |
| **Packet mounted to next-action.md** | "This is the active work context" | Not approval to implement |
| **Closeout STATUS: PASS** | "Verification passed, evidence is clean" | Not approval to commit |
| **MCP tool observation** | "Current state is X" | Not approval to change state |
| **Detailed SDC with file lists** | "Here's a complete spec" | Not approval to implement |
| **Imperative tone in request** | "Implement X" | May or may not be approval (check APPROVAL field) |
| **SDC in planning directory** | "This work is being planned" | Not approval to execute |
| **EXECUTION PHASES listed** | "These are the implementation steps" | Not approval to perform them |

---

## 5. Approval Checkpoints

### 5.1 Before File Mutation

**Required Check:**

```
IF APPROVAL.execute is missing OR APPROVAL.execute == PENDING:
  → Stop and ask human for execution approval
  → Do not infer approval from SDC detail, packet mounting, or request tone
  → Wait for explicit "yes, proceed" or APPROVAL.execute = APPROVED

IF APPROVAL.execute == APPROVED:
  → May proceed with file mutations within ALLOWED FILES scope
  → Still honor MODE constraints and STOP CONDITIONS
```

---

### 5.2 Before Git Commit

**Required Check:**

```
IF APPROVAL.commit is missing OR APPROVAL.commit == PENDING:
  → Stop and ask human for commit approval
  → Closeout PASS is evidence, not approval
  → Wait for explicit "yes, commit" or APPROVAL.commit = APPROVED

IF APPROVAL.commit == APPROVED:
  → May stage and commit files within ALLOWED FILES scope
  → Use specified commit message format
  → Do not push
```

---

## 6. Interaction with Other Boundaries

### 6.1 MODE Field

`MODE` defines **intent and capability boundary**.  
`APPROVAL` defines **authorization state**.

**Both must align for work to proceed.**

Examples:

```yaml
MODE: Read-only audit
APPROVAL: { execute: APPROVED, commit: APPROVED }
```
**Agent Behavior:** Observe only. MODE overrides approval.

---

```yaml
MODE: IMPLEMENT
APPROVAL: { execute: PENDING, commit: PENDING }
```
**Agent Behavior:** Ask for execution approval before implementing.

---

```yaml
MODE: IMPLEMENT
APPROVAL: { execute: APPROVED, commit: PENDING }
```
**Agent Behavior:** May implement and verify. Must ask before committing.

---

### 6.2 Process Profile execution_mode

- `execution_mode: DRY_RUN` → Simulate only, ignore APPROVAL field
- `execution_mode: LIVE` + `APPROVAL.execute: APPROVED` → Real mutations allowed

---

### 6.3 Gatekeeper Decision

**Gatekeeper routing is a prerequisite, not approval.**

Flow:
```
1. Gatekeeper evaluates routing (ALLOW/BLOCK/CLOSEOUT_REQUIRED)
2. If ALLOW, check APPROVAL.execute
3. If APPROVED, proceed
4. If PENDING, ask human
```

Gatekeeper ALLOW + APPROVAL PENDING → Agent must still ask.

---

### 6.4 MCP execution_class

**MCP execution_class defines tool capability.**  
**APPROVAL defines packet-level authorization.**

- `execution_class: READ_ONLY` → Tool cannot mutate, regardless of packet approval
- Packet `APPROVAL.execute: APPROVED` → Allows mutation within packet scope, but tool boundaries still apply

These are independent constraints that must both be satisfied.

---

## 7. Backward Compatibility

### 7.1 Existing SDCs Without APPROVAL Field

**Default Behavior:** Treat as `APPROVAL: { execute: PENDING, commit: PENDING }`

**Agent Behavior:**

```
IF APPROVAL field is missing:
  IF MODE is "Read-only" OR "Audit" OR "Review":
    → Proceed with observation (no mutation)
  
  IF MODE is "IMPLEMENT" OR "NEXT_ACTION":
    → Ask human for execution approval before implementing
```

**No breaking changes.** Existing SDCs remain valid.

---

### 7.2 Migration Path

1. Add APPROVAL semantics to contracts (this document)
2. Update work packet template
3. Document approval checkpoint pattern
4. Existing SDCs default to PENDING (safe)
5. New SDCs include explicit approval fields
6. Gradual adoption, no forced migration

---

## 8. What v0.1 Does NOT Include

This minimal v0.1 approval model **intentionally omits**:

- ❌ PLAN_APPROVED state
- ❌ VERIFY_APPROVED state
- ❌ CLOSEOUT_APPROVED state
- ❌ Approval audit logs
- ❌ Approval CLI commands (`scaffoldai approve`)
- ❌ Timestamped approval records
- ❌ Approval revocation
- ❌ Multi-level approval hierarchies
- ❌ Approval enforcement daemon
- ❌ Runtime approval checks
- ❌ Automated approval workflows

**Rationale:** Start minimal. Add complexity only when usage demonstrates need.

---

## 9. Cross-Agent Compatibility

### 9.1 Structured Field Recognition

The `APPROVAL:` field is structured YAML/text that works across:
- Copilot
- Codex
- Claude
- ChatGPT (when SDC is pasted/uploaded)

**Multi-Signal Reinforcement:**

For maximum cross-agent clarity, combine:
```yaml
MODE: IMPLEMENT
APPROVAL:
  execute: APPROVED
  commit: PENDING

CONSTRAINTS
* Execute approved within ALLOWED FILES only.
* Do NOT commit without human approval.
```

Redundant signals reduce interpretation variance.

---

### 9.2 Agent Interpretation Guidance

**For AI tools reading this contract:**

Before implementing any file changes:
1. Locate the `APPROVAL:` field in the SDC or work packet
2. Check `APPROVAL.execute` value
3. If missing or `PENDING`, ask human: "Should I proceed with implementation?"
4. If `APPROVED`, proceed within ALLOWED FILES scope
5. Honor MODE and STOP CONDITIONS regardless of approval

Before committing:
1. Check `APPROVAL.commit` value
2. If missing or `PENDING`, ask human: "Should I commit these changes?"
3. If `APPROVED`, stage and commit within scope
4. Do not push unless explicitly instructed

---

## 10. Examples

### 10.1 Planning-Only Request

```yaml
PACKET_ID: packet-20260513T140000Z
MODE: Planning
APPROVAL:
  execute: PENDING
  commit: PENDING
```

**Agent Behavior:** Create planning documents, do not implement code.

---

### 10.2 Implementation-Approved Request

```yaml
PACKET_ID: packet-20260513T140500Z
MODE: IMPLEMENT
APPROVAL:
  execute: APPROVED
  commit: PENDING

ALLOWED FILES:
- src/commands/new-feature.cmd.consync.js (create)
- README.md (modify)
```

**Agent Behavior:** May create/modify listed files. Must ask before committing.

---

### 10.3 Fully-Approved Request

```yaml
PACKET_ID: packet-20260513T141000Z
MODE: IMPLEMENT
APPROVAL:
  execute: APPROVED
  commit: APPROVED
```

**Agent Behavior:** May implement, verify, and commit. Must not push.

---

### 10.4 Legacy SDC Without APPROVAL Field

```yaml
PACKET_ID: packet-20260513T141500Z
MODE: IMPLEMENT
```

**Agent Behavior:** Default to PENDING. Ask human for approval before implementing.

---

## 11. Related Contracts

- `.scaffoldai/contracts/ai-tool-access.contract.md` — AI tool interaction model
- `.scaffoldai/contracts/process-profile.contract.md` — Process profiles (PASSIVE/STRICT/DRY_RUN/LIVE)
- `.scaffoldai/contracts/gatekeeper-approval-authority-v0.contract.md` — Gatekeeper recommendation vs approval semantics
- `.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md` — MCP execution_class semantics

---

## 12. Contract Metadata

| Field | Value |
|-------|-------|
| **Version** | v1 |
| **Status** | Active |
| **Created** | 2026-05-13 |
| **Purpose** | Define lightweight approval semantics for execution and commit operations |
| **Implementation** | Documentation only — no runtime enforcement |
| **Scope** | Two approval states: execute, commit |

---

## 13. Evolution and Review

Future versions may add:
- Approval audit logs
- Approval CLI commands
- Timestamped approval records
- Additional approval states (plan, verify, closeout)
- Approval revocation patterns

Changes to this contract require:
- Human approval
- Updated work packet template
- Verification run (`npm run verify:scaffoldai`)
- Version increment (v1 → v2)

---

**End of Contract**
