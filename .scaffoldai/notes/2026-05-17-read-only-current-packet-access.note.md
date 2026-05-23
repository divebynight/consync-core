# Read-Only Current Packet Access

Date: 2026-05-17
Area: scaffoldai, process, lifecycle, agent-integration
Status: raw-note
Source: discussion

## Note

ScaffoldAI should eventually expose a read-only way to retrieve the currently active packet through both:

- local CLI
- local MCP

This is intended to support future agent ergonomics (Copilot, Codex, other local agents) without granting lifecycle authority.

The packet lifecycle remains authoritative and human-controlled.

## Proposed CLI

```bash
node src/scaffoldai.js scaffoldai packet current
```

Optional:

```bash
node src/scaffoldai.js scaffoldai packet current --content
```

## Proposed MCP

```text
scaffoldai_current_packet
```

Read-only only.

## Desired Behavior

If no packet is active:

- return explicit `no_active_packet`
- do not mutate state
- do not activate work
- do not claim work
- do not alter lifecycle state

If a packet is active:

- return packet id
- return canonical packet path
- return title
- return mode
- return approval state
- optionally return packet content

## Architectural Principle

This improves agent usability while preserving lifecycle authority boundaries.

Agents should be able to:

- discover active work
- read work instructions
- understand current packet scope

Agents should NOT be able to:

- activate packets
- close packets
- mutate lifecycle state
- bypass verification
- bypass human authority

## Important Constraint

The packet lifecycle remains the trust boundary.

Higher-level planners, streams, expo systems, or agents may coordinate work, but packet lifecycle authority stays local and explicit.

## Possible Future Use

Could become:

- small process packet
- MCP ergonomics improvement
- standard agent bootstrap flow
- future planner/expo integration primitive