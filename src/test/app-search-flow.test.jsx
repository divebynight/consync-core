import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    selectAudioFile: vi.fn().mockResolvedValue({
      audioSrc: "data:audio/mpeg;base64,c2FtcGxl",
      canceled: false,
      fileName: "sample.mp3",
      filePath: "/tmp/sample.mp3",
      fileUrl: "file:///tmp/sample.mp3",
      ok: true,
    }),
    revealSearchResult: vi.fn().mockResolvedValue({ ok: true, output: "revealed" }),
    runMockSearch: vi.fn().mockResolvedValue(mockSearchResult),
    ...overrides,
  };
}

async function openSearchSection(user) {
  await user.click(screen.getByRole("button", { name: "Search" }));
}

describe("App search flow", () => {
  beforeEach(() => {
    cleanup();
    window.consyncDesktop = createDesktopBridge();
  });

  it("renders a workspace summary by default and keeps timeline behind a view toggle", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Workspace" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Session Summary" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Timeline View" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Audio Notes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose MP3" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Session Timeline" })).toBeNull();
  });

  it("renders real current-session bookmark markers when timeline view is opened", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      getSessionState: vi.fn().mockResolvedValue(timelineBookmarkSessionState),
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Timeline View" }));

    expect((await screen.findAllByRole("heading", { name: "Session Timeline" })).length).toBeGreaterThan(0);
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

  it("renders real session event markers when timeline view is opened", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      getSessionState: vi.fn().mockResolvedValue(timelineBookmarkSessionState),
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Timeline View" }));

    const sessionEventsLane = await screen.findByLabelText("Session Events markers");
    const sessionEventsTrack = sessionEventsLane.closest(".timeline-track");

    expect(sessionEventsTrack).toBeTruthy();
    expect(within(sessionEventsLane).getByText("Current focus")).toBeTruthy();
    expect(within(sessionEventsLane).getByText("84s in 20260405T154039301Z.json")).toBeTruthy();
    expect(within(sessionEventsTrack).getByText("1 markers")).toBeTruthy();
    expect(within(sessionEventsLane).queryByText("Re-entry window")).toBeNull();
  });

  it("adds a new audio note to the workspace surfaces after bookmark capture", async () => {
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
            createdAt: "2026-04-23T18:00:00.000Z",
            filePath: "/tmp/sample.mp3",
            note: "Bridge motif",
            timeLabel: "00:42",
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

    expect(await screen.findByRole("heading", { name: "Audio Notes" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Choose MP3" }));
    expect(await screen.findByText("sample.mp3")).toBeTruthy();

    const audioPlayer = document.querySelector("audio");
    expect(audioPlayer).toBeTruthy();
    audioPlayer.currentTime = 42;
    fireEvent.timeUpdate(audioPlayer);

    await user.type(screen.getByLabelText("Note text"), "Bridge motif");
    await user.click(screen.getByRole("button", { name: "Save note at current time" }));

    await waitFor(() => {
      expect(screen.getAllByText("Bridge motif").length).toBeGreaterThan(0);
    });
    expect(window.consyncDesktop.createBookmark).toHaveBeenCalledWith(expect.objectContaining({
      filePath: "/tmp/sample.mp3",
      note: "Bridge motif",
      timeLabel: "00:42",
      timeSeconds: 42,
    }));
    expect(screen.getByRole("heading", { name: "Latest Bookmark" })).toBeTruthy();
    expect(screen.getAllByText("00:42").length).toBeGreaterThan(0);
    expect(screen.queryByText("No notes saved for this audio file yet.")).toBeNull();
  });

  it("renders grouped results and keeps selection separate from reveal", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSearchSection(user);
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
    expect(screen.getAllByText("Greenhouse Poster Session").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("2026/april/greenhouse-poster").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("moss, poster, texture").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Moss texture reference for poster lighting").length).toBeGreaterThanOrEqual(2);
    expect(window.consyncDesktop.revealSearchResult).not.toHaveBeenCalled();
  });

  it("reveals only when the explicit button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSearchSection(user);
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

    await openSearchSection(user);
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

    await openSearchSection(user);
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
      screen.getAllByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
      ).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Click a result row to inspect one match more closely.")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Reveal in Finder" }));

    expect(await screen.findByText("Reveal failed for test")).toBeTruthy();
    expect(
      screen.getAllByText(
        "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Greenhouse Poster Session").length).toBeGreaterThanOrEqual(2);
    expect(window.consyncDesktop.revealSearchResult).toHaveBeenCalledWith(
      "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"
    );
  });

  it("clears stale results when the query changes after results load", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSearchSection(user);
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

    await openSearchSection(user);
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

    await openSearchSection(user);
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

    await openSearchSection(user);
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

    await openSearchSection(user);
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

    await openSearchSection(user);
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

    await openSearchSection(user);
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

    await user.click(screen.getByRole("button", { name: "Choose MP3" }));
    const audioPlayer = document.querySelector("audio");
    audioPlayer.currentTime = 42;
    fireEvent.timeUpdate(audioPlayer);
    await user.type(screen.getByLabelText("Note text"), "note");
    await user.click(screen.getByRole("button", { name: "Save note at current time" }));

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

    await openSearchSection(user);
    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));

    expect(await screen.findByText("No bookmarked matches found for this root and query.")).toBeTruthy();
    expect(screen.getByText("Click a result row to inspect one match more closely.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reveal in Finder" }).disabled).toBe(true);
  });

  it("keeps waveform out of the default workspace search flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSearchSection(user);
    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    expect(screen.queryByLabelText("Waveform display")).toBeNull();
    expect(screen.queryByText("Select a result to preview waveform")).toBeNull();
  });

  it("updates the inspector when a search result is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSearchSection(user);
    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    await user.click(screen.getByRole("button", { name: /exports\/cover-notes\.md/i }));

    expect(screen.getByRole("heading", { name: "Selected Result" })).toBeTruthy();
    expect(screen.getAllByText("Moss motif for cover transition").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Waveform display")).toBeNull();
  });

  it("updates the inspector when selection changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSearchSection(user);
    await user.click(screen.getByRole("button", { name: "Run Mock Search" }));
    await screen.findByText("Balcony Zine Session");

    await user.click(screen.getByRole("button", { name: /exports\/cover-notes\.md/i }));

    const selectedResultPanel = screen.getByRole("heading", { name: "Selected Result" }).closest("article");

    expect(selectedResultPanel).toBeTruthy();
    expect(within(selectedResultPanel).getByText("Moss motif for cover transition")).toBeTruthy();
    expect(within(selectedResultPanel).queryByText("Moss texture reference for poster lighting")).toBeNull();

    await user.click(screen.getByRole("button", { name: /captures\/moss-study\.jpg/i }));

    expect(within(selectedResultPanel).getByText("Moss texture reference for poster lighting")).toBeTruthy();
    expect(within(selectedResultPanel).queryByText("Moss motif for cover transition")).toBeNull();
    expect(screen.queryByLabelText("Waveform display")).toBeNull();
  });
});
