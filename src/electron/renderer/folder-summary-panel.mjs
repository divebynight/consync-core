export function getFolderSummaryRows(summary) {
  if (!summary) {
    return [
      { label: "Path", value: "loading" },
      { label: "Files", value: "loading" },
      { label: "Folders", value: "loading" },
      { label: "Size", value: "loading" },
    ];
  }

  if (!summary.ok) {
    return [
      { label: "Error", value: summary.error || "Unknown error" },
    ];
  }

  return [
    { label: "Path", value: summary.absolutePath },
    { label: "Files", value: summary.fileCount },
    { label: "Folders", value: summary.folderCount },
    { label: "Size", value: `${summary.totalBytes} bytes` },
  ];
}

export function getFolderSummaryExtensionRows(summary) {
  if (!summary || !summary.ok) {
    return [];
  }

  return Object.keys(summary.extensions)
    .sort()
    .map(ext => ({ label: ext, value: summary.extensions[ext] }));
}
