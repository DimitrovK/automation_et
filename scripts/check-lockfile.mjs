#!/usr/bin/env node
/**
 * Fails when pnpm-lock.yaml has drifted from package.json.
 *
 * This repo tracks BOTH package-lock.json and pnpm-lock.yaml, and only the pnpm
 * one is authoritative: Vercel installs with `pnpm install --frozen-lockfile`.
 * So a dependency change made with npm updates package.json and
 * package-lock.json, passes every local check, and then fails the deploy at the
 * install step — before the build even starts, with the site still serving the
 * previous version so nothing looks broken.
 *
 * That happened: production stopped deploying and stayed that way, because a
 * clean `npm ci` plus a production build both passed against a lockfile Vercel
 * never reads.
 *
 * The check is the same one pnpm makes ("specifiers in the lockfile don't match
 * specifiers in package.json"), done locally in milliseconds with no network
 * and no pnpm install.
 */
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const lockfile = readFileSync('pnpm-lock.yaml', 'utf8');

/**
 * Pull `name -> specifier` out of the root importer.
 *
 * Hand-parsed rather than pulling in a YAML dependency: this file must be
 * runnable on a pre-commit hook in a repo whose dependencies may be exactly
 * what's in question. The shape is machine-generated and stable.
 */
function parseRootImporter(text) {
  const found = { dependencies: {}, devDependencies: {} };
  const lines = text.split('\n');

  let inImporters = false;
  let inRoot = false;
  let section = null;
  let pendingName = null;

  for (const line of lines) {
    if (/^importers:/.test(line)) { inImporters = true; continue; }
    if (!inImporters) continue;

    // A new top-level key ends the importers block.
    if (/^\S/.test(line) && !/^importers:/.test(line)) break;

    if (/^ {2}[^\s:]+:/.test(line)) {
      inRoot = /^ {2}\.:/.test(line);
      section = null;
      continue;
    }
    if (!inRoot) continue;

    const sectionMatch = /^ {4}(dependencies|devDependencies):/.exec(line);
    if (sectionMatch) { section = sectionMatch[1]; pendingName = null; continue; }
    if (!section) continue;

    const nameMatch = /^ {6}'?([^':]+)'?:\s*$/.exec(line);
    if (nameMatch) { pendingName = nameMatch[1]; continue; }

    const specMatch = /^ {8}specifier:\s*(.+?)\s*$/.exec(line);
    if (specMatch && pendingName) {
      found[section][pendingName] = specMatch[1].replace(/^['"]|['"]$/g, '');
      pendingName = null;
    }
  }
  return found;
}

const locked = parseRootImporter(lockfile);

// A parser that silently finds nothing would pass every check forever.
const lockedCount = Object.keys(locked.dependencies).length + Object.keys(locked.devDependencies).length;
if (lockedCount === 0) {
  console.error('Could not read any dependencies from pnpm-lock.yaml — refusing to pass without checking.');
  process.exit(1);
}

const problems = [];
for (const field of ['dependencies', 'devDependencies']) {
  const declared = packageJson[field] ?? {};
  for (const [name, specifier] of Object.entries(declared)) {
    if (!(name in locked[field])) {
      problems.push(`${name} is in package.json (${field}) but missing from pnpm-lock.yaml`);
    } else if (locked[field][name] !== specifier) {
      problems.push(`${name}: package.json wants ${specifier}, lockfile has ${locked[field][name]}`);
    }
  }
  for (const name of Object.keys(locked[field])) {
    if (!(name in declared)) {
      problems.push(`${name} is in pnpm-lock.yaml (${field}) but no longer in package.json`);
    }
  }
}

if (problems.length > 0) {
  console.error('\npnpm-lock.yaml is out of sync with package.json:\n');
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nVercel installs with `pnpm install --frozen-lockfile` and will fail the deploy.');
  console.error('Fix with:  npx pnpm@10 install --lockfile-only\n');
  process.exit(1);
}

console.log(`Lockfile in sync (${lockedCount} dependencies).`);
