const { runScaffoldPlanCommand } = require("./scaffoldai-plan.cmd.scaffoldai");

// -----------------------------------------------------------------------
// scaffold-discuss: Alias for scaffold-plan (read-only planning runner)
// -----------------------------------------------------------------------
//
// scaffold-discuss is preserved for backward compatibility.
// The canonical operator command is scaffold-plan.
// -----------------------------------------------------------------------

function runScaffoldDiscussCommand(options = {}) {
  runScaffoldPlanCommand(options);
}

module.exports = { runScaffoldDiscussCommand };
