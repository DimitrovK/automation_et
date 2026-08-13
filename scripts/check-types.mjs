#!/usr/bin/env node
/**
 * Typecheck gate.
 *
 * Nothing else in the pipeline typechecks: eslint doesn't, vitest strips types
 * rather than checking them, and Next excludes test files from the build. A type
 * error in reporting code reached production through that gap.
 *
 * This started with components/ui/ ignored, because 15 errors in unused
 * v0-generated files made the whole check red and therefore ungateable. Those
 * files are gone and the last real error is fixed, so the ignore list is now
 * empty and every file is gated. Keep it that way: an entry here is a file
 * nobody is checking.
 *
 * It also runs a SECOND pass with noUnusedLocals, scoped to the reporting
 * surface. An unused import shipped through this pipeline untouched — tsconfig
 * has no noUnusedLocals and the pre-commit eslint pass neither flagged nor
 * stripped it — and a chart that imports a legend it no longer draws is the
 * mild version of that.
 *
 * Scoped rather than global on purpose. The rest of the app has 40-odd of these
 * today, and several are not dead code at all: an unused `handleDeleteFootballer`
 * is more likely a button that lost its onClick than a symbol worth deleting.
 * Turning the rule on everywhere would invite a sweep that erases the evidence
 * of those bugs. They want reading, not a codemod.
 */
import { spawnSync } from 'node:child_process';

/** Must stay empty. Anything listed here is a file nobody typechecks. */
const IGNORED_PREFIXES = [];

/**
 * Where unused locals are an error today. Everywhere else still owes the
 * cleanup — see the header.
 */
const UNUSED_SCOPE = ['app/reports/', 'components/reports/', 'components/admin/', 'hooks/', 'lib/'];

function tsc(extraArgs = []) {
  return spawnSync('npx', ['tsc', '--noEmit', '--pretty', 'false', ...extraArgs], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

const result = tsc();

const stdout = result.stdout || '';

const errors = (stdout || '').split('\n').filter(line => / error TS\d+:/.test(line));
const ours = errors.filter(line => !IGNORED_PREFIXES.some(prefix => line.startsWith(prefix)));
const ignored = errors.length - ours.length;

if (ignored > 0) {
  console.warn(`note: ${ignored} error(s) in ignored paths (${IGNORED_PREFIXES.join(', ')}) — not gated, still owed.`);
}

// A gate that can't run must fail, not pass quietly. Without this, anything
// that stops tsc producing output (missing binary, OOM, a config error) reads
// as zero errors — which is the exact fail-open shape this gate exists to stop.
if (result.error || (result.status !== 0 && errors.length === 0)) {
  console.error('Could not run tsc, so types are unverified — failing closed.');
  if (result.error) {
    console.error(String(result.error));
  }
  if (result.stderr) {
    console.error(result.stderr);
  }
  process.exit(1);
}

if (ours.length > 0) {
  console.error(`\n${ours.length} type error(s):\n`);
  for (const line of ours) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

// Second pass: unused locals, but only where the rule is switched on. Run after
// the real typecheck so a genuine type error is never buried under this.
const unusedRun = tsc(['--noUnusedLocals']);
const unusedOut = unusedRun.stdout || '';

// Same fail-closed rule as above: a pass that cannot run must say so.
if (unusedRun.error || (unusedRun.status !== 0 && !/ error TS\d+:/.test(unusedOut))) {
  console.error('Could not run the unused-locals pass, so it is unverified — failing closed.');
  process.exit(1);
}

const unused = unusedOut
  .split('\n')
  .filter(line => / error TS(6133|6192|6196):/.test(line))
  .filter(line => UNUSED_SCOPE.some(prefix => line.startsWith(prefix)));

if (unused.length > 0) {
  console.error(`\n${unused.length} unused declaration(s) in the reporting surface:\n`);
  for (const line of unused) {
    console.error(`  ${line}`);
  }
  console.error('\nAn unused import is dead weight; an unused handler is usually a wiring bug.');
  process.exit(1);
}

console.log('Types OK.');
