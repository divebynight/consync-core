# Marker Capture Resume Context

## Current State

- .consync/artifacts/05_marker-capture.md is created
- Feature is defined but NOT implemented
- Scope is intentionally minimal
- Consync process is being followed

---

## Resume Point

Next step:

Implement the `mark` command (ONLY)

Do not expand beyond this.

---

## Mental Model

This is NOT:
- a full system
- behavioral tracking
- automation
- analysis

This IS:
- a tiny signal capture tool

---

## Core Constraint

Do not add:
- timing
- sessions
- pattern detection
- UI
- extra metadata

Only implement what exists in the doc.

---

## Target Interaction

m "note here"

Then:

Attach files? (y/n)

If yes:
- accept file paths
- loop until user says no

Save marker
Exit immediately

---

## When Ready

Say:

GOBACKMARKER

This will trigger:
- implementation packet (SDC)
- test plan
- integration into consync-core

---

## Notes

- Ideas that come up later should NOT be implemented yet
- Keep everything minimal until real usage exists
- Focus on capturing signal, not building structure

---

## Goal

Create the smallest possible working version
that can be used during a real creative session