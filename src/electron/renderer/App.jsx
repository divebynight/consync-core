import React, { useEffect, useRef, useState } from "react";
import { createBookmarkAndReadSessionState, updateBookmarkAndReadSessionState } from "./bookmark-flow.mjs";
import {
  getMockSearchDetailRows,
  getMockSearchSelectionKey,
  getMockSearchSummaryRows,
  getSelectedMockSearchDetail,
} from "./mock-search-panel.mjs";
import { getSessionPanelRows } from "./session-panel.mjs";

function formatTimeLabel(totalSeconds) {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(normalizedSeconds / 60);
  const seconds = normalizedSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getBookmarkTimeLabel(bookmark) {
  if (!bookmark) {
    return "none";
  }

  if (typeof bookmark.timeLabel === "string" && bookmark.timeLabel.trim()) {
    return bookmark.timeLabel.trim();
  }

  if (bookmark.timeSeconds === null || bookmark.timeSeconds === undefined) {
    return "File note";
  }

  return `${bookmark.timeSeconds}s`;
}

function getBookmarkDisplayNote(bookmark) {
  if (bookmark && typeof bookmark.note === "string" && bookmark.note.trim()) {
    return bookmark.note.trim();
  }

  if (bookmark && bookmark.timeSeconds !== null && bookmark.timeSeconds !== undefined) {
    return "Untitled marker";
  }

  return "Untitled note";
}

function getFileName(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return "none";
  }

  const normalizedPath = filePath.replace(/\\/g, "/");
  const pathSegments = normalizedPath.split("/");

  return pathSegments[pathSegments.length - 1] || normalizedPath;
}

function getAudioErrorMessage(audioElement) {
  if (!audioElement || !audioElement.error) {
    return "Unable to load audio file in player.";
  }

  switch (audioElement.error.code) {
    case 1:
      return "Audio load was aborted.";
    case 2:
      return "Network-style audio load failed.";
    case 3:
      return "Audio decode failed.";
    case 4:
      return "Audio format is unsupported by the player.";
    default:
      return "Unable to load audio file in player.";
  }
}

function splitBookmarksByTiming(bookmarks) {
  const fileNotes = [];
  const timelineMarkers = [];

  for (const bookmark of Array.isArray(bookmarks) ? bookmarks : []) {
    if (bookmark.timeSeconds === null || bookmark.timeSeconds === undefined) {
      fileNotes.push(bookmark);
      continue;
    }

    if (typeof bookmark.timeSeconds === "number" && !Number.isNaN(bookmark.timeSeconds)) {
      timelineMarkers.push(bookmark);
    }
  }

  timelineMarkers.sort((left, right) => left.timeSeconds - right.timeSeconds);

  return {
    fileNotes,
    timelineMarkers,
  };
}

function getActiveTimelineMarkerIndex(timelineMarkers, currentTimeSeconds) {
  if (!Array.isArray(timelineMarkers) || timelineMarkers.length === 0) {
    return -1;
  }

  if (typeof currentTimeSeconds !== "number" || Number.isNaN(currentTimeSeconds) || currentTimeSeconds < 0) {
    return -1;
  }

  let activeIndex = -1;

  for (let index = 0; index < timelineMarkers.length; index += 1) {
    const marker = timelineMarkers[index];

    if (typeof marker.timeSeconds !== "number" || Number.isNaN(marker.timeSeconds)) {
      continue;
    }

    if (marker.timeSeconds > currentTimeSeconds) {
      break;
    }

    activeIndex = index;
  }

  return activeIndex;
}

function isTypingTarget(target) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const tagName = typeof target.tagName === "string" ? target.tagName.toLowerCase() : "";

  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  return typeof target.isContentEditable === "boolean" ? target.isContentEditable : false;
}

function addRecentAudioFile(recentFiles, nextFile, maxItems = 8) {
  if (!nextFile || typeof nextFile.filePath !== "string" || !nextFile.filePath.trim()) {
    return Array.isArray(recentFiles) ? recentFiles : [];
  }

  const normalizedRecentFiles = Array.isArray(recentFiles) ? recentFiles : [];
  const dedupedRecentFiles = normalizedRecentFiles.filter(file => file.filePath !== nextFile.filePath);

  return [nextFile, ...dedupedRecentFiles].slice(0, maxItems);
}

function StatusRow({ label, value }) {
  return (
    <div className="status-row">
      <span className="status-label">{label}</span>
      <span className="status-value">{value}</span>
    </div>
  );
}

function clampTimelinePercent(value) {
  return Math.max(0, Math.min(88, value));
}

function getBookmarkMarkerLabel(bookmark, index) {
  if (bookmark.note && bookmark.note.trim()) {
    return bookmark.note.trim();
  }

  return `Bookmark ${index + 1}`;
}

function getBookmarkTimelineMarkers(sessionState) {
  if (!sessionState) {
    return [
      {
        label: "Bookmarks loading",
        detail: "Waiting for current session state",
        start: 8,
        span: 20,
      },
    ];
  }

  const bookmarks = Array.isArray(sessionState.bookmarks) ? sessionState.bookmarks : [];

  if (bookmarks.length === 0) {
    return [
      {
        label: "First bookmark pending",
        detail: "Drop a note to anchor a moment",
        start: 36,
        span: 22,
      },
    ];
  }

  const maxBookmarkTime = bookmarks.reduce((highestTime, bookmark) => {
    if (typeof bookmark.timeSeconds !== "number" || Number.isNaN(bookmark.timeSeconds)) {
      return highestTime;
    }

    return Math.max(highestTime, bookmark.timeSeconds);
  }, 0);
  const timelineWindowSeconds = Math.max(sessionState.currentPositionSeconds || 0, maxBookmarkTime, 120);

  return bookmarks.map((bookmark, index) => {
    const bookmarkTime = typeof bookmark.timeSeconds === "number" && !Number.isNaN(bookmark.timeSeconds)
      ? bookmark.timeSeconds
      : 0;
    const rawStart = timelineWindowSeconds > 0 ? (bookmarkTime / timelineWindowSeconds) * 88 : 0;

    return {
      label: getBookmarkMarkerLabel(bookmark, index),
      detail: `${bookmarkTime}s bookmark`,
      start: clampTimelinePercent(rawStart),
      span: 12,
    };
  });
}

function getSessionEventMarkers(sessionState) {
  if (!sessionState) {
    return [
      {
        label: "Current focus",
        detail: "Waiting for current session state",
        start: 62,
        span: 20,
      },
      {
        label: "Re-entry window",
        detail: "Recent search and selection flow",
        start: 18,
        span: 16,
      },
    ];
  }

  const bookmarks = Array.isArray(sessionState.bookmarks) ? sessionState.bookmarks : [];
  const maxBookmarkTime = bookmarks.reduce((highestTime, bookmark) => {
    if (typeof bookmark.timeSeconds !== "number" || Number.isNaN(bookmark.timeSeconds)) {
      return highestTime;
    }

    return Math.max(highestTime, bookmark.timeSeconds);
  }, 0);

  const timelineWindowSeconds = Math.max(sessionState.currentPositionSeconds || 0, maxBookmarkTime, 120);
  const rawStart = timelineWindowSeconds > 0
    ? (sessionState.currentPositionSeconds / timelineWindowSeconds) * 88
    : 0;

  return [
    {
      label: "Current focus",
      detail: `${sessionState.currentPositionSeconds}s in ${sessionState.currentFile}`,
      start: clampTimelinePercent(rawStart),
      span: 20,
    },
  ];
}

function getSessionTimelineTracks(sessionState) {
  return [
    {
      label: "Session Events",
      tone: "events",
      markers: getSessionEventMarkers(sessionState),
    },
    {
      label: "Bookmarks",
      tone: "bookmarks",
      markers: getBookmarkTimelineMarkers(sessionState),
    },
    {
      label: "Notes",
      tone: "notes",
      markers: [
        {
          label: "Cover motif note",
          detail: "Placeholder creative note marker",
          start: 12,
          span: 24,
        },
        {
          label: "Lighting pass",
          detail: "Texture and color reference",
          start: 56,
          span: 18,
        },
      ],
    },
    {
      label: "Audio Cues",
      tone: "audio",
      markers: [
        {
          label: "Ambient swell",
          detail: "Placeholder cue for future waveform work",
          start: 8,
          span: 20,
        },
        {
          label: "Voice memo pocket",
          detail: "Potential spoken reflection lane",
          start: 68,
          span: 16,
        },
      ],
    },
  ];
}

function SessionTimelineShell({ sessionState }) {
  const timelineTracks = getSessionTimelineTracks(sessionState);

  return (
    <article className="panel session-timeline-panel">
      <div className="timeline-heading">
        <p className="eyebrow timeline-eyebrow">Timeline View</p>
        <h2>Session Timeline</h2>
        <p className="timeline-copy">
          The earlier timeline experiment remains available here with real bookmark and session event lanes, plus placeholder tracks for notes and audio cues.
        </p>
      </div>

      <div className="timeline-ruler" aria-hidden="true">
        <span>0:00</span>
        <span>0:30</span>
        <span>1:00</span>
        <span>1:30</span>
        <span>2:00</span>
      </div>

      <div className="timeline-tracks">
        {timelineTracks.map(track => (
          <section className="timeline-track" key={track.label}>
            <div className="timeline-track-meta">
              <p className="timeline-track-label">{track.label}</p>
              <p className="timeline-track-subtitle">{track.markers.length} markers</p>
            </div>
            <div className="timeline-lane" role="list" aria-label={`${track.label} markers`}>
              {track.markers.map((marker, index) => (
                <div
                  className={`timeline-marker timeline-marker-${track.tone}`}
                  key={`${track.label}:${marker.label}:${marker.start}:${index}`}
                  role="listitem"
                  style={{
                    left: `${marker.start}%`,
                    width: `${marker.span}%`,
                  }}
                >
                  <span className="timeline-marker-label">{marker.label}</span>
                  <span className="timeline-marker-detail">{marker.detail}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function getDesktopBridge() {
  const desktopBridge = window.consyncDesktop;

  if (
    !desktopBridge ||
    typeof desktopBridge.getSessionState !== "function" ||
    typeof desktopBridge.createBookmark !== "function" ||
    typeof desktopBridge.selectAudioFile !== "function" ||
    typeof desktopBridge.revealSearchResult !== "function" ||
    typeof desktopBridge.runMockSearch !== "function"
  ) {
    throw new Error("Consync desktop bridge is unavailable.");
  }

  return desktopBridge;
}

function MockSearchResult({ searchResult, selectedMatchKey, onRevealSelectedMatch, onSelectMatch }) {
  const summaryRows = getMockSearchSummaryRows(searchResult);
  const detailRows = getMockSearchDetailRows(searchResult, selectedMatchKey);
  const selectedDetail = getSelectedMockSearchDetail(searchResult, selectedMatchKey);

  return (
    <div className="mock-search-results">
      <div className="mock-search-summary">
        {summaryRows.map(row => (
          <StatusRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>

      {searchResult.groups.length > 0 ? (
        <div className="mock-search-groups">
          {searchResult.groups.map(group => (
            <section className="mock-search-group" key={`${group.anchorPath}:${group.sessionTitle}`}>
              <header className="mock-search-group-header">
                <p className="mock-search-group-label">{group.sessionTitle}</p>
                <p className="mock-search-group-anchor">{group.anchorPath}</p>
              </header>

              <ul className="mock-search-match-list">
                {group.matches.map(match => {
                  const matchKey = getMockSearchSelectionKey(group, match);
                  const isSelected = matchKey === selectedMatchKey;

                  return (
                    <li className="mock-search-match-shell" key={`${group.anchorPath}:${match.artifactPath}`}>
                      <button
                        className={`mock-search-match${isSelected ? " mock-search-match-selected" : ""}`}
                        onClick={() => onSelectMatch(group, match)}
                        type="button"
                      >
                        <p className="mock-search-artifact">{match.artifactPath}</p>
                        <p className="mock-search-note">{match.note || "No note"}</p>
                        <p className="mock-search-tags">
                          {match.tags.length > 0 ? match.tags.join(" / ") : "No tags"}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="empty-state">No bookmarked matches found for this root and query.</p>
      )}

      <section className="mock-search-detail-panel">
        <h3>Selected Match</h3>
        <div className="mock-search-summary">
          {detailRows.map(row => (
            <StatusRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        <div className="mock-search-detail-actions">
          <button
            className="bookmark-button"
            disabled={!selectedDetail}
            onClick={() => onRevealSelectedMatch(selectedDetail ? selectedDetail.fullPath : null)}
            type="button"
          >
            Reveal in Finder
          </button>
        </div>
        <p className="mock-search-detail-copy">
          {selectedDetail ? selectedDetail.note : "Click a result row to inspect one match more closely."}
        </p>
      </section>
    </div>
  );
}

function NavigationButton({ active, children, onClick }) {
  return (
    <button
      className={`workspace-nav-button${active ? " workspace-nav-button-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function InspectorPanel({ searchResult, selectedAudioFile, selectedMatchKey, sessionState }) {
  const selectedDetail = getSelectedMockSearchDetail(searchResult, selectedMatchKey);
  const selectedAudioBookmarks = sessionState && selectedAudioFile
    ? sessionState.bookmarks.filter(bookmark => bookmark.filePath === selectedAudioFile.filePath)
    : [];
  const latestBookmark = selectedAudioBookmarks.length > 0
    ? selectedAudioBookmarks[selectedAudioBookmarks.length - 1]
    : sessionState && sessionState.bookmarks.length > 0
      ? sessionState.bookmarks[sessionState.bookmarks.length - 1]
      : null;
  const bookmarkSummaryLabel = latestBookmark && latestBookmark.filePath
    ? getFileName(latestBookmark.filePath)
    : null;

  return (
    <aside className="workspace-column workspace-inspector">
      <div className="column-heading">
        <p className="eyebrow">Inspector</p>
        <h2>Details</h2>
      </div>

      {selectedDetail ? (
        <article className="panel panel-secondary">
          <h3>Selected Result</h3>
          <StatusRow label="Selection" value={selectedDetail.artifactPath} />
          <StatusRow label="Session" value={selectedDetail.sessionTitle} />
          <StatusRow label="Anchor" value={selectedDetail.anchorPath} />
          <StatusRow label="Tags" value={selectedDetail.tags.length > 0 ? selectedDetail.tags.join(", ") : "none"} />
          <p className="inspector-note">{selectedDetail.note}</p>
        </article>
      ) : latestBookmark ? (
        <article className="panel panel-secondary">
          <h3>Latest Bookmark</h3>
          {bookmarkSummaryLabel ? <StatusRow label="Audio file" value={bookmarkSummaryLabel} /> : null}
          <StatusRow label="Time" value={getBookmarkTimeLabel(latestBookmark)} />
          <StatusRow label="Note" value={latestBookmark.note || "none"} />
          <p className="inspector-note">
            Resume from this note, or use search first if you want to inspect related files before continuing.
          </p>
        </article>
      ) : (
        <article className="panel panel-secondary">
          <h3>No Selection Yet</h3>
          <p className="empty-state">
            Pick a search result or save a bookmark to populate this inspector with something concrete.
          </p>
        </article>
      )}

      <article className="panel panel-secondary inspector-hint-panel">
        <h3>Hint</h3>
        <p className="inspector-note">
          Use the center actions to switch between resuming, searching, and reviewing bookmarks.
        </p>
      </article>
    </aside>
  );
}

export function App() {
  const [note, setNote] = useState("");
  const [searchRoot, setSearchRoot] = useState("sandbox/fixtures/nested-anchor-trial");
  const [searchQuery, setSearchQuery] = useState("moss");
  const [searchResult, setSearchResult] = useState(null);
  const [selectedMatchKey, setSelectedMatchKey] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [recentAudioFiles, setRecentAudioFiles] = useState([]);
  const [audioCurrentTimeSeconds, setAudioCurrentTimeSeconds] = useState(0);
  const [sessionState, setSessionState] = useState(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState(null);
  const [audioErrorMessage, setAudioErrorMessage] = useState(null);
  const [searchErrorMessage, setSearchErrorMessage] = useState(null);
  const [activeView, setActiveView] = useState("workspace");
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState("audio");
  const [activeEditableMarkerId, setActiveEditableMarkerId] = useState(null);
  const audioPlayerRef = useRef(null);
  const bookmarkNoteInputRef = useRef(null);
  const activeEditableMarkerIdRef = useRef(null);
  const resumeSectionRef = useRef(null);

  function setEditableMarker(markerId) {
    activeEditableMarkerIdRef.current = markerId || null;
    setActiveEditableMarkerId(markerId || null);
  }

  function clearSearchInteractionState() {
    setSearchResult(null);
    setSelectedMatchKey(null);
    setSearchErrorMessage(null);
  }

  function scrollToSection(sectionRef) {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDesktopState() {
      const desktopBridge = getDesktopBridge();
      const nextSessionState = await desktopBridge.getSessionState();

      if (cancelled) {
        return;
      }

      setSessionState(nextSessionState);
      setSessionErrorMessage(null);
    }

    loadDesktopState().catch(error => {
      if (!cancelled) {
        setSessionErrorMessage(error.message);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateBookmark(event) {
    event.preventDefault();

    if (!selectedAudioFile || !note.trim()) {
      return;
    }

    try {
      const desktopBridge = getDesktopBridge();
      const nextSessionState = activeEditableMarkerIdRef.current
        ? await updateBookmarkAndReadSessionState(desktopBridge, {
          id: activeEditableMarkerIdRef.current,
          note: note.trim(),
        })
        : (await createTimestampMarker(note.trim())).nextSessionState;
      setSessionState(nextSessionState);
      setSessionErrorMessage(null);
      setAudioErrorMessage(null);
      setNote("");
      setEditableMarker(null);
    } catch (error) {
      setSessionErrorMessage(error.message);
    }
  }

  async function createTimestampMarker(noteText = "") {
    if (!selectedAudioFile) {
      return false;
    }

    const desktopBridge = getDesktopBridge();
    const currentTimeSeconds = Math.max(
      0,
      Math.floor(audioPlayerRef.current ? audioPlayerRef.current.currentTime : audioCurrentTimeSeconds)
    );
    const nextSessionState = await createBookmarkAndReadSessionState(desktopBridge, {
      createdAt: new Date().toISOString(),
      filePath: selectedAudioFile.filePath,
      note: noteText,
      timeLabel: formatTimeLabel(currentTimeSeconds),
      timeSeconds: currentTimeSeconds,
    });

    setSessionState(nextSessionState);
    setAudioCurrentTimeSeconds(currentTimeSeconds);
    setSessionErrorMessage(null);
    setAudioErrorMessage(null);

    const nextBookmarks = Array.isArray(nextSessionState.bookmarks) ? nextSessionState.bookmarks : [];
    const createdMarker = nextBookmarks[nextBookmarks.length - 1] || null;

    return {
      createdMarker,
      nextSessionState,
    };
  }

  function setSelectedAudioContext(nextFile) {
    if (!nextFile) {
      return;
    }

    const isJSDOM = typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent || "");

    if (audioPlayerRef.current && !isJSDOM) {
      try {
        audioPlayerRef.current.pause();
      } catch (_error) {
        // JSDOM does not implement media pause; ignore in non-browser test contexts.
      }
    }

    setSelectedAudioFile(nextFile);
    setRecentAudioFiles(currentRecentFiles => addRecentAudioFile(currentRecentFiles, nextFile));
    setAudioCurrentTimeSeconds(0);
    setAudioErrorMessage(null);
    setNote("");
    setEditableMarker(null);
    setActiveWorkspaceSection("audio");
  }

  async function handleCreateFileNote(event) {
    event.preventDefault();

    if (!selectedAudioFile || !note.trim()) {
      return;
    }

    try {
      const desktopBridge = getDesktopBridge();
      const nextSessionState = await createBookmarkAndReadSessionState(desktopBridge, {
        createdAt: new Date().toISOString(),
        filePath: selectedAudioFile.filePath,
        note: note.trim(),
        timeLabel: null,
        timeSeconds: null,
      });

      setSessionState(nextSessionState);
      setSessionErrorMessage(null);
      setAudioErrorMessage(null);
      setNote("");
      setEditableMarker(null);
    } catch (error) {
      setSessionErrorMessage(error.message);
    }
  }

  async function handleSelectAudioFile() {
    try {
      const desktopBridge = getDesktopBridge();
      const selectedFile = await desktopBridge.selectAudioFile();

      if (!selectedFile.ok) {
        if (!selectedFile.canceled) {
          throw new Error(selectedFile.output);
        }

        return;
      }

      console.info("Consync audio file selected", {
        fileName: selectedFile.fileName,
        fileUrl: selectedFile.fileUrl,
      });
      setSelectedAudioContext(selectedFile);
    } catch (error) {
      setAudioErrorMessage(error.message);
    }
  }

  function handleSelectRecentAudioFile(recentFile) {
    setSelectedAudioContext(recentFile);
  }

  useEffect(() => {
    function handleMarkerHotkey(event) {
      if (event.defaultPrevented || event.repeat) {
        return;
      }

      if (event.key !== "b" && event.key !== "B") {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (!selectedAudioFile || activeView !== "workspace" || activeWorkspaceSection !== "audio" || !audioPlayerRef.current) {
        return;
      }

      createTimestampMarker("")
        .then(result => {
          if (!result || !result.nextSessionState) {
            return;
          }

          setSessionState(result.nextSessionState);
          setEditableMarker(result.createdMarker ? result.createdMarker.id || null : null);
          setNote("");

          if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(() => {
              if (bookmarkNoteInputRef.current) {
                bookmarkNoteInputRef.current.focus();
              }
            });
            return;
          }

          if (bookmarkNoteInputRef.current) {
            bookmarkNoteInputRef.current.focus();
          }
        })
        .catch(error => {
          setSessionErrorMessage(error.message);
        });
    }

    window.addEventListener("keydown", handleMarkerHotkey);

    return () => {
      window.removeEventListener("keydown", handleMarkerHotkey);
    };
  }, [activeView, activeWorkspaceSection, audioCurrentTimeSeconds, selectedAudioFile]);

  async function handleRunMockSearch(event) {
    event.preventDefault();

    if (!searchRoot.trim() || !searchQuery.trim()) {
      return;
    }

    try {
      const desktopBridge = getDesktopBridge();
      const result = await desktopBridge.runMockSearch(searchRoot.trim(), searchQuery.trim());

      if (!result.ok) {
        throw new Error(result.output);
      }

      setSearchResult(result);
      setSelectedMatchKey(null);
      setSearchErrorMessage(null);
    } catch (error) {
      setSearchErrorMessage(error.message);
      setSearchResult(null);
      setSelectedMatchKey(null);
    }
  }

  function handleSelectMockSearchMatch(group, match) {
    setSelectedMatchKey(getMockSearchSelectionKey(group, match));
    setSearchErrorMessage(null);
  }

  async function handleRevealSelectedMatch(fullPath) {
    if (!fullPath) {
      return;
    }

    try {
      const desktopBridge = getDesktopBridge();
      const result = await desktopBridge.revealSearchResult(fullPath);

      if (!result.ok) {
        throw new Error(result.output);
      }

      setSearchErrorMessage(null);
    } catch (error) {
      setSearchErrorMessage(error.message);
    }
  }

  function handleSeekToMarker(timeSeconds) {
    if (!audioPlayerRef.current || typeof timeSeconds !== "number" || Number.isNaN(timeSeconds)) {
      return;
    }

    audioPlayerRef.current.currentTime = timeSeconds;
    setAudioCurrentTimeSeconds(Math.max(0, Math.floor(timeSeconds)));
    setAudioErrorMessage(null);
    setEditableMarker(null);
  }

  const sessionRows = getSessionPanelRows(sessionState);
  const selectedAudioBookmarks = sessionState && selectedAudioFile
    ? sessionState.bookmarks.filter(bookmark => bookmark.filePath === selectedAudioFile.filePath)
    : [];
  const selectedAudioBookmarkGroups = splitBookmarksByTiming(selectedAudioBookmarks);
  const activeTimelineMarkerIndex = getActiveTimelineMarkerIndex(
    selectedAudioBookmarkGroups.timelineMarkers,
    audioCurrentTimeSeconds
  );
  const latestBookmark = selectedAudioBookmarks.length > 0
    ? selectedAudioBookmarks[selectedAudioBookmarks.length - 1]
    : sessionState && sessionState.bookmarks.length > 0
      ? sessionState.bookmarks[sessionState.bookmarks.length - 1]
      : null;
  const lastActivityTime = latestBookmark
    ? getBookmarkTimeLabel(latestBookmark)
    : (sessionState ? `${sessionState.currentPositionSeconds}s` : "loading");

  return (
    <main className="shell">
      <section className="workspace-layout">
        <aside className="workspace-column workspace-sidebar">
          <div className="column-heading">
            <p className="eyebrow">Consync</p>
            <h1>Workspace</h1>
          </div>

          <article className="panel panel-secondary">
            <h2>Views</h2>
            <div className="workspace-nav">
              <NavigationButton active={activeView === "workspace"} onClick={() => setActiveView("workspace")}>
                Workspace Summary
              </NavigationButton>
              <NavigationButton active={activeView === "timeline"} onClick={() => setActiveView("timeline")}>
                Timeline View
              </NavigationButton>
            </div>
          </article>

          <article className="panel panel-secondary">
            <h2>Current Session</h2>
            <StatusRow label="Current file" value={sessionState ? sessionState.currentFile : "loading"} />
            <StatusRow label="Bookmarks" value={sessionState ? sessionState.bookmarks.length : "loading"} />
            <StatusRow label="Latest note" value={latestBookmark ? latestBookmark.note : "none"} />
          </article>

          <article className="panel panel-secondary">
            <h2>Recent Audio</h2>
            {recentAudioFiles.length > 0 ? (
              <div className="workspace-nav">
                {recentAudioFiles.map(recentFile => (
                  <button
                    className={`workspace-nav-button${selectedAudioFile && selectedAudioFile.filePath === recentFile.filePath ? " workspace-nav-button-active" : ""}`}
                    key={recentFile.filePath}
                    onClick={() => handleSelectRecentAudioFile(recentFile)}
                    title={recentFile.fileName}
                    type="button"
                  >
                    <span className="recent-audio-label">{recentFile.fileName}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-state">Open an mp3 to start a quick recent-files list.</p>
            )}
          </article>
        </aside>

        <section className="workspace-column workspace-main">
          <div className="column-heading">
            <p className="eyebrow">Primary View</p>
            <h2>{activeView === "timeline" ? "Session Timeline" : "Session Summary"}</h2>
          </div>

          {sessionErrorMessage ? (
            <section className="panel session-error-panel">
              <h2>Session Error</h2>
              <p className="empty-state">{sessionErrorMessage}</p>
            </section>
          ) : null}

          {activeView === "timeline" ? (
            <section className="timeline-stage">
              <SessionTimelineShell sessionState={sessionState} />
            </section>
          ) : (
            <section className="workspace-stack">
              <article className="panel resume-panel" ref={resumeSectionRef}>
                <div className="resume-panel-header">
                  <div>
                    <h3>Resume Session</h3>
                    <p className="resume-panel-copy">Start here.</p>
                  </div>
                </div>

                <div className="panel-grid workspace-summary-grid">
                  <div className="panel panel-secondary">
                    <StatusRow label="Current file" value={sessionState ? sessionState.currentFile : "loading"} />
                    <StatusRow label="Latest note" value={latestBookmark ? latestBookmark.note : "none"} />
                    <StatusRow label="Last activity" value={lastActivityTime} />
                  </div>
                </div>

                <div className="resume-action-row">
                  <button
                    className="bookmark-button"
                    onClick={() => {
                      setActiveView("workspace");
                      setActiveWorkspaceSection("audio");
                      scrollToSection(resumeSectionRef);
                    }}
                    type="button"
                  >
                    Resume
                  </button>
                  <button
                    className="bookmark-button bookmark-button-secondary"
                    onClick={() => setActiveView("timeline")}
                    type="button"
                  >
                    Open Timeline
                  </button>
                  <button
                    className="bookmark-button bookmark-button-secondary"
                    onClick={() => {
                      setActiveView("workspace");
                      setActiveWorkspaceSection("search");
                    }}
                    type="button"
                  >
                    Search
                  </button>
                  <button
                    className="bookmark-button bookmark-button-secondary"
                    onClick={() => {
                      setActiveView("workspace");
                      setActiveWorkspaceSection("bookmarks");
                    }}
                    type="button"
                  >
                    View Bookmarks
                  </button>
                </div>
              </article>

              {activeWorkspaceSection === "audio" ? (
                <article className="panel">
                  <div className="audio-panel-header">
                    <div>
                      <h3>Audio Notes</h3>
                      <p className="empty-state">Load one local mp3, listen in place, and save notes at the current playback time.</p>
                    </div>
                    <button className="bookmark-button bookmark-button-secondary" onClick={handleSelectAudioFile} type="button">
                      Choose MP3
                    </button>
                  </div>

                  {audioErrorMessage ? <p className="empty-state">{audioErrorMessage}</p> : null}

                  {selectedAudioFile ? (
                    <div className="audio-note-stack">
                      <div className="mock-search-summary">
                        <StatusRow label="Selected file" value={selectedAudioFile.fileName} />
                        <StatusRow label="Current time" value={formatTimeLabel(audioCurrentTimeSeconds)} />
                      </div>

                      <audio
                        key={selectedAudioFile.filePath}
                        ref={audioPlayerRef}
                        className="audio-player"
                        controls
                        onLoadedMetadata={() => {
                          const nextCurrentTimeSeconds = Math.max(0, Math.floor(audioPlayerRef.current ? audioPlayerRef.current.currentTime : 0));

                          console.info("Consync audio metadata loaded", {
                            duration: audioPlayerRef.current ? audioPlayerRef.current.duration : null,
                            fileName: selectedAudioFile.fileName,
                            fileUrl: selectedAudioFile.fileUrl,
                          });
                          setAudioCurrentTimeSeconds(nextCurrentTimeSeconds);
                          setAudioErrorMessage(null);
                        }}
                        onError={() => {
                          const nextErrorMessage = getAudioErrorMessage(audioPlayerRef.current);

                          console.error("Consync audio playback error", {
                            errorCode: audioPlayerRef.current && audioPlayerRef.current.error
                              ? audioPlayerRef.current.error.code
                              : null,
                            fileName: selectedAudioFile.fileName,
                            fileUrl: selectedAudioFile.fileUrl,
                          });
                          setAudioErrorMessage(nextErrorMessage);
                        }}
                        onTimeUpdate={() => {
                          setAudioCurrentTimeSeconds(Math.max(0, Math.floor(audioPlayerRef.current ? audioPlayerRef.current.currentTime : 0)));
                        }}
                        preload="metadata"
                        src={selectedAudioFile.audioSrc || selectedAudioFile.fileUrl}
                      />

                      <form className="bookmark-form" onSubmit={handleCreateBookmark}>
                        <label className="bookmark-label" htmlFor="bookmark-note">
                          Note text
                        </label>
                        <input
                          id="bookmark-note"
                          className="bookmark-input"
                          ref={bookmarkNoteInputRef}
                          value={note}
                          onChange={event => setNote(event.target.value)}
                          placeholder="Add a short note for this moment"
                          type="text"
                        />
                        <div className="bookmark-action-row">
                          <button
                            className="bookmark-button bookmark-button-secondary"
                            disabled={!selectedAudioFile || !note.trim()}
                            onClick={handleCreateFileNote}
                            type="button"
                          >
                            Add Note
                          </button>
                          <button className="bookmark-button" disabled={!selectedAudioFile || !note.trim()} type="submit">
                            Save note at current time
                          </button>
                        </div>
                      </form>

                      <section className="bookmark-section">
                        <h4>File Notes</h4>
                        {selectedAudioBookmarkGroups.fileNotes.length > 0 ? (
                          <ul className="bookmark-list">
                            {selectedAudioBookmarkGroups.fileNotes.map((bookmark, index) => (
                              <li className="bookmark-item" key={`${bookmark.id || "bookmark"}-file-${bookmark.note || "note"}-${index}`}>
                                <span className="bookmark-time">{getBookmarkTimeLabel(bookmark)}</span>
                                <span className="bookmark-note">{getBookmarkDisplayNote(bookmark)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="empty-state">No file notes saved for this audio file yet.</p>
                        )}
                      </section>

                      <section className="bookmark-section">
                        <h4>Timeline Markers</h4>
                        {selectedAudioBookmarkGroups.timelineMarkers.length > 0 ? (
                          <ul className="bookmark-list">
                            {selectedAudioBookmarkGroups.timelineMarkers.map((bookmark, index) => (
                              <li
                                className={`bookmark-item${index === activeTimelineMarkerIndex ? " bookmark-item-active" : ""}`}
                                key={`${bookmark.id || "bookmark"}-${bookmark.timeSeconds}-${bookmark.note || "note"}-${index}`}
                              >
                                <button
                                  className="bookmark-marker-button"
                                  onClick={() => handleSeekToMarker(bookmark.timeSeconds)}
                                  type="button"
                                >
                                  <span className="bookmark-time">{getBookmarkTimeLabel(bookmark)}</span>
                                  <span className="bookmark-note">{getBookmarkDisplayNote(bookmark)}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="empty-state">No time-based markers saved for this audio file yet.</p>
                        )}
                      </section>
                    </div>
                  ) : (
                    <div className="audio-note-stack">
                      <form className="bookmark-form" onSubmit={handleCreateBookmark}>
                        <label className="bookmark-label" htmlFor="bookmark-note">
                          Note text
                        </label>
                        <input
                          id="bookmark-note"
                          className="bookmark-input"
                          value={note}
                          onChange={event => setNote(event.target.value)}
                          placeholder="Choose an mp3 before attaching a note"
                          type="text"
                        />
                        <div className="bookmark-action-row">
                          <button className="bookmark-button bookmark-button-secondary" disabled type="button">
                            Add Note
                          </button>
                          <button className="bookmark-button" disabled type="submit">
                            Save note at current time
                          </button>
                        </div>
                      </form>
                      <p className="empty-state">Choose one local `.mp3` to start a lightweight audio-note session.</p>
                    </div>
                  )}
                </article>
              ) : null}

              {activeWorkspaceSection === "search" ? (
                <article className="panel">
                  <h3>Search Related Work</h3>
                  <form className="search-form" onSubmit={handleRunMockSearch}>
                    <label className="bookmark-label" htmlFor="mock-search-root">
                      Root to search
                    </label>
                    <input
                      id="mock-search-root"
                      className="bookmark-input"
                      value={searchRoot}
                      onChange={event => {
                        setSearchRoot(event.target.value);
                        clearSearchInteractionState();
                      }}
                      placeholder="Choose a root such as sandbox/fixtures/nested-anchor-trial"
                      type="text"
                    />
                    <label className="bookmark-label" htmlFor="mock-search-query">
                      Theme query
                    </label>
                    <input
                      id="mock-search-query"
                      className="bookmark-input"
                      value={searchQuery}
                      onChange={event => {
                        setSearchQuery(event.target.value);
                        clearSearchInteractionState();
                      }}
                      placeholder="Search bookmarked context such as moss"
                      type="text"
                    />
                    <button className="bookmark-button" disabled={!searchRoot.trim() || !searchQuery.trim()} type="submit">
                      Run Mock Search
                    </button>
                  </form>

                  {searchErrorMessage ? (
                    <section className="panel panel-inline panel-secondary search-error-panel">
                      <h3>Search Error</h3>
                      <p className="empty-state">{searchErrorMessage}</p>
                    </section>
                  ) : null}

                  {searchResult ? (
                    <MockSearchResult
                      onRevealSelectedMatch={handleRevealSelectedMatch}
                      onSelectMatch={handleSelectMockSearchMatch}
                      searchResult={searchResult}
                      selectedMatchKey={selectedMatchKey}
                    />
                  ) : (
                    <p className="empty-state">
                      Enter a root and query to preview the grouped mock search flow in the desktop shell.
                    </p>
                  )}
                </article>
              ) : null}

              {activeWorkspaceSection === "bookmarks" ? (
                <article className="panel">
                  <h3>Bookmarks</h3>
                  {selectedAudioFile ? (
                    <p className="empty-state">Showing notes for {selectedAudioFile.fileName}.</p>
                  ) : (
                    <p className="empty-state">Choose an audio file first to review its saved notes.</p>
                  )}
                  {selectedAudioFile ? (
                    <div className="audio-note-stack">
                      <section className="bookmark-section">
                        <h4>File Notes</h4>
                        {selectedAudioBookmarkGroups.fileNotes.length > 0 ? (
                          <ul className="bookmark-list">
                            {selectedAudioBookmarkGroups.fileNotes.map((bookmark, index) => (
                              <li className="bookmark-item" key={`${bookmark.id || "bookmark"}-file-${bookmark.note || "note"}-${index}`}>
                                <span className="bookmark-time">{getBookmarkTimeLabel(bookmark)}</span>
                                <span className="bookmark-note">{getBookmarkDisplayNote(bookmark)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="empty-state">No file notes saved for this audio file yet.</p>
                        )}
                      </section>
                      <section className="bookmark-section">
                        <h4>Timeline Markers</h4>
                        {selectedAudioBookmarkGroups.timelineMarkers.length > 0 ? (
                          <ul className="bookmark-list">
                            {selectedAudioBookmarkGroups.timelineMarkers.map((bookmark, index) => (
                              <li
                                className={`bookmark-item${index === activeTimelineMarkerIndex ? " bookmark-item-active" : ""}`}
                                key={`${bookmark.id || "bookmark"}-${bookmark.timeSeconds}-${bookmark.note || "note"}-${index}`}
                              >
                                <button
                                  className="bookmark-marker-button"
                                  onClick={() => handleSeekToMarker(bookmark.timeSeconds)}
                                  type="button"
                                >
                                  <span className="bookmark-time">{getBookmarkTimeLabel(bookmark)}</span>
                                  <span className="bookmark-note">{getBookmarkDisplayNote(bookmark)}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="empty-state">No time-based markers saved for this audio file yet.</p>
                        )}
                      </section>
                    </div>
                  ) : null}
                </article>
              ) : null}
            </section>
          )}
        </section>

        <InspectorPanel
          searchResult={searchResult}
          selectedAudioFile={selectedAudioFile}
          selectedMatchKey={selectedMatchKey}
          sessionState={sessionState}
        />
      </section>
    </main>
  );
}
