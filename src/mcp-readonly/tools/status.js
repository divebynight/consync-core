"use strict";

const { gatherStatus } = require("../../commands/scaffoldai-status");
const { errorText } = require("../lib/errors");
const { jsonText } = require("../lib/response");

function createStatusTool(deps = {}) {
  const gather = deps.gatherStatus || gatherStatus;

  return async function scaffoldaiStatusTool() {
    try {
      return jsonText(gather({ includeGit: false }));
    } catch (error) {
      return errorText("scaffoldai_status", error);
    }
  };
}

module.exports = { createStatusTool };
