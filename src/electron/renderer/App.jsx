import { useEffect, useState } from "react";

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
    typeof desktopBridge.createBookmark !== "function"
  ) {
    throw new Error("Consync desktop bridge is unavailable.");
  }

  return desktopBridge;
}

export function App() {
  const [backendSummary, setBackendSummary] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [consyncSummary, setConsyncSummary] = useState(null);
  const [note, setNote] = useState("");
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
      const nextSessionState = await desktopBridge.createBookmark(note.trim());
      setSessionState(nextSessionState);
      setErrorMessage(null);
      setNote("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Consync Desktop Capture</p>
        <h1>Bridge proof with one real backend signal.</h1>
        <p className="lead">
          This step carries one small real backend value through preload into the renderer so the
          desktop shell proves end-to-end data flow before broader UI work continues.
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
          <StatusRow
            label="Current file"
            value={sessionState ? sessionState.currentFile : "loading"}
          />
          <StatusRow
            label="Position"
            value={sessionState ? `${sessionState.currentPositionSeconds}s` : "loading"}
          />
          <StatusRow label="Bookmarks" value={sessionState ? sessionState.bookmarks.length : "loading"} />
        </article>

        <article className="panel">
          <h2>Drop Bookmark</h2>
          <form className="bookmark-form" onSubmit={handleCreateBookmark}>
            <label className="bookmark-label" htmlFor="bookmark-note">
              Bookmark note
            </label>
            <input
              id="bookmark-note"
              className="bookmark-input"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Describe what matters at this moment"
              type="text"
            />
            <button className="bookmark-button" disabled={!note.trim()} type="submit">
              Drop Bookmark
            </button>
          </form>
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
            <p className="empty-state">No bookmarks yet. Drop one to prove the loop.</p>
          )}
        </article>
      </section>
    </main>
  );
}