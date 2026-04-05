const { runNewGuidCommand } = require("./commands/new-guid");

async function main() {
  const command = process.argv[2];

  if (command !== "new-guid") {
    console.error("Unknown command");
    process.exitCode = 1;
    return;
  }

  await runNewGuidCommand();
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});