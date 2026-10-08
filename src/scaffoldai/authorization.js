"use strict";

const { AsyncLocalStorage } = require("node:async_hooks");
const requests = new AsyncLocalStorage();

const TOOL_CAPABILITIES = Object.freeze({
  scaffoldai_identity: "metadata:read",
  scaffoldai_status: "metadata:read",
  scaffoldai_packet_visibility: "metadata:read",
  scaffoldai_pending_questions: "metadata:read",
  scaffoldai_completion_status: "metadata:read",
  scaffoldai_report_list: "report:read",
  scaffoldai_report_read: "report:read",
  scaffoldai_submit_sdc_candidate: "candidate:submit",
  scaffoldai_executor_plan: "executor:plan:start",
  scaffoldai_executor_plan_start: "executor:plan:start",
  scaffoldai_executor_plan_status: "executor:read",
  scaffoldai_executor_plan_result: "executor:read",
});

function withPrincipal(principal, action) {
  return requests.run(principal, action);
}

function getPrincipal() {
  return requests.getStore();
}

function authorizeTool(name, handler, deps = {}) {
  if (deps.remote !== true) return handler;
  return (...args) => {
    const principal = getPrincipal();
    const capability = TOOL_CAPABILITIES[name];
    const authenticated = principal && principal.expiresAt * 1000 > Date.now();
    const allowed = authenticated && capability && principal.capabilities.includes(capability) &&
      (name !== "scaffoldai_executor_plan" || principal.capabilities.includes("executor:read"));
    if (!allowed) return {
      isError: true,
      content: [{ type: "text", text: JSON.stringify({ status: "denied",
        error_code: authenticated ? "FORBIDDEN" : "AUTH_REQUIRED",
        message: "Request is not authorized." }) }],
    };
    return handler(...args);
  };
}

module.exports = { authorizeTool, withPrincipal, getPrincipal, TOOL_CAPABILITIES };
