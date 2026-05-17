import type { ValuationLevel } from '../../types';
import { determineValuationLevel } from '../../utils/valuation';
import { formatNumber, formatPercent } from '../../utils/formatting';
import styles from './ValuationBand.module.css';

export interface ValuationBandProps {
  currentIndex: number;
  yearlyChange: number;
  yearlyAverage: number;
  bands: ValuationLevel[];
}

export function ValuationBand({
  currentIndex,
  yearlyChange,
  yearlyAverage,
  bands,
}: ValuationBandProps) {
  const sorted = [...bands].sort((a, b) => a.indexValue - b.indexValue);
  const currentLevel = determineValuationLevel(currentIndex, bands);

  return (
    <section className={styles.container} aria-label="台股加權指數估值區間">
      {/* 摘要 */}
      <div className={styles.summary}>
        <span className={styles.summaryTitle}>加權指數</span>
        <span className={styles.summaryValue}>{formatNumber(currentIndex)}</span>
        <span className={styles.summaryItem}>
          年漲幅
          <span className={styles.summaryItemValue}>{formatPercent(yearlyChange)}</span>
        </span>
        <span className={styles.summaryItem}>
          年均值
          <span className={styles.summaryItemValue}>{formatNumber(yearlyAverage)}</span>
        </span>
      </div>

      {/* 估值表格 */}
      <div className={styles.bandTableWrapper}>
        <div className={styles.bandTable} role="table" aria-label="估值等級表">
          {sorted.map((band) => {
            const isActive = band.name === currentLevel;
            return (
              <div
                key={band.name}
                className={styles.bandCell}
                style={{ backgroundColor: band.color }}
                role="cell"
                aria-current={isActive ? 'true' : undefined}
              >
                <span className={styles.entryRatio}>{band.entryRatio}%</span>
                <span className={styles.levelName}>{band.displayName}</span>
                <span className={styles.deviationRate}>
                  {formatPercent(band.deviationRate)}
                </span>
                <span className={styles.indexValue}>
                  {formatNumber(band.indexValue)}
                </span>

                {isActive && (
                  <span className={styles.arrowIndicator} data-testid="current-arrow">
                    <span className={styles.arrow} aria-hidden="true" />
                    <span className={styles.arrowLabel}>目前</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
