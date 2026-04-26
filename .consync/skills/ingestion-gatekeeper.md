# Ingestion Gatekeeper

Use this workflow when deciding whether external context should enter Consync, and where it should go.

This is for intake and placement only. It is not for broad synthesis, taxonomy expansion, or automatic system rewrites.

## When To Use It

Use this when reviewing:

- a ChatGPT or Copilot conversation worth preserving
- future planning notes
- feature ideas
- process observations
- design direction
- material that may be off-topic or should be rejected

## Inputs

Start from the proposed content itself or a short summary of it.

If the content is long, summarize it first before classifying it.

## Classification Buckets

Classify the content as one of:

- `future_plan`
- `product_direction`
- `process_observation`
- `work_log_candidate`
- `raw_discussion`
- `backlog_item`
- `reject_or_off_topic`

Choose the narrowest bucket that preserves meaning without over-modeling the content.

## Initial Destinations

- `raw_discussion`
  - destination: `.consync/discussions/`
  - use when the content is valuable to keep, but not yet shaped enough for a doc or plan

- `future_plan`
  - destination: `.consync/docs/04_next-steps.md` or `.consync/backlog/`
  - use when the content is clearly about later work, sequencing, or next-step choices

- `product_direction`
  - destination: the smallest relevant product/process doc, or a conservative note in `.consync/discussions/` if placement is still unclear
  - use when the content changes how Consync should behave or be framed

- `process_observation`
  - destination: `.consync/docs/03_work-log.md` or the smallest relevant process doc
  - use when the content describes how the system behaved, what caused friction, or what operators learned

- `work_log_candidate`
  - destination: `.consync/docs/03_work-log.md`
  - use when completed behavior changed and the result should be remembered concisely

- `backlog_item`
  - destination: `.consync/backlog/` or `.consync/docs/04_next-steps.md`
  - use when the content is a concrete candidate task but not current live work

- `reject_or_off_topic`
  - destination: none by default
  - do not write unless the human explicitly overrides

## Decision Rules

1. Read the proposed content or summary.
2. Classify it into one bucket.
3. Choose the most conservative destination that still preserves useful meaning.
4. Ask clarifying questions only if placement is genuinely ambiguous.
5. Ask at most 3 questions.
6. If no clarification is needed, proceed with conservative placement.

## Clarifying Questions Rule

Ask questions only when one of these is true:

- the content could reasonably fit two different durable destinations
- the content appears useful, but it is unclear whether it describes completed behavior or future intent
- the content may be off-topic, but the user may want it preserved intentionally

If the content can safely be preserved as a raw discussion, prefer that over asking unnecessary questions.

## Rejection Guidance

Reject or recommend not adding the content when:

- it is unrelated to Consync or creative workflow continuity
- it is personal, random, or incidental and does not help Consync operations, product direction, or work history
- it would create noise without improving continuity

If rejecting:

- say so plainly
- recommend not adding it
- allow human override if they explicitly confirm they still want it written

## Conservative Placement Rule

When unsure, prefer:

1. `.consync/discussions/` for unshaped but potentially useful material
2. `.consync/docs/04_next-steps.md` for future-oriented planning
3. `.consync/docs/03_work-log.md` only for completed behavior or meaningful process observations

Do not force ambiguous content into a durable process or product doc just to avoid a raw discussion file.

## Output Contract

Return:

- `CLASSIFICATION`
- `DESTINATION`
- `QUESTIONS`, if any
- `ACTION TAKEN`
- `FILES CHANGED`
- `REASON`

## Guardrails

- Do not ingest content automatically without deciding whether it belongs.
- Do not create a complex taxonomy.
- Do not rewrite existing docs broadly.
- Do not write rejected or off-topic content unless the human explicitly overrides.
- Do not treat raw discussion as durable truth unless it is later promoted intentionally.
