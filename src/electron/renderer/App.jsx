import { useEffect, useState } from "react";

function StatusRow({ label, value }) {
  return (
    <div className="status-row">
      <span className="status-label">{label}</span>
      <span className="status-value">{value}</span>
    </div>
  );
}

export function App() {
  const [shellInfo, setShellInfo] = useState(null);
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDesktopState() {
      const [nextShellInfo, nextPingResult] = await Promise.all([
        window.consyncDesktop.getShellInfo(),
        window.consyncDesktop.ping("desktop-ui"),
      ]);

      if (cancelled) {
        return;
      }

      setShellInfo(nextShellInfo);
      setPingResult(nextPingResult);
    }

    loadDesktopState().catch(error => {
      if (!cancelled) {
        setPingResult({
          ok: false,
          message: error.message,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Consync Desktop Scaffold</p>
        <h1>Desktop shell first, app logic second.</h1>
        <p className="lead">
          This placeholder UI proves the Electron main process, preload bridge, and React renderer
          launch cleanly without moving filesystem logic into the renderer.
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Bridge Check</h2>
          <StatusRow label="IPC ping" value={pingResult ? pingResult.message : "loading"} />
          <StatusRow label="Shared core" value={shellInfo ? shellInfo.sharedCorePath : "loading"} />
          <StatusRow label="Renderer" value={shellInfo ? shellInfo.renderer : "loading"} />
        </article>

        <article className="panel">
          <h2>Paused For Now</h2>
          <ul className="paused-list">
            {(shellInfo?.pausedWork || ["loading", "loading", "loading"]).map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}