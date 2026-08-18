import { describe, expect, it } from 'vitest';
import { nationFootballersHref, parseNationId } from '@/lib/nation-param';

describe('parseNationId', () => {
  it('reads a nation id out of the query string', () => {
    expect(parseNationId('5')).toBe(5);
  });

  it('refuses a short code, which the endpoint cannot use', () => {
    // `/data/footballers/` filters `nation` through a django-filter
    // ModelChoiceFilter, so the value has to be a primary key. A code gets
    // "Select a valid choice. That choice is not one of the available choices."
    // rendered at the top of the page, which reads as the page being broken.
    //
    // The name/nationality/short-code form of this filter exists, but on
    // `FootballerSearchView` — a different endpoint from the one this page uses.
    expect(parseNationId('ENG')).toBeNull();
    expect(parseNationId('England')).toBeNull();
  });

  it('ignores a missing or blank parameter', () => {
    expect(parseNationId(null)).toBeNull();
    expect(parseNationId(undefined)).toBeNull();
    expect(parseNationId('   ')).toBeNull();
  });
});

describe('nationFootballersHref', () => {
  it('links by id, because that is what the filter accepts', () => {
    expect(nationFootballersHref(5)).toBe('/footballer-management?nation=5');
  });
});
