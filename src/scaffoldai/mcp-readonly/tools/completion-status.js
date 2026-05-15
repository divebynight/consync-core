"use strict";

const { gatherCompletionStatus } = require("../../../lib/scaffoldaiCompletionStatus.query.scaffoldai");
const { getRepoRoot } = require("../../../lib/repoRoot.util.shared");
const { errorText } = require("../lib/errors");
const { jsonText } = require("../lib/response");

const repoRoot = getRepoRoot(__dirname);

function createCompletionStatusTool(deps = {}) {
  const gather = deps.gatherCompletionStatus || gatherCompletionStatus;
  const root = deps.repoRoot || repoRoot;

  return async function scaffoldaiCompletionStatusTool(args = {}) {
    try {
      return jsonText(gather(root, args));
    } catch (error) {
      return errorText("scaffoldai_completion_status", error);
    }
  };
}

module.exports = { createCompletionStatusTool };
