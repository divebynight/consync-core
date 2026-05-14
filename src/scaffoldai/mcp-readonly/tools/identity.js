"use strict";

const { gatherScaffoldAIIdentity } = require("../../commands/scaffoldai-identity.cmd.scaffoldai");
const { errorText } = require("../lib/errors");
const { jsonText } = require("../lib/response");

function createIdentityTool(deps = {}) {
  const gather = deps.gatherScaffoldAIIdentity || gatherScaffoldAIIdentity;

  return async function scaffoldaiIdentityTool() {
    try {
      return jsonText(gather());
    } catch (error) {
      return errorText("scaffoldai_identity", error);
    }
  };
}

module.exports = { createIdentityTool };
