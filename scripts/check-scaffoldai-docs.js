#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const requiredDocs = [
  '.scaffoldai/README.md',
  '.scaffoldai/contracts/system-identity.contract.md',
  '.scaffoldai/contracts/gatekeeper-recommendation-v0.contract.md',
  '.scaffoldai/reference/gatekeeper-recommendation-packets-v0.reference.md',
  '.scaffoldai/reference/gatekeeper-capability-profile-taxonomy-v0.reference.md',
  '.scaffoldai/process/leak-check.process.md',
];

const activeDocRoots = [
  '.scaffoldai/README.md',
  '.scaffoldai/agents',
  '.scaffoldai/contracts',
  '.scaffoldai/examples',
  '.scaffoldai/process',
  '.scaffoldai/reference',
  '.scaffoldai/skills',
  '.scaffoldai/verification',
];

const historicalDocPatterns = [
  /^\.scaffoldai\/process\/work-log\.log\.md$/,
  /^\.scaffoldai\/contracts\/bridge-migration-path\.contract\.md$/,
];

const gatekeeperAndLeakDocs = [
  '.scaffoldai/agents/gatekeeper.agent.md',
  '.scaffoldai/contracts/gatekeeper-recommendation-v0.contract.md',
  '.scaffoldai/reference/gatekeeper-recommendation-packets-v0.reference.md',
  '.scaffoldai/reference/gatekeeper-capability-profile-taxonomy-v0.reference.md',
  '.scaffoldai/process/leak-check.process.md',
];

// Scan scope semantics:
//
// Soft drift check: broad, review-oriented, warning-first. It may inspect active
// ScaffoldAI docs and surface ambiguous wording for human review. It tolerates
// historical records and negative examples instead of treating them as failures.
//
// Hard invariant check: narrow, enforcement-oriented, pass/fail. It belongs in
// src/test/scaffoldai-invariants.test.js and should scan only active
// authoritative files/surfaces, not copied command output, clipboard captures,
// migration records, archives, or quoted invalid examples.

function relPath(absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join('/');
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function listMarkdownFiles(target) {
  const absoluteTarget = path.join(repoRoot, target);
  if (!fs.existsSync(absoluteTarget)) return [];
  const stat = fs.statSync(absoluteTarget);
  if (stat.isFile()) return target.endsWith('.md') ? [target] : [];

  const results = [];
  const stack = [absoluteTarget];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absoluteEntry = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absoluteEntry);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(relPath(absoluteEntry));
      }
    }
  }
  return results.sort();
}

function unique(values) {
  return [...new Set(values)];
}

function isHistoricalDoc(relativePath) {
  return historicalDocPatterns.some((pattern) => pattern.test(relativePath));
}

function lineMatches(relativePath, matcher) {
  if (!exists(relativePath)) return [];
  const lines = readText(relativePath).split(/\r?\n/);
  return lines
    .map((text, index) => ({
      relativePath,
      line: index + 1,
      text,
      context: lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(' '),
    }))
    .filter((match) => matcher(match));
}

function printFinding(prefix, finding) {
  console.log(`${prefix}: ${finding.relativePath}:${finding.line}: ${finding.text.trim()}`);
}

function hasNegativeContext(text) {
  return /\b(not|no|never|without|forbidden|disallowed|blocked|block|blocking|invalid|negative example|rejects?|rejected|fails?|failure|conflicts?|outside|non-goals?|does not|do not|must not|avoid|out of scope|drift|doesn't)\b/i.test(text);
}

function runDocsCheck() {
  console.log('[docs-check] Checking expected ScaffoldAI docs');
  const missing = [];

  for (const doc of requiredDocs) {
    if (exists(doc)) {
      console.log(`PASS: ${doc}`);
    } else {
      missing.push(doc);
      console.log(`ERROR: missing ${doc}`);
    }
  }

  if (missing.length > 0) {
    console.log('');
    console.log(`[docs-check] FAIL: ${missing.length} required file(s) missing`);
    process.exit(1);
  }

  console.log('');
  console.log('[docs-check] PASS');
}

function runDriftCheck() {
  console.log('[drift-check] Scanning active ScaffoldAI docs for known drift risks');

  const activeDocs = unique(activeDocRoots.flatMap(listMarkdownFiles))
    .filter((doc) => !isHistoricalDoc(doc));
  const findings = {
    warnings: [],
    info: [],
  };

  const legacyPathPattern = /\.consync\/(?:state|streams|packets)\b/;
  const processOrchestrationPattern = /\bprocess orchestration\b/i;
  const backgroundPattern = /\b(always-on|background|listener|orchestrator|orchestration|auto-dispatch|autonomous)\b/i;

  const historicalDocs = unique(activeDocRoots.flatMap(listMarkdownFiles))
    .filter(isHistoricalDoc);

  for (const doc of historicalDocs) {
    const historicalMatches = lineMatches(doc, ({ text }) => (
      legacyPathPattern.test(text) ||
      processOrchestrationPattern.test(text) ||
      backgroundPattern.test(text)
    ));

    if (historicalMatches.length > 0) {
      findings.info.push({
        relativePath: doc,
        line: 1,
        text: `${historicalMatches.length} historical reference(s) ignored`,
        reason: 'historical or migration evidence is outside warning scope',
      });
    }
  }

  for (const doc of activeDocs) {
    const legacyMatches = lineMatches(doc, ({ text }) => legacyPathPattern.test(text));
    findings.info.push(
      ...legacyMatches
        .filter(({ context }) => hasNegativeContext(context))
        .map((match) => ({
          ...match,
          reason: 'negative or drift-aware legacy path context',
        })),
    );
    findings.warnings.push(
      ...legacyMatches
        .filter(({ context }) => !hasNegativeContext(context))
        .map((match) => ({
          ...match,
          reason: 'possible active legacy path without nearby negative context',
        })),
    );

    const orchestrationMatches = lineMatches(doc, ({ text }) => processOrchestrationPattern.test(text));
    findings.info.push(
      ...orchestrationMatches
        .filter(({ context }) => hasNegativeContext(context))
        .map((match) => ({
          ...match,
          reason: 'negative process orchestration context',
        })),
    );
    findings.warnings.push(
      ...orchestrationMatches
        .filter(({ context }) => !hasNegativeContext(context))
        .map((match) => ({
          ...match,
          reason: 'possible positive process orchestration wording',
        })),
    );
  }

  for (const doc of gatekeeperAndLeakDocs) {
    const behaviorMatches = lineMatches(doc, ({ text }) => backgroundPattern.test(text));
    findings.info.push(
      ...behaviorMatches
        .filter(({ context }) => hasNegativeContext(context))
        .map((match) => ({
          ...match,
          reason: 'negative forbidden-behavior example or non-goal',
        })),
    );
    findings.warnings.push(
      ...behaviorMatches
        .filter(({ context }) => !hasNegativeContext(context))
        .map((match) => ({
          ...match,
          reason: 'possible forbidden behavior wording in Gatekeeper or Leak Check docs',
        })),
    );
  }

  if (findings.info.length > 0) {
    for (const finding of findings.info) {
      printFinding('INFO', finding);
      console.log(`      reason: ${finding.reason}`);
    }
  }

  if (findings.warnings.length === 0) {
    console.log('PASS: no warning-level drift language found');
  } else {
    for (const finding of findings.warnings) {
      printFinding('WARN', finding);
      console.log(`      reason: ${finding.reason}`);
    }
  }

  console.log('');
  console.log(`[drift-check] scanned ${activeDocs.length} active doc(s)`);
  console.log(`[drift-check] info: ${findings.info.length}`);
  console.log(`[drift-check] warnings: ${findings.warnings.length}`);
  console.log('[drift-check] PASS');
}

const command = process.argv[2];

if (command === 'docs') {
  runDocsCheck();
} else if (command === 'drift') {
  runDriftCheck();
} else {
  console.error('Usage: node scripts/check-scaffoldai-docs.js <docs|drift>');
  process.exit(2);
}
