import { describe, expect, it } from 'vitest';
import { parsePositiveIntParam } from '@/lib/url-params';

describe('parsePositiveIntParam', () => {
  it('reads a row id out of the query string', () => {
    expect(parsePositiveIntParam('1042')).toBe(1042);
  });

  it('ignores a missing parameter', () => {
    expect(parsePositiveIntParam(null)).toBeNull();
    expect(parsePositiveIntParam(undefined)).toBeNull();
    expect(parsePositiveIntParam('')).toBeNull();
  });

  it('refuses anything that is not a whole positive number', () => {
    // These go into a path or a primary-key filter, so a value that is not an
    // id is a request that can only fail — and the failure arrives as a Django
    // validation message that reads like the page is broken.
    for (const raw of ['abc', '12abc', '0', '-3', '1.5', 'Infinity', 'NaN', 'ENG']) {
      expect(parsePositiveIntParam(raw), raw).toBeNull();
    }
  });

  it('tolerates the whitespace a copied-and-pasted value arrives with', () => {
    expect(parsePositiveIntParam(' 7 ')).toBe(7);
  });
});
