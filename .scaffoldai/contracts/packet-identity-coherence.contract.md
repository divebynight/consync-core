# ScaffoldAI Packet Identity Coherence Contract

Status: ACTIVE CONTRACT
Packet: define-scaffoldai-packet-identity-coherence.sdc
Date: 2026-05-16

## Purpose

Define authoritative packet identity semantics across intake, activation, claim/release, completion visibility, and cleanup without introducing GUID migration.

## Identity Vocabulary

- immutable packet identity: packet_id in canonical form, derived from accepted durable filename stem (example: my-packet.sdc).
- packet title: human-readable heading from packet markdown first heading line.
- source filename: candidate markdown filename used at intake source path.
- normalized slug: lowercase deterministic slug derived from packet title.
- durable packet filename: canonical accepted artifact under .scaffoldai/packets (example: my-packet.sdc.md).
- active lifecycle reference: runtime pointer surfaces that indicate current in-flight packet_id.
- claim identity reference: claim fields in active-runtime bound to current active packet_id.
- completion identity reference: packet field in packet_completed signals, normalized to packet_id form for comparisons.

## Authority Classes

- authoritative durable surface: .scaffoldai/packets/*.sdc.md
- authoritative transient surfaces: .scaffoldai/state/active-runtime.json, .scaffoldai/state/next-action.md
- append-only observational surfaces: .scaffoldai/state/history.jsonl, .scaffoldai/runtime/mcp/signals.jsonl, .scaffoldai/runtime/mcp/shared-memory.jsonl

Append-only surfaces are never used to mutate or override authoritative lifecycle pointers.

## Coherence Rules

1. intake identity rule
- source filename is non-authoritative after acceptance.
- accepted packet_id and durable packet filename are authoritative identity surfaces.

2. activation coherence rule
- active-runtime in_flight_packet and next-action packet pointer must represent the same packet_id.
- blocked replacement activation must not mutate either surface.

3. claim coherence rule
- claim fields are valid only when an active packet exists.
- claim status is scoped to the active packet_id currently mounted.

4. completion coherence rule
- completion packet references are compared using normalized packet identity (case-insensitive, optional .md suffix stripped).
- completion status filtering must align with active packet_id semantics.

5. cleanup coherence rule
- cleanup may clear transient pointers only when safe preconditions pass.
- cleanup must not delete durable accepted packet artifacts.

6. visibility coherence rule
- readonly visibility/status surfaces should report packet identity consistently with packet_id/durable filename distinction.

## Current Behavior Summary

- packet_id is deterministic from accepted durable filename stem.
- durable filename is deterministic from normalized title slug plus .sdc.md.
- repeated intake with identical normalized content reuses existing durable identity.
- duplicate normalized filename with differing content is rejected.
- activation accepts packet path/filename and now supports normalized packet-id lookup fallback.
- completion status normalizes packet references to packet_id form for matching.

## Known Risks

- duplicate normalized slug from distinct intents remains possible at planning/title layer and currently resolves by rejection rather than lineage linkage.
- no first-class lineage/supersede chain exists yet for repeated packet attempts.
- packet identity is slug-based; this is stable for current scale but not globally collision-proof.
- ambiguous normalized matches are unlikely in default filesystems but now have explicit diagnostics if encountered.

## Recommended Future Identity Model

- keep current slug-based packet_id as operator-facing alias.
- add optional stable opaque packet_uid (GUID/ULID) as additive field in durable packet metadata and runtime pointers.
- preserve backward-compatible activation by packet_id alias while gradually preferring packet_uid for lineage/supersede semantics.
- represent supersede relationships explicitly as immutable metadata edges (supersedes_packet_uid).

## Non-Goals For This Packet

- no MCP write authority beyond bounded inbox candidate submission.
- no autonomous execution behavior.
- no forced migration to GUID identity.
- no lifecycle authority boundary weakening.
