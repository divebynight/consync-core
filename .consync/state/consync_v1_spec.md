# Consync V1 Specification (Local-First, Lean)

## 🎯 Purpose

Define the minimal viable version of Consync that:

* Works fully offline
* Captures **identity (GUID)** and **iteration (timestamp)**
* Stores structured metadata via small JSON files
* Avoids AI dependency while remaining AI-compatible
* Can evolve into MCP tools and richer workflows later

---

## 🧠 Core Principles

1. **Time = iteration**

   * Timestamped files represent events/moments

2. **GUID = identity**

   * GUID files represent persistent concepts/projects/entities

3. **Filenames identify**

   * Filenames are dumb and stable

4. **Sidecars describe**

   * Metadata lives in JSON, not filenames

5. **Local-first**

   * No network required

6. **Promotion over capture**

   * Capture is dense (screenshots, notes)
   * Structured metadata is sparse and intentional

---

## 📁 Expected Environment

User operates inside a session folder:

Example:

```
/ProjectSessions/2026_Sessions/20260405_01_Robot_Selection/
```

All commands operate relative to current working directory.

---

## 🧩 V1 Features

### Feature 1 — Create GUID Metadata File

#### Command

```
consync new-guid
```

#### Behavior

Prompt user for:

* `project` (string)
* `type` (concept | blender | audio | video | etc)
* `note` (short free text)
* `tags` (comma-separated)

#### System generates:

* UUID v4 → `guid`
* Current timestamp → `created_at`
* Timestamp filename → `YYYYMMDD_HHMMSS.json`

#### Output file (in current directory)

Example filename:

```
20260405_004212.json
```

Example contents:

```json
{
  "guid": "eca115d4-b7b4-427e-853d-91f759aa1f65",
  "created_at": "2026-04-05T00:42:12-05:00",
  "project": "Dive_by_Night",
  "type": "concept",
  "note": "Robot suit exploration",
  "tags": ["robot", "blender"]
}
```

#### Additional behavior

* Copy JSON to clipboard
* Print file path + GUID to console

---

## 🧪 Verification — Feature 1

* Run command in a test folder
* Confirm:

  * File created with timestamp name
  * JSON structure correct
  * GUID present and valid format
  * Clipboard contains JSON
  * Console output is clear

---

## 🧩 Feature 2 — Event Logging (Light Dev Harness Hook)

#### Behavior

Append a log entry to:

```
.consync/state/events.log
```

Example entry:

```json
{
  "event": "new-guid",
  "time": "2026-04-05T00:42:12-05:00",
  "guid": "eca115d4-b7b4-427e-853d-91f759aa1f65",
  "path": "./20260405_004212.json"
}
```

#### Notes

* If `.consync/state/` does not exist → create it
* Append-only log
* No parsing required yet

---

## 🧪 Verification — Feature 2

* Run `new-guid`
* Confirm:

  * `.consync/state/events.log` exists
  * Entry appended correctly
  * Multiple runs append cleanly

---

## 🧩 Feature 3 — Internal Tool Function (MCP-Ready)

Core logic must live in reusable function:

```js
newGuidTool(input) → {
  guid,
  created_at,
  filePath,
  json
}
```

#### Requirements

* CLI calls this function
* No logic duplication in CLI layer
* Function returns structured data

---

## 🧪 Verification — Feature 3

* Function can be imported and called directly
* Returns expected object
* CLI output matches function output

---

## 🧩 Feature 4 — Timestamp Utility

Standard timestamp format:

```
YYYYMMDD_HHMMSS
```

Example:

```
20260405_004212
```

#### Requirements

* Single utility function
* Used consistently across system

---

## 🧪 Verification — Feature 4

* Timestamp format matches spec
* No timezone inconsistencies (use ISO internally)

---

## 🧩 Feature 5 — GUID Utility

Use UUID v4

#### Requirements

* Use standard library or lightweight dependency
* No custom GUID logic

---

## 🧪 Verification — Feature 5

* Generated GUID is valid UUID v4
* No collisions in repeated tests

---

## 📦 Folder Structure (Minimal)

```
consync/
  index.js
  commands/
    new-guid.js
  lib/
    guid.js
    time.js
    fs.js
  .consync/
    state/
      events.log
```

---

## 🚫 Explicit Non-Goals (V1)

Do NOT implement:

* File watchers
* Screenshot automation
* AI integration
* MCP server
* Database
* Complex config
* Image processing
* Cross-session indexing

---

## 🔁 Future Extensions (Do Not Build Yet)

* `summarize-session`
* `export-for-ai`
* screenshot association
* GUID linking across folders
* MCP server wrapper
* dev harness server integration

---

## 🔄 Dev Workflow (ChatGPT ↔ Copilot)

1. Update spec (this file)
2. Define next small feature
3. Add to `agent-handoff.md`
4. Copilot implements
5. Verify manually
6. Update spec if needed
7. Repeat

---

## 🧠 Design Summary

* Filesystem = database
* JSON = schema
* CLI = interface
* GUID = identity
* Timestamp = history
* Logs = event stream
* AI = optional layer (later)

---

## ✅ Definition of Done (V1)

System can:

* Create GUID metadata file
* Use timestamp-based filenames
* Log events
* Run entirely offline
* Be extended without refactoring core

---

## 🔑 Final Rule

> Keep Consync simple enough that it is useful without AI.

AI should enhance—not be required.

---
