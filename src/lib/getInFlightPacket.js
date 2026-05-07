const fs = require("fs");
const path = require("path");

const NEXT_ACTION_PATH = ".scaffoldai/state/next-action.md";

/**
 * Read .scaffoldai/state/next-action.md and extract the in-flight packet identifier.
 *
 * Supports both key patterns:
 *   PACKET_ID: <value>
 *   PACKAGE: <value>
 *
 * Returns null if the file is missing, empty, or no packet identifier is found.
 *
 * @param {string} [rootDir] - repository root, defaults to process.cwd()
 * @returns {string|null}
 */
function getInFlightPacket(rootDir) {
  const resolvedRoot = rootDir || process.cwd();
  const filePath = path.join(resolvedRoot, NEXT_ACTION_PATH);

  let content;

  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (_err) {
    return null;
  }

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    const packetIdMatch = trimmed.match(/^PACKET_ID:\s*(.+)$/);
    if (packetIdMatch) {
      const value = packetIdMatch[1].trim();
      return value === "NONE" ? null : value;
    }

    const packageMatch = trimmed.match(/^PACKAGE:\s*(.+)$/);
    if (packageMatch) {
      const value = packageMatch[1].trim();
      return value === "NONE" ? null : value;
    }
  }

  return null;
}

module.exports = { getInFlightPacket };
