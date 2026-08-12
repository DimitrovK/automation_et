#!/usr/bin/env node
/**
 * Typecheck gate for first-party code.
 *
 * `tsc --noEmit` can't be gated directly: the v0-generated components in
 * components/ui/ carry 15 pre-existing errors from library version drift
 * (react-resizable-panels, recharts). Because the whole check was red, nothing
 * ran it on commit — and a type error in reporting code reached production,
 * since vitest doesn't typecheck and Next excludes tests from the build.
 *
 * So this reports every error outside the ignored paths and fails on them.
 * It's path-scoped, not a blanket suppression: fix a file under components/ui
 * and the ignore list shrinks. Ignored-path errors are still counted and
 * printed, so the debt stays visible rather than quietly becoming permanent.
 */
import { spawnSync } from 'node:child_process';

/** Generated/vendored code we don't hand-edit. Keep this list shrinking. */
const IGNORED_PREFIXES = ['components/ui/'];

const result = spawnSync('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

const stdout = result.stdout || '';

const errors = (stdout || '').split('\n').filter(line => / error TS\d+:/.test(line));
const ours = errors.filter(line => !IGNORED_PREFIXES.some(prefix => line.startsWith(prefix)));
const ignored = errors.length - ours.length;

if (ignored > 0) {
  console.warn(`note: ${ignored} pre-existing error(s) in ${IGNORED_PREFIXES.join(', ')} — not gated, still owed.`);
}

// A gate that can't run must fail, not pass quietly. Without this, anything
// that stops tsc producing output (missing binary, OOM, a config error) reads
// as zero errors — which is the exact fail-open shape this gate exists to stop.
if (result.error || (result.status !== 0 && errors.length === 0)) {
  console.error('Could not run tsc, so types are unverified — failing closed.');
  if (result.error) console.error(String(result.error));
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

if (ours.length > 0) {
  console.error(`\n${ours.length} type error(s):\n`);
  for (const line of ours) console.error(`  ${line}`);
  process.exit(1);
}

console.log('Types OK.');
