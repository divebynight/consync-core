import React, { useEffect, useState } from "react";
import { createBookmarkAndReadSessionState } from "./bookmark-flow.mjs";
import {
  getMockSearchDetailRows,
  getMockSearchSelectionKey,
  getMockSearchSummaryRows,
  getSelectedMockSearchDetail,
} from "./mock-search-panel.mjs";
import { getSessionPanelRows } from "./session-panel.mjs";

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
        <p className="eyebrow timeline-eyebrow">Creative Timeline</p>
        <h2>Session Timeline</h2>
        <p className="timeline-copy">
          A creative session surface with real bookmark and session event lanes, plus placeholder tracks for notes and audio cues.
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
    typeof desktopBridge.getBackendSummary !== "function" ||
    typeof desktopBridge.getBridgeStatus !== "function" ||
    typeof desktopBridge.getConsyncSummary !== "function" ||
    typeof desktopBridge.getSessionState !== "function" ||
    typeof desktopBridge.createBookmark !== "function" ||
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

export function App() {
  const [backendSummary, setBackendSummary] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [consyncSummary, setConsyncSummary] = useState(null);
  const [note, setNote] = useState("");
  const [searchRoot, setSearchRoot] = useState("sandbox/fixtures/nested-anchor-trial");
  const [searchQuery, setSearchQuery] = useState("moss");
  const [searchResult, setSearchResult] = useState(null);
  const [selectedMatchKey, setSelectedMatchKey] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState(null);
  const [searchErrorMessage, setSearchErrorMessage] = useState(null);

  function clearSearchInteractionState() {
    setSearchResult(null);
    setSelectedMatchKey(null);
    setSearchErrorMessage(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDesktopState() {
      const desktopBridge = getDesktopBridge();
      const [nextBackendSummary, nextBridgeStatus, nextConsyncSummary, nextSessionState] = await Promise.all([
        desktopBridge.getBackendSummary(),
        desktopBridge.getBridgeStatus(),
        desktopBridge.getConsyncSummary(),
        desktopBridge.getSessionState(),
      ]);

      if (cancelled) {
        return;
      }

      setBackendSummary(nextBackendSummary);
      setBridgeStatus(nextBridgeStatus);
      setConsyncSummary(nextConsyncSummary);
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

    if (!note.trim()) {
      return;
    }

    try {
      const desktopBridge = getDesktopBridge();
      const nextSessionState = await createBookmarkAndReadSessionState(desktopBridge, note.trim());
      setSessionState(nextSessionState);
      setSessionErrorMessage(null);
      setNote("");
    } catch (error) {
      setSessionErrorMessage(error.message);
    }
  }

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

  const sessionRows = getSessionPanelRows(sessionState);

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Consync Desktop Capture</p>
          <h1>Bridge proof with incremental real session values.</h1>
          <p className="lead">
            This shell now surfaces a small set of real session details carried through preload into
            the renderer so each narrow UI step stays easy to verify before broader work continues.
          </p>
        </div>
      </section>

      <section className="workspace-shell">
        {sessionErrorMessage ? (
          <section className="panel session-error-panel">
            <h2>Session Error</h2>
            <p className="empty-state">{sessionErrorMessage}</p>
          </section>
        ) : null}

        <section className="timeline-stage">
          <SessionTimelineShell sessionState={sessionState} />
        </section>

        <section className="support-region" aria-label="Supporting session panels">
          <div className="support-region-heading">
            <p className="eyebrow support-eyebrow">Support Panels</p>
            <h2>Search, capture, and session context</h2>
            <p className="support-copy">
              The timeline holds the main session story while these panels stay available for search,
              bookmark capture, and inspection.
            </p>
          </div>

          <section className="panel-grid support-panel-grid">
            <article className="panel panel-secondary">
          <h2>Bridge Status</h2>
          <StatusRow label="Status" value={bridgeStatus ? bridgeStatus.status : "loading"} />
          <StatusRow label="Surface" value={bridgeStatus ? bridgeStatus.surface : "loading"} />
          <StatusRow label="Version" value={bridgeStatus ? bridgeStatus.version : "loading"} />
            </article>

            <article className="panel panel-secondary">
          <h2>Backend Summary</h2>
          <StatusRow label="Platform" value={backendSummary ? backendSummary.platform : "loading"} />
          <StatusRow label="Current dir" value={backendSummary ? backendSummary.cwd : "loading"} />
            </article>

            <article className="panel panel-secondary">
          <h2>Consync Summary</h2>
          <StatusRow
            label="Session dir"
            value={consyncSummary ? (consyncSummary.sessionDirectoryExists ? "present" : "missing") : "loading"}
          />
          <StatusRow
            label="Session count"
            value={consyncSummary ? consyncSummary.sessionCount : "loading"}
          />
            </article>

            <article className="panel panel-secondary">
          <h2>Session</h2>
          {sessionRows.map(row => (
            <StatusRow key={row.label} label={row.label} value={row.value} />
          ))}
            </article>

            <article className="panel panel-secondary panel-capture">
          <h2>Save Bookmark</h2>
          <form className="bookmark-form" onSubmit={handleCreateBookmark}>
            <label className="bookmark-label" htmlFor="bookmark-note">
              Bookmark note for this session
            </label>
            <input
              id="bookmark-note"
              className="bookmark-input"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Add a short note to save in this session"
              type="text"
            />
            <button className="bookmark-button" disabled={!note.trim()} type="submit">
              Save Bookmark
            </button>
          </form>
            </article>

            <article className="panel panel-wide panel-secondary panel-search-workspace">
          <h2>Mock Search</h2>
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
            <p className="empty-state">Enter a root and query to preview the grouped mock search flow in the desktop shell.</p>
          )}
            </article>

            <article className="panel panel-wide panel-secondary panel-bookmarks">
          <h2>Bookmarks</h2>
          {sessionState && sessionState.bookmarks.length > 0 ? (
            <ul className="bookmark-list">
              {sessionState.bookmarks.map((bookmark, index) => (
                <li className="bookmark-item" key={`${bookmark.id || "bookmark"}-${bookmark.timeSeconds}-${bookmark.note || "note"}-${index}`}>
                  <span className="bookmark-time">{bookmark.timeSeconds}s</span>
                  <span className="bookmark-note">{bookmark.note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No bookmarks saved for this session yet. Drop one to create the first entry.</p>
          )}
            </article>
          </section>
        </section>
      </section>
    </main>
  );
}