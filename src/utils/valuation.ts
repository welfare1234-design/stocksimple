import type { ValuationLevel, ValuationLevelName } from '../types';

/**
 * 八個估值等級的預設配置
 */
export const VALUATION_BAND_CONFIG: Record<
  ValuationLevelName,
  { displayName: string; entryRatio: number; color: string }
> = {
  panic:      { displayName: '恐慌', entryRatio: 100, color: '#1b5e20' },
  crash:      { displayName: '崩跌', entryRatio: 100, color: '#2e7d32' },
  bargain:    { displayName: '特價', entryRatio: 100, color: '#388e3c' },
  cheap:      { displayName: '便宜', entryRatio: 100, color: '#66bb6a' },
  fair:       { displayName: '合理', entryRatio: 70,  color: '#fdd835' },
  overpriced: { displayName: '偏高', entryRatio: 50,  color: '#ff9800' },
  expensive:  { displayName: '昂貴', entryRatio: 30,  color: '#f44336' },
  crazy:      { displayName: '瘋狂', entryRatio: 10,  color: '#b71c1c' },
};

/**
 * 計算目標股價 = EPS × 本益比
 */
export function calculateTargetPrice(eps: number, peRatio: number): number {
  return eps * peRatio;
}

/**
 * 計算乖離率 = ((目前值 - 平均值) / 平均值) × 100
 */
export function calculateDeviationRate(currentValue: number, average: number): number {
  return ((currentValue - average) / average) * 100;
}

/**
 * 判斷目前所處估值等級。
 * bands 依 indexValue 升序排列，找到最高的 band 其 indexValue <= currentIndex。
 * 若 currentIndex 低於所有 bands，回傳最低等級。
 */
export function determineValuationLevel(
  currentIndex: number,
  bands: ValuationLevel[],
): ValuationLevelName {
  const sorted = [...bands].sort((a, b) => a.indexValue - b.indexValue);

  let result: ValuationLevelName = sorted[0].name;

  for (const band of sorted) {
    if (currentIndex >= band.indexValue) {
      result = band.name;
    } else {
      break;
    }
  }

  return result;
}

/**
 * 取得指定估值等級的進場比例
 */
export function getEntryRatio(level: ValuationLevelName): number {
  return VALUATION_BAND_CONFIG[level].entryRatio;
}
