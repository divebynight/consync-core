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