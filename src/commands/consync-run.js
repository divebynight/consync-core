const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { applyGatekeeperRules } = require("../lib/gatekeeperDecision");
const { getInFlightPacket } = require("../lib/getInFlightPacket");

const ACTIVE_CONTRACT_PATH = ".scaffoldai/state/active-contract.json";

const VALID_REQUEST_TYPES = ["SDC", "CLOSEOUT", "RECOVERY", "DRY_RUN", "CANCEL", "SUPERSEDE"];
const VALID_PACKET_TYPES = ["product", "process", "contract", "agent", "planning", "docs", "recovery", "closeout"];
const VALID_GIT_STATUSES = ["clean", "dirty"];

function parseFlags(argv) {
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const eqIndex = arg.indexOf("=");

      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex);
        const value = arg.slice(eqIndex + 1);
        flags[key] = value;
      } else {
        const key = arg.slice(2);
        flags[key] = argv[i + 1] || "";
        i++;
      }
    }
  }

  return flags;
}

function validateFlags(flags) {
  const errors = [];

  if (!flags["request-type"]) {
    errors.push("--request-type is required");
  } else if (!VALID_REQUEST_TYPES.includes(flags["request-type"])) {
    errors.push(`--request-type must be one of: ${VALID_REQUEST_TYPES.join(", ")}`);
  }

  if (!flags["packet-type"]) {
    errors.push("--packet-type is required");
  } else if (!VALID_PACKET_TYPES.includes(flags["packet-type"])) {
    errors.push(`--packet-type must be one of: ${VALID_PACKET_TYPES.join(", ")}`);
  }

  if (!flags["packet-id"]) {
    errors.push("--packet-id is required");
  }

  if (!flags["git-status"]) {
    errors.push("--git-status is required");
  } else if (!VALID_GIT_STATUSES.includes(flags["git-status"])) {
    errors.push(`--git-status must be one of: ${VALID_GIT_STATUSES.join(", ")}`);
  }

  return errors;
}

function loadActiveContract(rootDir) {
  const contractPath = path.join(rootDir, ACTIVE_CONTRACT_PATH);

  if (!fs.existsSync(contractPath)) {
    throw new Error(`active-contract.json not found at: ${contractPath}`);
  }

  const raw = fs.readFileSync(contractPath, "utf8");

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse active-contract.json: ${err.message}`);
  }
}

function formatReport(input, contract, decision) {
  const separator = "─".repeat(53);

  const nextAction =
    decision.nextRequiredAction === "NONE" && decision.decision === "ALLOW" && input.requestType === "SDC"
      ? "Proceed to SDC execution"
      : decision.nextRequiredAction;

  const inFlightSource = input.inFlightPacketSource ? ` (${input.inFlightPacketSource})` : "";

  const lines = [
    "CONSYNC-RUN REPORT",
    separator,
    "",
    `Requested packet ID:     ${input.packetId}`,
    `Requested packet type:   ${input.packetType}`,
    `Request type:            ${input.requestType}`,
    "",
    `Current mode:            ${contract.mode}`,
    `Allowed packet types:    ${contract.allowed_packet_types.join(", ")}`,
    `Blocked packet types:    ${contract.blocked_packet_types.join(", ")}`,
    "",
    `Git state:               ${input.gitStatus}`,
    `In-flight packet:        ${input.inFlightPacket === null ? "none" : input.inFlightPacket}${inFlightSource}`,
    "",
    `Decision:                ${decision.decision}`,
    `Reason:                  ${decision.reason}`,
    `Next required action:    ${nextAction}`,
    "",
    separator,
  ];

  return lines.join("\n");
}

function promptUser(question, inputStream, outputStream) {
  return new Promise((resolve) => {
    outputStream.write(question);

    let answered = false;

    const rl = readline.createInterface({
      input: inputStream,
      terminal: false,
    });

    rl.once("line", (answer) => {
      answered = true;
      rl.close();
      resolve(answer.trim());
    });

    rl.once("close", () => {
      if (!answered) {
        resolve("");
      }
    });
  });
}

async function runConsyncRunCommand(argv, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const inputStream = options.inputStream || process.stdin;
  const outputStream = options.outputStream || process.stdout;
  const flags = parseFlags(argv);

  const validationErrors = validateFlags(flags);

  if (validationErrors.length > 0) {
    console.error("consync-run: invalid arguments");

    for (const error of validationErrors) {
      console.error(`  ${error}`);
    }

    console.error("");
    console.error("Usage: node src/index.js consync-run --request-type=SDC --packet-type=process --packet-id=my-packet --git-status=clean [--in-flight-packet=other-packet]");
    process.exitCode = 1;
    return;
  }

  let contract;

  try {
    contract = loadActiveContract(rootDir);
  } catch (err) {
    console.error(`consync-run: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  let inFlightPacket;
  let inFlightPacketSource;

  if (flags["in-flight-packet"]) {
    inFlightPacket = flags["in-flight-packet"];
    inFlightPacketSource = "cli-override";
  } else {
    inFlightPacket = getInFlightPacket(rootDir);
    inFlightPacketSource = inFlightPacket !== null ? "state" : null;
  }

  const input = {
    requestType: flags["request-type"],
    packetId: flags["packet-id"],
    packetType: flags["packet-type"],
    gitStatus: flags["git-status"],
    inFlightPacket,
    inFlightPacketSource,
    mode: contract.mode,
  };

  const decision = applyGatekeeperRules(input, contract);
  const report = formatReport(input, contract, decision);

  console.log(report);

  if (decision.decision !== "ALLOW") {
    process.exitCode = 1;
    return;
  }

  const answer = await promptUser("Proceed with this action? (y/N) ", inputStream, outputStream);

  if (answer.toLowerCase() === "y") {
    console.log("Approved. (execution not implemented yet)");
  } else {
    console.log("Cancelled.");
  }
}

module.exports = { runConsyncRunCommand };
