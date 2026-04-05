const { spawn } = require("child_process");

function copyToClipboard(text) {
  return new Promise(resolve => {
    const processHandle = spawn("pbcopy");

    processHandle.on("error", error => {
      resolve(error);
    });

    processHandle.on("close", code => {
      if (code === 0) {
        resolve(null);
        return;
      }

      resolve(new Error("pbcopy exited with a non-zero status"));
    });

    processHandle.stdin.end(text);
  });
}

module.exports = {
  copyToClipboard,
};