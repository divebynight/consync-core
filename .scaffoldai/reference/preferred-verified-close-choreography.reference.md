# Preferred Verified Close Choreography

## Operator Flow for Clean Packet Completion

This document normalizes the preferred sequence for completing a ScaffoldAI packet work cycle with verification evidence and clean git state.

### Sequence: Work → Verify → Closeout → Review → Commit

```
1. WORK PHASE
   └─ Active packet, staged changes, development underway
   └─ Claim owned by human operator
   
2. VERIFY PHASE
   └─ Run: npm run verify:scaffoldai
   └─ Command generates fresh evidence under .scaffoldai/runtime/verify-evidence/
   └─ Operator reviews evidence; tests must PASS
   
3. CLOSEOUT PHASE (with verified flag)
   └─ Run: npm run scaffoldai:close-feature -- --verify-passed
   └─ Wrapper enforces:
      - Workspace must be CLEAN (no modified/untracked files)
      - Verification evidence must be FRESH and VALID
      - Active packet must exist
      - No active claim from other process
   └─ On success: handoff.md written, packet pointer cleared
   
4. REVIEW PHASE
   └─ Operator reviews generated artifacts in .scaffoldai/state/
   └─ Confirms handoff.md contains correct closeout status
   └─ Confirms snapshot.md refreshed with new state
   
5. GIT COMMIT PHASE
   └─ Operator (human) reviews all changes: git status
   └─ Operator stages changes: git add ...
   └─ Operator writes commit message with intent
   └─ Operator commits: git commit -m "..."
   └─ Workspace returns to CLEAN state
   
6. NEXT PACKET
   └─ Run: npm run scaffoldai:intake-latest
   └─ Run: npm run scaffoldai:activate-latest
   └─ Cycle repeats
```

### Why This Sequence

- **Verify first**: Evidence is fresh and deterministic when closeout references it.
- **Clean workspace enforced**: Final state is reproducible; no artifacts leak into next packet.
- **Human git authority preserved**: AI cannot commit; operator owns history and message intent.
- **Fail-closed by default**: All gates closed until explicitly passing verification evidence.
- **Single final commit**: Reduces git history noise; intent is explicit in one message.

### Deviation: Unverified Close (Low-Risk Changes)

If verification is not applicable for the packet (e.g., pure documentation):

```
Run: npm run scaffoldai:close-feature
(without --verify-passed flag)
```

This still enforces clean workspace and writes handoff.md with status PASS, but does not require verification evidence. Use only when the packet scope is documentation-only or verification is explicitly deferred.

### Emergency Escape Hatch: Force Cleanup

If lifecycle state is corrupted or cleanup is blocked:

```
npm run scaffoldai:housekeeping -- force-cleanup
```

This clears active-runtime.json and next-action.md packet pointer while preserving all durable surfaces (packets/, history, signals, handoff). Use only when advised.

### Git Authority Preserved

No lifecycle command performs:
- `git add` (staging is manual)
- `git commit` (committing is manual)
- `git push` (pushing is manual)

All git operations remain under explicit human control.

### Troubleshooting

| Issue | Resolution |
|-------|-----------|
| `close-feature` refuses: "workspace_not_clean" | `git status` to review dirty files; stage/commit or discard before retrying. |
| `close-feature` refuses: "verify_passed_flag_required" | Run `npm run verify:scaffoldai` first, review evidence, then retry with `-- --verify-passed`. |
| Dirty files after close-feature | Files staged by human operator persist until committed; this is expected. |
| Packet pointer not clearing | Ensure handoff.md was written (check .scaffoldai/state/) and has status PASS or FAIL. |
| activate-latest refuses: "workspace_not_clean" | Commit or discard pending changes before activating next packet. |

---

**Updated**: May 2026  
**Scope**: Lifecycle ergonomics hardening  
**Constraint**: Preserves explicit human git authority; fail-closed behavior; no automation.
