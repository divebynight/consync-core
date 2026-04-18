const REQUIRED_HANDOFF_SECTIONS = [
  "STATUS",
  "SUMMARY",
  "FILES CREATED",
  "FILES MODIFIED",
  "COMMANDS TO RUN",
  "HUMAN VERIFICATION",
  "VERIFICATION NOTES",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findIdentityValue(text, fieldName) {
  const match = text.match(new RegExp(`^${fieldName}:\\s*(.+)\\s*$`, "m"));
  return match ? match[1].trim() : null;
}

function hasStandaloneSection(text, sectionName) {
  return new RegExp(`^${escapeRegExp(sectionName)}\\s*$`, "m").test(text);
}

function getStandaloneSectionLineIndexes(text) {
  return text.split(/\r?\n/).reduce((indexes, line, index) => {
    if (/^[A-Z][A-Z ]+$/.test(line.trim())) {
      indexes.push(index);
    }

    return indexes;
  }, []);
}

function validateNextActionText(text) {
  const errors = [];
  const type = findIdentityValue(text, "TYPE");
  const packageName = findIdentityValue(text, "PACKAGE");

  if (!type) {
    errors.push("next-action missing TYPE");
  }

  if (!packageName) {
    errors.push("next-action missing PACKAGE");
  }

  if (!/(^GOAL\s*$|^OBJECTIVE\s*$)/m.test(text)) {
    errors.push("next-action missing GOAL or OBJECTIVE section");
  }

  if (!/(^DO\s*$|^REQUIRED OUTCOME\s*$)/m.test(text)) {
    errors.push("next-action missing DO or REQUIRED OUTCOME section");
  }

  if (!/(^CONSTRAINTS\s*$|^NON-GOALS\s*$)/m.test(text)) {
    errors.push("next-action missing CONSTRAINTS or NON-GOALS section");
  }

  if (!/^VERIFICATION\s*$/m.test(text)) {
    errors.push("next-action missing VERIFICATION section");
  }

  return {
    type,
    packageName,
    errors,
  };
}

function validateHandoffText(text) {
  const errors = [];
  const type = findIdentityValue(text, "TYPE");
  const packageName = findIdentityValue(text, "PACKAGE");

  if (!type) {
    errors.push("handoff missing TYPE");
  }

  if (!packageName) {
    errors.push("handoff missing PACKAGE");
  }

  for (const sectionName of REQUIRED_HANDOFF_SECTIONS) {
    if (!hasStandaloneSection(text, sectionName)) {
      errors.push(`handoff missing section: ${sectionName}`);
    }
  }

  const nextRecommendedPackageIndex = text.indexOf("\nNEXT RECOMMENDED PACKAGE\n");

  if (nextRecommendedPackageIndex !== -1) {
    const lines = text.split(/\r?\n/);
    const nextRecommendedPackageLineIndex = lines.findIndex(line => line.trim() === "NEXT RECOMMENDED PACKAGE");

    if (nextRecommendedPackageLineIndex === -1) {
      errors.push("handoff NEXT RECOMMENDED PACKAGE section is malformed");
    } else {
      const laterSectionExists = getStandaloneSectionLineIndexes(text).some(
        lineIndex => lineIndex > nextRecommendedPackageLineIndex
      );

      if (laterSectionExists) {
        errors.push("handoff NEXT RECOMMENDED PACKAGE must be the final section when present");
      }
    }
  }

  return {
    type,
    packageName,
    errors,
  };
}

function validateLoopTexts(nextActionText, handoffText) {
  const nextAction = validateNextActionText(nextActionText);
  const handoff = validateHandoffText(handoffText);
  const errors = [...nextAction.errors, ...handoff.errors];

  if (nextAction.type && handoff.type && nextAction.type !== handoff.type) {
    errors.push(`TYPE mismatch: next-action=${nextAction.type}, handoff=${handoff.type}`);
  }

  if (nextAction.packageName && handoff.packageName && nextAction.packageName !== handoff.packageName) {
    errors.push(`PACKAGE mismatch: next-action=${nextAction.packageName}, handoff=${handoff.packageName}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    nextAction,
    handoff,
  };
}

module.exports = {
  REQUIRED_HANDOFF_SECTIONS,
  validateHandoffText,
  validateLoopTexts,
  validateNextActionText,
};