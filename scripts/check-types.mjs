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
 */
import { spawnSync } from 'node:child_process';

/** Must stay empty. Anything listed here is a file nobody typechecks. */
const IGNORED_PREFIXES = [];

const result = spawnSync('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

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

console.log('Types OK.');
