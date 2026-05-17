/**
 * TWSE 三大法人買賣超服務
 *
 * 使用證交所公開 API (T86) 取得每日法人買賣超資料，
 * 計算連續買超天數，篩選出連續買超 N 日以上的個股。
 */

export interface InstitutionalStock {
  stockCode: string;
  stockName: string;
  consecutiveDays: number;
  latestNetBuy: number;
  totalNetBuy: number;
}

export interface ConsecutiveBuyersResult {
  foreign: InstitutionalStock[];
  trust: InstitutionalStock[];
}

interface DailyRecord {
  stockCode: string;
  stockName: string;
  foreignNetBuy: number;
  trustNetBuy: number;
}

function parseNumber(s: string): number {
  return parseInt(s.replace(/,/g, ''), 10) || 0;
}

function parseDailyData(json: Record<string, unknown>): DailyRecord[] {
  const data = (json as { data?: string[][] }).data;
  if (!Array.isArray(data)) return [];

  return data
    .filter((row) => row.length >= 11 && /^\d{4,}$/.test(row[0].trim()))
    .map((row) => ({
      stockCode: row[0].trim(),
      stockName: row[1].trim(),
      foreignNetBuy: parseNumber(row[4]),
      trustNetBuy: parseNumber(row[10]),
    }));
}

function getTradingDates(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();

  while (dates.length < count) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}${mm}${dd}`);
  }

  return dates;
}

async function fetchDailyInstitutional(date: string): Promise<DailyRecord[]> {
  const url = `/api/twse/rwd/zh/fund/T86?date=${date}&selectType=ALL&response=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.startsWith('{')) return [];
    const json = JSON.parse(text);
    if (json.stat !== 'OK') return [];
    return parseDailyData(json);
  } catch {
    return [];
  }
}

function computeConsecutive(
  dailyResults: DailyRecord[][],
  getNetBuy: (r: DailyRecord) => number,
  minDays: number,
): InstitutionalStock[] {
  if (dailyResults.length === 0) return [];

  const stockMap = new Map<string, {
    stockName: string;
    consecutiveDays: number;
    latestNetBuy: number;
    totalNetBuy: number;
  }>();

  // 最新一天初始化
  const latestDay = dailyResults[dailyResults.length - 1];
  for (const rec of latestDay) {
    const netBuy = getNetBuy(rec);
    if (netBuy > 0) {
      stockMap.set(rec.stockCode, {
        stockName: rec.stockName,
        consecutiveDays: 1,
        latestNetBuy: netBuy,
        totalNetBuy: netBuy,
      });
    }
  }

  // 往回推
  for (let i = dailyResults.length - 2; i >= 0; i--) {
    const dayMap = new Map(dailyResults[i].map((r) => [r.stockCode, r]));
    for (const [code, info] of stockMap) {
      const rec = dayMap.get(code);
      const netBuy = rec ? getNetBuy(rec) : 0;
      if (netBuy > 0) {
        info.consecutiveDays += 1;
        info.totalNetBuy += netBuy;
      }
    }
  }

  return Array.from(stockMap.entries())
    .filter(([, info]) => info.consecutiveDays >= minDays)
    .map(([code, info]) => ({
      stockCode: code,
      stockName: info.stockName,
      consecutiveDays: info.consecutiveDays,
      latestNetBuy: info.latestNetBuy,
      totalNetBuy: info.totalNetBuy,
    }))
    .sort((a, b) => b.consecutiveDays - a.consecutiveDays || b.totalNetBuy - a.totalNetBuy);
}

/**
 * 一次取得外資和投信的連續買超清單（共用同一批 TWSE 資料，減少 API 呼叫）
 */
export async function fetchAllConsecutiveBuyers(
  minDays = 5,
  lookbackDays = 10,
): Promise<ConsecutiveBuyersResult> {
  const dates = getTradingDates(lookbackDays);

  // 從最舊到最新依序抓取
  const dailyResults: DailyRecord[][] = [];
  for (const date of dates.reverse()) {
    const records = await fetchDailyInstitutional(date);
    if (records.length > 0) {
      dailyResults.push(records);
    }
  }

  return {
    foreign: computeConsecutive(dailyResults, (r) => r.foreignNetBuy, minDays),
    trust: computeConsecutive(dailyResults, (r) => r.trustNetBuy, minDays),
  };
}
