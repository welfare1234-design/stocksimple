import type { StockHolding } from '../../types';
import { getChangeColor, getValuationColor } from '../../utils/colors';
import { formatNumber, formatPercent } from '../../utils/formatting';
import { VALUATION_BAND_CONFIG } from '../../utils/valuation';
import styles from './StockCard.module.css';

export interface StockCardProps {
  stock: StockHolding;
  onClick: (stockCode: string) => void;
}

export function StockCard({ stock, onClick }: StockCardProps) {
  const changeColor = getChangeColor(stock.changePercent);
  const valuationColor = getValuationColor(stock.valuationStatus);
  const valuationLabel = VALUATION_BAND_CONFIG[stock.valuationStatus].displayName;

  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label={`${stock.stockName} ${stock.stockCode}`}
      onClick={() => onClick(stock.stockCode)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(stock.stockCode);
        }
      }}
    >
      <div className={styles.header}>
        <span className={styles.stockName}>{stock.stockName}</span>
        <span className={styles.stockCode}>{stock.stockCode}</span>
      </div>

      <span className={styles.price}>{formatNumber(stock.currentPrice)}</span>

      <div className={styles.changeRow}>
        <span style={{ color: changeColor }}>
          {stock.priceChange > 0 ? '+' : ''}{formatNumber(stock.priceChange)}
        </span>
        <span style={{ color: changeColor }}>
          {formatPercent(stock.changePercent)}
        </span>
      </div>

      {stock.eps > 0 && (
        <>
          <span className={styles.eps}>EPS {formatNumber(stock.eps)}</span>
          <span
            className={styles.valuationBadge}
            style={{
          backgroundColor: valuationColor,
          color: stock.valuationStatus === 'fair' ? '#000' : '#fff',
        }}
          >
            {valuationLabel}
          </span>
        </>
      )}
    </article>
  );
}
