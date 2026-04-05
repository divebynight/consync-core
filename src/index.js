const { runNewGuidCommand } = require("./commands/new-guid");

function parseNewGuidOptions(argv) {
  if (argv[0] === "--note") {
    return {
      note: argv[1] || "",
    };
  }

  return {};
}

async function main() {
  const command = process.argv[2];

  if (command !== "new-guid") {
    console.error("Unknown command");
    process.exitCode = 1;
    return;
  }

  await runNewGuidCommand(parseNewGuidOptions(process.argv.slice(3)));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});