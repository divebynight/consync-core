const TYPE_PATTERNS = {
  product: /\b(feature|build|ui|app|electron|window|interface|render|display|button|screen|component|page)\b/,
  process: /\b(workflow|process|runbook|agent|handoff|state|packet|intake|preflight|verify|closeout|gatekeeper)\b/,
  docs: /\b(doc|document|readme|guide|write|describe|explain|clarify)\b/,
  tests: /\b(test|verify|unit|integration|spec|coverage|assertion)\b/,
  runtime: /\b(run|execute|performance|memory|speed|optimize|benchmark)\b/,
  adapter: /\b(github|copilot|api|connector|hook|mcp|plugin|extension)\b/,
};

const TARGET_SURFACES = {
  product: ["src/", "electron/"],
  process: [".scaffoldai/process/", ".scaffoldai/agents/"],
  docs: ["README.md", ".scaffoldai/process/", ".scaffoldai/examples/"],
  tests: ["src/test/"],
  runtime: ["src/core/", "src/lib/"],
  adapter: [".github/"],
  mixed: ["multiple — see classification types"],
  unknown: [],
};

const OUT_OF_SCOPE = {
  product: [".consync/ process docs", "agent definitions"],
  process: ["src/ product code", "electron/"],
  docs: ["src/ code changes", ".scaffoldai/state/"],
  tests: ["product features", "process docs"],
  runtime: ["UI components", "process docs"],
  adapter: ["product code", "process docs"],
  mixed: ["automatic dispatch", "orchestration"],
  unknown: ["all surfaces — classification required first"],
};

const RISK = {
  product: "medium",
  process: "low",
  docs: "low",
  tests: "low",
  runtime: "medium",
  adapter: "low",
  mixed: "medium",
  unknown: "high",
};

const VERIFICATION_LEVEL = {
  product: "standard",
  process: "standard",
  docs: "lightweight",
  tests: "standard",
  runtime: "thorough",
  adapter: "standard",
  mixed: "thorough",
  unknown: "standard",
};

function classifyInput(input) {
  const lower = input.toLowerCase();
  const matched = [];

  for (const [type, pattern] of Object.entries(TYPE_PATTERNS)) {
    if (pattern.test(lower)) {
      matched.push(type);
    }
  }

  let classification, status, ambiguity;

  if (matched.length === 0) {
    classification = "unknown";
    status = "NEEDS_CLARIFICATION";
    ambiguity = "no recognizable keywords found";
  } else if (matched.length === 1) {
    classification = matched[0];
    status = "PASS";
    ambiguity = "none";
  } else {
    classification = "mixed";
    status = "PASS";
    ambiguity = `multiple types detected: ${matched.join(", ")}`;
  }

  const recommendedNextAction =
    status === "PASS"
      ? `Define and mount a ${classification} packet`
      : "Clarify request scope before creating a packet";

  const requiredNextStep =
    status === "PASS"
      ? `Invoke Preflight, then mount a ${classification} packet`
      : "Revise prompt with more specific scope or keywords";

  return {
    status,
    classification,
    risk: RISK[classification],
    ambiguity,
    recommendedNextAction,
    targetSurfaces: TARGET_SURFACES[classification] || [],
    outOfScope: OUT_OF_SCOPE[classification] || [],
    verificationLevel: VERIFICATION_LEVEL[classification],
    requiredNextStep,
  };
}

module.exports = { classifyInput };
