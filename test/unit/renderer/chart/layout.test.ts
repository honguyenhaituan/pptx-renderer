import { describe, expect, it } from 'vitest';
import { numToPct } from '../../../../src/renderer/chart/layout';

describe('chart layout helpers', () => {
  it('converts OOXML normalized coordinates to percentages', () => {
    expect(numToPct(0.125)).toBe('12.5%');
    expect(numToPct(1)).toBe('100%');
  });
});
