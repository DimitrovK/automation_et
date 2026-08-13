import { describe, expect, it } from 'vitest';
import { playStyle } from '@/lib/play-style';

describe('playStyle', () => {
  it('derives solo from the total rather than counting it', () => {
    // The two must sum to what was played; deriving one is the only way that
    // stays true if the multiplayer count changes.
    const style = playStyle(41, 35);

    expect(style?.mp).toBe(35);
    expect(style?.solo).toBe(6);
    expect(style!.mp + style!.solo).toBe(41);
  });

  it('calls no multiplayer at all Solo, exactly', () => {
    // Not "hardly any": a player with one multiplayer session is a different
    // fact from a player with none, and rounding that away is how a report
    // starts lying quietly.
    expect(playStyle(40, 0)?.label).toBe('Solo');
    expect(playStyle(40, 1)?.label).toBe('Mostly solo');
  });

  it('calls all multiplayer Multiplayer, exactly', () => {
    expect(playStyle(40, 40)?.label).toBe('Multiplayer');
    expect(playStyle(40, 39)?.label).toBe('Mostly multiplayer');
  });

  it('bands the middle rather than reporting a bare percentage', () => {
    expect(playStyle(100, 85)?.label).toBe('Mostly multiplayer');
    expect(playStyle(100, 50)?.label).toBe('Mixed');
    expect(playStyle(100, 20)?.label).toBe('Mostly solo');
  });

  it('puts the band edges on the stated side', () => {
    // 70 and 30 are inclusive on the outer bands, so the boundaries are a
    // decision rather than an accident of which comparison was typed.
    expect(playStyle(100, 70)?.label).toBe('Mostly multiplayer');
    expect(playStyle(100, 69)?.label).toBe('Mixed');
    expect(playStyle(100, 30)?.label).toBe('Mostly solo');
    expect(playStyle(100, 31)?.label).toBe('Mixed');
  });

  it('says nothing when the backend has not sent a count', () => {
    // Absent is not zero: a backend predating the field would otherwise have
    // every player labelled Solo.
    expect(playStyle(40, undefined)).toBeNull();
  });

  it('says nothing about a player who played nothing', () => {
    expect(playStyle(0, 0)).toBeNull();
  });

  it('never reports more multiplayer than was played', () => {
    // Defensive: the two counts come from separate queries, and a split that
    // exceeds its total would render a negative solo count.
    const style = playStyle(10, 12);

    expect(style?.mp).toBe(10);
    expect(style?.solo).toBe(0);
  });
});
