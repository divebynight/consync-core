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

## Notes, Ideas, and Keyword Suggestions — First Slice

Captured: 2026-04-28
Packet: `notes-ideas-keywords-slice-design-v1`

This section defines the first implementable product slice for standalone
notes, ideas, and keyword suggestions. It is a docs-only planning artifact.
No UI or API changes are required yet.

### Object Definitions For This Slice

#### Idea

An Idea is a long-lived conceptual anchor or topic. It is optional at
capture time. Characteristics:

- Durable: Ideas are not deleted when a Session ends.
- Hierarchical later: An Idea may eventually have child Ideas, but this is
  not required for the first slice.
- Relational later: An Idea may eventually have files, notes, bookmarks, and
  links attached to it, but attachment is not required at creation.
- User-named: The user gives the Idea a name. There is no auto-generated
  Idea structure.

For the first slice, an Idea is just a named anchor the user can attach a
Note to. Nothing more is required yet.

#### Note

A Note is a standalone captured entry. Characteristics:

- Freeform: No required fields beyond the note text itself.
- Attachable: A Note may attach to zero or more Ideas. Attachment is
  optional both at creation time and afterward.
- Editable: A Note can be edited after it is saved.
- Searchable: A Note's text and accepted keywords are both searchable.
- No minimum length: A one-word note is a valid note.

#### Keyword

A keyword is a piece of searchable metadata on a Note. Characteristics:

- Suggested or manual: Keywords may come from local suggestions or be typed
  directly by the user.
- Confirmed by user: Suggested keywords are candidates until the user
  accepts them. Accepted keywords become searchable metadata on the Note.
- Removable: The user can remove any keyword from a Note at any time.
- Not a full tag system: Keywords in this slice are flat labels on a Note.
  A global tag taxonomy may emerge later but is not required now.

#### Keyword Candidates

Keyword candidates are temporary suggestions generated from note content.
They are distinct from confirmed keywords:

- Candidates are shown to the user but not stored as metadata until accepted.
- Accepting a candidate promotes it to a confirmed keyword on the Note.
- Dismissing a candidate removes it from the suggestion list with no effect
  on the Note.
- Longer notes produce richer candidates, but short notes are valid and
  will simply produce fewer or no candidates.

### Capture Rules

The first slice should minimize friction at every step:

- No required Idea — a Note can exist with no attachment.
- No minimum note length — capture should never be blocked by length.
- No forced categorization — the user does not need to choose a category or
  Idea before saving.
- Keywords are optional — a Note with no keywords is complete and valid.
- One action to save — the user should be able to save without touching
  keyword suggestions if they do not want to.

### First Workflow

1. **Add Note** — User opens the note capture surface. No required setup.
2. **Enter note text** — Freeform text entry. No minimum length. No
   required fields.
3. **Optional title** — User may add a short title to the note. If no title
   is given, the note is identified by its first line or a truncated preview.
4. **Optional attach to Idea** — User may select an existing Idea from a
   list, or create a new Idea by name, or leave the Note unattached. All
   three are valid.
5. **Review suggested keywords** — After the note is entered, the system
   shows 3–5 keyword candidates derived from the note text using simple
   local logic. The user reviews them. This step can be skipped entirely.
6. **Add custom keywords** — User may type additional keywords not in the
   suggestion list. Custom keywords are added directly as confirmed
   keywords, not as candidates.
7. **Save locally** — Note text, optional title, optional Idea attachment,
   and confirmed keywords are saved to the local store. No network call.
   Keyword candidates that were not accepted are discarded.

### First Implementation Packets

These are the suggested implementation steps in order. Each is a distinct,
testable packet.

1. **Standalone note creation and storage** — Note text, optional title, and
   timestamp. No Idea attachment, no keywords yet. A note can be created and
   read back from the local store.
2. **Idea creation and storage** — Idea name, optional description, and
   creation timestamp. An Idea can be created, listed, and selected from a
   picker.
3. **Attach Note to Idea** — Add optional Idea reference to Note creation
   and editing. A Note can be saved with an Idea attachment and retrieved
   by Idea.
4. **Simple local keyword extraction** — Given a note text, return 3–5
   keyword candidates using stopword filtering and frequency/position
   heuristics. No model, no API. Returns a list of candidate strings.
5. **Accept, add, and remove keywords** — User can accept candidates
   (promoting them to confirmed keywords), add custom keywords directly,
   or remove any confirmed keyword. Confirmed keywords are persisted on the
   Note.
6. **Basic note list and keyword search** — List all notes ordered by
   recency. Allow filtering by confirmed keyword. A search for `recipe`
   should return Notes that have `recipe` as a confirmed keyword.

---

## Notes / Keywords / Idea — Current State

Captured: 2026-04-29
Packets: `ideas-foundation-from-notes-first-workflow-v1`, `idea-surface-from-notes-v1`

This section documents the implemented behavior as of these two packets. It
is the authoritative checkpoint for the Notes → Keywords → Idea model.

### What Is Built

- **Notes** are first-class captured entries. A note has text, an optional
  idea label, and zero or more accepted keywords. Notes are stored locally
  and listed in the UI.
- **Keywords** are lightweight, user-accepted tags on a note. They are
  suggested during capture and accepted or dismissed by the user. Accepted
  keywords are persisted on the note and are searchable.
- **Idea** is an optional free-text field on a note. The user can type any
  string as the idea label at capture time. It is stored on the note and
  included in the keyword/idea filter search. It is not a managed entity.

### What Idea Is Not (Guardrail)

The idea field is currently a plain string on a note. It has no CRUD UI,
no list view, no grouping, and no entity lifecycle. Do not treat idea as a
managed entity until explicitly introduced in a future packet.

---

## Widgets, Views, and Profiles

Captured: 2026-04-28
Packet: `widget-view-product-model-v1`

This section describes a future UI architecture for Consync. Nothing here
requires immediate code or UI changes. It is a planning artifact only.

### Core App and Shared Data Model

The core app owns the shared data model. All widgets, views, and profiles
read from and write to that model. The data layer does not belong to any
single view or widget. This means:

- Switching views does not change or lose data.
- Adding a widget to a view does not duplicate the underlying store.
- Profile presets are display preferences, not separate data partitions.

The shared model objects are: Ideas, Items, Notes, Tags, Links, Bookmarks,
and Sessions (as defined in the Core Objects section above).

### Widgets

A widget is a functional UI block. Each widget does one thing well. Widgets
can be composed into views.

| Widget | Purpose |
| --- | --- |
| Add Note | Freeform note capture with optional keyword suggestions |
| Add File | Choose a local file or folder, create a file Item |
| Keyword Suggestions | Suggest keywords from a Note or Item; accept, dismiss, or add custom |
| Timeline | Chronological view of Bookmarks, Notes, and Sessions across Items |
| Search | Search across Ideas, Items, Notes, Tags, and Links |
| Idea Tree | Hierarchical or list view of Ideas and their attached Items |
| Item List | Flat or filtered list of all captured Items |
| File Preview | Preview metadata, path, and notes for a selected file Item |
| Audio Player | Load and play a local audio file; capture timestamp Bookmarks |
| Timestamp Bookmarks | List of Bookmarks on a loaded audio or document Item |
| Related Items | Show Items linked to the currently selected Item or Idea |
| Export for AI | Export a structured summary of selected Items, Notes, or Ideas for use with an AI tool |

Widgets are composable but not required all at once. A Simple Start view
might use only Add Note and Item List. An audio workflow might use Audio
Player, Timestamp Bookmarks, and Timeline.

### Views

A view is a user-facing arrangement of one or more widgets. Views match a
workflow or context. They do not own data; they are display configurations
only.

| View | Included Widgets (suggested) | Primary user |
| --- | --- | --- |
| Simple Start | Add Note, Keyword Suggestions, Item List | New users; Jen note-capture slice |
| Research / Reflection | Add Note, Add File, Keyword Suggestions, Item List, Idea Tree, Search | Jen research/book workflow |
| Audio Notes / Arrangement | Audio Player, Timestamp Bookmarks, Timeline, Add Note, Search | Mark/FIL audio workflow |
| Creative Context | Add File, Item List, Related Items, File Preview, Idea Tree, Timeline | Mark visual/media workflow |

These view names and widget sets are suggestions, not final decisions. A
user may eventually be able to customize which widgets appear in a view and
save that configuration.

### Profiles

A profile is a named preset that selects a default view and optionally
configures surface-level defaults (such as default Idea, default keyword
list, or display density). Profiles make the app feel personalized without
requiring code changes or separate app instances.

Example profiles:

- **Jen** — defaults to Research / Reflection view; note-first; no audio
  controls visible unless opted in
- **Mark** — defaults to Audio Notes view; audio-first; full timeline
  visible; file preview on
- **Simple** — defaults to Simple Start view; no Idea Tree or advanced
  search visible; maximum whitespace

Profiles are cosmetic and behavioral preferences, not data partitions. All
profiles share the same underlying Idea/Item/Note store. A user can switch
profiles without losing data.

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
6. Introduce widget composition after the core Item/Idea/Note foundation is
   stable and at least one additional workflow (Jen note capture) exists.
7. Let profiles emerge from observed usage patterns rather than designing
   them speculatively.
