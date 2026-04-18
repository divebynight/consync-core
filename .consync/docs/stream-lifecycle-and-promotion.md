# Stream Lifecycle And Promotion

This is the current minimal reference for when something should become a real stream and how streams should deepen, pause, finish, or decay.

## Stream Promotion Rule

An idea, note, or thread becomes a real stream only when at least one of these is true:

- it has its own active or paused work packet
- it has a distinct goal that can continue independently
- losing its current state would be costly
- it needs its own handoff and resume loop

Not every idea becomes a stream. Small notes can stay lightweight until they prove they need independent continuity.

## Earned Structure Rule

Every stream starts with the tiny core and earns more structure only when it is needed.

Extra files such as `package_plan.md` should appear only when the stream has enough iterations, branching, coordination, or consequence to justify them. More gravity should produce more structure, not more speculation.

## Lifecycle States In Practice

- `new` — the stream is identified but not shaped enough to run.
- `ready` — the stream is defined well enough to pick up when it becomes relevant.
- `active` — the stream is the current focus.
- `paused` — the stream stopped at a clean point and can resume later.
- `blocked` — the stream cannot continue until a specific blocker is resolved.
- `complete` — the stream has reached its intended stopping point for now.

Over time a stream may move through several of these states more than once before it is complete.

## Low-Gravity And Decay Handling

Not everything should live forever as active structure.

If a stream stalls, it should eventually be reviewed. The user can keep it, merge it into another stream, archive it, or let it decay if it no longer deserves active attention.

The goal is to keep the system legible, not to preserve every paused thread forever.

## Consistency Across Scales

Consync prefers repeating patterns across projects, streams, packages, and sessions.

The structures do not need to be identical at every level, but they should feel recognizable enough that moving between scales does not require relearning the workflow.