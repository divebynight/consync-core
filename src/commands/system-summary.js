function runSystemSummaryCommand() {
  console.log("CONSYN C SYSTEM SUMMARY");
  console.log("COMMANDS");
  console.log("- new-guid");
  console.log("- list-guid");
  console.log("- show-guid");
  console.log("- sandbox-scan");
  console.log("- sandbox-verify");
  console.log("- sandbox-describe");
  console.log("- sandbox-propose");
  console.log("- sandbox-discover");
  console.log("- sandbox-search");
  console.log("- sandbox-desktop-search");
  console.log("- system-check");
  console.log("- system-summary");
  console.log("- state-integrity-check");
  console.log("- portable");
  console.log("DESKTOP");
  console.log("- npm run start:desktop");
  console.log("- npm run test:desktop-scaffold");
  console.log("FIXTURES");
  console.log("- basic-mixed");
  console.log("- nested-mixed");
  console.log("- nested-anchor-trial");
  console.log("- single-type-flat");
  console.log("- mixed-flat-small");
  console.log("EXPECTATIONS");
  console.log("- basic-mixed-scan");
  console.log("- nested-mixed-scan");
  console.log("- nested-anchor-trial-discover");
  console.log("- nested-anchor-trial-search-moss");
  console.log("- nested-anchor-trial-desktop-search-moss");
  console.log("- basic-mixed-propose");
  console.log("- nested-mixed-propose");
  console.log("- single-type-flat-propose");
  console.log("- mixed-flat-small-propose");
  console.log("VERIFY");
  console.log("- npm run verify");
  console.log("- npm run check:state-preflight");
  console.log("- npm run check:state-postflight");
  console.log("- read-only layered checkpoint active");
}

module.exports = {
  runSystemSummaryCommand,
};