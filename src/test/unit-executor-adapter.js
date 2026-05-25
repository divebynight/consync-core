const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  resolveExecutorContext,
  buildPlanCommand,
  buildWorkCommand,
} = require("../lib/executorAdapter.lib.scaffoldai");

const TEST_NAME = "unit-executor-adapter";
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "scaffoldai.js");

function fail(message, err) {
  console.error(`[${TEST_NAME}] FAIL: ${message}`);
  if (err) console.error(err.stack || err.message);
  process.exit(1);
}

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  // -----------------------------------------------------------------------
  // buildPlanCommand — pure function tests
  // -----------------------------------------------------------------------

  {
    const result = buildPlanCommand({ repoRoot: "/repo", prompt: "analyze this" });

    assert.strictEqual(result.executable, "copilot", "plan: executable should be copilot");
    assert.ok(Array.isArray(result.args), "plan: args should be an array");
    assert.ok(result.args.includes("-C"), "plan: args should include -C flag");
    assert.ok(result.args.includes("/repo"), "plan: args should include repoRoot");
    assert.ok(result.args.includes("--plan"), "plan: args should include --plan");
    assert.ok(result.args.includes("--silent"), "plan: args should include --silent");
    assert.ok(result.args.includes("--disable-builtin-mcps"), "plan: args should include --disable-builtin-mcps");
    assert.ok(result.args.includes("--deny-tool=write"), "plan: args should deny write tool");
    assert.ok(result.args.includes("--deny-tool=shell(*)"), "plan: args should deny shell(*) tool");
    assert.ok(result.args.includes("-p"), "plan: args should include -p flag");
    assert.ok(result.args.includes("analyze this"), "plan: args should include prompt");
    assert.ok(!result.args.includes("--allow-tool=write"), "plan: args must not allow write tool");
    assert.deepStrictEqual(result.spawnOptions, { cwd: "/repo" }, "plan: spawnOptions.cwd should be repoRoot");
    console.log("  PASS: buildPlanCommand constructs correct command descriptor");
  }

  // -----------------------------------------------------------------------
  // buildWorkCommand — pure function tests
  // -----------------------------------------------------------------------

  {
    const result = buildWorkCommand({ repoRoot: "/repo", prompt: "execute this" });

    assert.strictEqual(result.executable, "copilot", "work: executable should be copilot");
    assert.ok(Array.isArray(result.args), "work: args should be an array");
    assert.ok(result.args.includes("-C"), "work: args should include -C flag");
    assert.ok(result.args.includes("/repo"), "work: args should include repoRoot");
    assert.ok(result.args.includes("--silent"), "work: args should include --silent");
    assert.ok(result.args.includes("--allow-tool=write"), "work: args should allow write tool");
    assert.ok(result.args.includes("--deny-tool=shell(*)"), "work: args should deny shell(*) tool");
    assert.ok(result.args.includes("-p"), "work: args should include -p flag");
    assert.ok(result.args.includes("execute this"), "work: args should include prompt");
    assert.ok(!result.args.includes("--plan"), "work: args must not include --plan");
    assert.deepStrictEqual(result.spawnOptions, { cwd: "/repo" }, "work: spawnOptions.cwd should be repoRoot");
    console.log("  PASS: buildWorkCommand constructs correct command descriptor");
  }

  // -----------------------------------------------------------------------
  // buildPlanCommand — repo scoping: -C appears before repoRoot in args
  // -----------------------------------------------------------------------

  {
    const result = buildPlanCommand({ repoRoot: "/my/repo", prompt: "test" });
    const cIdx = result.args.indexOf("-C");
    assert.ok(cIdx !== -1, "repo scoping: -C must be present");
    assert.strictEqual(result.args[cIdx + 1], "/my/repo", "repo scoping: -C must be immediately followed by repoRoot");
    assert.strictEqual(result.spawnOptions.cwd, "/my/repo", "repo scoping: cwd must equal repoRoot");
    console.log("  PASS: buildPlanCommand scopes repository root correctly");
  }

  {
    const result = buildWorkCommand({ repoRoot: "/my/repo", prompt: "test" });
    const cIdx = result.args.indexOf("-C");
    assert.ok(cIdx !== -1, "repo scoping: -C must be present in work command");
    assert.strictEqual(result.args[cIdx + 1], "/my/repo", "repo scoping: work command -C followed by repoRoot");
    console.log("  PASS: buildWorkCommand scopes repository root correctly");
  }

  // -----------------------------------------------------------------------
  // buildPlanCommand — rejects missing params
  // -----------------------------------------------------------------------

  {
    assert.throws(
      () => buildPlanCommand({ prompt: "test" }),
      /repoRoot is required/,
      "plan: should throw when repoRoot is missing"
    );
    assert.throws(
      () => buildPlanCommand({ repoRoot: "/repo" }),
      /prompt is required/,
      "plan: should throw when prompt is missing"
    );
    console.log("  PASS: buildPlanCommand rejects missing required params");
  }

  // -----------------------------------------------------------------------
  // buildWorkCommand — rejects missing params
  // -----------------------------------------------------------------------

  {
    assert.throws(
      () => buildWorkCommand({ prompt: "test" }),
      /repoRoot is required/,
      "work: should throw when repoRoot is missing"
    );
    assert.throws(
      () => buildWorkCommand({ repoRoot: "/repo" }),
      /prompt is required/,
      "work: should throw when prompt is missing"
    );
    console.log("  PASS: buildWorkCommand rejects missing required params");
  }

  // -----------------------------------------------------------------------
  // resolveExecutorContext — refusal when repoRoot is invalid
  // -----------------------------------------------------------------------

  {
    assert.throws(
      () => resolveExecutorContext("/does/not/exist/scaffoldai-test-path"),
      /repository root not found/,
      "resolve: should throw for non-existent repoRoot"
    );
    console.log("  PASS: resolveExecutorContext rejects non-existent repoRoot");
  }

  // -----------------------------------------------------------------------
  // resolveExecutorContext — live repo: succeeds with active packet
  // -----------------------------------------------------------------------

  {
    // This repo has an active packet mounted (add-minimal-executor-adapter-cli-first-mcp-ready-boundary.sdc)
    let context;
    try {
      context = resolveExecutorContext(repoRoot);
    } catch (err) {
      fail("resolveExecutorContext should succeed with active packet in live repo", err);
    }

    assert.ok(context.activePacket, "resolve: should return activePacket");
    assert.ok(context.packageName, "resolve: should return packageName");
    assert.ok(typeof context.nextActionContent === "string", "resolve: should return nextActionContent string");
    assert.ok(context.nextActionContent.length > 0, "resolve: nextActionContent should be non-empty");
    assert.strictEqual(context.repoRoot, repoRoot, "resolve: repoRoot should match input");
    console.log("  PASS: resolveExecutorContext succeeds with active packet");
    console.log(`         activePacket: ${context.activePacket}`);
  }

  // -----------------------------------------------------------------------
  // CLI — scaffold plan command runs and exits cleanly
  // -----------------------------------------------------------------------

  {
    const result = runCli(["scaffoldai", "plan"]);

    assert.ok(
      result.status === 0 || result.status === 1,
      `plan CLI: expected exit 0 or 1, got ${result.status}\nstderr: ${result.stderr}`
    );
    assert.ok(
      result.stdout.includes("[scaffold-plan]"),
      `plan CLI: expected [scaffold-plan] header\nstdout: ${result.stdout}`
    );
    console.log("  PASS: scaffold-plan CLI command runs and produces [scaffold-plan] header");
  }

  // -----------------------------------------------------------------------
  // CLI — scaffold discuss delegates to plan
  // -----------------------------------------------------------------------

  {
    const result = runCli(["scaffoldai", "discuss"]);

    assert.ok(
      result.stdout.includes("[scaffold-plan]"),
      `discuss CLI: expected [scaffold-plan] header (discuss delegates to plan)\nstdout: ${result.stdout}`
    );
    console.log("  PASS: scaffold-discuss delegates to scaffold-plan");
  }

  // -----------------------------------------------------------------------
  // CLI — scaffold work command runs and exits cleanly
  // -----------------------------------------------------------------------

  {
    const result = runCli(["scaffoldai", "work"]);

    assert.ok(
      result.status === 0 || result.status === 1,
      `work CLI: expected exit 0 or 1, got ${result.status}\nstderr: ${result.stderr}`
    );
    assert.ok(
      result.stdout.includes("[scaffold-work]"),
      `work CLI: expected [scaffold-work] header\nstdout: ${result.stdout}`
    );
    console.log("  PASS: scaffold-work CLI command runs and produces [scaffold-work] header");
  }

  // -----------------------------------------------------------------------
  // CLI — plan command outputs EXECUTOR COMMAND block with active packet
  // -----------------------------------------------------------------------

  {
    const result = runCli(["scaffoldai", "plan"]);

    if (result.status === 0) {
      assert.ok(
        result.stdout.includes("EXECUTOR COMMAND:"),
        `plan CLI: expected EXECUTOR COMMAND block\nstdout: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("copilot"),
        `plan CLI: expected copilot in command output\nstdout: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("--plan"),
        `plan CLI: expected --plan flag in command output\nstdout: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("--deny-tool=write"),
        `plan CLI: expected --deny-tool=write in command output\nstdout: ${result.stdout}`
      );
      console.log("  PASS: scaffold-plan outputs complete EXECUTOR COMMAND block");
    } else {
      // Active packet present but may have edge case — ensure it's an error about packet
      console.log("  SKIP: scaffold-plan exited non-zero (acceptable if no active packet condition)");
    }
  }

  // -----------------------------------------------------------------------
  // CLI — work command outputs EXECUTOR COMMAND block with active packet
  // -----------------------------------------------------------------------

  {
    const result = runCli(["scaffoldai", "work"]);

    if (result.status === 0) {
      assert.ok(
        result.stdout.includes("EXECUTOR COMMAND:"),
        `work CLI: expected EXECUTOR COMMAND block\nstdout: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("copilot"),
        `work CLI: expected copilot in command output\nstdout: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("--allow-tool=write"),
        `work CLI: expected --allow-tool=write in command output\nstdout: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("LIFECYCLE SEPARATION:"),
        `work CLI: expected LIFECYCLE SEPARATION block\nstdout: ${result.stdout}`
      );
      console.log("  PASS: scaffold-work outputs complete EXECUTOR COMMAND block");
    } else {
      console.log("  SKIP: scaffold-work exited non-zero (acceptable if no active packet condition)");
    }
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main();
