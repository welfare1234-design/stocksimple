import { useEffect, useRef, useState, useCallback } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { PollingManager } from './services/pollingManager';
import {
  fetchMarketIndices,
  fetchETFHoldings,
  fetchStockDetail,
} from './services/dataService';
import { NavigationBar } from './components/NavigationBar/NavigationBar';
import { IndexOverview } from './components/IndexOverview/IndexOverview';
import { NewsHighlights } from './components/NewsHighlights/NewsHighlights';
import { MarketSummary } from './components/MarketSummary/MarketSummary';
import { TopMovers } from './components/TopMovers/TopMovers';
import { BigHolders } from './components/BigHolders/BigHolders';
import { ETFHoldingsOverview } from './components/ETFHoldings/ETFHoldingsOverview';
import { ETFOverlap } from './components/ETFOverlap/ETFOverlap';
import { ValuationModal } from './components/ValuationModal/ValuationModal';
import { InstitutionalBuyers } from './components/InstitutionalBuyers/InstitutionalBuyers';
import type { StockDetail } from './types';
import styles from './App.module.css';

const AVAILABLE_ETFS = ['0050', '0051', '0052', '0056', '00878', '00919'];
const POLLING_INTERVAL_MS = 60000;

function DashboardApp() {
  const { state, dispatch } = useDashboard();
  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null);
  const pollingManagerRef = useRef<PollingManager | null>(null);
  const selectedETFRef = useRef(state.selectedETF);

  // Keep ref in sync so the polling callback always uses the latest selectedETF
  useEffect(() => {
    selectedETFRef.current = state.selectedETF;
  }, [state.selectedETF]);

  // Fetch holdings when selected ETF changes
  useEffect(() => {
    let cancelled = false;
    async function loadHoldings() {
      try {
        const holdings = await fetchETFHoldings(state.selectedETF);
        if (!cancelled) {
          dispatch({
            type: 'SET_ETF_HOLDINGS',
            payload: { etfCode: state.selectedETF, holdings },
          });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'SET_ERROR',
            payload: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    // Only fetch if we don't already have data for this ETF
    if (!state.etfHoldings.has(state.selectedETF)) {
      loadHoldings();
    }

    return () => { cancelled = true; };
  }, [state.selectedETF, state.etfHoldings, dispatch]);

  useEffect(() => {
    const pm = new PollingManager();
    pollingManagerRef.current = pm;

    pm.onUpdate(async () => {
      const etf = selectedETFRef.current;

      // Fetch indices independently — don't let holdings failure block indices
      try {
        const indices = await fetchMarketIndices();
        dispatch({ type: 'SET_MARKET_INDICES', payload: indices });
      } catch { /* ignore */ }

      try {
        const holdings = await fetchETFHoldings(etf);
        dispatch({
          type: 'SET_ETF_HOLDINGS',
          payload: { etfCode: etf, holdings },
        });
      } catch { /* ignore — will retry on next poll */ }

      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
    });

    pm.onError((error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    });

    pm.start(POLLING_INTERVAL_MS);

    return () => {
      pm.stop();
    };
  }, [dispatch]);

  const handleStockClick = useCallback(
    async (stockCode: string) => {
      try {
        const detail = await fetchStockDetail(stockCode);
        setSelectedStock(detail);
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [dispatch],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedStock(null);
  }, []);

  const handleETFChange = useCallback(
    (etfCode: string) => {
      dispatch({ type: 'SET_SELECTED_ETF', payload: etfCode });
    },
    [dispatch],
  );

  const currentHoldings = state.etfHoldings.get(state.selectedETF) ?? [];
  const etfLoading = currentHoldings.length === 0 && !state.error;
  const [currentPage, setCurrentPage] = useState('daily');

  return (
    <div className={styles.dashboard}>
      <NavigationBar currentPage={currentPage} onNavigate={setCurrentPage} />

      {state.lastUpdatedTime && (
        <div className={styles.updateTime}>
          更新 {state.lastUpdatedTime.toLocaleTimeString('zh-TW')}
        </div>
      )}

      <main className={styles.main}>
        {currentPage === 'daily' && (
          <>
            <IndexOverview indices={state.marketIndices} />

            <MarketSummary />

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>漲跌幅 / 成交量排行</h2>
              <p className={styles.sourceText}>資料來源：Yahoo 台股</p>
            </div>
            <TopMovers />

            <NewsHighlights />
          </>
        )}

        {currentPage === 'etf' && (
          <>
            <ETFHoldingsOverview
              availableETFs={AVAILABLE_ETFS}
              selectedETF={state.selectedETF}
              onETFChange={handleETFChange}
              holdings={currentHoldings}
              loading={etfLoading}
              onStockClick={handleStockClick}
            />
            <ETFOverlap />
          </>
        )}

        {currentPage === 'bigholders' && (
          <>
            <BigHolders />
            <InstitutionalBuyers />
          </>
        )}
      </main>

      {selectedStock && (
        <ValuationModal stock={selectedStock} onClose={handleCloseModal} />
      )}

      {state.error && (
        <div className={styles.errorBanner} role="alert">
          {state.error}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
}
