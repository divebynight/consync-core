const { main } = require("./cli/scaffoldai");

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
