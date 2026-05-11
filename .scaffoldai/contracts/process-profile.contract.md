# ScaffoldAI Process Profile Contract v0

**Status:** Active  
**Purpose:** Define interaction and execution modes for AI tool governance  
**Authority:** Advisory only — no enforcement, hooks, or runtime interception  
**Configuration Surface:** Startup environment variable only  

---

## Contract Identity

This contract defines the process profiles that govern how AI tools interact with ScaffoldAI-managed repositories.

A **process profile** combines an **interaction mode** and an **execution mode** to define the governance boundary and execution authority for AI tool actions.

---

## Interaction Modes

Interaction modes define the **governance boundary** — how AI tools must interact with the ScaffoldAI process before performing repository mutations.

### PASSIVE

**Definition:** AI pauses before mutation and asks whether to continue through ScaffoldAI or bypass.

**Behavior:**
- AI tool displays the ScaffoldAI ACK block before any repository file mutation
- Human answers: continue through ScaffoldAI (option 1) or bypass (option 2)
- AI proceeds according to human's choice
- Request-scoped — applies to the current request only

**Use Case:** Default development mode with advisory pause gate.

### STRICT

**Definition:** AI must route through ScaffoldAI process before mutation unless explicit request-scoped bypass is given.

**Behavior:**
- AI tool must use ScaffoldAI process surfaces (MCP tools, runtime commands, or utilities)
- Human may grant request-scoped bypass by explicitly stating "bypass ScaffoldAI for this request"
- Without bypass, AI must not perform direct file mutations
- Protected state rules still apply even with bypass

**Use Case:** Enforced governance mode for A-to-Z process testing or critical work.

### BYPASS

**Definition:** ScaffoldAI governance is bypassed for the current request, but protected state rules still apply.

**Behavior:**
- AI tool may perform direct repository file mutations
- AI tool must still respect protected state boundaries (`.scaffoldai/state/`, `.scaffoldai/streams/`, `.scaffoldai/packets/`)
- AI tool should still use MCP tools for ScaffoldAI observations when available
- Request-scoped — applies to the current request only

**Use Case:** Direct work mode when ScaffoldAI process overhead is not needed.

---

## Execution Modes

Execution modes define the **execution authority** — whether actions may perform real changes or must remain simulated.

### LIVE

**Definition:** Approved actions may perform real repository changes.

**Behavior:**
- File mutations, state changes, and git operations are allowed when approved
- MCP tools may report real state changes
- Responses may use past-tense action language when real changes occurred
- Standard mode for development work

**Use Case:** Normal development and production work.

### DRY_RUN

**Definition:** Actions must not perform real repository changes or authoritative state mutation.

**Behavior:**
- File mutations, state changes, and git operations must be simulated
- MCP tools must return simulated observations with `execution_class: "DRY_RUN_SIMULATION"`
- Responses must use "would" language:
  - "would create"
  - "would update"
  - "would recommend"
  - "would block"
  - "would close out"
- Responses must not claim real changes occurred
- Used for testing process flows without side effects

**Use Case:** Testing ScaffoldAI A-to-Z process flows, training, or dry-run validation.

---

## Approved Process Profiles

Process profiles are **startup/config concepts**, not MCP-settable runtime switches.

Profiles are set via the `SCAFFOLDAI_PROCESS_PROFILE` environment variable.

### DEFAULT_DEV

**Interaction Mode:** PASSIVE  
**Execution Mode:** LIVE  

**Description:** Default development mode with advisory pause gate.

**Behavior:**
- AI pauses before mutations and asks whether to continue through ScaffoldAI or bypass
- Real changes allowed when approved
- No enforcement — purely advisory

**Use Case:** Standard local development work.

---

### PROCESS_TEST

**Interaction Mode:** STRICT  
**Execution Mode:** DRY_RUN  

**Description:** Simulated A-to-Z process testing mode.

**Behavior:**
- AI must route through ScaffoldAI process surfaces
- No real file mutations or state changes allowed
- All responses use "would" language
- Used to test process flows without side effects

**Use Case:** Testing the full ScaffoldAI process loop before building enforcement or automation.

---

### FULL_GOVERNED

**Interaction Mode:** STRICT  
**Execution Mode:** LIVE  

**Description:** Enforced governance mode with real changes.

**Behavior:**
- AI must route through ScaffoldAI process surfaces
- Real changes allowed when approved through process
- Human may grant request-scoped bypass explicitly

**Use Case:** Critical work requiring enforced process discipline.

---

### DIRECT_WORK

**Interaction Mode:** BYPASS  
**Execution Mode:** LIVE  

**Description:** Direct work mode bypassing ScaffoldAI governance.

**Behavior:**
- AI may perform direct repository mutations
- Protected state boundaries still enforced
- MCP tools available for observation but not required for actions

**Use Case:** Quick fixes, experiments, or work where process overhead is not justified.

---

## Configuration

### Startup Environment Variable

**Variable Name:** `SCAFFOLDAI_PROCESS_PROFILE`

**Allowed Values:**
- `DEFAULT_DEV`
- `PROCESS_TEST`
- `FULL_GOVERNED`
- `DIRECT_WORK`

**Default:** `DEFAULT_DEV`

**Resolution:** Profile is resolved at startup (MCP server start, CLI invocation, etc.) and remains fixed for that session.

**No Runtime Switching:** Profiles are not MCP-settable runtime switches. To change profile, restart with a different environment variable value.

---

## Profile Resolver Response Shape

Profile resolution utilities should return:

```javascript
{
  profile: "DEFAULT_DEV",           // Profile name
  interaction_mode: "PASSIVE",      // Interaction mode
  execution_mode: "LIVE",           // Execution mode
  dry_run: false,                   // Boolean: execution_mode === "DRY_RUN"
  live: true,                       // Boolean: execution_mode === "LIVE"
  bypass: false,                    // Boolean: interaction_mode === "BYPASS"
  strict: false,                    // Boolean: interaction_mode === "STRICT"
  passive: true                     // Boolean: interaction_mode === "PASSIVE"
}
```

---

## MCP/Status Surface Integration

All ScaffoldAI MCP tools should include profile information in their responses:

```javascript
{
  tool: "scaffoldai_status",
  execution_class: "READ_ONLY",
  profile: "DEFAULT_DEV",
  interaction_mode: "PASSIVE",
  execution_mode: "LIVE",
  // ... existing fields
}
```

This allows AI tools to observe the active profile and adapt their behavior accordingly.

---

## Protected State Boundaries

Regardless of profile, AI tools **must not** directly mutate:

- `.scaffoldai/state/` — live loop state
- `.scaffoldai/streams/` — per-stream state
- `.scaffoldai/packets/` — completed work packet archive

Direct state-file mutation is **not** a fallback path in any profile.

---

## What This Contract Does NOT Include

This contract does **NOT** add:

- Enforcement hooks or interception
- Git hooks or commit guards
- Automatic orchestration or agent dispatch
- MCP tools for setting/changing profiles at runtime
- Shell execution authority
- Deployment authority
- Autonomous decision-making
- Background processes or watchers

Process profiles are **descriptive**, not **prescriptive**. They inform AI tool behavior through advisory contracts, not enforcement mechanisms.

---

## Future Evolution

This is v0 of the Process Profile contract. Future versions may add:

- Additional interaction modes (e.g., GUIDED, SUPERVISED)
- Additional execution modes (e.g., SHADOW, AUDIT)
- Additional profiles (e.g., REVIEW_ONLY, PAIR_PROGRAMMING)
- Per-agent profile overrides
- Profile validation and testing utilities

Changes require explicit contract version updates and migration paths.
