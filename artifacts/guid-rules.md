# GUID Rules (v1)

## Definition
A GUID artifact is named `<guid>.json`.

## Location
GUID artifacts live under `sandbox/current/` and may exist in nested directories.

## Uniqueness
GUIDs must be unique within `sandbox/current/`.
Multiple matches are an error.

## Resolution
Recursive lookup is the current resolution behavior.

## Indexing
There is no central index or registry.

## Stability
Filename identity is stable and content may evolve later.