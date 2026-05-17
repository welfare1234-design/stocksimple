import { describe, it, expect } from 'vitest';
import {
  formatUpdateTime,
  formatNumber,
  formatPercent,
  formatCurrency,
} from './formatting';

describe('formatUpdateTime', () => {
  it('should output format matching "更新 上午/下午 HH:MM:SS"', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45); // 2:30:45 PM
    const result = formatUpdateTime(date);
    expect(result).toMatch(/^更新 (上午|下午)\d{2}:\d{2}:\d{2}$/);
  });

  it('should show 上午 for morning times', () => {
    const date = new Date(2024, 5, 1, 9, 5, 3);
    const result = formatUpdateTime(date);
    expect(result).toContain('上午');
  });

  it('should show 下午 for afternoon times', () => {
    const date = new Date(2024, 5, 1, 15, 30, 0);
    const result = formatUpdateTime(date);
    expect(result).toContain('下午');
  });
});

describe('formatNumber', () => {
  it('should add thousand separators', () => {
    expect(formatNumber(12345)).toBe('12,345');
  });

  it('should handle small numbers without separators', () => {
    expect(formatNumber(999)).toBe('999');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-12345)).toBe('-12,345');
  });

  it('should handle decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });
});

describe('formatPercent', () => {
  it('should format positive values with + sign', () => {
    expect(formatPercent(2.5)).toBe('+2.50%');
  });

  it('should format negative values with - sign', () => {
    expect(formatPercent(-1.3)).toBe('-1.30%');
  });

  it('should format zero without sign', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('should format to two decimal places', () => {
    expect(formatPercent(3)).toBe('+3.00%');
  });
});

describe('formatCurrency', () => {
  it('should format as NT$ with thousand separators and 2 decimals', () => {
    expect(formatCurrency(1234.5)).toBe('NT$ 1,234.50');
  });

  it('should handle whole numbers', () => {
    expect(formatCurrency(1000)).toBe('NT$ 1,000.00');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('NT$ 0.00');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1234567.89)).toBe('NT$ 1,234,567.89');
  });
});
