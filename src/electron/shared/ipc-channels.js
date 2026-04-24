const IPC_CHANNELS = {
  getBackendSummary: "desktop:get-backend-summary",
  createBookmark: "desktop:create-bookmark",
  getConsyncSummary: "desktop:get-consync-summary",
  getShellInfo: "desktop:get-shell-info",
  getSessionState: "desktop:get-session-state",
  selectAudioFile: "desktop:select-audio-file",
  revealSearchResult: "desktop:reveal-search-result",
  runMockSearch: "desktop:run-mock-search",
  ping: "desktop:ping",
};

module.exports = {
  IPC_CHANNELS,
};
