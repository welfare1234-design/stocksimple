import type { StockDetail, PERatioLevel } from '../../types';
import { getChangeColor, getValuationColor } from '../../utils/colors';
import { formatNumber, formatPercent, formatCurrency } from '../../utils/formatting';
import { VALUATION_BAND_CONFIG } from '../../utils/valuation';
import styles from './ValuationModal.module.css';

export interface ValuationModalProps {
  stock: StockDetail;
  onClose: () => void;
}

/**
 * Compute the percentage position of the current price within the PE ratio range.
 * Returns a value clamped between 0 and 100.
 */
function computePricePosition(currentPrice: number, peRatios: PERatioLevel[]): number {
  if (peRatios.length === 0) return 50;

  const sorted = [...peRatios].sort((a, b) => a.targetPrice - b.targetPrice);
  const minPrice = sorted[0].targetPrice;
  const maxPrice = sorted[sorted.length - 1].targetPrice;

  if (maxPrice === minPrice) return 50;

  const ratio = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;
  return Math.max(0, Math.min(100, ratio));
}

export function ValuationModal({ stock, onClose }: ValuationModalProps) {
  const changeColor = getChangeColor(stock.changePercent);
  const valuationColor = getValuationColor(stock.valuationStatus);
  const valuationLabel = VALUATION_BAND_CONFIG[stock.valuationStatus].displayName;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const pricePosition = computePricePosition(stock.currentPrice, stock.peRatios);

  const sortedRatios = [...stock.peRatios].sort((a, b) => a.targetPrice - b.targetPrice);

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${stock.stockName} 估值詳情`}
    >
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="關閉"
        >
          ✕
        </button>

        {/* Header: name, code, exchange */}
        <div className={styles.header}>
          <span className={styles.stockName}>{stock.stockName}</span>
          <span className={styles.stockCode}>{stock.stockCode}</span>
          <span className={styles.exchange}>{stock.exchange}</span>
        </div>

        {/* Price section */}
        <div className={styles.priceSection}>
          <div className={styles.currentPrice}>
            {formatCurrency(stock.currentPrice)}
          </div>
          <div className={styles.changeRow}>
            <span style={{ color: changeColor }}>
              {stock.priceChange > 0 ? '+' : ''}
              {formatNumber(stock.priceChange)}
            </span>
            <span style={{ color: changeColor }}>
              {formatPercent(stock.changePercent)}
            </span>
          </div>
        </div>

        {/* Info grid: market cap, EPS, valuation status */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>市值</span>
            <span className={styles.infoValue}>
              {formatNumber(stock.marketCap)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              預估 EPS（{stock.estimatedYear}）
            </span>
            <span className={styles.infoValue}>
              {formatNumber(stock.estimatedEPS)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>估值狀態</span>
            <span
              className={styles.valuationBadge}
              style={{
                backgroundColor: valuationColor,
                color: stock.valuationStatus === 'fair' ? '#000' : '#fff',
              }}
            >
              {valuationLabel}
            </span>
          </div>
        </div>

        {/* PE Ratio table */}
        <div className={styles.sectionTitle}>本益比估值表</div>
        <table className={styles.peTable}>
          <thead>
            <tr>
              <th>等級</th>
              <th>本益比</th>
              <th>目標股價</th>
            </tr>
          </thead>
          <tbody>
            {stock.peRatios.map((level) => (
              <tr key={level.level}>
                <td
                  className={styles.levelCell}
                  style={{ color: getValuationColor(level.level) }}
                >
                  {level.displayName}
                </td>
                <td>{level.peRatio.toFixed(1)}x</td>
                <td>{formatCurrency(level.targetPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Gradient bar */}
        <div className={styles.gradientBarSection}>
          <div className={styles.sectionTitle}>估值區間</div>
          <div className={styles.gradientBar}>
            <div
              className={styles.priceMarker}
              style={{ left: `${pricePosition}%` }}
              aria-label={`目前股價位置 ${formatCurrency(stock.currentPrice)}`}
            >
              <div className={styles.markerArrow} />
              <div className={styles.markerLine} />
            </div>
          </div>
          <div className={styles.gradientLabels}>
            {sortedRatios.length > 0 && (
              <>
                <span>{formatCurrency(sortedRatios[0].targetPrice)}</span>
                <span>{formatCurrency(sortedRatios[sortedRatios.length - 1].targetPrice)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
