import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnomalySensitivity, SENSITIVITY_PRESETS } from '@/components/reports/AnomalySensitivity';

describe('anomalySensitivity', () => {
  it('keeps the shipped defaults as the balanced preset', () => {
    // If these drift from the BE constants the "Balanced" label becomes a lie,
    // and the panel silently behaves differently from the documented default.
    expect(SENSITIVITY_PRESETS.default.min_volume).toBe(30);
    expect(SENSITIVITY_PRESETS.default.min_change_pct).toBe(25);
  });

  it('orders the presets from noisiest to quietest', () => {
    // A preset that is stricter on one knob and looser on the other would make
    // "Broad" and "Strict" meaningless as a single axis.
    const { broad, default: balanced, strict } = SENSITIVITY_PRESETS;

    expect(broad.min_volume).toBeLessThan(balanced.min_volume);
    expect(balanced.min_volume).toBeLessThan(strict.min_volume);
    expect(broad.min_change_pct).toBeLessThan(balanced.min_change_pct);
    expect(balanced.min_change_pct).toBeLessThan(strict.min_change_pct);
  });

  it('stays inside the bounds the API accepts', () => {
    // The API 400s outside these; a preset that could not be requested would
    // turn the control into an error panel.
    for (const preset of Object.values(SENSITIVITY_PRESETS)) {
      expect(preset.min_volume).toBeGreaterThanOrEqual(0);
      expect(preset.min_volume).toBeLessThanOrEqual(10_000);
      expect(preset.min_change_pct).toBeGreaterThanOrEqual(1);
      expect(preset.min_change_pct).toBeLessThanOrEqual(500);
    }
  });

  it('says what the current setting means, not just its name', () => {
    render(<AnomalySensitivity value="strict" onChange={() => {}} />);

    expect(screen.getByText(/only big games moving a lot/i)).toBeInTheDocument();
  });

  it('reports the chosen preset', async () => {
    const onChange = vi.fn();
    render(<AnomalySensitivity value="default" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Broad' }));

    expect(onChange).toHaveBeenCalledWith('broad');
  });
});
