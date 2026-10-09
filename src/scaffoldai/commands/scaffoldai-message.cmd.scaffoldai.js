"use strict";

const path = require("path");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const { MESSAGE_STORE_SUBPATH, waitForMessage } = require("../../lib/scaffoldaiMessages.lib.scaffoldai");

// scaffoldai message wait: bounded, read-only wait for remote messages.
// Started by a local agent session (for example as a background command) and
// exits on the first matching message or at the timeout. It prints delivery
// metadata only (id, sender, length, sha256), never message text.

const DEFAULT_TIMEOUT_SECONDS = 900;
const MAX_TIMEOUT_SECONDS = 3600;
const USAGE = "Usage: scaffoldai message wait --to <project> --topic <report-id> " +
  "(--after <iso-timestamp> | --after-id <message-id>) [--timeout <seconds, 1-3600>]";

function parseWaitArgs(argv) {
  const values = {};
  const flags = { "--to": "to", "--topic": "topic", "--after": "after", "--after-id": "afterId", "--timeout": "timeout" };
  for (let index = 0; index < argv.length; index += 2) {
    const key = flags[argv[index]];
    const value = argv[index + 1];
    if (!key || value === undefined || Object.hasOwn(values, key)) return { error: `Invalid argument: ${argv[index]}` };
    values[key] = value;
  }
  if (!values.to || !values.topic) return { error: "--to and --topic are required" };
  if ((values.after === undefined) === (values.afterId === undefined)) {
    return { error: "Provide exactly one of --after or --after-id" };
  }
  if (values.after !== undefined && Number.isNaN(Date.parse(values.after))) return { error: "--after must be an ISO timestamp" };
  const timeout = values.timeout === undefined ? DEFAULT_TIMEOUT_SECONDS : Number(values.timeout);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > MAX_TIMEOUT_SECONDS) {
    return { error: `--timeout must be an integer from 1 to ${MAX_TIMEOUT_SECONDS}` };
  }
  return { query: { to: values.to, topic: values.topic, after: values.after, afterId: values.afterId }, timeout };
}

async function runScaffoldaiMessageCommand(argv = [], deps = {}) {
  const log = deps.log || console.log;
  const error = deps.error || console.error;
  if (argv[0] !== "wait") {
    error(USAGE);
    return 1;
  }
  const parsed = parseWaitArgs(argv.slice(1));
  if (parsed.error) {
    error(parsed.error);
    error(USAGE);
    return 1;
  }
  const repoRoot = deps.repoRoot || getRepoRoot(__dirname);
  try {
    const result = await waitForMessage(path.join(repoRoot, MESSAGE_STORE_SUBPATH), parsed.query,
      { timeoutMs: parsed.timeout * 1000, sleep: deps.sleep, now: deps.now });
    log(JSON.stringify(result, null, 2));
    return 0;
  } catch (failure) {
    error(`message wait failed: ${failure.message}`);
    return 1;
  }
}

module.exports = { runScaffoldaiMessageCommand };
