import type { ValuationLevelName, StockValuationStatus } from '../types';
import { VALUATION_BAND_CONFIG } from './valuation';

/** 台股慣例：漲紅、跌綠、平盤中性灰 */
const COLOR_UP = '#ff4444';
const COLOR_DOWN = '#00c853';
const COLOR_NEUTRAL = '#a0a0a0';

/**
 * 根據漲跌百分比返回對應顏色。
 * 正值 → 紅色，負值 → 綠色，零 → 中性色。
 */
export function getChangeColor(changePercent: number): string {
  if (changePercent > 0) return COLOR_UP;
  if (changePercent < 0) return COLOR_DOWN;
  return COLOR_NEUTRAL;
}

/**
 * 根據估值等級返回對應顏色，直接取自 VALUATION_BAND_CONFIG。
 */
export function getValuationColor(level: ValuationLevelName | StockValuationStatus): string {
  return VALUATION_BAND_CONFIG[level].color;
}
