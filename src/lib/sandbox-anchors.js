const fs = require("fs");
const path = require("path");

function compareText(left, right) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function collectAnchorDirectories(rootPath, currentPath, results) {
  const sessionPath = path.join(currentPath, ".consync", "session.json");

  if (fs.existsSync(sessionPath)) {
    results.push(currentPath);
  }

  const entries = fs.readdirSync(currentPath, { withFileTypes: true }).sort((left, right) => compareText(left.name, right.name));

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".consync") {
      continue;
    }

    collectAnchorDirectories(rootPath, path.join(currentPath, entry.name), results);
  }
}

function readAnchorSession(anchorPath) {
  const sessionPath = path.join(anchorPath, ".consync", "session.json");
  const rawSession = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  const bookmarks = Array.isArray(rawSession.bookmarks) ? rawSession.bookmarks : [];

  return {
    sessionId: typeof rawSession.sessionId === "string" ? rawSession.sessionId : path.basename(anchorPath),
    sessionTitle: typeof rawSession.sessionTitle === "string" ? rawSession.sessionTitle : path.basename(anchorPath),
    bookmarks: bookmarks
      .map(bookmark => ({
        path: typeof bookmark.path === "string" ? bookmark.path : "",
        note: typeof bookmark.note === "string" ? bookmark.note : "",
        tags: Array.isArray(bookmark.tags) ? bookmark.tags.filter(tag => typeof tag === "string") : [],
      }))
      .filter(bookmark => bookmark.path || bookmark.note || bookmark.tags.length > 0),
  };
}

function discoverNestedAnchors(targetPath) {
  const absolutePath = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(absolutePath)) {
    return {
      ok: false,
      output: "Path not found",
    };
  }

  const anchorDirectories = [];
  collectAnchorDirectories(absolutePath, absolutePath, anchorDirectories);

  const anchors = anchorDirectories
    .map(anchorPath => {
      const session = readAnchorSession(anchorPath);
      const tagSet = new Set();

      for (const bookmark of session.bookmarks) {
        for (const tag of bookmark.tags) {
          tagSet.add(tag);
        }
      }

      return {
        anchorPath: normalizeRelativePath(path.relative(absolutePath, anchorPath)),
        sessionId: session.sessionId,
        sessionTitle: session.sessionTitle,
        bookmarkCount: session.bookmarks.length,
        tags: Array.from(tagSet).sort(compareText),
      };
    })
    .sort((left, right) => compareText(left.anchorPath, right.anchorPath));

  return {
    ok: true,
    anchors,
  };
}

function buildSandboxDiscoverOutput(targetPath) {
  const discovery = discoverNestedAnchors(targetPath);

  if (!discovery.ok) {
    return discovery;
  }

  const lines = [];
  lines.push(`ROOT: ${targetPath}`);
  lines.push(`ANCHORS: ${discovery.anchors.length}`);
  lines.push("");

  for (const anchor of discovery.anchors) {
    lines.push(`- ${anchor.anchorPath}`);
    lines.push(`  session: ${anchor.sessionTitle}`);
    lines.push(`  bookmarks: ${anchor.bookmarkCount}`);
    lines.push(`  tags: ${anchor.tags.length > 0 ? anchor.tags.join(", ") : "none"}`);
  }

  return {
    ok: true,
    output: lines.join("\n"),
  };
}

function bookmarkMatchesQuery(bookmark, normalizedQuery) {
  const haystack = [bookmark.path, bookmark.note, ...bookmark.tags].join(" ").toLowerCase();
  return haystack.includes(normalizedQuery);
}

function searchNestedAnchors(targetPath, query) {
  if (!query || !query.trim()) {
    return {
      ok: false,
      output: "Query is required",
    };
  }

  const normalizedQuery = query.trim().toLowerCase();
  const discovery = discoverNestedAnchors(targetPath);

  if (!discovery.ok) {
    return discovery;
  }

  const matches = [];

  for (const anchor of discovery.anchors) {
    const absoluteAnchorPath = path.resolve(process.cwd(), targetPath, anchor.anchorPath);
    const session = readAnchorSession(absoluteAnchorPath);

    for (const bookmark of session.bookmarks) {
      if (!bookmarkMatchesQuery(bookmark, normalizedQuery)) {
        continue;
      }

      matches.push({
        anchorPath: anchor.anchorPath,
        sessionTitle: session.sessionTitle,
        artifactPath: normalizeRelativePath(bookmark.path),
        note: bookmark.note,
        tags: [...bookmark.tags].sort(compareText),
      });
    }
  }

  matches.sort((left, right) => {
    const anchorComparison = compareText(left.anchorPath, right.anchorPath);

    if (anchorComparison !== 0) {
      return anchorComparison;
    }

    return compareText(left.artifactPath, right.artifactPath);
  });

  return {
    ok: true,
    query: query.trim(),
    matches,
  };
}

function buildSandboxSearchOutput(targetPath, query) {
  const result = searchNestedAnchors(targetPath, query);

  if (!result.ok) {
    return result;
  }

  const lines = [];
  lines.push(`ROOT: ${targetPath}`);
  lines.push(`QUERY: ${result.query}`);
  lines.push(`MATCHES: ${result.matches.length}`);
  lines.push("");

  for (const match of result.matches) {
    lines.push(`- anchor: ${match.anchorPath}`);
    lines.push(`  session: ${match.sessionTitle}`);
    lines.push(`  artifact: ${match.artifactPath}`);
    lines.push(`  note: ${match.note}`);
    lines.push(`  tags: ${match.tags.length > 0 ? match.tags.join(", ") : "none"}`);
  }

  return {
    ok: true,
    output: lines.join("\n"),
  };
}

function buildSandboxDesktopSearchOutput(targetPath, query) {
  const result = searchNestedAnchors(targetPath, query);

  if (!result.ok) {
    return result;
  }

  const groupedMatches = new Map();

  for (const match of result.matches) {
    const groupKey = `${match.anchorPath}::${match.sessionTitle}`;

    if (!groupedMatches.has(groupKey)) {
      groupedMatches.set(groupKey, {
        anchorPath: match.anchorPath,
        sessionTitle: match.sessionTitle,
        matches: [],
      });
    }

    groupedMatches.get(groupKey).matches.push(match);
  }

  const groups = Array.from(groupedMatches.values()).sort((left, right) => compareText(left.anchorPath, right.anchorPath));

  const lines = [];
  lines.push("DESKTOP SEARCH PREVIEW");
  lines.push(`root: ${targetPath}`);
  lines.push(`query: ${result.query}`);
  lines.push(`sessions: ${groups.length}`);
  lines.push(`matches: ${result.matches.length}`);
  lines.push("");

  if (groups.length === 0) {
    lines.push("No bookmarked matches found.");

    return {
      ok: true,
      output: lines.join("\n"),
    };
  }

  for (const group of groups) {
    lines.push(`SESSION: ${group.sessionTitle}`);
    lines.push(`ANCHOR: ${group.anchorPath}`);

    for (const match of group.matches) {
      lines.push(`- ${match.artifactPath}`);
      lines.push(`  note: ${match.note}`);
      lines.push(`  tags: ${match.tags.length > 0 ? match.tags.join(", ") : "none"}`);
    }

    lines.push("");
  }

  return {
    ok: true,
    output: lines.join("\n").trimEnd(),
  };
}

module.exports = {
  buildSandboxDesktopSearchOutput,
  buildSandboxDiscoverOutput,
  buildSandboxSearchOutput,
  compareText,
  discoverNestedAnchors,
  searchNestedAnchors,
};