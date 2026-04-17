export function getMockSearchSummaryRows(searchResult) {
  if (!searchResult) {
    return [
      { label: "Root", value: "loading" },
      { label: "Query", value: "loading" },
      { label: "Sessions", value: "loading" },
      { label: "Matches", value: "loading" },
    ];
  }

  return [
    { label: "Root", value: searchResult.rootPath },
    { label: "Query", value: searchResult.query },
    { label: "Sessions", value: searchResult.sessionCount },
    { label: "Matches", value: searchResult.matchCount },
  ];
}

export function getMockSearchSelectionKey(group, match) {
  return `${group.anchorPath}::${match.artifactPath}`;
}

export function getSelectedMockSearchDetail(searchResult, selectedMatchKey) {
  if (!searchResult || !selectedMatchKey) {
    return null;
  }

  for (const group of searchResult.groups) {
    for (const match of group.matches) {
      if (getMockSearchSelectionKey(group, match) !== selectedMatchKey) {
        continue;
      }

      return {
        anchorPath: group.anchorPath,
        artifactPath: match.artifactPath,
        fullPath: `${searchResult.rootPath}/${group.anchorPath}/${match.artifactPath}`,
        note: match.note || "No note",
        query: searchResult.query,
        rootPath: searchResult.rootPath,
        sessionTitle: group.sessionTitle,
        tags: match.tags.length > 0 ? match.tags : [],
      };
    }
  }

  return null;
}

export function getMockSearchDetailRows(searchResult, selectedMatchKey) {
  const detail = getSelectedMockSearchDetail(searchResult, selectedMatchKey);

  if (!detail) {
    return [
      { label: "Selection", value: "none" },
      { label: "Path", value: "Choose a result row" },
      { label: "Session", value: "none" },
      { label: "Anchor", value: "none" },
      { label: "Tags", value: "none" },
    ];
  }

  return [
    { label: "Selection", value: detail.artifactPath },
    { label: "Path", value: detail.fullPath },
    { label: "Session", value: detail.sessionTitle },
    { label: "Anchor", value: detail.anchorPath },
    { label: "Tags", value: detail.tags.length > 0 ? detail.tags.join(", ") : "none" },
  ];
}