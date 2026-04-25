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
    deleteBookmark: vi.fn().mockResolvedValue({ ok: true }),
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
    expect(within(bookmarkLane).getByText("00:18.000 bookmark")).toBeTruthy();
    expect(within(bookmarkLane).getByText("01:12.000 bookmark")).toBeTruthy();
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
    expect(within(sessionEventsLane).getByText("01:24.000 in 20260405T154039301Z.json")).toBeTruthy();
    expect(within(sessionEventsTrack).getByText("1 markers")).toBeTruthy();
    expect(within(sessionEventsLane).queryByText("Re-entry window")).toBeNull();
  });

  it("adds a file-level note through the shared bookmark system", async () => {
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
            createdAt: "2026-04-23T17:30:00.000Z",
            filePath: "/tmp/sample.mp3",
            note: "Bridge motif",
            timeLabel: null,
            timeSeconds: null,
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
    expect((await screen.findAllByText("sample.mp3")).length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText("Note text"), "Bridge motif");
    await user.click(screen.getByRole("button", { name: "Add Note" }));

    await waitFor(() => {
      expect(screen.getAllByText("Bridge motif").length).toBeGreaterThan(0);
    });
    expect(window.consyncDesktop.createBookmark).toHaveBeenCalledWith(expect.objectContaining({
      filePath: "/tmp/sample.mp3",
      note: "Bridge motif",
      timeLabel: null,
      timeSeconds: null,
    }));
    expect(screen.getByRole("heading", { name: "Latest Bookmark" })).toBeTruthy();
    expect(screen.getAllByText("File note").length).toBeGreaterThan(0);
  });

  it("adds a new time-based bookmark to the workspace surfaces after bookmark capture", async () => {
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
    expect((await screen.findAllByText("sample.mp3")).length).toBeGreaterThan(0);

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
      timeLabel: "00:42.000",
      timeSeconds: 42,
    }));
    expect(screen.getByRole("heading", { name: "Latest Bookmark" })).toBeTruthy();
    expect(screen.getAllByText("00:42.000").length).toBeGreaterThan(0);
    expect(screen.queryByText("No time-based markers saved for this audio file yet.")).toBeNull();
  });

  it("shows a millisecond playback readout near the native audio player", async () => {
    const user = userEvent.setup();

    window.consyncDesktop = createDesktopBridge();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const audioPlayer = document.querySelector("audio");
    audioPlayer.currentTime = 42.456;
    fireEvent.timeUpdate(audioPlayer);

    const playbackClock = screen.getByRole("status");
    expect(within(playbackClock).getByText("Playback clock")).toBeTruthy();
    expect(within(playbackClock).getByText("00:42.456")).toBeTruthy();
  });

  it("renders file notes and timeline markers separately for the selected audio file", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      getSessionState: vi.fn().mockResolvedValue({
        artifactCount: 5,
        bookmarks: [
          {
            createdAt: "2026-04-23T17:30:00.000Z",
            filePath: "/tmp/sample.mp3",
            note: "File level thought",
            timeLabel: null,
            timeSeconds: null,
          },
          {
            createdAt: "2026-04-23T18:00:00.000Z",
            filePath: "/tmp/sample.mp3",
            note: "Marker later",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
          {
            createdAt: "2026-04-23T17:45:00.000Z",
            filePath: "/tmp/sample.mp3",
            note: "Marker earlier",
            timeLabel: "00:12.000",
            timeSeconds: 12,
          },
          {
            createdAt: "2026-04-23T17:40:00.000Z",
            filePath: "/tmp/other.mp3",
            note: "Other file marker",
            timeLabel: "00:10.000",
            timeSeconds: 10,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Choose MP3" }));
    expect((await screen.findAllByText("sample.mp3")).length).toBeGreaterThan(0);
    const fileNotesHeading = screen.getByRole("heading", { name: "File Notes" });
    expect(fileNotesHeading).toBeTruthy();
    const timelineMarkersHeading = screen.getByRole("heading", { name: "Timeline Markers" });
    expect(timelineMarkersHeading).toBeTruthy();
    const fileNotesSection = fileNotesHeading.closest("section");
    const timelineMarkersSection = timelineMarkersHeading.closest("section");
    expect(within(fileNotesSection).getByText("File level thought")).toBeTruthy();
    expect(within(timelineMarkersSection).getByText("Marker earlier")).toBeTruthy();
    expect(within(timelineMarkersSection).getByText("Marker later")).toBeTruthy();
    expect(screen.queryByText("Other file marker")).toBeNull();

    const markerTimes = within(timelineMarkersSection).getAllByText(/00:/).map(node => node.textContent);
    expect(markerTimes.indexOf("00:12.000")).toBeLessThan(markerTimes.indexOf("00:42.000"));
  });

  it("highlights the nearest timeline marker at or before the current playback time", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      getSessionState: vi.fn().mockResolvedValue({
        artifactCount: 5,
        bookmarks: [
          {
            createdAt: "2026-04-23T17:45:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "Marker earlier",
            timeLabel: "00:12",
            timeSeconds: 12,
          },
          {
            createdAt: "2026-04-23T18:00:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-2",
            note: "Marker later",
            timeLabel: "00:42",
            timeSeconds: 42,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Choose MP3" }));
    const timelineMarkersHeading = screen.getByRole("heading", { name: "Timeline Markers" });
    const timelineMarkersSection = timelineMarkersHeading.closest("section");
    const audioPlayer = document.querySelector("audio");
    const markerEarlierItem = within(timelineMarkersSection).getByText("Marker earlier").closest(".bookmark-item");
    const markerLaterItem = within(timelineMarkersSection).getByText("Marker later").closest(".bookmark-item");

    expect(markerEarlierItem.className.includes("bookmark-item-active")).toBe(false);
    expect(markerLaterItem.className.includes("bookmark-item-active")).toBe(false);

    audioPlayer.currentTime = 18;
    fireEvent.timeUpdate(audioPlayer);

    expect(markerEarlierItem.className.includes("bookmark-item-active")).toBe(true);
    expect(markerLaterItem.className.includes("bookmark-item-active")).toBe(false);

    audioPlayer.currentTime = 52;
    fireEvent.timeUpdate(audioPlayer);

    expect(markerEarlierItem.className.includes("bookmark-item-active")).toBe(false);
    expect(markerLaterItem.className.includes("bookmark-item-active")).toBe(true);

    audioPlayer.currentTime = 6;
    fireEvent.timeUpdate(audioPlayer);

    expect(markerEarlierItem.className.includes("bookmark-item-active")).toBe(false);
    expect(markerLaterItem.className.includes("bookmark-item-active")).toBe(false);
  });

  it("seeks the audio player when a timeline marker is clicked", async () => {
    const user = userEvent.setup();
    window.consyncDesktop = createDesktopBridge({
      getSessionState: vi.fn().mockResolvedValue({
        artifactCount: 5,
        bookmarks: [
          {
            createdAt: "2026-04-23T17:45:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "Marker earlier",
            timeLabel: "00:12",
            timeSeconds: 12,
          },
          {
            createdAt: "2026-04-23T18:00:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-2",
            note: "Marker later",
            timeLabel: "00:42",
            timeSeconds: 42,
          },
          {
            createdAt: "2026-04-23T17:30:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-3",
            note: "File note",
            timeLabel: null,
            timeSeconds: null,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      }),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Choose MP3" }));
    const audioPlayer = document.querySelector("audio");
    const timelineMarkersHeading = screen.getByRole("heading", { name: "Timeline Markers" });
    const timelineMarkersSection = timelineMarkersHeading.closest("section");

    expect(screen.getAllByText("00:00.000").length).toBeGreaterThan(0);

    await user.click(within(timelineMarkersSection).getByRole("button", { name: /marker later/i }));

    expect(audioPlayer.currentTime).toBe(42);
    expect(screen.getAllByText("00:42.000").length).toBeGreaterThan(0);

    await user.click(within(timelineMarkersSection).getByRole("button", { name: /marker earlier/i }));

    expect(audioPlayer.currentTime).toBe(12);
    expect(screen.getAllByText("00:12.000").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /file note/i })).toBeNull();
  });

  it("tracks recent audio files and switches context without reopening the picker", async () => {
    const user = userEvent.setup();
    const selectAudioFile = vi
      .fn()
      .mockResolvedValueOnce({
        audioSrc: "data:audio/mpeg;base64,Zmlyc3Q=",
        canceled: false,
        fileName: "first.mp3",
        filePath: "/tmp/first.mp3",
        fileUrl: "file:///tmp/first.mp3",
        ok: true,
      })
      .mockResolvedValueOnce({
        audioSrc: "data:audio/mpeg;base64,c2Vjb25k",
        canceled: false,
        fileName: "second.mp3",
        filePath: "/tmp/second.mp3",
        fileUrl: "file:///tmp/second.mp3",
        ok: true,
      });

    window.consyncDesktop = createDesktopBridge({
      selectAudioFile,
    });

    render(<App />);

    expect(screen.getByText("Open an mp3 to start a quick recent-files list.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Choose MP3" }));
    expect((await screen.findAllByText("first.mp3")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Choose MP3" }));
    expect((await screen.findAllByText("second.mp3")).length).toBeGreaterThan(0);

    const recentAudioHeading = screen.getByRole("heading", { name: "Recent Audio" });
    const recentAudioPanel = recentAudioHeading.closest("article");
    const recentButtons = within(recentAudioPanel).getAllByRole("button");

    expect(recentButtons[0].textContent).toBe("second.mp3");
    expect(recentButtons[1].textContent).toBe("first.mp3");

    const audioPlayer = document.querySelector("audio");
    audioPlayer.currentTime = 37;
    fireEvent.timeUpdate(audioPlayer);
    expect(screen.getAllByText("00:37.000").length).toBeGreaterThan(0);

    await user.click(within(recentAudioPanel).getByRole("button", { name: "first.mp3" }));

    expect(selectAudioFile).toHaveBeenCalledTimes(2);
    expect((await screen.findAllByText("first.mp3")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("00:00.000").length).toBeGreaterThan(0);
  });

  it("drops a timestamp marker with B and focuses the note input without interrupting playback", async () => {
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
            createdAt: "2026-04-24T19:15:00.000Z",
            filePath: "/tmp/sample.mp3",
            note: "",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      });
    const createBookmark = vi.fn().mockResolvedValue({ ok: true });

    window.consyncDesktop = createDesktopBridge({
      createBookmark,
      getSessionState,
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const audioPlayer = document.querySelector("audio");
    audioPlayer.currentTime = 42;
    fireEvent.timeUpdate(audioPlayer);

    fireEvent.keyDown(window, { key: "b" });

    await waitFor(() => {
      expect(createBookmark).toHaveBeenCalledWith({
        createdAt: expect.any(String),
        filePath: "/tmp/sample.mp3",
        note: "",
        timeLabel: "00:42.000",
        timeSeconds: 42,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Untitled marker")).toBeTruthy();
    });

    const noteInput = screen.getByLabelText("Note text");
    await waitFor(() => {
      expect(document.activeElement).toBe(noteInput);
    });

    expect(audioPlayer.currentTime).toBe(42);
    const markerItem = screen.getByText("Untitled marker").closest(".bookmark-item");
    expect(markerItem.className.includes("bookmark-item-active")).toBe(true);
  });

  it("updates the hotkey-created marker note instead of creating a duplicate marker", async () => {
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
            createdAt: "2026-04-24T19:15:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      })
      .mockResolvedValueOnce({
        artifactCount: 5,
        bookmarks: [
          {
            createdAt: "2026-04-24T19:15:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "uniquenote",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      });
    const createBookmark = vi.fn().mockResolvedValue({ ok: true });
    const updateBookmark = vi.fn().mockResolvedValue({ ok: true });

    window.consyncDesktop = createDesktopBridge({
      createBookmark,
      getSessionState,
      updateBookmark,
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const audioPlayer = document.querySelector("audio");
    audioPlayer.currentTime = 42;
    fireEvent.timeUpdate(audioPlayer);

    fireEvent.keyDown(window, { key: "b" });

    await waitFor(() => {
      expect(screen.getByText("Untitled marker")).toBeTruthy();
    });

    const noteInput = screen.getByLabelText("Note text");
    await user.type(noteInput, "uniquenote");
    audioPlayer.currentTime = 57;
    fireEvent.timeUpdate(audioPlayer);
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(updateBookmark).toHaveBeenCalledWith({
        id: "bookmark-1",
        note: "uniquenote",
      });
    });

    expect(createBookmark).toHaveBeenCalledTimes(1);
    expect(updateBookmark).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("00:42.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("uniquenote").length).toBeGreaterThan(0);
    expect(screen.queryByText("Untitled marker")).toBeNull();

    const timelineMarkersHeading = screen.getByRole("heading", { name: "Timeline Markers" });
    const timelineMarkersSection = timelineMarkersHeading.closest("section");
    const markerButtons = within(timelineMarkersSection).getAllByRole("button");

    expect(markerButtons).toHaveLength(1);
    expect(within(markerButtons[0]).getByText("00:42.000")).toBeTruthy();
  });

  it("blurs the note input after Enter so B can drop another marker", async () => {
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
            createdAt: "2026-04-24T19:15:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      })
      .mockResolvedValueOnce({
        artifactCount: 5,
        bookmarks: [
          {
            createdAt: "2026-04-24T19:15:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "first note",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      })
      .mockResolvedValueOnce({
        artifactCount: 6,
        bookmarks: [
          {
            createdAt: "2026-04-24T19:15:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "first note",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
          {
            createdAt: "2026-04-24T19:16:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-2",
            note: "",
            timeLabel: "00:57.000",
            timeSeconds: 57,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      });
    const createBookmark = vi.fn().mockResolvedValue({ ok: true });
    const updateBookmark = vi.fn().mockResolvedValue({ ok: true });

    window.consyncDesktop = createDesktopBridge({
      createBookmark,
      getSessionState,
      updateBookmark,
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const audioPlayer = document.querySelector("audio");
    const noteInput = screen.getByLabelText("Note text");

    audioPlayer.currentTime = 42;
    fireEvent.timeUpdate(audioPlayer);
    fireEvent.keyDown(window, { key: "b" });

    await waitFor(() => {
      expect(document.activeElement).toBe(noteInput);
    });

    await user.type(noteInput, "first note");
    audioPlayer.currentTime = 57;
    fireEvent.timeUpdate(audioPlayer);
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(updateBookmark).toHaveBeenCalledWith({
        id: "bookmark-1",
        note: "first note",
      });
    });

    expect(document.activeElement).not.toBe(noteInput);

    fireEvent.keyDown(window, { key: "b" });

    await waitFor(() => {
      expect(createBookmark).toHaveBeenCalledTimes(2);
    });

    expect(createBookmark).toHaveBeenLastCalledWith({
      createdAt: expect.any(String),
      filePath: "/tmp/sample.mp3",
      note: "",
      timeLabel: "00:57.000",
      timeSeconds: 57,
    });
  });

  it("finalizes an empty hotkey marker on Enter and exits edit mode", async () => {
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
            createdAt: "2026-04-24T19:15:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "",
            timeLabel: "00:42.000",
            timeSeconds: 42,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      });
    const createBookmark = vi.fn().mockResolvedValue({ ok: true });
    const updateBookmark = vi.fn().mockResolvedValue({ ok: true });

    window.consyncDesktop = createDesktopBridge({
      createBookmark,
      getSessionState,
      updateBookmark,
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const audioPlayer = document.querySelector("audio");
    const noteInput = screen.getByLabelText("Note text");

    audioPlayer.currentTime = 42;
    fireEvent.timeUpdate(audioPlayer);
    fireEvent.keyDown(window, { key: "b" });

    await waitFor(() => {
      expect(document.activeElement).toBe(noteInput);
    });

    await user.keyboard("{Enter}");

    expect(updateBookmark).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.activeElement).not.toBe(noteInput);
    });
    expect(screen.getByText("Untitled marker")).toBeTruthy();
  });

  it("does not drop a marker with B while typing in the note input", async () => {
    const user = userEvent.setup();
    const createBookmark = vi.fn().mockResolvedValue({ ok: true });

    window.consyncDesktop = createDesktopBridge({
      createBookmark,
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const noteInput = screen.getByLabelText("Note text");
    await user.click(noteInput);
    await user.keyboard("b");

    expect(createBookmark).not.toHaveBeenCalled();
    expect(noteInput.value).toBe("b");
  });

  it("removes the most recently created marker with Cmd+Z in LIFO order", async () => {
    const user = userEvent.setup();
    const getSessionState = vi
      .fn()
      .mockResolvedValueOnce({
        artifactCount: 4,
        bookmarks: [
          {
            createdAt: "2026-04-24T19:10:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "Marker one",
            timeLabel: "00:10.000",
            timeSeconds: 10,
          },
          {
            createdAt: "2026-04-24T19:11:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-2",
            note: "Marker two",
            timeLabel: "00:20.000",
            timeSeconds: 20,
          },
          {
            createdAt: "2026-04-24T19:12:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-3",
            note: "Marker three",
            timeLabel: "00:30.000",
            timeSeconds: 30,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      })
      .mockResolvedValueOnce({
        artifactCount: 4,
        bookmarks: [
          {
            createdAt: "2026-04-24T19:10:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "Marker one",
            timeLabel: "00:10.000",
            timeSeconds: 10,
          },
          {
            createdAt: "2026-04-24T19:11:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-2",
            note: "Marker two",
            timeLabel: "00:20.000",
            timeSeconds: 20,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      })
      .mockResolvedValueOnce({
        artifactCount: 4,
        bookmarks: [
          {
            createdAt: "2026-04-24T19:10:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-1",
            note: "Marker one",
            timeLabel: "00:10.000",
            timeSeconds: 10,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      });
    const deleteBookmark = vi.fn().mockResolvedValue({ ok: true });

    window.consyncDesktop = createDesktopBridge({
      deleteBookmark,
      getSessionState,
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const timelineMarkersHeading = screen.getByRole("heading", { name: "Timeline Markers" });
    const timelineMarkersSection = timelineMarkersHeading.closest("section");

    expect(within(timelineMarkersSection).getByText("Marker one")).toBeTruthy();
    expect(within(timelineMarkersSection).getByText("Marker two")).toBeTruthy();
    expect(within(timelineMarkersSection).getByText("Marker three")).toBeTruthy();

    fireEvent.keyDown(window, { key: "z", metaKey: true });

    await waitFor(() => {
      expect(deleteBookmark).toHaveBeenCalledWith({ id: "bookmark-3" });
    });
    await waitFor(() => {
      expect(within(timelineMarkersSection).queryByText("Marker three")).toBeNull();
    });

    fireEvent.keyDown(window, { key: "z", metaKey: true });

    await waitFor(() => {
      expect(deleteBookmark).toHaveBeenNthCalledWith(2, { id: "bookmark-2" });
    });
    await waitFor(() => {
      expect(within(timelineMarkersSection).queryByText("Marker two")).toBeNull();
    });

    expect(within(timelineMarkersSection).getByText("Marker one")).toBeTruthy();
  });

  it("does not remove markers with Cmd+Z while typing in the note input", async () => {
    const user = userEvent.setup();
    const deleteBookmark = vi.fn().mockResolvedValue({ ok: true });

    window.consyncDesktop = createDesktopBridge({
      deleteBookmark,
      getSessionState: vi.fn().mockResolvedValue({
        artifactCount: 4,
        bookmarks: [
          {
            createdAt: "2026-04-24T19:12:00.000Z",
            filePath: "/tmp/sample.mp3",
            id: "bookmark-3",
            note: "Marker three",
            timeLabel: "00:30.000",
            timeSeconds: 30,
          },
        ],
        currentFile: "20260405T154039301Z.json",
        currentPositionSeconds: 84,
        latestBookmark: null,
      }),
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Choose MP3" }));

    const noteInput = screen.getByLabelText("Note text");
    const timelineMarkersHeading = screen.getByRole("heading", { name: "Timeline Markers" });
    const timelineMarkersSection = timelineMarkersHeading.closest("section");
    await user.click(noteInput);
    await user.keyboard("{Meta>}z{/Meta}");

    expect(deleteBookmark).not.toHaveBeenCalled();
    expect(within(timelineMarkersSection).getByText("Marker three")).toBeTruthy();
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
