const { main } = require("./cli/consync");

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
