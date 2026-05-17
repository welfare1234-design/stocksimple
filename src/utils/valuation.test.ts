import { describe, it, expect } from 'vitest';
import type { ValuationLevel } from '../types';
import {
  VALUATION_BAND_CONFIG,
  calculateTargetPrice,
  calculateDeviationRate,
  determineValuationLevel,
  getEntryRatio,
} from './valuation';

describe('VALUATION_BAND_CONFIG', () => {
  it('should define all eight valuation levels', () => {
    const levels = Object.keys(VALUATION_BAND_CONFIG);
    expect(levels).toEqual([
      'panic', 'crash', 'bargain', 'cheap',
      'fair', 'overpriced', 'expensive', 'crazy',
    ]);
  });

  it('should have entryRatio between 10 and 100 for all levels', () => {
    for (const config of Object.values(VALUATION_BAND_CONFIG)) {
      expect(config.entryRatio).toBeGreaterThanOrEqual(10);
      expect(config.entryRatio).toBeLessThanOrEqual(100);
    }
  });
});

describe('calculateTargetPrice', () => {
  it('should return eps * peRatio', () => {
    expect(calculateTargetPrice(5, 15)).toBe(75);
  });

  it('should handle decimal values', () => {
    expect(calculateTargetPrice(3.5, 12.5)).toBeCloseTo(43.75);
  });

  it('should return 0 when eps is 0', () => {
    expect(calculateTargetPrice(0, 20)).toBe(0);
  });
});

describe('calculateDeviationRate', () => {
  it('should return positive rate when current > average', () => {
    expect(calculateDeviationRate(110, 100)).toBeCloseTo(10);
  });

  it('should return negative rate when current < average', () => {
    expect(calculateDeviationRate(90, 100)).toBeCloseTo(-10);
  });

  it('should return 0 when current equals average', () => {
    expect(calculateDeviationRate(100, 100)).toBe(0);
  });
});

describe('determineValuationLevel', () => {
  const bands: ValuationLevel[] = [
    { name: 'panic',      displayName: '恐慌', entryRatio: 100, deviationRate: -30, indexValue: 10000, color: '#1b5e20' },
    { name: 'crash',      displayName: '崩跌', entryRatio: 100, deviationRate: -20, indexValue: 12000, color: '#2e7d32' },
    { name: 'bargain',    displayName: '特價', entryRatio: 100, deviationRate: -15, indexValue: 14000, color: '#388e3c' },
    { name: 'cheap',      displayName: '便宜', entryRatio: 100, deviationRate: -10, indexValue: 16000, color: '#66bb6a' },
    { name: 'fair',       displayName: '合理', entryRatio: 70,  deviationRate: 0,   indexValue: 18000, color: '#fdd835' },
    { name: 'overpriced', displayName: '偏高', entryRatio: 50,  deviationRate: 10,  indexValue: 20000, color: '#ff9800' },
    { name: 'expensive',  displayName: '昂貴', entryRatio: 30,  deviationRate: 20,  indexValue: 22000, color: '#f44336' },
    { name: 'crazy',      displayName: '瘋狂', entryRatio: 10,  deviationRate: 30,  indexValue: 24000, color: '#b71c1c' },
  ];

  it('should return lowest level when index is below all bands', () => {
    expect(determineValuationLevel(5000, bands)).toBe('panic');
  });

  it('should return the matching level when index equals a band value', () => {
    expect(determineValuationLevel(18000, bands)).toBe('fair');
  });

  it('should return the highest band whose indexValue <= currentIndex', () => {
    expect(determineValuationLevel(19000, bands)).toBe('fair');
  });

  it('should return crazy when index exceeds all bands', () => {
    expect(determineValuationLevel(30000, bands)).toBe('crazy');
  });

  it('should handle unsorted bands correctly', () => {
    const shuffled = [...bands].reverse();
    expect(determineValuationLevel(19000, shuffled)).toBe('fair');
  });
});

describe('getEntryRatio', () => {
  it('should return 100 for panic level', () => {
    expect(getEntryRatio('panic')).toBe(100);
  });

  it('should return 70 for fair level', () => {
    expect(getEntryRatio('fair')).toBe(70);
  });

  it('should return 10 for crazy level', () => {
    expect(getEntryRatio('crazy')).toBe(10);
  });
});
