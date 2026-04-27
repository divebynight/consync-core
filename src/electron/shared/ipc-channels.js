const IPC_CHANNELS = {
  getBackendSummary: "desktop:get-backend-summary",
  createBookmark: "desktop:create-bookmark",
  deleteBookmark: "desktop:delete-bookmark",
  exportSupportBundle: "desktop:export-support-bundle",
  getAppInfo: "desktop:get-app-info",
  updateBookmark: "desktop:update-bookmark",
  getConsyncSummary: "desktop:get-consync-summary",
  getShellInfo: "desktop:get-shell-info",
  getSessionState: "desktop:get-session-state",
  selectAudioFile: "desktop:select-audio-file",
  getLastAudioFile: "desktop:get-last-audio-file",
  revealSearchResult: "desktop:reveal-search-result",
  logRendererEvent: "desktop:log-renderer-event",
  runMockSearch: "desktop:run-mock-search",
  ping: "desktop:ping",
};

module.exports = {
  IPC_CHANNELS,
};
