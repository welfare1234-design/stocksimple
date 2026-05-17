import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import {
  dashboardReducer,
  initialState,
  DashboardProvider,
  useDashboard,
} from './DashboardContext';
import type { DashboardState } from './DashboardContext';
import type { MarketIndex, TaiexValuation, StockHolding } from '../types';

describe('dashboardReducer', () => {
  it('returns initial state for unknown action', () => {
    const result = dashboardReducer(initialState, { type: 'UNKNOWN' } as never);
    expect(result).toBe(initialState);
  });

  it('handles SET_MARKET_INDICES', () => {
    const indices: MarketIndex[] = [
      { id: 'taiex', name: '加權指數', value: 20000, change: 100, changePercent: 0.5, updatedDate: '2024-01-01' },
    ];
    const result = dashboardReducer(initialState, { type: 'SET_MARKET_INDICES', payload: indices });
    expect(result.marketIndices).toEqual(indices);
    expect(result.marketIndices).not.toBe(initialState.marketIndices);
  });

  it('handles SET_TAIEX_VALUATION', () => {
    const valuation: TaiexValuation = {
      currentIndex: 20000,
      yearlyChangePercent: 5.2,
      yearlyAverage: 19000,
      currentLevel: 'fair',
      bands: [],
    };
    const result = dashboardReducer(initialState, { type: 'SET_TAIEX_VALUATION', payload: valuation });
    expect(result.taiexValuation).toEqual(valuation);
  });

  it('handles SET_ETF_HOLDINGS with immutable Map', () => {
    const holdings: StockHolding[] = [
      { stockCode: '2330', stockName: '台積電', currentPrice: 600, priceChange: 10, changePercent: 1.7, eps: 30, valuationStatus: 'fair' },
    ];
    const result = dashboardReducer(initialState, {
      type: 'SET_ETF_HOLDINGS',
      payload: { etfCode: '0050', holdings },
    });
    expect(result.etfHoldings.get('0050')).toEqual(holdings);
    expect(result.etfHoldings).not.toBe(initialState.etfHoldings);
  });

  it('handles SET_ETF_HOLDINGS preserves other ETF entries', () => {
    const holdings0050: StockHolding[] = [
      { stockCode: '2330', stockName: '台積電', currentPrice: 600, priceChange: 10, changePercent: 1.7, eps: 30, valuationStatus: 'fair' },
    ];
    const holdings0051: StockHolding[] = [
      { stockCode: '2317', stockName: '鴻海', currentPrice: 120, priceChange: -2, changePercent: -1.6, eps: 10, valuationStatus: 'cheap' },
    ];
    const stateWith0050: DashboardState = {
      ...initialState,
      etfHoldings: new Map([['0050', holdings0050]]),
    };
    const result = dashboardReducer(stateWith0050, {
      type: 'SET_ETF_HOLDINGS',
      payload: { etfCode: '0051', holdings: holdings0051 },
    });
    expect(result.etfHoldings.get('0050')).toEqual(holdings0050);
    expect(result.etfHoldings.get('0051')).toEqual(holdings0051);
  });

  it('handles SET_SELECTED_ETF', () => {
    const result = dashboardReducer(initialState, { type: 'SET_SELECTED_ETF', payload: '0051' });
    expect(result.selectedETF).toBe('0051');
  });

  it('handles SET_TIME_PERIOD', () => {
    const result = dashboardReducer(initialState, { type: 'SET_TIME_PERIOD', payload: 'weekly' });
    expect(result.timePeriod).toBe('weekly');
  });

  it('handles SET_HOLDINGS_FILTER', () => {
    const result = dashboardReducer(initialState, { type: 'SET_HOLDINGS_FILTER', payload: 'hot' });
    expect(result.holdingsFilter).toBe('hot');
  });

  it('handles SET_LAST_UPDATED', () => {
    const date = new Date('2024-06-15T10:30:00');
    const result = dashboardReducer(initialState, { type: 'SET_LAST_UPDATED', payload: date });
    expect(result.lastUpdatedTime).toBe(date);
  });

  it('handles SET_LOADING', () => {
    const result = dashboardReducer(initialState, { type: 'SET_LOADING', payload: true });
    expect(result.isLoading).toBe(true);
  });

  it('handles SET_ERROR and preserves existing data', () => {
    const indices: MarketIndex[] = [
      { id: 'taiex', name: '加權指數', value: 20000, change: 100, changePercent: 0.5, updatedDate: '2024-01-01' },
    ];
    const valuation: TaiexValuation = {
      currentIndex: 20000,
      yearlyChangePercent: 5.2,
      yearlyAverage: 19000,
      currentLevel: 'fair',
      bands: [],
    };
    const holdings = new Map([['0050', [
      { stockCode: '2330', stockName: '台積電', currentPrice: 600, priceChange: 10, changePercent: 1.7, eps: 30, valuationStatus: 'fair' as const },
    ]]]);

    const stateWithData: DashboardState = {
      ...initialState,
      marketIndices: indices,
      taiexValuation: valuation,
      etfHoldings: holdings,
    };

    const result = dashboardReducer(stateWithData, { type: 'SET_ERROR', payload: '連線失敗' });
    expect(result.error).toBe('連線失敗');
    expect(result.marketIndices).toBe(stateWithData.marketIndices);
    expect(result.taiexValuation).toBe(stateWithData.taiexValuation);
    expect(result.etfHoldings).toBe(stateWithData.etfHoldings);
  });

  it('handles SET_ERROR with null clears error', () => {
    const stateWithError: DashboardState = { ...initialState, error: '連線失敗' };
    const result = dashboardReducer(stateWithError, { type: 'SET_ERROR', payload: null });
    expect(result.error).toBeNull();
  });
});

describe('DashboardProvider and useDashboard', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DashboardProvider>{children}</DashboardProvider>
  );

  it('provides initial state', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });
    expect(result.current.state.selectedETF).toBe('0050');
    expect(result.current.state.timePeriod).toBe('daily');
    expect(result.current.state.holdingsFilter).toBe('all');
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.marketIndices).toEqual([]);
    expect(result.current.state.taiexValuation).toBeNull();
    expect(result.current.state.lastUpdatedTime).toBeNull();
  });

  it('dispatches actions and updates state', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'SET_SELECTED_ETF', payload: '00878' });
    });
    expect(result.current.state.selectedETF).toBe('00878');

    act(() => {
      result.current.dispatch({ type: 'SET_LOADING', payload: true });
    });
    expect(result.current.state.isLoading).toBe(true);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useDashboard());
    }).toThrow('useDashboard must be used within a DashboardProvider');
  });
});
