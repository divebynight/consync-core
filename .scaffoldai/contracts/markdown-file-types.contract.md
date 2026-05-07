# Markdown File Types Contract

## Purpose

Define a small suffix convention for Markdown files so their role is clear at a glance.

This contract guides future naming. It does not require immediate renames.

Related ownership boundary:
`.scaffoldai/contracts/bridge-ownership.contract.md`

## Role Suffixes

- `*.agent.md` — agent role or behavior definition
- `*.contract.md` — enforceable rule, invariant, boundary, or interface
- `*.process.md` — active operating procedure or workflow
- `*.template.md` — reusable fill-in template
- `*.plan.md` — future planning, ideas, unresolved direction
- `*.reference.md` — inventory, map, explanatory reference, or supporting context
- `*.log.md` — append-only historical record

## Special Entry Files

These existing entry files may keep their current names:

- `README.md`
- `AGENTS.md`
- `START_HERE.md`
- `current-system.md`

## Adoption Rules

- Existing files do not need to be renamed immediately.
- New Markdown files should use the suffix convention when practical.
- Renames should happen slowly, only in small verified packets.
- Heavily referenced files should not be renamed without a reference audit.
