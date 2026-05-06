const { spawnSync } = require("child_process");

/**
 * Run `git status --short` in the given directory and return a structured result.
 *
 * @param {string} [cwd] - directory to run in; defaults to process.cwd()
 * @returns {{ clean: boolean, count: number, files: string[] }}
 */
function getGitStatus(cwd) {
  const resolvedCwd = cwd || process.cwd();

  const result = spawnSync("git", ["status", "--short"], {
    cwd: resolvedCwd,
    encoding: "utf8",
  });

  if (result.error || result.status !== 0) {
    return { clean: false, count: 0, files: [], error: "git status failed" };
  }

  const lines = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    clean: lines.length === 0,
    count: lines.length,
    files: lines,
  };
}

module.exports = { getGitStatus };
