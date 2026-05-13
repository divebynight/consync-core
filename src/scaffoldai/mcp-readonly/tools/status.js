"use strict";

const { gatherStatus } = require("../../../lib/scaffoldaiStatus.query.scaffoldai");
const { getRepoRoot } = require("../../../lib/repoRoot.util.shared");
const { errorText } = require("../lib/errors");
const { jsonText } = require("../lib/response");

const repoRoot = getRepoRoot(__dirname);

function createStatusTool(deps = {}) {
  const gather = deps.gatherStatus || gatherStatus;
  const root = deps.repoRoot || repoRoot;

  return async function scaffoldaiStatusTool() {
    try {
      return jsonText(gather(root, { includeGit: false }));
    } catch (error) {
      return errorText("scaffoldai_status", error);
    }
  };
}

module.exports = { createStatusTool };
