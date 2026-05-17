import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMarketIndices,
  fetchTaiexValuation,
  fetchETFHoldings,
  fetchStockDetail,
} from './dataService';

// Mock Yahoo Finance module
vi.mock('./yahooFinance', () => ({
  fetchQuotes: vi.fn().mockResolvedValue(new Map([
    ['^TWII', { symbol: '^TWII', price: 22000, previousClose: 22100, change: -100, changePercent: -0.45 }],
    ['^DJI', { symbol: '^DJI', price: 42000, previousClose: 41800, change: 200, changePercent: 0.48 }],
    ['^SOX', { symbol: '^SOX', price: 4900, previousClose: 4850, change: 50, changePercent: 1.03 }],
    ['^GSPC', { symbol: '^GSPC', price: 5900, previousClose: 5880, change: 20, changePercent: 0.34 }],
    ['^VIX', { symbol: '^VIX', price: 18, previousClose: 19, change: -1, changePercent: -5.26 }],
    ['EMB', { symbol: 'EMB', price: 85, previousClose: 85.5, change: -0.5, changePercent: -0.58 }],
    ['2330.TW', { symbol: '2330.TW', price: 1080, previousClose: 1065, change: 15, changePercent: 1.41 }],
    ['2317.TW', { symbol: '2317.TW', price: 186, previousClose: 188, change: -2, changePercent: -1.06 }],
    ['2454.TW', { symbol: '2454.TW', price: 1285, previousClose: 1255, change: 30, changePercent: 2.39 }],
    ['2308.TW', { symbol: '2308.TW', price: 395, previousClose: 400, change: -5, changePercent: -1.25 }],
    ['2881.TW', { symbol: '2881.TW', price: 85.5, previousClose: 85, change: 0.5, changePercent: 0.59 }],
    ['3711.TW', { symbol: '3711.TW', price: 152, previousClose: 149, change: 3, changePercent: 2.01 }],
    ['2382.TW', { symbol: '2382.TW', price: 298, previousClose: 302, change: -4, changePercent: -1.32 }],
    ['2357.TW', { symbol: '2357.TW', price: 520, previousClose: 512, change: 8, changePercent: 1.56 }],
  ])),
  fetchFundamentals: vi.fn().mockResolvedValue(new Map([
    ['2330.TW', { symbol: '2330.TW', trailingEps: 66.25, forwardEps: 111.36, forwardPE: 16.25, marketCap: 44978990481408, bookValue: 208.99, priceToBook: 8.66 }],
    ['2317.TW', { symbol: '2317.TW', trailingEps: 10.5, forwardEps: 12.0, forwardPE: 15.5, marketCap: 2580000000000, bookValue: null, priceToBook: null }],
    ['2454.TW', { symbol: '2454.TW', trailingEps: 72.8, forwardEps: 85.0, forwardPE: 15.1, marketCap: 2030000000000, bookValue: null, priceToBook: null }],
    ['2308.TW', { symbol: '2308.TW', trailingEps: 15.3, forwardEps: 18.0, forwardPE: 21.9, marketCap: 1000000000000, bookValue: null, priceToBook: null }],
    ['2881.TW', { symbol: '2881.TW', trailingEps: 8.2, forwardEps: 9.0, forwardPE: 9.5, marketCap: 800000000000, bookValue: null, priceToBook: null }],
  ])),
  fetchETFTopHoldings: vi.fn().mockImplementation((etfSymbol: string) => {
    const holdings: Record<string, Array<{ symbol: string; holdingName: string; holdingPercent: number }>> = {
      '0050.TW': [
        { symbol: '2330.TW', holdingName: 'Taiwan Semiconductor', holdingPercent: 0.617 },
        { symbol: '2317.TW', holdingName: 'Hon Hai Precision', holdingPercent: 0.046 },
        { symbol: '2454.TW', holdingName: 'MediaTek Inc', holdingPercent: 0.034 },
        { symbol: '2308.TW', holdingName: 'Delta Electronics', holdingPercent: 0.030 },
        { symbol: '2881.TW', holdingName: 'Fubon Financial', holdingPercent: 0.013 },
      ],
      '0051.TW': [
        { symbol: '3711.TW', holdingName: 'ASE Technology', holdingPercent: 0.036 },
        { symbol: '2382.TW', holdingName: 'Quanta Computer', holdingPercent: 0.035 },
        { symbol: '2357.TW', holdingName: 'Asustek Computer', holdingPercent: 0.030 },
      ],
    };
    const result = holdings[etfSymbol];
    if (!result) return Promise.resolve([]);
    return Promise.resolve(result);
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DataService', () => {
  describe('fetchMarketIndices', () => {
    it('returns 6 market indices', async () => {
      const indices = await fetchMarketIndices();
      expect(indices).toHaveLength(6);
    });

    it('includes all required index names', async () => {
      const indices = await fetchMarketIndices();
      const names = indices.map((i) => i.name);
      expect(names).toContain('台股加權指數');
      expect(names).toContain('道瓊工業指數');
      expect(names).toContain('新興債券指數');
      expect(names).toContain('費城半導體指數');
      expect(names).toContain('S&P 500指數');
      expect(names).toContain('VIX恐慌指數');
    });

    it('each index has required fields', async () => {
      const indices = await fetchMarketIndices();
      for (const idx of indices) {
        expect(idx.id).toBeTruthy();
        expect(idx.name).toBeTruthy();
        expect(typeof idx.value).toBe('number');
        expect(typeof idx.change).toBe('number');
        expect(typeof idx.changePercent).toBe('number');
        expect(idx.updatedDate).toBeTruthy();
      }
    });
  });

  describe('fetchTaiexValuation', () => {
    it('returns valuation with 8 bands', async () => {
      const valuation = await fetchTaiexValuation();
      expect(valuation.bands).toHaveLength(8);
    });

    it('includes all 8 valuation level names', async () => {
      const valuation = await fetchTaiexValuation();
      const names = valuation.bands.map((b) => b.name);
      expect(names).toEqual([
        'panic', 'crash', 'bargain', 'cheap',
        'fair', 'overpriced', 'expensive', 'crazy',
      ]);
    });

    it('has valid currentLevel', async () => {
      const valuation = await fetchTaiexValuation();
      const validLevels = valuation.bands.map((b) => b.name);
      expect(validLevels).toContain(valuation.currentLevel);
    });
  });

  describe('fetchETFHoldings', () => {
    it('returns holdings for ETF 0050', async () => {
      const holdings = await fetchETFHoldings('0050');
      expect(holdings.length).toBeGreaterThan(0);
    });

    it('returns holdings for ETF 0051', async () => {
      const holdings = await fetchETFHoldings('0051');
      expect(holdings.length).toBeGreaterThan(0);
    });

    it('each holding has required fields', async () => {
      const holdings = await fetchETFHoldings('0050');
      for (const h of holdings) {
        expect(h.stockCode).toBeTruthy();
        expect(h.stockName).toBeTruthy();
        expect(typeof h.currentPrice).toBe('number');
        expect(typeof h.eps).toBe('number');
        expect(h.valuationStatus).toBeTruthy();
      }
    });

    it('returns empty array for unknown ETF code', async () => {
      const holdings = await fetchETFHoldings('9999');
      expect(holdings).toEqual([]);
    });
  });

  describe('fetchStockDetail', () => {
    it('returns detail for stock 2330', async () => {
      const detail = await fetchStockDetail('2330');
      expect(detail.stockCode).toBe('2330');
      expect(detail.stockName).toBe('台積電');
    });

    it('includes 6 PE ratio levels', async () => {
      const detail = await fetchStockDetail('2330');
      expect(detail.peRatios).toHaveLength(6);
    });

    it('returns detail with stockCode for unknown stock code', async () => {
      const detail = await fetchStockDetail('0000');
      expect(detail.stockCode).toBe('0000');
      expect(detail.stockName).toBe('0000');
    });
  });
});
