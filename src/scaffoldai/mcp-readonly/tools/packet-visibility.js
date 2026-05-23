"use strict";

const { gatherPacketVisibility } = require("../../../lib/scaffoldaiPacketVisibility.query.scaffoldai");
const { getRepoRoot } = require("../../../lib/repoRoot.util.shared");
const { errorText } = require("../lib/errors");
const { jsonText } = require("../lib/response");

const repoRoot = getRepoRoot(__dirname);

function createPacketVisibilityTool(deps = {}) {
  const gather = deps.gatherPacketVisibility || gatherPacketVisibility;
  const root = deps.repoRoot || repoRoot;

  return async function scaffoldaiPacketVisibilityTool(args = {}) {
    try {
      return jsonText(gather(root, args));
    } catch (error) {
      return errorText("scaffoldai_packet_visibility", error);
    }
  };
}

module.exports = { createPacketVisibilityTool };
