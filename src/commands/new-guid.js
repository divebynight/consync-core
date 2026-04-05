const readline = require("readline");
const { newGuidTool } = require("../lib/newGuidTool");

function ask(question) {
  const interfaceHandle = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    interfaceHandle.question(question, answer => {
      interfaceHandle.close();
      resolve(answer);
    });
  });
}

async function runNewGuidCommand(options = {}) {
  const note = typeof options.note === "string"
    ? options.note
    : await ask("note: ");
  const result = await newGuidTool({ note });

  console.log(result.filePath);
  console.log(result.guid);
}

module.exports = {
  runNewGuidCommand,
};