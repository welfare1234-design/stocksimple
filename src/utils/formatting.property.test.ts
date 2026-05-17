import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatUpdateTime, formatPercent } from './formatting';

describe('formatUpdateTime - Property Tests', () => {
  /**
   * Property 1: formatUpdateTime 輸出格式一致性
   * 任意有效 Date 輸入，輸出必定符合「更新 上午/下午 HH:MM:SS」格式
   *
   * **Validates: Requirements 1.2**
   */
  it('should always match "更新 上午/下午 HH:MM:SS" format for any valid Date', () => {
    fc.assert(
      fc.property(
        fc.date({ noInvalidDate: true }),
        (date) => {
          const result = formatUpdateTime(date);
          expect(result).toMatch(/^更新 (上午|下午)\d{2}:\d{2}:\d{2}$/);
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('formatPercent - Property Tests', () => {
  /**
   * Property 2: formatPercent 正負號一致性
   * 正數輸入產生正值字串，負數輸入產生負值字串，零輸入產生零值字串
   *
   * **Validates: Requirements 2.2**
   */
  it('should produce a string starting with "+" for positive numbers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e12, noNaN: true }),
        (value) => {
          const result = formatPercent(value);
          expect(result).toMatch(/^\+/);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should produce a string starting with "-" for negative numbers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e12, max: -0.01, noNaN: true }),
        (value) => {
          const result = formatPercent(value);
          expect(result).toMatch(/^-/);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should produce a string starting with "0" for zero', () => {
    const result = formatPercent(0);
    expect(result).toMatch(/^0/);
  });
});
