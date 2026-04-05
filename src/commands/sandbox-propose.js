const path = require("path");
const { buildSandboxDescribeSummary, compareText } = require("./sandbox-describe");

function runSandboxProposeCommand(targetPath) {
  if (!targetPath) {
    console.log("Path is required");
    process.exitCode = 1;
    return;
  }

  const summary = buildSandboxDescribeSummary(targetPath);

  if (!summary.ok) {
    console.log(summary.output);
    process.exitCode = 1;
    return;
  }

  const hasNestedPaths = summary.fileNames.some(fileName => fileName.includes(path.sep));
  const proposalLines = [];
  const notes = [];

  if (hasNestedPaths) {
    proposalLines.push("- no additional grouping recommended");
    notes.push("directory already has a simple nested structure");
  } else if (Object.keys(summary.categoryCounts).length > 1) {
    for (const category of Object.keys(summary.categoryCounts).sort(compareText)) {
      proposalLines.push(`- ${category}/: ${summary.categoryCounts[category]}`);
    }

    notes.push("group by media type if you want a cleaner working directory");
  } else {
    proposalLines.push("- no additional grouping recommended");
  }

  for (const note of summary.notes) {
    notes.push(note);
  }

  console.log(`PATH: ${targetPath}`);
  console.log("PROPOSED GROUPS:");

  for (const line of proposalLines) {
    console.log(line);
  }

  console.log("NOTES:");

  if (notes.length === 0) {
    console.log("- none");
    return;
  }

  for (const note of notes) {
    console.log(`- ${note}`);
  }
}

module.exports = {
  runSandboxProposeCommand,
};