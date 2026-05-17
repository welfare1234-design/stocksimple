import type {
  MarketIndex,
  TaiexValuation,
  StockHolding,
  StockDetail,
} from '../types';
import { fetchQuotes, fetchFundamentals, fetchETFTopHoldings } from './yahooFinance';

// ---------------------------------------------------------------------------
// Yahoo Finance symbol 對照表
// ---------------------------------------------------------------------------

/** 市場指數 → Yahoo symbol */
const INDEX_SYMBOL_MAP: Record<string, string> = {
  taiex: '^TWII',
  djia: '^DJI',
  sox: '^SOX',
  sp500: '^GSPC',
  vix: '^VIX',
  emb: 'EMB',
};

/** 市場指數 metadata */
const INDEX_META: Record<string, { name: string }> = {
  taiex:  { name: '台股加權指數' },
  djia:   { name: '道瓊工業指數' },
  emb:    { name: '新興債券指數' },
  sox:    { name: '費城半導體指數' },
  sp500:  { name: 'S&P 500指數' },
  vix:    { name: 'VIX恐慌指數' },
};

// ---------------------------------------------------------------------------
// Mock fallback data（Yahoo 無法提供的指標仍用 mock）
// ---------------------------------------------------------------------------

const MOCK_TAIEX_VALUATION: TaiexValuation = {
  currentIndex: 22386.57,
  yearlyChangePercent: 26.8,
  yearlyAverage: 20500,
  currentLevel: 'overpriced',
  bands: [
    { name: 'panic',      displayName: '恐慌', entryRatio: 100, deviationRate: -30, indexValue: 14350, color: '#1b5e20' },
    { name: 'crash',      displayName: '崩跌', entryRatio: 100, deviationRate: -20, indexValue: 16400, color: '#2e7d32' },
    { name: 'bargain',    displayName: '特價', entryRatio: 100, deviationRate: -12, indexValue: 18040, color: '#388e3c' },
    { name: 'cheap',      displayName: '便宜', entryRatio: 100, deviationRate: -5,  indexValue: 19475, color: '#66bb6a' },
    { name: 'fair',       displayName: '合理', entryRatio: 70,  deviationRate: 0,   indexValue: 20500, color: '#fdd835' },
    { name: 'overpriced', displayName: '偏高', entryRatio: 50,  deviationRate: 8,   indexValue: 22140, color: '#ff9800' },
    { name: 'expensive',  displayName: '昂貴', entryRatio: 30,  deviationRate: 18,  indexValue: 24190, color: '#f44336' },
    { name: 'crazy',      displayName: '瘋狂', entryRatio: 10,  deviationRate: 30,  indexValue: 26650, color: '#b71c1c' },
  ],
};

import { ALL_STOCK_NAMES as STOCK_NAME_MAP } from '../data/stockNames';
export { STOCK_NAME_MAP };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 台股代碼 → Yahoo symbol（上市 .TW） */
function toTWSymbol(code: string): string {
  return `${code}.TW`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 取得全球市場指數資料。
 * 可從 Yahoo Finance 取得的指數會用即時報價，其餘用 mock。
 */
export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  try {
    const yahooIds = Object.keys(INDEX_SYMBOL_MAP);
    const symbols = Object.values(INDEX_SYMBOL_MAP);
    const quotes = await fetchQuotes(symbols);

    const liveIndices: MarketIndex[] = yahooIds.map((id, i) => {
      const symbol = symbols[i];
      const quote = quotes.get(symbol);
      const meta = INDEX_META[id];

      if (quote) {
        return {
          id,
          name: meta?.name ?? id,
          value: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          updatedDate: today(),
        };
      }

      // fallback: 回傳 0 值讓 UI 知道資料缺失
      return {
        id,
        name: meta?.name ?? id,
        value: 0,
        change: 0,
        changePercent: 0,
        updatedDate: today(),
      };
    });

    return liveIndices;
  } catch (error) {
    throw new Error(
      `無法取得市場指數資料: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 取得台股加權指數估值區間資料（含八個估值等級）。
 * 用 Yahoo 即時台股加權指數更新 currentIndex。
 */
export async function fetchTaiexValuation(): Promise<TaiexValuation> {
  try {
    const quotes = await fetchQuotes(['^TWII']);
    const taiex = quotes.get('^TWII');

    if (taiex) {
      return { ...MOCK_TAIEX_VALUATION, currentIndex: taiex.price };
    }
    return MOCK_TAIEX_VALUATION;
  } catch (error) {
    throw new Error(
      `無法取得台股估值資料: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 取得指定 ETF 的持股明細。
 * 持股清單從 Yahoo topHoldings API 動態取得，再並行抓股價與 EPS。
 */
export async function fetchETFHoldings(etfCode: string): Promise<StockHolding[]> {
  try {
    const etfSymbol = toTWSymbol(etfCode);
    const topHoldings = await fetchETFTopHoldings(etfSymbol);

    if (topHoldings.length === 0) {
      return [];
    }

    const symbols = topHoldings.map((h) => h.symbol);

    // 並行抓股價和 EPS
    const [quotes, fundamentals] = await Promise.all([
      fetchQuotes(symbols),
      fetchFundamentals(symbols),
    ]);

    return topHoldings.map((h) => {
      const quote = quotes.get(h.symbol);
      const fund = fundamentals.get(h.symbol);
      const stockCode = h.symbol.replace(/\.TWO?$/, '');
      const stockName = STOCK_NAME_MAP[stockCode] ?? h.holdingName;
      const eps = fund?.forwardEps ?? fund?.trailingEps ?? 0;
      const price = quote?.price ?? 0;
      const valuationStatus = eps > 0 ? determineValuation(price / eps) : ('fair' as const);

      return {
        stockCode,
        stockName,
        currentPrice: price,
        priceChange: quote?.change ?? 0,
        changePercent: quote?.changePercent ?? 0,
        eps,
        valuationStatus,
      };
    });
  } catch (error) {
    throw new Error(
      `無法取得 ETF ${etfCode} 持股資料: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 取得個股詳細估值資料。
 * 股價、EPS、市值全部從 Yahoo Finance 即時取得，本益比估值表動態計算。
 */
export async function fetchStockDetail(stockCode: string): Promise<StockDetail> {
  try {
    const sym = toTWSymbol(stockCode);
    const [quotes, fundamentals] = await Promise.all([
      fetchQuotes([sym]),
      fetchFundamentals([sym]),
    ]);

    const quote = quotes.get(sym);
    const fund = fundamentals.get(sym);

    const eps = fund?.forwardEps ?? fund?.trailingEps ?? null;
    const price = quote?.price ?? 0;
    const currentYear = new Date().getFullYear();

    const peRatios = eps != null ? buildPERatios(eps, price) : [];
    const valuationStatus = eps != null && eps > 0
      ? determineValuation(price / eps)
      : 'fair' as const;

    const stockName = STOCK_NAME_MAP[stockCode] ?? stockCode;

    return {
      stockCode,
      stockName,
      exchange: 'TWSE',
      currentPrice: price,
      priceChange: quote?.change ?? 0,
      changePercent: quote?.changePercent ?? 0,
      marketCap: fund?.marketCap ?? 0,
      estimatedEPS: eps ?? 0,
      estimatedYear: currentYear,
      valuationStatus,
      peRatios,
    };
  } catch (error) {
    throw new Error(
      `無法取得股票 ${stockCode} 詳細資料: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// 估值計算
// ---------------------------------------------------------------------------

import type { StockValuationStatus, PERatioLevel } from '../types';

/** 根據 EPS 動態產生六級本益比估值表 */
function buildPERatios(eps: number, _currentPrice: number): PERatioLevel[] {
  // 通用台股本益比區間
  const levels: { level: StockValuationStatus; displayName: string; pe: number }[] = [
    { level: 'bargain',    displayName: '特價', pe: 10 },
    { level: 'cheap',      displayName: '便宜', pe: 15 },
    { level: 'fair',       displayName: '合理', pe: 20 },
    { level: 'overpriced', displayName: '偏高', pe: 25 },
    { level: 'expensive',  displayName: '昂貴', pe: 30 },
    { level: 'crazy',      displayName: '瘋狂', pe: 35 },
  ];

  return levels.map(({ level, displayName, pe }) => ({
    level,
    displayName,
    peRatio: pe,
    targetPrice: Math.round(eps * pe * 100) / 100,
  }));
}

/** 根據目前本益比判斷估值狀態 */
function determineValuation(currentPE: number): StockValuationStatus {
  if (currentPE <= 10) return 'bargain';
  if (currentPE <= 15) return 'cheap';
  if (currentPE <= 20) return 'fair';
  if (currentPE <= 25) return 'overpriced';
  if (currentPE <= 30) return 'expensive';
  return 'crazy';
}
