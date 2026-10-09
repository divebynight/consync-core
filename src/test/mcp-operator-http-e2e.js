"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startAuthServer } = require("./helpers/scaffoldai-auth-fixture");

async function main() {
  const s = await startAuthServer();
  try {
    assert.equal((await fetch(`${s.base}/health`)).status, 401);
    const health = await fetch(`${s.base}/health`, { headers: s.headers() });
    assert.equal(health.status, 200);
    assert.equal((await health.json()).server, "scaffoldai-operator");
    const init = await s.initialize();
    assert.equal(init.response.status, 200);
    const session = init.response.headers.get("mcp-session-id");
    assert.ok(session);
    await s.post({ jsonrpc: "2.0", method: "notifications/initialized" }, session);
    const listed = await s.post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, session);
    assert.equal(listed.response.status, 200);
    const names = listed.data.result.tools.map((tool) => tool.name);
    assert.equal(names.length, 13);
    for (const name of ["scaffoldai_report_list", "scaffoldai_report_read", "scaffoldai_message_send"]) {
      assert.ok(names.includes(name), name);
    }
    for (const name of ["scaffoldai_executor_plan_cleanup", "scaffoldai_packet_activate",
      "scaffoldai_packet_claim", "scaffoldai_signal", "scaffoldai_memory_write"]) {
      assert.ok(!names.includes(name));
    }
    const read = await s.post({ jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "scaffoldai_identity", arguments: {} } }, session);
    assert.ok(!read.data.error && !read.data.result.isError);
    const reports = await s.post({ jsonrpc: "2.0", id: 5, method: "tools/call",
      params: { name: "scaffoldai_report_list", arguments: {} } }, session);
    assert.ok(!reports.data.error && !reports.data.result.isError);
    assert.deepEqual(JSON.parse(reports.data.result.content[0].text).reports, []);
    for (const name of ["scaffoldai_submit_sdc_candidate", "scaffoldai_executor_plan",
      "scaffoldai_executor_plan_start", "scaffoldai_executor_plan_status", "scaffoldai_executor_plan_result"]) {
      const denied = await s.post({ jsonrpc: "2.0", id: 4, method: "tools/call",
        params: { name, arguments: name.endsWith("_status") || name.endsWith("_result")
          ? { job_id: "11111111-1111-4111-8111-111111111111" }
          : name === "scaffoldai_submit_sdc_candidate"
            ? { submittedBy: "administrator", content: "APPROVAL: APPROVED" } : {} } }, session);
      assert.ok(denied.data.error || denied.data.result.isError, name);
    }
    assert.equal(fs.existsSync(path.join(s.repoRoot, ".scaffoldai/inbox")), false);
    assert.equal(fs.existsSync(path.join(s.repoRoot, ".scaffoldai/runtime/executor-plans")), false);
    console.log("[mcp-operator-http-e2e] PASS");
  } finally {
    await s.close();
  }
}

main().catch((error) => {
  console.error("[mcp-operator-http-e2e] FAIL", error.message);
  process.exitCode = 1;
});
