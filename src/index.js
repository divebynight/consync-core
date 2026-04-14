const { main } = require("./cli");

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});