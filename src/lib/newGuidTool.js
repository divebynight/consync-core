const { createGuid } = require("./guid");
const { createFileTimestamp, createIsoTimestamp } = require("./time");
const { writeJsonArtifact, appendEventLog } = require("./fs");
const { copyToClipboard } = require("./clipboard");

async function newGuidTool(input) {
  const now = new Date();
  const guid = createGuid();
  const created_at = createIsoTimestamp(now);
  const fileTimestamp = createFileTimestamp(now);
  const fileName = `${fileTimestamp}.json`;
  const payload = {
    guid,
    created_at,
    note: input.note || "",
  };
  const json = JSON.stringify(payload, null, 2);
  const cwd = process.cwd();
  const filePath = writeJsonArtifact(cwd, fileName, json);

  appendEventLog(cwd, `${created_at} new-guid ${guid} ${filePath}`);

  const clipboardError = await copyToClipboard(json);

  if (clipboardError) {
    console.warn(`Clipboard copy failed: ${clipboardError.message}`);
  }

  return {
    guid,
    created_at,
    filePath,
    json,
  };
}

module.exports = {
  newGuidTool,
};