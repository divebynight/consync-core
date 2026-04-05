function runSandboxCatalogCommand() {
  console.log("SANDBOX CATALOG");
  console.log("FIXTURES");
  console.log("- basic-mixed");
  console.log("- nested-mixed");
  console.log("- single-type-flat");
  console.log("- mixed-flat-small");
  console.log("SCAN EXPECTATIONS");
  console.log("- basic-mixed -> basic-mixed-scan");
  console.log("- nested-mixed -> nested-mixed-scan");
  console.log("PROPOSE EXPECTATIONS");
  console.log("- basic-mixed -> basic-mixed-propose");
  console.log("- nested-mixed -> nested-mixed-propose");
  console.log("- single-type-flat -> single-type-flat-propose");
  console.log("- mixed-flat-small -> mixed-flat-small-propose");
}

module.exports = {
  runSandboxCatalogCommand,
};