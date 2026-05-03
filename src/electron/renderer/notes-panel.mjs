/**
 * Pure logic for the standalone notes panel.
 * No React, no browser APIs, no side effects.
 */

/**
 * Groups an array of standalone note bookmarks by their `idea` field.
 *
 * @param {Array} notes - Array of bookmark objects.
 * @returns {{ groups: Object.<string, Array>, other: Array }}
 *   - groups: alphabetically sorted keys, each mapping to an array of notes
 *   - other: notes with no valid idea (missing, null, empty, or whitespace-only)
 */
export function groupStandaloneNotesByIdea(notes) {
  const normalized = Array.isArray(notes) ? notes : [];
  const groupMap = new Map();
  const other = [];

  for (const note of normalized) {
    const idea = typeof note.idea === "string" ? note.idea.trim() : "";

    if (!idea) {
      other.push(note);
      continue;
    }

    const key = idea;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }

    groupMap.get(key).push(note);
  }

  const sortedKeys = [...groupMap.keys()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  const groups = {};

  for (const key of sortedKeys) {
    groups[key] = groupMap.get(key);
  }

  return { groups, other };
}
