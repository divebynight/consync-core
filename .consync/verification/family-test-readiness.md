# Family Test Readiness

Captured: 2026-04-27
Packet: `family-test-readiness-checklist-v1`
Mode: readiness/planning only

This checklist describes whether Consync is ready to share with non-technical
family testers. It is not an implementation plan and does not add new app
behavior.

## Current Family-Test Status

Status: **limited local pilot ready**

Consync is ready for a small, guided family test if expectations are kept narrow:
open the packaged app, choose a local MP3, add notes, review the basic workspace,
open Help / About, and export a support bundle if anything feels confusing or
broken.

It is not ready to present as a finished product or as a general creative-file
organizer. The first workflow is still audio-note centered, and the app still
contains early workspace/search/timeline surfaces that may need more product
clarity before a broader non-technical test.

## What Already Works

- Packaged Electron app builds with `npm run package:desktop`.
- Packaged app opens from `out/consync-core-darwin-x64/consync-core.app`.
- Main UI loads without a blank window.
- App version/build info is visible in the left sidebar.
- User can choose a local MP3.
- App can show an audio player for the selected file.
- User can save file notes and time-based notes.
- User can review saved notes in the current workspace.
- Timeline view exists for reviewing session/bookmark markers.
- Help / About is available from the left sidebar.
- Support bundle export creates a local folder with app info, logs, and recent
  session metadata when available.
- Diagnostics remain local; the app does not upload logs or files.

## What Was Added For Family Testing

### Diagnostics / Support Bundle

- Local append-only app event logging.
- Logging for startup, shutdown, opened sessions, selected audio files, key UI
  actions, renderer errors, and main-process errors.
- Visible app version/build info.
- `Export Support Bundle` action.
- Support bundles include:
  - `app-info.json`
  - `app-events.jsonl`
  - `recent-session-metadata.json`
  - `errors.jsonl` when error logs exist

### Help / About

- Plain-language Help / About panel.
- Explains what Consync does.
- Explains how to start.
- Explains what sessions mean.
- Explains read-only actions vs actions that change local session files.
- Explains that diagnostics stay local.
- Explains how to send Mark a support bundle.

### Discoverability Cues

- `Help / About` is visually emphasized in the left sidebar.
- Views panel includes: `Need help? Open Help / About.`
- Build/support panel includes: `If something goes wrong, click Export Support Bundle and send Mark the folder path.`

### First-Run Guidance

- Startup view now includes a `First Steps` panel.
- It tells testers to start with `Choose MP3`.
- It explains what appears after choosing a file.
- It reassures testers that files are not uploaded.
- It explains that notes, logs, and support bundles stay local unless sent.

## How To Build / Run The Packaged App

From the repo root:

```text
npm run package:desktop
```

Then open the packaged app at:

```text
out/consync-core-darwin-x64/consync-core.app
```

For command-line smoke checks, the executable is:

```text
out/consync-core-darwin-x64/consync-core.app/Contents/MacOS/consync-core
```

## What Testers Should Try First

Ask testers to do this narrow path first:

1. Open the app.
2. Read the `First Steps` panel.
3. Click `Choose MP3`.
4. Select a local MP3 they are comfortable testing with.
5. Press play and pause.
6. Type a short note.
7. Save the note at the current time.
8. Add one general file note.
9. Open `Timeline View`.
10. Open `Help / About`.
11. Click `Export Support Bundle`.
12. Send Mark the support bundle folder path and a short description of what felt confusing or broken.

## Known Limitations

- The app still opens around an MP3/audio-note workflow.
- Folder-based creative tracking is not yet a polished first workflow.
- Search still points at development-shaped fixture defaults unless manually
  changed.
- There is no Simple Mode yet.
- There is no onboarding modal.
- There is no broad tooltip system.
- Support bundle export shows a local folder path; it does not send anything
  automatically.
- Error files appear in support bundles only after an error has actually been
  logged.
- The app is not yet signed/notarized for normal distribution.
- The app has not yet been validated on a non-developer machine.

## What Not To Test Yet

Do not ask family testers to evaluate:

- Whether Consync is a complete product.
- Complex folder-based creative tracking.
- Long project libraries.
- Multi-file workflows beyond the current visible UI.
- Collaboration or sharing.
- Cloud sync.
- Installer/signing behavior.
- Internal process, repo, or development workflows.

## How Testers Should Report Issues

Ask testers to send Mark:

- What they were trying to do.
- What they expected to happen.
- What actually happened.
- Whether the app showed an error.
- The support bundle folder path from `Export Support Bundle`.
- A screenshot if the UI looked wrong.

Suggested wording for testers:

```text
I was trying to:
I expected:
What happened:
Support bundle folder:
Screenshot attached: yes/no
```

## Readiness Checklist

- [x] App builds as a packaged Electron app.
- [x] Packaged app opens from `out/`.
- [x] Startup guidance is visible on the normal first screen.
- [x] Help / About is visible from the left sidebar.
- [x] Help / About uses plain language.
- [x] Support bundle export is visible.
- [x] Support bundle export works locally.
- [x] Diagnostics stay local.
- [x] Version/build info is visible.
- [x] Current automated verification passes.
- [ ] First tester task script is finalized.
- [ ] Test MP3/audio sample guidance is chosen.
- [ ] Expected family feedback questions are finalized.
- [ ] Non-developer-machine launch has been tested.
- [ ] Decision made on Simple Mode.
- [ ] Decision made on first workflow priority.

## Open Product Questions

- Does the app need a Simple Mode?
- What is the expected first workflow?
- Should folder-based creative tracking be prioritized over MP3/audio notes?
- What should Jen/FIL actually be asked to do?
- Should the first screen focus only on one primary action?
- Should support bundle export also offer a Finder reveal action?
- Should family testers use their own MP3s, or should Mark provide a safe sample?
- Should the app hide search/timeline surfaces during family tests until the
  first workflow is clearer?

## Verification Evidence

Commands run for this readiness check:

```text
npm run check:state-preflight
npm run verify
npm run check:state-postflight
npm run package:desktop
```

Results:

- `npm run check:state-preflight`: PASS.
- `npm run verify`: PASS.
- `npm run check:state-postflight`: PASS.
- `npm run package:desktop`: PASS.
- Packaged app launched from `out/`: PASS.

Packaged app smoke confirmed:

- startup guidance visible
- Help / About cue visible
- support cue visible
- `Choose MP3` visible
- `Export Support Bundle` visible
- no critical console errors
- no page errors
