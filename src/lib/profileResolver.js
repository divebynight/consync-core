"use strict";

/**
 * ScaffoldAI Process Profile Resolver
 * 
 * Resolves the active process profile from environment variables.
 * 
 * Profiles are startup/config concepts, not MCP-settable runtime switches.
 * 
 * See: .scaffoldai/contracts/process-profile.contract.md
 */

const VALID_PROFILES = {
  DEFAULT_DEV: {
    interaction_mode: "PASSIVE",
    execution_mode: "LIVE",
  },
  PROCESS_TEST: {
    interaction_mode: "STRICT",
    execution_mode: "DRY_RUN",
  },
  FULL_GOVERNED: {
    interaction_mode: "STRICT",
    execution_mode: "LIVE",
  },
  DIRECT_WORK: {
    interaction_mode: "BYPASS",
    execution_mode: "LIVE",
  },
};

const DEFAULT_PROFILE = "DEFAULT_DEV";

/**
 * Resolve the active ScaffoldAI process profile.
 * 
 * @returns {Object} Profile resolution result
 * @returns {string} .profile - Profile name (e.g., "DEFAULT_DEV")
 * @returns {string} .interaction_mode - Interaction mode (PASSIVE, STRICT, BYPASS)
 * @returns {string} .execution_mode - Execution mode (LIVE, DRY_RUN)
 * @returns {boolean} .dry_run - True if execution_mode is DRY_RUN
 * @returns {boolean} .live - True if execution_mode is LIVE
 * @returns {boolean} .bypass - True if interaction_mode is BYPASS
 * @returns {boolean} .strict - True if interaction_mode is STRICT
 * @returns {boolean} .passive - True if interaction_mode is PASSIVE
 */
function resolveProfile() {
  const envProfile = process.env.SCAFFOLDAI_PROCESS_PROFILE;
  
  let profile = DEFAULT_PROFILE;
  let warning = null;
  
  if (envProfile) {
    if (VALID_PROFILES[envProfile]) {
      profile = envProfile;
    } else {
      warning = `Invalid SCAFFOLDAI_PROCESS_PROFILE: "${envProfile}". Falling back to ${DEFAULT_PROFILE}.`;
      // Log warning to stderr for visibility
      console.warn(warning);
    }
  }
  
  const config = VALID_PROFILES[profile];
  const interaction_mode = config.interaction_mode;
  const execution_mode = config.execution_mode;
  
  return {
    profile,
    interaction_mode,
    execution_mode,
    dry_run: execution_mode === "DRY_RUN",
    live: execution_mode === "LIVE",
    bypass: interaction_mode === "BYPASS",
    strict: interaction_mode === "STRICT",
    passive: interaction_mode === "PASSIVE",
    ...(warning ? { warning } : {}),
  };
}

/**
 * Get the list of valid profile names.
 * 
 * @returns {string[]} Array of valid profile names
 */
function getValidProfiles() {
  return Object.keys(VALID_PROFILES);
}

/**
 * Get profile configuration without environment resolution.
 * Useful for testing.
 * 
 * @param {string} profileName - Profile name to look up
 * @returns {Object|null} Profile configuration or null if invalid
 */
function getProfileConfig(profileName) {
  return VALID_PROFILES[profileName] || null;
}

module.exports = {
  resolveProfile,
  getValidProfiles,
  getProfileConfig,
  DEFAULT_PROFILE,
};
