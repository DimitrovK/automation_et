import { describe, expect, it } from 'vitest';
import { criterionTypeLabel } from '@/lib/criterion-type-label';

describe('criterionTypeLabel', () => {
  it('prettifies plain enum names', () => {
    expect(criterionTypeLabel('PLAYED_FOR_CLUB')).toBe('Played for club');
    expect(criterionTypeLabel('NATIONALITY')).toBe('Nationality');
    expect(criterionTypeLabel('TOURNAMENT_TOP_SCORER')).toBe('Tournament top scorer');
  });

  it('uses explicit spellings where the prettifier would mangle', () => {
    expect(criterionTypeLabel('BALLON_DOR_WINNER')).toBe('Ballon d\'Or winner');
    expect(criterionTypeLabel('CLUB_GOALS_GTE')).toBe('Club goals threshold');
  });

  it('never breaks on a type it has not met', () => {
    expect(criterionTypeLabel('SOME_FUTURE_TYPE')).toBe('Some future type');
  });
});
