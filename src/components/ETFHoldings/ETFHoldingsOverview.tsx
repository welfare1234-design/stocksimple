import type { StockHolding } from '../../types';
import { StockCard } from './StockCard';
import styles from './ETFHoldings.module.css';

export interface ETFHoldingsOverviewProps {
  availableETFs: string[];
  selectedETF: string;
  onETFChange: (etfCode: string) => void;
  holdings: StockHolding[];
  loading?: boolean;
  onStockClick: (stockCode: string) => void;
}

export function ETFHoldingsOverview({
  availableETFs,
  selectedETF,
  onETFChange,
  holdings,
  loading,
  onStockClick,
}: ETFHoldingsOverviewProps) {
  return (
    <section className={styles.container} aria-label="ETF 持股總覽">
      <h2 className={styles.sectionTitle}>ETF 持股總覽</h2>
      <p className={styles.sourceText}>資料來源：Yahoo Finance</p>
      {/* ETF code tab bar */}
      <div className={styles.etfTabs} role="tablist" aria-label="ETF 代碼">
        {availableETFs.map((etf) => (
          <button
            key={etf}
            role="tab"
            aria-selected={selectedETF === etf}
            className={`${styles.etfTab} ${selectedETF === etf ? styles.etfTabActive : ''}`}
            onClick={() => onETFChange(etf)}
          >
            {etf}
          </button>
        ))}
      </div>

      {/* Stock card grid or loading */}
      {loading ? (
        <div className={styles.loading}>載入持股資料中...</div>
      ) : holdings.length === 0 ? (
        <div className={styles.loading}>尚無持股資料</div>
      ) : (
        <div className={styles.grid} role="list">
          {holdings.map((stock) => (
            <div key={stock.stockCode} role="listitem">
              <StockCard stock={stock} onClick={onStockClick} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
