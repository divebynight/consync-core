"use strict";

const TOOL_NAMES = [
  "scaffoldai_identity",
  "scaffoldai_status",
];

const FORBIDDEN_TOOL_NAMES = [
  "scaffoldai_preflight",
  "scaffoldai_question",
  "scaffoldai_verify_recommend",
  "scaffoldai_closeout_readiness",
  "scaffoldai_signal",
  "scaffoldai_memory_write",
  "scaffoldai_memory_read",
  "scaffoldai_feature_contract_create",
  "scaffoldai_feature_status_update",
  "scaffoldai_feature_closeout",
  "scaffoldai_feature_verify_closeout",
];

module.exports = { TOOL_NAMES, FORBIDDEN_TOOL_NAMES };
