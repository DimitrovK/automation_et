import { describe, expect, it } from 'vitest';
import { parseNationFilter } from '@/lib/nation-param';

describe('parseNationFilter', () => {
  it('reads a nation code out of the query string', () => {
    expect(parseNationFilter('ITA')).toBe('ITA');
  });

  it('ignores a missing or blank parameter', () => {
    // Blank is not a filter: sending `nation=` would look like a filter that is
    // on while narrowing nothing.
    expect(parseNationFilter(null)).toBeNull();
    expect(parseNationFilter(undefined)).toBeNull();
    expect(parseNationFilter('   ')).toBeNull();
  });

  it('trims what a copied link arrives with', () => {
    expect(parseNationFilter(' ESP ')).toBe('ESP');
  });

  it('refuses a value too long to be a nation', () => {
    // The endpoint matches name, nationality or short code with a LIKE, so an
    // unbounded value is an unbounded scan for something that cannot match.
    expect(parseNationFilter('x'.repeat(200))).toBeNull();
  });

  it('keeps a full nation name, since the endpoint accepts one', () => {
    // `?nation=` matches name, nationality or short code — the links send the
    // short code, but a hand-typed name is a legitimate thing to arrive with.
    expect(parseNationFilter('Portugal')).toBe('Portugal');
  });
});
