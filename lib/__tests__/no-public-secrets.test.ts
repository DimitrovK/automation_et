import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Next.js inlines every `NEXT_PUBLIC_*` variable into the browser bundle.
 *
 * The Discord bot token lived in `NEXT_PUBLIC_DISCORD_BOT_TOKEN`, read from
 * `lib/config.ts`, which client components import, so the token shipped to every
 * staff browser. Nothing failed: the send went through a server action and worked.
 * Secrets belong in plain server-side names (`DISCORD_BOT_TOKEN`).
 */
const SECRET_SHAPED = /NEXT_PUBLIC_\w*(TOKEN|SECRET|PASSWORD|PRIVATE|API_KEY)\w*/g;

describe('no secret-shaped NEXT_PUBLIC_ variables', () => {
  it('appear anywhere in tracked source', () => {
    const files = execSync('git ls-files -- "*.ts" "*.tsx" "*.js" "*.mjs" "*.md" ".env*"', { encoding: 'utf8' })
      .split('\n')
      .filter(f => f && !f.endsWith('no-public-secrets.test.ts'));
    const hits = files.flatMap(f =>
      [...readFileSync(f, 'utf8').matchAll(SECRET_SHAPED)].map(m => `${f}: ${m[0]}`),
    );

    expect(hits).toEqual([]);
  });
});
