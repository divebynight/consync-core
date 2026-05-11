# CONTRIBUTING

Thank you for contributing to Consync + ScaffoldAI.

This repository explores governed AI-assisted systems, deterministic workflows, and human-supervised development patterns.

The project intentionally favors:
- explicit operational boundaries
- observable execution
- deterministic verification
- advisory-first systems
- human approval over autonomous orchestration

Please keep those principles in mind when contributing.

---

# Core Workflow Philosophy

AI tools may assist with:
- planning
- implementation
- verification
- documentation
- architectural exploration

But:

> Humans approve, commit, and push.

This repository intentionally avoids:
- hidden execution
- unrestricted autonomy
- implicit approval semantics
- uncontrolled multi-agent orchestration

---

# Before Starting Work

Recommended preflight:

```bash
npm run scaffoldai:preflight
npm run scaffoldai:status
```

Before larger changes, review:
- `README.md`
- `.scaffoldai/README.md`
- relevant contracts/process docs

---

# Verification Expectations

Before committing:

```bash
npm run verify
```

For runtime/product changes:

```bash
npm run verify:consync
```

For ScaffoldAI/process changes:

```bash
npm run verify:scaffoldai
```

For Electron or renderer changes:

```bash
npm run test:e2e
```

For broader confidence checks:

```bash
make repo-test
```

Optional full audit:

```bash
make repo-full-audit
```

---

# Commit Prefixes

This repository uses lightweight commit prefixes for clarity and operational readability.

## Prefixes

| Prefix | Meaning |
|---|---|
| `feature:` | New user-visible or runtime capability |
| `fix:` | Bug fix or behavioral correction |
| `docs:` | Documentation or conceptual clarification |
| `process:` | Workflow, governance, or operational-process changes |
| `task:` | Focused implementation work packet |
| `chore:` | Maintenance, cleanup, or repository hygiene |
| `test:` | Test-only additions or adjustments |
| `refactor:` | Structural/internal improvement without intended behavior change |

## Examples

```text
feature: add MCP verification surface
fix: correct preload bridge validation
docs: reframe repository architecture
process: tighten approval boundaries
chore: sanitize repo-local paths
test: expand scaffoldai verification coverage
refactor: simplify runtime status aggregation
```

---

# Repository Hygiene

Please avoid committing:
- local machine paths
- personal editor settings
- generated output artifacts
- temporary logs
- tunnel/session URLs
- machine-specific configuration

Examples:
- `.vscode/`
- `.DS_Store`
- temporary verification output
- local runtime logs

Use portable paths in documentation:
- `<repo-root>`
- `~/Projects/consync-core`
- relative paths

---

# Architectural Boundaries

Important conceptual boundaries:

## ScaffoldAI

ScaffoldAI is:
- the governance/process layer
- verification/runtime structure
- MCP/process experimentation
- deterministic workflow infrastructure

ScaffoldAI is NOT:
- the Consync runtime product
- an unrestricted agent framework
- an autonomous orchestration engine

## Consync

Consync is:
- the runtime application
- the creative tracking/product layer
- the implementation target used to pressure-test ScaffoldAI

---

# Historical Material

`repo-archive/` contains:
- historical artifacts
- superseded experiments
- prior planning material

It is not considered authoritative runtime architecture.

Avoid introducing new active dependencies on archived material.

---

# AI Tool Compatibility

This repository is intentionally structured for:
- humans
- ChatGPT
- Copilot
- Codex
- MCP clients
- future AI-assisted tooling

Please favor:
- discoverable structure
- explicit naming
- layered documentation
- deterministic operational behavior

Over:
- hidden assumptions
- implicit runtime behavior
- opaque orchestration

---

# Final Principle

This repository is exploratory but operational.

Favor:
- clarity over cleverness
- observability over magic
- explicitness over inference
- governance over uncontrolled autonomy