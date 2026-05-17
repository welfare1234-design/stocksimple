import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  MarketIndex,
  TaiexValuation,
  StockHolding,
  TimePeriod,
  HoldingsFilter,
} from '../types';

export interface DashboardState {
  marketIndices: MarketIndex[];
  taiexValuation: TaiexValuation | null;
  etfHoldings: Map<string, StockHolding[]>;
  selectedETF: string;
  timePeriod: TimePeriod;
  holdingsFilter: HoldingsFilter;
  lastUpdatedTime: Date | null;
  isLoading: boolean;
  error: string | null;
}

export type DashboardAction =
  | { type: 'SET_MARKET_INDICES'; payload: MarketIndex[] }
  | { type: 'SET_TAIEX_VALUATION'; payload: TaiexValuation }
  | { type: 'SET_ETF_HOLDINGS'; payload: { etfCode: string; holdings: StockHolding[] } }
  | { type: 'SET_SELECTED_ETF'; payload: string }
  | { type: 'SET_TIME_PERIOD'; payload: TimePeriod }
  | { type: 'SET_HOLDINGS_FILTER'; payload: HoldingsFilter }
  | { type: 'SET_LAST_UPDATED'; payload: Date }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export const initialState: DashboardState = {
  marketIndices: [],
  taiexValuation: null,
  etfHoldings: new Map(),
  selectedETF: '0050',
  timePeriod: 'daily',
  holdingsFilter: 'all',
  lastUpdatedTime: null,
  isLoading: false,
  error: null,
};

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction,
): DashboardState {
  switch (action.type) {
    case 'SET_MARKET_INDICES':
      return { ...state, marketIndices: action.payload };
    case 'SET_TAIEX_VALUATION':
      return { ...state, taiexValuation: action.payload };
    case 'SET_ETF_HOLDINGS': {
      const newMap = new Map(state.etfHoldings);
      newMap.set(action.payload.etfCode, action.payload.holdings);
      return { ...state, etfHoldings: newMap };
    }
    case 'SET_SELECTED_ETF':
      return { ...state, selectedETF: action.payload };
    case 'SET_TIME_PERIOD':
      return { ...state, timePeriod: action.payload };
    case 'SET_HOLDINGS_FILTER':
      return { ...state, holdingsFilter: action.payload };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdatedTime: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
