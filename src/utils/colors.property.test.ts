import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getChangeColor } from './colors';

describe('getChangeColor - Property Tests', () => {
  /**
   * Property 7: getChangeColor 台股慣例一致性
   * 正值必返回紅色，負值必返回綠色，零值返回中性色
   *
   * **Validates: Requirements 6.3**
   */
  it('should return red (#ff4444) for any positive number', () => {
    fc.assert(
      fc.property(
        fc.double({ min: Number.MIN_VALUE, max: 1e15, noNaN: true }),
        (value) => {
          expect(getChangeColor(value)).toBe('#ff4444');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should return green (#00c853) for any negative number', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e15, max: -Number.MIN_VALUE, noNaN: true }),
        (value) => {
          expect(getChangeColor(value)).toBe('#00c853');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should return neutral (#a0a0a0) for zero', () => {
    expect(getChangeColor(0)).toBe('#a0a0a0');
  });
});
