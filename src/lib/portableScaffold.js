const fs = require("fs");
const path = require("path");

const PORTABLE_TEMPLATE_DIR = path.resolve(__dirname, "..", "..", ".consync", "templates", "portable");

function collectTemplateFiles(rootPath, relativePath = "") {
  const currentPath = path.join(rootPath, relativePath);
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of entries) {
    const nextRelativePath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...collectTemplateFiles(rootPath, nextRelativePath));
      continue;
    }

    if (entry.isFile()) {
      filePaths.push(nextRelativePath);
    }
  }

  return filePaths;
}

function scaffoldPortableTemplate(targetPath, options = {}) {
  const templateFiles = collectTemplateFiles(PORTABLE_TEMPLATE_DIR);
  const created = [];
  const overwritten = [];
  const skipped = [];

  for (const relativeFilePath of templateFiles) {
    const sourcePath = path.join(PORTABLE_TEMPLATE_DIR, relativeFilePath);
    const destinationPath = path.join(targetPath, relativeFilePath);

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    if (fs.existsSync(destinationPath)) {
      if (options.force) {
        fs.copyFileSync(sourcePath, destinationPath);
        overwritten.push(relativeFilePath);
      } else {
        skipped.push(relativeFilePath);
      }

      continue;
    }

    fs.copyFileSync(sourcePath, destinationPath);
    created.push(relativeFilePath);
  }

  return {
    created,
    overwritten,
    skipped,
    targetPath,
  };
}

module.exports = {
  PORTABLE_TEMPLATE_DIR,
  scaffoldPortableTemplate,
};