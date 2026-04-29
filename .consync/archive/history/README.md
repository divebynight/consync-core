# State History

- `.consync/state/next-action.md` is a live execution slot and may be replaced during closeout.
- `.consync/state/handoff.md` is the live result contract for the most recently completed package.
- Before replacing `next-action.md`, preserve the executed package instruction under `.consync/state/history/` so prior execution state remains reconstructible from repo files alone.
- Use `.consync/state/history/plans/` for executed package instructions unless a narrower history location is explicitly introduced later.
- Keep history artifacts human-readable and minimal; define the rule now without adding automation.