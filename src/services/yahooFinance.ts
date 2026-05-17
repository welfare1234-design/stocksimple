/**
 * Yahoo Finance API 服務
 *
 * - v8 chart API (via /api/yahoo proxy): 即時股價
 * - v10 quoteSummary (via /api/yahoo-summary server plugin): EPS、持股等基本面
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YahooQuote {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

export interface YahooFundamentals {
  symbol: string;
  trailingEps: number | null;
  forwardEps: number | null;
  forwardPE: number | null;
  marketCap: number | null;
  bookValue: number | null;
  priceToBook: number | null;
}

export interface YahooETFHolding {
  symbol: string;
  holdingName: string;
  holdingPercent: number;
}

// ---------------------------------------------------------------------------
// 即時報價（v8 chart via /api/yahoo proxy）
// ---------------------------------------------------------------------------

async function fetchQuote(symbol: string): Promise<YahooQuote> {
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo chart API error: ${res.status}`);

  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);

  const meta = result.meta;
  const price = meta.regularMarketPrice ?? 0;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return { symbol, price, previousClose, change, changePercent };
}

export async function fetchQuotes(symbols: string[]): Promise<Map<string, YahooQuote>> {
  const map = new Map<string, YahooQuote>();
  const batchSize = 5;

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(fetchQuote));
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') map.set(batch[j], r.value);
    });
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// quoteSummary（via /api/yahoo-summary server plugin — crumb 在 server 端處理）
// ---------------------------------------------------------------------------

async function fetchSummary(symbol: string, modules: string): Promise<Record<string, unknown>> {
  const url = `/api/yahoo-summary/${encodeURIComponent(symbol)}?modules=${modules}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo summary API error: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// 基本面資料
// ---------------------------------------------------------------------------

async function fetchFundamental(symbol: string): Promise<YahooFundamentals> {
  const json = await fetchSummary(symbol, 'defaultKeyStatistics,financialData');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (json as any)?.quoteSummary?.result?.[0];
  if (!result) throw new Error(`No quoteSummary data for ${symbol}`);

  const ks = result.defaultKeyStatistics ?? {};

  return {
    symbol,
    trailingEps: rawVal(ks.trailingEps),
    forwardEps: rawVal(ks.forwardEps),
    forwardPE: rawVal(ks.forwardPE),
    marketCap: rawVal(ks.enterpriseValue),
    bookValue: rawVal(ks.bookValue),
    priceToBook: rawVal(ks.priceToBook),
  };
}

function rawVal(field: unknown): number | null {
  if (field && typeof field === 'object' && 'raw' in field) {
    const val = (field as { raw: unknown }).raw;
    return typeof val === 'number' ? val : null;
  }
  return null;
}

export async function fetchFundamentals(symbols: string[]): Promise<Map<string, YahooFundamentals>> {
  const map = new Map<string, YahooFundamentals>();
  const results = await Promise.allSettled(symbols.map(fetchFundamental));
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map.set(symbols[i], r.value);
  });
  return map;
}

// ---------------------------------------------------------------------------
// ETF 持股
// ---------------------------------------------------------------------------

export async function fetchETFTopHoldings(etfSymbol: string): Promise<YahooETFHolding[]> {
  const json = await fetchSummary(etfSymbol, 'topHoldings');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const holdings = (json as any)?.quoteSummary?.result?.[0]?.topHoldings?.holdings;
  if (!Array.isArray(holdings)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return holdings.map((h: any) => ({
    symbol: h.symbol ?? '',
    holdingName: h.holdingName ?? '',
    holdingPercent: h.holdingPercent?.raw ?? 0,
  }));
}
