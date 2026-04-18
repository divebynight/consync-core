import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../electron/renderer/App.jsx";

const mockSearchResult = {
  ok: true,
  output: [
    "ROOT: sandbox/fixtures/nested-anchor-trial",
    "QUERY: moss",
    "SESSIONS: 2",
    "MATCHES: 2",
  ].join("\n"),
  rootPath: "sandbox/fixtures/nested-anchor-trial",
  query: "moss",
  sessionCount: 2,
  matchCount: 2,
  groups: [
    {
      anchorPath: "2026/april/balcony-zine",
      sessionTitle: "Balcony Zine Session",
      matches: [
        {
          artifactPath: "exports/cover-notes.md",
          note: "Moss motif for cover transition",
          tags: ["cover", "moss", "print"],
        },
      ],
    },
    {
      anchorPath: "2026/april/greenhouse-poster",
      sessionTitle: "Greenhouse Poster Session",
      matches: [
        {
          artifactPath: "captures/moss-study.jpg",
          note: "Moss texture reference for poster lighting",
          tags: ["moss", "poster", "texture"],
        },
      ],
    },
  ],
};

function createDesktopBridge() {
  return {
    getBackendSummary: vi.fn().mockResolvedValue({
      platform: "darwin",
      cwd: "/Users/markhughes/Projects/consync-core",
    }),
    getBridgeStatus: vi.fn().mockResolvedValue({
      status: "ok",
      surface: "preload",
      version: "test",
    }),
    getConsyncSummary: vi.fn().mockResolvedValue({
      sessionDirectoryExists: true,
      sessionCount: 4,
    }),
    getSessionState: vi.fn().mockResolvedValue({
      artifactCount: 4,
      bookmarks: [],
      currentFile: "20260405T154039301Z.json",
      currentPositionSeconds: 84,
      latestBookmark: null,
    }),
    createBookmark: vi.fn().mockResolvedValue({ ok: true }),
    revealSearchResult: vi.fn().mockResolvedValue({ ok: true, output: "revealed" }),
    runMockSearch: vi.fn().mockResolvedValue(mockSearchResult),
  };
}

describe("App search flow", () => {
  beforeEach(() => {
    cleanup();
    window.consyncDesktop = createDesktopBridge();
  });

  it("renders grouped results and keeps selection separate from reveal", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));

    expect(await screen.findByText("Balcony Zine Session")).toBeTruthy();
    expect(screen.getByText("Greenhouse Poster Session")).toBeTruthy();
    expect(screen.getByText("exports/cover-notes.md")).toBeTruthy();
    expect(screen.getByText("captures/moss-study.jpg")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /captures\/moss-study\.jpg/i }));

    expect(
      screen.getByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
      )
    ).toBeTruthy();
    expect(screen.getAllByText("Moss texture reference for poster lighting")).toHaveLength(2);
    expect(window.consyncDesktop.revealSearchResult).not.toHaveBeenCalled();
  });

  it("reveals only when the explicit button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    await user.click(screen.getByRole("button", { name: /exports\/cover-notes\.md/i }));

    expect(
      screen.getByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md"
      )
    ).toBeTruthy();
    expect(window.consyncDesktop.revealSearchResult).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Reveal in Finder" }));

    await waitFor(() => {
      expect(window.consyncDesktop.revealSearchResult).toHaveBeenCalledWith(
        "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md"
      );
    });
  });
});