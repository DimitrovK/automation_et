import { describe, expect, it } from 'vitest';
import { modeLabel } from '@/lib/mode-label';

describe('modeLabel', () => {
  it('matches the labels the backend declares, for every career-path mode', () => {
    // The reason the small-word rule exists. `CareerPath.MODE_CHOICES` spells
    // it "Head to Head"; blind title-casing gives "Head To Head", and then the
    // dashboard and the admin disagree about the name of a mode. Checked as a
    // set so a formatter change cannot quietly re-break one of them.
    expect([
      'SINGLE',
      'LADDER',
      'SUDDEN_DEATH',
      'STOPPAGE_TIME',
      'HEAD_TO_HEAD',
      'RACE',
      'ELIMINATION',
    ].map(modeLabel)).toEqual([
      'Single',
      'Ladder',
      'Sudden Death',
      'Stoppage Time',
      'Head to Head',
      'Race',
      'Elimination',
    ]);
  });

  it('capitalises a small word when it leads', () => {
    expect(modeLabel('TO_THE_END')).toBe('To the End');
  });

  it('names a missing mode rather than rendering blank', () => {
    // Quiz has no mode column, so its rooms arrive as null. A room with no mode
    // is still a room, and an empty label is a row that looks broken.
    expect(modeLabel(null)).toBe('No mode');
    expect(modeLabel(undefined)).toBe('No mode');
    expect(modeLabel('')).toBe('No mode');
  });
});
