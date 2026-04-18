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
  const [errorMessage, setErrorMessage] = useState(null);

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
      setErrorMessage(null);
    }

    loadDesktopState().catch(error => {
      if (!cancelled) {
        setErrorMessage(error.message);
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
      setErrorMessage(null);
      setNote("");
    } catch (error) {
      setErrorMessage(error.message);
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
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.message);
      setSearchResult(null);
      setSelectedMatchKey(null);
    }
  }

  function handleSelectMockSearchMatch(group, match) {
    setSelectedMatchKey(getMockSearchSelectionKey(group, match));
    setErrorMessage(null);
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

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const sessionRows = getSessionPanelRows(sessionState);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Consync Desktop Capture</p>
        <h1>Bridge proof with incremental real session values.</h1>
        <p className="lead">
          This shell now surfaces a small set of real session details carried through preload into
          the renderer so each narrow UI step stays easy to verify before broader work continues.
        </p>
      </section>

      {errorMessage ? (
        <section className="panel">
          <h2>Session Error</h2>
          <p className="empty-state">{errorMessage}</p>
        </section>
      ) : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>Bridge Status</h2>
          <StatusRow label="Status" value={bridgeStatus ? bridgeStatus.status : "loading"} />
          <StatusRow label="Surface" value={bridgeStatus ? bridgeStatus.surface : "loading"} />
          <StatusRow label="Version" value={bridgeStatus ? bridgeStatus.version : "loading"} />
        </article>

        <article className="panel">
          <h2>Backend Summary</h2>
          <StatusRow label="Platform" value={backendSummary ? backendSummary.platform : "loading"} />
          <StatusRow label="Current dir" value={backendSummary ? backendSummary.cwd : "loading"} />
        </article>

        <article className="panel">
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

        <article className="panel">
          <h2>Session</h2>
          {sessionRows.map(row => (
            <StatusRow key={row.label} label={row.label} value={row.value} />
          ))}
        </article>

        <article className="panel">
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

        <article className="panel panel-wide">
          <h2>Mock Search</h2>
          <form className="search-form" onSubmit={handleRunMockSearch}>
            <label className="bookmark-label" htmlFor="mock-search-root">
              Root to search
            </label>
            <input
              id="mock-search-root"
              className="bookmark-input"
              value={searchRoot}
              onChange={event => setSearchRoot(event.target.value)}
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
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search bookmarked context such as moss"
              type="text"
            />
            <button className="bookmark-button" disabled={!searchRoot.trim() || !searchQuery.trim()} type="submit">
              Run Mock Search
            </button>
          </form>

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

        <article className="panel panel-wide">
          <h2>Bookmarks</h2>
          {sessionState && sessionState.bookmarks.length > 0 ? (
            <ul className="bookmark-list">
              {sessionState.bookmarks.map(bookmark => (
                <li className="bookmark-item" key={bookmark.id}>
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
    </main>
  );
}