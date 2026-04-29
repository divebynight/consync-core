# Consync Product Model

Captured: 2026-04-27
Packet: `concept-board-product-model-v1`
Mode: docs-only product model capture

This document captures the target product model for Consync without renaming
existing app terms, changing UI, or refactoring code.

## Product Frame

Consync is a searchable concept and file reference board: PureRef for concepts
and file paths.

It helps a person gather scattered creative material into a local board of
ideas, files, notes, tags, bookmarks, and relationships. The filesystem remains
the source of the original files. Consync stores lightweight context around
those files so the person can remember what mattered, why it mattered, and how
pieces relate.

The board should support both loose capture and intentional organization:

- Capture an item now, even if it does not belong anywhere yet.
- Attach the item to an idea later.
- Add notes, tags, and links without moving the original file.
- Search across remembered material by concept, file path, note text, tag, or
  relationship.
- Keep all data local unless the user chooses to share or export something.

## Core Objects

### Idea

An Idea is an optional conceptual anchor.

Examples:

- "FIL arrangement notes for song 3"
- "Jen book research on family recipes"
- "Mark visual direction for the winter video"

An Idea groups related Items, Notes, Tags, Links, and Bookmarks. It should not
be required before capture. A user can collect Items first and attach them to an
Idea later.

An Idea is durable product context, not just app activity.

### Session

A Session is a temporary working context.

It represents a period of capture or review: listening to an audio file, sorting
research, reviewing a folder, or gathering references. A Session can produce or
touch Items, Notes, Bookmarks, Tags, and Links.

A Session may be associated with an Idea, but it is not the same thing as an
Idea. Sessions are useful for continuity and recent activity. Ideas are useful
for meaning and organization.

Recommended direction:

- Keep Session as an internal or secondary product concept.
- Avoid making every Session a default Idea.
- Let Sessions attach to Ideas when the user intentionally organizes work.
- Let Items created in a Session remain unattached until the user assigns them.

### Item

An Item is the base unit of remembered material.

An Item can be:

- a local file path
- a folder path
- a standalone note
- a captured reference to a moment inside a file
- a future external reference, if the product later supports that

Items can exist without Ideas. This is important for quick capture: the user
should not have to decide the final structure before saving something useful.

### Note

A Note is user-written context.

Notes can describe:

- an Item
- an Idea
- a Session
- a Link
- a Bookmark

Notes may be general, time-based, or file-specific. The current audio note flow
already fits this model: a timestamp note is a Note attached to a Bookmark or
Item moment, while a file note is a Note attached to a file Item.

### Tag

A Tag is a lightweight label for grouping and retrieval.

Tags should stay simple. They are useful for cross-cutting labels that should
not require a new Idea:

- `chorus`
- `check-later`
- `quote`
- `visual-reference`
- `needs-export`

Tags can apply to Ideas, Items, Notes, Links, Sessions, or Bookmarks.

### Link

A Link is an explicit relationship between two objects.

Most commonly, Links connect Items:

- this audio moment relates to this lyric note
- this book quote supports this research Idea
- this reference image matches this video draft
- this folder belongs with this project Idea

Links should be durable only when intentionally created or confirmed. Search
results and nearby folder structure can suggest relationships, but suggestion is
not the same as a saved Link.

### Bookmark

A Bookmark is a remembered location inside an Item.

For audio, a Bookmark is a timestamp. For a document, it might later be a page,
paragraph, section, or selection. For a folder, it might be a highlighted file
or subfolder. A Bookmark can have Notes and Tags.

Current timeline markers map naturally to Bookmarks.

## Idea And Session Relationship

Idea and Session should remain distinct:

| Concept | Meaning | Lifetime | User-facing priority |
| --- | --- | --- | --- |
| Idea | A meaningful creative/research anchor | durable | primary |
| Session | A period of capture, review, or activity | temporary/recent | secondary |

An Idea can contain many Sessions. A Session can touch many Items. Items can
exist before they belong to an Idea.

Preferred relationship:

```text
Idea
  -> Items
  -> Notes
  -> Tags
  -> Links
  -> Sessions

Session
  -> recently opened Items
  -> Notes created during the session
  -> Bookmarks created during the session
  -> optional Idea association
```

This preserves the current session-based implementation while giving the
product a cleaner long-term user model.

## User Workflows

### FIL Audio Arrangement Workflow

Primary need:

Listen to audio, mark important moments, and remember arrangement ideas without
losing the file path or timestamp.

Model fit:

- Idea: arrangement, song, or setlist concept
- Session: one listening/review pass
- Item: the MP3/audio file
- Bookmark: timestamped moment in the audio
- Note: arrangement thought, issue, cue, or reminder
- Tag: `intro`, `verse`, `chorus`, `fix`, `favorite`
- Link: connect an audio timestamp to a lyric note, alternate take, or related
  file

Existing audio features are directly useful here. The main product shift is to
make them feel like a reference board, not only an audio session log.

### Jen Research / Book Workflow

Primary need:

Collect research materials, quotes, references, drafts, and reminders while
keeping their source paths clear.

Model fit:

- Idea: chapter, theme, question, or research thread
- Session: one research or writing pass
- Item: PDF, text file, image, folder, source note, or standalone note
- Bookmark: page/section/quote location in a document, if supported later
- Note: summary, quote context, question, or follow-up task
- Tag: `source`, `quote`, `recipe`, `family-story`, `verify`
- Link: connect a quote to a chapter Idea, connect an image to a story note, or
  connect multiple source files

Simple capture matters more than precision at first. Jen should be able to save
the path, write the reason it matters, and find it again.

### Mark Creative Media Workflow

Primary need:

Track visual/audio/video references, drafts, exports, and fragments across
folders without forcing immediate project cleanup.

Model fit:

- Idea: video direction, concept board, scene, client/project thread, or mood
- Session: one review, capture, or sorting pass
- Item: image, video, audio, folder, draft, export, or note
- Bookmark: moment in video/audio or selected reference point
- Note: why the item matters, what to reuse, what to change
- Tag: `texture`, `color`, `draft`, `export`, `sound`, `reference`
- Link: connect a reference image to a video draft, an audio cue to a scene, or
  a folder to an Idea

The product should let Mark capture first and organize later. This is where the
"PureRef for concepts and file paths" framing is strongest.

## Simple Mode Direction

Simple Mode should prioritize fast, safe capture before advanced organization.

First priorities:

1. Add or choose a file/folder Item.
2. Add a plain Note explaining why it matters.
3. Show recent Items and Notes clearly.
4. Search across file names, paths, notes, and tags.
5. Export a local support bundle when something goes wrong.

Second priorities:

1. Attach Items to an Idea.
2. Add simple Tags.
3. Create explicit Links between Items.
4. Review recent Sessions as activity history.

Simple Mode should avoid asking the user to understand the full ontology before
they can save useful context. The first successful moment should be:

```text
I picked something, wrote why it matters, and can find it again.
```

## Existing Audio Features Under This Model

Current audio features do not need to be discarded. They become one concrete
Item/Bookmark/Note workflow.

| Existing feature | Product model meaning |
| --- | --- |
| Choose MP3 | Create or open a file Item |
| Recent Audio | Recent file Items from recent Sessions |
| Time-based marker | Bookmark on an audio Item |
| Marker note | Note attached to a Bookmark |
| File note | Note attached to a file Item |
| Timeline View | Bookmark and Session activity view |
| Session sidebar | Current temporary working Session summary |
| Search panel | Search across Items, Notes, Tags, Ideas, and Links |
| Inspector | Detail view for selected Item, Note, Bookmark, Link, or Idea |
| Support bundle | Local diagnostic export, not part of the product ontology |

The audio workflow can remain the first tested workflow while the product model
broadens around Items and Ideas. The important shift is language and structure:
audio is not the whole product; it is the first specialized workflow inside a
searchable concept/file reference board.

## Jen Note Capture Slice

Captured: 2026-04-28
Packet: `jen-note-capture-product-slice-v1`

This section defines Jen's first usable Consync product slice as a validated
note-first workflow. It is a docs-only planning artifact. No UI or API changes
are required yet.

### User Need

Jen wants a quiet place to capture notes and thoughts without an AI responding
immediately. The goal is private, frictionless capture now and optional
reflection or pattern discovery later.

This is distinct from a chat tool. Consync should feel like a local notebook
with lightweight structure: write something, attach a few words to it, come back
and find it.

### First Workflow

1. **Add note** — Jen types a freeform note. No required fields. No forced
   structure. The note saves locally.
2. **Suggested keywords** — After the note is saved, Consync offers a small set
   of keyword suggestions pulled from the note content using simple local logic
   (word frequency, stopword filtering, or phrase extraction — no API required).
3. **Accept or skip suggestions** — Jen can accept any suggested keywords with
   one action. She can also skip suggestions entirely.
4. **Add custom keywords** — Jen can type her own keywords in addition to or
   instead of suggestions.
5. **Attach to idea/category** — Jen can optionally attach the note to an
   existing Idea or a manually named category. This step is optional at capture
   time.
6. **Save locally** — The note, keywords, and optional Idea attachment are
   saved to the local Consync store. Nothing is sent to a server or AI API.

### Early Constraints

- No AI or external API is required for this slice.
- Keyword suggestions should use simple local logic only (e.g., split on
  whitespace, remove common stopwords, take the top few by frequency or
  position).
- Ideas and categories are manually created by Jen. There is no auto-generated
  taxonomy.
- No structure is forced at capture time. A note with no keywords and no Idea
  attachment is a valid, complete capture action.
- The existing audio workflow must remain unchanged.

### Keyword Suggestion Notes

The simplest viable approach:

- Tokenize the note text into words.
- Filter out a short stopword list (`the`, `a`, `an`, `is`, `in`, `and`, `or`,
  `of`, `to`, `it`, `for`, `with`, `this`, `that`, `was`, `but`, etc.).
- Return the top 3–5 remaining words by frequency or first appearance.
- Present them as tappable/clickable chips the user can accept or dismiss.

No model, no network call, no dependency required. The suggestion quality will
be low but useful enough to prompt reflection. Accuracy can improve later.

### Future Direction

- **Timeline view** — See captured notes ordered by date, Idea, or keyword.
- **AI-assisted pattern analysis** — After enough notes exist locally, offer
  optional AI-assisted reflection or keyword clustering.
- **More visual organization** — Board or card view grouped by Idea or keyword
  cluster.
- **Export or connect to ChatGPT** — Allow Jen to export a note collection or
  share a summary with an AI tool when she chooses to, not automatically.

---

## Implementation Notes For Later

This document does not require immediate code changes.

Likely future sequencing:

1. Clarify user-facing language around Items before renaming code.
2. Preserve Session internally while making it less prominent in user-facing
   language.
3. Add Idea as optional organization, not required setup.
4. Treat current audio markers as Bookmarks in product language.
5. Add Tags and Links only after the Item/Idea foundation is clear.
