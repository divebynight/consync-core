## GOAL

Implement Consync V1 Feature 1: `new-guid` CLI command

## COMMAND

node src/index.js new-guid

## REQUIREMENTS

Prompt user for:

* project (string)
* type (string)
* note (string)
* tags (comma-separated)

Generate:

* UUID v4 guid
* timestamp in format YYYYMMDD_HHMMSS
* ISO timestamp for created_at

Create file in current directory: <timestamp>.json

JSON structure:
{
"guid": "...",
"created_at": "...",
"project": "...",
"type": "...",
"note": "...",
"tags": []
}

Also:

* Copy JSON to clipboard
* Print file path and guid to console
* Append event to .consync/state/events.log

## STRUCTURE

Use:

* src/index.js (entry point)
* src/commands/new-guid.js
* src/lib/guid.js
* src/lib/time.js
* src/lib/fs.js
* src/lib/clipboard.js

## CONSTRAINTS

* Keep implementation minimal
* Do not add extra features
* Do not build other commands
* Keep logic reusable (not inside CLI parsing)
* Use lightweight or no dependencies

## OUTPUT

Working CLI command:
node src/index.js new-guid
