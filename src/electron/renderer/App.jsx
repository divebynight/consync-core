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
    typeof desktopBridge.getSessionState !== "function" ||
    typeof desktopBridge.createBookmark !== "function"
  ) {
    throw new Error("Consync desktop bridge is unavailable.");
  }

  return desktopBridge;
}

export function App() {
  const [note, setNote] = useState("");
  const [sessionState, setSessionState] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDesktopState() {
      const desktopBridge = getDesktopBridge();
      const nextSessionState = await desktopBridge.getSessionState();

      if (cancelled) {
        return;
      }

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
        <h1>First session loop, still in memory only.</h1>
        <p className="lead">
          This scaffold step proves the renderer can read shared session state and drop bookmarks
          through preload and IPC without moving session logic into React.
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