import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { ValuationLevel, ValuationLevelName } from '../types';
import {
  calculateTargetPrice,
  calculateDeviationRate,
  determineValuationLevel,
  getEntryRatio,
} from './valuation';

/**
 * 估值等級排序（由低到高）
 */
const LEVEL_ORDER: ValuationLevelName[] = [
  'panic', 'crash', 'bargain', 'cheap',
  'fair', 'overpriced', 'expensive', 'crazy',
];

function levelIndex(name: ValuationLevelName): number {
  return LEVEL_ORDER.indexOf(name);
}

describe('calculateTargetPrice - Property Tests', () => {
  /**
   * Property 3: calculateTargetPrice 計算一致性
   * 對任意正數 EPS 與正數 PE，calculateTargetPrice(eps, pe) 必等於 eps * pe
   *
   * **Validates: Requirements 5.8**
   */
  it('should always equal eps * pe for any positive EPS and PE', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e6, noNaN: true }),
        fc.double({ min: 0.01, max: 1e4, noNaN: true }),
        (eps, pe) => {
          const result = calculateTargetPrice(eps, pe);
          expect(result).toBeCloseTo(eps * pe, 5);
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('calculateDeviationRate - Property Tests', () => {
  /**
   * Property 4: calculateDeviationRate 對稱性
   * deviationRate(a, b) 與 deviationRate(b, a) 符號相反
   *
   * **Validates: Requirements 3.3**
   */
  it('should have opposite signs for deviationRate(a, b) vs deviationRate(b, a) when a !== b', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e6, noNaN: true }),
        fc.double({ min: 0.01, max: 1e6, noNaN: true }),
        (a, b) => {
          fc.pre(a !== b);
          const rateAB = calculateDeviationRate(a, b);
          const rateBA = calculateDeviationRate(b, a);

          if (a > b) {
            expect(rateAB).toBeGreaterThan(0);
            expect(rateBA).toBeLessThan(0);
          } else {
            expect(rateAB).toBeLessThan(0);
            expect(rateBA).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should return 0 for both directions when a === b', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e6, noNaN: true }),
        (a) => {
          expect(calculateDeviationRate(a, a)).toBe(0);
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('determineValuationLevel - Property Tests', () => {
  /**
   * Property 5: determineValuationLevel 單調性
   * 指數越高，估值等級不低於較低指數的等級
   *
   * **Validates: Requirements 3.2, 3.5**
   */
  const sampleBands: ValuationLevel[] = LEVEL_ORDER.map((name, i) => ({
    name,
    displayName: name,
    entryRatio: 100 - i * 10,
    deviationRate: -30 + i * 10,
    indexValue: 10000 + i * 2000,
    color: '#000',
  }));

  it('should return a level >= the level for a lower index (monotonicity)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 5000, max: 30000, noNaN: true }),
        fc.double({ min: 5000, max: 30000, noNaN: true }),
        (indexA, indexB) => {
          const low = Math.min(indexA, indexB);
          const high = Math.max(indexA, indexB);

          const levelLow = determineValuationLevel(low, sampleBands);
          const levelHigh = determineValuationLevel(high, sampleBands);

          expect(levelIndex(levelHigh)).toBeGreaterThanOrEqual(levelIndex(levelLow));
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('getEntryRatio - Property Tests', () => {
  /**
   * Property 6: getEntryRatio 範圍約束
   * 任意估值等級，進場比例介於 10 至 100 之間
   *
   * **Validates: Requirements 3.6**
   */
  it('should return a value between 10 and 100 for any valuation level', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LEVEL_ORDER),
        (level) => {
          const ratio = getEntryRatio(level);
          expect(ratio).toBeGreaterThanOrEqual(10);
          expect(ratio).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 200 }
    );
  });
});
