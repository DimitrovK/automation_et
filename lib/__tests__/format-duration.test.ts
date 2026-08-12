import { describe, expect, it } from 'vitest';
import { formatDuration } from '@/lib/format-duration';

describe('formatDuration', () => {
  it('picks a unit that stays readable across five orders of magnitude', () => {
    // Real medians range from Avatar of Football's 12s to Conquest's 24h.
    expect(formatDuration(12)).toBe('12s');
    expect(formatDuration(312)).toBe('5.2m');
    expect(formatDuration(3600 * 4.1)).toBe('4.1h');
    expect(formatDuration(86_400)).toBe('1.0d');
  });

  it('drops the decimal once the number is big enough not to need it', () => {
    expect(formatDuration(60 * 42)).toBe('42m');
  });

  it('renders null as a dash, never 0s', () => {
    // 0s would read as "instant", not "not measured".
    expect(formatDuration(null)).toBe('—');
  });
});
