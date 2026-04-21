STATUS: active

Mounted next step:

- `pause_electron_ui_stream_at_timeline_bookmark_milestone`

Focus:

- hold the live loop explicitly while `electron_ui` is paused
- keep the stopped UI state truthful instead of implying active execution
- preserve enough process context that later workflow decisions can be made intentionally

Keep this stream narrow. Do not expand into orchestration bloat or broad documentation scanning.