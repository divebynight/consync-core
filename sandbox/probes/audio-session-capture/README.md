# Audio Session Capture Probe

This is an experimental terminal probe for logging timestamped session notes while reviewing audio or other media files.

It is testing whether a very small local-first capture loop is enough to create useful session artifacts before adding media-aware features.

## What It Writes

The script writes one JSON session file per run in the current working directory under `.consync/sessions/`.

Each session file includes:

- `sessionId`
- `startedAt`
- `stoppedAt`
- `cwd`
- `currentFile`
- `entries[]`

Each entry records:

- `at`
- `elapsedMs`
- `file`
- `mediaTimestamp` when present
- `text`

## How To Run

From the repository root:

```sh
npm run probe:audio-session
```

That command starts the probe in `sandbox/probes/audio-session-capture/workdir`, which is the default local test area for copied media files.

If you want to use a different folder as the session context, `cd` into that folder first and run:

```sh
node /Users/markhughes/Projects/consync-core/sandbox/probes/audio-session-capture/capture-session.js
```

## Commands

- `/file <name-or-path>` sets the current file reference for later entries
- `/preview` opens the current file in Quick Look without blocking the input loop
- `/at <timestamp>` sets a media timestamp for the next note only
- `/clear-file` clears the current file reference
- `/end` ends the session and writes the final JSON
- `/help` shows a short command list

If a normal input line resolves to an existing file path, the probe treats it as a file-selection action. This is intended to support dragged file paths from macOS Terminal, including quoted paths and paths with escaped spaces.

Supported timestamp formats for `/at` are `ss`, `m:ss`, and `mm:ss`. Valid timestamps are normalized to `mm:ss` and stored on the next note as `mediaTimestamp.raw` and `mediaTimestamp.seconds`.

Any other input line becomes a session entry.

## What Problem This Probe Is Testing

It tests whether a plain terminal loop can capture review notes with enough timing and file context to be useful without requiring any media parsing, app integration, or background services.

## Main Open Questions

- Is a text-only loop fast enough during real review sessions?
- Is a single current-file pointer enough, or does switching context feel too manual?
- Is one JSON file per session inspectable enough for later promotion into structured Consync artifacts?
- Does keeping the probe in `sandbox/probes/` feel like a reusable pattern for future temporary tools?