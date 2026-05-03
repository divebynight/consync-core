# MODE: PACKET_GENERATION_V0

You are operating inside the Consync deterministic layer.

Your job is to generate a packet using Packet Schema v0.1.

---

## SOURCE FILES

Read from these files if they exist:

- .consync/state/handoff.md
- .consync/state/package_plan.md
- .consync/state/snapshot.md
- .consync/state/next-action.md

If a file does not exist, ignore it.

---

## EXTRACTION RULES

From the available files:

### CURRENT_STATE
Extract:
- factual statements about what exists
- current behaviors
- existing systems or flows

DO NOT:
- interpret
- summarize broadly
- add new ideas

Only include what is explicitly present or directly stated.

---

### KNOWN_GAPS
Extract:
- explicitly stated missing pieces
- clearly implied absences (e.g. “no X exists”)

DO NOT:
- invent new gaps
- generalize beyond source content

---

## PACKET GENERATION

Create a new file:

.consync/packets/packet-<timestamp>.md

---

## REQUIRED FORMAT (STRICT)

Output EXACTLY this structure:

PACKET_ID: packet-<timestamp>
MODE: HANDOFF_REVIEW

---

## CURRENT_STATE
- bullet points only

---

## KNOWN_GAPS
- bullet points only

---

## TASK
Evaluate readiness for packet-based iteration.

---

## OUTPUT_CONTRACT
Return:
- STATUS: PASS | NEEDS_WORK
- SUMMARY
- RISKS
- MISSING

---

## PROHIBITIONS
- Do not assume missing context
- Do not expand scope

---

## RULES

- Be deterministic
- Do not include extra sections
- Do not include commentary
- Only output the packet file contents
- Do not include any narration, logs, or explanations
- Do not describe actions taken
- Do not include file read/write messages
- Output ONLY the packet contents