import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { dashboardReducer, initialState } from './DashboardContext';
import type { DashboardState, DashboardAction } from './DashboardContext';
import type {
  MarketIndex,
  TaiexValuation,
  StockHolding,
  TimePeriod,
  HoldingsFilter,
  ValuationLevelName,
} from '../types';

// --- Arbitrary generators ---

const arbMarketIndex: fc.Arbitrary<MarketIndex> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  value: fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
  change: fc.double({ min: -1e4, max: 1e4, noNaN: true, noDefaultInfinity: true }),
  changePercent: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
  updatedDate: fc.string({ minLength: 1, maxLength: 20 }),
  semanticLabel: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
});

const arbValuationLevelName: fc.Arbitrary<ValuationLevelName> = fc.constantFrom(
  'panic', 'crash', 'bargain', 'cheap', 'fair', 'overpriced', 'expensive', 'crazy',
);

const arbTaiexValuation: fc.Arbitrary<TaiexValuation> = fc.record({
  currentIndex: fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
  yearlyChangePercent: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
  yearlyAverage: fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
  currentLevel: arbValuationLevelName,
  bands: fc.constant([]),
});

const arbStockValuationStatus = fc.constantFrom(
  'bargain' as const, 'cheap' as const, 'fair' as const,
  'overpriced' as const, 'expensive' as const, 'crazy' as const,
);

const arbStockHolding: fc.Arbitrary<StockHolding> = fc.record({
  stockCode: fc.string({ minLength: 1, maxLength: 10 }),
  stockName: fc.string({ minLength: 1, maxLength: 20 }),
  currentPrice: fc.double({ min: 0, max: 1e5, noNaN: true, noDefaultInfinity: true }),
  priceChange: fc.double({ min: -1e4, max: 1e4, noNaN: true, noDefaultInfinity: true }),
  changePercent: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
  eps: fc.double({ min: -100, max: 1e3, noNaN: true, noDefaultInfinity: true }),
  valuationStatus: arbStockValuationStatus,
});

const arbTimePeriod: fc.Arbitrary<TimePeriod> = fc.constantFrom('daily', 'weekly', 'monthly');
const arbHoldingsFilter: fc.Arbitrary<HoldingsFilter> = fc.constantFrom('all', 'hot', 'limit_up', 'limit_down');

const arbDashboardAction: fc.Arbitrary<DashboardAction> = fc.oneof(
  fc.record({ type: fc.constant('SET_MARKET_INDICES' as const), payload: fc.array(arbMarketIndex, { maxLength: 5 }) }),
  fc.record({ type: fc.constant('SET_TAIEX_VALUATION' as const), payload: arbTaiexValuation }),
  fc.record({
    type: fc.constant('SET_ETF_HOLDINGS' as const),
    payload: fc.record({
      etfCode: fc.constantFrom('0050', '0051', '0052', '0053', '0056', '00878', '00919', '00929', '00940'),
      holdings: fc.array(arbStockHolding, { maxLength: 5 }),
    }),
  }),
  fc.record({ type: fc.constant('SET_SELECTED_ETF' as const), payload: fc.string({ minLength: 1, maxLength: 10 }) }),
  fc.record({ type: fc.constant('SET_TIME_PERIOD' as const), payload: arbTimePeriod }),
  fc.record({ type: fc.constant('SET_HOLDINGS_FILTER' as const), payload: arbHoldingsFilter }),
  fc.record({ type: fc.constant('SET_LAST_UPDATED' as const), payload: fc.date() }),
  fc.record({ type: fc.constant('SET_LOADING' as const), payload: fc.boolean() }),
  fc.record({ type: fc.constant('SET_ERROR' as const), payload: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }) }),
);

// Helper: deep clone a DashboardState (handles Map)
function deepCloneState(state: DashboardState): DashboardState {
  return {
    ...state,
    marketIndices: state.marketIndices.map((idx) => ({ ...idx })),
    taiexValuation: state.taiexValuation ? { ...state.taiexValuation, bands: [...state.taiexValuation.bands] } : null,
    etfHoldings: new Map(
      Array.from(state.etfHoldings.entries()).map(([k, v]) => [k, v.map((h) => ({ ...h }))] as const),
    ),
    lastUpdatedTime: state.lastUpdatedTime ? new Date(state.lastUpdatedTime.getTime()) : null,
  };
}

// Helper: serialize state for deep equality comparison (handles Map)
function serializeState(state: DashboardState): string {
  return JSON.stringify({
    ...state,
    etfHoldings: Array.from(state.etfHoldings.entries()),
    lastUpdatedTime: state.lastUpdatedTime?.toISOString() ?? null,
  });
}

describe('dashboardReducer - Property Tests', () => {
  /**
   * Property 8: Reducer 狀態不可變性
   * 任意 action dispatch 後，原始狀態物件不被修改
   *
   * **Validates: Requirements 7.3**
   */
  it('Property 8: original state is never mutated after dispatching any action', () => {
    fc.assert(
      fc.property(arbDashboardAction, (action) => {
        const stateBefore = deepCloneState(initialState);
        const snapshotBefore = serializeState(stateBefore);

        dashboardReducer(stateBefore, action);

        const snapshotAfter = serializeState(stateBefore);
        expect(snapshotAfter).toBe(snapshotBefore);
      }),
      { numRuns: 300 },
    );
  });

  /**
   * Property 9: SET_ERROR 後保留既有資料
   * dispatch SET_ERROR 後，marketIndices、taiexValuation、etfHoldings 維持不變
   *
   * **Validates: Requirements 7.3, 7.4**
   */
  it('Property 9: SET_ERROR preserves marketIndices, taiexValuation, and etfHoldings', () => {
    fc.assert(
      fc.property(
        fc.array(arbMarketIndex, { minLength: 1, maxLength: 5 }),
        arbTaiexValuation,
        fc.array(arbStockHolding, { minLength: 1, maxLength: 5 }),
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
        (indices, valuation, holdings, errorMsg) => {
          const stateWithData: DashboardState = {
            ...initialState,
            marketIndices: indices,
            taiexValuation: valuation,
            etfHoldings: new Map([['0050', holdings]]),
          };

          const result = dashboardReducer(stateWithData, {
            type: 'SET_ERROR',
            payload: errorMsg,
          });

          // The three data fields must be reference-equal (not just deep-equal)
          expect(result.marketIndices).toBe(stateWithData.marketIndices);
          expect(result.taiexValuation).toBe(stateWithData.taiexValuation);
          expect(result.etfHoldings).toBe(stateWithData.etfHoldings);
        },
      ),
      { numRuns: 200 },
    );
  });
});
