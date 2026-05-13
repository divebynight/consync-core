# .scaffoldai/tmp/

Role: ephemeral runtime and diagnostic artifacts

---

## Purpose

`.scaffoldai/tmp/` contains **temporary runtime, verification, and diagnostic artifacts**.

All contents are:
- **Non-authoritative** — Does not contain operational state
- **Ephemeral** — Safe to delete at any time
- **Gitignored** — Contents excluded from version control (except `.gitkeep`)

---

## Taxonomy

| Category | Description | Examples |
|----------|-------------|----------|
| **Verification Logs** | Test and verify command output | `verify_sai.log`, `verify_all.log` |
| **Runtime Snapshots** | Generated read-only observation bundles | `mcp-runtime-snapshot.json` |
| **Diagnostic Signals** | Bounded append-only presence/capability signals | `mcp-signals.jsonl` |
| **Debug Output** | Command execution traces and diagnostics | Various `.log` files |

---

## Key Properties

**Safe to delete:** ✅ Always  
**Authoritative:** ❌ Never  
**Gitignored:** ✅ Yes (contents excluded, directory tracked via `.gitkeep`)  
**Bounded:** ✅ MCP signals have size/rate limits to prevent unbounded growth  

---

## Common Artifacts

### Verification Logs

```
verify_sai.log              # ScaffoldAI verification output
verify_sai_history.log      # ScaffoldAI verification with history tests
verify_all.log              # Full verification output
```

**Purpose:** Capture verification command output for debugging or evidence collection

**Lifecycle:** Overwritten on each verification run

### Runtime Snapshots

```
mcp-runtime-snapshot.json   # Generated MCP observation bundle
```

**Purpose:** Read-only snapshot of ScaffoldAI status for paste/upload into AI clients

**Lifecycle:** Generated on-demand via `npm run scaffoldai:mcp:snapshot`

### Diagnostic Signals

```
mcp-signals.jsonl           # MCP client presence/capability signals
```

**Purpose:** Bounded append-only log for MCP client presence and diagnostic signals

**Properties:**
- Append-only JSON Lines format
- Size and rate limited (bounded)
- Non-authoritative (does not participate in decisions)
- Safe to delete

**Execution class:** `LOCAL_SIGNAL_APPEND_ONLY`

See: MCP read-only surface documentation

---

## Gitignore Pattern

```gitignore
.scaffoldai/tmp/*
!.scaffoldai/tmp/.gitkeep
```

**Directory structure tracked, contents ignored.**

The `.gitkeep` file ensures the directory exists in git, but all other contents are excluded.

---

## Boundary with Other Artifacts

| Location | Purpose | Authoritative | Gitignored |
|----------|---------|---------------|------------|
| `.scaffoldai/state/` | Current operational state | ✅ Yes | Partial |
| `.scaffoldai/state/history.jsonl` | State transition audit trail | ❌ No (observational) | ✅ Yes |
| `.scaffoldai/streams/` | Stream identity and continuity | ✅ Yes (metadata) | Partial |
| `.scaffoldai/packets/` | Archived completed work | ❌ No (archive) | ✅ Yes |
| **`.scaffoldai/tmp/`** | **Ephemeral runtime artifacts** | **❌ No** | **✅ Yes** |

**Clear rule:** If it's operational state, it belongs in `.scaffoldai/state/`, not `.scaffoldai/tmp/`.

---

## Hard Rule: No /tmp Usage

**NEVER write to `/tmp`, `/var/tmp`, `~/`, `~/Desktop`, `~/Downloads`, or any path outside the repo root.**

All temporary output, logs, and runtime artifacts must target `.scaffoldai/tmp/` within the repository.

This ensures:
- Predictable artifact locations
- Proper gitignore coverage
- No system-wide temp pollution
- Clear project boundaries

See: `.github/copilot-instructions.md` — Temp and Runtime Artifact Boundary

---

## Cleanup

**Manual cleanup:** Delete contents when needed to reclaim space

**No automatic cleanup:** Verification logs may accumulate; human decides when to clean

**Safe operation:**
```bash
# Safe: Remove all temporary artifacts
rm -f .scaffoldai/tmp/*.log .scaffoldai/tmp/*.json .scaffoldai/tmp/*.jsonl

# Safe: Remove everything except .gitkeep
find .scaffoldai/tmp -type f ! -name '.gitkeep' -delete
```

**Never delete the directory itself** — it's tracked in git for structure.

---

## Test Outputs at Repo Root

**Note:** Some test output files exist at repo root for historical reasons:
- `output.txt`
- `verification_output.txt`
- `verify-run-files.txt`

These are gitignored individually by filename. **Future test outputs should target `.scaffoldai/tmp/` instead** for consistency with the established boundary.

---

## Related Documentation

- `.scaffoldai/state/history.md` — Append-only state transition history
- `.scaffoldai/streams/README.md` — Stream metadata and work continuity
- `.scaffoldai/packets/README.md` — Archived work packets
- `.github/copilot-instructions.md` — Temp and Runtime Artifact Boundary section
