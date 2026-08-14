#!/usr/bin/env node
/**
 * Fails when pnpm-lock.yaml has drifted from package.json.
 *
 * pnpm-lock.yaml is the only lockfile: Vercel installs with
 * `pnpm install --frozen-lockfile`, so that is the one that decides whether a
 * deploy happens.
 *
 * This repo used to track package-lock.json alongside it. A dependency change
 * made with npm updated package.json and package-lock.json, passed every local
 * check, and then failed the deploy at the install step — before the build even
 * started, with the site still serving the previous version so nothing looked
 * broken. Production stopped deploying and stayed that way, because a clean
 * `npm ci` plus a production build both passed against a lockfile Vercel never
 * reads.
 *
 * The second lockfile is gone, so that specific trap cannot recur. This check
 * stays because package.json can still drift from pnpm-lock.yaml on its own —
 * a hand-edited version, or a merge that takes one side of each file.
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
    if (line.startsWith('importers:')) {
      inImporters = true;
      continue;
    }
    if (!inImporters) {
      continue;
    }

    // A new top-level key ends the importers block.
    if (/^\S/.test(line) && !line.startsWith('importers:')) {
      break;
    }

    if (/^ {2}[^\s:]+:/.test(line)) {
      inRoot = /^ {2}\.:/.test(line);
      section = null;
      continue;
    }
    if (!inRoot) {
      continue;
    }

    const sectionMatch = /^ {4}(dependencies|devDependencies):/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1];
      pendingName = null;
      continue;
    }
    if (!section) {
      continue;
    }

    const nameMatch = /^ {6}'?([^':]+)'?:\s*$/.exec(line);
    if (nameMatch) {
      pendingName = nameMatch[1];
      continue;
    }

    // `(.+?)\s*$` lets the lazy group and the trailing \s* trade characters,
    // which is quadratic on a pathological line. `(\S.*\S|\S)` pins both ends
    // to non-space and matches exactly the same specifiers.
    const specMatch = /^ {8}specifier:\s*(\S.*\S|\S)\s*$/.exec(line);
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
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  console.error('\nVercel installs with `pnpm install --frozen-lockfile` and will fail the deploy.');
  console.error('Fix with:  npx pnpm@10 install --lockfile-only\n');
  process.exit(1);
}

console.log(`Lockfile in sync (${lockedCount} dependencies).`);
