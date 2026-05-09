#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

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

const authorityExpectations = [
  {
    path: '.scaffoldai/README.md',
    role: 'operational orientation',
    pattern: /\b(Role|Status):|Operational Overview|Human Authority Model/i,
  },
  {
    path: '.scaffoldai/contracts/system-identity.contract.md',
    role: 'authoritative contract',
    pattern: /\bStatus\b[\s\S]*\bACTIVE\b[\s\S]*\bauthoritative\b/i,
  },
  {
    path: '.scaffoldai/reference/operational-baseline-v0.reference.md',
    role: 'authoritative operational reference',
    pattern: /\bRole:\s*authoritative operational reference\b/i,
  },
  {
    path: '.scaffoldai/process/leak-check.process.md',
    role: 'operational process reference',
    pattern: /\bSUPPORTING PROCESS DOCUMENTATION\b|Role:\s*operational/i,
  },
  {
    path: '.scaffoldai/reference/gatekeeper-recommendation-packets-v0.reference.md',
    role: 'supporting reference',
    pattern: /\bStatus:\s*REFERENCE\b|Role:\s*supporting reference/i,
  },
  {
    path: '.scaffoldai/process/work-log.log.md',
    role: 'historical record',
    pattern: /\bRole:\s*historical record\b|\bwork log\b/i,
  },
];

function relPath(absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join('/');
}

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolutePath(relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function listMarkdownFiles(target) {
  const absoluteTarget = absolutePath(target);
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

function parseMakeTargets() {
  const text = readText('Makefile');
  const targets = new Set();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_.:-]+):(?:\s|$)/);
    if (match) targets.add(match[1]);
  }
  return targets;
}

function parsePackageScripts() {
  const packageJson = JSON.parse(readText('package.json'));
  return new Set(Object.keys(packageJson.scripts || {}));
}

function cleanPathToken(token) {
  return token
    .replace(/^["'(<`]+/, '')
    .replace(/["')>,;:`]+$/, '')
    .replace(/[.,]+$/, '')
    .split('#')[0];
}

function shouldSkipPathToken(token) {
  return token.includes('*') || token.endsWith('/');
}

function isReviewOnlyPathToken(token) {
  return (
    token.startsWith('.scaffoldai/tmp/') ||
    token.startsWith('.scaffoldai/state/') ||
    token.startsWith('.scaffoldai/streams/')
  );
}

function collectFindingsFromDoc(relativePath) {
  const lines = readText(relativePath).split(/\r?\n/);
  const findings = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const match of line.matchAll(/(?:^|[\s([`"'])((?:\.scaffoldai\/)[^\s)`'",;]+)/g)) {
      const raw = match[1];
      const target = cleanPathToken(raw);
      if (!target || shouldSkipPathToken(target)) continue;
      findings.push({
        type: 'path',
        source: relativePath,
        line: lineNumber,
        target,
      });
    }

    for (const match of line.matchAll(/`make\s+([A-Za-z0-9_.:-]+)`/g)) {
      findings.push({
        type: 'make',
        source: relativePath,
        line: lineNumber,
        target: match[1],
      });
    }

    for (const match of line.matchAll(/`npm\s+run\s+([A-Za-z0-9:._-]+)`/g)) {
      findings.push({
        type: 'npm',
        source: relativePath,
        line: lineNumber,
        target: match[1],
      });
    }
  });

  return findings;
}

function printFinding(prefix, finding, message) {
  console.log(`${prefix}: ${finding.source}:${finding.line}: ${message}`);
}

function run() {
  console.log('[scaffoldai-link-audit] Deterministic link and command audit');

  const activeDocs = unique(activeDocRoots.flatMap(listMarkdownFiles))
    .filter((doc) => !isHistoricalDoc(doc));
  const makeTargets = parseMakeTargets();
  const packageScripts = parsePackageScripts();

  const allFindings = activeDocs.flatMap(collectFindingsFromDoc);
  const failures = [];
  const warnings = [];
  let pathChecks = 0;
  let makeChecks = 0;
  let npmChecks = 0;

  for (const finding of allFindings) {
    if (finding.type === 'path') {
      pathChecks += 1;
      if (!exists(finding.target)) {
        const bucket = isReviewOnlyPathToken(finding.target) ? warnings : failures;
        bucket.push({
          ...finding,
          message: `missing .scaffoldai reference ${finding.target}`,
        });
      }
    }

    if (finding.type === 'make') {
      makeChecks += 1;
      if (!makeTargets.has(finding.target)) {
        failures.push({
          ...finding,
          message: `missing Makefile target ${finding.target}`,
        });
      }
    }

    if (finding.type === 'npm') {
      npmChecks += 1;
      if (!packageScripts.has(finding.target)) {
        failures.push({
          ...finding,
          message: `missing package.json script ${finding.target}`,
        });
      }
    }
  }

  for (const expectation of authorityExpectations) {
    if (!exists(expectation.path)) {
      warnings.push({
        source: expectation.path,
        line: 1,
        message: `authority expectation skipped; file is missing (${expectation.role})`,
      });
      continue;
    }

    const text = readText(expectation.path);
    if (!expectation.pattern.test(text)) {
      warnings.push({
        source: expectation.path,
        line: 1,
        message: `authority role is unclear; expected ${expectation.role}`,
      });
    }
  }

  for (const warning of warnings) {
    printFinding('WARN', warning, warning.message);
  }

  for (const failure of failures) {
    printFinding('FAIL', failure, failure.message);
  }

  console.log('');
  console.log(`[scaffoldai-link-audit] active docs scanned: ${activeDocs.length}`);
  console.log(`[scaffoldai-link-audit] .scaffoldai references checked: ${pathChecks}`);
  console.log(`[scaffoldai-link-audit] make commands checked: ${makeChecks}`);
  console.log(`[scaffoldai-link-audit] npm scripts checked: ${npmChecks}`);
  console.log(`[scaffoldai-link-audit] authority expectations checked: ${authorityExpectations.length}`);
  console.log(`[scaffoldai-link-audit] warnings: ${warnings.length}`);
  console.log(`[scaffoldai-link-audit] failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log('[scaffoldai-link-audit] FAIL');
    process.exit(1);
  }

  console.log('[scaffoldai-link-audit] PASS');
}

run();
