// Formatting utility functions

/**
 * 將時間格式化為「更新 上午/下午 HH:MM:SS」
 */
export function formatUpdateTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const timeStr = formatter.format(date);
  return `更新 ${timeStr}`;
}

/**
 * 格式化數值（千分位）
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * 格式化百分比（含正負號，兩位小數）
 */
export function formatPercent(value: number): string {
  if (value === 0) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * 格式化新台幣金額
 */
export function formatCurrency(value: number): string {
  return `NT$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
