import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

const noResultsSearchResult = {
  ok: true,
  output: [
    "ROOT: sandbox/fixtures/nested-anchor-trial",
    "QUERY: moss",
    "SESSIONS: 0",
    "MATCHES: 0",
  ].join("\n"),
  rootPath: "sandbox/fixtures/nested-anchor-trial",
  query: "moss",
  sessionCount: 0,
  matchCount: 0,
  groups: [],
};

const timelineBookmarkSessionState = {
  artifactCount: 4,
  bookmarks: [
    {
      note: "Moss entry",
      timeSeconds: 18,
    },
    {
      note: "Lantern pivot",
      timeSeconds: 72,
    },
  ],
  currentFile: "20260405T154039301Z.json",
  currentPositionSeconds: 84,
  latestBookmark: null,
};

function createDesktopBridge(overrides = {}) {
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
    ...overrides,
  };
}

describe("App search flow", () => {
  beforeEach(() => {
    cleanup();
    window.consyncDesktop = createDesktopBridge();
  });

  it("renders a creative session timeline shell with placeholder tracks", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Session Timeline" })).toBeTruthy();
    expect(screen.getByText("Session Events")).toBeTruthy();
    expect(screen.getByLabelText("Bookmarks markers")).toBeTruthy();
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(screen.getByText("Audio Cues")).toBeTruthy();
    expect(screen.getByText("Current focus")).toBeTruthy();
    expect(screen.getByText("First bookmark pending")).toBeTruthy();
  });

  it("renders real current-session bookmark markers in the bookmark lane", async () => {
    window.consyncDesktop = createDesktopBridge({
      getSessionState: vi.fn().mockResolvedValue(timelineBookmarkSessionState),
    });

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Session Timeline" })).toBeTruthy();
    const bookmarkLane = await screen.findByLabelText("Bookmarks markers");
    const bookmarkTrack = bookmarkLane.closest(".timeline-track");

    expect(bookmarkTrack).toBeTruthy();
    expect(within(bookmarkLane).getByText("Moss entry")).toBeTruthy();
    expect(within(bookmarkLane).getByText("Lantern pivot")).toBeTruthy();
    expect(within(bookmarkLane).getByText("18s bookmark")).toBeTruthy();
    expect(within(bookmarkLane).getByText("72s bookmark")).toBeTruthy();
    expect(within(bookmarkTrack).getByText("2 markers")).toBeTruthy();
    expect(within(bookmarkLane).queryByText("First bookmark pending")).toBeNull();
  });

  it("adds a new real bookmark marker to the lane after bookmark capture", async () => {
    const user = userEvent.setup();
    const getSessionState = vi
      .fn()
      .mockResolvedValueOnce({
        artifactCount: 4,
        bookmarks: [],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      })
      .mockResolvedValueOnce({
        artifactCount: 5,
        bookmarks: [
          {
            note: "Bridge motif",
            timeSeconds: 48,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      });

    window.consyncDesktop = createDesktopBridge({
      getSessionState,
    });

    render(<App />);

    const bookmarkLane = await screen.findByLabelText("Bookmarks markers");

    expect(within(bookmarkLane).getByText("First bookmark pending")).toBeTruthy();

    await user.type(screen.getByLabelText("Bookmark note for this session"), "Bridge motif");
    await user.click(screen.getByRole("button", { name: "Save Bookmark" }));

    await waitFor(() => {
      expect(within(bookmarkLane).getByText("Bridge motif")).toBeTruthy();
    });
    expect(within(bookmarkLane).getByText("48s bookmark")).toBeTruthy();
    expect(within(bookmarkLane).queryByText("First bookmark pending")).toBeNull();
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
    expect(screen.getAllByText("Greenhouse Poster Session")).toHaveLength(2);
    expect(screen.getAllByText("2026/april/greenhouse-poster")).toHaveLength(2);
    expect(screen.getByText("moss, poster, texture")).toBeTruthy();
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

  it("keeps explicit actions disabled until a result is selected and resets selection on a new search", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    const revealButton = screen.getByRole("button", { name: "Reveal in Finder" });

    expect(screen.getByText("Click a result row to inspect one match more closely.")).toBeTruthy();
    expect(revealButton.disabled).toBe(true);

    await user.click(screen.getByRole("button", { name: /exports\/cover-notes\.md/i }));

    expect(revealButton.disabled).toBe(false);
    expect(
      screen.getByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md"
      )
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    expect(screen.getByText("Click a result row to inspect one match more closely.")).toBeTruthy();
    expect(revealButton.disabled).toBe(true);
    expect(window.consyncDesktop.revealSearchResult).not.toHaveBeenCalled();
  });

  it("updates the detail panel to the current selection and preserves it when reveal fails", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      revealSearchResult: vi.fn().mockResolvedValue({ ok: false, output: "Reveal failed for test" }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    await user.click(screen.getByRole("button", { name: /exports\/cover-notes\.md/i }));
    expect(
      screen.getByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md"
      )
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /captures\/moss-study\.jpg/i }));

    expect(
      screen.getByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
      )
    ).toBeTruthy();
    expect(screen.queryByText("Click a result row to inspect one match more closely.")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Reveal in Finder" }));

    expect(await screen.findByText("Reveal failed for test")).toBeTruthy();
    expect(
      screen.getByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
      )
    ).toBeTruthy();
    expect(screen.getAllByText("Greenhouse Poster Session")).toHaveLength(2);
    expect(window.consyncDesktop.revealSearchResult).toHaveBeenCalledWith(
      "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
    );
  });

  it("clears stale results when the query changes after results load", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    expect(screen.getByRole("button", { name: "Reveal in Finder" }).disabled).toBe(true);

    await user.type(screen.getByLabelText("Theme query"), "-alt");

    expect(screen.queryByText("Balcony Zine Session")).toBeNull();
    expect(
      screen.getByText("Enter a root and query to preview the grouped mock search flow in the desktop shell.")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();
  });

  it("clears stale selection and detail when the query changes after a result is selected", async () => {
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

    await user.type(screen.getByLabelText("Theme query"), "-updated");

    expect(screen.queryByText("exports/cover-notes.md")).toBeNull();
    expect(screen.queryByText("Moss motif for cover transition")).toBeNull();
    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();
    expect(
      screen.getByText("Enter a root and query to preview the grouped mock search flow in the desktop shell.")
    ).toBeTruthy();
  });

  it("clears stale selection and detail when the root changes after a result is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");
    await user.click(screen.getByRole("button", { name: /captures\/moss-study\.jpg/i }));

    expect(
      screen.getByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
      )
    ).toBeTruthy();

    await user.type(screen.getByLabelText("Root to search"), "-other-root");

    expect(screen.queryByText("Greenhouse Poster Session")).toBeNull();
    expect(screen.queryByText("moss, poster, texture")).toBeNull();
    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();
    expect(
      screen.getByText("Enter a root and query to preview the grouped mock search flow in the desktop shell.")
    ).toBeTruthy();
  });

  it("shows a search error when runMockSearch fails", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      runMockSearch: vi.fn().mockResolvedValue({ ok: false, output: "Search failed for test" }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));

    expect(await screen.findByRole("heading", { name: "Search Error" })).toBeTruthy();
    expect(await screen.findByText("Search failed for test")).toBeTruthy();
    expect(screen.queryByText("Balcony Zine Session")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Session Error" })).toBeNull();
  });

  it("clears a failed-search error when the query input changes", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      runMockSearch: vi.fn().mockResolvedValue({ ok: false, output: "Search failed for test" }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));

    expect(await screen.findByText("Search failed for test")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();

    await user.type(screen.getByLabelText("Theme query"), "-retry");

    expect(screen.queryByText("Search failed for test")).toBeNull();
    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();
    expect(
      screen.getByText("Enter a root and query to preview the grouped mock search flow in the desktop shell.")
    ).toBeTruthy();
  });

  it("clears a failed-search error when the root input changes", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      runMockSearch: vi.fn().mockResolvedValue({ ok: false, output: "Search failed for test" }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));

    expect(await screen.findByText("Search failed for test")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();

    await user.type(screen.getByLabelText("Root to search"), "-retry-root");

    expect(screen.queryByText("Search failed for test")).toBeNull();
    expect(screen.queryByRole("button", { name: "Reveal in Finder" })).toBeNull();
    expect(
      screen.getByText("Enter a root and query to preview the grouped mock search flow in the desktop shell.")
    ).toBeTruthy();
  });

  it("shows a session error when reveal fails", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      revealSearchResult: vi.fn().mockResolvedValue({ ok: false, output: "Reveal failed for test" }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");
    await user.click(screen.getByRole("button", { name: /exports\/cover-notes\.md/i }));
    await user.click(screen.getByRole("button", { name: "Reveal in Finder" }));

    expect(await screen.findByRole("heading", { name: "Search Error" })).toBeTruthy();
    expect(await screen.findByText("Reveal failed for test")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Session Error" })).toBeNull();
  });

  it("keeps non-search session errors separate from search-panel errors", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      createBookmark: vi.fn().mockRejectedValue(new Error("Bookmark failed for test")),
    });

    render(<App />);

    await user.type(screen.getByLabelText("Bookmark note for this session"), "note");
    await user.click(screen.getByRole("button", { name: "Save Bookmark" }));

    expect(await screen.findByRole("heading", { name: "Session Error" })).toBeTruthy();
    expect(await screen.findByText("Bookmark failed for test")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Search Error" })).toBeNull();
  });

  it("renders the no-results state without fabricating matches", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      runMockSearch: vi.fn().mockResolvedValue(noResultsSearchResult),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));

    expect(await screen.findByText("No bookmarked matches found for this root and query.")).toBeTruthy();
    expect(screen.getByText("Click a result row to inspect one match more closely.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reveal in Finder" }).disabled).toBe(true);
  });
});