"use strict";

function gatherScaffoldAIIdentity() {
  return {
    tool: "scaffoldai_identity",
    execution_class: "READ_ONLY",
    status: "ON_TRACK",
    data: {
      system: {
        name: "ScaffoldAI",
        role: "AI development/process platform",
        description:
          "ScaffoldAI is a separate system: an AI development/process platform, a deterministic workflow system, and a coordination layer for tools like Copilot, Codex, ChatGPT.",
      },
      relationship: {
        consync: "Consync is the software/product.",
        consync_core: "consync-core is the repository and codebase that builds Consync.",
        scaffoldai: "ScaffoldAI is used to build consync-core; consync-core produces Consync.",
      },
      bridge_layer: {
        scaffoldai: ".scaffoldai/ belongs to ScaffoldAI, not Consync.",
        consync: ".consync/ should NOT be used for ScaffoldAI development state.",
      },
      mcp_model: {
        purpose:
          "ScaffoldAI MCP is a controlled access layer over ScaffoldAI capabilities and state.",
        boundary:
          "The MCP server is not a remote service, product runtime, shell proxy, workflow engine, or autonomous agent bus.",
        output_authority: "Tool output is evidence or recommendation. It is not approval.",
      },
      human_authority: [
        "choosing or approving work",
        "resolving ambiguity",
        "running VERIFY COMMANDS",
        "accepting verification evidence",
        "approving closeout",
        "staging, committing, pushing, branching, or creating PRs",
        "changing process state under .scaffoldai/state/ or .scaffoldai/streams/",
      ],
      canonical_sources: [
        ".scaffoldai/contracts/system-identity.contract.md",
        ".scaffoldai/README.md",
        ".scaffoldai/reference/mcp-boundary.reference.md",
      ],
    },
    next_safe_action: "Use read-only observations to understand state; ask the human before any action above READ_ONLY.",
  };
}

module.exports = { gatherScaffoldAIIdentity };
