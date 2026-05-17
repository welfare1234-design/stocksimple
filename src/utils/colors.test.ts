import { describe, it, expect } from 'vitest';
import { getChangeColor, getValuationColor } from './colors';
import { VALUATION_BAND_CONFIG } from './valuation';
import type { ValuationLevelName, StockValuationStatus } from '../types';

describe('getChangeColor', () => {
  it('should return red for positive change', () => {
    expect(getChangeColor(1.5)).toBe('#ff4444');
  });

  it('should return green for negative change', () => {
    expect(getChangeColor(-2.3)).toBe('#00c853');
  });

  it('should return neutral for zero change', () => {
    expect(getChangeColor(0)).toBe('#a0a0a0');
  });

  it('should return red for very small positive value', () => {
    expect(getChangeColor(0.01)).toBe('#ff4444');
  });

  it('should return green for very small negative value', () => {
    expect(getChangeColor(-0.01)).toBe('#00c853');
  });
});

describe('getValuationColor', () => {
  it('should return correct color for each ValuationLevelName', () => {
    const levels: ValuationLevelName[] = [
      'panic', 'crash', 'bargain', 'cheap', 'fair', 'overpriced', 'expensive', 'crazy',
    ];
    for (const level of levels) {
      expect(getValuationColor(level)).toBe(VALUATION_BAND_CONFIG[level].color);
    }
  });

  it('should return correct color for each StockValuationStatus', () => {
    const statuses: StockValuationStatus[] = [
      'bargain', 'cheap', 'fair', 'overpriced', 'expensive', 'crazy',
    ];
    for (const status of statuses) {
      expect(getValuationColor(status)).toBe(VALUATION_BAND_CONFIG[status].color);
    }
  });

  it('should return deep green for panic level', () => {
    expect(getValuationColor('panic')).toBe('#1b5e20');
  });

  it('should return dark red for crazy level', () => {
    expect(getValuationColor('crazy')).toBe('#b71c1c');
  });
});
