# Next Action — Portable Scaffold v0

## Status
- READY
- New feature packet
- Scoped to a minimal portable workflow scaffold
- Do not expand into a package manager flow or generalized template engine

## Objective
Add a minimal portable scaffold flow so this repo can install a small Consync workflow starter into another project.

This packet should create:
- a curated portable template source inside this repo
- a CLI command that copies that template into a target directory
- safe default behavior that does not overwrite existing files unless explicitly forced

This is **not** a full export of the repo.
This is **not** automatic generation from live runtime state.
This is a curated, explicit portable subset.

## Target Outcome

A command like:

```bash
node src/index.js portable --target /path/to/other-repo
```

should scaffold a minimal workflow starter into the target repo.

## Portable Scope v0

### Include only this minimal working unit

```text
.consync/
  state/
    handoff.md
    next-action.md
  docs/
    current-system.md

.github/
  prompts/
    run_next_action.prompt.md
    run_closeout.prompt.md
```

### Do NOT include yet
- full `.consync/artifacts/`
- plans
- event logs
- sandbox fixtures
- verify expectations
- generator-from-live-state logic
- package publishing / npx flow
- config system unless truly required

## Required Implementation

### 1. Add Curated Portable Template Source

Create a dedicated template directory in this repo:

```text
.consync/templates/portable/
  .consync/
    state/
      handoff.md
      next-action.md
    docs/
      current-system.md
  .github/
    prompts/
      run_next_action.prompt.md
      run_closeout.prompt.md
```

Rules:
- Template files should be intentionally curated
- Do not point the command at live working files directly
- If copying from current files as a starting point, create dedicated template copies and treat them as the scaffold source

### 2. Add Portable CLI Command

Add a new command surface for:

```bash
node src/index.js portable --target /path/to/target
```

Required behavior:
- require a target path
- verify the target directory exists
- create missing directories inside the target
- copy the curated portable template files into the target
- skip existing files by default
- support `--force` to overwrite existing scaffolded files
- print a clear summary of:
  - target path
  - files created
  - files skipped
  - files overwritten (when `--force` is used)

Optional but acceptable:
- `--dry-run`

Do not overbuild the CLI UX.

### 3. Keep the Command Conservative

The command should:
- only copy the curated template subset
- never delete files from the target
- never attempt to infer project type
- never mutate unrelated target files
- fail clearly if `--target` is missing or invalid

### 4. Update Docs Lightly

Update docs only where needed so the new command is discoverable:
- `README.md`
- maybe `.consync/docs/current-system.md` if command surface is documented there

Keep doc updates concise.

## Suggested Technical Shape

Use a dedicated source path such as:

```text
.consync/templates/portable/
```

and implement the command so it copies from that template tree recursively into the target repo.

If useful, add a small shared copy helper rather than embedding copy logic inline.

## Verification Requirements

Please verify with a real scratch target directory.

### Suggested checks
1. Create or use an empty scratch directory
2. Run:
   ```bash
   node src/index.js portable --target /path/to/scratch
   ```
3. Confirm the target now contains:
   - `.consync/state/handoff.md`
   - `.consync/state/next-action.md`
   - `.consync/docs/current-system.md`
   - `.github/prompts/run_next_action.prompt.md`
   - `.github/prompts/run_closeout.prompt.md`
4. Run the command a second time without `--force` and confirm existing files are skipped rather than overwritten
5. Run with `--force` and confirm scaffold files are overwritten cleanly
6. Confirm no unrelated files in the target are touched

## Expected Deliverables
- curated portable template directory
- new `portable` CLI command
- any small helper(s) required for copying
- light doc updates
- handoff describing behavior and verification

## Human Verification
1. Inspect `.consync/templates/portable/` and confirm it contains only the minimal portable subset, not a dump of the full repo state.
2. Run the portable command against a scratch directory and confirm the expected five scaffold files are created in the correct locations.
3. Run the command again without `--force` and confirm it reports skips rather than overwriting.
4. Run with `--force` and confirm overwrites happen only for scaffolded files.
5. Review the diff and confirm this packet adds a portable scaffold flow rather than refactoring unrelated command behavior.

## Notes
This packet is about making the workflow portable in the smallest honest way.

Key guardrail:
- the portable scaffold must come from a curated template source
- not from scraping or exporting the live repo automatically

Keep it boring, safe, and useful.
