# SDC — Add ScaffoldAI Lifecycle Convenience Wrappers

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI CLI lifecycle orchestration and operator ergonomics

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Reduce operator friction during normal ScaffoldAI workflow execution without expanding authority boundaries or weakening deterministic lifecycle enforcement.

The current lifecycle primitives are intentionally explicit and safe, but repeated packet intake, activation, closeout, and cleanup operations require operators to manually discover packet names and repeatedly type exact lifecycle commands.

This packet should add deterministic convenience wrappers that reduce human error while preserving the existing fail-closed lifecycle model.

BACKGROUND:
Current lifecycle primitives are working correctly:
- packet intake
- packet activation
- verification gating
- closeout
- cleanup
- duplicate/pending guards
- lifecycle ordering enforcement
- bounded MCP proposal submission

However, operators currently must manually type exact candidate and packet identities.

The desired improvement is not authority expansion.

The desired improvement is:
- deterministic wrapper commands
- lifecycle-aware convenience behavior
- clearer operator guidance
- safer command composition
- reduced cognitive overhead

while preserving:

```text
Remote Proposal, Local Lifecycle
```

and preserving all existing lifecycle invariants.

TASKS:
1. Add deterministic latest-candidate resolution.

Implement canonical logic for resolving:
- latest valid inbox candidate
- latest intake-compatible candidate
- active packet identity

Resolution behavior must be deterministic and fail-closed.

2. Add lifecycle convenience wrappers.

Add explicit human-invoked wrapper commands such as:
- `scaffoldai:intake-latest`
- `scaffoldai:activate-latest`
- `scaffoldai:start-latest`
- `scaffoldai:close-feature`

Wrapper commands must only compose existing local lifecycle primitives.

3. Preserve explicit primitive lifecycle commands.

Do NOT remove or weaken:
- packet intake
- packet activate
- closeout
- cleanup
- explicit packet targeting

Wrappers must compose existing primitives rather than bypass them.

4. Add fail-closed wrapper behavior.

Wrappers must refuse operation when:
- multiple ambiguous candidates exist
- another packet is active
- verification evidence is missing
- cleanup preconditions are unmet
- lifecycle ordering would be violated
- packet identity resolution is ambiguous

5. Improve operator guidance.

Wrappers and lifecycle commands should emit clearer guidance including:
- resolved packet identity
- next safe action
- lifecycle readiness state
- verification readiness
- cleanup readiness
- explicit refusal reasons

6. Add one-domain-at-a-time enforcement.

After the ScaffoldAI/Consync reorganization boundary is complete:
- ScaffoldAI process work and Consync product work must not coexist within the same active lifecycle context.
- lifecycle/domain boundary violations must fail closed.

Implement only the enforcement scaffolding necessary for the current architecture phase.

7. Preserve authority boundaries.

Wrappers must NOT:
- add MCP lifecycle authority
- add remote execution authority
- add remote cleanup/closeout authority
- add git authority
- bypass verification gates
- bypass cleanup gates

8. Add verification coverage.

Add deterministic tests for:
- latest candidate resolution
- ambiguous candidate handling
- wrapper fail-closed behavior
- wrapper ordering enforcement
- close-feature behavior
- cleanup gating
- one-domain-at-a-time enforcement behavior

9. Documentation updates.

Document:
- lifecycle wrapper behavior
- deterministic resolution rules
- fail-closed behavior
- operator workflow examples
- lifecycle/domain boundary expectations

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also verify or document evidence for:
- deterministic latest-candidate resolution
- ambiguous candidate refusal behavior
- explicit primitive preservation
- wrapper fail-closed behavior
- verification-gated closeout behavior
- cleanup gating behavior
- one-domain-at-a-time enforcement behavior
- no authority expansion
- no MCP lifecycle mutation authority
- no git authority expansion

OUTPUT:
Return:
1. files changed
2. wrapper commands added
3. lifecycle resolution behavior
4. ambiguity handling behavior
5. fail-closed wrapper behavior
6. close-feature orchestration behavior
7. one-domain-at-a-time enforcement behavior
8. verification result
9. remaining risks/gaps

CONSTRAINTS:
- no MCP lifecycle authority expansion
- no remote execution authority
- no remote cleanup authority
- no git authority
- no bypass of verification requirements
- no bypass of cleanup requirements
- no weakening of explicit lifecycle primitives
- preserve deterministic lifecycle ordering
- preserve packet identity coherence
- preserve fail-closed behavior
- preserve human-controlled commits
