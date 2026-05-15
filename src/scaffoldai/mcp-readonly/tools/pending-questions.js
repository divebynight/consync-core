"use strict";

const { gatherPendingQuestions } = require("../../../lib/scaffoldaiPendingQuestions.query.scaffoldai");
const { getRepoRoot } = require("../../../lib/repoRoot.util.shared");
const { errorText } = require("../lib/errors");
const { jsonText } = require("../lib/response");

const repoRoot = getRepoRoot(__dirname);

function createPendingQuestionsTool(deps = {}) {
  const gather = deps.gatherPendingQuestions || gatherPendingQuestions;
  const root = deps.repoRoot || repoRoot;

  return async function scaffoldaiPendingQuestionsTool(args = {}) {
    try {
      return jsonText(gather(root, args));
    } catch (error) {
      return errorText("scaffoldai_pending_questions", error);
    }
  };
}

module.exports = { createPendingQuestionsTool };