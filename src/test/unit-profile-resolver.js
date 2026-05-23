const assert = require("assert");
const path = require("path");

const TEST_NAME = "unit-profile-resolver";
const repoRoot = path.resolve(__dirname, "..", "..");

// Import after repoRoot is defined so relative paths resolve correctly
const {
  resolveProfile,
  getValidProfiles,
  getProfileConfig,
  DEFAULT_PROFILE,
} = require("../lib/profileResolver.process.scaffoldai");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Default profile resolves to DEFAULT_DEV / PASSIVE / LIVE
    {
      const originalEnv = process.env.SCAFFOLDAI_PROCESS_PROFILE;
      delete process.env.SCAFFOLDAI_PROCESS_PROFILE;

      // Need to re-require to get fresh resolution
      delete require.cache[require.resolve("../lib/profileResolver.process.scaffoldai")];
      const { resolveProfile: freshResolve } = require("../lib/profileResolver.process.scaffoldai");

      const profile = freshResolve();

      assert.strictEqual(profile.profile, "DEFAULT_DEV", "Default profile should be DEFAULT_DEV");
      assert.strictEqual(profile.interaction_mode, "PASSIVE", "Default interaction_mode should be PASSIVE");
      assert.strictEqual(profile.execution_mode, "LIVE", "Default execution_mode should be LIVE");
      assert.strictEqual(profile.passive, true, "passive should be true");
      assert.strictEqual(profile.live, true, "live should be true");
      assert.strictEqual(profile.dry_run, false, "dry_run should be false");
      assert.strictEqual(profile.strict, false, "strict should be false");
      assert.strictEqual(profile.bypass, false, "bypass should be false");

      // Restore env
      if (originalEnv !== undefined) {
        process.env.SCAFFOLDAI_PROCESS_PROFILE = originalEnv;
      }

      console.log("  PASS: default profile resolves to DEFAULT_DEV / PASSIVE / LIVE");
    }

    // 2. PROCESS_TEST resolves to STRICT / DRY_RUN
    {
      const originalEnv = process.env.SCAFFOLDAI_PROCESS_PROFILE;
      process.env.SCAFFOLDAI_PROCESS_PROFILE = "PROCESS_TEST";

      delete require.cache[require.resolve("../lib/profileResolver.process.scaffoldai")];
      const { resolveProfile: freshResolve } = require("../lib/profileResolver.process.scaffoldai");

      const profile = freshResolve();

      assert.strictEqual(profile.profile, "PROCESS_TEST", "Profile should be PROCESS_TEST");
      assert.strictEqual(profile.interaction_mode, "STRICT", "interaction_mode should be STRICT");
      assert.strictEqual(profile.execution_mode, "DRY_RUN", "execution_mode should be DRY_RUN");
      assert.strictEqual(profile.strict, true, "strict should be true");
      assert.strictEqual(profile.dry_run, true, "dry_run should be true");
      assert.strictEqual(profile.live, false, "live should be false");
      assert.strictEqual(profile.passive, false, "passive should be false");
      assert.strictEqual(profile.bypass, false, "bypass should be false");

      // Restore env
      if (originalEnv !== undefined) {
        process.env.SCAFFOLDAI_PROCESS_PROFILE = originalEnv;
      } else {
        delete process.env.SCAFFOLDAI_PROCESS_PROFILE;
      }

      console.log("  PASS: PROCESS_TEST resolves to STRICT / DRY_RUN");
    }

    // 3. FULL_GOVERNED resolves to STRICT / LIVE
    {
      const originalEnv = process.env.SCAFFOLDAI_PROCESS_PROFILE;
      process.env.SCAFFOLDAI_PROCESS_PROFILE = "FULL_GOVERNED";

      delete require.cache[require.resolve("../lib/profileResolver.process.scaffoldai")];
      const { resolveProfile: freshResolve } = require("../lib/profileResolver.process.scaffoldai");

      const profile = freshResolve();

      assert.strictEqual(profile.profile, "FULL_GOVERNED", "Profile should be FULL_GOVERNED");
      assert.strictEqual(profile.interaction_mode, "STRICT", "interaction_mode should be STRICT");
      assert.strictEqual(profile.execution_mode, "LIVE", "execution_mode should be LIVE");
      assert.strictEqual(profile.strict, true, "strict should be true");
      assert.strictEqual(profile.live, true, "live should be true");
      assert.strictEqual(profile.dry_run, false, "dry_run should be false");
      assert.strictEqual(profile.passive, false, "passive should be false");
      assert.strictEqual(profile.bypass, false, "bypass should be false");

      // Restore env
      if (originalEnv !== undefined) {
        process.env.SCAFFOLDAI_PROCESS_PROFILE = originalEnv;
      } else {
        delete process.env.SCAFFOLDAI_PROCESS_PROFILE;
      }

      console.log("  PASS: FULL_GOVERNED resolves to STRICT / LIVE");
    }

    // 4. DIRECT_WORK resolves to BYPASS / LIVE
    {
      const originalEnv = process.env.SCAFFOLDAI_PROCESS_PROFILE;
      process.env.SCAFFOLDAI_PROCESS_PROFILE = "DIRECT_WORK";

      delete require.cache[require.resolve("../lib/profileResolver.process.scaffoldai")];
      const { resolveProfile: freshResolve } = require("../lib/profileResolver.process.scaffoldai");

      const profile = freshResolve();

      assert.strictEqual(profile.profile, "DIRECT_WORK", "Profile should be DIRECT_WORK");
      assert.strictEqual(profile.interaction_mode, "BYPASS", "interaction_mode should be BYPASS");
      assert.strictEqual(profile.execution_mode, "LIVE", "execution_mode should be LIVE");
      assert.strictEqual(profile.bypass, true, "bypass should be true");
      assert.strictEqual(profile.live, true, "live should be true");
      assert.strictEqual(profile.dry_run, false, "dry_run should be false");
      assert.strictEqual(profile.passive, false, "passive should be false");
      assert.strictEqual(profile.strict, false, "strict should be false");

      // Restore env
      if (originalEnv !== undefined) {
        process.env.SCAFFOLDAI_PROCESS_PROFILE = originalEnv;
      } else {
        delete process.env.SCAFFOLDAI_PROCESS_PROFILE;
      }

      console.log("  PASS: DIRECT_WORK resolves to BYPASS / LIVE");
    }

    // 5. Invalid profile falls back with warning
    {
      const originalEnv = process.env.SCAFFOLDAI_PROCESS_PROFILE;
      process.env.SCAFFOLDAI_PROCESS_PROFILE = "INVALID_PROFILE";

      delete require.cache[require.resolve("../lib/profileResolver.process.scaffoldai")];
      const { resolveProfile: freshResolve } = require("../lib/profileResolver.process.scaffoldai");

      const profile = freshResolve();

      assert.strictEqual(profile.profile, "DEFAULT_DEV", "Invalid profile should fall back to DEFAULT_DEV");
      assert.strictEqual(profile.interaction_mode, "PASSIVE", "Fallback should have PASSIVE interaction_mode");
      assert.strictEqual(profile.execution_mode, "LIVE", "Fallback should have LIVE execution_mode");
      assert.ok(profile.warning, "Should include warning field");
      assert.ok(
        profile.warning.includes("INVALID_PROFILE"),
        "Warning should mention the invalid profile name"
      );

      // Restore env
      if (originalEnv !== undefined) {
        process.env.SCAFFOLDAI_PROCESS_PROFILE = originalEnv;
      } else {
        delete process.env.SCAFFOLDAI_PROCESS_PROFILE;
      }

      console.log("  PASS: invalid profile falls back to DEFAULT_DEV with warning");
    }

    // 6. getValidProfiles returns all valid profile names
    {
      const validProfiles = getValidProfiles();

      assert.ok(Array.isArray(validProfiles), "getValidProfiles should return an array");
      assert.ok(validProfiles.includes("DEFAULT_DEV"), "Should include DEFAULT_DEV");
      assert.ok(validProfiles.includes("PROCESS_TEST"), "Should include PROCESS_TEST");
      assert.ok(validProfiles.includes("FULL_GOVERNED"), "Should include FULL_GOVERNED");
      assert.ok(validProfiles.includes("DIRECT_WORK"), "Should include DIRECT_WORK");
      assert.strictEqual(validProfiles.length, 4, "Should have exactly 4 valid profiles");

      console.log("  PASS: getValidProfiles returns all valid profile names");
    }

    // 7. getProfileConfig returns correct config or null
    {
      const defaultConfig = getProfileConfig("DEFAULT_DEV");
      assert.ok(defaultConfig, "Should return config for DEFAULT_DEV");
      assert.strictEqual(defaultConfig.interaction_mode, "PASSIVE");
      assert.strictEqual(defaultConfig.execution_mode, "LIVE");

      const invalidConfig = getProfileConfig("INVALID");
      assert.strictEqual(invalidConfig, null, "Should return null for invalid profile");

      console.log("  PASS: getProfileConfig returns correct config or null");
    }

    console.log(`[${TEST_NAME}] PASS`);
    process.exit(0);
  } catch (error) {
    fail(error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
